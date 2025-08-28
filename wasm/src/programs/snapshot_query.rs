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

/// A snapshot-based query object used to pin the block height, state root, and state paths to a single ledger view during online execution.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct SnapshotQuery {
    block_height: u32,
    state_paths: IndexMap<FieldNative, StatePathNative>,
    state_root: <CurrentNetwork as Network>::StateRoot,
}

impl SnapshotQuery {
    /// Construct an empty snapshot query with a chosen `(block_height, state_root)`
    pub fn new(block_height: u32, state_root: <CurrentNetwork as Network>::StateRoot) -> Self {
        Self { block_height, state_paths: IndexMap::new(), state_root }
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
                    // Detect if the string contains a nonce to indicate it's a plaintext record.
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
                        let record_name = match input.value_type() {
                            &ValueTypeNative::Record(record_name) => record_name,
                            _ => return None,
                        };

                        // Compute the commitment.
                        record.to_commitment(program_id, &record_name, &record_view_key).ok()
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
        let max_attempts = 3;
        let mut attempts = 0;

        let (latest_height, statepaths) = loop {
            match futures::try_join!(
                latest_block_height(node_url),
                get_statepaths_from_stateroot(node_url, commitments),
            ) {
                Ok((height, statepaths)) => break (height, statepaths),
                Err(e) => {
                    attempts += 1;
                    log(&format!(
                        "Failed to fetch latest block height and statepaths, attempt {attempts}/{max_attempts}..."
                    ));
                    if attempts >= max_attempts {
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
        let max_attempts = 5;

        loop {
            match futures::try_join!(latest_block_height(node_url), latest_stateroot(node_url),) {
                Ok((height, state_root)) => return Ok((height, state_root)),
                Err(e) => {
                    attempts += 1;
                    if attempts >= max_attempts {
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
        Ok(self.state_root)
    }

    fn get_state_path_for_commitment(&self, commitment: &FieldNative) -> Result<StatePathNative> {
        self.state_paths.get(commitment).cloned().ok_or_else(|| anyhow!("State path not found for commitment"))
    }

    async fn get_state_path_for_commitment_async(&self, commitment: &FieldNative) -> Result<StatePathNative> {
        self.state_paths.get(commitment).cloned().ok_or_else(|| anyhow!("State path not found for commitment"))
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
        self.get_state_paths_for_commitments(commitments)
    }

    fn current_block_height(&self) -> Result<u32> {
        Ok(self.block_height)
    }

    async fn current_block_height_async(&self) -> Result<u32> {
        Ok(self.block_height)
    }
}
