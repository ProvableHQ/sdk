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

use crate::types::FieldNative;
use snarkvm_console::prelude::{FromBytes, ToBytes};

use js_sys::Uint8Array;
use std::{ops::Deref, str::FromStr};
use wasm_bindgen::prelude::*;

/// Field element, exposed for use with Address field serialization.
#[wasm_bindgen]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Field(FieldNative);

#[wasm_bindgen]
impl Field {
    /// Creates a field element from its string representation.
    ///
    /// @param {string} field String representation of a field element.
    /// @returns {Field} The field element.
    #[wasm_bindgen(js_name = "fromString")]
    #[allow(clippy::should_implement_trait)]
    pub fn from_string(field: &str) -> Result<Field, String> {
        Ok(Self(FieldNative::from_str(field).map_err(|e| e.to_string())?))
    }

    /// Returns the string representation of the field element.
    ///
    /// @returns {string} String representation of the field element.
    #[wasm_bindgen(js_name = "toString")]
    #[allow(clippy::inherent_to_string)]
    pub fn to_string(&self) -> String {
        self.0.to_string()
    }

    /// Create a field element from a Uint8Array of little-endian bytes.
    ///
    /// @param {Uint8Array} bytes Little-endian byte array.
    /// @returns {Field} The field element.
    #[wasm_bindgen(js_name = "fromBytesLe")]
    pub fn from_bytes_le(bytes: &Uint8Array) -> Result<Field, String> {
        let bytes = bytes.to_vec();
        Ok(Field(FieldNative::from_bytes_le(&bytes).map_err(|e| e.to_string())?))
    }

    /// Encode the field element as a Uint8Array of little-endian bytes.
    ///
    /// @returns {Uint8Array} Little-endian byte array of the field element.
    #[wasm_bindgen(js_name = "toBytesLe")]
    pub fn to_bytes_le(&self) -> Result<Uint8Array, String> {
        let bytes = self.0.to_bytes_le().map_err(|e| e.to_string())?;
        Ok(Uint8Array::from(bytes.as_slice()))
    }
}

impl Deref for Field {
    type Target = FieldNative;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl From<FieldNative> for Field {
    fn from(native: FieldNative) -> Self {
        Self(native)
    }
}

impl From<&FieldNative> for Field {
    fn from(native: &FieldNative) -> Self {
        Self(*native)
    }
}

impl FromStr for Field {
    type Err = anyhow::Error;

    fn from_str(field: &str) -> Result<Self, Self::Err> {
        Ok(Self(FieldNative::from_str(field)?))
    }
}
