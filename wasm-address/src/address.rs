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
    Field,
    types::{AddressNative, Console, FieldNative, GroupNative},
};
use snarkvm_console::{
    algorithms::{HashToGroup, Poseidon4},
    prelude::{FromBits, FromBytes, FromFields, ToBits, ToBytes, ToFields},
};

use core::{fmt, ops::Deref, str::FromStr};
use js_sys::{Array, Uint8Array};
use std::sync::OnceLock;
use wasm_bindgen::{JsCast, convert::TryFromJsValue, prelude::*};

/// Public address of an Aleo account.
#[wasm_bindgen]
#[derive(Copy, Clone, Debug, PartialEq, Eq)]
pub struct Address(AddressNative);

#[wasm_bindgen]
impl Address {
    /// Create an Aleo address from its string representation.
    ///
    /// @param {string} address String representation of an address.
    /// @returns {Address} The address object.
    pub fn from_string(address: &str) -> Result<Self, String> {
        Self::from_str(address).map_err(|e| e.to_string())
    }

    /// Get the string representation of the address.
    ///
    /// @returns {string} String representation of the address.
    #[allow(clippy::inherent_to_string_shadow_display)]
    pub fn to_string(&self) -> String {
        self.0.to_string()
    }

    /// Create an address from a Uint8Array of little-endian bytes.
    ///
    /// @param {Uint8Array} bytes Little-endian byte array representing the address.
    /// @returns {Address} The address object.
    #[wasm_bindgen(js_name = "fromBytesLe")]
    pub fn from_bytes_le(bytes: Uint8Array) -> Result<Self, String> {
        let rust_bytes = bytes.to_vec();
        let native = AddressNative::from_bytes_le(rust_bytes.as_slice()).map_err(|e| e.to_string())?;
        Ok(Self(native))
    }

    /// Get the little-endian byte array representation of the address.
    ///
    /// @returns {Uint8Array} Little-endian byte array of the address.
    #[wasm_bindgen(js_name = "toBytesLe")]
    pub fn to_bytes_le(&self) -> Result<Uint8Array, String> {
        let rust_bytes = self.0.to_bytes_le().map_err(|e| e.to_string())?;
        Ok(Uint8Array::from(rust_bytes.as_slice()))
    }

    /// Create an address from a little-endian boolean bit array.
    ///
    /// @param {Array} bits Little-endian boolean array representing the bits of the address.
    /// @returns {Address} The address object.
    #[wasm_bindgen(js_name = "fromBitsLe")]
    pub fn from_bits_le(bits: Array) -> Result<Self, String> {
        let rust_bits = bits
            .iter()
            .map(|x| x.as_bool().ok_or_else(|| "Input must be a boolean array".to_string()))
            .collect::<Result<Vec<bool>, String>>()?;
        let native = AddressNative::from_bits_le(&rust_bits).map_err(|e| e.to_string())?;
        Ok(Self(native))
    }

    /// Get the little-endian boolean bit array representation of the address.
    ///
    /// @returns {Array} Little-endian boolean bit array.
    #[wasm_bindgen(js_name = "toBitsLe")]
    pub fn to_bits_le(&self) -> Array {
        self.0.to_bits_le().iter().map(|x| JsValue::from_bool(*x)).collect::<Array>()
    }

    /// Create an address from an array of Field elements.
    ///
    /// @param {Array} fields An array of Field objects.
    /// @returns {Address} The address object.
    #[wasm_bindgen(js_name = "fromFields")]
    pub fn from_fields(fields: Array) -> Result<Self, String> {
        let native_fields = fields
            .iter()
            .map(|x| {
                Field::try_from_js_value(x)
                    .map(|f| *f)
                    .map_err(|_| "Input must be an array of Field objects".to_string())
            })
            .collect::<Result<Vec<FieldNative>, String>>()?;
        let native = AddressNative::from_fields(&native_fields).map_err(|e| e.to_string())?;
        Ok(Self(native))
    }

    /// Get the field element array representation of the address.
    ///
    /// @returns {Array} Array of Field objects.
    #[wasm_bindgen(js_name = "toFields")]
    pub fn to_fields(&self) -> Result<Array, String> {
        let native_fields = self.0.to_fields().map_err(|e| e.to_string())?;
        let js_array = Array::new();
        native_fields.iter().for_each(|field| {
            js_array.push(&JsValue::from(Field::from(field)));
        });
        Ok(js_array)
    }

