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
    execute_program,
    fee_inclusion_proof,
    get_process,
    inclusion_proof,
    log,
    types::{
        CurrentAleo,
        CurrentBlockMemory,
        IdentifierNative,
        ProcessNative,
        ProgramNative,
        RecordPlaintextNative,
        TransactionNative,
    },
    ExecutionResponse,
    PrivateKey,
    RecordPlaintext,
    Transaction,
};

use js_sys::Array;
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
    /// @param proving_key (optional) Provide a verifying key to use for the function execution
    /// @param verifying_key (optional) Provide a verifying key to use for the function execution
    #[wasm_bindgen]
    #[allow(clippy::too_many_arguments)]
    pub fn execute_local(
        &mut self,
        private_key: PrivateKey,
        program: String,
        function: String,
        inputs: Array,
        cache: bool,
        proving_key: Option<ProvingKey>,
        verifying_key: Option<VerifyingKey>,
    ) -> Result<ExecutionResponse, String> {
        log(&format!("Executing local function: {function}"));
        let inputs = inputs.to_vec();

        let mut new_process;
        let process: &mut ProcessNative = get_process!(self, cache, new_process);

        let (response, execution, _, _) =
            execute_program!(process, inputs, program, function, private_key, proving_key, verifying_key);

        log(&format!("Verifying execution for local function: {function}"));
        process.verify_execution::<false>(&execution).map_err(|e| e.to_string())?;

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
    /// @param proving_key (optional) Provide a verifying key to use for the function execution
    /// @param verifying_key (optional) Provide a verifying key to use for the function execution
    /// @param fee_proving_key (optional) Provide a proving key to use for the fee execution
    /// @param fee_verifying_key (optional) Provide a verifying key to use for the fee execution
    #[wasm_bindgen]
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
        proving_key: Option<ProvingKey>,
        verifying_key: Option<VerifyingKey>,
        fee_proving_key: Option<ProvingKey>,
        fee_verifying_key: Option<VerifyingKey>,
    ) -> Result<Transaction, String> {
        log(&format!("Executing function: {function} on-chain"));
        let fee_microcredits = Self::validate_amount(fee_credits, &fee_record, true)?;

        let mut new_process;
        let process = get_process!(self, cache, new_process);

        let (_, execution, inclusion, _) =
            execute_program!(process, inputs, program, function, private_key, proving_key, verifying_key);
        let execution = inclusion_proof!(process, inclusion, execution, url);
        let fee = fee_inclusion_proof!(
            process,
            private_key,
            fee_record,
            fee_microcredits,
            url,
            fee_proving_key,
            fee_verifying_key
        );

        log("Creating execution transaction");
        let transaction = TransactionNative::from_execution(execution, Some(fee)).map_err(|err| err.to_string())?;
        Ok(Transaction::from(transaction))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use wasm_bindgen_test::*;
    wasm_bindgen_test_configure!(run_in_browser);

    pub const HELLO_PROGRAM: &str = r#"program hello.aleo;
function main:
    input r0 as u32.public;
    input r1 as u32.private;
    add r0 r1 into r2;
    output r2 as u32.private;
"#;

    #[wasm_bindgen_test]
    async fn test_web_program_run() {
        let mut program_manager = ProgramManager::new();
        let private_key = PrivateKey::new();
        let inputs = js_sys::Array::new_with_length(2);
        inputs.set(0, wasm_bindgen::JsValue::from_str("5u32"));
        inputs.set(1, wasm_bindgen::JsValue::from_str("5u32"));
        let result = program_manager
            .execute_local(private_key, HELLO_PROGRAM.to_string(), "main".to_string(), inputs, false, None, None)
            .unwrap();
        let outputs = result.get_outputs().to_vec();
        console_log!("outputs: {:?}", outputs);
        assert_eq!(outputs.len(), 1);
        assert_eq!(outputs[0], "10u32");
    }

    #[wasm_bindgen_test]
    async fn test_web_program_execution() {
        let record_str = r#"{  owner: aleo184vuwr5u7u0ha5f5k44067dd2uaqewxx6pe5ltha5pv99wvhfqxqv339h4.private,  microcredits: 50200000u64.private,  _nonce: 4201158309645146813264939404970515915909115816771965551707972399526559622583group.public}"#;
        let mut program_manager = ProgramManager::new();
        let private_key =
            PrivateKey::from_string("APrivateKey1zkp3dQx4WASWYQVWKkq14v3RoQDfY2kbLssUj7iifi1VUQ6").unwrap();
        let inputs = js_sys::Array::new_with_length(2);
        inputs.set(0, wasm_bindgen::JsValue::from_str("5u32"));
        inputs.set(1, wasm_bindgen::JsValue::from_str("5u32"));
        let function = "main".to_string();
        let fee = 2.0f64;
        let record = RecordPlaintext::from_string(record_str).unwrap();
        let url = "http://0.0.0.0:3030";
        let transaction = program_manager
            .execute(
                private_key,
                HELLO_PROGRAM.to_string(),
                function,
                inputs,
                fee,
                record,
                url.to_string(),
                false,
                None,
                None,
                None,
                None,
            )
            .await
            .unwrap();
        // If the transaction unwrap doesn't panic, it's succeeded
        console_log!("transaction: {:?}", transaction);
    }
}
