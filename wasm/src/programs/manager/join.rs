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
    execute_fee,
    execute_program,
    get_process,
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
use std::str::FromStr;

#[wasm_bindgen]
impl ProgramManager {
    /// Join two records together to create a new record with an amount of credits equal to the sum
    /// of the credits of the two original records
    ///
    /// @param private_key The private key of the sender
    /// @param record_1 The first record to combine
    /// @param record_2 The second record to combine
    /// @param fee_credits The amount of credits to pay as a fee
    /// @param fee_record The record to spend the fee from
    /// @param url The url of the Aleo network node to send the transaction to
    /// @param cache Cache the proving and verifying keys in the ProgramManager memory. If this is
    /// set to `true` the keys synthesized (or passed in as optional parameters via the
    /// `join_proving_key` and `join_verifying_key` arguments) will be stored in the
    /// ProgramManager's memory and used for subsequent transactions. If this is set to `false` the
    /// proving and verifying keys will be deallocated from memory after the transaction is executed
    /// @param join_proving_key (optional) Provide a proving key to use for the join function
    /// @param join_verifying_key (optional) Provide a verifying key to use for the join function
    /// @param fee_proving_key (optional) Provide a proving key to use for the fee execution
    /// @param fee_verifying_key (optional) Provide a verifying key to use for the fee execution
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
        join_proving_key: Option<ProvingKey>,
        join_verifying_key: Option<VerifyingKey>,
        fee_proving_key: Option<ProvingKey>,
        fee_verifying_key: Option<VerifyingKey>,
    ) -> Result<Transaction, String> {
        log("Executing join program");
        let fee_microcredits = Self::validate_amount(fee_credits, &fee_record, true)?;

        log("Setup program and inputs");
        let program = ProgramNative::credits().unwrap().to_string();
        let inputs = Array::new_with_length(2);
        inputs.set(0u32, wasm_bindgen::JsValue::from_str(&record_1.to_string()));
        inputs.set(1u32, wasm_bindgen::JsValue::from_str(&record_2.to_string()));

        let mut new_process;
        let process = get_process!(self, cache, new_process);
        let stack = process.get_stack("credits.aleo").map_err(|e| e.to_string())?;
        let fee_identifier = IdentifierNative::from_str("fee").map_err(|e| e.to_string())?;
        if !stack.contains_proving_key(&fee_identifier) && fee_proving_key.is_some() && fee_verifying_key.is_some() {
            let fee_proving_key = fee_proving_key.clone().unwrap();
            let fee_verifying_key = fee_verifying_key.clone().unwrap();
            stack
                .insert_proving_key(&fee_identifier, ProvingKeyNative::from(fee_proving_key))
                .map_err(|e| e.to_string())?;
            stack
                .insert_verifying_key(&fee_identifier, VerifyingKeyNative::from(fee_verifying_key))
                .map_err(|e| e.to_string())?;
        }

        log("Executing the join function");
        let (_, mut trace) =
            execute_program!(process, inputs, program, "join", private_key, join_proving_key, join_verifying_key);

        log("Preparing inclusion proof for the join execution");
        trace.prepare_async::<CurrentBlockMemory, _>(&url).await.map_err(|err| err.to_string())?;

        log("Proving the join execution");
        let execution = trace
            .prove_execution::<CurrentAleo, _>("credits.aleo/join", &mut StdRng::from_entropy())
            .map_err(|e| e.to_string())?;
        let execution_id = execution.to_execution_id().map_err(|e| e.to_string())?;

        log("Verifying the join execution");
        process.verify_execution(&execution).map_err(|err| err.to_string())?;

        log("Executing the fee");
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

        log("Creating execution transaction for join");
        let transaction = TransactionNative::from_execution(execution, Some(fee)).map_err(|err| err.to_string())?;
        Ok(Transaction::from(transaction))
    }
}
