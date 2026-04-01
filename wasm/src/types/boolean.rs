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
        Field,
        Group,
        Scalar,
        integer::{I8, I16, I32, I64, I128, U8, U16, U32, U64, U128},
        native::{
            BooleanNative,
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
    prelude::{FromBits, FromBytes, FromField, ToBits, ToBytes},
    program::CastLossy,
};
use snarkvm_wasm::utilities::Uniform;

use js_sys::{Array, Uint8Array};
use std::{ops::Deref, str::FromStr, sync::OnceLock};
use wasm_bindgen::prelude::*;

/// Boolean element.
#[wasm_bindgen]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Boolean(BooleanNative);

#[wasm_bindgen]
impl Boolean {
    /// Creates a Boolean from a native JS bool.
    #[wasm_bindgen(constructor)]
    pub fn new(value: bool) -> Boolean {
        Boolean(BooleanNative::new(value))
    }

    /// Creates a boolean object from a string representation ("true"/"false").
    #[wasm_bindgen(js_name = "fromString")]
    #[allow(clippy::should_implement_trait)]
    pub fn from_string(boolean: &str) -> Result<Boolean, String> {
        Ok(Self(BooleanNative::from_str(boolean).map_err(|e| e.to_string())?))
    }

    /// Returns the string representation of the boolean element.
    #[wasm_bindgen(js_name = "toString")]
    #[allow(clippy::inherent_to_string)]
    pub fn to_string(&self) -> String {
        self.0.to_string()
    }

    /// Create a boolean element from a Uint8Array of left endian bytes.
    #[wasm_bindgen(js_name = "fromBytesLe")]
    pub fn from_bytes_le(bytes: &Uint8Array) -> Result<Boolean, String> {
        let bytes = bytes.to_vec();
        let boolean = BooleanNative::from_bytes_le(&bytes).map_err(|e| e.to_string())?;
        Ok(Boolean(boolean))
    }

    /// Encode the boolean element as a Uint8Array of left endian bytes.
    #[wasm_bindgen(js_name = "toBytesLe")]
    pub fn to_bytes_le(&self) -> Result<Uint8Array, String> {
        let bytes = self.0.to_bytes_le().map_err(|e| e.to_string())?;
        Ok(Uint8Array::from(bytes.as_slice()))
    }

    /// Reconstruct a boolean element from a boolean array representation.
    #[wasm_bindgen(js_name = "fromBitsLe")]
    pub fn from_bits_le(bits: &Array) -> Result<Boolean, String> {
        let bit_vec = from_js_typed_array!(bits, as_bool, "boolean")?;
        if bit_vec.len() != 1 {
            return Err("Boolean expects exactly 1 bit".to_string());
        }
        let boolean = BooleanNative::from_bits_le(&bit_vec).map_err(|e| e.to_string())?;
        Ok(Boolean(boolean))
    }

    /// Get the left endian boolean array representation of the boolean element.
    #[wasm_bindgen(js_name = "toBitsLe")]
    pub fn to_bits_le(&self) -> Array {
        to_bits_array_le!(self)
    }

    /// Create a plaintext from the boolean element.
    #[wasm_bindgen(js_name = "toPlaintext")]
    pub fn to_plaintext(&self) -> Plaintext {
        Plaintext::from(PlaintextNative::Literal(LiteralNative::Boolean(self.0), OnceLock::new()))
    }

    /// Clone the boolean element.
    #[allow(clippy::should_implement_trait)]
    pub fn clone(&self) -> Boolean {
        Boolean(self.0)
    }

    /// Generate a random boolean element.
    pub fn random() -> Boolean {
        let rng = &mut rand::thread_rng();
        Boolean(BooleanNative::rand(rng))
    }

    /// Logical NOT.
    pub fn not(&self) -> Boolean {
        Boolean(!self.0)
    }

    /// Logical AND.
    pub fn and(&self, other: &Boolean) -> Boolean {
        Boolean(self.0 & other.0)
    }

    /// Logical OR.
    pub fn or(&self, other: &Boolean) -> Boolean {
        Boolean(self.0 | other.0)
    }

    /// Logical XOR.
    pub fn xor(&self, other: &Boolean) -> Boolean {
        Boolean(self.0 ^ other.0)
    }

    /// Logical NAND.
    pub fn nand(&self, other: &Boolean) -> Boolean {
        Boolean(!(self.0 & other.0))
    }

    /// Logical NOR.
    pub fn nor(&self, other: &Boolean) -> Boolean {
        Boolean(!(self.0 | other.0))
    }

    /// Check if one boolean element equals another.
    pub fn equals(&self, other: &Boolean) -> bool {
        self.0 == BooleanNative::from(other)
    }

    // ── cast conversions (all lossless — Boolean has minimal information) ──

    /// Cast the boolean to a Field element (false=0, true=1). Lossless.
    #[wasm_bindgen(js_name = "toField")]
    pub fn to_field(&self) -> Result<Field, String> {
        Ok(Field::from(FieldNative::from_bits_le(&[*self.0]).map_err(|e| e.to_string())?))
    }

