// Copyright (C) 2019-2025 Provable Inc.
// This file is part of the Provable SDK library.

// The Provable SDK library is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// The Provable SDK library is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with the Provable SDK library. If not, see <https://www.gnu.org/licenses/>.

use super::*;

use crate::{
    Address,
    Authorization,
    ExecutionResponse,
    PrivateKey,
    QueryOption,
    RecordPlaintext,
    SnapshotQuery,
    Transaction,
    calculate_minimum_fee,
    execute_fee,
    execute_program,
    execution_stacks_for_execution,
    latest_block_height,
    latest_stateroot,
    log,
    process_inputs,
    types::native::{
        AuthorizationNative,
        CurrentAleo,
        CurrentNetwork,
        ExecutionNative,
        FeeNative,
        IdentifierNative,
        LocatorNative,
        ProcessNative,
        ProgramNative,
        RecordPlaintextNative,
        TransactionNative,
    },
};
use snarkvm_algorithms::snark::varuna::VarunaVersion;
use snarkvm_console::{
    network::Network,
    program::{Value, ValueType},
};
use snarkvm_ledger_query::QueryTrait;
use snarkvm_synthesizer::prelude::{InclusionVersion, execution_cost, execution_cost_for_authorization};

use crate::types::native::{PrivateKeyNative, ViewKeyNative};
use core::ops::Add;
use js_sys::{Array, Object, Reflect};
use snarkvm_console::network::ConsensusVersion;
use std::str::FromStr;
use wasm_bindgen::JsValue;

#[wasm_bindgen]
impl ProgramManager {
    /// Compute the query requirements for a function execution without making
    /// any network calls. Returns the commitments that need state paths and
    /// whether the function has dynamic record inputs.
    ///
    /// This enables the JS layer to pre-fetch state data via its configured
    /// transport and construct an OfflineQuery, so that the subsequent WASM
    /// execution call never makes its own network requests.
    ///
    /// @param {string} program The source code of the program
    /// @param {string} function_name The name of the function to execute
    /// @param {Array} inputs The inputs to the function
    /// @param {PrivateKey} private_key The private key (used to derive the view key for commitment computation)
    /// @param {RecordPlaintext | undefined} fee_record Optional fee record to include in commitment computation
    /// @returns {Object} An object with { commitments: string[], hasDynamicInputs: boolean }
    #[wasm_bindgen(js_name = "computeQueryRequirements")]
    pub fn compute_query_requirements(
        program: &str,
        function_name: &str,
        inputs: Array,
        private_key: &PrivateKey,
        fee_record: Option<RecordPlaintext>,
    ) -> Result<JsValue, String> {
        let program_native = ProgramNative::from_str(program).map_err(|e| e.to_string())?;
        let function_id = IdentifierNative::from_str(function_name).map_err(|e| e.to_string())?;
        let view_key = ViewKeyNative::try_from(PrivateKeyNative::from(private_key)).map_err(|e| e.to_string())?;

        // Check for dynamic record inputs — can't pre-compute commitments for these.
        let has_dynamic_inputs = SnapshotQuery::has_dynamic_record_inputs(&program_native, &function_id);

        let mut all_commitments: Vec<String> = Vec::new();

        if !has_dynamic_inputs {
            // Compute commitments from the main execution inputs.
            let inputs_vec = inputs.to_vec();
            let commitments =
                SnapshotQuery::collect_commitments_from_inputs(&program_native, &function_id, &view_key, &inputs_vec)
                    .map_err(|e| e.to_string())?;

            all_commitments.extend(commitments.iter().map(|c| c.to_string()));
        }

        // Always compute fee record commitments (credits.aleo is never dynamic).
        if let Some(fee_record) = fee_record {
            let credits_program = ProgramNative::credits().unwrap();
            let fee_function_id = IdentifierNative::from_str("fee_private").map_err(|e| e.to_string())?;
            let fee_input = JsValue::from_str(&fee_record.to_string());
            let fee_commitments =
                SnapshotQuery::collect_commitments_from_inputs(&credits_program, &fee_function_id, &view_key, &[
                    fee_input,
                ])
                .map_err(|e| e.to_string())?;

            all_commitments.extend(fee_commitments.iter().map(|c| c.to_string()));
        }

        // Build the result object.
        let result = Object::new();
        let js_commitments = Array::new();
        for commitment in &all_commitments {
            js_commitments.push(&JsValue::from_str(commitment));
        }
        Reflect::set(&result, &"commitments".into(), &js_commitments.into())
            .map_err(|_| "Failed to set commitments".to_string())?;
        Reflect::set(&result, &"hasDynamicInputs".into(), &has_dynamic_inputs.into())
            .map_err(|_| "Failed to set hasDynamicInputs".to_string())?;

        Ok(result.into())
    }

