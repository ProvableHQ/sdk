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
    Address, Ciphertext, Field, Scalar, from_js_typed_array, from_wasm_object_array, js_array_from_fields,
    native::{FieldNative, LiteralNative, U8Native},
    plaintext_to_js_value, to_bits_array_le,
    types::native::{IdentifierNative, PlaintextNative},
};
use snarkvm_console::prelude::{FromBits, FromBytes, FromFields, ToBits, ToBitsRaw, ToBytes, ToFields, ToFieldsRaw};

use js_sys::{Array, Uint8Array};
use std::{ops::Deref, str::FromStr, sync::OnceLock};
use wasm_bindgen::{JsValue, convert::TryFromJsValue, prelude::wasm_bindgen};

/// SnarkVM Plaintext object. Plaintext is a fundamental monadic type used to represent Aleo
/// primitive types (boolean, field, group, i8, i16, i32, i64, i128, u8, u16, u32, u64, u128,
/// scalar, and signature), struct types, and array types.
///
/// In the context of a web or NodeJS application, this type is useful for turning an Aleo type into
/// a JS value, object, or array that might be necessary for performing computations within the
/// application.
///
/// @example
/// // Get the bond state of an existing address.
/// const bondState = await fetch(https://api.provable.com/v2/mainnet/program/credits.aleo/mapping/bond_state/aleo12zlythl7htjdtjjjz3ahdj4vl6wk3zuzm37s80l86qpx8fyx95fqnxcn2f);
/// // Convert the bond state to a Plaintext object.
/// const bondStatePlaintext = Plaintext.fromString(bond_state);
/// // Convert the Plaintext object to a JS object.
/// const bondStateObject = bond_state_plaintext.toObject();
/// // Check if the bond state matches the expected object.
/// const expectedObject = { validator: "aleo12zlythl7htjdtjjjz3ahdj4vl6wk3zuzm37s80l86qpx8fyx95fqnxcn2f", microcredits: 100000000u64 };
/// assert( JSON.stringify(bondStateObject) === JSON.stringify(expectedObject) );
#[wasm_bindgen]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Plaintext(PlaintextNative);

#[wasm_bindgen]
impl Plaintext {
    /// Find plaintext member if the plaintext is a struct. Returns `null` if the plaintext is not
    /// a struct or the member does not exist.
    ///
    /// @param {string} name The name of the plaintext member to find.
    ///
    /// @returns {Plaintext} The plaintext member.
    pub fn find(&self, name: String) -> Result<Plaintext, String> {
        let identifier = IdentifierNative::from_str(&name).map_err(|e| e.to_string())?;
        match self.0.find(&[identifier]) {
            Ok(plaintext) => Ok(Plaintext(plaintext)),
            Err(e) => Err(e.to_string()),
        }
    }

    /// Encrypt a plaintext with an address and randomizer.
    ///
    /// @param {Address} address The address to encrypt the plaintext for.
    /// @param {Scalar} randomizer The randomizer to use for encryption.
    ///
    /// @returns {Ciphertext} The encrypted ciphertext.
    #[wasm_bindgen(js_name = encrypt)]
    pub fn encrypt(&self, address: &Address, randomizer: &Scalar) -> Result<Ciphertext, String> {
        self.0.encrypt(address, **randomizer).map_err(|e| e.to_string()).map(Ciphertext::from)
    }

    /// Encrypt a plaintext with a transition view key.
    ///
    /// @param {Field} transition_view_key The transition view key of the transition
    /// associated with the plaintext.
    ///
    /// @returns {Ciphertext} The encrypted ciphertext.
    #[wasm_bindgen(js_name = encryptSymmetric)]
    pub fn encrypt_symmetric(&self, transition_view_key: &Field) -> Result<Ciphertext, String> {
        self.0.encrypt_symmetric(**transition_view_key).map_err(|e| e.to_string()).map(Ciphertext::from)
    }

    /// Creates a plaintext object from a string representation of a plaintext.
    ///
    /// @param {string} plaintext The string representation of the plaintext.
    ///
    /// @returns {Plaintext} The plaintext object.
    #[wasm_bindgen(js_name = "fromString")]
    pub fn from_string(plaintext: &str) -> Result<Plaintext, String> {
        Ok(Self(PlaintextNative::from_str(plaintext).map_err(|e| e.to_string())?))
    }

