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
use snarkvm_console::{network::Network, program::StatePath, types::Field};
use snarkvm_ledger_query::QueryTrait;

use anyhow::anyhow;
use async_trait::async_trait;
use indexmap::IndexMap;
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::wasm_bindgen;

use std::str::FromStr;

/// A snapshot-based query object used to pin the block height, state root,
/// and state paths to a single ledger view during online execution.
#[wasm_bindgen]
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct SnapshotQuery {
    block_height: u32,
    state_paths: IndexMap<Field<CurrentNetwork>, StatePath<CurrentNetwork>>,
    state_root: <CurrentNetwork as Network>::StateRoot,
}

#[wasm_bindgen]
impl SnapshotQuery {
    #[wasm_bindgen(constructor)]
    pub fn new(block_height: u32, state_root: &str) -> Result<SnapshotQuery, String> {
        let state_root = <CurrentNetwork as Network>::StateRoot::from_str(state_root)
            .map_err(|e| e.to_string())?;
        Ok(Self {
            block_height,
            state_paths: IndexMap::new(),
            state_root,
        })
    }

    #[wasm_bindgen(js_name = "addBlockHeight")]
    pub fn add_block_height(&mut self, block_height: u32) {
        self.block_height = block_height;
    }

    #[wasm_bindgen(js_name = "addStatePath")]
    pub fn add_state_path(&mut self, commitment: &str, state_path: &str) -> Result<(), String> {
        let commitment = Field::from_str(commitment).map_err(|e| e.to_string())?;
        let state_path = StatePath::from_str(state_path).map_err(|e| e.to_string())?;
        self.state_paths.insert(commitment, state_path);
        Ok(())
    }

    #[wasm_bindgen(js_name = "toString")]
    #[allow(clippy::inherent_to_string)]
    pub fn to_string(&self) -> String {
        serde_json::to_string(&self).unwrap()
    }

    #[wasm_bindgen(js_name = "fromString")]
    pub fn from_string(s: &str) -> Result<SnapshotQuery, String> {
        serde_json::from_str(s).map_err(|e| e.to_string())
    }
}

#[async_trait(?Send)]
impl QueryTrait<CurrentNetwork> for SnapshotQuery {
    fn current_state_root(&self) -> anyhow::Result<<CurrentNetwork as Network>::StateRoot> {
        Ok(self.state_root)
    }

    async fn current_state_root_async(&self) -> anyhow::Result<<CurrentNetwork as Network>::StateRoot> {
        Ok(self.state_root)
    }

    fn get_state_path_for_commitment(
        &self,
        commitment: &Field<CurrentNetwork>,
    ) -> anyhow::Result<StatePath<CurrentNetwork>> {
        self.state_paths
            .get(commitment)
            .cloned()
            .ok_or(anyhow!("State path not found for commitment"))
    }

    async fn get_state_path_for_commitment_async(
        &self,
        commitment: &Field<CurrentNetwork>,
    ) -> anyhow::Result<StatePath<CurrentNetwork>> {
        self.state_paths
            .get(commitment)
            .cloned()
            .ok_or(anyhow!("State path not found for commitment"))
    }

    fn current_block_height(&self) -> anyhow::Result<u32> {
        Ok(self.block_height)
    }

    async fn current_block_height_async(&self) -> anyhow::Result<u32> {
        Ok(self.block_height)
    }
}
