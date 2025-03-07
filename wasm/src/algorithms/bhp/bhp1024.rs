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

use crate::{Field, Scalar, types::native::BHP1024Native};
use snarkvm_console::algorithms::{Commit, Hash};

use js_sys::Array;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct BHP1024(BHP1024Native);

#[wasm_bindgen]
impl BHP1024 {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self(BHP1024Native::setup("AleoBHP1024").expect("Failed to set up BHP1024"))
    }

    /// Hash an array of booleans.
    pub fn hash(&self, input: Array) -> Result<Field, String> {
        // Convert an array of booleans to a vector of booleans, failing if any values aren't booleans.
        let input = input
            .to_vec()
            .iter()
            .map(|x| x.as_bool().ok_or_else(|| "Input must be a boolean array".to_string()))
            .collect::<Result<Vec<bool>, String>>()?;

        self.0.hash(&input).map(|field| Field::from(field)).map_err(|e| e.to_string())
    }

    /// Commit to an array of booleans.
    pub fn commit(&self, input: Array, randomizer: Scalar) -> Result<Field, String> {
        // Convert an array of booleans to a vector of booleans, failing if any values aren't booleans.
        let input = input
            .to_vec()
            .iter()
            .map(|x| x.as_bool().ok_or_else(|| "Input must be a boolean array".to_string()))
            .collect::<Result<Vec<bool>, String>>()?;

        self.0.commit(&input, &randomizer).map(|field| Field::from(field)).map_err(|e| e.to_string())
    }
}
