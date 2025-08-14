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
    ExecutionResponse,
    OfflineQuery,
    PrivateKey,
    RecordPlaintext,
    Transaction,
    calculate_minimum_fee,
    execute_fee,
    execute_program,
    log,
    process_inputs,
    programs::SnapshotQuery,
    types::native::{
        CurrentAleo,
        CurrentNetwork,
        IdentifierNative,
        ProcessNative,
        ProgramNative,
        RecordPlaintextNative,
        TransactionNative,
    },
};
use snarkvm_algorithms::snark::varuna::VarunaVersion;
use snarkvm_console::{
    network::{ConsensusVersion},
    types::Field,
};
use snarkvm_ledger_query::QueryTrait;
use snarkvm_synthesizer::prelude::{
    InclusionVersion,
    cost_in_microcredits_v1,
    execution_cost_v1,
    execution_cost_v2,
};

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
        log(&format!("Executing local function: {function}"));
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
                trace.prepare_async(&offline_query).await.map_err(|e| e.to_string())?;
            } else {
                // NEW: try snapshot query, fallback to QueryNative (TODO, for now)
                let commitments = snapshot_helpers::collect_commitments_from_trace(&trace)?;
                match snapshot_helpers::build_snapshot_query(node_url, &commitments).await {
                    Ok(snapshot_query) => {
                        trace.prepare_async(&snapshot_query).await.map_err(|e| e.to_string())?;
                    }
                    Err(_e) => {
                        // TODO: remove this fallback once snapshot builder is implemented
                        let query = QueryNative::from(node_url);
                        trace.prepare_async(&query).await.map_err(|err| err.to_string())?;
                    }
                }
            }


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
        if let Some(offline_query) = offline_query.as_ref() {
            trace.prepare_async(offline_query).await.map_err(|err| err.to_string())?;
        } else {
            // NEW: try snapshot query, fallback to QueryNative (TODO, for now)
            let commitments = snapshot_helpers::collect_commitments_from_trace(&trace)?;
            match snapshot_helpers::build_snapshot_query(node_url, &commitments).await {
                Ok(snapshot_query) => {
                    trace.prepare_async(&snapshot_query).await.map_err(|e| e.to_string())?;
                }
                Err(_e) => {
                    let query = QueryNative::from(node_url);
                    trace.prepare_async(&query).await.map_err(|err| err.to_string())?;
                }
            }
        }


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
        process
            .verify_execution(ConsensusVersion::V8, VarunaVersion::V2, InclusionVersion::V1, &execution)
            .map_err(|err| err.to_string())?;

        log("Creating execution transaction");
        let transaction = TransactionNative::from_execution(execution, fee).map_err(|err| err.to_string())?;
        Ok(Transaction::from(transaction))
    }

    /// Estimate Fee for Aleo function execution. Note if "cache" is set to true, the proving and
    /// verifying keys will be stored in the ProgramManager's memory and used for subsequent
    /// program executions.
    ///
    /// Disclaimer: Fee estimation is experimental and may not represent a correct estimate on any current or future network
    ///
    /// @param private_key The private key of the sender
    /// @param program The source code of the program to estimate the execution fee for
    /// @param function The name of the function to execute
    /// @param inputs A javascript array of inputs to the function
    /// @param url The url of the Aleo network node to send the transaction to
    /// @param imports (optional) Provide a list of imports to use for the fee estimation in the
    /// form of a javascript object where the keys are a string of the program name and the values
    /// are a string representing the program source code \{ "hello.aleo": "hello.aleo source code" \}
    /// @param proving_key (optional) Provide a verifying key to use for the fee estimation
    /// @param verifying_key (optional) Provide a verifying key to use for the fee estimation
    /// @returns {u64} Fee in microcredits
    #[wasm_bindgen(js_name = estimateExecutionFee)]
    #[allow(clippy::too_many_arguments)]
    pub async fn estimate_execution_fee(
        private_key: &PrivateKey,
        program: &str,
        function: &str,
        inputs: Array,
        url: Option<String>,
        imports: Option<Object>,
        proving_key: Option<ProvingKey>,
        verifying_key: Option<VerifyingKey>,
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
        ProgramManager::resolve_imports(process, &program_native, imports)?;
        let rng = &mut StdRng::from_entropy();

        log("Generating execution trace");
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

        // Execute the program
        let node_url = url.as_deref().unwrap_or(DEFAULT_URL);
        let program = ProgramNative::from_str(program).map_err(|err| err.to_string())?;
        let locator = program.id().to_string().add("/").add(function);

        let block_height = if let Some(offline_query) = offline_query {
            let block_height = offline_query.current_block_height().map_err(|e| e.to_string())?;
            trace.prepare_async(&offline_query).await.map_err(|err| err.to_string())?;
            block_height
        } else {
            // try snapshot query, fallback to QueryNative (TODO, for now)
            let commitments = snapshot_helpers::collect_commitments_from_trace(&trace)?;
            match snapshot_helpers::build_snapshot_query(node_url, &commitments).await {
                Ok(snapshot_query) => {
                    let bh = snapshot_query.current_block_height().map_err(|e| e.to_string())?;
                    trace.prepare_async(&snapshot_query).await.map_err(|e| e.to_string())?;
                    bh
                }
                Err(_e) => {
                    let query = QueryNative::from(node_url);
                    let bh = query.current_block_height_async().await.map_err(|e| e.to_string())?;
                    trace.prepare_async(&query).await.map_err(|err| err.to_string())?;
                    bh
                }
            }
        };

        let execution =
            trace.prove_execution::<CurrentAleo, _>(&locator, VarunaVersion::V2, rng).map_err(|e| e.to_string())?;

        // Get the storage cost in bytes for the program execution
        log("Estimating cost");
        let storage_cost = execution.size_in_bytes().map_err(|e| e.to_string())?;

        // Compute the finalize cost in microcredits.
        let mut finalize_cost = 0u64;
        // Iterate over the transitions to accumulate the finalize cost.
        for transition in execution.transitions() {
            // Retrieve the function name, program id, and program.
            let function_name = transition.function_name();
            let program_id = transition.program_id();
            let stack = process.get_stack(program_id).map_err(|e| e.to_string())?;

            // Calculate the finalize cost for the function identified in the transition
            let cost = if block_height >= CurrentNetwork::CONSENSUS_HEIGHT(ConsensusVersion::V2).unwrap() {
                cost_in_microcredits_v2(&stack, function_name).map_err(|e| e.to_string())?
            } else {
                cost_in_microcredits_v1(&stack, function_name).map_err(|e| e.to_string())?
            };

            // Accumulate the finalize cost.
            finalize_cost = finalize_cost
                .checked_add(cost)
                .ok_or("The finalize cost computation overflowed for an execution".to_string())?;
        }
        Ok(storage_cost + finalize_cost)
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

mod snapshot_helpers {
    use super::*;
    type StateRootNative = <CurrentNetwork as snarkvm_console::network::Network>::StateRoot;

    pub fn collect_commitments_from_trace<T>(
        _trace: &T,
    ) -> Result<Vec<Field<CurrentNetwork>>, String> {
        Ok(vec![])
    }

    pub async fn build_snapshot_query(
        node_url: &str,
        commitments: &[Field<CurrentNetwork>],
    ) -> Result<SnapshotQuery, String> {
        let (state_root, block_height) = snapshot_head(node_url).await?;
        let mut query = SnapshotQuery::new(block_height, &state_root_to_string(state_root))?;

        for c in commitments {
            let c_str = c.to_string();
            let sp_str = fetch_state_path_at_root(node_url, &c_str, &state_root_to_string(state_root)).await?;
            query.add_state_path(&c_str, &sp_str)?;
        }
        Ok(query)
    }

    // Prefer an API that returns both in one call; otherwise fetch root then height immediately.
    async fn snapshot_head(node_url: &str) -> Result<(StateRootNative, u32), String> {
        // TODO: call existing client / REST: (root, height)
        Err("snapshot_head() not implemented".into())
    }

    async fn fetch_state_path_at_root(
        node_url: &str,
        commitment: &str,
        state_root: &str,
    ) -> Result<String, String> {
        // TODO: call endpoint that returns a StatePath string for (commitment, state_root)
        Err("fetch_state_path_at_root() not implemented".into())
    }

    fn state_root_to_string(root: StateRootNative) -> String {
        root.to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        Metadata,
        array,
        utilities::test::{HELLO_PROGRAM, PROVABLE_API},
    };

    async fn test_execute_added_program() {
        // Generate the private key.
        let private_key = PrivateKey::new();

        // Download the fee prover.
        let fee_prover_uri = Metadata::fee_public().prover;
        let fee_proving_key_bytes = reqwest::get(fee_prover_uri).await.unwrap().bytes().await.unwrap().to_vec();
        let fee_prover = ProvingKey::from_bytes(&fee_proving_key_bytes).unwrap();
        let fee_verifier = VerifyingKey::fee_public_verifier();

        // Create the execution.
        let transaction = ProgramManager::execute(
            &private_key,
            HELLO_PROGRAM,
            "main",
            array!["5u32", "5u32"],
            0.0,
            None,
            Some(PROVABLE_API.to_string()),
            None,
            None,
            None,
            Some(fee_prover),
            Some(fee_verifier),
            None,
            None,
        )
        .await
        .unwrap();

        assert!(transaction.is_execute());
    }
}
