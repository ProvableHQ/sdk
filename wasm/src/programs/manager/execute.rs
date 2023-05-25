// Copyright (C) 2019-2023 Aleo Systems Inc.
// This file is part of the Aleo library.

// The Aleo library is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// The Aleo library is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with the Aleo library. If not, see <https://www.gnu.org/licenses/>.

use super::*;
use std::ops::Add;

use crate::{execute_program, fee_inclusion_proof, inclusion_proof, programs::fee::FeeExecution, types::{
    CurrentAleo,
    CurrentBlockMemory,
    IdentifierNative,
    ProcessNative,
    ProgramNative,
    RecordPlaintextNative,
    TransactionNative,
}, ExecutionResponse, PrivateKey, RecordPlaintext, Transaction, log};

use js_sys::Array;
use rand::{rngs::StdRng, SeedableRng};
use std::str::FromStr;

#[wasm_bindgen]
impl ProgramManager {
    /// Run an aleo program locally
    #[wasm_bindgen]
    pub fn execute_local(
        &mut self,
        program: String,
        function: String,
        inputs: Array,
        private_key: PrivateKey,
        cache: bool,
    ) -> Result<ExecutionResponse, String> {
        log(&format!("executing local function: {function}"));
        let inputs = inputs.to_vec();
        let ((response, execution, _, _), process) =
            execute_program!(self, inputs, program, function, private_key, cache);

        process.verify_execution::<false>(&execution).map_err(|e| e.to_string())?;

        let outputs = js_sys::Array::new_with_length(response.outputs().len() as u32);

        for (i, output) in response.outputs().iter().enumerate() {
            outputs.set(i as u32, wasm_bindgen::JsValue::from_str(&output.to_string()));
        }

        Ok(ExecutionResponse::from(response))
    }

    pub fn clear_cache(&mut self) {
        self.proving_key_cache.clear();
        self.verifying_key_cache.clear();
    }

    /// Execute Aleo function and create an Aleo execution transaction
    #[wasm_bindgen]
    #[allow(clippy::too_many_arguments)]
    pub async fn execute(
        &mut self,
        program: String,
        function: String,
        inputs: Array,
        private_key: PrivateKey,
        fee_credits: f64,
        fee_record: RecordPlaintext,
        url: String,
        cache: bool,
    ) -> Result<Transaction, String> {
        log(&format!("executing function: {function} on-chain"));
        if fee_credits <= 0.0 {
            return Err("Fee must be greater than zero to execute a program".to_string());
        }
        let fee_microcredits = (fee_credits * 1_000_000.0f64) as u64;
        if fee_record.microcredits() < fee_microcredits {
            return Err("Fee record does not have enough credits to pay the specified fee".to_string());
        }

        // Execute the program
        let ((_, execution, inclusion, _), process) =
            execute_program!(self, inputs, program, function, private_key, cache);

        // Create the inclusion proof for the execution
        let execution = inclusion_proof!(inclusion, execution, url);

        // Verify the execution
        process.verify_execution::<true>(&execution).map_err(|e| e.to_string())?;

        // Execute the call to fee and create the inclusion proof for it
        let fee = fee_inclusion_proof!(process, private_key, fee_record, fee_microcredits, url);

        // Verify the fee
        process.verify_fee(&fee).map_err(|e| e.to_string())?;

        // Create the transaction
        log("Creating execution transaction");
        let transaction = TransactionNative::from_execution(execution, Some(fee)).map_err(|err| err.to_string())?;

        Ok(Transaction::from(transaction))
    }

    /// Execute An aleo fee transaction, if using web workers, this can be called in parallel with
    /// an execution of the program
    #[wasm_bindgen]
    pub async fn execute_fee(
        &self,
        private_key: PrivateKey,
        fee_credits: f64,
        fee_record: RecordPlaintext,
        url: String,
    ) -> Result<FeeExecution, String> {
        log("Creating fee execution");
        if fee_credits <= 0.0 {
            return Err("Fee must be greater than zero".to_string());
        }

        // Convert fee to microcredits and check that the fee record has enough credits to pay it
        let fee_microcredits = (fee_credits * 1_000_000.0f64) as u64;
        if fee_record.microcredits() < fee_microcredits {
            return Err("Fee record does not have enough credits to pay the specified fee".to_string());
        }

        let process = ProcessNative::load_web().unwrap();

        // Execute the call to fee and create the inclusion proof for it
        let fee_native = fee_inclusion_proof!(process, private_key, fee_record, fee_microcredits, url);

        Ok(FeeExecution::from(fee_native))
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
            .execute_local(HELLO_PROGRAM.to_string(), "main".to_string(), inputs, private_key, false)
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
            .execute(HELLO_PROGRAM.to_string(), function, inputs, private_key, fee, record, url.to_string(), false)
            .await
            .unwrap();
        // If the transaction unwrap doesn't panic, it's succeeded
        console_log!("transaction: {:?}", transaction);
    }
}
