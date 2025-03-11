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

use crate::{
    Field,
    Group,
    Scalar,
    from_wasm_object_array,
    types::native::{FieldNative, Poseidon8Native},
};
use snarkvm_console::algorithms::{Hash, HashToGroup, HashToScalar};

use js_sys::Array;
use wasm_bindgen::{convert::TryFromJsValue, prelude::*};

#[wasm_bindgen]
pub struct Poseidon8(Poseidon8Native);

#[wasm_bindgen]
impl Poseidon8 {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self(Poseidon8Native::setup("AleoPoseidon8").expect("Failed to set up Poseidon8"))
    }

    /// Hash an array of fields.
    pub fn hash(&self, input: Array) -> Result<Field, String> {
        let input = from_wasm_object_array!(input, Field)?;
        self.0.hash(&input).map(|field| Field::from(field)).map_err(|e| e.to_string())
    }

    /// Hash to a scalar.
    pub fn hash_to_scalar(&self, input: Array) -> Result<Scalar, String> {
        let input = from_wasm_object_array!(input, Field)?;
        self.0.hash_to_scalar(&input).map(|scalar| Scalar::from(scalar)).map_err(|e| e.to_string())
    }

    /// Hash to group.
    pub fn hash_to_group(&self, input: Array) -> Result<Group, String> {
        let input = from_wasm_object_array!(input, Field)?;
        self.0.hash_to_group(&input).map(|group| Group::from(group)).map_err(|e| e.to_string())
    }
}
