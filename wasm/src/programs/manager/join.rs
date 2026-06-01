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
    PrivateKey,
    QueryOption,
    RecordPlaintext,
    SnapshotQuery,
    Transaction,
    calculate_minimum_fee,
    execute_fee,
    execute_program,
    execution_stacks_for_execution,
    latest_block_height,
    log,
    process_inputs,
    types::native::{
        CurrentAleo,
        CurrentNetwork,
        IdentifierNative,
        PrivateKeyNative,
        ProcessNative,
        ProgramNative,
        RecordPlaintextNative,
        TransactionNative,
        ViewKeyNative,
    },
};
use snarkvm_algorithms::snark::varuna::VarunaVersion;
use snarkvm_console::prelude::Network;
use snarkvm_ledger_query::QueryTrait;
use snarkvm_synthesizer::prelude::{InclusionVersion, execution_cost};
use snarkvm_synthesizer_program::StackTrait;

use js_sys::Array;
use std::str::FromStr;

#[wasm_bindgen]
impl ProgramManager {
    /// Join two records together to create a new record with an amount of credits equal to the sum
    /// of the credits of the two original records
    ///
    /// @param private_key The private key of the sender
    /// @param record_1 The first record to combine
    /// @param record_2 The second record to combine
    /// @param priority_fee_credits The opptional priority fee to be paid for the transaction
    /// @param fee_record The record to spend the fee from
    /// @param url The url of the Aleo network node to send the transaction to
    /// @param join_proving_key (optional) Provide a proving key to use for the join function
    /// @param join_verifying_key (optional) Provide a verifying key to use for the join function
    /// @param fee_proving_key (optional) Provide a proving key to use for the fee execution
    /// @param fee_verifying_key (optional) Provide a verifying key to use for the fee execution
    /// @returns {Transaction} Transaction object
    #[wasm_bindgen(js_name = buildJoinTransaction)]
    #[allow(clippy::too_many_arguments)]
    pub async fn join(
        private_key: &PrivateKey,
        record_1: RecordPlaintext,
        record_2: RecordPlaintext,
        priority_fee_credits: f64,
        fee_record: Option<RecordPlaintext>,
        url: Option<String>,
        join_proving_key: Option<ProvingKey>,
        join_verifying_key: Option<VerifyingKey>,
        fee_proving_key: Option<ProvingKey>,
        fee_verifying_key: Option<VerifyingKey>,
        query: Option<QueryOption>,
    ) -> Result<Transaction, String> {
        log("Executing join program");
        let rng = &mut rand::rng();

        log("Setup program and inputs");
        let node_url = url.as_deref().unwrap_or(DEFAULT_URL);
        let program = ProgramNative::credits().unwrap().to_string();
        let inputs = Array::new_with_length(2);
        inputs.set(0u32, wasm_bindgen::JsValue::from_str(&record_1.to_string()));
        inputs.set(1u32, wasm_bindgen::JsValue::from_str(&record_2.to_string()));

        let mut process_native = ProcessNative::load_web().map_err(|err| err.to_string())?;
        let process = &mut process_native;

        let stack = process.get_stack("credits.aleo").map_err(|e| e.to_string())?;
        let fee_identifier = if fee_record.is_some() {
            IdentifierNative::from_str("fee_private").map_err(|e| e.to_string())?
        } else {
            IdentifierNative::from_str("fee_public").map_err(|e| e.to_string())?
        };
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
        let (_, mut trace) = execute_program!(
            process,
            process_inputs!(inputs),
            &program,
            "join",
            private_key,
            join_proving_key,
            join_verifying_key,
            rng,
            1
        );

        log("Preparing inclusion proof for the join execution");
        let latest_height = if let Some(ref query) = query {
            trace.prepare_async(query).await.map_err(|err| err.to_string())?;
            query.current_block_height_async().await.map_err(|e| e.to_string())?
        } else {
            let credits = ProgramNative::credits().unwrap();
            let function_name = IdentifierNative::from_str("join").unwrap();
            let view_key =
                ViewKeyNative::try_from(PrivateKeyNative::from(private_key)).map_err(|err| err.to_string())?;
            let q = SnapshotQuery::try_from_inputs(node_url, &credits, &function_name, &view_key, &inputs.to_vec())
                .await
                .map_err(|err| err.to_string())?;
            trace.prepare_async(&q).await.map_err(|err| err.to_string())?;
            q.current_block_height_async().await.map_err(|e| e.to_string())?
        };

        log("Proving the join execution");
        let execution = trace
            .prove_execution::<CurrentAleo, _>("credits.aleo/join", VarunaVersion::V2, rng)
            .map_err(|e| e.to_string())?;
        let execution_id = execution.to_execution_id().map_err(|e| e.to_string())?;

        log("Verifying the join execution");
        let consensus_version =
            <CurrentNetwork as Network>::CONSENSUS_VERSION(latest_height).map_err(|err| err.to_string())?;
        let inclusion_upgrade_height =
            <CurrentNetwork as Network>::INCLUSION_UPGRADE_HEIGHT().map_err(|err| err.to_string())?;
        let inclusion_version =
            if latest_height >= inclusion_upgrade_height { InclusionVersion::V1 } else { InclusionVersion::V0 };
        let execution_stacks = execution_stacks_for_execution(process, &execution)?;
        ProcessNative::verify_execution(
            consensus_version,
            VarunaVersion::V2,
            inclusion_version,
            &execution,
            &execution_stacks,
        )
        .map_err(|err| err.to_string())?;

        // Calculate the minimum execution fee.
        log("Calculating the minimum execution fee");
        let minimum_execution_cost = calculate_minimum_fee!(node_url, process, &execution, query);

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
            minimum_execution_cost,
            query
        );

        log("Creating execution transaction for join");
        let transaction = TransactionNative::from_execution(execution, Some(fee)).map_err(|err| err.to_string())?;
        Ok(Transaction::from(transaction))
    }
}
