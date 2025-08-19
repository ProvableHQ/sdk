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

use crate::{from_js_typed_array, to_bits_array_le, types::native::*};
// use crate::types::{U8, U16, U32};
use crate::Plaintext;
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
            /// Creates from string.
            #[wasm_bindgen(js_name = "fromString")]
            pub fn from_string(s: &str) -> Result<$name, String> {
                Ok(Self(<$native>::from_str(s).map_err(|e| e.to_string())?))
            }

            /// To string.
            #[wasm_bindgen(js_name = "toString")]
            pub fn to_string(&self) -> String {
                self.0.to_string()
            }

            /// From bytes (LE).
            #[wasm_bindgen(js_name = "fromBytesLe")]
            pub fn from_bytes_le(bytes: &Uint8Array) -> Result<$name, String> {
                let bytes = bytes.to_vec();
                let val = <$native>::from_bytes_le(&bytes).map_err(|e| e.to_string())?;
                Ok(Self(val))
            }

            /// To bytes (LE).
            #[wasm_bindgen(js_name = "toBytesLe")]
            pub fn to_bytes_le(&self) -> Result<Uint8Array, String> {
                let bytes = self.0.to_bytes_le().map_err(|e| e.to_string())?;
                Ok(Uint8Array::from(bytes.as_slice()))
            }

            /// From bits.
            #[wasm_bindgen(js_name = "fromBitsLe")]
            pub fn from_bits_le(bits: &Array) -> Result<$name, String> {
                let bit_vec = from_js_typed_array!(bits, as_bool, "boolean")?;
                let val = <$native>::from_bits_le(&bit_vec).map_err(|e| e.to_string())?;
                Ok(Self(val))
            }

            /// To bits.
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

            /// Wrapped addition.
            #[wasm_bindgen(js_name = "addWrapped")]
            pub fn add_wrapped(&self, other: &$name) -> $name {
                Self(self.0.add_wrapped(&other.0))
            }

            /// Wrapped subtraction.
            #[wasm_bindgen(js_name = "subWrapped")]
            pub fn sub_wrapped(&self, other: &$name) -> $name {
                Self(self.0.sub_wrapped(&other.0))
            }

            /// Wrapped multiplication.
            #[wasm_bindgen(js_name = "mulWrapped")]
            pub fn mul_wrapped(&self, other: &$name) -> $name {
                Self(self.0.mul_wrapped(&other.0))
            }

            /// Wrapped division.
            #[wasm_bindgen(js_name = "divWrapped")]
            pub fn div_wrapped(&self, other: &$name) -> $name {
                Self(self.0.div_wrapped(&other.0))
            }

            /// Power to a u8 exponent.
            #[wasm_bindgen(js_name = "powU8")]
            pub fn pow_u8(&self, exponent: &U8) -> $name {
                Self(self.0.pow(&exponent.0))
            }

            /// Power to a u16 exponent.
            #[wasm_bindgen(js_name = "powU16")]
            pub fn pow_u16(&self, exponent: &U16) -> $name {
                Self(self.0.pow(&exponent.0))
            }

            /// Power to a u32 exponent.
            #[wasm_bindgen(js_name = "powU32")]
            pub fn pow_u32(&self, exponent: &U32) -> $name {
                Self(self.0.pow(&exponent.0))
            }

            /// Negates the integer (e.g., 5 → -5).
            #[wasm_bindgen(js_name = "neg")]
            pub fn neg(&self) -> $name {
                Self(-self.0)
            }

            /// Checks equality with another integer.
            #[wasm_bindgen(js_name = "equals")]
            pub fn equals(&self, other: &$name) -> bool {
                self.0 == other.0
            }

            /// Remainder.
            #[wasm_bindgen(js_name = "rem")]
            pub fn rem(&self, other: &$name) -> $name {
                Self(self.0.rem(&other.0))
            }

            /// Wrapped remainder.
            #[wasm_bindgen(js_name = "remWrapped")]
            pub fn rem_wrapped(&self, other: &$name) -> $name {
                Self(self.0.rem_wrapped(&other.0))
            }

            /// Convert to Scalar.
            #[wasm_bindgen(js_name = "toScalar")]
            pub fn to_scalar(&self) -> crate::Scalar {
                self.0.to_scalar().into()
            }

            /// Convert to plaintext.
            #[wasm_bindgen(js_name = "toPlaintext")]
            pub fn to_plaintext(&self) -> Plaintext {
                Plaintext::from(PlaintextNative::Literal(LiteralNative::$name(self.0), std::sync::OnceLock::new()))
            }

            /// Convert from Field.
            #[wasm_bindgen(js_name = "fromField")]
            pub fn from_field(field: &crate::Field) -> Result<$name, String> {
                <$native>::from_field(&FieldNative::from(field)).map(Self).map_err(|e| e.to_string())
            }

            /// Convert from Fields.
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

            /// Clone.
            pub fn clone(&self) -> $name {
                $name(self.0)
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
