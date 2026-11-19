// Copyright (C) 2019-2026 Provable Inc.
// This file is part of the Provable SDK library.

// Licensed under the MIT License. See the LICENSE.md file in the project root
// or <https://opensource.org/licenses/MIT> for the full license text.

use crate::{Field, Group, Scalar, from_js_typed_array, types::native::BHP512Native};
use snarkvm_console::algorithms::{Commit, CommitUncompressed, Hash};

use js_sys::Array;
use snarkvm_console::account::HashUncompressed;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct BHP512(BHP512Native);

#[wasm_bindgen]
impl BHP512 {
    /// Create a BHP hasher with an input size of 512 bits.
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self(BHP512Native::setup("AleoBHP512").expect("Failed to set up BHP512"))
    }

    /// Create a BHP hasher with an input size of 512 bits with a custom domain separator.
    pub fn setup(domain_separator: &str) -> Result<Self, String> {
        BHP512Native::setup(domain_separator)
            .map(Self)
            .map_err(|e| format!("Failed to set up BHP512 with domain separator {domain_separator}: {e}"))
    }

    /// Returns the BHP hash with an input hasher of 512 bits.
    pub fn hash(&self, input: Array) -> Result<Field, String> {
        let input = from_js_typed_array!(input, as_bool, "boolean")?;
        self.0.hash(&input).map(Field::from).map_err(|e| e.to_string())
    }

    /// Returns a BHP hash with an input hasher of 512 bits.
    #[wasm_bindgen(js_name = "hashToGroup")]
    pub fn hash_to_group(&self, input: Array) -> Result<Group, String> {
        let input = from_js_typed_array!(input, as_bool, "boolean")?;
        self.0.hash_uncompressed(&input).map(Group::from).map_err(|e| e.to_string())
    }

    /// Returns a BHP commitment with an input hasher of 512 bits and randomizer.
    pub fn commit(&self, input: Array, randomizer: Scalar) -> Result<Field, String> {
        let input = from_js_typed_array!(input, as_bool, "boolean")?;
        self.0.commit(&input, &randomizer).map(Field::from).map_err(|e| e.to_string())
    }

    /// Returns a BHP commitment with an input hasher of 512 bits and randomizer.
    #[wasm_bindgen(js_name = "commitToGroup")]
    pub fn commit_to_group(&self, input: Array, randomizer: Scalar) -> Result<Group, String> {
        let input = from_js_typed_array!(input, as_bool, "boolean")?;
        self.0.commit_uncompressed(&input, &randomizer).map(Group::from).map_err(|e| e.to_string())
    }
}

impl Default for BHP512 {
    fn default() -> Self {
        Self::new()
    }
}