    /// Get a plaintext object from a series of bytes.
    ///
    /// @param {Uint8Array} bytes A little endian byte array representing the plaintext.
    ///
    /// @returns {Plaintext} The plaintext object.
    #[wasm_bindgen(js_name = "fromBytesLe")]
    pub fn from_bytes_le(bytes: Uint8Array) -> Result<Plaintext, String> {
        let rust_bytes = bytes.to_vec();
        let native = PlaintextNative::from_bytes_le(rust_bytes.as_slice()).map_err(|e| e.to_string())?;
        Ok(Self(native))
    }

    /// Get the little endian byte array representation of the plaintext.
    ///
    /// @returns {Uint8Array} The little endian byte array representation of the plaintext.
    #[wasm_bindgen(js_name = "toBytesLe")]
    pub fn to_bytes_le(&self) -> Result<Uint8Array, String> {
        let rust_bytes = self.0.to_bytes_le().map_err(|e| e.to_string())?;
        Ok(Uint8Array::from(rust_bytes.as_slice()))
    }

    /// Get the raw little endian byte array representation of the plaintext.
    ///
    /// @returns {Uint8Array} The raw little endian byte array representation of the plaintext.
    #[wasm_bindgen(js_name = "toBytesRawLe")]
    pub fn to_bytes_raw_le(&self) -> Result<Uint8Array, String> {
        let bits_le = self.0.to_bits_raw_le();
        // Pack the little endian bits into u8 elements and transform them into bytes.
        let rust_bytes = bits_le
            .chunks(8)
            .map(|chunk| U8Native::from_bits_le(chunk).map_err(|e| e.to_string()))
            .collect::<Result<Vec<U8Native>, String>>()?
            .into_iter()
            .map(|u8| u8.to_bytes_le().unwrap())
            .flatten()
            .collect::<Vec<u8>>();
        Ok(Uint8Array::from(rust_bytes.as_slice()))
    }

    /// Get the raw big endian byte array representation of the plaintext.
    ///
    /// @returns {Uint8Array} The raw big endian byte array representation of the plaintext.
    #[wasm_bindgen(js_name = "toBytesRawBe")]
    pub fn to_bytes_raw_be(&self) -> Result<Uint8Array, String> {
        let bits_be = self.0.to_bits_raw_be();
        // Pack the big endian bits into u8 elements and transform them into bytes.
        let mut rust_bytes = bits_be
            .chunks(8)
            .map(|chunk| U8Native::from_bits_be(chunk).map_err(|e| e.to_string()))
            .collect::<Result<Vec<U8Native>, String>>()?
            .into_iter()
            .map(|u8| u8.to_bytes_le().unwrap())
            .flatten()
            .collect::<Vec<u8>>();
        rust_bytes.reverse();
        Ok(Uint8Array::from(rust_bytes.as_slice()))
    }

    /// Get a plaintext object from a series of bits represented as a boolean array.
    ///
    /// @param {Array} bits A little endian boolean array representing the bits plaintext.
    ///
    /// @returns {Plaintext} The plaintext object.
    #[wasm_bindgen(js_name = "fromBitsLe")]
    pub fn from_bits_le(bits: Array) -> Result<Plaintext, String> {
        let rust_bits = from_js_typed_array!(bits, as_bool, "boolean")?;
        let native = PlaintextNative::from_bits_le(&rust_bits).map_err(|e| e.to_string())?;
        Ok(Self(native))
    }

    /// Get the little endian boolean array representation of the bits of the plaintext.
    ///
    /// @returns {Array} The little endian boolean array representation of the bits of the plaintext.
    #[wasm_bindgen(js_name = "toBitsLe")]
    pub fn to_bits_le(&self) -> Array {
        to_bits_array_le!(self)
    }

    /// Get the raw little endian boolean array representation of the bits of the plaintext.
    ///
    /// @returns {Array} The raw little endian boolean array representation of the bits of the plaintext.
    #[wasm_bindgen(js_name = "toBitsRawLe")]
    pub fn to_bits_raw_le(&self) -> Array {
        self.0.to_bits_raw_le().iter().map(|x| wasm_bindgen::JsValue::from_bool(*x)).collect::<js_sys::Array>()
    }

