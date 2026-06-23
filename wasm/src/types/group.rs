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
    Address,
    Field,
    Plaintext,
    Scalar,
    from_js_typed_array,
    js_array_from_fields,
    native::AddressNative,
    to_bits_array_le,
    types::{
        Boolean,
        integer::{I8, I16, I32, I64, I128, U8, U16, U32, U64, U128},
        native::{
            CurrentNetwork,
            GroupNative,
            I8Native,
            I16Native,
            I32Native,
            I64Native,
            I128Native,
            LiteralNative,
            PlaintextNative,
            ScalarNative,
            U8Native,
            U16Native,
            U32Native,
            U64Native,
            U128Native,
        },
    },
};
use snarkvm_console::network::Network;
use snarkvm_console::prelude::{
    Double,
    FromBits,
    FromBytes,
    FromField,
    FromFields,
    ToBits,
    ToBytes,
    ToFields,
    Uniform,
    Zero,
};

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

    /// Generate the group element from the x coordinate of the group.
    #[wasm_bindgen(js_name = "fromField")]
    pub fn from_field(field: &Field) -> Result<Group, String> {
        Ok(Group(GroupNative::from_field(&**field).map_err(|e| e.to_string())?))
    }

    /// Generate the group element from a string representation of the x coordinate of the group.
    #[wasm_bindgen(js_name = "fromFieldString")]
    pub fn from_field_string(field: &str) -> Result<Group, String> {
        let field = FieldNative::from_str(field).map_err(|e| e.to_string())?;
        Ok(Group(GroupNative::from_field(&field).map_err(|e| e.to_string())?))
    }

    /// Clone the group element.
    #[allow(clippy::should_implement_trait)]
    pub fn clone(&self) -> Group {
        Group(self.0)
    }

    /// Generate a random group element.
    pub fn random() -> Group {
        let rng = &mut rand::rng();
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

    /// Returns `scalar * G`, where `G` is the distinguished point on the Aleo protocol curve used
    /// for account derivation. This corresponds to `Network::g_scalar_multiply`.
    /// Note: `G` is different from {@link generator}, which returns a different generator.
    #[wasm_bindgen(js_name = gScalarMultiply)]
    pub fn g_scalar_multiply(scalar: &Scalar) -> Group {
        Group::from(CurrentNetwork::g_scalar_multiply(&**scalar))
    }

    // ── cast conversions ───────────────────────────────────────────────

    /// Cast the group element to a Field (returns x-coordinate).
    /// This is an alias for `toXCoordinate()`.
    #[wasm_bindgen(js_name = "toField")]
    pub fn to_field(&self) -> Field {
        self.to_x_coordinate()
    }

    /// Cast the group element to a Scalar with lossy truncation (via x-coordinate).
    #[wasm_bindgen(js_name = "toScalarLossy")]
    pub fn to_scalar_lossy(&self) -> Scalar {
        Scalar::from(ScalarNative::from_field_lossy(&self.0.to_x_coordinate()))
    }

    /// Cast the group element to a Boolean with lossy truncation (LSB of x-coordinate).
    #[wasm_bindgen(js_name = "toBooleanLossy")]
    pub fn to_boolean_lossy(&self) -> Boolean {
        Boolean::new(self.0.to_x_coordinate().to_bits_le()[0])
    }

    /// Cast the group element to an Address (lossless — Address wraps Group).
    #[wasm_bindgen(js_name = "toAddress")]
    pub fn to_address(&self) -> Address {
        Address::from_group(self.clone())
    }

    // Group → Integer lossy conversions (via x-coordinate)

    /// Cast the group to a U8 with lossy truncation.
    #[wasm_bindgen(js_name = "toU8Lossy")]
    pub fn to_u8_lossy(&self) -> U8 {
        U8::from(U8Native::from_field_lossy(&self.0.to_x_coordinate()))
    }

    /// Cast the group to a U16 with lossy truncation.
    #[wasm_bindgen(js_name = "toU16Lossy")]
    pub fn to_u16_lossy(&self) -> U16 {
        U16::from(U16Native::from_field_lossy(&self.0.to_x_coordinate()))
    }

    /// Cast the group to a U32 with lossy truncation.
    #[wasm_bindgen(js_name = "toU32Lossy")]
    pub fn to_u32_lossy(&self) -> U32 {
        U32::from(U32Native::from_field_lossy(&self.0.to_x_coordinate()))
    }

    /// Cast the group to a U64 with lossy truncation.
    #[wasm_bindgen(js_name = "toU64Lossy")]
    pub fn to_u64_lossy(&self) -> U64 {
        U64::from(U64Native::from_field_lossy(&self.0.to_x_coordinate()))
    }

    /// Cast the group to a U128 with lossy truncation.
    #[wasm_bindgen(js_name = "toU128Lossy")]
    pub fn to_u128_lossy(&self) -> U128 {
        U128::from(U128Native::from_field_lossy(&self.0.to_x_coordinate()))
    }

    /// Cast the group to an I8 with lossy truncation.
    #[wasm_bindgen(js_name = "toI8Lossy")]
    pub fn to_i8_lossy(&self) -> I8 {
        I8::from(I8Native::from_field_lossy(&self.0.to_x_coordinate()))
    }

    /// Cast the group to an I16 with lossy truncation.
    #[wasm_bindgen(js_name = "toI16Lossy")]
    pub fn to_i16_lossy(&self) -> I16 {
        I16::from(I16Native::from_field_lossy(&self.0.to_x_coordinate()))
    }

    /// Cast the group to an I32 with lossy truncation.
    #[wasm_bindgen(js_name = "toI32Lossy")]
    pub fn to_i32_lossy(&self) -> I32 {
        I32::from(I32Native::from_field_lossy(&self.0.to_x_coordinate()))
    }

    /// Cast the group to an I64 with lossy truncation.
    #[wasm_bindgen(js_name = "toI64Lossy")]
    pub fn to_i64_lossy(&self) -> I64 {
        I64::from(I64Native::from_field_lossy(&self.0.to_x_coordinate()))
    }

    /// Cast the group to an I128 with lossy truncation.
    #[wasm_bindgen(js_name = "toI128Lossy")]
    pub fn to_i128_lossy(&self) -> I128 {
        I128::from(I128Native::from_field_lossy(&self.0.to_x_coordinate()))
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
