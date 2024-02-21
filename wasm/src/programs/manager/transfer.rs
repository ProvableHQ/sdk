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

use crate::{
    execute_fee,
    execute_program,
    log,
    process_inputs,
    OfflineQuery,
    PrivateKey,
    RecordPlaintext,
    Transaction,
};

use crate::types::native::{
    CurrentAleo,
    IdentifierNative,
    ProcessNative,
    ProgramNative,
    RecordPlaintextNative,
    TransactionNative,
};
use js_sys::Array;
use rand::{rngs::StdRng, SeedableRng};
use std::{ops::Add, str::FromStr};

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
        recipient: &str,
        transfer_type: &str,
        amount_record: Option<RecordPlaintext>,
        fee_credits: f64,
        fee_record: Option<RecordPlaintext>,
        url: Option<String>,
        transfer_proving_key: Option<ProvingKey>,
        transfer_verifying_key: Option<VerifyingKey>,
        fee_proving_key: Option<ProvingKey>,
        fee_verifying_key: Option<VerifyingKey>,
        offline_query: Option<OfflineQuery>,
    ) -> Result<Transaction, String> {
        log("Executing transfer program");
        let fee_microcredits = match &fee_record {
            Some(fee_record) => Self::validate_amount(fee_credits, fee_record, true)?,
            None => (fee_credits * 1_000_000.0) as u64,
        };
        let amount_microcredits = match &amount_record {
            Some(amount_record) => Self::validate_amount(amount_credits, amount_record, true)?,
            None => (amount_credits * 1_000_000.0) as u64,
        };

        log("Setup the program and inputs");
        let node_url = url.as_deref().unwrap_or(DEFAULT_URL);
        let program = ProgramNative::credits().unwrap().to_string();
        let rng = &mut StdRng::from_entropy();

        log("Transfer Type is:");
        log(transfer_type);

        let (transfer_type, inputs) = match transfer_type {
            "private" | "transfer_private" | "transferPrivate" => {
                if amount_record.is_none() {
                    return Err("Amount record must be provided for private transfers".to_string());
                }
                let inputs = Array::new_with_length(3);
                inputs.set(0u32, wasm_bindgen::JsValue::from_str(&amount_record.unwrap().to_string()));
                inputs.set(1u32, wasm_bindgen::JsValue::from_str(recipient));
                inputs.set(2u32, wasm_bindgen::JsValue::from_str(&amount_microcredits.to_string().add("u64")));
                ("transfer_private", inputs)
            }
            "private_to_public" | "privateToPublic" | "transfer_private_to_public" | "transferPrivateToPublic" => {
                if amount_record.is_none() {
                    return Err("Amount record must be provided for private transfers".to_string());
                }
                let inputs = Array::new_with_length(3);
                inputs.set(0u32, wasm_bindgen::JsValue::from_str(&amount_record.unwrap().to_string()));
                inputs.set(1u32, wasm_bindgen::JsValue::from_str(recipient));
                inputs.set(2u32, wasm_bindgen::JsValue::from_str(&amount_microcredits.to_string().add("u64")));
                ("transfer_private_to_public", inputs)
            }
            "public" | "transfer_public" | "transferPublic" => {
                let inputs = Array::new_with_length(2);
                inputs.set(0u32, wasm_bindgen::JsValue::from_str(recipient));
                inputs.set(1u32, wasm_bindgen::JsValue::from_str(&amount_microcredits.to_string().add("u64")));
                ("transfer_public", inputs)
            }
            "public_to_private" | "publicToPrivate" | "transfer_public_to_private" | "transferPublicToPrivate" => {
                let inputs = Array::new_with_length(2);
                inputs.set(0u32, wasm_bindgen::JsValue::from_str(recipient));
                inputs.set(1u32, wasm_bindgen::JsValue::from_str(&amount_microcredits.to_string().add("u64")));
                ("transfer_public_to_private", inputs)
            }
            _ => return Err("Invalid transfer type".to_string()),
        };

        let mut process_native = ProcessNative::load_web().map_err(|err| err.to_string())?;
        let process = &mut process_native;
        let fee_identifier = if fee_record.is_some() {
            IdentifierNative::from_str("fee_private").map_err(|e| e.to_string())?
        } else {
            IdentifierNative::from_str("fee_public").map_err(|e| e.to_string())?
        };
        let stack = process.get_stack("credits.aleo").map_err(|e| e.to_string())?;
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

        log("Executing transfer function");
        let (_, mut trace) = execute_program!(
            process,
            process_inputs!(inputs),
            &program,
            transfer_type,
            private_key,
            transfer_proving_key,
            transfer_verifying_key,
            rng
        );

        log("Preparing the inclusion proof for the transfer execution");
        if let Some(offline_query) = offline_query.as_ref() {
            trace.prepare_async(offline_query.clone()).await.map_err(|err| err.to_string())?;
        } else {
            let query = QueryNative::from(node_url);
            trace.prepare_async(query).await.map_err(|err| err.to_string())?;
        }

        log("Proving the transfer execution");
        let execution =
            trace.prove_execution::<CurrentAleo, _>("credits.aleo/transfer", rng).map_err(|e| e.to_string())?;
        let execution_id = execution.to_execution_id().map_err(|e| e.to_string())?;

        log("Verifying the transfer execution");
        process.verify_execution(&execution).map_err(|err| err.to_string())?;

        log("Executing the fee");
        let fee = execute_fee!(
            process,
            private_key,
            fee_record,
            fee_microcredits,
            node_url,
            fee_proving_key,
            fee_verifying_key,
            execution_id,
            rng,
            offline_query
        );

        log("Creating execution transaction for transfer");
        let transaction = TransactionNative::from_execution(execution, Some(fee)).map_err(|err| err.to_string())?;
        Ok(Transaction::from(transaction))
    }
}
