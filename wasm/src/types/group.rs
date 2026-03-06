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
    Address, Field, Plaintext, Scalar, from_js_typed_array, js_array_from_fields,
    native::AddressNative,
    to_bits_array_le,
    types::native::{GroupNative, LiteralNative, PlaintextNative},
};
use snarkvm_console::prelude::{Double, FromBits, FromBytes, FromFields, ToBits, ToBytes, ToFields, Uniform, Zero};

use js_sys::{Array, Uint8Array};
use std::{ops::Deref, str::FromStr, sync::OnceLock};
use wasm_bindgen::prelude::*;

use super::native::FieldNative;

/// Elliptic curve element.
#[wasm_bindgen]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Group(GroupNative);

#[wasm_bindgen]
impl Group {
    /// Creates a group object from a string representation of a group element.
    #[wasm_bindgen(js_name = "fromString")]
    pub fn from_string(group: &str) -> Result<Group, String> {
        Ok(Self(GroupNative::from_str(group).map_err(|e| e.to_string())?))
    }

    /// Returns the string representation of the group element.
    #[wasm_bindgen(js_name = "toString")]
    #[allow(clippy::inherent_to_string)]
    pub fn to_string(&self) -> String {
        self.0.to_string()
    }

    /// Create a group element from a Uint8Array of left endian bytes.
    #[wasm_bindgen(js_name = "fromBytesLe")]
    pub fn from_bytes_le(bytes: &Uint8Array) -> Result<Group, String> {
        let bytes = bytes.to_vec();
        let group = GroupNative::from_bytes_le(&bytes).map_err(|e| e.to_string())?;
        Ok(Group(group))
    }

    /// Encode the group element as a Uint8Array of left endian bytes.
    #[wasm_bindgen(js_name = "toBytesLe")]
    pub fn to_bytes_le(&self) -> Result<Uint8Array, String> {
        let bytes = self.0.to_bytes_le().map_err(|e| e.to_string())?;
        Ok(Uint8Array::from(bytes.as_slice()))
    }

    /// Reconstruct a group element from a boolean array representation.
    #[wasm_bindgen(js_name = "fromBitsLe")]
    pub fn from_bits_le(bits: &Array) -> Result<Group, String> {
        let bit_vec = from_js_typed_array!(bits, as_bool, "boolean")?;
        let group = GroupNative::from_bits_le(&bit_vec).map_err(|e| e.to_string())?;
        Ok(Group(group))
    }

    /// Get the left endian boolean array representation of the group element.
    #[wasm_bindgen(js_name = "toBitsLe")]
    pub fn to_bits_le(&self) -> Array {
        to_bits_array_le!(self)
    }

    /// Get the field array representation of the group.
    #[wasm_bindgen(js_name = "toFields")]
    pub fn to_fields(&self) -> Result<Array, String> {
        let native_fields = self.0.to_fields().map_err(|e| e.to_string())?;
        Ok(js_array_from_fields!(native_fields))
    }

    /// Get the x-coordinate of the group element.
    #[wasm_bindgen(js_name = "toXCoordinate")]
    pub fn to_x_coordinate(&self) -> Field {
        Field::from(self.0.to_x_coordinate())
    }

    /// Create a plaintext element from a group element.
    #[wasm_bindgen(js_name = "toPlaintext")]
    pub fn to_plaintext(&self) -> Plaintext {
        Plaintext::from(PlaintextNative::Literal(LiteralNative::Group(self.0), OnceLock::new()))
    }

    /// Clone the group element.
    #[allow(clippy::should_implement_trait)]
    pub fn clone(&self) -> Group {
        Group(self.0)
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

impl From<GroupNative> for Address {
    fn from(value: GroupNative) -> Self {
        let native = AddressNative::new(value);
        Address::from(native)
    }
}

impl From<Group> for Address {
    fn from(value: Group) -> Self {
        Address::from(value.0)
    }
}

impl From<&GroupNative> for Address {
    fn from(value: &GroupNative) -> Self {
        Address::from(*value)
    }
}

impl From<&Group> for Address {
    fn from(value: &Group) -> Self {
        Address::from(value.0)
    }
}

impl TryFrom<Field> for Group {
    type Error = String;

    fn try_from(value: Field) -> Result<Self, Self::Error> {
        let native = GroupNative::from_fields(&[FieldNative::from(value)]).map_err(|e| e.to_string())?;
        Ok(Self(native))
    }
}

impl TryFrom<&Field> for Group {
    type Error = String;

    fn try_from(value: &Field) -> Result<Self, Self::Error> {
        Self::try_from(value.clone())
    }
}
