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

use crate::{
    DEFAULT_URL,
    get_statepath_for_commitment,
    get_statepaths_for_commitments,
    latest_block_height,
    latest_stateroot,
    log,
    types::native::{
        CurrentNetwork,
        FieldNative,
        IdentifierNative,
        ProgramNative,
        RecordPlaintextNative,
        StatePathNative,
        ValueTypeNative,
        ViewKeyNative,
    },
};
use anyhow::{Result, anyhow, bail, ensure};
use indexmap::IndexMap;
use serde::{Deserialize, Serialize};
use snarkvm_console::network::Network;
use snarkvm_ledger_query::QueryTrait;
use std::str::FromStr;
use wasm_bindgen::JsValue;

const MAX_QUERY_ATTEMPTS: usize = 3;

#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub enum Mode {
    REST,
    Local,
}

/// A snapshot-based query object used to pin the block height, state root, and state paths to a single ledger view during online execution.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct SnapshotQuery {
    block_height: u32,
    mode: Mode,
    state_paths: IndexMap<FieldNative, StatePathNative>,
    state_root: <CurrentNetwork as Network>::StateRoot,
}

impl SnapshotQuery {
    /// Construct an empty snapshot query with a chosen `(block_height, state_root)`
    pub fn new(block_height: u32, state_root: <CurrentNetwork as Network>::StateRoot) -> Self {
        Self { block_height, mode: Mode::Local, state_paths: IndexMap::new(), state_root }
    }

    /// Construct the snapshot query in REST mode.
    pub fn rest() -> Self {
        Self {
            block_height: 0,
            mode: Mode::REST,
            state_paths: IndexMap::new(),
            state_root: <CurrentNetwork as Network>::StateRoot::default(),
        }
    }

    /// Add or update the fixed block height
    pub fn set_block_height(&mut self, block_height: u32) {
        self.block_height = block_height;
    }

    /// Insert one `(commitment -> state_path)` pair (both as strings)
    pub fn add_state_path(&mut self, commitment: FieldNative, state_path: StatePathNative) {
        self.state_paths.insert(commitment, state_path);
    }

    /// Build a snapshot query directly from inputs.
    ///
    /// Steps:
    /// 1) Parse JS inputs, detect record plaintexts (heuristic: contains "_nonce"),
    ///    and compute their commitments via `to_commitment(program_id, record_name, view_key)`
    /// 2) If commitments exist, fetch all statepaths and the block height concurrently, and compose
    ///    the snapshot query. Else simply fetch the latest stateroot and block height concurrently and
    ///    return the qury.
    ///
    /// Notes:
    /// - `view_key` is the sender's record view key as a `Field<Network>`.
    pub async fn try_from_inputs(
        node_url: &str,
        program: &ProgramNative,
        function_id: &IdentifierNative,
        view_key: &ViewKeyNative,
        js_inputs: &[JsValue],
    ) -> Result<Self> {
        // 1) Extract commitments from inputs.
        let commitments = Self::collect_commitments_from_inputs(program, function_id, view_key, js_inputs)?;

        // 2) Build query from fetched state paths OR if empty, take a snapshot of the latest block height and state root.
        if commitments.is_empty() {
            let (latest_height, latest_stateroot) = Self::snapshot_stateroot(node_url).await?;
            Ok(SnapshotQuery::new(latest_height, latest_stateroot))
        } else {
            let (latest_height, commitments_and_statepaths) = Self::snapshot_statepaths(node_url, &commitments).await?;
            let stateroot = commitments_and_statepaths.first().unwrap().1.global_state_root();
            let mut query = SnapshotQuery::new(latest_height, stateroot);
            commitments_and_statepaths.into_iter().for_each(|(commitment, state_path)| {
                query.add_state_path(commitment, state_path);
            });
            Ok(query)
        }
    }

