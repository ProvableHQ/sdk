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

mod array;
mod bits;

pub mod encrypt;
pub use encrypt::EncryptionToolkit;

pub mod rest;
pub use rest::{get, get_network, get_statepaths_for_commitments, latest_block_height, latest_stateroot};

#[cfg(test)]
pub mod test;

/// Set test consensus version heights for testing.
///
/// @params {string | undefined} heights The block heights at which each consensus version applies. This input should be a simple csv list of block heights and there should be one number for each consensus version. If left undefined, the default test heights will be applied.
///
/// @example
/// import { setConsensusVersionHeights } from @provablehq/sdk;
///
/// Set the consensus version heights.
/// setConsensusVersionTestHeights("0,1,2,3,4,5,6,7,8,9");
#[wasm_bindgen::prelude::wasm_bindgen(js_name = setConsensusVersionTestHeights)]
pub fn set_consensus_version_test_heights_js(heights: Option<String>) -> js_sys::Array {
    // Call the underlying Rust function that returns [(ConsensusVersion, u32); N]
    let pairs = snarkvm_console::network::set_consensus_version_test_heights(heights);

    // Map to just the heights (u32) and convert to JS array
    pairs.iter().map(|(_, height)| wasm_bindgen::JsValue::from_f64(*height as f64)).collect::<js_sys::Array>()
}

#[cfg(test)]
mod tests {
    use super::*;
    use wasm_bindgen_test::*;

    #[wasm_bindgen_test]
    #[should_panic]
    fn test_set_genesis_block_non_zero_fails() {
        set_consensus_version_test_heights(Some("9,8,7,6,5,4,3,2,1,0".to_string()));
    }
}