    /// Execute an arbitrary function locally
    ///
    /// @param {PrivateKey} private_key The private key of the sender
    /// @param {string} program The source code of the program being executed
    /// @param {string} function The name of the function to execute
    /// @param {Array} inputs A javascript array of inputs to the function
    /// @param {boolean} prove_execution If true, the execution will be proven and an execution object
    /// containing the proof and the encrypted inputs and outputs needed to verify the proof offline
    /// will be returned.
    /// @param {boolean} cache Cache the proving and verifying keys in the Execution response.
    /// If this is set to 'true' the keys synthesized will be stored in the Execution Response
    /// and the `ProvingKey` and `VerifyingKey` can be retrieved from the response via the `.getKeys()`
    /// method.
    /// @param {Object | undefined} imports (optional) Provide a list of imports to use for the function execution in the
    /// form of a javascript object where the keys are a string of the program name and the values
    /// are a string representing the program source code \{ "hello.aleo": "hello.aleo source code" \}
    /// @param {ProvingKey | undefined} proving_key (optional) Provide a proving key to use for the function execution
    /// @param {VerifyingKey | undefined} verifying_key (optional) Provide a verifying key to use for the function execution
    #[wasm_bindgen(js_name = executeFunctionOffline)]
    #[allow(clippy::too_many_arguments)]
    pub async fn execute_function_offline(
        private_key: &PrivateKey,
        program: &str,
        function: &str,
        inputs: Array,
        prove_execution: bool,
        cache: bool,
        imports: Option<Object>,
        proving_key: Option<ProvingKey>,
        verifying_key: Option<VerifyingKey>,
        url: Option<String>,
        query: Option<QueryOption>,
        edition: Option<u16>,
        program_imports: Option<ProgramImports>,
    ) -> Result<ExecutionResponse, String> {
        let node_url = url.as_deref().unwrap_or(DEFAULT_URL);
        let inputs = inputs.to_vec();
        let rng = &mut rand::rng();
        let edition = edition.unwrap_or(1);

        let mut resolved = ResolvedProcess::resolve(&program_imports, program, edition, imports)?;
        let program_native = resolved.program().clone();
        let process = resolved.process_mut();

        let (response, mut trace) = execute_program!(
            process,
            process_inputs!(inputs),
            program,
            function,
            private_key,
            proving_key,
            verifying_key,
            rng,
            edition
        );

        let mut execution_response = if prove_execution {
            log("Preparing inclusion proofs for execution");
            if let Some(ref query) = query {
                trace.prepare_async(query).await.map_err(|err| err.to_string())?;
            } else {
                let function_name = IdentifierNative::from_str(function).map_err(|err| err.to_string())?;
                let view_key =
                    ViewKeyNative::try_from(PrivateKeyNative::from(private_key)).map_err(|err| err.to_string())?;
                let query = SnapshotQuery::try_from_inputs(
                    node_url,
                    &program_native,
                    &function_name,
                    &view_key,
                    &inputs.to_vec(),
                )
                .await
                .map_err(|err| err.to_string())?;
                trace.prepare_async(&query).await.map_err(|err| err.to_string())?;
            };

            log("Proving execution");
            let locator = program_native.id().to_string().add("/").add(function);
            let execution =
                trace.prove_execution::<CurrentAleo, _>(&locator, VarunaVersion::V2, rng).map_err(|e| e.to_string())?;
            ExecutionResponse::new(Some(execution), function, response, process, program)?
        } else {
            ExecutionResponse::new(None, function, response, process, program)?
        };

        if cache {
            execution_response.add_proving_key(process, function, program_native.id())?;
        }

        Ok(execution_response)
    }

