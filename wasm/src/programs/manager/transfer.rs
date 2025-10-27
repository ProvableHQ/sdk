// Copyright (C) 2019-2025 Provable Inc.
// This file is part of the Provable SDK library.

// The Provable SDK library is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// The Provable SDK library is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with the Provable SDK library. If not, see <https://www.gnu.org/licenses/>.

use super::*;

use crate::{
    OfflineQuery,
    PrivateKey,
    RecordPlaintext,
    SnapshotQuery,
    Transaction,
    calculate_minimum_fee,
    execute_fee,
    execute_program,
    latest_block_height,
    log,
    process_inputs,
    types::native::{
        CurrentAleo,
        CurrentNetwork,
        IdentifierNative,
        ProcessNative,
        ProgramNative,
        RecordPlaintextNative,
        TransactionNative,
    },
};
use snarkvm_algorithms::snark::varuna::VarunaVersion;
use snarkvm_console::prelude::{ConsensusVersion, Network};
use snarkvm_ledger_query::QueryTrait;
use snarkvm_synthesizer::prelude::{InclusionVersion, execution_cost};
use snarkvm_synthesizer_program::StackTrait;

use crate::types::native::{PrivateKeyNative, ViewKeyNative};
use rand::{SeedableRng, rngs::StdRng};
use std::{ops::Add, str::FromStr};
use wasm_bindgen::JsValue;

