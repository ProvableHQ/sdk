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

use crate::{
    types::{CurrentAleo, IdentifierNative, ProcessNative, ProgramNative, TransactionNative},
    PrivateKey,
    RecordPlaintext,
    Transaction,
};

use crate::types::RecordPlaintextNative;
use js_sys::Array;
use rand::{rngs::StdRng, SeedableRng};
use std::str::FromStr;
use wasm_bindgen::prelude::wasm_bindgen;

#[wasm_bindgen]
pub struct ProgramManager;

#[wasm_bindgen]
impl ProgramManager {
    #[wasm_bindgen]
    pub fn new() -> Self {
        Self
    }

    #[wasm_bindgen]
    pub fn run(
        &self,
        program: String,
        function: String,
        inputs: Array,
        private_key: PrivateKey,
    ) -> Result<Array, String> {
        let mut inputs_native = vec![];

        for input in inputs.to_vec().iter() {
            if let Some(input) = input.as_string() {
                inputs_native.push(input);
            } else {
                return Err("Invalid input - all inputs must be a string specifying the type".to_string());
            }
        }

        let mut process = ProcessNative::load_web().map_err(|_| "Failed to load the process".to_string())?;

        let program =
            ProgramNative::from_str(&program).map_err(|_| "The program ID provided was invalid".to_string())?;
        let function_name =
            IdentifierNative::from_str(&function).map_err(|_| "The function name provided was invalid".to_string())?;

        process.add_program(&program).map_err(|_| "Failed to add program".to_string())?;

        let authorization = process
            .authorize::<CurrentAleo, _>(
                &private_key,
                program.id(),
                function_name,
                inputs_native.iter(),
                &mut StdRng::from_entropy(),
            )
            .map_err(|err| err.to_string())?;

        let (response, _, _, _) = process
            .execute::<CurrentAleo, _>(authorization, &mut StdRng::from_entropy())
            .map_err(|err| err.to_string())?;

        //process.verify_execution(&execution).map_err(|_| "Failed to verify execution".to_string())?;

        let outputs = js_sys::Array::new_with_length(response.outputs().len() as u32);

        for (i, output) in response.outputs().iter().enumerate() {
            outputs.set(i as u32, wasm_bindgen::JsValue::from_str(&output.to_string()));
        }

        Ok(outputs)
    }

    #[wasm_bindgen]
    #[allow(clippy::too_many_arguments)]
    pub async fn execute(
        &self,
        program: String,
        function: String,
        inputs: Array,
        private_key: PrivateKey,
        fee: u64,
        fee_record: RecordPlaintext,
        submission_url: Option<String>,
    ) -> Result<Transaction, String> {
        let mut inputs_native = vec![];

        for input in inputs.to_vec().iter() {
            if let Some(input) = input.as_string() {
                inputs_native.push(input);
            } else {
                return Err("Invalid input - all inputs must be a string specifying the type".to_string());
            }
        }

        let mut process = ProcessNative::load_web().map_err(|_| "Failed to load the process".to_string())?;

        let program =
            ProgramNative::from_str(&program).map_err(|_| "The program ID provided was invalid".to_string())?;
        let function_name =
            IdentifierNative::from_str(&function).map_err(|_| "The function name provided was invalid".to_string())?;

        process.add_program(&program).map_err(|_| "Failed to add program".to_string())?;

        let authorization = process
            .authorize::<CurrentAleo, _>(
                &private_key,
                program.id(),
                function_name,
                inputs_native.iter(),
                &mut StdRng::from_entropy(),
            )
            .map_err(|err| err.to_string())?;

        let (_, execution, inclusion, _) = process
            .execute::<CurrentAleo, _>(authorization, &mut StdRng::from_entropy())
            .map_err(|err| err.to_string())?;

        let (assignments, global_state_root) = inclusion
            .prepare_execution_wasm(&execution, "https://vm.aleo.org/api")
            .await
            .map_err(|err| err.to_string())?;
        let execution = inclusion
            .prove_execution::<CurrentAleo, _>(execution, &assignments, global_state_root, &mut StdRng::from_entropy())
            .map_err(|err| err.to_string())?;

        // Execute the call to fee.
        let fee_record_native = RecordPlaintextNative::from_str(&fee_record.to_string()).unwrap();
        let (_, fee_transition, inclusion, _) = process
            .execute_fee::<CurrentAleo, _>(&private_key, fee_record_native, fee, &mut StdRng::from_entropy())
            .map_err(|err| err.to_string())?;

        // Prepare the assignments.
        let assignment = inclusion
            .prepare_fee_wasm(&fee_transition, "https://vm.aleo.org/api")
            .await
            .map_err(|err| err.to_string())?;

        let fee = inclusion
            .prove_fee::<CurrentAleo, _>(fee_transition, &assignment, &mut StdRng::from_entropy())
            .map_err(|err| err.to_string())?;

        let transaction = TransactionNative::from_execution(execution, Some(fee)).map_err(|err| err.to_string())?;

        if submission_url.is_some() {
            let client = reqwest::Client::new();
            client
                .post("https://vm.aleo.org/api/testnet3/transaction/broadcast")
                .json(&transaction)
                .send()
                .await
                .map_err(|err| err.to_string())?;
        }

        Ok(Transaction::from(transaction))
    }
}

impl Default for ProgramManager {
    fn default() -> Self {
        Self::new()
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
    fn test_program_manager() {
        let program_manager = ProgramManager::new();
        let private_key = PrivateKey::new();
        let inputs = js_sys::Array::new_with_length(2);
        inputs.set(0, wasm_bindgen::JsValue::from_str("5u32"));
        inputs.set(1, wasm_bindgen::JsValue::from_str("5u32"));
        let outputs = program_manager.run(HELLO_PROGRAM.to_string(), "main".to_string(), inputs, private_key).unwrap();
        console_log!("outputs: {:?}", outputs);
    }
}
