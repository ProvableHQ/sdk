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

use crate::types::native::CurrentNetwork;
use crate::types::native::{ProgramIDNative, IdentifierNative, RecordPlaintextNative};
use anyhow::{anyhow, bail, Result};
use futures::future::join_all;
use indexmap::IndexMap;
use wasm_bindgen::JsValue;
use serde::{Deserialize, Serialize};
use snarkvm_console::{
    network::Network,
    program::{Identifier, ProgramID, StatePath},
    types::Field,
};
use snarkvm_ledger_query::QueryTrait;
use std::str::FromStr;

/// A snapshot-based query object used to pin the block height, state root,
/// and state paths to a single ledger view during online execution.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct SnapshotQuery {
    block_height: u32,
    state_paths: IndexMap<Field<CurrentNetwork>, StatePath<CurrentNetwork>>,
    state_root: <CurrentNetwork as Network>::StateRoot,
}

impl SnapshotQuery {
    /// Construct an empty snapshot query with a chosen `(block_height, state_root)`
    pub fn new(block_height: u32, state_root: &str) -> anyhow::Result<Self> {
        let state_root = <CurrentNetwork as Network>::StateRoot::from_str(state_root)
            .map_err(|e| anyhow::anyhow!(e))?;
        Ok(Self { block_height, state_paths: IndexMap::new(), state_root })
    }

    /// Add or update the fixed block height
    pub fn set_block_height(&mut self, block_height: u32) {
        self.block_height = block_height;
    }

    /// Insert one `(commitment -> state_path)` pair (both as strings)
    pub fn add_state_path(&mut self, commitment: &str, state_path: &str) -> anyhow::Result<()> {
        let commitment = Field::from_str(commitment).map_err(|e| anyhow::anyhow!(e))?;
        let state_path = StatePath::from_str(state_path).map_err(|e| anyhow::anyhow!(e))?;
        self.state_paths.insert(commitment, state_path);
        Ok(())
    }

    /// Build a snapshot query directly from inputs.
    ///
    /// Steps:
    /// 1) Parse JS inputs, detect record plaintexts (heuristic: contains "_nonce"),
    ///    and compute their commitments via `to_commitment(program_id, record_name, view_key_field)`
    /// 2) Take a snapshot `(state_root, block_height)`.
    /// 3) Fetch all state paths **concurrently** for those commitments (anchored to that snapshot).
    /// 4) Return a populated `SnapshotQuery`.
    ///
    /// Notes:
    /// - `record_name` must be the concrete name expected by the function (e.g. "credits").
    /// - `view_key_field` is the sender's record view key as a `Field<Network>`.
    pub async fn try_from_inputs(
        node_url: &str,
        program_id: &ProgramID<CurrentNetwork>,
        record_name: &Identifier<CurrentNetwork>,
        view_key_field: Field<CurrentNetwork>,
        js_inputs: &[JsValue],
    ) -> Result<Self> {
        // 1) Extract commitments from inputs.
        let commitments = collect_commitments_from_inputs(program_id, record_name, view_key_field, js_inputs)?;

        // Fast path: if there are no record inputs, still pin a snapshot (height + root) for consistency.
        let (snap_root, snap_height) = snapshot_head(node_url).await?;
        let mut query = SnapshotQuery::new(snap_height, &snap_root)?;


        if commitments.is_empty() {
            return Ok(query);
        }

        // 2) Fetch state paths concurrently (anchored to the chosen snapshot).
        // If your node cannot fetch-at-root, you can fetch plain paths, parse their embedded roots,
        // and ensure they're consistent; otherwise re-snapshot and retry.
        // Precompute owned strings to avoid borrowing temporaries into async futures.
        let cm_strings: Vec<String> = commitments.iter().map(|c| c.to_string()).collect();
        let root_str = snap_root.clone();
        let futs = cm_strings
            .iter()
            .map(|cm_s| fetch_state_path_at_root(node_url, cm_s.as_str(), root_str.as_str()));
        let results = join_all(futs).await;

        // 3) Insert all paths; verify consistency against the pinned root.
        for (cm, res) in commitments.iter().zip(results.into_iter()) {
            let sp_str = res?;
            // Optional safety: parse and ensure the path's root matches the pinned root.
            let sp = StatePath::<CurrentNetwork>::from_str(&sp_str).map_err(|e| anyhow!(e.to_string()))?;
            let path_root = sp.global_state_root().to_string();
            if path_root != snap_root {
                // Strategy: bail and let caller retry; or resnapshot + refetch here.
                bail!("State path root mismatch: expected {}, got {}", snap_root, path_root);
            }
            query.add_state_path(&cm.to_string(), &sp_str)?;
        }

        Ok(query)
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

    fn get_state_path_for_commitment(
        &self,
        commitment: &Field<CurrentNetwork>,
    ) -> Result<StatePath<CurrentNetwork>> {
        self.state_paths
            .get(commitment)
            .cloned()
            .ok_or_else(|| anyhow!("State path not found for commitment"))
    }

    async fn get_state_path_for_commitment_async(
        &self,
        commitment: &Field<CurrentNetwork>,
    ) -> Result<StatePath<CurrentNetwork>> {
        self.state_paths
            .get(commitment)
            .cloned()
            .ok_or_else(|| anyhow!("State path not found for commitment"))
    }

    fn current_block_height(&self) -> Result<u32> {
        Ok(self.block_height)
    }

    async fn current_block_height_async(&self) -> Result<u32> {
        Ok(self.block_height)
    }
}

/* --------------------------- internal helpers --------------------------- */

/// Heuristic: detect plaintext records from JS inputs and compute commitments.
fn collect_commitments_from_inputs(
    program_id: &ProgramIDNative,
    record_name: &IdentifierNative,
    view_key_field: Field<CurrentNetwork>,
    js_inputs: &[JsValue],
) -> anyhow::Result<Vec<Field<CurrentNetwork>>> {
    let mut out = Vec::new();

    for js in js_inputs {
        if let Some(s) = js.as_string() {
            // Quick filter: record plaintexts include a `_nonce` field.
            if !s.contains("_nonce") {
                continue;
            }
            // Try parse as a plaintext record. Skip if not a record.
            if let Ok(rec) = RecordPlaintextNative::from_str(&s) {
                let cm = rec.to_commitment(program_id, record_name, &view_key_field);
                out.push(cm?);
            }
        }
    }
    Ok(out)
}

/// Return a single `(state_root_string, block_height)` snapshot.
/// TODO: replace with real node client calls.
async fn snapshot_head(_node_url: &str) -> Result<(String, u32)> {
    // Example (pseudo):
    // let head = client.latest_head(_node_url).await?;
    // Ok((head.state_root, head.block_height))
    Err(anyhow!("snapshot_head() not implemented"))
}

/// Fetch a `StatePath` (as string) for `commitment` anchored to `state_root`
/// TODO: replace with real node client call and ensure it returns a path at the requested root
async fn fetch_state_path_at_root(_node_url: &str, _commitment: &str, _state_root: &str) -> anyhow::Result<String> {
    // Example (pseudo):
    // client.state_path_at_root(_node_url, _commitment, _state_root).await
    Err(anyhow!("fetch_state_path_at_root() not implemented"))
}
