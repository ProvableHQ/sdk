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
    Plaintext,
    from_js_typed_array,
    to_bits_array_le,
    types::{
        Boolean,
        Group,
        Scalar,
        integer::{I8, I16, I32, I64, I128, U8, U16, U32, U64, U128},
        native::{
            CurrentNetwork,
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
    prelude::{Double, Environment, FromBits, FromBytes, One, Pow, ToBits, ToBytes, Zero},
    program::CastLossy,
};
use snarkvm_wasm::{fields::PrimeField, utilities::Uniform};

use js_sys::{Array, Uint8Array};
use std::{ops::Deref, str::FromStr, sync::OnceLock};
use wasm_bindgen::prelude::*;

/// Field element.
#[wasm_bindgen]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Field(FieldNative);

#[wasm_bindgen]
impl Field {
    /// Creates a field object from a string representation of a field element.
    #[wasm_bindgen(js_name = "fromString")]
    #[allow(clippy::should_implement_trait)]
    pub fn from_string(field: &str) -> Result<Field, String> {
        Ok(Self(FieldNative::from_str(field).map_err(|e| e.to_string())?))
    }

    /// Returns the string representation of the field element.
    #[wasm_bindgen(js_name = "toString")]
    #[allow(clippy::inherent_to_string)]
    pub fn to_string(&self) -> String {
        self.0.to_string()
    }

    /// Create a field element from a Uint8Array of left endian bytes.
    #[wasm_bindgen(js_name = "fromBytesLe")]
    pub fn from_bytes_le(bytes: &Uint8Array) -> Result<Field, String> {
        let bytes = bytes.to_vec();
        let transition = FieldNative::from_bytes_le(&bytes).map_err(|e| e.to_string())?;
        Ok(Field(transition))
    }

    /// Encode the field element as a Uint8Array of left endian bytes.
    #[wasm_bindgen(js_name = "toBytesLe")]
    pub fn to_bytes_le(&self) -> Result<Uint8Array, String> {
        let bytes = self.0.to_bytes_le().map_err(|e| e.to_string())?;
        Ok(Uint8Array::from(bytes.as_slice()))
    }

    /// Reconstruct a field element from a boolean array representation.
    #[wasm_bindgen(js_name = "fromBitsLe")]
    pub fn from_bits_le(bits: &Array) -> Result<Field, String> {
        let bit_vec = from_js_typed_array!(bits, as_bool, "boolean")?;
        let group = FieldNative::from_bits_le(&bit_vec).map_err(|e| e.to_string())?;
        Ok(Field(group))
    }

    /// Get the left endian boolean array representation of the field element.
    #[wasm_bindgen(js_name = "toBitsLe")]
    pub fn to_bits_le(&self) -> Array {
        to_bits_array_le!(self)
    }

    /// Create a plaintext from the field element.
    #[wasm_bindgen(js_name = "toPlaintext")]
    pub fn to_plaintext(&self) -> Plaintext {
        Plaintext::from(PlaintextNative::Literal(LiteralNative::Field(self.0), OnceLock::new()))
    }

    /// Clone the field element.
    #[allow(clippy::should_implement_trait)]
    pub fn clone(&self) -> Field {
        Field(self.0)
    }

    /// Generate a random field element.
    pub fn random() -> Field {
        let rng = &mut rand::rng();
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

    /// Initializes a new field as a domain separator.
    #[wasm_bindgen(js_name = "newDomainSeparator")]
    pub fn new_domain_separator(domain: &str) -> Field {
        let domain_native =
            FieldNative::new(<CurrentNetwork as Environment>::Field::from_bytes_le_mod_order(domain.as_bytes()));
        Field::from(domain_native)
    }

    /// Power of a field element.
    pub fn pow(&self, other: &Field) -> Field {
        Field(self.0.pow(other.0))
    }

    /// Invert the field element.
    pub fn inverse(&self) -> Field {
        Field(-self.0)
    }

    /// Get the additive identity element of the field.
    pub fn zero() -> Field {
        Field(FieldNative::zero())
    }

    /// Get the multiplicative identity of the field.
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

    // ── cast conversions ───────────────────────────────────────────────

    /// Cast the field element to a Scalar with lossy truncation.
    #[wasm_bindgen(js_name = "toScalarLossy")]
    pub fn to_scalar_lossy(&self) -> Scalar {
        Scalar::from(ScalarNative::from_field_lossy(&self.0))
    }

    /// Cast the field element to a Boolean (strict).
    /// Returns an error if the field is not zero or one.
    #[wasm_bindgen(js_name = "toBoolean")]
    pub fn to_boolean(&self) -> Result<Boolean, String> {
        if self.0.is_zero() {
            Ok(Boolean::new(false))
        } else if self.0.is_one() {
            Ok(Boolean::new(true))
        } else {
            Err("Failed to convert field to boolean: field element is not zero or one".to_string())
        }
    }

    /// Cast the field element to a Boolean with lossy truncation (extracts least-significant bit).
    #[wasm_bindgen(js_name = "toBooleanLossy")]
    pub fn to_boolean_lossy(&self) -> Boolean {
        Boolean::new(self.0.to_bits_le()[0])
    }

    /// Cast the field element to a Group element (strict).
    ///
    /// Attempts to recover the group element from the field as an x-coordinate.
    /// Returns an error if the field is not a valid x-coordinate on the curve.
    #[wasm_bindgen(js_name = "toGroup")]
    pub fn to_group(&self) -> Result<Group, String> {
        Group::from_field(self)
    }

    /// Cast the field element to a Group element with lossy conversion.
    ///
    /// Uses the snarkVM cast_lossy path: tries x-coordinate recovery first,
    /// falls back to the generator for field == 1, and applies Elligator-2
    /// otherwise. This conversion never fails.
    #[wasm_bindgen(js_name = "toGroupLossy")]
    pub fn to_group_lossy(&self) -> Group {
        let group: GroupNative = self.0.cast_lossy();
        Group::from(group)
    }

    /// Cast the field element to an Address (strict, via Group x-coordinate recovery).
    /// Returns an error if the field is not a valid x-coordinate on the curve.
    #[wasm_bindgen(js_name = "toAddress")]
    pub fn to_address(&self) -> Result<Address, String> {
        Ok(Address::from_group(self.to_group()?))
    }

    /// Cast the field element to an Address with lossy conversion (via Group, Elligator-2 fallback).
    #[wasm_bindgen(js_name = "toAddressLossy")]
    pub fn to_address_lossy(&self) -> Address {
        Address::from_group(self.to_group_lossy())
    }

    // Field → Integer lossy conversions

    /// Cast the field to a U8 with lossy truncation.
    #[wasm_bindgen(js_name = "toU8Lossy")]
    pub fn to_u8_lossy(&self) -> U8 {
        U8::from(U8Native::from_field_lossy(&self.0))
    }

    /// Cast the field to a U16 with lossy truncation.
    #[wasm_bindgen(js_name = "toU16Lossy")]
    pub fn to_u16_lossy(&self) -> U16 {
        U16::from(U16Native::from_field_lossy(&self.0))
    }

    /// Cast the field to a U32 with lossy truncation.
    #[wasm_bindgen(js_name = "toU32Lossy")]
    pub fn to_u32_lossy(&self) -> U32 {
        U32::from(U32Native::from_field_lossy(&self.0))
    }

    /// Cast the field to a U64 with lossy truncation.
    #[wasm_bindgen(js_name = "toU64Lossy")]
    pub fn to_u64_lossy(&self) -> U64 {
        U64::from(U64Native::from_field_lossy(&self.0))
    }

    /// Cast the field to a U128 with lossy truncation.
    #[wasm_bindgen(js_name = "toU128Lossy")]
    pub fn to_u128_lossy(&self) -> U128 {
        U128::from(U128Native::from_field_lossy(&self.0))
    }

    /// Cast the field to an I8 with lossy truncation.
    #[wasm_bindgen(js_name = "toI8Lossy")]
    pub fn to_i8_lossy(&self) -> I8 {
        I8::from(I8Native::from_field_lossy(&self.0))
    }

    /// Cast the field to an I16 with lossy truncation.
    #[wasm_bindgen(js_name = "toI16Lossy")]
    pub fn to_i16_lossy(&self) -> I16 {
        I16::from(I16Native::from_field_lossy(&self.0))
    }

    /// Cast the field to an I32 with lossy truncation.
    #[wasm_bindgen(js_name = "toI32Lossy")]
    pub fn to_i32_lossy(&self) -> I32 {
        I32::from(I32Native::from_field_lossy(&self.0))
    }

    /// Cast the field to an I64 with lossy truncation.
    #[wasm_bindgen(js_name = "toI64Lossy")]
    pub fn to_i64_lossy(&self) -> I64 {
        I64::from(I64Native::from_field_lossy(&self.0))
    }

    /// Cast the field to an I128 with lossy truncation.
    #[wasm_bindgen(js_name = "toI128Lossy")]
    pub fn to_i128_lossy(&self) -> I128 {
        I128::from(I128Native::from_field_lossy(&self.0))
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_field_to_scalar_lossy_roundtrip() {
        let scalar = Scalar::from_string("42scalar").unwrap();
        let field = scalar.to_field().unwrap();
        let back = field.to_scalar_lossy();
        assert_eq!(back.to_string(), scalar.to_string());
    }

    #[test]
    fn test_field_to_boolean_lossy() {
        assert_eq!(Field::from_string("0field").unwrap().to_boolean_lossy().to_string(), "false");
        assert_eq!(Field::from_string("1field").unwrap().to_boolean_lossy().to_string(), "true");
        assert_eq!(Field::from_string("2field").unwrap().to_boolean_lossy().to_string(), "false");
        assert_eq!(Field::from_string("3field").unwrap().to_boolean_lossy().to_string(), "true");
    }

    #[test]
    fn test_field_to_group_strict_and_lossy() {
        // toGroupLossy uses Elligator-2 fallback and should never fail
        let field = Field::from_string("12345field").unwrap();
        let _group = field.to_group_lossy();

        let zero = Field::from_string("0field").unwrap();
        let _group = zero.to_group_lossy();

        let one = Field::from_string("1field").unwrap();
        let _group = one.to_group_lossy();

        // toGroup (strict) may fail for arbitrary fields
        // but should succeed when given a valid x-coordinate
    }

    #[test]
    fn test_field_to_integer_lossy_roundtrip() {
        let field = Field::from_string("255field").unwrap();
        assert_eq!(field.to_u8_lossy().to_string(), "255u8");
        assert_eq!(field.to_u32_lossy().to_string(), "255u32");
    }

    #[test]
    fn test_field_to_integer_lossy_truncation() {
        assert_eq!(Field::from_string("256field").unwrap().to_u8_lossy().to_string(), "0u8");
        assert_eq!(Field::from_string("257field").unwrap().to_u8_lossy().to_string(), "1u8");
    }

    #[test]
    fn test_field_to_address_lossy() {
        let field = Field::from_string("42field").unwrap();
        let addr = field.to_address_lossy();
        assert!(addr.to_string().starts_with("aleo1"));
    }
}