    /// Get the raw big endian boolean array representation of the bits of the plaintext.
    ///
    /// @returns {Array} The raw big endian boolean array representation of the bits of the plaintext.
    #[wasm_bindgen(js_name = "toBitsRawBe")]
    pub fn to_bits_raw_be(&self) -> Array {
        self.0.to_bits_raw_be().iter().map(|x| wasm_bindgen::JsValue::from_bool(*x)).collect::<js_sys::Array>()
    }

    /// Get a plaintext object from an array of fields.
    ///
    /// @param {Array} fields An array of fields.
    ///
    /// @returns {Plaintext} The plaintext object.
    #[wasm_bindgen(js_name = "fromFields")]
    pub fn from_fields(fields: Array) -> Result<Plaintext, String> {
        let native_fields = from_wasm_object_array!(fields, Field)?;
        let native = PlaintextNative::from_fields(&native_fields).map_err(|e| e.to_string())?;
        Ok(Self(native))
    }

    /// Get the field array representation of the plaintext.
    ///
    /// @returns {Array} The field array representation of the plaintext.
    #[wasm_bindgen(js_name = "toFields")]
    pub fn to_fields(&self) -> Result<Array, String> {
        let native = self.0.clone();
        let native_fields = native.to_fields().map_err(|e| e.to_string())?;
        Ok(js_array_from_fields!(&native_fields))
    }

    /// Get the raw field array representation of the plaintext.
    ///
    /// @returns {Array} The raw field array representation of the plaintext.
    #[wasm_bindgen(js_name = "toFieldsRaw")]
    pub fn to_fields_raw(&self) -> Result<Array, String> {
        let native = self.0.clone();
        let native_fields_raw = native.to_fields_raw().map_err(|e| e.to_string())?;
        Ok(js_array_from_fields!(&native_fields_raw))
    }

    /// Returns the string representation of the plaintext.
    ///
    /// @returns {string} The string representation of the plaintext.
    #[wasm_bindgen(js_name = "toString")]
    #[allow(clippy::inherent_to_string)]
    pub fn to_string(&self) -> String {
        self.0.to_string()
    }

    /// Gives the type of the plaintext.
    ///
    /// @returns {string} The type of the plaintext.
    #[wasm_bindgen(js_name = "plaintextType")]
    pub fn plaintext_type(&self) -> String {
        match &self.0 {
            PlaintextNative::Literal(literal, _) => literal.to_type().type_name().to_string(),
            PlaintextNative::Struct(..) => "struct".to_string(),
            PlaintextNative::Array(..) => "array".to_string(),
        }
    }

    /// Attempt to convert the plaintext to a JS object.
    ///
    /// @returns {Object} The JS object representation of the plaintext.
    #[wasm_bindgen(js_name = "toObject")]
    pub fn to_object(&self) -> Result<JsValue, String> {
        Ok(plaintext_to_js_value(&self.0))
    }
}