    /// Execute Aleo function and create an Aleo execution transaction
    ///
    /// @param private_key The private key of the sender
    /// @param program The source code of the program being executed
    /// @param function The name of the function to execute
    /// @param inputs A javascript array of inputs to the function
    /// @param priority_fee_credits The optional priority fee to be paid for the transaction
    /// @param fee_record The record to spend the fee from
    /// @param url The url of the Aleo network node to send the transaction to
    /// @param imports (optional) Provide a list of imports to use for the function execution in the
    /// form of a javascript object where the keys are a string of the program name and the values
    /// are a string representing the program source code \{ "hello.aleo": "hello.aleo source code" \}
    /// @param proving_key (optional) Provide a proving key to use for the function execution
    /// @param verifying_key (optional) Provide a verifying key to use for the function execution
    /// @param fee_proving_key (optional) Provide a proving key to use for the fee execution
    /// @param fee_verifying_key (optional) Provide a verifying key to use for the fee execution
    /// @param offline_query An offline query object to use if building a transaction without an internet connection.
    /// @param edition The edition of the program to execute. Defaults to 1.
    /// @returns {Transaction}
    #[wasm_bindgen(js_name = buildExecutionTransaction)]
    #[allow(clippy::too_many_arguments)]
    pub async fn execute(
        private_key: &PrivateKey,
        program: &str,
        function: &str,
        inputs: Array,
        priority_fee_credits: f64,
        fee_record: Option<RecordPlaintext>,
        url: Option<String>,
        imports: Option<Object>,
        proving_key: Option<ProvingKey>,
        verifying_key: Option<VerifyingKey>,
        fee_proving_key: Option<ProvingKey>,
        fee_verifying_key: Option<VerifyingKey>,
        query: Option<QueryOption>,
        edition: Option<u16>,
        program_imports: Option<ProgramImports>,
    ) -> Result<Transaction, String> {
        let edition = edition.unwrap_or(1);
        let mut owned_process;
        let program_native;
        let mut inner_guard;
        let process: &mut ProcessNative = match program_imports.as_ref() {
            Some(pi) => {
                let (native, guard) = pi.prepare_for_execution(program, edition)?;
                program_native = native;
                inner_guard = guard;
                &mut inner_guard.process
            }
            None => {
                owned_process = ProcessNative::load_web().map_err(|err| err.to_string())?;
                program_native = ProgramNative::from_str(program).map_err(|e| e.to_string())?;
                ProgramManager::resolve_imports(&mut owned_process, imports, Some(&program_native.id().to_string()))?;
                &mut owned_process
            }
        };
        let transaction = Self::execute_inner(
            process,
            private_key,
            program,
            function,
            inputs,
            priority_fee_credits,
            fee_record,
            url,
            proving_key,
            verifying_key,
            fee_proving_key,
            fee_verifying_key,
            query,
            edition,
            program_native,
        )
        .await?;
        Ok(transaction)
    }

    /// Execute an authorization.
    ///
    /// @param authorization The authorization to execute.
    /// @param fee_authorization The fee authorization to execute.
    /// @param program The program authorized to be executed.
    /// @param imports The imports of the program being executed.
    /// @param url The url to get the inclusion proving information from.
    /// @param offline_query Optional offline query object if building a Transaction offline.
    /// @param edition The program edition (defaults to 1).
    #[wasm_bindgen(js_name = executeAuthorization)]
    pub async fn execute_authorization(
        authorization: Authorization,
        fee_authorization: Option<Authorization>,
        program: &str,
        proving_key: Option<ProvingKey>,
        verifying_key: Option<VerifyingKey>,
        fee_proving_key: Option<ProvingKey>,
        fee_verifying_key: Option<VerifyingKey>,
        imports: Option<Object>,
        url: Option<String>,
        query: Option<QueryOption>,
        program_imports: Option<ProgramImports>,
        edition: Option<u16>,
    ) -> Result<Transaction, String> {
        // Default to edition 1: this path calls check_valid_edition (via
        // execute_authorization_inner), which rejects edition 0 for
        // non-constructor programs since ConsensusVersion::V8.
        let edition = edition.unwrap_or(1);
        let mut owned_process;
        let program_native;
        let mut inner_guard;
        let process: &mut ProcessNative = match program_imports.as_ref() {
            Some(pi) => {
                let (native, guard) = pi.prepare_for_execution(program, edition)?;
                program_native = native;
                inner_guard = guard;
                &mut inner_guard.process
            }
            None => {
                owned_process = ProcessNative::load_web().map_err(|err| err.to_string())?;
                program_native = ProgramNative::from_str(program).map_err(|e| e.to_string())?;
                ProgramManager::resolve_imports(&mut owned_process, imports, Some(&program_native.id().to_string()))?;
                &mut owned_process
            }
        };
        let transaction = Self::execute_authorization_inner(
            process,
            authorization,
            fee_authorization,
            proving_key,
            verifying_key,
            fee_proving_key,
            fee_verifying_key,
            url,
            query,
            edition,
            program_native,
        )
        .await?;
        Ok(transaction)
    }

