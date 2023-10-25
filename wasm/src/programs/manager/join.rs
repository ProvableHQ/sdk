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
    /// @param join_proving_key (optional) Provide a proving key to use for the join function
    /// @param join_verifying_key (optional) Provide a verifying key to use for the join function
    /// @param fee_proving_key (optional) Provide a proving key to use for the fee execution
    /// @param fee_verifying_key (optional) Provide a verifying key to use for the fee execution
    /// @returns {Transaction | Error} Transaction object
    #[wasm_bindgen(js_name = buildJoinTransaction)]
    #[allow(clippy::too_many_arguments)]
    pub async fn join(
        private_key: &PrivateKey,
        record_1: RecordPlaintext,
        record_2: RecordPlaintext,
        fee_credits: f64,
        fee_record: Option<RecordPlaintext>,
        url: String,
        join_proving_key: Option<ProvingKey>,
        join_verifying_key: Option<VerifyingKey>,
        fee_proving_key: Option<ProvingKey>,
        fee_verifying_key: Option<VerifyingKey>,
    ) -> Result<Transaction, String> {
        log("Executing join program");
        let fee_microcredits = Self::microcredits(fee_credits, &fee_record)?;

        let program = ProgramNative::credits().unwrap().to_string();

        let state = ProgramState::new(program, None).await?;

        let (state, fee_record, join_proving_key, join_verifying_key) =
            state.insert_proving_keys(fee_record, join_proving_key, join_verifying_key).await?;

        let inputs = vec![record_1.to_string(), record_2.to_string()];

        let (state, mut execute) = state
            .execute_program("join".to_string(), inputs, private_key.clone(), join_proving_key, join_verifying_key)
            .await?;

        execute.set_locator("credits.aleo/join".to_string());

        let (state, execution) = state.prove_execution(execute, url.clone()).await?;

        let (_state, fee) = state
            .execute_fee(
                execution.execution_id()?,
                url,
                private_key.clone(),
                fee_microcredits,
                fee_record,
                fee_proving_key,
                fee_verifying_key,
            )
            .await?;

        execution.into_transaction(Some(fee)).await
    }
}