    /// Derive the address corresponding to a program ID.
    ///
    /// The encoding matches the snarkVM convention: each identifier component (name and network)
    /// is encoded as a field element by packing the UTF-8 bytes into a little-endian bit array,
    /// then the pair is hashed to a group element using Poseidon4 with domain "AleoPoseidon4".
    /// This is network-agnostic since both MainnetV0 and TestnetV0 use identical Poseidon
    /// parameters over the same curve.
    ///
    /// @param {string} program_id The program ID string (e.g. "credits.aleo").
    /// @returns {Address} The address corresponding to the program ID.
    #[wasm_bindgen(js_name = "fromProgramId")]
    pub fn from_program_id(program_id: &str) -> Result<Self, String> {
        // Parse "name.network" (e.g., "credits.aleo").
        let (name, network) =
            program_id.split_once('.').ok_or("Invalid program ID: expected 'name.network' format")?;

        // Encode an identifier string as a field element, matching Identifier::to_field().
        // The encoding is: Field::from_bits_le(identifier_utf8_bytes.to_bits_le()).
        let encode_identifier = |s: &str| -> Result<FieldNative, String> {
            if s.is_empty() {
                return Err("Identifier cannot be empty".to_string());
            }
            if !s.chars().next().unwrap().is_ascii_alphabetic() {
                return Err("Identifier must start with a letter".to_string());
            }
            if s.chars().any(|c| !c.is_ascii_alphanumeric() && c != '_') {
                return Err(format!("Identifier '{s}' must consist of letters, digits, and underscores"));
            }
            FieldNative::from_bits_le(&s.as_bytes().to_bits_le()).map_err(|e| e.to_string())
        };

        let name_field = encode_identifier(name)?;
        let network_field = encode_identifier(network)?;

        // Hash to group using Poseidon4 with the same domain used by all snarkVM networks.
        static POSEIDON: OnceLock<Poseidon4<Console>> = OnceLock::new();
        let poseidon =
            POSEIDON.get_or_init(|| Poseidon4::<Console>::setup("AleoPoseidon4").expect("Failed to setup Poseidon4"));

        let group: GroupNative = poseidon.hash_to_group(&[name_field, network_field]).map_err(|e| e.to_string())?;
        Ok(Self(AddressNative::new(group)))
    }

    /// Check if the input is a valid Aleo address.
    ///
    /// @param {string | Uint8Array} address Either a string representation or a little-endian
    ///        Uint8Array of bytes.
    /// @returns {boolean} True if the input is a valid address, false otherwise.
    #[wasm_bindgen(js_name = "isValid")]
    pub fn is_valid(address: JsValue) -> bool {
        if let Some(address_str) = address.as_string() {
            return AddressNative::from_str(&address_str).is_ok();
        }
        if let Some(bytes) = address.dyn_ref::<Uint8Array>() {
            let rust_bytes = bytes.to_vec();
            return AddressNative::from_bytes_le(rust_bytes.as_slice()).is_ok();
        }
        false
    }
}

impl Deref for Address {
    type Target = AddressNative;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl fmt::Display for Address {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl From<AddressNative> for Address {
    fn from(value: AddressNative) -> Self {
        Self(value)
    }
}

impl FromStr for Address {
    type Err = anyhow::Error;

    fn from_str(address: &str) -> Result<Self, Self::Err> {
        Ok(Self(AddressNative::from_str(address)?))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use js_sys::Uint8Array;
    use wasm_bindgen::JsValue;
    use wasm_bindgen_test::*;

    #[wasm_bindgen_test]
    pub fn test_from_string_roundtrip() {
        let address_str = "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px";
        let address = Address::from_string(address_str).unwrap();
        assert_eq!(address.to_string(), address_str);
    }

    #[wasm_bindgen_test]
    pub fn test_from_string_rejects_invalid() {
        assert!(Address::from_string("invalid_address").is_err());
        assert!(Address::from_string("aleo1xyz").is_err());
        assert!(Address::from_string("").is_err());
    }

    #[wasm_bindgen_test]
    pub fn test_bytes_roundtrip() {
        let address_str = "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px";
        let address = Address::from_string(address_str).unwrap();
        let bytes = address.to_bytes_le().unwrap();
        let recovered = Address::from_bytes_le(bytes).unwrap();
        assert_eq!(address, recovered);
    }

    #[wasm_bindgen_test]
    pub fn test_bits_roundtrip() {
        let address_str = "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px";
        let address = Address::from_string(address_str).unwrap();
        let bits = address.to_bits_le();
        let recovered = Address::from_bits_le(bits).unwrap();
        assert_eq!(address, recovered);
    }

    #[wasm_bindgen_test]
    pub fn test_fields_roundtrip() {
        let address_str = "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px";
        let address = Address::from_string(address_str).unwrap();
        let fields = address.to_fields().unwrap();
        let recovered = Address::from_fields(fields).unwrap();
        assert_eq!(address, recovered);
    }

    #[wasm_bindgen_test]
    pub fn test_from_program_id() {
        let expected = "aleo1lqmly7ez2k48ajf5hs92ulphaqr05qm4n8qwzj8v0yprmasgpqgsez59gg";
        let address = Address::from_program_id("credits.aleo").unwrap();
        assert_eq!(address.to_string(), expected);
    }

    #[wasm_bindgen_test]
    pub fn test_is_valid_string() {
        let valid = "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px";
        assert!(Address::is_valid(JsValue::from_str(valid)));
        assert!(!Address::is_valid(JsValue::from_str("invalid_address")));
        assert!(!Address::is_valid(JsValue::from_str("aleo1xyz")));
        assert!(!Address::is_valid(JsValue::from_str("")));
    }

    #[wasm_bindgen_test]
    pub fn test_is_valid_bytes() {
        let valid = "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px";
        let address = Address::from_string(valid).unwrap();
        let bytes = address.to_bytes_le().unwrap();
        assert!(Address::is_valid(JsValue::from(bytes)));

        let invalid_bytes = Uint8Array::new_with_length(3);
        invalid_bytes.copy_from(&[1, 2, 3]);
        assert!(!Address::is_valid(JsValue::from(invalid_bytes)));

        let empty_bytes = Uint8Array::new_with_length(0);
        assert!(!Address::is_valid(JsValue::from(empty_bytes)));
    }

    #[wasm_bindgen_test]
    pub fn test_is_valid_rejects_non_address() {
        assert!(!Address::is_valid(JsValue::from_f64(42.0)));
    }
}
