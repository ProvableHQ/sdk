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

//! A QueryTrait implementation that delegates all network calls to JS callback
//! functions. This allows the JS transport layer to handle HTTP requests
//! (including mTLS, custom agents, and timeouts) while WASM handles computation.
//!
//! Used by ProgramManager to ensure all state fetching during proof building
//! routes through the SDK's configurable transport.

use crate::types::native::{CurrentNetwork, FieldNative, StatePathNative};
use anyhow::{Result, anyhow};
use js_sys::{Array, Function, Promise};
use snarkvm_console::network::Network;
use snarkvm_ledger_query::QueryTrait;
use std::str::FromStr;
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::JsFuture;

/// A query implementation that delegates state fetching to JS callback functions.
///
/// Instead of making direct HTTP calls via reqwest, each QueryTrait method
/// calls a JS function that returns a Promise. The JS side handles the actual
/// network request through the configured transport.
#[wasm_bindgen]
pub struct CallbackQuery {
    get_state_root_fn: Function,
    get_state_paths_fn: Function,
    get_block_height_fn: Function,
}

#[wasm_bindgen]
impl CallbackQuery {
    /// Create a new CallbackQuery with JS callback functions.
    ///
    /// @param {Function} get_state_root A function that returns Promise<string> (the state root)
    /// @param {Function} get_state_paths A function that takes string[] (commitments) and returns Promise<string[]> (state paths)
    /// @param {Function} get_block_height A function that returns Promise<number> (the block height)
    #[wasm_bindgen(constructor)]
    pub fn new(get_state_root: Function, get_state_paths: Function, get_block_height: Function) -> CallbackQuery {
        CallbackQuery {
            get_state_root_fn: get_state_root,
            get_state_paths_fn: get_state_paths,
            get_block_height_fn: get_block_height,
        }
    }
}

/// Call a JS function that returns a Promise, await it, and return the JsValue.
async fn call_js_async(func: &Function, args: &[JsValue]) -> Result<JsValue> {
    let result = match args.len() {
        0 => func.call0(&JsValue::NULL),
        1 => func.call1(&JsValue::NULL, &args[0]),
        _ => {
            let js_args = Array::new();
            for arg in args {
                js_args.push(arg);
            }
            func.apply(&JsValue::NULL, &js_args)
        }
    };

    let promise = result.map_err(|e| anyhow!("JS callback invocation failed: {:?}", e))?;
    let js_promise = Promise::from(promise);
    JsFuture::from(js_promise).await.map_err(|e| anyhow!("JS callback Promise rejected: {:?}", e))
}

#[async_trait::async_trait(?Send)]
impl QueryTrait<CurrentNetwork> for CallbackQuery {
    fn current_state_root(&self) -> Result<<CurrentNetwork as Network>::StateRoot> {
        Err(anyhow!("CallbackQuery does not support synchronous state root access"))
    }

    async fn current_state_root_async(&self) -> Result<<CurrentNetwork as Network>::StateRoot> {
        let result = call_js_async(&self.get_state_root_fn, &[]).await?;
        let state_root_str =
            result.as_string().ok_or_else(|| anyhow!("State root callback did not return a string"))?;
        <CurrentNetwork as Network>::StateRoot::from_str(&state_root_str)
            .map_err(|e| anyhow!("Failed to parse state root: {}", e))
    }

    fn get_state_path_for_commitment(&self, _commitment: &FieldNative) -> Result<StatePathNative> {
        Err(anyhow!("CallbackQuery does not support synchronous state path access"))
    }

    async fn get_state_path_for_commitment_async(&self, commitment: &FieldNative) -> Result<StatePathNative> {
        let commitments_array = Array::new();
        commitments_array.push(&JsValue::from_str(&commitment.to_string()));

        let result = call_js_async(&self.get_state_paths_fn, &[commitments_array.into()]).await?;

        let paths_array = Array::from(&result);
        if paths_array.length() == 0 {
            return Err(anyhow!("State path callback returned empty array for commitment"));
        }

        let path_str = paths_array.get(0).as_string().ok_or_else(|| anyhow!("State path element is not a string"))?;
        StatePathNative::from_str(&path_str).map_err(|e| anyhow!("Failed to parse state path: {}", e))
    }

    fn get_state_paths_for_commitments(&self, _commitments: &[FieldNative]) -> Result<Vec<StatePathNative>> {
        Err(anyhow!("CallbackQuery does not support synchronous state paths access"))
    }

    async fn get_state_paths_for_commitments_async(&self, commitments: &[FieldNative]) -> Result<Vec<StatePathNative>> {
        if commitments.is_empty() {
            return Ok(vec![]);
        }

        let js_commitments = Array::new();
        for commitment in commitments {
            js_commitments.push(&JsValue::from_str(&commitment.to_string()));
        }

        let result = call_js_async(&self.get_state_paths_fn, &[js_commitments.into()]).await?;

        let paths_array = Array::from(&result);
        let mut state_paths = Vec::with_capacity(commitments.len());
        for i in 0..paths_array.length() {
            let path_str = paths_array
                .get(i)
                .as_string()
                .ok_or_else(|| anyhow!("State path element at index {} is not a string", i))?;
            let state_path = StatePathNative::from_str(&path_str)
                .map_err(|e| anyhow!("Failed to parse state path at index {}: {}", i, e))?;
            state_paths.push(state_path);
        }

        Ok(state_paths)
    }

    fn current_block_height(&self) -> Result<u32> {
        Err(anyhow!("CallbackQuery does not support synchronous block height access"))
    }

    async fn current_block_height_async(&self) -> Result<u32> {
        let result = call_js_async(&self.get_block_height_fn, &[]).await?;
        result.as_f64().map(|v| v as u32).ok_or_else(|| anyhow!("Block height callback did not return a number"))
    }
}