    /// Prove an `Authorization` and verify the resulting execution proof, fully offline.
    ///
    /// This is a self-contained "prove -> verify" check intended for testing: it executes the
    /// authorization to produce a trace, prepares the inclusion proofs using the supplied `query`
    /// (use an {@link OfflineQuery} to stay offline), proves the execution, and then verifies the
    /// resulting proof. Proving keys are synthesized on demand if not already cached. Returns `true`
    /// when the proof verifies (otherwise it returns an error).
    ///
    /// @param {Authorization} authorization The authorization to prove.
    /// @param {string} program The program source code containing the root function.
    /// @param {QueryOption} query The query used to source inclusion state paths (e.g. an OfflineQuery).
    /// @param {number | undefined} edition The edition of the program (defaults to 1).
    /// @param {object | undefined} imports The legacy imports object {"name.aleo":"source"}.
    /// @param {ProgramImports | undefined} program_imports Pre-loaded imports builder.
    /// @returns {boolean} True if the execution proof verifies.
    #[wasm_bindgen(js_name = proveAndVerifyAuthorization)]
    pub async fn prove_and_verify_authorization(
        authorization: Authorization,
        program: &str,
        query: QueryOption,
        edition: Option<u16>,
        imports: Option<Object>,
        program_imports: Option<ProgramImports>,
    ) -> Result<bool, String> {
        let edition = edition.unwrap_or(1);

        let mut resolved = ResolvedProcess::resolve(&program_imports, program, edition, imports)?;
        let program_native = resolved.program().clone();
        let process = resolved.process_mut();

        // Add the top-level program to the process (no-op if it is already present).
        if program_native.id().to_string() != "credits.aleo" && !process.contains_program(program_native.id()) {
            process.lock().add_program_with_edition(&program_native, edition).map_err(|e| e.to_string())?;
        }

        let rng = &mut rand::rng();
        let authorization = AuthorizationNative::from(authorization);

        // Determine the locator of the root function.
        let locator = {
            let request = authorization.peek_next().map_err(|e| e.to_string())?;
            LocatorNative::new(*request.program_id(), *request.function_name()).to_string()
        };

        // Determine the consensus and proof-system versions from the query's block height.
        let latest_height = query.current_block_height_async().await.map_err(|e| e.to_string())?;
        let consensus_version =
            <CurrentNetwork as Network>::CONSENSUS_VERSION(latest_height).map_err(|e| e.to_string())?;
        authorization.check_valid_edition(process, consensus_version).map_err(|e| e.to_string())?;
        authorization.check_valid_records(consensus_version).map_err(|e| e.to_string())?;
        let varuna_version = match (ConsensusVersion::V1..=ConsensusVersion::V3).contains(&consensus_version) {
            true => VarunaVersion::V1,
            false => VarunaVersion::V2,
        };

        // Execute the authorization and prove the resulting trace.
        let (_, mut trace) = process.execute::<CurrentAleo, _>(authorization, rng).map_err(|e| e.to_string())?;
        log("Preparing inclusion proofs for execution");
        trace.prepare_async(&query).await.map_err(|e| e.to_string())?;
        log("Proving execution");
        let execution = trace
            .prove_execution::<CurrentAleo, _>(&locator, varuna_version, &mut rand::rng())
            .map_err(|e| e.to_string())?;

        // Verify the execution proof.
        log("Verifying execution");
        let inclusion_upgrade_height =
            <CurrentNetwork as Network>::INCLUSION_UPGRADE_HEIGHT().map_err(|e| e.to_string())?;
        let inclusion_version =
            if latest_height >= inclusion_upgrade_height { InclusionVersion::V1 } else { InclusionVersion::V0 };
        let execution_stacks = execution_stacks_for_execution(process, &execution)?;
        ProcessNative::verify_execution(
            consensus_version,
            varuna_version,
            inclusion_version,
            &execution,
            &execution_stacks,
        )
        .map_err(|e| e.to_string())?;

        Ok(true)
    }