    /// Cast the boolean to a Scalar element (false=0, true=1). Lossless.
    #[wasm_bindgen(js_name = "toScalar")]
    pub fn to_scalar(&self) -> Result<Scalar, String> {
        Ok(Scalar::from(ScalarNative::from_bits_le(&[*self.0]).map_err(|e| e.to_string())?))
    }

    /// Cast the boolean to a Group element (strict, via Field x-coordinate recovery).
    /// Returns an error if the resulting field is not a valid x-coordinate.
    #[wasm_bindgen(js_name = "toGroup")]
    pub fn to_group(&self) -> Result<Group, String> {
        let field = FieldNative::from_bits_le(&[*self.0]).map_err(|e| e.to_string())?;
        Ok(Group::from(GroupNative::from_field(&field).map_err(|e| e.to_string())?))
    }

    /// Cast the boolean to a Group element (lossy, via Field with Elligator-2 fallback).
    /// This conversion never fails.
    #[wasm_bindgen(js_name = "toGroupLossy")]
    pub fn to_group_lossy(&self) -> Result<Group, String> {
        let field = FieldNative::from_bits_le(&[*self.0]).map_err(|e| e.to_string())?;
        let group: GroupNative = field.cast_lossy();
        Ok(Group::from(group))
    }

    /// Cast the boolean to an Address (strict, via Group). Returns an error if conversion fails.
    #[wasm_bindgen(js_name = "toAddress")]
    pub fn to_address(&self) -> Result<Address, String> {
        Ok(Address::from_group(self.to_group()?))
    }

    /// Cast the boolean to an Address (lossy, via Group with Elligator-2 fallback).
    #[wasm_bindgen(js_name = "toAddressLossy")]
    pub fn to_address_lossy(&self) -> Result<Address, String> {
        Ok(Address::from_group(self.to_group_lossy()?))
    }

    // Boolean → Integer conversions (false=0, true=1). All lossless.

    /// Cast the boolean to a U8 (false=0, true=1).
    #[wasm_bindgen(js_name = "toU8")]
    pub fn to_u8(&self) -> U8 {
        U8::from(U8Native::new(if *self.0 { 1 } else { 0 }))
    }

    /// Cast the boolean to a U16 (false=0, true=1).
    #[wasm_bindgen(js_name = "toU16")]
    pub fn to_u16(&self) -> U16 {
        U16::from(U16Native::new(if *self.0 { 1 } else { 0 }))
    }

    /// Cast the boolean to a U32 (false=0, true=1).
    #[wasm_bindgen(js_name = "toU32")]
    pub fn to_u32(&self) -> U32 {
        U32::from(U32Native::new(if *self.0 { 1 } else { 0 }))
    }

    /// Cast the boolean to a U64 (false=0, true=1).
    #[wasm_bindgen(js_name = "toU64")]
    pub fn to_u64(&self) -> U64 {
        U64::from(U64Native::new(if *self.0 { 1 } else { 0 }))
    }

    /// Cast the boolean to a U128 (false=0, true=1).
    #[wasm_bindgen(js_name = "toU128")]
    pub fn to_u128(&self) -> U128 {
        U128::from(U128Native::new(if *self.0 { 1 } else { 0 }))
    }

    /// Cast the boolean to an I8 (false=0, true=1).
    #[wasm_bindgen(js_name = "toI8")]
    pub fn to_i8(&self) -> I8 {
        I8::from(I8Native::new(if *self.0 { 1 } else { 0 }))
    }

    /// Cast the boolean to an I16 (false=0, true=1).
    #[wasm_bindgen(js_name = "toI16")]
    pub fn to_i16(&self) -> I16 {
        I16::from(I16Native::new(if *self.0 { 1 } else { 0 }))
    }

    /// Cast the boolean to an I32 (false=0, true=1).
    #[wasm_bindgen(js_name = "toI32")]
    pub fn to_i32(&self) -> I32 {
        I32::from(I32Native::new(if *self.0 { 1 } else { 0 }))
    }

    /// Cast the boolean to an I64 (false=0, true=1).
    #[wasm_bindgen(js_name = "toI64")]
    pub fn to_i64(&self) -> I64 {
        I64::from(I64Native::new(if *self.0 { 1 } else { 0 }))
    }

    /// Cast the boolean to an I128 (false=0, true=1).
    #[wasm_bindgen(js_name = "toI128")]
    pub fn to_i128(&self) -> I128 {
        I128::from(I128Native::new(if *self.0 { 1 } else { 0 }))
    }
}

impl Deref for Boolean {
    type Target = BooleanNative;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl From<BooleanNative> for Boolean {
    fn from(native: BooleanNative) -> Self {
        Self(native)
    }
}

impl From<Boolean> for BooleanNative {
    fn from(boolean: Boolean) -> Self {
        boolean.0
    }
}

impl From<&BooleanNative> for Boolean {
    fn from(native: &BooleanNative) -> Self {
        Self(*native)
    }
}

impl From<&Boolean> for BooleanNative {
    fn from(boolean: &Boolean) -> Self {
        boolean.0
    }
}

impl FromStr for Boolean {
    type Err = anyhow::Error;

    fn from_str(boolean: &str) -> Result<Self, Self::Err> {
        Ok(Self(BooleanNative::from_str(boolean)?))
    }
}
