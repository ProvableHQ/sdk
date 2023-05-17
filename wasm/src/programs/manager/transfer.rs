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

use crate::{
    execute_program,
    fee_inclusion_proof,
    inclusion_proof,
    types::{
        CurrentAleo,
        CurrentBlockMemory,
        IdentifierNative,
        ProcessNative,
        ProgramNative,
        RecordPlaintextNative,
        TransactionNative,
    },
    PrivateKey,
    RecordPlaintext,
    Transaction,
};

use js_sys::Array;
use rand::{rngs::StdRng, SeedableRng};
use std::{ops::Add, str::FromStr};

#[wasm_bindgen]
impl ProgramManager {
    /// Create an aleo transaction
    #[wasm_bindgen]
    #[allow(clippy::too_many_arguments)]
    pub async fn transfer(
        &mut self,
        private_key: PrivateKey,
        amount_credits: f64,
        recipient: String,
        amount_record: RecordPlaintext,
        fee_credits: f64,
        fee_record: RecordPlaintext,
        url: String,
        cache: bool,
    ) -> Result<Transaction, String> {
        if fee_credits < 0.0 {
            return Err("Fee must be greater than zero".to_string());
        }
        if amount_credits < 0.0 {
            return Err("Amount to transfer must be greater than zero".to_string());
        }
        let amount_microcredits = (amount_credits * 1_000_000.0f64) as u64;
        let fee_microcredits = (fee_credits * 1_000_000.0f64) as u64;
        let program = ProgramNative::credits().unwrap().to_string();
        let inputs = Array::new_with_length(3);
        inputs.set(0u32, wasm_bindgen::JsValue::from_str(&amount_record.to_string()));
        inputs.set(1u32, wasm_bindgen::JsValue::from_str(&recipient));
        inputs.set(2u32, wasm_bindgen::JsValue::from_str(&amount_microcredits.to_string().add("u64")));

        let ((_, execution, inclusion, _), process) = execute_program!(self, inputs, program, "transfer", private_key, cache);

        // Create the inclusion proof for the execution
        let execution = inclusion_proof!(inclusion, execution, url);

        // Execute the call to fee and create the inclusion proof for it
        let fee = fee_inclusion_proof!(process, private_key, fee_record, fee_microcredits, url);

        // Create the transaction
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

function hello:
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
        let result =
            program_manager.execute_local(HELLO_PROGRAM.to_string(), "hello".to_string(), inputs, private_key,true).unwrap();
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
            .execute(HELLO_PROGRAM.to_string(), function, inputs, private_key, fee, record, url.to_string(), true)
            .await
            .unwrap();
        // If the transaction unwrap doesn't panic, it's succeeded
        console_log!("transaction: {:?}", transaction);
    }
}