#[wasm_bindgen]
impl ProgramManager {
    /// Send credits from one Aleo account to another
    ///
    /// @param private_key The private key of the sender
    /// @param amount_credits The amount of credits to send
    /// @param recipient The recipient of the transaction
    /// @param transfer_type The type of the transfer (options: "private", "public", "private_to_public", "public_to_private")
    /// @param amount_record The record to fund the amount from
    /// @param priority_fee_credits The optional priority fee to be paid for the transaction
    /// @param fee_record The record to spend the fee from
    /// @param url The url of the Aleo network node to send the transaction to
    /// @param transfer_verifying_key (optional) Provide a verifying key to use for the transfer
    /// function
    /// @param fee_proving_key (optional) Provide a proving key to use for the fee execution
    /// @param fee_verifying_key (optional) Provide a verifying key to use for the fee execution
    /// @returns {Transaction}
    #[wasm_bindgen(js_name = buildTransferTransaction)]
    #[allow(clippy::too_many_arguments)]
    pub async fn transfer(
        private_key: &PrivateKey,
        amount_credits: f64,
        recipient: &str,
        transfer_type: &str,
        amount_record: Option<RecordPlaintext>,
        priority_fee_credits: f64,
        fee_record: Option<RecordPlaintext>,
        url: Option<String>,
        transfer_proving_key: Option<ProvingKey>,
        transfer_verifying_key: Option<VerifyingKey>,
        fee_proving_key: Option<ProvingKey>,
        fee_verifying_key: Option<VerifyingKey>,
        offline_query: Option<OfflineQuery>,
    ) -> Result<Transaction, String> {
        log("Executing transfer program");
        let amount_microcredits = (amount_credits * 1_000_000.0) as u64;
        if let Some(amount_record) = amount_record.as_ref() {
            log("Validating amount record");
            if amount_microcredits > amount_record.microcredits() {
                return Err("Amount record does not have enough credits".to_string());
            }
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
                let inputs = [
                    JsValue::from_str(&amount_record.unwrap().to_string()),
                    JsValue::from(recipient),
                    JsValue::from(&amount_microcredits.to_string().add("u64")),
                ]
                .into_iter()
                .collect::<js_sys::Array>();
                ("transfer_private", inputs)
            }
            "private_to_public" | "privateToPublic" | "transfer_private_to_public" | "transferPrivateToPublic" => {
                if amount_record.is_none() {
                    return Err("Amount record must be provided for private transfers".to_string());
                }
                let inputs = [
                    JsValue::from_str(&amount_record.unwrap().to_string()),
                    JsValue::from(recipient),
                    JsValue::from(&amount_microcredits.to_string().add("u64")),
                ]
                .into_iter()
                .collect::<js_sys::Array>();
                ("transfer_private_to_public", inputs)
            }
            "public" | "transfer_public" | "transferPublic" => {
                let inputs = [JsValue::from(recipient), JsValue::from(&amount_microcredits.to_string().add("u64"))]
                    .into_iter()
                    .collect::<js_sys::Array>();
                ("transfer_public", inputs)
            }
            "public_as_signer" | "transfer_public_as_signer" | "transferPublicAsSigner" => {
                let inputs = [JsValue::from(recipient), JsValue::from(&amount_microcredits.to_string().add("u64"))]
                    .into_iter()
                    .collect::<js_sys::Array>();
                ("transfer_public_as_signer", inputs)
            }
            "public_to_private" | "publicToPrivate" | "transfer_public_to_private" | "transferPublicToPrivate" => {
                let inputs = [JsValue::from(recipient), JsValue::from(&amount_microcredits.to_string().add("u64"))]
                    .into_iter()
                    .collect::<js_sys::Array>();
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
            rng,
            1
        );

        log("Preparing the inclusion proof for the transfer execution");
        let latest_height = if let Some(offline_query) = offline_query.as_ref() {
            trace.prepare_async(offline_query).await.map_err(|err| err.to_string())?;
            offline_query.current_block_height().map_err(|e| e.to_string())?
        } else {
            let credits = ProgramNative::credits().unwrap();
            let function_name = IdentifierNative::from_str(transfer_type).unwrap();
            let view_key =
                ViewKeyNative::try_from(PrivateKeyNative::from(private_key)).map_err(|err| err.to_string())?;
            let query = SnapshotQuery::try_from_inputs(node_url, &credits, &function_name, &view_key, &inputs.to_vec())
                .await
                .map_err(|err| err.to_string())?;
            trace.prepare_async(&query).await.map_err(|err| err.to_string())?;
            query.current_block_height().map_err(|e| e.to_string())?
        };

        log("Proving the transfer execution");
        let locator = format!("credits.aleo/{transfer_type}");
        let execution =
            trace.prove_execution::<CurrentAleo, _>(&locator, VarunaVersion::V2, rng).map_err(|e| e.to_string())?;
        let execution_id = execution.to_execution_id().map_err(|e| e.to_string())?;

        log("Verifying the transfer execution");
        let consensus_version =
            <CurrentNetwork as Network>::CONSENSUS_VERSION(latest_height).map_err(|err| err.to_string())?;
        let inclusion_upgrade_height =
            <CurrentNetwork as Network>::INCLUSION_UPGRADE_HEIGHT().map_err(|err| err.to_string())?;
        let inclusion_version =
            if latest_height >= inclusion_upgrade_height { InclusionVersion::V1 } else { InclusionVersion::V0 };
        process
            .verify_execution(consensus_version, VarunaVersion::V2, inclusion_version, &execution)
            .map_err(|err| err.to_string())?;

        // Calculate the minimum execution fee.
        log("Calculating the minimum execution fee");
        let minimum_execution_cost = calculate_minimum_fee!(offline_query, node_url, process, &execution);

        // Check to see if the fee record has enough microcredits to pay for the deployment.
        let priority_fee_microcredits = (priority_fee_credits * 1_000_000.0) as u64;
        Self::validate_fee_record(&fee_record, minimum_execution_cost, priority_fee_microcredits)?;

        log("Executing the fee");
        let fee = execute_fee!(
            process,
            private_key,
            fee_record,
            priority_fee_microcredits,
            node_url,
            fee_proving_key,
            fee_verifying_key,
            execution_id,
            rng,
            offline_query,
            minimum_execution_cost
        );

        log("Creating execution transaction for transfer");
        let transaction = TransactionNative::from_execution(execution, Some(fee)).map_err(|err| err.to_string())?;
        Ok(Transaction::from(transaction))
    }
}