    /// Detect plaintext records in `js_inputs` and compute their commitments.
    pub fn collect_commitments_from_inputs(
        program: &ProgramNative,
        function_id: &IdentifierNative,
        view_key: &ViewKeyNative,
        js_inputs: &[JsValue],
    ) -> Result<Vec<FieldNative>> {
        // Collect the commitments from the inputs.
        let commitments = js_inputs
            .iter()
            .enumerate()
            .filter_map(|(index, js_value)| {
                if let Some(s) = js_value.as_string() {
                    // Detect if the string contains a nonce to indicate the input is a plaintext record.
                    if !s.contains("_nonce") {
                        return None;
                    };

                    // Attempt to parse the plaintext record and compute its commitment.
                    if let Ok(record) = RecordPlaintextNative::from_str(&s) {
                        // Compute all information necessary to compute the commitment.
                        let record_view_key = (*record.nonce() * **view_key).to_x_coordinate();
                        let program_id = program.id();
                        let function = program.get_function(function_id).ok()?;
                        let input = function.inputs().get_index(index)?;
                        match input.value_type() {
                            &ValueTypeNative::Record(record_name) => {
                                record.to_commitment(program_id, &record_name, &record_view_key).ok()
                            }
                            &ValueTypeNative::ExternalRecord(locator) => {
                                record.to_commitment(locator.program_id(), locator.resource(), &record_view_key).ok()
                            }
                            _ => None,
                        }
                    } else {
                        None
                    }
                } else {
                    None
                }
            })
            .collect::<Vec<_>>();
        Ok(commitments)
    }

    /// Attempt to fetch the latest block height and statepaths concurrently.
    pub async fn snapshot_statepaths(
        node_url: &str,
        commitments: &[FieldNative],
    ) -> Result<(u32, Vec<(FieldNative, StatePathNative)>)> {
        let mut attempts = 0;

        let (latest_height, statepaths) = loop {
            match futures::try_join!(
                latest_block_height(node_url),
                get_statepaths_for_commitments(node_url, commitments),
            ) {
                Ok((height, statepaths)) => break (height, statepaths),
                Err(e) => {
                    attempts += 1;
                    log(&format!(
                        "Failed to fetch latest block height and statepaths, attempt {attempts}/{MAX_QUERY_ATTEMPTS}..."
                    ));
                    if attempts >= MAX_QUERY_ATTEMPTS {
                        bail!("Failed to fetch latest block height and state root: {e}");
                    }
                }
            }
        };

        ensure!(
            statepaths.len() == commitments.len(),
            "Error: fetched fewer statepaths than commitments during inclusion proving."
        );

        Ok((latest_height, commitments.iter().cloned().zip(statepaths).collect()))
    }

    /// Attempt to fetch the latest block height and stateroot concurrently.
    pub async fn snapshot_stateroot(node_url: &str) -> Result<(u32, <CurrentNetwork as Network>::StateRoot)> {
        let mut attempts = 0;

        loop {
            match futures::try_join!(latest_block_height(node_url), latest_stateroot(node_url),) {
                Ok((height, state_root)) => return Ok((height, state_root)),
                Err(e) => {
                    attempts += 1;
                    log(&format!(
                        "Failed to fetch latest block height and stateroot, attempt {attempts}/{MAX_QUERY_ATTEMPTS}..."
                    ));
                    if attempts >= MAX_QUERY_ATTEMPTS {
                        bail!("Failed to fetch latest block height and state root: {}", e);
                    }
                }
            }
        }
    }
}

#[async_trait::async_trait(?Send)]
impl QueryTrait<CurrentNetwork> for SnapshotQuery {
    fn current_state_root(&self) -> Result<<CurrentNetwork as Network>::StateRoot> {
        Ok(self.state_root)
    }

    async fn current_state_root_async(&self) -> Result<<CurrentNetwork as Network>::StateRoot> {
        match self.mode {
            Mode::REST => latest_stateroot(DEFAULT_URL).await,
            Mode::Local => Ok(self.state_root),
        }
    }

    fn get_state_path_for_commitment(&self, commitment: &FieldNative) -> Result<StatePathNative> {
        self.state_paths.get(commitment).cloned().ok_or_else(|| anyhow!("State path not found for commitment"))
    }

    async fn get_state_path_for_commitment_async(&self, commitment: &FieldNative) -> Result<StatePathNative> {
        match self.mode {
            Mode::REST => get_statepath_for_commitment(DEFAULT_URL, commitment).await,
            Mode::Local => {
                self.state_paths.get(commitment).cloned().ok_or_else(|| anyhow!("State path not found for commitment"))
            }
        }
    }

