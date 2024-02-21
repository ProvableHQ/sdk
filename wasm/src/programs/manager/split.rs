// Copyright (C) 2019-2024 Aleo Systems Inc.
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

use crate::{execute_program, log, process_inputs, OfflineQuery, PrivateKey, RecordPlaintext, Transaction};

use crate::types::native::{CurrentAleo, IdentifierNative, ProcessNative, ProgramNative, TransactionNative};
use js_sys::Array;
use rand::{rngs::StdRng, SeedableRng};
use std::{ops::Add, str::FromStr};

#[wasm_bindgen]
impl ProgramManager {
    /// Split an Aleo credits record into two separate records. This function does not require a fee.
    ///
    /// @param private_key The private key of the sender
    /// @param split_amount The amount of the credit split. This amount will be subtracted from the
    /// value of the record and two new records will be created with the split amount and the remainder
    /// @param amount_record The record to split
    /// @param url The url of the Aleo network node to send the transaction to
    /// @param split_proving_key (optional) Provide a proving key to use for the split function
    /// @param split_verifying_key (optional) Provide a verifying key to use for the split function
    /// @returns {Transaction | Error} Transaction object
    #[wasm_bindgen(js_name = buildSplitTransaction)]
    #[allow(clippy::too_many_arguments)]
    pub async fn split(
        private_key: &PrivateKey,
        split_amount: f64,
        amount_record: RecordPlaintext,
        url: Option<String>,
        split_proving_key: Option<ProvingKey>,
        split_verifying_key: Option<VerifyingKey>,
        offline_query: Option<OfflineQuery>,
    ) -> Result<Transaction, String> {
        log("Executing split program");
        let amount_microcredits = Self::validate_amount(split_amount, &amount_record, false)?;

        log("Setup the program and inputs");
        let node_url = url.as_deref().unwrap_or(DEFAULT_URL);
        let program = ProgramNative::credits().unwrap().to_string();
        let inputs = Array::new_with_length(2u32);
        inputs.set(0u32, wasm_bindgen::JsValue::from_str(&amount_record.to_string()));
        inputs.set(1u32, wasm_bindgen::JsValue::from_str(&amount_microcredits.to_string().add("u64")));

        let mut process_native = ProcessNative::load_web().map_err(|err| err.to_string())?;
        let process = &mut process_native;
        let rng = &mut StdRng::from_entropy();

        log("Executing the split function");
        let (_, mut trace) = execute_program!(
            process,
            process_inputs!(inputs),
            &program,
            "split",
            private_key,
            split_proving_key,
            split_verifying_key,
            rng
        );

        log("Preparing the inclusion proof for the split execution");
        if let Some(offline_query) = offline_query.as_ref() {
            trace.prepare_async(offline_query.clone()).await.map_err(|err| err.to_string())?;
        } else {
            let query = QueryNative::from(node_url);
            trace.prepare_async(query).await.map_err(|err| err.to_string())?;
        }

        log("Proving the split execution");
        let execution =
            trace.prove_execution::<CurrentAleo, _>("credits.aleo/split", rng).map_err(|e| e.to_string())?;

        log("Verifying the split execution");
        process.verify_execution(&execution).map_err(|err| err.to_string())?;

        log("Creating execution transaction for split");
        let transaction = TransactionNative::from_execution(execution, None).map_err(|err| err.to_string())?;
        Ok(Transaction::from(transaction))
    }
}
