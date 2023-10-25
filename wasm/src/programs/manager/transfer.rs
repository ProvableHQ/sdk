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
    log,
    types::{ProgramNative},
    PrivateKey,
    RecordPlaintext,
    Transaction,
};

use std::{ops::Add};

#[wasm_bindgen]
impl ProgramManager {
    /// Send credits from one Aleo account to another
    ///
    /// @param private_key The private key of the sender
    /// @param amount_credits The amount of credits to send
    /// @param recipient The recipient of the transaction
    /// @param transfer_type The type of the transfer (options: "private", "public", "private_to_public", "public_to_private")
    /// @param amount_record The record to fund the amount from
    /// @param fee_credits The amount of credits to pay as a fee
    /// @param fee_record The record to spend the fee from
    /// @param url The url of the Aleo network node to send the transaction to
    /// @param transfer_verifying_key (optional) Provide a verifying key to use for the transfer
    /// function
    /// @param fee_proving_key (optional) Provide a proving key to use for the fee execution
    /// @param fee_verifying_key (optional) Provide a verifying key to use for the fee execution
    /// @returns {Transaction | Error}
    #[wasm_bindgen(js_name = buildTransferTransaction)]
    #[allow(clippy::too_many_arguments)]
    pub async fn transfer(
        private_key: &PrivateKey,
        amount_credits: f64,
        recipient: String,
        transfer_type: &str,
        amount_record: Option<RecordPlaintext>,
        fee_credits: f64,
        fee_record: Option<RecordPlaintext>,
        url: String,
        transfer_proving_key: Option<ProvingKey>,
        transfer_verifying_key: Option<VerifyingKey>,
        fee_proving_key: Option<ProvingKey>,
        fee_verifying_key: Option<VerifyingKey>,
    ) -> Result<Transaction, String> {
        log("Executing transfer program");
        let fee_microcredits = Self::microcredits(fee_credits, &fee_record)?;
        let amount_microcredits = Self::microcredits(amount_credits, &amount_record)?;

        log("Setup the program and inputs");
        let program = ProgramNative::credits().unwrap().to_string();

        log("Transfer Type is:");
        log(transfer_type);

        let mut inputs = vec![];

        let transfer_type = match transfer_type {
            "private" | "transfer_private" | "transferPrivate" => {
                if amount_record.is_none() {
                    return Err("Amount record must be provided for private transfers".to_string());
                }

                inputs.push(amount_record.unwrap().to_string());
                inputs.push(recipient);
                inputs.push(amount_microcredits.to_string().add("u64"));

                "transfer_private"
            }
            "private_to_public" | "privateToPublic" | "transfer_private_to_public" | "transferPrivateToPublic" => {
                if amount_record.is_none() {
                    return Err("Amount record must be provided for private transfers".to_string());
                }

                inputs.push(amount_record.unwrap().to_string());
                inputs.push(recipient);
                inputs.push(amount_microcredits.to_string().add("u64"));

                "transfer_private_to_public"
            }
            "public" | "transfer_public" | "transferPublic" => {
                inputs.push(recipient);
                inputs.push(amount_microcredits.to_string().add("u64"));

                "transfer_public"
            }
            "public_to_private" | "publicToPrivate" | "transfer_public_to_private" | "transferPublicToPrivate" => {
                inputs.push(recipient);
                inputs.push(amount_microcredits.to_string().add("u64"));

                "transfer_public_to_private"
            }
            _ => return Err("Invalid transfer type".to_string()),
        };

        let state = ProgramState::new(program, None).await?;

        let (state, fee_record, fee_proving_key, fee_verifying_key) = state.insert_proving_keys(
            fee_record,
            fee_proving_key,
            fee_verifying_key,
        ).await?;

        let (state, mut execute) = state.execute_program(
            transfer_type.to_string(),
            inputs,
            private_key.clone(),
            transfer_proving_key,
            transfer_verifying_key,
        ).await?;

        execute.set_locator("credits.aleo/transfer".to_string());

        let (state, execution) = state.prove_execution(execute, url.clone()).await?;

        let (_state, fee) = state.execute_fee(
            execution.execution_id()?,
            url,
            private_key.clone(),
            fee_microcredits,
            fee_record,
            fee_proving_key,
            fee_verifying_key,
        ).await?;

        execution.into_transaction(Some(fee)).await
    }
}
