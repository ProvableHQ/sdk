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
    inclusion_proof,
    log,
    types::{CurrentAleo, CurrentBlockMemory, IdentifierNative, ProcessNative, ProgramNative, TransactionNative},
    PrivateKey,
    RecordPlaintext,
    Transaction,
};

use js_sys::Array;
use rand::{rngs::StdRng, SeedableRng};
use std::{ops::Add, str::FromStr};

#[wasm_bindgen]
impl ProgramManager {
    /// Split an Aleo record into two separate records. This function does not require a fee.
    #[wasm_bindgen]
    pub async fn split(
        &mut self,
        private_key: PrivateKey,
        split_amount: f64,
        amount_record: RecordPlaintext,
        url: String,
        cache: bool,
    ) -> Result<Transaction, String> {
        log("Creating split transaction");
        if split_amount < 0.0 {
            return Err("Split amount must be greater than zero".to_string());
        }
        if split_amount as u64 >= amount_record.microcredits() {
            return Err("Split amount cannot be more than the amount in the record".to_string());
        }

        // Convert the amount to microcredits
        let amount_microcredits = (split_amount * 1_000_000.0) as u64;

        // Setup the program and inputs
        let program = ProgramNative::credits().unwrap().to_string();
        let inputs = Array::new_with_length(2u32);
        inputs.set(0u32, wasm_bindgen::JsValue::from_str(&amount_record.to_string()));
        inputs.set(1u32, wasm_bindgen::JsValue::from_str(&amount_microcredits.to_string().add("u64")));

        // Execute the program
        let ((_, execution, inclusion, _), process) =
            execute_program!(self, inputs, program, "split", private_key, cache);

        // Create the inclusion proof for the execution
        let execution = inclusion_proof!(inclusion, execution, url);

        // Verify the execution
        process.verify_execution::<true>(&execution).map_err(|e| e.to_string())?;

        // Create the transaction
        log("Creating execution transaction for split");
        let transaction = TransactionNative::from_execution(execution, None).map_err(|err| err.to_string())?;

        Ok(Transaction::from(transaction))
    }
}
