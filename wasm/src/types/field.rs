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

use crate::{Plaintext, types::native::{FieldNative, LiteralNative, PlaintextNative, Uniform}};
use snarkvm_console::prelude::{Double, FromBytes, One, Pow, ToBytes, Zero};
use std::ops::Deref;

use once_cell::sync::OnceCell;
use std::str::FromStr;
use js_sys::Uint8Array;
use wasm_bindgen::prelude::wasm_bindgen;

/// Field element.
#[wasm_bindgen]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Field(FieldNative);

#[wasm_bindgen]
impl Field {
    /// Creates a field object from a string representation of a field.
    #[wasm_bindgen(js_name = "fromString")]
    #[allow(clippy::should_implement_trait)]
    pub fn from_string(field: &str) -> Result<Field, String> {
        Ok(Self(FieldNative::from_str(field).map_err(|e| e.to_string())?))
    }

    /// Returns the string representation of the field.
    #[wasm_bindgen(js_name = "toString")]
    #[allow(clippy::inherent_to_string)]
    pub fn to_string(&self) -> String {
        self.0.to_string()
    }

    /// Create a field element from a Uint8Array of left endian bytes.
    ///
    /// @param {Uint8Array} Uint8Array of left endian bytes encoding a Field.
    /// @returns {Field}
    #[wasm_bindgen(js_name = fromBytesLe)]
    pub fn from_bytes_le(bytes: Uint8Array) -> Result<Field, String> {
        let bytes = bytes.to_vec();
        let transition = FieldNative::from_bytes_le(&bytes).map_err(|e| e.to_string())?;
        Ok(Field(transition))
    }

    /// Encode the field element as a Uint8Array of left endian bytes.
    ///
    /// @returns {Uint8Array} Uint8Array representation of the field element
    #[wasm_bindgen(js_name = toBytesLe)]
    pub fn to_bytes_le(&self) -> Result<Uint8Array, String> {
        let bytes = self.0.to_bytes_le().map_err(|e| e.to_string())?;
        Ok(Uint8Array::from(bytes.as_slice()))
    }

    /// Create a plaintext element from a group element.
    #[wasm_bindgen(js_name = "toPlaintext")]
    pub fn to_plaintext(&self) -> Plaintext {
        Plaintext::from(PlaintextNative::Literal(LiteralNative::Field(self.0), OnceCell::new()))
    }

    /// Generate a random field element.
    pub fn random() -> Field {
        let rng = &mut rand::thread_rng();
        Field(FieldNative::rand(rng))
    }

    /// Add two field elements.
    pub fn add(&self, other: &Field) -> Field {
        Field(self.0 + other.0)
    }

    /// Subtract two field elements.
    pub fn subtract(&self, other: &Field) -> Field {
        Field(self.0 - other.0)
    }

    /// Multiply two field elements.
    pub fn multiply(&self, other: &Field) -> Field {
        Field(self.0 * other.0)
    }

    /// Divide two field elements.
    pub fn divide(&self, other: &Field) -> Field {
        Field(self.0 / other.0)
    }

    /// Power of a field element.
    pub fn pow(&self, other: &Field) -> Field {
        Field(self.0.pow(other.0))
    }

    /// Invert the field element.
    pub fn inverse(&self) -> Field {
        Field(-self.0)
    }

    /// Get the zero element of the field.
    pub fn zero() -> Field {
        Field(FieldNative::zero())
    }

    /// Get the one element of the field.
    pub fn one() -> Field {
        Field(FieldNative::one())
    }

    /// Double the field element.
    pub fn double(&self) -> Field {
        Field(self.0.double())
    }

    /// Check if one field element equals another.
    pub fn equals(&self, other: &Field) -> bool {
        self.0 == FieldNative::from(other)
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

impl From<Field> for FieldNative {
    fn from(field: Field) -> Self {
        field.0
    }
}

impl From<&FieldNative> for Field {
    fn from(native: &FieldNative) -> Self {
        Self(*native)
    }
}

impl From<&Field> for FieldNative {
    fn from(scalar: &Field) -> Self {
        scalar.0
    }
}

impl FromStr for Field {
    type Err = anyhow::Error;

    fn from_str(field: &str) -> Result<Self, Self::Err> {
        Ok(Self(FieldNative::from_str(field)?))
    }
}
