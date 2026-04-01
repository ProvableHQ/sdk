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
    Plaintext,
    from_js_typed_array,
    to_bits_array_le,
    types::{Boolean, Field, native::*},
};
use js_sys::{Array, Uint8Array};
use snarkvm_console::prelude::{
    AbsChecked,
    AbsWrapped,
    AddWrapped,
    DivWrapped,
    FromBits,
    FromBytes,
    FromField,
    FromFields,
    MulWrapped,
    Pow,
    Rem,
    RemWrapped,
    SubWrapped,
    ToBits,
    ToBytes,
    ToField,
};
use std::{ops::Deref, str::FromStr};
use wasm_bindgen::prelude::*;

macro_rules! impl_integer {
    ($name:ident, $native:ty) => {
        #[wasm_bindgen]
        #[derive(Clone, Debug, Eq, PartialEq)]
        pub struct $name($native);

        #[wasm_bindgen]
        impl $name {
            /// Construct an integer from a string representation.
            #[wasm_bindgen(js_name = "fromString")]
            pub fn from_string(s: &str) -> Result<$name, String> {
                Ok(Self(<$native>::from_str(s).map_err(|e| e.to_string())?))
            }

            /// Get the string representation of the integer.
            #[wasm_bindgen(js_name = "toString")]
            pub fn to_string(&self) -> String {
                self.0.to_string()
            }

            /// Get the byte array representation of the integer.
            #[wasm_bindgen(js_name = "fromBytesLe")]
            pub fn from_bytes_le(bytes: &Uint8Array) -> Result<$name, String> {
                let bytes = bytes.to_vec();
                let val = <$native>::from_bytes_le(&bytes).map_err(|e| e.to_string())?;
                Ok(Self(val))
            }

            /// Construct an integer from a byte array representation.
            #[wasm_bindgen(js_name = "toBytesLe")]
            pub fn to_bytes_le(&self) -> Result<Uint8Array, String> {
                let bytes = self.0.to_bytes_le().map_err(|e| e.to_string())?;
                Ok(Uint8Array::from(bytes.as_slice()))
            }

            /// Construct an integer from a boolean array representation.
            #[wasm_bindgen(js_name = "fromBitsLe")]
            pub fn from_bits_le(bits: &Array) -> Result<$name, String> {
                let bit_vec = from_js_typed_array!(bits, as_bool, "boolean")?;
                let val = <$native>::from_bits_le(&bit_vec).map_err(|e| e.to_string())?;
                Ok(Self(val))
            }

            /// Get the boolean array representation of the integer.
            #[wasm_bindgen(js_name = "toBitsLe")]
            pub fn to_bits_le(&self) -> Array {
                to_bits_array_le!(self)
            }

            /// Checked absolute value.
            #[wasm_bindgen(js_name = "absChecked")]
            pub fn abs_checked(&self) -> $name {
                Self(self.0.abs_checked())
            }

            /// Wrapped absolute value.
            #[wasm_bindgen(js_name = "absWrapped")]
            pub fn abs_wrapped(&self) -> $name {
                Self(self.0.abs_wrapped())
            }

            /// Wrapped addition with another integer.
            #[wasm_bindgen(js_name = "addWrapped")]
            pub fn add_wrapped(&self, other: &$name) -> $name {
                Self(self.0.add_wrapped(&other.0))
            }

            /// Wrapped subtraction with another integer.
            #[wasm_bindgen(js_name = "subWrapped")]
            pub fn sub_wrapped(&self, other: &$name) -> $name {
                Self(self.0.sub_wrapped(&other.0))
            }

            /// Wrapped multiplication with another integer.
            #[wasm_bindgen(js_name = "mulWrapped")]
            pub fn mul_wrapped(&self, other: &$name) -> $name {
                Self(self.0.mul_wrapped(&other.0))
            }

            /// Wrapped division.
            #[wasm_bindgen(js_name = "divWrapped")]
            pub fn div_wrapped(&self, other: &$name) -> $name {
                Self(self.0.div_wrapped(&other.0))
            }

            /// Exponentiate the integer with a u8 exponent.
            #[wasm_bindgen(js_name = "powU8")]
            pub fn pow_u8(&self, exponent: &U8) -> $name {
                Self(self.0.pow(&exponent.0))
            }

            /// Exponentiate the integer with a u16 exponent.
            #[wasm_bindgen(js_name = "powU16")]
            pub fn pow_u16(&self, exponent: &U16) -> $name {
                Self(self.0.pow(&exponent.0))
            }

            /// Exponentiate the integer with a u32 exponent.
            #[wasm_bindgen(js_name = "powU32")]
            pub fn pow_u32(&self, exponent: &U32) -> $name {
                Self(self.0.pow(&exponent.0))
            }

            /// Negate the integer (e.g., 5 → -5).
            #[wasm_bindgen(js_name = "neg")]
            pub fn neg(&self) -> $name {
                Self(-self.0)
            }

            /// Check equality with another integer.
            #[wasm_bindgen(js_name = "equals")]
            pub fn equals(&self, other: &$name) -> bool {
                self.0 == other.0
            }

            /// Get the remainder from integer division.
            #[wasm_bindgen(js_name = "rem")]
            pub fn rem(&self, other: &$name) -> $name {
                Self(self.0.rem(&other.0))
            }

            /// Get the remainder from an integer division which wraps if there's an overflow.
            #[wasm_bindgen(js_name = "remWrapped")]
            pub fn rem_wrapped(&self, other: &$name) -> $name {
                Self(self.0.rem_wrapped(&other.0))
            }

            /// Convert the integer to a Scalar value.
            #[wasm_bindgen(js_name = "toScalar")]
            pub fn to_scalar(&self) -> crate::Scalar {
                self.0.to_scalar().into()
            }

            /// Convert the integer to the Plaintext type. This must be done before hashing an integer to ensure it matches hashes with a leo/aleo program.
            #[wasm_bindgen(js_name = "toPlaintext")]
            pub fn to_plaintext(&self) -> Plaintext {
                Plaintext::from(PlaintextNative::Literal(LiteralNative::$name(self.0), std::sync::OnceLock::new()))
            }

            /// Attempt to construct the integer from a field element.
            #[wasm_bindgen(js_name = "fromField")]
            pub fn from_field(field: &crate::Field) -> Result<$name, String> {
                <$native>::from_field(&FieldNative::from(field)).map(Self).map_err(|e| e.to_string())
            }

            /// Atttempt to construct the integer from a list of field elements.
            #[wasm_bindgen(js_name = "fromFields")]
            pub fn from_fields(fields: js_sys::Array) -> Result<$name, String> {
                // Collect JsValue → Field
                let rust_fields: Result<Vec<_>, String> = fields
                    .iter()
                    .map(|jsv| {
                        let field_str = jsv.as_string().ok_or("Expected string for Field")?;
                        let field: FieldNative = FieldNative::from_str(&field_str).map_err(|e| e.to_string())?;
                        Ok(field)
                    })
                    .collect();

                let rust_fields = rust_fields?;
                <$native>::from_fields(&rust_fields).map(Self).map_err(|e| e.to_string())
            }

            /// Clone the integer in wasm memory.
            #[allow(clippy::should_implement_trait)]
            pub fn clone(&self) -> $name {
                $name(self.0)
            }

            // ── cast conversions ────────────────────────────────────────

            /// Convert the integer to a Field element (lossless).
            #[wasm_bindgen(js_name = "toField")]
            pub fn to_field(&self) -> Result<Field, String> {
                Ok(Field::from(self.0.to_field().map_err(|e| e.to_string())?))
            }

            /// Construct an integer from a field element with lossy truncation.
            #[wasm_bindgen(js_name = "fromFieldLossy")]
            pub fn from_field_lossy(field: &Field) -> $name {
                Self(<$native>::from_field_lossy(&FieldNative::from(field)))
            }

            /// Cast the integer to a Boolean with lossy truncation (extracts least-significant bit).
            #[wasm_bindgen(js_name = "toBooleanLossy")]
            pub fn to_boolean_lossy(&self) -> Boolean {
                Boolean::new(self.0.to_bits_le()[0])
            }
        }

        impl Deref for $name {
            type Target = $native;

            fn deref(&self) -> &Self::Target {
                &self.0
            }
        }

        impl From<$native> for $name {
            fn from(n: $native) -> Self {
                Self(n)
            }
        }

        impl From<$name> for $native {
            fn from(n: $name) -> Self {
                n.0
            }
        }

        impl From<&$native> for $name {
            fn from(n: &$native) -> Self {
                Self(*n)
            }
        }

        impl From<&$name> for $native {
            fn from(n: &$name) -> Self {
                n.0
            }
        }
    };
}

