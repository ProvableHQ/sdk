// Copyright (C) 2019-2025 Provable Inc.
// This file is part of the Aleo SDK library.

// The Aleo SDK library is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// The Aleo SDK library is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with the Aleo SDK library. If not, see <https://www.gnu.org/licenses/>.

use crate::{Field, Group, Scalar, from_js_typed_array, types::native::BHP768Native};
use snarkvm_console::algorithms::{Commit, CommitUncompressed, Hash};

use js_sys::Array;
use snarkvm_console::account::HashUncompressed;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct BHP768(BHP768Native);

#[wasm_bindgen]
impl BHP768 {
    /// Create a BHP hasher with an input size of 768 bits.
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self(BHP768Native::setup("AleoBHP768").expect("Failed to set up BHP768"))
    }

    /// Create a BHP hasher with an input size of 768 bits with a custom domain separator.
    pub fn setup(domain_separator: &str) -> Result<Self, String> {
        BHP768Native::setup(domain_separator)
            .map(|native| Self(native))
            .map_err(|e| format!("Failed to set up BHP768 with domain separator {}: {}", domain_separator, e))
    }

    /// Returns the BHP hash with an input hasher of 768 bits.
    pub fn hash(&self, input: Array) -> Result<Field, String> {
        let input = from_js_typed_array!(input, as_bool, "boolean")?;
        self.0.hash(&input).map(|field| Field::from(field)).map_err(|e| e.to_string())
    }

    /// Returns a BHP hash with an input hasher of 768 bits.
    #[wasm_bindgen(js_name = "hashToGroup")]
    pub fn hash_to_group(&self, input: Array) -> Result<Group, String> {
        let input = from_js_typed_array!(input, as_bool, "boolean")?;
        self.0.hash_uncompressed(&input).map(|group| Group::from(group)).map_err(|e| e.to_string())
    }

    /// Returns a BHP commitment with an input hasher of 768 bits and randomizer.
    pub fn commit(&self, input: Array, randomizer: Scalar) -> Result<Field, String> {
        let input = from_js_typed_array!(input, as_bool, "boolean")?;
        self.0.commit(&input, &randomizer).map(|field| Field::from(field)).map_err(|e| e.to_string())
    }

    /// Returns a BHP commitment with an input hasher of 768 bits and randomizer.
    #[wasm_bindgen(js_name = "commitToGroup")]
    pub fn commit_to_group(&self, input: Array, randomizer: Scalar) -> Result<Group, String> {
        let input = from_js_typed_array!(input, as_bool, "boolean")?;
        self.0.commit_uncompressed(&input, &randomizer).map(|field| Group::from(field)).map_err(|e| e.to_string())
    }
}
