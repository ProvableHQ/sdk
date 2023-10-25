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

use crate::{log, types::ProgramNative, PrivateKey, RecordPlaintext, Transaction};

use std::ops::Add;

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
        url: String,
        split_proving_key: Option<ProvingKey>,
        split_verifying_key: Option<VerifyingKey>,
    ) -> Result<Transaction, String> {
        log("Executing split program");
        let amount_microcredits = Self::validate_amount(split_amount, &amount_record, false)?;

        let program = ProgramNative::credits().unwrap().to_string();

        let state = ProgramState::new(program, None).await?;

        let inputs = vec![amount_record.to_string(), amount_microcredits.to_string().add("u64")];

        let (state, mut execute) = state
            .execute_program("split".to_string(), inputs, private_key.clone(), split_proving_key, split_verifying_key)
            .await?;

        execute.set_locator("credits.aleo/split".to_string());

        let (_state, execution) = state.prove_execution(execute, url).await?;

        execution.into_transaction(None).await
    }
}
