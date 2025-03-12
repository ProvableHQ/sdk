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

use crate::{Field, Group, Scalar, from_js_typed_array, types::native::Pedersen128Native};
use snarkvm_console::algorithms::{Commit, CommitUncompressed, Hash};

use js_sys::Array;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Pedersen128(Pedersen128Native);

#[wasm_bindgen]
impl Pedersen128 {
    /// Create a Pedersen hasher for a given (up to) 128-bit input.
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self(Pedersen128Native::setup("AleoPedersen128"))
    }

    /// Create a Pedersen hasher for a given (up to) 128-bit input with a custom domain separator.
    pub fn setup(domain_separator: &str) -> Self {
        Self(Pedersen128Native::setup(domain_separator))
    }

    /// Returns the Pedersen hash for a given (up to) 128-bit input.
    pub fn hash(&self, input: Array) -> Result<Field, String> {
        let input = from_js_typed_array!(input, as_bool, "boolean")?;
        self.0.hash(&input).map(|field| Field::from(field)).map_err(|e| e.to_string())
    }

    /// Returns a Pedersen commitment for the given (up to) 128-bit input and randomizer.
    pub fn commit(&self, input: Array, randomizer: Scalar) -> Result<Field, String> {
        let input = from_js_typed_array!(input, as_bool, "boolean")?;
        self.0.commit(&input, &randomizer).map(|field| Field::from(field)).map_err(|e| e.to_string())
    }

    /// Returns a Pedersen commitment for the given (up to) 128-bit input and randomizer.
    #[wasm_bindgen(js_name = "commitToGroup")]
    pub fn commit_to_group(&self, input: Array, randomizer: Scalar) -> Result<Group, String> {
        let input = from_js_typed_array!(input, as_bool, "boolean")?;
        self.0.commit_uncompressed(&input, &randomizer).map(|field| Group::from(field)).map_err(|e| e.to_string())
    }
}
