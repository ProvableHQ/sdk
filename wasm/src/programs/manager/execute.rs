// Copyright (C) 2019-2023 Aleo Systems Inc.
// This file is part of the Aleo SDK library.

// The Aleo SDK library is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// The Aleo SDK library is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with the Aleo SDK library. If not, see <https://www.gnu.org/licenses/>.

use super::*;
use core::ops::Add;

use crate::{
    execute_fee,
    execute_program,
    get_process,
    log,
    types::{CurrentAleo, IdentifierNative, ProcessNative, ProgramNative, RecordPlaintextNative, TransactionNative},
    ExecutionResponse,
    PrivateKey,
    RecordPlaintext,
    Transaction,
};

use indexmap::IndexMap;
use js_sys::{Array, Object};
use rand::{rngs::StdRng, SeedableRng};
use std::str::FromStr;

#[wasm_bindgen]
impl ProgramManager {
    /// Execute an arbitrary function locally
    ///
    /// @param private_key The private key of the sender
    /// @param program The source code of the program being executed
    /// @param function The name of the function to execute
    /// @param inputs A javascript array of inputs to the function
    /// @param amount_record The record to fund the amount from
    /// @param fee_credits The amount of credits to pay as a fee
    /// @param fee_record The record to spend the fee from
    /// @param url The url of the Aleo network node to send the transaction to
    /// @param cache Cache the proving and verifying keys in the ProgramManager's memory.
    /// If this is set to 'true' the keys synthesized (or passed in as optional parameters via the
    /// `proving_key` and `verifying_key` arguments) will be stored in the ProgramManager's memory
    /// and used for subsequent transactions. If this is set to 'false' the proving and verifying
    /// keys will be deallocated from memory after the transaction is executed.
    /// @param imports (optional) Provide a list of imports to use for the function execution in the
    /// form of a javascript object where the keys are a string of the program name and the values
    /// are a string representing the program source code \{ "hello.aleo": "hello.aleo source code" \}
    /// @param proving_key (optional) Provide a verifying key to use for the function execution
    /// @param verifying_key (optional) Provide a verifying key to use for the function execution
    #[wasm_bindgen(js_name = executeFunctionOffline)]
    #[allow(clippy::too_many_arguments)]
    pub fn execute_function_offline(
        &mut self,
        private_key: PrivateKey,
        program: String,
        function: String,
        inputs: Array,
        cache: bool,
        imports: Option<Object>,
        proving_key: Option<ProvingKey>,
        verifying_key: Option<VerifyingKey>,
    ) -> Result<ExecutionResponse, String> {
        log(&format!("Executing local function: {function}"));
        let inputs = inputs.to_vec();

        let mut new_process;
        let process: &mut ProcessNative = get_process!(self, cache, new_process);

        log("Check program imports are valid and add them to the process");
        let program_native = ProgramNative::from_str(&program).map_err(|e| e.to_string())?;
        ProgramManager::resolve_imports(process, &program_native, imports)?;

        let (response, _) =
            execute_program!(process, inputs, program, function, private_key, proving_key, verifying_key);

        log("Creating execution response");
        let outputs = js_sys::Array::new_with_length(response.outputs().len() as u32);
        for (i, output) in response.outputs().iter().enumerate() {
            outputs.set(i as u32, wasm_bindgen::JsValue::from_str(&output.to_string()));
        }
        Ok(ExecutionResponse::from(response))
    }

