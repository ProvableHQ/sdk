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
    Plaintext,
    types::{
        Scalar,
        native::{GroupNative, LiteralNative, PlaintextNative, Uniform},
    },
};
use snarkvm_console::prelude::{Double, FromBytes, ToBytes, Zero};

use once_cell::sync::OnceCell;
use std::{ops::Deref, str::FromStr};
use js_sys::Uint8Array;
use wasm_bindgen::prelude::wasm_bindgen;

/// Elliptic curve element.
#[wasm_bindgen]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Group(GroupNative);

#[wasm_bindgen]
impl Group {
    /// Creates a group object from a string representation of a group.
    #[wasm_bindgen(js_name = "fromString")]
    pub fn from_string(group: &str) -> Result<Group, String> {
        Ok(Self(GroupNative::from_str(group).map_err(|e| e.to_string())?))
    }

    /// Returns the string representation of the group.
    #[wasm_bindgen(js_name = "toString")]
    #[allow(clippy::inherent_to_string)]
    pub fn to_string(&self) -> String {
        self.0.to_string()
    }

    /// Encode the group element as a Uint8Array of left endian bytes.
    ///
    /// @returns {Uint8Array} Uint8Array representation of the group element
    #[wasm_bindgen(js_name = toBytesLe)]
    pub fn to_bytes_le(&self) -> Result<Uint8Array, String> {
        let bytes = self.0.to_bytes_le().map_err(|e| e.to_string())?;
        Ok(Uint8Array::from(bytes.as_slice()))
    }

    /// Create a group element from a Uint8Array of left endian bytes.
    ///
    /// @param {Uint8Array} Uint8Array of left endian bytes encoding a group element.
    /// @returns {Group}
    #[wasm_bindgen(js_name = fromBytesLe)]
    pub fn from_bytes_le(bytes: Uint8Array) -> Result<Group, String> {
        let bytes = bytes.to_vec();
        let group = GroupNative::from_bytes_le(&bytes).map_err(|e| e.to_string())?;
        Ok(Group(group))
    }


    /// Get the x-coordinate of the group element.
    #[wasm_bindgen(js_name = "toXCoordinate")]
    pub fn to_x_coordinate(&self) -> Field {
        Field::from(self.0.to_x_coordinate())
    }

    /// Create a plaintext element from a group element.
    #[wasm_bindgen(js_name = "toPlaintext")]
    pub fn to_plaintext(&self) -> Plaintext {
        Plaintext::from(PlaintextNative::Literal(LiteralNative::Group(self.0), OnceCell::new()))
    }

    /// Generate a random group element.
    pub fn random() -> Group {
        let rng = &mut rand::thread_rng();
        Group(GroupNative::rand(rng))
    }

    /// Add two group elements.
    pub fn add(&self, other: &Group) -> Group {
        Group(self.0 + other.0)
    }

    /// Subtract two group elements (equivalently: add the inverse of an element).
    pub fn subtract(&self, other: &Group) -> Group {
        Group(self.0 - other.0)
    }

    /// Multiply a group element by a scalar element.
    #[wasm_bindgen(js_name = scalarMultiply)]
    pub fn scalar_multiply(&self, scalar: &Scalar) -> Group {
        Group(self.0 * **scalar)
    }

    /// Double the group element.
    pub fn double(&self) -> Group {
        Group(self.0.double())
    }

    /// Get the inverse of the group element. This is the reflection of the point about the axis
    /// of symmetry i.e. (x,y) -> (x, -y).
    pub fn inverse(&self) -> Group {
        Group(-self.0)
    }

    /// Check if one group element equals another.
    pub fn equals(&self, other: &Group) -> bool {
        self.0 == GroupNative::from(other)
    }

    /// Get the group identity element under the group operation (i.e. the point at infinity.)
    pub fn zero() -> Group {
        Group::from(GroupNative::zero())
    }

    /// Get the generator of the group.
    pub fn generator() -> Group {
        Group::from(GroupNative::generator())
    }
}

impl Deref for Group {
    type Target = GroupNative;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl From<GroupNative> for Group {
    fn from(native: GroupNative) -> Self {
        Self(native)
    }
}

impl From<Group> for GroupNative {
    fn from(group: Group) -> Self {
        group.0
    }
}

impl From<&GroupNative> for Group {
    fn from(native: &GroupNative) -> Self {
        Self(*native)
    }
}

impl From<&Group> for GroupNative {
    fn from(group: &Group) -> Self {
        group.0
    }
}
