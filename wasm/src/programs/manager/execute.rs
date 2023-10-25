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

use crate::{
    log,
    types::{IdentifierNative, ProgramNative},
    ExecutionResponse,
    PrivateKey,
    RecordPlaintext,
    Transaction,
};

use js_sys::{Array, Object};
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
        private_key: PrivateKey,
        program: String,
        function: String,
        inputs: Array,
        prove_execution: bool,
        cache: bool,
        imports: Option<Object>,
        proving_key: Option<ProvingKey>,
        verifying_key: Option<VerifyingKey>,
    ) -> Result<ExecutionResponse, String> {
        log(&format!("Executing local function: {function}"));

        let inputs = ProgramState::get_inputs(inputs)?;

        let state = ProgramState::new(program, imports).await?;

        let (state, execute) = state.execute_program(
            function,
            inputs,
            private_key,
            proving_key,
            verifying_key,
        ).await?;

        if prove_execution {
            let (state, execution) = state.prove_execution(execute, "https://vm.aleo.org/api".to_string()).await?;
            state.prove_response(execution, cache)

        } else {
            state.execute_response(execute, cache)
        }
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
        private_key: PrivateKey,
        program: String,
        function: String,
        inputs: Array,
        fee_credits: f64,
        fee_record: Option<RecordPlaintext>,
        url: String,
        imports: Option<Object>,
        proving_key: Option<ProvingKey>,
        verifying_key: Option<VerifyingKey>,
        fee_proving_key: Option<ProvingKey>,
        fee_verifying_key: Option<VerifyingKey>,
    ) -> Result<Transaction, String> {
        log(&format!("Executing function: {function} on-chain"));

        let inputs = ProgramState::get_inputs(inputs)?;

        let fee_microcredits = Self::microcredits(fee_credits, &fee_record)?;

        let state = ProgramState::new(program, imports).await?;

        let (state, execute) = state.execute_program(
            function,
            inputs,
            private_key.clone(),
            proving_key,
            verifying_key,
        ).await?;

        let (state, execution) = state.prove_execution(execute, url.clone()).await?;

        let (_state, fee) = state.execute_fee(
            execution.execution_id()?,
            url,
            private_key,
            fee_microcredits,
            fee_record,
            fee_proving_key,
            fee_verifying_key,
        ).await?;

        execution.into_transaction(Some(fee)).await
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
    /// @returns {u64 | Error} Fee in microcredits
    #[wasm_bindgen(js_name = estimateExecutionFee)]
    #[allow(clippy::too_many_arguments)]
    pub async fn estimate_execution_fee(
        private_key: PrivateKey,
        program: String,
        function: String,
        inputs: Array,
        url: String,
        imports: Option<Object>,
        proving_key: Option<ProvingKey>,
        verifying_key: Option<VerifyingKey>,
    ) -> Result<u64, String> {
        log(
            "Disclaimer: Fee estimation is experimental and may not represent a correct estimate on any current or future network",
        );
        log(&format!("Executing local function: {function}"));

        let inputs = ProgramState::get_inputs(inputs)?;

        let state = ProgramState::new(program, imports).await?;

        let (state, execute) = state.execute_program(
            function,
            inputs,
            private_key,
            proving_key,
            verifying_key,
        ).await?;

        let (state, execution) = state.prove_execution(execute, url).await?;

        state.estimate_fee(execution).await
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
    pub fn estimate_finalize_fee(program: &str, function: &str) -> Result<u64, String> {
        log(
            "Disclaimer: Fee estimation is experimental and may not represent a correct estimate on any current or future network",
        );
        let program = ProgramNative::from_str(program).map_err(|err| err.to_string())?;
        let function_id = IdentifierNative::from_str(function).map_err(|err| err.to_string())?;
        match program.get_function(&function_id).map_err(|err| err.to_string())?.finalize_logic() {
            Some(finalize) => cost_in_microcredits(finalize).map_err(|e| e.to_string()),
            None => Ok(0u64),
        }
    }
}