    /// Execute Aleo function and create an Aleo execution transaction
    ///
    /// @param private_key The private key of the sender
    /// @param program The source code of the program being executed
    /// @param function The name of the function to execute
    /// @param inputs A javascript array of inputs to the function
    /// @param fee_credits The amount of credits to pay as a fee
    /// @param fee_record The record to spend the fee from
    /// @param url The url of the Aleo network node to send the transaction to
    /// @param cache Cache the proving and verifying keys in the ProgramManager's memory.
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
    /// @returns {Transaction | Error}
    #[wasm_bindgen(js_name = buildExecutionTransaction)]
    #[allow(clippy::too_many_arguments)]
    pub async fn execute(
        &mut self,
        private_key: PrivateKey,
        program: String,
        function: String,
        inputs: Array,
        fee_credits: f64,
        fee_record: RecordPlaintext,
        url: String,
        cache: bool,
        imports: Option<Object>,
        proving_key: Option<ProvingKey>,
        verifying_key: Option<VerifyingKey>,
        fee_proving_key: Option<ProvingKey>,
        fee_verifying_key: Option<VerifyingKey>,
    ) -> Result<Transaction, String> {
        log(&format!("Executing function: {function} on-chain"));
        let fee_microcredits = Self::validate_amount(fee_credits, &fee_record, true)?;

        let mut new_process;
        let process = get_process!(self, cache, new_process);

        log("Check program imports are valid and add them to the process");
        let program_native = ProgramNative::from_str(&program).map_err(|e| e.to_string())?;
        ProgramManager::resolve_imports(process, &program_native, imports)?;

        log("Executing program");
        let (_, mut trace) =
            execute_program!(process, inputs, program, function, private_key, proving_key, verifying_key);

        log("Preparing inclusion proofs for execution");
        let query = QueryNative::from(&url);
        trace.prepare_async(query).await.map_err(|err| err.to_string())?;

        log("Proving execution");
        let program = ProgramNative::from_str(&program).map_err(|err| err.to_string())?;
        let locator = program.id().to_string().add("/").add(&function);
        let execution = trace
            .prove_execution::<CurrentAleo, _>(&locator, &mut StdRng::from_entropy())
            .map_err(|e| e.to_string())?;
        let execution_id = execution.to_execution_id().map_err(|e| e.to_string())?;

        log("Executing fee");
        let fee = execute_fee!(
            process,
            private_key,
            fee_record,
            fee_microcredits,
            url,
            fee_proving_key,
            fee_verifying_key,
            execution_id
        );

        // Verify the execution
        process.verify_execution(&execution).map_err(|err| err.to_string())?;

        log("Creating execution transaction");
        let transaction = TransactionNative::from_execution(execution, Some(fee)).map_err(|err| err.to_string())?;
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
    /// @param cache Cache the proving and verifying keys in the ProgramManager's memory.
    /// @param imports (optional) Provide a list of imports to use for the fee estimation in the
    /// form of a javascript object where the keys are a string of the program name and the values
    /// are a string representing the program source code \{ "hello.aleo": "hello.aleo source code" \}
    /// @param proving_key (optional) Provide a verifying key to use for the fee estimation
    /// @param verifying_key (optional) Provide a verifying key to use for the fee estimation
    /// @returns {u64 | Error} Fee in microcredits
    #[wasm_bindgen(js_name = estimateExecutionFee)]
    #[allow(clippy::too_many_arguments)]
    pub async fn estimate_execution_fee(
        &mut self,
        private_key: PrivateKey,
        program: String,
        function: String,
        inputs: Array,
        url: String,
        cache: bool,
        imports: Option<Object>,
        proving_key: Option<ProvingKey>,
        verifying_key: Option<VerifyingKey>,
    ) -> Result<u64, String> {
        log(
            "Disclaimer: Fee estimation is experimental and may not represent a correct estimate on any current or future network",
        );
        log(&format!("Executing local function: {function}"));
        let inputs = inputs.to_vec();

        let mut new_process;
        let process: &mut ProcessNative = get_process!(self, cache, new_process);

        log("Check program imports are valid and add them to the process");
        let program_native = ProgramNative::from_str(&program).map_err(|e| e.to_string())?;
        ProgramManager::resolve_imports(process, &program_native, imports)?;

        log("Generating execution trace");
        let (_, mut trace) =
            execute_program!(process, inputs, program, function, private_key, proving_key, verifying_key);

        // Execute the program
        let program = ProgramNative::from_str(&program).map_err(|err| err.to_string())?;
        let locator = program.id().to_string().add("/").add(&function);
        let query = QueryNative::from(&url);
        trace.prepare_async(query).await.map_err(|err| err.to_string())?;
        let execution = trace
            .prove_execution::<CurrentAleo, _>(&locator, &mut StdRng::from_entropy())
            .map_err(|e| e.to_string())?;

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
            let program = process.get_program(program_id).map_err(|e| e.to_string())?;

            // Calculate the finalize cost for the function identified in the transition
            let cost = match &program.get_function(function_name).map_err(|e| e.to_string())?.finalize() {
                Some((_, finalize)) => cost_in_microcredits(finalize).map_err(|e| e.to_string())?,
                None => continue,
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
    /// @returns {u64 | Error} Fee in microcredits
    #[wasm_bindgen(js_name = estimateFinalizeFee)]
    pub fn estimate_finalize_fee(&self, program: String, function: String) -> Result<u64, String> {
        log(
            "Disclaimer: Fee estimation is experimental and may not represent a correct estimate on any current or future network",
        );
        let program = ProgramNative::from_str(&program).map_err(|err| err.to_string())?;
        let function_id = IdentifierNative::from_str(&function).map_err(|err| err.to_string())?;
        match program.get_function(&function_id).map_err(|err| err.to_string())?.finalize() {
            Some((_, finalize)) => cost_in_microcredits(finalize).map_err(|e| e.to_string()),
            None => Ok(0u64),
        }
    }
}
