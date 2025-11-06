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
    OfflineQuery,
    PrivateKey,
    RecordPlaintext,
    SnapshotQuery,
    Transaction,
    calculate_minimum_fee,
    execute_fee,
    execute_program,
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
use js_sys::{Array, Object};
use rand::{SeedableRng, rngs::StdRng};
use snarkvm_console::network::ConsensusVersion;
use std::str::FromStr;

#[wasm_bindgen]
impl ProgramManager {
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
    /// @param {ProvingKey | undefined} proving_key (optional) Provide a verifying key to use for the function execution
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
        offline_query: Option<OfflineQuery>,
        edition: Option<u16>,
    ) -> Result<ExecutionResponse, String> {
        let node_url = url.as_deref().unwrap_or(DEFAULT_URL);
        let inputs = inputs.to_vec();
        let rng = &mut StdRng::from_entropy();

        let mut process_native = ProcessNative::load_web().map_err(|err| err.to_string())?;
        let process = &mut process_native;

        log("Check program imports are valid and add them to the process");
        let program_native = ProgramNative::from_str(program).map_err(|e| e.to_string())?;
        ProgramManager::resolve_imports(process, &program_native, imports)?;
        let edition = edition.unwrap_or(1);

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
            if let Some(offline_query) = offline_query {
                trace.prepare_async(&offline_query).await.map_err(|err| err.to_string())?;
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
    /// If this is set to 'true' the keys synthesized (or passed in as optional parameters via the
    /// `proving_key` and `verifying_key` arguments) will be stored in the ProgramManager's memory
    /// and used for subsequent transactions. If this is set to 'false' the proving and verifying
    /// keys will be deallocated from memory after the transaction is executed.
    /// @param imports (optional) Provide a list of imports to use for the function execution in the
    /// form of a javascript object where the keys are a string of the program name and the values
    /// are a string representing the program source code \{ "hello.aleo": "hello.aleo source code" \}
    /// @param proving_key (optional) Provide a verifying key to use for the function execution
    /// @param verifying_key (optional) Provide a verifying key to use for the function execution
    /// @param fee_proving_key (optional) Provide a proving key to use for the fee execution
    /// @param fee_verifying_key (optional) Provide a verifying key to use for the fee execution
    /// @param offline_query An offline query object to use if building a transaction without an internet connection.
    /// @param edition The edition of the program to execute. Defaults to the latest found on the network, or 1 if the program does not exist on the network.
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
        offline_query: Option<OfflineQuery>,
        edition: Option<u16>,
    ) -> Result<Transaction, String> {
        let mut process_native = ProcessNative::load_web().map_err(|err| err.to_string())?;
        let process = &mut process_native;
        let node_url = url.as_deref().unwrap_or(DEFAULT_URL);

        log("Check program imports are valid and add them to the process");
        let program_native = ProgramNative::from_str(program).map_err(|e| e.to_string())?;
        let program_id = program_native.id().to_string();
        ProgramManager::resolve_imports(process, &program_native, imports)?;
        let rng = &mut StdRng::from_entropy();

        log(&format!("Executing function: {program_id}/{function} on-chain"));
        let edition = edition.unwrap_or(1);
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
        let latest_height = if let Some(offline_query) = offline_query.as_ref() {
            trace.prepare_async(offline_query).await.map_err(|err| err.to_string())?;
            offline_query.current_block_height().map_err(|e| e.to_string())?
        } else {
            let function_name = IdentifierNative::from_str(function).map_err(|err| err.to_string())?;
            let view_key =
                ViewKeyNative::try_from(PrivateKeyNative::from(private_key)).map_err(|err| err.to_string())?;
            let query =
                SnapshotQuery::try_from_inputs(node_url, &program_native, &function_name, &view_key, &inputs.to_vec())
                    .await
                    .map_err(|err| err.to_string())?;
            trace.prepare_async(&query).await.map_err(|err| err.to_string())?;
            query.current_block_height().map_err(|e| e.to_string())?
        };

        log("Proving execution");
        let locator = program_native.id().to_string().add("/").add(function);
        let execution = trace
            .prove_execution::<CurrentAleo, _>(&locator, VarunaVersion::V2, &mut StdRng::from_entropy())
            .map_err(|e| e.to_string())?;

        // If the function is anything other than credits.aleo/split or credits.aleo/upgrade, execute a fee.
        let fee = match (program_id.as_str(), function) {
            ("credits.aleo", "split")
            | ("credits.aleo", "upgrade")
            | ("credits.aleo", "fee_private")
            | ("credits.aleo", "fee_public") => None,
            _ => {
                log("Calculating the minimum execution fee");
                let minimum_execution_cost = calculate_minimum_fee!(offline_query, node_url, process, &execution);

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
                    offline_query,
                    minimum_execution_cost
                );
                Some(fee)
            }
        };

        // Verify the execution
        let consensus_version =
            <CurrentNetwork as Network>::CONSENSUS_VERSION(latest_height).map_err(|err| err.to_string())?;
        let inclusion_upgrade_height =
            <CurrentNetwork as Network>::INCLUSION_UPGRADE_HEIGHT().map_err(|err| err.to_string())?;
        let inclusion_version =
            if latest_height >= inclusion_upgrade_height { InclusionVersion::V1 } else { InclusionVersion::V0 };
        process
            .verify_execution(consensus_version, VarunaVersion::V2, inclusion_version, &execution)
            .map_err(|err| err.to_string())?;

        log("Creating execution transaction");
        let transaction = TransactionNative::from_execution(execution, fee).map_err(|err| err.to_string())?;
        Ok(Transaction::from(transaction))
    }

    /// Execute an authorization.
    ///
    /// @param authorization The authorization to execute.
    /// @param fee_authorization The fee authorization to execute.
    /// @param program The program authorized to be executed.
    /// @param imports The imports of the program being executed.
    /// @param url The url to get the inclusion proving information from.
    /// @param offline_query Optional offline query object if building a Transaction offline.
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
        offline_query: Option<OfflineQuery>,
    ) -> Result<Transaction, String> {
        // Create a process and insert the program and its imports.
        log("Loading the SnarkVM process");
        let mut process_native = ProcessNative::load_web().map_err(|err| err.to_string())?;
        let process = &mut process_native;
        let node_url = url.as_deref().unwrap_or(DEFAULT_URL);

        // Get the latest height.
        log("Checking the latest block height");
        let latest_height = if let Some(offline_query) = offline_query.as_ref() {
            offline_query.current_block_height().map_err(|e| e.to_string())?
        } else {
            latest_block_height(node_url).await.map_err(|e| e.to_string())?
        };

        // Get the function name.
        log("Checking the function name is valid.");
        let function_name = IdentifierNative::from_str(&authorization.function_name()?).map_err(|e| e.to_string())?;

        log("Check program imports are valid and add them to the process");
        // Construct the program to ensure it's valid.
        let program_native = ProgramNative::from_str(program).map_err(|e| e.to_string())?;
        let program_id = program_native.id().to_string();

        // Insert the program and its imports.
        ProgramManager::resolve_imports(process, &program_native, imports)?;
        if program_id != "credits.aleo" && !process.contains_program(program_native.id()) {
            process.add_program(&program_native).map_err(|e| e.to_string())?;
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
            // If the fee keys were provided, insert them.
            if let Some(fee_proving_key) = fee_proving_key {
                let credits = ProgramIDNative::from_str("credits.aleo").unwrap();

                // Get the fee function name.
                let function_name = if fee_authorization.is_fee_private() {
                    IdentifierNative::from_str("fee_private").unwrap()
                } else {
                    IdentifierNative::from_str("fee_public").unwrap()
                };

                // Insert the keys if they don't already exist.
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

        let rng = &mut StdRng::from_entropy();
        let authorization = AuthorizationNative::from(authorization);

        // Construct the locator of the main function.
        let locator = {
            let request = authorization.peek_next().map_err(|e| e.to_string())?;
            LocatorNative::new(*request.program_id(), *request.function_name()).to_string()
        };

        // Determine the consensus version.
        let consensus_version =
            <CurrentNetwork as Network>::CONSENSUS_VERSION(latest_height).map_err(|e| e.to_string())?;
        // Check whether the authorization is for a valid program edition.
        authorization.check_valid_edition(process, consensus_version).map_err(|e| e.to_string())?;
        // Check whether the authorization is creating valid records.
        authorization.check_valid_records(consensus_version).map_err(|e| e.to_string())?;
        // Determine which Varuna version to use.
        let varuna_version = match (ConsensusVersion::V1..=ConsensusVersion::V3).contains(&consensus_version) {
            true => VarunaVersion::V1,
            false => VarunaVersion::V2,
        };

        let (_, mut trace) = process.execute::<CurrentAleo, _>(authorization, rng).map_err(|e| e.to_string())?;

        log("Preparing inclusion proofs for execution");
        if let Some(offline_query) = offline_query.as_ref() {
            trace.prepare_async(offline_query).await.map_err(|e| e.to_string())?;
        } else {
            let query = SnapshotQuery::rest();
            trace.prepare_async(&query).await.map_err(|err| err.to_string())?;
        };

        log("Proving execution");
        let execution = trace
            .prove_execution::<CurrentAleo, _>(&locator, varuna_version, &mut StdRng::from_entropy())
            .map_err(|e| e.to_string())?;

        let fee = if let Some(fee_authorization) = fee_authorization {
            let fee_authorization = AuthorizationNative::from(fee_authorization);

            // Check whether the authorization is for a valid program edition.
            fee_authorization.check_valid_edition(process, consensus_version).map_err(|e| e.to_string())?;
            // Check whether the authorization is creating valid records.
            fee_authorization.check_valid_records(consensus_version).map_err(|e| e.to_string())?;

            let (_, mut fee_trace) =
                process.execute::<CurrentAleo, _>(fee_authorization, rng).map_err(|e| e.to_string())?;

            log("Preparing inclusion proofs for execution");
            if let Some(offline_query) = offline_query.as_ref() {
                fee_trace.prepare_async(offline_query).await.map_err(|e| e.to_string())?;
            } else {
                let query = SnapshotQuery::rest();
                fee_trace.prepare_async(&query).await.map_err(|err| err.to_string())?;
            };

            Some(fee_trace.prove_fee::<CurrentAleo, _>(varuna_version, rng).map_err(|e| e.to_string())?)
        } else {
            None
        };
        Ok(Transaction::from(TransactionNative::from_execution(execution, fee).map_err(|e| e.to_string())?))
    }

    /// Execute Aleo function and create an Aleo execution transaction without a proof.
    /// Intended for use with Leo devnode.
    ///
    /// @param private_key The private key of the sender
    /// @param program The source code of the program being executed
    /// @param function The name of the function to execute
    /// @param inputs A javascript array of inputs to the function
    /// @param priority_fee_credits The optional priority fee to be paid for the transaction
    /// @param fee_record The record to spend the fee from
    /// @param url The url of the Aleo network node to send the transaction to
    /// If this is set to 'true' the keys synthesized (or passed in as optional parameters via the
    /// `proving_key` and `verifying_key` arguments) will be stored in the ProgramManager's memory
    /// and used for subsequent transactions. If this is set to 'false' the proving and verifying
    /// keys will be deallocated from memory after the transaction is executed.
    /// @param imports (optional) Provide a list of imports to use for the function execution in the
    /// form of a javascript object where the keys are a string of the program name and the values
    /// are a string representing the program source code \{ "hello.aleo": "hello.aleo source code" \}
    /// @param proving_key (optional) Provide a verifying key to use for the function execution
    /// @param verifying_key (optional) Provide a verifying key to use for the function execution
    /// @param fee_proving_key (optional) Provide a proving key to use for the fee execution
    /// @param fee_verifying_key (optional) Provide a verifying key to use for the fee execution
    /// @param offline_query An offline query object to use if building a transaction without an internet connection.
    /// @param edition The edition of the program to execute. Defaults to the latest found on the network, or 1 if the program does not exist on the network.
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
        offline_query: Option<OfflineQuery>,
        edition: Option<u16>,
    ) -> Result<Transaction, String> {
        log("Loading the SnarkVM process");
        let mut process_native = ProcessNative::load_web().map_err(|err| err.to_string())?;
        let process = &mut process_native;
        let node_url = url.as_deref().unwrap_or(LOCAL_URL);

        // Initialize the rng.
        let rng = &mut StdRng::from_entropy();

        log("Check program imports are valid and add them to the process");
        let program_native = ProgramNative::from_str(program).map_err(|e| e.to_string())?;
        let program_id = program_native.id().to_string();
        ProgramManager::resolve_imports(process, &program_native, imports)?;
        let edition = edition.unwrap_or(1);

        let inputs = process_inputs!(inputs);
        
        // Add the program to the process.
        // process.add_program_with_edition(&program, edition).map_err(|e| e.to_string())?;
        if program_id != "credits.aleo" {
            if !process.contains_program(program_native.id()) {
                log("Adding program to the process");
                process.add_program_with_edition(&program_native, edition).map_err(|e| e.to_string())?;
            }
        }

        // Mimic the Leo execute logic for --skip-proving block.
        let authorization = process.authorize::<CurrentAleo, _>(
            &private_key,
            &program_id,
            function,
            inputs.iter(),
            rng,
        ).map_err(|e| e.to_string())?;

        // Get the state root.
        let state_root = latest_stateroot(node_url).await.map_err(|e| e.to_string())?;

        // Get the consensus version.
        let latest_height = latest_block_height(node_url).await.map_err(|err| err.to_string())?;
        let consensus_version = CurrentNetwork::CONSENSUS_VERSION(latest_height).map_err(|err| err.to_string())?;
        
        // Execute without proving.
        let execution = ExecutionNative::from(
            authorization.transitions().values().cloned(),
            state_root,
            None,
        ).map_err(|e| e.to_string())?;
        
        // Calculate the cost.
        let (cost, _) = execution_cost(
            &process,
            &execution,
            consensus_version,
        ).map_err(|e| e.to_string())?;

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
                    .authorize_fee_public::<CurrentAleo, _>(
                        &private_key,
                        cost,
                        priority_fee_microcredits,
                        id,
                        rng,
                    )
                    .map_err(|e| e.to_string())?
            }
        };

        // Create a fee transition without a proof.
        let fee = FeeNative::from(fee_authorization.transitions().into_iter().next().unwrap().1, state_root, None)
            .map_err(|e| e.to_string())?;

        // Evaluate the process to ensure validity.
        let response = process.evaluate::<CurrentAleo>(authorization).map_err(|e| e.to_string())?;
        
        // Create the transaction.
        let transaction = TransactionNative::from_execution(execution, Some(fee)).map_err(|e| e.to_string())?;
        Ok(Transaction::from(transaction))
    }

    /// Estimate Fee for Aleo function execution. Note if "cache" is set to true, the proving and
    /// verifying keys will be stored in the ProgramManager's memory and used for subsequent
    /// program executions.
    ///
    /// @param program The source code of the program to estimate the execution fee for.
    /// @param function The name of the function to estimate the execution fee for.
    /// @param imports (optional) Provide a list of imports to use for the fee estimation in the
    /// form of a javascript object where the keys are a string of the program name and the values
    /// are a string representing the program source code \{ "hello.aleo": "hello.aleo source code" \}
    /// @param edition {
    /// @returns {u64} Fee in microcredits
    #[wasm_bindgen(js_name = estimateExecutionFee)]
    #[allow(clippy::too_many_arguments)]
    pub fn estimate_execution_fee(
        program: &str,
        function: &str,
        imports: Option<Object>,
        edition: Option<u16>,
    ) -> Result<u64, String> {
        let mut process_native = ProcessNative::load_web().map_err(|err| err.to_string())?;
        let process = &mut process_native;

        log("Check program imports are valid and add them to the process");
        let program_native = ProgramNative::from_str(program).map_err(|e| e.to_string())?;

        let rng = &mut StdRng::from_entropy();
        // Initialize a burner private key.
        let burner_private_key = PrivateKey::new();
        // Compute the burner address.
        let burner_address = Address::from_private_key(&burner_private_key);

        // Get the function.
        let function_native = program_native
            .get_function(&IdentifierNative::from_str(function).map_err(|e| e.to_string())?)
            .map_err(|e| e.to_string())?;

        // Resolve program imports.
        ProgramManager::resolve_imports(process, &program_native, imports)?;

        // Add the program to the process.
        let program_id = program_native.id();
        let edition = edition.unwrap_or(1);
        if program_id.to_string() != "credits.aleo" {
            if !process.contains_program(program_id) {
                log("Adding program to the process");
                process.add_program_with_edition(&program_native, edition).map_err(|e| e.to_string())?;
            }
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
            .authorize::<CurrentAleo, StdRng>(&burner_private_key, program_id, function, inputs.iter(), rng)
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
    ) -> Result<u64, String> {
        let mut process_native = ProcessNative::load_web().map_err(|err| err.to_string())?;
        let process = &mut process_native;

        log("Check program imports are valid and add them to the process");
        let program_native = ProgramNative::from_str(program).map_err(|e| e.to_string())?;

        // Resolve program imports.
        ProgramManager::resolve_imports(process, &program_native, imports)?;

        // Add the program to the process.
        let program_id = program_native.id();
        let edition = edition.unwrap_or(1);
        if program_id.to_string() != "credits.aleo" {
            if !process.contains_program(program_id) {
                log(&format!("Adding program {program_id} to the process"));
                process.add_program_with_edition(&program_native, edition).map_err(|e| e.to_string())?;
            }
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

        cost_in_microcredits_v2(&stack, &function_id).map_err(|e| e.to_string())
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
                ProgramManager::estimate_execution_fee(&program.to_string(), function, None, None).unwrap();

            assert_eq!(authorization_estimate, cost);
        }
    }
}