    /// Generate an execution transaction without a proof.
    /// Intended for use with the Leo devnode tool.
    ///
    /// @param private_key The private key of the sender
    /// @param program The source code of the program being executed
    /// @param function The name of the function to execute
    /// @param inputs A javascript array of inputs to the function
    /// @param priority_fee_credits The optional priority fee to be paid for the transaction
    /// @param fee_record The record to spend the fee from
    /// @param url The url of the Aleo network node to send the transaction to
    /// @param imports (optional) Provide a list of imports to use for the function execution in the
    /// form of a javascript object where the keys are a string of the program name and the values
    /// are a string representing the program source code \{ "hello.aleo": "hello.aleo source code" \}
    /// @param edition The edition of the program to execute. Defaults to 1.
    /// @returns {Transaction}
    #[wasm_bindgen(js_name = buildDevnodeExecutionTransaction)]
    #[allow(clippy::too_many_arguments)]
    pub async fn devnode_execute(
        private_key: &PrivateKey,
        program: &str,
        function: &str,
        inputs: Array,
        priority_fee_credits: f64,
        fee_record: Option<RecordPlaintext>,
        url: Option<String>,
        imports: Option<Object>,
        edition: Option<u16>,
        program_imports: Option<ProgramImports>,
    ) -> Result<Transaction, String> {
        log("Loading the SnarkVM process");
        let node_url = url.as_deref().unwrap_or(LOCAL_URL);
        let edition = edition.unwrap_or(1);

        let mut resolved = ResolvedProcess::resolve(&program_imports, program, edition, imports)?;
        let program_native = resolved.program().clone();
        let process = resolved.process_mut();

        // Initialize the rng.
        let rng = &mut rand::rng();
        let program_id = program_native.id().to_string();
        let inputs = process_inputs!(inputs);

        // Add the program to the process (no-op if ensure_program already added it).
        if program_id != "credits.aleo" && !process.contains_program(program_native.id()) {
            log("Adding program to the process");
            process.lock().add_program_with_edition(&program_native, edition).map_err(|e| e.to_string())?;
        }

        // Generate the authorization.
        let authorization = process
            .authorize::<CurrentAleo, _>(&private_key, &program_id, function, inputs.iter(), rng)
            .map_err(|e| e.to_string())?;

        // Get the state root.
        let state_root = latest_stateroot(node_url).await.map_err(|e| e.to_string())?;

        // Get the consensus version.
        let latest_height = latest_block_height(node_url).await.map_err(|err| err.to_string())?;
        let consensus_version = CurrentNetwork::CONSENSUS_VERSION(latest_height).map_err(|err| err.to_string())?;

        // Execute without proving.
        let execution = ExecutionNative::from(authorization.transitions().values().cloned(), state_root, None)
            .map_err(|e| e.to_string())?;

        // Calculate the cost.
        let (cost, _) = execution_cost(&process, &execution, consensus_version).map_err(|e| e.to_string())?;

        // Generate the fee authorization.
        let id = authorization.to_execution_id().map_err(|e| e.to_string())?;

        // Convert the priority fee to microcredits.
        let priority_fee_microcredits = (priority_fee_credits * 1_000_000.0) as u64;

        let fee_authorization = match fee_record {
            Some(fee_record) => {
                log("Authorizing credits.aleo/fee_private");
                let fee_record_native = RecordPlaintextNative::from_str(&fee_record.to_string())
                    .map_err(|e| format!("Invalid fee record: {}", e))?;
                process
                    .authorize_fee_private::<CurrentAleo, _>(
                        &private_key,
                        fee_record_native,
                        cost,
                        priority_fee_microcredits,
                        id,
                        rng,
                    )
                    .map_err(|e| e.to_string())?
            }
            None => {
                log("Authorizing credits.aleo/fee_public");
                process
                    .authorize_fee_public::<CurrentAleo, _>(&private_key, cost, priority_fee_microcredits, id, rng)
                    .map_err(|e| e.to_string())?
            }
        };

        // Create a fee transition without a proof.
        let fee = FeeNative::from(
            fee_authorization
                .transitions()
                .into_iter()
                .next()
                .ok_or_else(|| "Fee authorization has no transitions".to_string())?
                .1,
            state_root,
            None,
        )
        .map_err(|e| e.to_string())?;

        // Evaluate the process to ensure validity.
        let _response = process.evaluate::<CurrentAleo>(authorization).map_err(|e| e.to_string())?;

        // Create the transaction.
        let transaction = TransactionNative::from_execution(execution, Some(fee)).map_err(|e| e.to_string())?;
        Ok(Transaction::from(transaction))
    }

    /// Estimate Fee for Aleo function execution.
    ///
    /// @param program The source code of the program to estimate the execution fee for.
    /// @param function The name of the function to estimate the execution fee for.
    /// @param imports (optional) Provide a list of imports to use for the fee estimation in the
    /// form of a javascript object where the keys are a string of the program name and the values
    /// are a string representing the program source code \{ "hello.aleo": "hello.aleo source code" \}
    /// @param edition The edition of the program. Defaults to 1.
    /// @returns {u64} Fee in microcredits
    #[wasm_bindgen(js_name = estimateExecutionFee)]
    #[allow(clippy::too_many_arguments)]
    pub fn estimate_execution_fee(
        program: &str,
        function: &str,
        imports: Option<Object>,
        edition: Option<u16>,
        program_imports: Option<ProgramImports>,
    ) -> Result<u64, String> {
        let edition = edition.unwrap_or(1);

        let mut resolved = ResolvedProcess::resolve(&program_imports, program, edition, imports)?;
        let program_native = resolved.program().clone();
        let process = resolved.process_mut();

        let rng = &mut rand::rng();
        // Initialize a burner private key.
        let burner_private_key = PrivateKey::new();
        // Compute the burner address.
        let burner_address = Address::from_private_key(&burner_private_key);

        // Get the function.
        let function_native = program_native
            .get_function(&IdentifierNative::from_str(function).map_err(|e| e.to_string())?)
            .map_err(|e| e.to_string())?;

        // Add the program to the process (no-op if ensure_program already added it).
        let program_id = program_native.id();
        if program_id.to_string() != "credits.aleo" && !process.contains_program(program_id) {
            log("Adding program to the process");
            process.lock().add_program_with_edition(&program_native, edition).map_err(|e| e.to_string())?;
        }

        // Create sample inputs.
        let mut inputs: Vec<Value<CurrentNetwork>> = vec![];
        for input_type in function_native.input_types() {
            match input_type {
                ValueType::ExternalRecord(locator) => {
                    let stack = process.get_stack(locator.program_id()).map_err(|e| e.to_string())?;
                    inputs.push(
                        stack
                            .sample_value(&burner_address, &ValueType::Record(*locator.resource()).into(), rng)
                            .map_err(|e| e.to_string())?,
                    );
                }
                _ => {
                    let stack = process.get_stack(program_native.id()).map_err(|e| e.to_string())?;
                    inputs
                        .push(stack.sample_value(&burner_address, &input_type.into(), rng).map_err(|e| e.to_string())?);
                }
            }
        }

        // Create the authorization.
        let authorization = process
            .authorize::<CurrentAleo, _>(&burner_private_key, program_id, function, inputs.iter(), rng)
            .map_err(|e| e.to_string())?;

        // Get the ConsensusVersion.
        let consensus_version = ConsensusVersion::latest();

        // Get the cost final cost
        let (minimum_cost, _) =
            execution_cost_for_authorization(&process, &authorization, consensus_version).map_err(|e| e.to_string())?;

        Ok(minimum_cost)
    }

