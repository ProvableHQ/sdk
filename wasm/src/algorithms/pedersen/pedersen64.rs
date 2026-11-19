// Copyright (C) 2019-2026 Provable Inc.
// This file is part of the Provable SDK library.

// Licensed under the MIT License. See the LICENSE.md file in the project root
// or <https://opensource.org/licenses/MIT> for the full license text.

use crate::{Field, Group, Scalar, from_js_typed_array, types::native::Pedersen64Native};
use snarkvm_console::algorithms::{Commit, CommitUncompressed, Hash};

use js_sys::Array;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Pedersen64(Pedersen64Native);

#[wasm_bindgen]
impl Pedersen64 {
    /// Create a Pedersen hasher for a given (up to) 64-bit input.
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self(Pedersen64Native::setup("AleoPedersen64"))
    }

    /// Create a Pedersen64 hasher for a given (up to) 64-bit input with a custom domain separator.
    pub fn setup(domain_separator: &str) -> Self {
        Self(Pedersen64Native::setup(domain_separator))
    }

    /// Returns the Pedersen hash for a given (up to) 64-bit input.
    pub fn hash(&self, input: Array) -> Result<Field, String> {
        let input = from_js_typed_array!(input, as_bool, "boolean")?;
        self.0.hash(&input).map(Field::from).map_err(|e| e.to_string())
    }

    /// Returns a Pedersen commitment for the given (up to) 64-bit input and randomizer.
    pub fn commit(&self, input: Array, randomizer: Scalar) -> Result<Field, String> {
        let input = from_js_typed_array!(input, as_bool, "boolean")?;
        self.0.commit(&input, &randomizer).map(Field::from).map_err(|e| e.to_string())
    }

    /// Returns a Pedersen commitment for the given (up to) 64-bit input and randomizer.
    #[wasm_bindgen(js_name = "commitToGroup")]
    pub fn commit_to_group(&self, input: Array, randomizer: Scalar) -> Result<Group, String> {
        let input = from_js_typed_array!(input, as_bool, "boolean")?;
        self.0.commit_uncompressed(&input, &randomizer).map(Group::from).map_err(|e| e.to_string())
    }
}

impl Default for Pedersen64 {
    fn default() -> Self {
        Self::new()
    }
}
