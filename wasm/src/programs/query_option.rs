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

//! A unified query enum that wraps all supported query strategies behind a
//! single `QueryTrait` implementation. This allows WASM execution methods to
//! accept one `Option<QueryOption>` parameter instead of separate optional
//! parameters for each query type.

use crate::{
    CallbackQuery,
    OfflineQuery,
    types::native::{CurrentNetwork, FieldNative, StatePathNative},
};
use anyhow::Result;
use snarkvm_console::network::Network;
use snarkvm_ledger_query::QueryTrait;
use wasm_bindgen::prelude::*;

/// A unified query type that wraps either an OfflineQuery (pre-fetched state)
/// or a CallbackQuery (on-demand JS transport delegation).
///
/// Construct from JavaScript using the static factory methods:
/// - `QueryOption.offlineQuery(offlineQuery)` for pre-fetched state
/// - `QueryOption.callbackQuery(callbackQuery)` for on-demand JS callbacks
#[wasm_bindgen]
pub struct QueryOption {
    inner: QueryOptionInner,
}

enum QueryOptionInner {
    Offline(OfflineQuery),
    Callback(CallbackQuery),
}

#[wasm_bindgen]
impl QueryOption {
    /// Create a QueryOption from an OfflineQuery.
    #[wasm_bindgen(js_name = "offlineQuery")]
    pub fn from_offline(query: OfflineQuery) -> QueryOption {
        QueryOption { inner: QueryOptionInner::Offline(query) }
    }

    /// Create a QueryOption from a CallbackQuery.
    #[wasm_bindgen(js_name = "callbackQuery")]
    pub fn from_callback(query: CallbackQuery) -> QueryOption {
        QueryOption { inner: QueryOptionInner::Callback(query) }
    }
}

#[async_trait::async_trait(?Send)]
impl QueryTrait<CurrentNetwork> for QueryOption {
    fn current_state_root(&self) -> Result<<CurrentNetwork as Network>::StateRoot> {
        match &self.inner {
            QueryOptionInner::Offline(q) => q.current_state_root(),
            QueryOptionInner::Callback(q) => q.current_state_root(),
        }
    }

    async fn current_state_root_async(&self) -> Result<<CurrentNetwork as Network>::StateRoot> {
        match &self.inner {
            QueryOptionInner::Offline(q) => q.current_state_root_async().await,
            QueryOptionInner::Callback(q) => q.current_state_root_async().await,
        }
    }

    fn get_state_path_for_commitment(&self, commitment: &FieldNative) -> Result<StatePathNative> {
        match &self.inner {
            QueryOptionInner::Offline(q) => q.get_state_path_for_commitment(commitment),
            QueryOptionInner::Callback(q) => q.get_state_path_for_commitment(commitment),
        }
    }

    async fn get_state_path_for_commitment_async(&self, commitment: &FieldNative) -> Result<StatePathNative> {
        match &self.inner {
            QueryOptionInner::Offline(q) => q.get_state_path_for_commitment_async(commitment).await,
            QueryOptionInner::Callback(q) => q.get_state_path_for_commitment_async(commitment).await,
        }
    }

    fn get_state_paths_for_commitments(&self, commitments: &[FieldNative]) -> Result<Vec<StatePathNative>> {
        match &self.inner {
            QueryOptionInner::Offline(q) => q.get_state_paths_for_commitments(commitments),
            QueryOptionInner::Callback(q) => q.get_state_paths_for_commitments(commitments),
        }
    }

    async fn get_state_paths_for_commitments_async(&self, commitments: &[FieldNative]) -> Result<Vec<StatePathNative>> {
        match &self.inner {
            QueryOptionInner::Offline(q) => q.get_state_paths_for_commitments_async(commitments).await,
            QueryOptionInner::Callback(q) => q.get_state_paths_for_commitments_async(commitments).await,
        }
    }

    fn current_block_height(&self) -> Result<u32> {
        match &self.inner {
            QueryOptionInner::Offline(q) => q.current_block_height(),
            QueryOptionInner::Callback(q) => q.current_block_height(),
        }
    }

    async fn current_block_height_async(&self) -> Result<u32> {
        match &self.inner {
            QueryOptionInner::Offline(q) => q.current_block_height_async().await,
            QueryOptionInner::Callback(q) => q.current_block_height_async().await,
        }
    }
}
