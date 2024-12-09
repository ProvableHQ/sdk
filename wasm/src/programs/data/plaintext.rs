// Copyright (C) 2019-2023 Aleo Systems Inc.
// This file is part of the Aleo SDK library.

// The Aleo SDK library is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// The Aleo SDK library is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with the Aleo SDK library. If not, see <https://www.gnu.org/licenses/>.

use crate::{
    plaintext_to_js_value,
    types::native::{FromBytes, IdentifierNative, PlaintextNative, ToBytes},
    Address,
    Ciphertext,
    Field,
    Scalar,
};
use std::ops::Deref;

use js_sys::Uint8Array;
use std::str::FromStr;
use wasm_bindgen::{prelude::wasm_bindgen, JsValue};

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
/// const bondState = await fetch(https://api.explorer.provable.com/v1/mainnet/program/credits.aleo/mapping/bond_state/aleo12zlythl7htjdtjjjz3ahdj4vl6wk3zuzm37s80l86qpx8fyx95fqnxcn2f);
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
    /// @returns {Plaintext | undefined} The plaintext member.
    pub fn find(&self, name: String) -> Option<Plaintext> {
        let identifier = IdentifierNative::from_str(&name).ok()?;
        match self.0.find(&[identifier]) {
            Ok(plaintext) => Some(Plaintext(plaintext)),
            Err(_) => None,
        }
    }

    /// Encrypt a plaintext with an address and randomizer.
    pub fn encrypt(&self, address: &Address, randomizer: &Scalar) -> Result<Ciphertext, String> {
        self.0.encrypt(address, **randomizer).map_err(|e| e.to_string()).map(Ciphertext::from)
    }

    /// Encrypt a plaintext with a transition view key.
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
    /// @param {Uint8Array} bytes A left endian byte array representing the plaintext.
    ///
    /// @returns {Plaintext} The plaintext object.
    #[wasm_bindgen(js_name = "fromBytesLe")]
    pub fn from_bytes_le(bytes: Uint8Array) -> Result<Plaintext, String> {
        let rust_bytes = bytes.to_vec();
        let native = PlaintextNative::from_bytes_le(rust_bytes.as_slice()).map_err(|e| e.to_string())?;
        Ok(Self(native))
    }

    /// Generate a random plaintext element from a series of bytes.
    ///
    /// @param {Uint8Array} bytes A left endian byte array representing the plaintext.
    #[wasm_bindgen(js_name = "toBytesLe")]
    pub fn to_bytes_le(&self) -> Result<Uint8Array, String> {
        let rust_bytes = self.0.to_bytes_le().map_err(|e| e.to_string())?;
        Ok(Uint8Array::from(rust_bytes.as_slice()))
    }

    /// Returns the string representation of the plaintext.
    ///
    /// @returns {string} The string representation of the plaintext.
    #[wasm_bindgen(js_name = "toString")]
    #[allow(clippy::inherent_to_string)]
    pub fn to_string(&self) -> String {
        self.0.to_string()
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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::object;
    use js_sys::{Object, Reflect};

    use wasm_bindgen_test::wasm_bindgen_test;

    const STRUCT: &str = "{ microcredits: 100000000u64, height: 1653124u32 }";

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