// Instantiate for all supported integer types
impl_integer!(I8, I8Native);
impl_integer!(I16, I16Native);
impl_integer!(I32, I32Native);
impl_integer!(I64, I64Native);
impl_integer!(I128, I128Native);

impl_integer!(U8, U8Native);
impl_integer!(U16, U16Native);
impl_integer!(U32, U32Native);
impl_integer!(U64, U64Native);
impl_integer!(U128, U128Native);

// ── Integer cross-cast macro ───────────────────────────────────────────
// Stamps out lossy cross-cast methods (e.g. U32.toU8(), I64.toU32()) for
// all 10 integer types. Each conversion goes through Field as the
// universal intermediate: source.to_field() -> TargetNative::from_field_lossy().

macro_rules! impl_integer_cross_casts {
    ($source:ident) => {
        #[wasm_bindgen]
        impl $source {
            /// Cast to U8 with lossy truncation.
            #[wasm_bindgen(js_name = "toU8Lossy")]
            pub fn to_u8_lossy(&self) -> Result<U8, String> {
                Ok(U8::from(U8Native::from_field_lossy(&self.0.to_field().map_err(|e| e.to_string())?)))
            }

            /// Cast to U16 with lossy truncation.
            #[wasm_bindgen(js_name = "toU16Lossy")]
            pub fn to_u16_lossy(&self) -> Result<U16, String> {
                Ok(U16::from(U16Native::from_field_lossy(&self.0.to_field().map_err(|e| e.to_string())?)))
            }

            /// Cast to U32 with lossy truncation.
            #[wasm_bindgen(js_name = "toU32Lossy")]
            pub fn to_u32_lossy(&self) -> Result<U32, String> {
                Ok(U32::from(U32Native::from_field_lossy(&self.0.to_field().map_err(|e| e.to_string())?)))
            }

            /// Cast to U64 with lossy truncation.
            #[wasm_bindgen(js_name = "toU64Lossy")]
            pub fn to_u64_lossy(&self) -> Result<U64, String> {
                Ok(U64::from(U64Native::from_field_lossy(&self.0.to_field().map_err(|e| e.to_string())?)))
            }

            /// Cast to U128 with lossy truncation.
            #[wasm_bindgen(js_name = "toU128Lossy")]
            pub fn to_u128_lossy(&self) -> Result<U128, String> {
                Ok(U128::from(U128Native::from_field_lossy(&self.0.to_field().map_err(|e| e.to_string())?)))
            }

            /// Cast to I8 with lossy truncation.
            #[wasm_bindgen(js_name = "toI8Lossy")]
            pub fn to_i8_lossy(&self) -> Result<I8, String> {
                Ok(I8::from(I8Native::from_field_lossy(&self.0.to_field().map_err(|e| e.to_string())?)))
            }

            /// Cast to I16 with lossy truncation.
            #[wasm_bindgen(js_name = "toI16Lossy")]
            pub fn to_i16_lossy(&self) -> Result<I16, String> {
                Ok(I16::from(I16Native::from_field_lossy(&self.0.to_field().map_err(|e| e.to_string())?)))
            }

            /// Cast to I32 with lossy truncation.
            #[wasm_bindgen(js_name = "toI32Lossy")]
            pub fn to_i32_lossy(&self) -> Result<I32, String> {
                Ok(I32::from(I32Native::from_field_lossy(&self.0.to_field().map_err(|e| e.to_string())?)))
            }

            /// Cast to I64 with lossy truncation.
            #[wasm_bindgen(js_name = "toI64Lossy")]
            pub fn to_i64_lossy(&self) -> Result<I64, String> {
                Ok(I64::from(I64Native::from_field_lossy(&self.0.to_field().map_err(|e| e.to_string())?)))
            }

            /// Cast to I128 with lossy truncation.
            #[wasm_bindgen(js_name = "toI128Lossy")]
            pub fn to_i128_lossy(&self) -> Result<I128, String> {
                Ok(I128::from(I128Native::from_field_lossy(&self.0.to_field().map_err(|e| e.to_string())?)))
            }
        }
    };
}

