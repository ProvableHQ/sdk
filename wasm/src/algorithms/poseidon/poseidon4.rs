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

use crate::{
    Field,
    Group,
    Scalar,
    from_wasm_field_array,
    types::native::{FieldNative, Poseidon4Native},
};
use snarkvm_console::algorithms::{Hash, HashMany, HashToGroup, HashToScalar};

use js_sys::Array;
use wasm_bindgen::{convert::TryFromJsValue, prelude::*};

#[wasm_bindgen]
pub struct Poseidon4(Poseidon4Native);

#[wasm_bindgen]
impl Poseidon4 {
    /// Create a Poseidon hasher with an input rate of 4.
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self(Poseidon4Native::setup("AleoPoseidon4").expect("Failed to set up Poseidon2"))
    }

    /// Create a Poseidon hasher with an input rate of 4 and a custom domain separator.
    pub fn setup(domain_separator: &str) -> Result<Self, String> {
        Poseidon4Native::setup(domain_separator)
            .map(Self)
            .map_err(|e| format!("Failed to set up BHP1024 with domain separator {domain_separator}: {e}"))
    }

    /// Returns the Poseidon hash with an input rate of 4.
    pub fn hash(&self, input: Array) -> Result<Field, String> {
        let input = from_wasm_field_array!(input, Field)?;
        self.0.hash(&input).map(Field::from).map_err(|e| e.to_string())
    }

    /// Returns the extended Poseidon hash with an input rate of 4.
    #[wasm_bindgen(js_name = "hashMany")]
    pub fn hash_many(&self, input: Array, num_outputs: u16) -> Result<Array, String> {
        let array = Array::new();
        let input = from_wasm_field_array!(input, Field)?;
        self.0.hash_many(&input, num_outputs).into_iter().for_each(|field| {
            array.push(&JsValue::from(Field::from(field)));
        });
        Ok(array)
    }

    /// Returns the Poseidon hash with an input rate of 4 on the scalar field.
    #[wasm_bindgen(js_name = "hashToScalar")]
    pub fn hash_to_scalar(&self, input: Array) -> Result<Scalar, String> {
        let input = from_wasm_field_array!(input, Field)?;
        self.0.hash_to_scalar(&input).map(Scalar::from).map_err(|e| e.to_string())
    }

    /// Returns the Poseidon hash with an input rate of 4 on the affine curve.
    #[wasm_bindgen(js_name = "hashToGroup")]
    pub fn hash_to_group(&self, input: Array) -> Result<Group, String> {
        let input = from_wasm_field_array!(input, Field)?;
        self.0.hash_to_group(&input).map(Group::from).map_err(|e| e.to_string())
    }
}

impl Default for Poseidon4 {
    fn default() -> Self {
        Self::new()
    }
}
