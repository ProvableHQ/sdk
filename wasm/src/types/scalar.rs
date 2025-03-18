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

use crate::types::native::{PlaintextNative, ScalarNative, Uniform};
use snarkvm_console::prelude::{Double, FromBytes, One, Pow, ToBytes, Zero};
use std::ops::Deref;

use crate::{Plaintext, types::native::LiteralNative};
use once_cell::sync::OnceCell;
use std::str::FromStr;
use js_sys::Uint8Array;
use wasm_bindgen::prelude::wasm_bindgen;

/// Scalar field element.
#[wasm_bindgen]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Scalar(ScalarNative);

#[wasm_bindgen]
impl Scalar {
    /// Creates a group object from a string representation of a group.
    #[wasm_bindgen(js_name = "fromString")]
    pub fn from_string(group: &str) -> Result<Scalar, String> {
        Ok(Self(ScalarNative::from_str(group).map_err(|e| e.to_string())?))
    }

    /// Returns the string representation of the group.
    #[wasm_bindgen(js_name = "toString")]
    #[allow(clippy::inherent_to_string)]
    pub fn to_string(&self) -> String {
        self.0.to_string()
    }

    /// Encode the scalar element as a Uint8Array of left endian bytes.
    ///
    /// @returns {Uint8Array} Uint8Array representation of the scalar element
    #[wasm_bindgen(js_name = toBytesLe)]
    pub fn to_bytes_le(&self) -> Result<Uint8Array, String> {
        let bytes = self.0.to_bytes_le().map_err(|e| e.to_string())?;
        Ok(Uint8Array::from(bytes.as_slice()))
    }

    /// Create a scalar element from a Uint8Array of left endian bytes.
    ///
    /// @param {Uint8Array} Uint8Array of left endian bytes encoding a scalar element.
    /// @returns {Scalar}
    #[wasm_bindgen(js_name = fromBytesLe)]
    pub fn from_bytes_le(bytes: Uint8Array) -> Result<Scalar, String> {
        let bytes = bytes.to_vec();
        let scalar = ScalarNative::from_bytes_le(&bytes).map_err(|e| e.to_string())?;
        Ok(Scalar(scalar))
    }

    /// Create a plaintext element from a group element.
    #[wasm_bindgen(js_name = "toPlaintext")]
    pub fn to_plaintext(&self) -> Plaintext {
        Plaintext::from(PlaintextNative::Literal(LiteralNative::Scalar(self.0), OnceCell::new()))
    }

    /// Generate a random group element.
    pub fn random() -> Scalar {
        let rng = &mut rand::thread_rng();
        Scalar(ScalarNative::rand(rng))
    }

    /// Add two scalar elements.
    pub fn add(&self, other: &Scalar) -> Scalar {
        Scalar(self.0 + other.0)
    }

    /// Subtract two scalar elements.
    pub fn subtract(&self, other: &Scalar) -> Scalar {
        Scalar(self.0 - other.0)
    }

    /// Multiply two scalar elements.
    pub fn multiply(&self, other: &Scalar) -> Scalar {
        Scalar(self.0 * other.0)
    }

    /// Divide two scalar elements.
    pub fn divide(&self, other: &Scalar) -> Scalar {
        Scalar(self.0 / other.0)
    }

    /// Double the scalar element.
    pub fn double(&self) -> Scalar {
        Scalar(self.0.double())
    }

    /// Power of a scalar element.
    pub fn pow(&self, other: &Scalar) -> Scalar {
        Scalar(self.0.pow(other.0))
    }

    /// Invert the scalar element.
    pub fn inverse(&self) -> Scalar {
        Scalar(-self.0)
    }

    /// Creates a one valued element of the scalar field.
    pub fn one() -> Scalar {
        Scalar(ScalarNative::one())
    }

    /// Creates a zero valued element of the scalar field
    pub fn zero() -> Scalar {
        Scalar(ScalarNative::zero())
    }

    /// Check if one scalar element equals another.
    pub fn equals(&self, other: &Scalar) -> bool {
        self.0 == ScalarNative::from(other)
    }
}

impl Deref for Scalar {
    type Target = ScalarNative;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl From<ScalarNative> for Scalar {
    fn from(native: ScalarNative) -> Self {
        Self(native)
    }
}

impl From<Scalar> for ScalarNative {
    fn from(scalar: Scalar) -> Self {
        scalar.0
    }
}

impl From<&ScalarNative> for Scalar {
    fn from(native: &ScalarNative) -> Self {
        Self(*native)
    }
}

impl From<&Scalar> for ScalarNative {
    fn from(scalar: &Scalar) -> Self {
        scalar.0
    }
}
