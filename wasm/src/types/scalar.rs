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
    from_js_typed_array,
    to_bits_array_le,
    types::{
        Boolean,
        Group,
        integer::{I8, I16, I32, I64, I128, U8, U16, U32, U64, U128},
        native::{
            FieldNative,
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
use snarkvm_console::{
    prelude::{Double, FromBits, FromBytes, FromField, One, Pow, ToBits, ToBytes, ToField, Uniform, Zero},
    program::CastLossy,
};

use js_sys::{Array, Uint8Array};
use std::{ops::Deref, str::FromStr, sync::OnceLock};
use wasm_bindgen::prelude::*;

/// Scalar field element.
#[wasm_bindgen]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Scalar(ScalarNative);

#[wasm_bindgen]
impl Scalar {
    /// Creates a scalar object from a string representation of a scalar element.
    #[wasm_bindgen(js_name = "fromString")]
    pub fn from_string(group: &str) -> Result<Scalar, String> {
        Ok(Self(ScalarNative::from_str(group).map_err(|e| e.to_string())?))
    }

    /// Returns the string representation of the scalar element.
    #[wasm_bindgen(js_name = "toString")]
    #[allow(clippy::inherent_to_string)]
    pub fn to_string(&self) -> String {
        self.0.to_string()
    }

    /// Create a scalar element from a Uint8Array of left endian bytes.
    #[wasm_bindgen(js_name = "fromBytesLe")]
    pub fn from_bytes_le(bytes: &Uint8Array) -> Result<Scalar, String> {
        let bytes = bytes.to_vec();
        let scalar = ScalarNative::from_bytes_le(&bytes).map_err(|e| e.to_string())?;
        Ok(Scalar(scalar))
    }

    /// Encode the scalar element as a Uint8Array of left endian bytes.
    #[wasm_bindgen(js_name = "toBytesLe")]
    pub fn to_bytes_le(&self) -> Result<Uint8Array, String> {
        let bytes = self.0.to_bytes_le().map_err(|e| e.to_string())?;
        Ok(Uint8Array::from(bytes.as_slice()))
    }

    /// Reconstruct a scalar element from a boolean array representation.
    #[wasm_bindgen(js_name = "fromBitsLe")]
    pub fn from_bits_le(bits: &Array) -> Result<Scalar, String> {
        let bit_vec = from_js_typed_array!(bits, as_bool, "boolean")?;
        let scalar = ScalarNative::from_bits_le(&bit_vec).map_err(|e| e.to_string())?;
        Ok(Scalar(scalar))
    }

    /// Get the left endian boolean array representation of the scalar element.
    #[wasm_bindgen(js_name = "toBitsLe")]
    pub fn to_bits_le(&self) -> Array {
        to_bits_array_le!(self)
    }

    /// Create a plaintext element from a scalar element.
    #[wasm_bindgen(js_name = "toPlaintext")]
    pub fn to_plaintext(&self) -> Plaintext {
        Plaintext::from(PlaintextNative::Literal(LiteralNative::Scalar(self.0), OnceLock::new()))
    }

    /// Cast the scalar element to a field element.
    #[wasm_bindgen(js_name = "toField")]
    pub fn to_field(&self) -> Result<Field, String> {
        Ok(Field::from(self.0.to_field().map_err(|e| e.to_string())?))
    }

    /// Clone the scalar element.
    #[allow(clippy::should_implement_trait)]
    pub fn clone(&self) -> Scalar {
        Scalar(self.0)
    }

    /// Generate a random scalar element.
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

    /// Get the multiplicative identity of the scalar field.
    pub fn one() -> Scalar {
        Scalar(ScalarNative::one())
    }

    /// Get the additive identity of the scalar field.
    pub fn zero() -> Scalar {
        Scalar(ScalarNative::zero())
    }

    /// Check if one scalar element equals another.
    pub fn equals(&self, other: &Scalar) -> bool {
        self.0 == ScalarNative::from(other)
    }

    // ── cast conversions ───────────────────────────────────────────────

    /// Cast the scalar to a Boolean (strict).
    /// Returns an error if the scalar is not zero or one.
    #[wasm_bindgen(js_name = "toBoolean")]
    pub fn to_boolean(&self) -> Result<Boolean, String> {
        if self.0.is_zero() {
            Ok(Boolean::new(false))
        } else if self.0.is_one() {
            Ok(Boolean::new(true))
        } else {
            Err("Failed to convert scalar to boolean: scalar is not zero or one".to_string())
        }
    }

    /// Cast the scalar to a Boolean with lossy truncation (extracts least-significant bit).
    #[wasm_bindgen(js_name = "toBooleanLossy")]
    pub fn to_boolean_lossy(&self) -> Boolean {
        Boolean::new(self.0.to_bits_le()[0])
    }

    /// Cast the scalar to a Group element (strict, via Field x-coordinate recovery).
    /// Returns an error if the resulting field is not a valid x-coordinate on the curve.
    #[wasm_bindgen(js_name = "toGroup")]
    pub fn to_group(&self) -> Result<Group, String> {
        let field: FieldNative = self.0.to_field().map_err(|e| e.to_string())?;
        Ok(Group::from(GroupNative::from_field(&field).map_err(|e| e.to_string())?))
    }

    /// Cast the scalar to a Group element with lossy conversion (via Field, Elligator-2 fallback).
    #[wasm_bindgen(js_name = "toGroupLossy")]
    pub fn to_group_lossy(&self) -> Result<Group, String> {
        let field: FieldNative = self.0.to_field().map_err(|e| e.to_string())?;
        let group: GroupNative = field.cast_lossy();
        Ok(Group::from(group))
    }

    /// Cast the scalar to an Address (strict, via Field x-coordinate recovery).
    /// Returns an error if the resulting field is not a valid x-coordinate on the curve.
    #[wasm_bindgen(js_name = "toAddress")]
    pub fn to_address(&self) -> Result<Address, String> {
        Ok(Address::from_group(self.to_group()?))
    }

    /// Cast the scalar to an Address with lossy conversion (via Group, Elligator-2 fallback).
    #[wasm_bindgen(js_name = "toAddressLossy")]
    pub fn to_address_lossy(&self) -> Result<Address, String> {
        Ok(Address::from_group(self.to_group_lossy()?))
    }

    // Scalar → Integer lossy conversions

    /// Cast the scalar to a U8 with lossy truncation.
    #[wasm_bindgen(js_name = "toU8Lossy")]
    pub fn to_u8_lossy(&self) -> Result<U8, String> {
        Ok(U8::from(U8Native::from_field_lossy(&self.0.to_field().map_err(|e| e.to_string())?)))
    }

    /// Cast the scalar to a U16 with lossy truncation.
    #[wasm_bindgen(js_name = "toU16Lossy")]
    pub fn to_u16_lossy(&self) -> Result<U16, String> {
        Ok(U16::from(U16Native::from_field_lossy(&self.0.to_field().map_err(|e| e.to_string())?)))
    }

    /// Cast the scalar to a U32 with lossy truncation.
    #[wasm_bindgen(js_name = "toU32Lossy")]
    pub fn to_u32_lossy(&self) -> Result<U32, String> {
        Ok(U32::from(U32Native::from_field_lossy(&self.0.to_field().map_err(|e| e.to_string())?)))
    }

    /// Cast the scalar to a U64 with lossy truncation.
    #[wasm_bindgen(js_name = "toU64Lossy")]
    pub fn to_u64_lossy(&self) -> Result<U64, String> {
        Ok(U64::from(U64Native::from_field_lossy(&self.0.to_field().map_err(|e| e.to_string())?)))
    }

    /// Cast the scalar to a U128 with lossy truncation.
    #[wasm_bindgen(js_name = "toU128Lossy")]
    pub fn to_u128_lossy(&self) -> Result<U128, String> {
        Ok(U128::from(U128Native::from_field_lossy(&self.0.to_field().map_err(|e| e.to_string())?)))
    }

    /// Cast the scalar to an I8 with lossy truncation.
    #[wasm_bindgen(js_name = "toI8Lossy")]
    pub fn to_i8_lossy(&self) -> Result<I8, String> {
        Ok(I8::from(I8Native::from_field_lossy(&self.0.to_field().map_err(|e| e.to_string())?)))
    }

    /// Cast the scalar to an I16 with lossy truncation.
    #[wasm_bindgen(js_name = "toI16Lossy")]
    pub fn to_i16_lossy(&self) -> Result<I16, String> {
        Ok(I16::from(I16Native::from_field_lossy(&self.0.to_field().map_err(|e| e.to_string())?)))
    }

    /// Cast the scalar to an I32 with lossy truncation.
    #[wasm_bindgen(js_name = "toI32Lossy")]
    pub fn to_i32_lossy(&self) -> Result<I32, String> {
        Ok(I32::from(I32Native::from_field_lossy(&self.0.to_field().map_err(|e| e.to_string())?)))
    }

    /// Cast the scalar to an I64 with lossy truncation.
    #[wasm_bindgen(js_name = "toI64Lossy")]
    pub fn to_i64_lossy(&self) -> Result<I64, String> {
        Ok(I64::from(I64Native::from_field_lossy(&self.0.to_field().map_err(|e| e.to_string())?)))
    }

    /// Cast the scalar to an I128 with lossy truncation.
    #[wasm_bindgen(js_name = "toI128Lossy")]
    pub fn to_i128_lossy(&self) -> Result<I128, String> {
        Ok(I128::from(I128Native::from_field_lossy(&self.0.to_field().map_err(|e| e.to_string())?)))
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
