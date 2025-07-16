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
    from_js_typed_array,
    to_bits_array_le,
    types::native::*,
};
use js_sys::{Array, Uint8Array};
use once_cell::sync::OnceCell;
use std::{ops::Deref, str::FromStr};
use wasm_bindgen::prelude::*;

macro_rules! impl_integer {
    ($name:ident, $native:ty) => {
        #[wasm_bindgen]
        #[derive(Clone, Debug, Eq, PartialEq)]
        pub struct $name(pub $native);

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
