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
    log,
    process_inputs,
    types::native::{
        CurrentAleo,
        CurrentNetwork,
        IdentifierNative,
        ProcessNative,
        ProgramNative,
        RecordPlaintextNative,
        TransactionNative,
    }
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

    #[wasm_bindgen]
    pub async fn execute_authorization(
        private_key: &PrivateKey,
        authorization: Authorization,
        program: &str,
        function: &str,
        imports: Option<Object>,
        url: Option<String>,
    ) -> Result<Transaction, String> {
        let mut process_native = ProcessNative::load_web().map_err(|err| err.to_string())?;
        let process = &mut process_native;
        let node_url = url.as_deref().unwrap_or(DEFAULT_URL);

        log("Check program imports are valid and add them to the process");
        let program_native = ProgramNative::from_str(program).map_err(|e| e.to_string())?;
        let program_id = program_native.id().to_string();
        ProgramManager::resolve_imports(process, &program_native, imports)?;
        let rng = &mut StdRng::from_entropy();

        if program_id != "credits.aleo" && !process.contains_program(program_id) {
            process.add_program(program_native).map_err(|e| e.to_string())?;
        }

        let (_, trace) = process.execute(authorization, rng).map_err(|e| e.to_string())?;

        log("Preparing inclusion proofs for execution");
        let latest_height = if let Some(offline_query) = offline_query.as_ref() {
            trace.prepare_async(offline_query).await.map_err(|e| e.to_string())?;
            offline_query.current_block_height().map_err(|e| e.to_string())?
        } else {
            let function_name = IdentifierNative::from_str(function).map_err(|e| e.to_string())?;
            let view_key = 
                ViewKeyNative::try_from(PrivateKeyNative::from(private_key)).map_err(|e| e.to_string())?;
            let query =
                SnapshotQuery::try_from_inputs(node_url, &program_native, &function_name, &view_key, &inputs)
                    .await
                    .map_err(|e| e.to_string())?;
        };

        log("Proving execution");
        let locator = program_native.id().to_string().add("/").add(function);
        let execution = trace
            .prove_execution::<CurrentAleo, _>(&locator, VarunaVersion::V2, &mut StdRng::from_entropy())
            .map_err(|e| e.to_string())?;
    }

    /// Estimate Fee for Aleo function execution. Note if "cache" is set to true, the proving and
    /// verifying keys will be stored in the ProgramManager's memory and used for subsequent
    /// program executions.
    ///
    /// Disclaimer: Fee estimation is experimental and may not represent a correct estimate on any current or future network
    ///
    /// @param program The source code of the program to estimate the execution fee for
    /// @param function The name of the function to execute
    /// @param url The url of the Aleo network node to send the transaction to
    /// @param imports (optional) Provide a list of imports to use for the fee estimation in the
    /// form of a javascript object where the keys are a string of the program name and the values
    /// are a string representing the program source code \{ "hello.aleo": "hello.aleo source code" \}
    /// @param offline_query The offline query object used to insert the global state root and state paths needed to create
    /// a valid inclusion proof offline.
    /// @returns {u64} Fee in microcredits
    #[wasm_bindgen(js_name = estimateExecutionFee)]
    #[allow(clippy::too_many_arguments)]
    pub async fn estimate_execution_fee(
        program: &str,
        function: &str,
        url: Option<String>,
        imports: Option<Object>,
        offline_query: Option<OfflineQuery>,
        edition: Option<u16>,
    ) -> Result<u64, String> {
        log(
            "Disclaimer: Fee estimation is experimental and may not represent a correct estimate on any current or future network",
        );
        log(&format!("Executing local function: {function}"));

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

        // Add the program to the process.
        let program_id = program_native.id();
        let edition = edition.unwrap_or(1);
        if program_id.to_string() != "credits.aleo" {
            if !process.contains_program(program_id) {
                log("Adding program to the process");
                process.add_program_with_edition(&program_native, edition).map_err(|e| e.to_string())?;
            }
        }

        // Resolve program imports.
        ProgramManager::resolve_imports(process, &program_native, imports)?;

        // Create the authorization.
        let authorization = process
            .authorize::<CurrentAleo, StdRng>(&burner_private_key, program_id, function, inputs.iter(), rng)
            .map_err(|e| e.to_string())?;

        // Get the ConsensusVersion.
        let node_url = url.as_deref().unwrap_or(DEFAULT_URL);
        let latest_height = if let Some(offline_query) = offline_query.as_ref() {
            offline_query.current_block_height().map_err(|e| e.to_string())?
        } else {
            latest_block_height(node_url).await.map_err(|err| err.to_string())?
        };
        let consensus_version =
            <CurrentNetwork as Network>::CONSENSUS_VERSION(latest_height).map_err(|err| err.to_string())?;

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
                ProgramManager::estimate_execution_fee(&program.to_string(), function, None, None, None, Some(1))
                    .await
                    .unwrap();

            assert_eq!(authorization_estimate, cost);
        }
    }
}