    /// Returns a list of state paths for the given list of `commitments`.
    fn get_state_paths_for_commitments(&self, commitments: &[FieldNative]) -> Result<Vec<StatePathNative>> {
        let state_paths = commitments
            .iter()
            .filter_map(|commitment| self.state_paths.get(commitment).cloned())
            .collect::<Vec<StatePathNative>>();
        ensure!(
            state_paths.len() == commitments.len(),
            "Not all commitments found in stored state paths, please ensure the offline query object contains all commitments and statepaths required"
        );
        Ok(state_paths)
    }

    /// Returns a list of state paths for the given list of `commitments`.
    async fn get_state_paths_for_commitments_async(&self, commitments: &[FieldNative]) -> Result<Vec<StatePathNative>> {
        match self.mode {
            Mode::REST => get_statepaths_for_commitments(DEFAULT_URL, commitments).await,
            Mode::Local => self.get_state_paths_for_commitments(commitments),
        }
    }

    fn current_block_height(&self) -> Result<u32> {
        Ok(self.block_height)
    }

    async fn current_block_height_async(&self) -> Result<u32> {
        match self.mode {
            Mode::REST => latest_block_height(DEFAULT_URL).await,
            Mode::Local => Ok(self.block_height),
        }
    }
}

#[cfg(test)]

mod tests {
    use super::*;
    use crate::{
        test::{PROVABLE_API, TOKEN_REGISTRY_RECORD_OWNER_VIEW_KEY, TOKEN_REGISTRY_RECORD_V1},
        types::native::ProgramIDNative,
        utilities::{rest::get_network, test::programs::EXTERNAL_RECORDS_DEMO},
    };
    use snarkvm_synthesizer_program::Program;
    use wasm_bindgen_test::*;

    #[wasm_bindgen_test]
    async fn test_snapshot_stateroot() {
        let (height, stateroot) = SnapshotQuery::snapshot_stateroot(PROVABLE_API).await.unwrap();
        console_log!("stateroot: {:?}", stateroot);
        assert!(height > 10_000_000);
    }

    #[wasm_bindgen_test]
    async fn test_snapshot_statepaths() {
        if get_network() == "testnet" {
            let commitment_0 = "3955342727272311631397274863769364826445372300002295001500327687918144964187field";
            let commitment_1 = "360335536692650403149180907504772813391262210443170533323444515646946440826field";
            let commitments =
                vec![FieldNative::from_str(commitment_0).unwrap(), FieldNative::from_str(commitment_1).unwrap()];
            let (height, state_paths) =
                SnapshotQuery::snapshot_statepaths("https://api.provable.com/v2", &commitments).await.unwrap();
            assert_eq!(state_paths.len(), 2);
            let (commitment_0_field, state_path_0) = &state_paths[0];
            let (commitment_1_field, state_path_1) = &state_paths[1];
            assert_eq!(commitment_0_field.to_string().as_str(), commitment_0);
            assert_eq!(commitment_1_field.to_string().as_str(), commitment_1);
            assert_eq!(state_path_0.global_state_root(), state_path_1.global_state_root());
            assert!(height > 10_000_000);
        }
    }

    #[wasm_bindgen_test]
    fn test_correct_commitment_computation() {
        let record = RecordPlaintextNative::from_str(TOKEN_REGISTRY_RECORD_V1).unwrap();
        let view_key = ViewKeyNative::from_str(TOKEN_REGISTRY_RECORD_OWNER_VIEW_KEY).unwrap();
        let program_id = ProgramIDNative::from_str("token_registry.aleo").unwrap();
        let record_name = IdentifierNative::from_str("Token").unwrap();
        let rvk = (*record.nonce() * *view_key).to_x_coordinate();
        let commitment = record.to_commitment(&program_id, &record_name, &rvk).unwrap();
        let program = Program::from_str(EXTERNAL_RECORDS_DEMO).unwrap();
        let function_id = IdentifierNative::from_str("deposit_private_token").unwrap();

        let input_1 = JsValue::from_str("aleo1s3ws5tra87fjycnjrwsjcrnw2qxr8jfqqdugnf0xzqqw29q9m5pqem2u4t");
        let input_2 = JsValue::from_str("5u128");
        let input_3 = JsValue::from_str(TOKEN_REGISTRY_RECORD_V1);
        let inputs = vec![input_1, input_2, input_3];

        let commitments =
            SnapshotQuery::collect_commitments_from_inputs(&program, &function_id, &view_key, &inputs).unwrap();
        assert_eq!(commitments[0], commitment);
    }
}