    /// Estimate Fee for an Authorization.
    ///
    /// @param authorization Authorization to estimate the fee for.
    /// @param program The program the Authorization is for.
    /// @param imports Provide a list of imports to use for the fee estimation in the
    /// form of a javascript object where the keys are a string of the program name and the values
    /// are a string representing the program source code \{ "hello.aleo": "hello.aleo source code" \}
    /// @param offline_query The offline query object used to insert the global state root and state paths needed to create
    /// a valid inclusion proof offline.
    /// @param edition: Optional edition to estimate the fee for.
    /// @returns {u64} Fee in microcredits
    #[wasm_bindgen(js_name = estimateFeeForAuthorization)]
    #[allow(clippy::too_many_arguments)]
    pub fn estimate_fee_for_authorization(
        authorization: &Authorization,
        program: &str,
        imports: Option<Object>,
        edition: Option<u16>,
        program_imports: Option<ProgramImports>,
    ) -> Result<u64, String> {
        let edition = edition.unwrap_or(1);

        let mut resolved = ResolvedProcess::resolve(&program_imports, program, edition, imports)?;
        let program_native = resolved.program().clone();
        let process = resolved.process_mut();

        // Add the program to the process (no-op if ensure_program already added it).
        let program_id = program_native.id();
        if program_id.to_string() != "credits.aleo" && !process.contains_program(program_id) {
            log(&format!("Adding program {program_id} to the process"));
            process.lock().add_program_with_edition(&program_native, edition).map_err(|e| e.to_string())?;
        }

        // Get the ConsensusVersion.
        let consensus_version = ConsensusVersion::latest();

        // Get the cost final cost
        let (minimum_cost, _) =
            execution_cost_for_authorization(&process, &authorization, consensus_version).map_err(|e| e.to_string())?;

        Ok(minimum_cost)
    }

    /// Estimate the finalize fee component for executing a function. This fee is additional to the
    /// size of the execution of the program in bytes. If the function does not have a finalize
    /// step, then the finalize fee is 0.
    ///
    /// Disclaimer: Fee estimation is experimental and may not represent a correct estimate on any current or future network
    ///
    /// @param program The program containing the function to estimate the finalize fee for
    /// @param function The function to estimate the finalize fee for
    /// @returns {u64} Fee in microcredits
    #[wasm_bindgen(js_name = estimateFinalizeFee)]
    pub fn estimate_finalize_fee(program: &str, function: &str) -> Result<u64, String> {
        log(
            "Disclaimer: Fee estimation is experimental and may not represent a correct estimate on any current or future network",
        );

        let mut process_native = ProcessNative::load_web().map_err(|err| err.to_string())?;
        let process = &mut process_native;

        let program = ProgramNative::from_str(program).map_err(|err| err.to_string())?;
        let function_id = IdentifierNative::from_str(function).map_err(|err| err.to_string())?;

        let stack = process.get_stack(program.id()).map_err(|e| e.to_string())?;

        minimum_cost_in_microcredits_v2(&stack, &function_id).map_err(|e| e.to_string())
    }
}

