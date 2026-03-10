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

use super::ViewKey;
use crate::types::{Field, native::GraphKeyNative};

use core::{convert::TryFrom, fmt, ops::Deref, str::FromStr};
use wasm_bindgen::prelude::*;
use zeroize::Zeroize;

#[wasm_bindgen]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct GraphKey(GraphKeyNative);

#[wasm_bindgen]
impl GraphKey {
    /// Create a new graph key from a view key.
    ///
    /// @param {ViewKey} view_key View key
    /// @returns {GraphKey} Graph key
    pub fn from_view_key(view_key: &ViewKey) -> Self {
        Self::from(GraphKeyNative::try_from(**view_key).unwrap())
    }

    /// Create a new graph key from a string representation of a graph key
    ///
    /// @param {string} graph_key String representation of a graph key
    /// @returns {GraphKey} Graph key
    pub fn from_string(graph_key: &str) -> Self {
        Self::from_str(graph_key).unwrap()
    }

    /// Get a string representation of a graph key
    ///
    /// @returns {string} String representation of a graph key
    #[allow(clippy::inherent_to_string_shadow_display)]
    pub fn to_string(&self) -> String {
        self.0.to_string()
    }

    /// Get the sk_tag of the graph key. Used to determine ownership of records.
    pub fn sk_tag(&self) -> Field {
        Field::from(self.0.sk_tag())
    }
}

impl Drop for GraphKey {
    fn drop(&mut self) {
        // Safety: GraphKeyNative is Copy (no internal pointers or heap allocations),
        // composed of a single Field element, so byte-level zeroing is sound.
        // GraphKeyNative does not derive Zeroize, so we zero the raw bytes directly.
        let bytes: &mut [u8] = unsafe {
            core::slice::from_raw_parts_mut(
                &mut self.0 as *mut GraphKeyNative as *mut u8,
                core::mem::size_of::<GraphKeyNative>(),
            )
        };
        bytes.zeroize();
    }
}

impl Deref for GraphKey {
    type Target = GraphKeyNative;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl fmt::Display for GraphKey {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl FromStr for GraphKey {
    type Err = anyhow::Error;

    fn from_str(graph_key: &str) -> Result<Self, Self::Err> {
        Ok(Self(GraphKeyNative::from_str(graph_key)?))
    }
}

impl From<GraphKeyNative> for GraphKey {
    fn from(value: GraphKeyNative) -> Self {
        Self(value)
    }
}

impl From<GraphKey> for GraphKeyNative {
    fn from(value: GraphKey) -> Self {
        value.0
    }
}

impl From<&GraphKey> for GraphKeyNative {
    fn from(value: &GraphKey) -> Self {
        value.0
    }
}

impl From<&GraphKeyNative> for GraphKey {
    fn from(value: &GraphKeyNative) -> Self {
        Self(*value)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::PrivateKey;

    use wasm_bindgen_test::*;

    #[wasm_bindgen_test]
    fn test_graph_conversions() {
        // Derive a new account.
        let private_key = PrivateKey::new();
        let view_key = ViewKey::from_private_key(&private_key);

        // Test conversion from view key to graph key.
        let graph_key = GraphKey::from_view_key(&view_key);

        // Test to and from string.
        let graph_key_string = graph_key.to_string();
        let graph_key_from_string = GraphKey::from_string(&graph_key_string);
        assert_eq!(graph_key, graph_key_from_string);

        // Test conversion of sk_tag to string and back.
        let sk_tag = graph_key.sk_tag();
        let sk_tag_string = sk_tag.to_string();
        let sk_tag_from_string = Field::from_string(&sk_tag_string).unwrap();
        assert_eq!(sk_tag, sk_tag_from_string);
    }

    #[wasm_bindgen_test]
    fn test_zeroize_clears_graph_key_material() {
        let private_key = PrivateKey::new();
        let view_key = ViewKey::from_private_key(&private_key);
        let mut graph_key = GraphKey::from_view_key(&view_key);

        let ptr = &graph_key.0 as *const GraphKeyNative as *const u8;
        let size = core::mem::size_of::<GraphKeyNative>();

        // Verify the graph key contains non-zero data before zeroization.
        let bytes_before: Vec<u8> = unsafe { core::slice::from_raw_parts(ptr, size).to_vec() };
        assert!(bytes_before.iter().any(|&b| b != 0), "Graph key should contain non-zero data");

        // Zeroize the raw bytes (same operation our Drop impl performs).
        let bytes: &mut [u8] =
            unsafe { core::slice::from_raw_parts_mut(&mut graph_key.0 as *mut GraphKeyNative as *mut u8, size) };
        bytes.zeroize();

        // Verify all bytes are now zero.
        let bytes_after: Vec<u8> = unsafe { core::slice::from_raw_parts(ptr, size).to_vec() };
        assert!(bytes_after.iter().all(|&b| b == 0), "Graph key material should be zeroed");
    }
}
