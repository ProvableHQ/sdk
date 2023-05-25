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
    pub async fn join(
        &mut self,
        private_key: PrivateKey,
        record_1: RecordPlaintext,
        record_2: RecordPlaintext,
        fee_credits: f64,
        fee_record: RecordPlaintext,
        url: String,
        cache: bool,
    ) -> Result<Transaction, String> {
        log("Creating join transaction");
        if fee_credits <= 0.0 {
            return Err("Fee must be greater than zero".to_string());
        }

        // Convert fee to microcredits and check that the fee record has enough credits to pay it
        let fee_microcredits = (fee_credits * 1_000_000.0f64) as u64;
        if fee_record.microcredits() < fee_microcredits {
            return Err("Fee record does not have enough credits to pay the specified fee".to_string());
        }

        // Setup the program and inputs
        let program = ProgramNative::credits().unwrap().to_string();
        let inputs = Array::new_with_length(2);
        inputs.set(0u32, wasm_bindgen::JsValue::from_str(&record_1.to_string()));
        inputs.set(1u32, wasm_bindgen::JsValue::from_str(&record_2.to_string()));

        // Execute the program
        let ((_, execution, inclusion, _), process) =
            execute_program!(self, inputs, program, "join", private_key, cache);

        // Create the inclusion proof for the execution
        let execution = inclusion_proof!(inclusion, execution, url);

        // Verify the execution
        process.verify_execution::<true>(&execution).map_err(|e| e.to_string())?;

        // Execute the call to fee and create the inclusion proof for it
        let fee = fee_inclusion_proof!(process, private_key, fee_record, fee_microcredits, url);

        // Verify the fee
        process.verify_fee(&fee).map_err(|e| e.to_string())?;

        // Create the transaction
        log("Creating execution transaction for join");
        let transaction = TransactionNative::from_execution(execution, Some(fee)).map_err(|err| err.to_string())?;

        Ok(Transaction::from(transaction))
    }
}