// Internal (non-wasm_bindgen) implementation details.
impl ProgramManager {
    /// Shared execution logic for `execute`.
    ///
    /// The caller is responsible for setting up the process (loading programs,
    /// resolving imports, inserting keys) before calling this method.
    #[allow(clippy::too_many_arguments)]
    async fn execute_inner(
        process: &mut ProcessNative,
        private_key: &PrivateKey,
        program: &str,
        function: &str,
        inputs: Array,
        priority_fee_credits: f64,
        fee_record: Option<RecordPlaintext>,
        url: Option<String>,
        proving_key: Option<ProvingKey>,
        verifying_key: Option<VerifyingKey>,
        fee_proving_key: Option<ProvingKey>,
        fee_verifying_key: Option<VerifyingKey>,
        query: Option<QueryOption>,
        edition: u16,
        program_native: ProgramNative,
    ) -> Result<Transaction, String> {
        let node_url = url.as_deref().unwrap_or(DEFAULT_URL);
        let program_id = program_native.id().to_string();
        let rng = &mut rand::rng();

        log(&format!("Executing function: {program_id}/{function} on-chain"));
        let (_, mut trace) = execute_program!(
            process,
            process_inputs!(inputs),
            program,
            function,
            private_key,
            proving_key,
            verifying_key,
            rng,
            edition
        );

        log("Preparing inclusion proofs for execution");
        let latest_height = if let Some(ref query) = query {
            trace.prepare_async(query).await.map_err(|err| err.to_string())?;
            query.current_block_height_async().await.map_err(|e| e.to_string())?
        } else {
            let function_name = IdentifierNative::from_str(function).map_err(|err| err.to_string())?;
            let view_key =
                ViewKeyNative::try_from(PrivateKeyNative::from(private_key)).map_err(|err| err.to_string())?;
            let query =
                SnapshotQuery::try_from_inputs(node_url, &program_native, &function_name, &view_key, &inputs.to_vec())
                    .await
                    .map_err(|err| err.to_string())?;
            trace.prepare_async(&query).await.map_err(|err| err.to_string())?;
            query.current_block_height_async().await.map_err(|e| e.to_string())?
        };

        log("Proving execution");
        let locator = program_native.id().to_string().add("/").add(function);
        let execution = trace
            .prove_execution::<CurrentAleo, _>(&locator, VarunaVersion::V2, &mut rand::rng())
            .map_err(|e| e.to_string())?;

        // If the function is anything other than credits.aleo/split or credits.aleo/upgrade, execute a fee.
        let fee = match (program_id.as_str(), function) {
            ("credits.aleo", "split")
            | ("credits.aleo", "upgrade")
            | ("credits.aleo", "fee_private")
            | ("credits.aleo", "fee_public") => None,
            _ => {
                log("Calculating the minimum execution fee");
                let minimum_execution_cost = calculate_minimum_fee!(node_url, process, &execution, query);

                // Check to see if the fee record has enough microcredits to pay for the deployment.
                let priority_fee_microcredits = (priority_fee_credits * 1_000_000.0) as u64;
                Self::validate_fee_record(&fee_record, minimum_execution_cost, priority_fee_microcredits)?;

                // Calculate the execution id.
                let execution_id = execution.to_execution_id().map_err(|e| e.to_string())?;

                log("Executing fee");
                let fee = execute_fee!(
                    process,
                    private_key,
                    fee_record,
                    priority_fee_microcredits,
                    node_url,
                    fee_proving_key,
                    fee_verifying_key,
                    execution_id,
                    rng,
                    minimum_execution_cost,
                    query
                );
                Some(fee)
            }
        };

        // Verify the execution.
        let consensus_version =
            <CurrentNetwork as Network>::CONSENSUS_VERSION(latest_height).map_err(|err| err.to_string())?;
        let inclusion_upgrade_height =
            <CurrentNetwork as Network>::INCLUSION_UPGRADE_HEIGHT().map_err(|err| err.to_string())?;
        let inclusion_version =
            if latest_height >= inclusion_upgrade_height { InclusionVersion::V1 } else { InclusionVersion::V0 };
        let execution_stacks = execution_stacks_for_execution(process, &execution)?;
        ProcessNative::verify_execution(
            consensus_version,
            VarunaVersion::V2,
            inclusion_version,
            &execution,
            &execution_stacks,
        )
        .map_err(|err| err.to_string())?;

        log("Creating execution transaction");
        let transaction = TransactionNative::from_execution(execution, fee).map_err(|err| err.to_string())?;
        Ok(Transaction::from(transaction))
    }