impl Deref for Plaintext {
    type Target = PlaintextNative;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl From<PlaintextNative> for Plaintext {
    fn from(native: PlaintextNative) -> Self {
        Self(native)
    }
}

impl From<Plaintext> for PlaintextNative {
    fn from(plaintext: Plaintext) -> Self {
        plaintext.0
    }
}

impl From<&PlaintextNative> for Plaintext {
    fn from(plaintext: &PlaintextNative) -> Self {
        Plaintext::from(plaintext.clone())
    }
}

impl From<&Plaintext> for PlaintextNative {
    fn from(plaintext: &Plaintext) -> Self {
        plaintext.0.clone()
    }
}

impl From<LiteralNative> for Plaintext {
    fn from(value: LiteralNative) -> Self {
        let native = PlaintextNative::Literal(value, OnceLock::new());
        Self(native)
    }
}

impl From<&LiteralNative> for Plaintext {
    fn from(value: &LiteralNative) -> Self {
        Self::from(value.clone())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::object;
    use js_sys::Object;

    use wasm_bindgen_test::wasm_bindgen_test;

    const STRUCT: &str = "{\n  microcredits: 100000000u64,\n  height: 1653124u32\n}";

    const NESTED_STRUCT: &str = "{ player: aleo13nnjqa7h2u4mpl95guz97nhzkhlde750zsjnw59tkgdwc85lyurs295lxc, health: 100u8, inventory: { coins: 5u32, snacks: { candies: 5u64, vegetals: 6u64 } }, secret: 2group, cipher: 2scalar, is_alive: true }";

    #[wasm_bindgen_test]
    fn test_literal_plaintext_to_and_from() {
        // address
        let plaintext =
            Plaintext::from_string("aleo13nnjqa7h2u4mpl95guz97nhzkhlde750zsjnw59tkgdwc85lyurs295lxc").unwrap();
        assert_eq!(plaintext.to_string(), "aleo13nnjqa7h2u4mpl95guz97nhzkhlde750zsjnw59tkgdwc85lyurs295lxc");
        assert!(plaintext.to_object().unwrap().is_string());
        // bool
        let plaintext = Plaintext::from_string("true").unwrap();
        assert_eq!(plaintext.to_string(), "true");
        // field
        let plaintext = Plaintext::from_string("1field").unwrap();
        assert_eq!(plaintext.to_string(), "1field");
        // group
        let plaintext = Plaintext::from_string("2group").unwrap();
        assert_eq!(plaintext.to_string(), "2group");
        // i8
        let plaintext = Plaintext::from_string("100i8").unwrap();
        assert_eq!(plaintext.to_string(), "100i8");
        // i16
        let plaintext = Plaintext::from_string("100i16").unwrap();
        assert_eq!(plaintext.to_string(), "100i16");
        // i32
        let plaintext = Plaintext::from_string("100i32").unwrap();
        assert_eq!(plaintext.to_string(), "100i32");
        // i64
        let plaintext = Plaintext::from_string("100i64").unwrap();
        assert_eq!(plaintext.to_string(), "100i64");
        // i128
        let plaintext = Plaintext::from_string("100i128").unwrap();
        assert_eq!(plaintext.to_string(), "100i128");
        // u8
        let plaintext = Plaintext::from_string("100u8").unwrap();
        assert_eq!(plaintext.to_string(), "100u8");
        // u16
        let plaintext = Plaintext::from_string("100u16").unwrap();
        assert_eq!(plaintext.to_string(), "100u16");
        // u32
        let plaintext = Plaintext::from_string("100u32").unwrap();
        assert_eq!(plaintext.to_string(), "100u32");
        // u64
        let plaintext = Plaintext::from_string("100u64").unwrap();
        assert_eq!(plaintext.to_string(), "100u64");
        // u128
        let plaintext = Plaintext::from_string("100u128").unwrap();
        assert_eq!(plaintext.to_string(), "100u128");
        // scalar
        let plaintext = Plaintext::from_string("1scalar").unwrap();
        assert_eq!(plaintext.to_string(), "1scalar");
    }

    #[wasm_bindgen_test]
    fn test_struct_find() {
        let plaintext = Plaintext::from_string(STRUCT).unwrap();
        assert_eq!(plaintext.to_string(), "{\n  microcredits: 100000000u64,\n  height: 1653124u32\n}");
        let microcredits = Plaintext::from_string("100000000u64").unwrap();
        let height = Plaintext::from_string("1653124u32").unwrap();
        assert_eq!(plaintext.find("microcredits".to_string()).unwrap(), microcredits);
        assert_eq!(plaintext.find("height".to_string()).unwrap(), height);
    }

    #[wasm_bindgen_test]
    fn test_struct_to_object() {
        let plaintext = Plaintext::from_string(NESTED_STRUCT).unwrap().to_object().unwrap();
        let js_object = Object::try_from(&plaintext).unwrap();
        let expected_object = object! {
            "player": "aleo13nnjqa7h2u4mpl95guz97nhzkhlde750zsjnw59tkgdwc85lyurs295lxc",
            "health": 100u8,
            "inventory": object! {
                "coins": 5u32,
                "snacks": object! {
                    "candies": 5u64,
                    "vegetals": 6u64,
                },
            },
            "secret": "2group",
            "cipher": "2scalar",
            "is_alive": true,
        };
        assert_eq!(format!("{js_object:?}"), format!("{expected_object:?}"));
    }
}
