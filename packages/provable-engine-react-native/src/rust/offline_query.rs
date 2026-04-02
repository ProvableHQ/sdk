use indexmap::IndexMap;
use serde::{Deserialize, Serialize};
use crate::{ensure_offline_query_storage, ffi, get_next_id, bytes_success_result, bytes_error_result, bool_success_result, bool_error_result};
use crate::types::CurrentNetwork;
use crate::types::native::{FieldNative, StatePathNative};
use std::str::FromStr;
use snarkvm_ledger_query::QueryTrait;
use snarkvm_console::prelude::Error;
use anyhow::anyhow;
use async_trait::async_trait;

/// An offline query object used to insert the global state root and state paths needed to create
/// a valid inclusion proof offline.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct OfflineQuery {
    block_height: u32,
    // Store as strings to avoid tight coupling to snarkvm types in mobile builds
    state_paths: IndexMap<String, String>,
    state_root: String,
}

impl OfflineQuery {
    /// Creates a new offline query object. The state root is required to be passed in as a string
    pub fn new(block_height: u32, state_root: &str) -> Result<OfflineQuery, String> {
        Ok(Self {
            block_height,
            state_paths: IndexMap::new(),
            state_root: state_root.to_string(),
        })
    }

    /// Add a new block height to the offline query object.
    pub fn add_block_height(&mut self, block_height: u32) {
        self.block_height = block_height;
    }

    /// Add a new state path to the offline query object.
    pub fn add_state_path(&mut self, commitment: &str, state_path: &str) -> Result<(), String> {
        self.state_paths.insert(commitment.to_string(), state_path.to_string());
        Ok(())
    }

    /// Get a json string representation of the offline query object.
    pub fn to_json_string(&self) -> String {
        serde_json::to_string(&self).unwrap()
    }

    /// Create an offline query object from a json string representation.
    pub fn from_json_string(s: &str) -> Result<OfflineQuery, String> {
        serde_json::from_str(s).map_err(|e| e.to_string())
    }

    /// Convenience getter for current block height like in the web SDK.
    pub fn current_block_height(&self) -> Result<u32, String> {
        Ok(self.block_height)
    }
}

/// Implement the query trait for offline preparation of inclusion proofs.
#[async_trait(?Send)]
impl QueryTrait<CurrentNetwork> for OfflineQuery {
    fn current_block_height(&self) -> Result<u32, Error> {
        Ok(self.block_height)
    }

    fn current_state_root(&self) -> Result<<CurrentNetwork as snarkvm_console::prelude::Network>::StateRoot, Error> {
        <<CurrentNetwork as snarkvm_console::prelude::Network>::StateRoot as FromStr>::from_str(&self.state_root).map_err(|e| anyhow!(e.to_string()))
    }

    fn get_state_path_for_commitment(
        &self,
        commitment: &FieldNative,
    ) -> Result<StatePathNative, Error> {
        let key = commitment.to_string();
        let Some(state_path_string) = self.state_paths.get(&key) else {
            return Err(anyhow!("Missing state path for commitment {}", key));
        };
        StatePathNative::from_str(state_path_string).map_err(|e| anyhow!(e.to_string()))
    }

    fn get_state_paths_for_commitments(
        &self,
        commitments: &[FieldNative],
    ) -> Result<Vec<StatePathNative>, Error> {
        commitments
            .iter()
            .map(|c| self.get_state_path_for_commitment(c))
            .collect()
    }

    async fn current_state_root_async(&self) -> Result<<CurrentNetwork as snarkvm_console::prelude::Network>::StateRoot, anyhow::Error> {
        self.current_state_root().map_err(|e| anyhow::anyhow!(e.to_string()))
    }

    async fn get_state_path_for_commitment_async(
        &self,
        commitment: &FieldNative,
    ) -> Result<StatePathNative, anyhow::Error> {
        self.get_state_path_for_commitment(commitment).map_err(|e| anyhow::anyhow!(e.to_string()))
    }

    async fn get_state_paths_for_commitments_async(
        &self,
        commitments: &[FieldNative],
    ) -> Result<Vec<StatePathNative>, anyhow::Error> {
        self.get_state_paths_for_commitments(commitments).map_err(|e| anyhow::anyhow!(e.to_string()))
    }

    async fn current_block_height_async(&self) -> Result<u32, anyhow::Error> {
        self.current_block_height().map_err(|e| anyhow::anyhow!(e.to_string()))
    }
}

// FFI helpers for OfflineQuery using JSON UTF-8 bytes
pub fn offline_query_from_bytes(bytes: Vec<u8>) -> ffi::HandleResult {
    match String::from_utf8(bytes)
        .map_err(|e| e.to_string())
        .and_then(|s| OfflineQuery::from_json_string(&s))
    {
        Ok(query) => {
            let id = get_next_id();
            let storage = ensure_offline_query_storage();
            let mut map = storage.lock().unwrap();
            map.insert(id, query);
            ffi::HandleResult { success: true, handle: id, error: String::new() }
        }
        Err(e) => ffi::HandleResult { success: false, handle: 0, error: e },
    }
}

pub fn offline_query_to_bytes(handle: &ffi::OfflineQueryHandle) -> ffi::BytesResult {
    let storage = ensure_offline_query_storage();
    let map = storage.lock().unwrap();
    if let Some(query) = map.get(&handle.id) {
        let json = query.to_json_string();
        bytes_success_result(json.into_bytes())
    } else {
        bytes_error_result("Invalid offline query handle".to_string())
    }
}

pub fn destroy_offline_query(handle: &ffi::OfflineQueryHandle) {
    let storage = ensure_offline_query_storage();
    let mut map = storage.lock().unwrap();
    map.remove(&handle.id);
}

pub fn offline_query_from_string(string: String) -> ffi::HandleResult {
    match OfflineQuery::from_json_string(&string) {
        Ok(query) => {
            let id = get_next_id();
            let storage = ensure_offline_query_storage();
            let mut map = storage.lock().unwrap();
            map.insert(id, query);
            ffi::HandleResult { success: true, handle: id, error: String::new() }
        }
        Err(e) => ffi::HandleResult { success: false, handle: 0, error: e },
    }
}

pub fn offline_query_add_block_height(handle: &ffi::OfflineQueryHandle, height: f64) -> ffi::BoolResult {
    let storage = ensure_offline_query_storage();
    let mut map = storage.lock().unwrap();
    if let Some(query) = map.get_mut(&handle.id) {
        query.add_block_height(height as u32);
        bool_success_result(true)
    } else {
        bool_error_result("Invalid offline query handle".to_string())
    }
}

pub fn offline_query_add_state_path(handle: &ffi::OfflineQueryHandle, commitment: String, state_path: String) -> ffi::BoolResult {
    let storage = ensure_offline_query_storage();
    let mut map = storage.lock().unwrap();
    if let Some(query) = map.get_mut(&handle.id) {
        match query.add_state_path(&commitment, &state_path) {
            Ok(_) => bool_success_result(true),
            Err(e) => bool_error_result(e),
        }
    } else {
        bool_error_result("Invalid offline query handle".to_string())
    }
}

// Note: This OfflineQuery now implements QueryTrait for offline inclusion preparation.