    /// Shared authorization execution logic for `execute_authorization`.
    ///
    /// The caller is responsible for setting up the process (loading programs,
    /// resolving imports, inserting keys) before calling this method.
    #[allow(clippy::too_many_arguments)]
    async fn execute_authorization_inner(
        process: &mut ProcessNative,
        authorization: Authorization,
        fee_authorization: Option<Authorization>,
        proving_key: Option<ProvingKey>,
        verifying_key: Option<VerifyingKey>,
        fee_proving_key: Option<ProvingKey>,
        fee_verifying_key: Option<VerifyingKey>,
        url: Option<String>,
        query: Option<QueryOption>,
        edition: u16,
        program_native: ProgramNative,
    ) -> Result<Transaction, String> {
        let node_url = url.as_deref().unwrap_or(DEFAULT_URL);
        let program_id = program_native.id().to_string();

        // Get the latest height.
        log("Checking the latest block height");
        let latest_height = if let Some(ref query) = query {
            query.current_block_height_async().await.map_err(|e| e.to_string())?
        } else {
            latest_block_height(node_url).await.map_err(|e| e.to_string())?
        };

        // Get the function name.
        log("Checking the function name is valid.");
        let function_name = IdentifierNative::from_str(&authorization.function_name()?).map_err(|e| e.to_string())?;

        // Add the top-level program if not already present.
        if program_id != "credits.aleo" && !process.contains_program(program_native.id()) {
            process.lock().add_program_with_edition(&program_native, edition).map_err(|e| e.to_string())?;
        }

        // Insert the proving key if provided.
        if let Some(proving_key) = proving_key {
            if Self::contains_key(process, program_native.id(), &function_name) {
                log(&format!(
                    "Proving & verifying keys were specified for {program_id} - {function_name:?} but a key already exists in the cache. Using cached keys"
                ));
            } else {
                log(&format!(
                    "Inserting externally provided proving and verifying keys for {program_id} - {function_name:?}"
                ));
                process
                    .insert_proving_key(program_native.id(), &function_name, ProvingKeyNative::from(proving_key))
                    .map_err(|e| e.to_string())?;
                if let Some(verifying_key) = verifying_key {
                    process
                        .insert_verifying_key(
                            program_native.id(),
                            &function_name,
                            VerifyingKeyNative::from(verifying_key),
                        )
                        .map_err(|e| e.to_string())?;
                }
            }
        };

        // Insert the fee proving key if provided.
        if let Some(fee_authorization) = fee_authorization.as_ref() {
            if let Some(fee_proving_key) = fee_proving_key {
                let credits = ProgramIDNative::from_str("credits.aleo").unwrap();

                let function_name = if fee_authorization.is_fee_private() {
                    IdentifierNative::from_str("fee_private").unwrap()
                } else {
                    IdentifierNative::from_str("fee_public").unwrap()
                };

                if Self::contains_key(process, &credits, &function_name) {
                    log(
                        "Fee proving & verifying keys were specified but a key already exists in the cache. Using cached keys",
                    );
                } else {
                    log("Inserting externally provided fee proving and verifying keys");
                    process
                        .insert_proving_key(&credits, &function_name, ProvingKeyNative::from(fee_proving_key))
                        .map_err(|e| e.to_string())?;
                    if let Some(fee_verifying_key) = fee_verifying_key {
                        process
                            .insert_verifying_key(&credits, &function_name, VerifyingKeyNative::from(fee_verifying_key))
                            .map_err(|e| e.to_string())?;
                    }
                }
            };
        }

        let rng = &mut rand::rng();
        let authorization = AuthorizationNative::from(authorization);

        // Construct the locator of the main function.
        let locator = {
            let request = authorization.peek_next().map_err(|e| e.to_string())?;
            LocatorNative::new(*request.program_id(), *request.function_name()).to_string()
        };

        // Determine the consensus version.
        let consensus_version =
            <CurrentNetwork as Network>::CONSENSUS_VERSION(latest_height).map_err(|e| e.to_string())?;
        authorization.check_valid_edition(process, consensus_version).map_err(|e| e.to_string())?;
        authorization.check_valid_records(consensus_version).map_err(|e| e.to_string())?;
        let varuna_version = match (ConsensusVersion::V1..=ConsensusVersion::V3).contains(&consensus_version) {
            true => VarunaVersion::V1,
            false => VarunaVersion::V2,
        };

        let (_, mut trace) = process.execute::<CurrentAleo, _>(authorization, rng).map_err(|e| e.to_string())?;

        log("Preparing inclusion proofs for execution");
        if let Some(ref query) = query {
            trace.prepare_async(query).await.map_err(|e| e.to_string())?;
        } else {
            let q = SnapshotQuery::rest(node_url);
            trace.prepare_async(&q).await.map_err(|err| err.to_string())?;
        };

        log("Proving execution");
        let execution = trace
            .prove_execution::<CurrentAleo, _>(&locator, varuna_version, &mut rand::rng())
            .map_err(|e| e.to_string())?;

        let fee = if let Some(fee_authorization) = fee_authorization {
            let fee_authorization = AuthorizationNative::from(fee_authorization);

            fee_authorization.check_valid_edition(process, consensus_version).map_err(|e| e.to_string())?;
            fee_authorization.check_valid_records(consensus_version).map_err(|e| e.to_string())?;

            let (_, mut fee_trace) =
                process.execute::<CurrentAleo, _>(fee_authorization, rng).map_err(|e| e.to_string())?;

            log("Preparing inclusion proofs for fee execution");
            if let Some(ref query) = query {
                fee_trace.prepare_async(query).await.map_err(|e| e.to_string())?;
            } else {
                let q = SnapshotQuery::rest(node_url);
                fee_trace.prepare_async(&q).await.map_err(|err| err.to_string())?;
            };

            Some(fee_trace.prove_fee::<CurrentAleo, _>(varuna_version, rng).map_err(|e| e.to_string())?)
        } else {
            None
        };

        let transaction = TransactionNative::from_execution(execution, fee).map_err(|e| e.to_string())?;
        Ok(Transaction::from(transaction))
    }
}

#[cfg(test)]
mod tests {
    use wasm_bindgen_test::wasm_bindgen_test;

    use crate::{ProgramManager, types::native::ProgramNative};

    #[wasm_bindgen_test]
    pub async fn test_estimate_execution_fee() {
        for (function, cost) in [("transfer_public", 2725u64), ("transfer_public_to_private", 2304u64)] {
            let program = ProgramNative::credits().unwrap();

            let authorization_estimate =
                ProgramManager::estimate_execution_fee(&program.to_string(), function, None, None, None).unwrap();

            assert_eq!(authorization_estimate, cost);
        }
    }
}