impl_integer_cross_casts!(I8);
impl_integer_cross_casts!(I16);
impl_integer_cross_casts!(I32);
impl_integer_cross_casts!(I64);
impl_integer_cross_casts!(I128);
impl_integer_cross_casts!(U8);
impl_integer_cross_casts!(U16);
impl_integer_cross_casts!(U32);
impl_integer_cross_casts!(U64);
impl_integer_cross_casts!(U128);

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_integer_to_field_roundtrip() {
        let val = U32::from_string("42u32").unwrap();
        let field = val.to_field().unwrap();
        let back = U32::from_field(&field).unwrap();
        assert_eq!(val, back);
    }

    #[test]
    fn test_integer_from_field_lossy_roundtrip() {
        // In-range values should round-trip through from_field_lossy
        let val = U8::from_string("200u8").unwrap();
        let field = val.to_field().unwrap();
        let back = U8::from_field_lossy(&field);
        assert_eq!(val, back);
    }

    #[test]
    fn test_integer_to_boolean_lossy() {
        let zero = U32::from_string("0u32").unwrap();
        assert_eq!(zero.to_boolean_lossy().to_string(), "false");

        let one = U32::from_string("1u32").unwrap();
        assert_eq!(one.to_boolean_lossy().to_string(), "true");

        let even = U32::from_string("4u32").unwrap();
        assert_eq!(even.to_boolean_lossy().to_string(), "false");

        let odd = U32::from_string("5u32").unwrap();
        assert_eq!(odd.to_boolean_lossy().to_string(), "true");
    }

    #[test]
    fn test_cross_cast_identity() {
        let val = U32::from_string("42u32").unwrap();
        let cast = val.to_u32_lossy().unwrap();
        assert_eq!(val, cast);
    }

    #[test]
    fn test_cross_cast_widening() {
        let val = U8::from_string("255u8").unwrap();
        let wide = val.to_u32_lossy().unwrap();
        assert_eq!(wide.to_string(), "255u32");
    }

    #[test]
    fn test_cross_cast_narrowing() {
        assert_eq!(U32::from_string("256u32").unwrap().to_u8_lossy().unwrap().to_string(), "0u8");
        assert_eq!(U32::from_string("257u32").unwrap().to_u8_lossy().unwrap().to_string(), "1u8");
    }

    #[test]
    fn test_cross_cast_signed_unsigned() {
        let val = I32::from_string("42i32").unwrap();
        let cast = val.to_u32_lossy().unwrap();
        assert_eq!(cast.to_string(), "42u32");
    }
}
