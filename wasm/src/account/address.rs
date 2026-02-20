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
    Group,
    Plaintext,
    account::{PrivateKey, Signature, ViewKey, compute_key::ComputeKey},
    from_js_typed_array,
    from_wasm_object_array,
    js_array_from_fields,
    native::{CurrentNetwork, FieldNative, LiteralNative},
    to_bits_array_le,
    types::native::{AddressNative, ProgramIDNative},
};
use snarkvm_console::prelude::{FromBits, FromBytes, FromFields, Network, ToBits, ToBytes, ToField, ToFields};

use core::{convert::TryFrom, fmt, ops::Deref, str::FromStr};
use js_sys::{Array, Uint8Array};
use wasm_bindgen::{JsCast, convert::TryFromJsValue, prelude::*};

/// Public address of an Aleo account
#[wasm_bindgen]
#[derive(Copy, Clone, Debug, PartialEq, Eq)]
pub struct Address(AddressNative);

#[wasm_bindgen]
impl Address {
    /// Derive an Aleo address from a private key
    ///
    /// @param {PrivateKey} private_key The private key to derive the address from
    /// @returns {Address} Address corresponding to the private key
    pub fn from_private_key(private_key: &PrivateKey) -> Self {
        Self(AddressNative::try_from(**private_key).unwrap())
    }

    /// Derive an Aleo address from a view key
    ///
    /// @param {ViewKey} view_key The view key to derive the address from
    /// @returns {Address} Address corresponding to the view key
    pub fn from_view_key(view_key: &ViewKey) -> Self {
        Self(AddressNative::try_from(**view_key).unwrap())
    }

    /// Derive an Aleo address from a compute key.
    ///
    /// @param {ComputeKey} compute_key The compute key to derive the address from
    pub fn from_compute_key(compute_key: &ComputeKey) -> Self {
        compute_key.address()
    }

    /// Get an address from a series of bytes.
    ///
    /// @param {Uint8Array} bytes A left endian byte array representing the address.
    ///
    /// @returns {Address} The address object.
    #[wasm_bindgen(js_name = "fromBytesLe")]
    pub fn from_bytes_le(bytes: Uint8Array) -> Result<Self, String> {
        let rust_bytes = bytes.to_vec();
        let native = AddressNative::from_bytes_le(rust_bytes.as_slice()).map_err(|e| e.to_string())?;
        Ok(Self(native))
    }

    /// Get the left endian byte array representation of the address.
    #[wasm_bindgen(js_name = "toBytesLe")]
    pub fn to_bytes_le(&self) -> Result<Uint8Array, String> {
        let rust_bytes = self.0.to_bytes_le().map_err(|e| e.to_string())?;
        Ok(Uint8Array::from(rust_bytes.as_slice()))
    }

    /// Get an address from a series of bits represented as a boolean array.
    ///
    /// @param {Array} bits A left endian boolean array representing the bits of the address.
    ///
    /// @returns {Address} The address object.
    #[wasm_bindgen(js_name = "fromBitsLe")]
    pub fn from_bits_le(bits: Array) -> Result<Self, String> {
        let rust_bits = from_js_typed_array!(bits, as_bool, "boolean")?;
        let native = AddressNative::from_bits_le(&rust_bits).map_err(|e| e.to_string())?;
        Ok(Self(native))
    }

    /// Get the left endian boolean array representation of the bits of the address.
    #[wasm_bindgen(js_name = "toBitsLe")]
    pub fn to_bits_le(&self) -> Array {
        to_bits_array_le!(self)
    }

    /// Get an address object from an array of fields.
    ///
    /// @param {Array} fields An array of fields.
    ///
    /// @returns {Plaintext} The address object.
    #[wasm_bindgen(js_name = "fromFields")]
    pub fn from_fields(fields: Array) -> Result<Self, String> {
        let native_fields = from_wasm_object_array!(fields, Field)?;
        let native = AddressNative::from_fields(&native_fields).map_err(|e| e.to_string())?;
        Ok(Self(native))
    }

    /// Get the field array representation of the address.
    #[wasm_bindgen(js_name = "toFields")]
    pub fn to_fields(&self) -> Result<Array, String> {
        let native = self.0;
        let native_fields = native.to_fields().map_err(|e| e.to_string())?;
        Ok(js_array_from_fields!(&native_fields))
    }

    /// Get an address object from a group.
    ///
    /// @param {Group} group The group object.
    ///
    /// @returns {Address} The address object.
    #[wasm_bindgen(js_name = "fromGroup")]
    pub fn from_group(group: Group) -> Self {
        Self::from(group)
    }

    /// Get the group representation of the address object.
    #[wasm_bindgen(js_name = "toGroup")]
    pub fn to_group(&self) -> Group {
        Group::from(self)
    }

    /// Create an aleo address object from a string representation of an address.
    /// The input is automatically lowercased before parsing.
    ///
    /// @param {string} address String representation of an address
    /// @returns {Address} Address
    pub fn from_string(address: &str) -> Self {
        Self::from_str(&address.to_lowercase()).unwrap()
    }

    /// Get a string representation of an Aleo address object
    ///
    /// @param {Address} Address
    /// @returns {string} String representation of the address
    #[allow(clippy::inherent_to_string_shadow_display)]
    pub fn to_string(&self) -> String {
        self.0.to_string()
    }

    /// Get the plaintext representation of the address.
    #[wasm_bindgen(js_name = "toPlaintext")]
    pub fn to_plaintext(&self) -> Plaintext {
        Plaintext::from(LiteralNative::Address(self.0))
    }

    /// Verify a signature for a message signed by the address
    ///
    /// @param {Uint8Array} Byte array representing a message signed by the address
    /// @returns {boolean} Boolean representing whether or not the signature is valid
    pub fn verify(&self, message: &[u8], signature: &Signature) -> bool {
        signature.verify(self, message)
    }

    /// Get the address of a program based on the program ID.
    ///
    /// @param {string} program_id The program ID string.
    /// @returns {Address} The address corresponding to the program ID.
    #[wasm_bindgen(js_name = "fromProgramId")]
    pub fn from_program_id(program_id: &str) -> Result<Self, String> {
        // Convert the program ID string to a programId native type.
        let program_id_native = ProgramIDNative::from_str(program_id).map_err(|e| e.to_string())?;

        // Extracting the fields from the program name and network.
        let name_field = program_id_native.name().to_field().map_err(|e| e.to_string())?;
        let network_field = program_id_native.network().to_field().map_err(|e| e.to_string())?;

        // Compute the group element corresponding to the program address.
        let group =
            <CurrentNetwork as Network>::hash_to_group_psd4(&[name_field, network_field]).map_err(|e| e.to_string())?;

        Ok(Address::from(group))
    }

    /// Check if the input is a valid Aleo address.
    /// String addresses are automatically lowercased before validation.
    ///
    /// @param {string | Uint8Array} address - Either a string representation of an address
    ///        or a Uint8Array of bytes in little-endian format.
    /// @returns {boolean} True if the input is a valid address, false otherwise.
    #[wasm_bindgen(js_name = "isValid")]
    pub fn is_valid(address: JsValue) -> bool {
        // Try parsing as string first
        if let Some(address_str) = address.as_string() {
            return AddressNative::from_str(&address_str.to_lowercase()).is_ok();
        }

        // Try parsing as Uint8Array
        if let Some(bytes) = address.dyn_ref::<Uint8Array>() {
            let rust_bytes = bytes.to_vec();
            return AddressNative::from_bytes_le(rust_bytes.as_slice()).is_ok();
        }

        // Neither string nor Uint8Array
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

impl From<Address> for AddressNative {
    fn from(value: Address) -> Self {
        value.0
    }
}

impl From<&AddressNative> for Address {
    fn from(value: &AddressNative) -> Self {
        Self(*value)
    }
}

impl From<&Address> for AddressNative {
    fn from(value: &Address) -> Self {
        value.0
    }
}

impl From<AddressNative> for Group {
    fn from(value: AddressNative) -> Self {
        let vm_group = value.to_group();
        Self::from(vm_group)
    }
}

impl From<Address> for Group {
    fn from(value: Address) -> Self {
        Self::from(value.0)
    }
}

impl From<&AddressNative> for Group {
    fn from(value: &AddressNative) -> Self {
        Self::from(*value)
    }
}

impl From<&Address> for Group {
    fn from(value: &Address) -> Self {
        Self::from(value.0)
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
    use crate::account::PrivateKey;
    use js_sys::Uint8Array;
    use wasm_bindgen::JsValue;

    use wasm_bindgen_test::*;

    const ITERATIONS: u64 = 1_000;

    #[wasm_bindgen_test]
    pub fn test_from_private_key() {
        for _ in 0..ITERATIONS {
            // Sample a new private key.
            let private_key = PrivateKey::new();
            let expected = Address::from_private_key(&private_key);

            // Check the address derived from the view key.
            let view_key = private_key.to_view_key();
            assert_eq!(expected, Address::from_view_key(&view_key));
        }
    }

    #[wasm_bindgen_test]
    pub fn test_from_program_id() {
        let expected_address = "aleo1lqmly7ez2k48ajf5hs92ulphaqr05qm4n8qwzj8v0yprmasgpqgsez59gg".to_string();
        let credits_address = Address::from_program_id("credits.aleo").unwrap();
        assert_eq!(credits_address.to_string(), expected_address);
    }

    #[wasm_bindgen_test]
    pub fn test_is_valid() {
        // Test valid string address
        let valid_address = "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px";
        assert!(Address::is_valid(JsValue::from_str(valid_address)));

        // Test invalid string addresses
        assert!(!Address::is_valid(JsValue::from_str("invalid_address")));
        assert!(!Address::is_valid(JsValue::from_str("aleo1xyz")));
        assert!(!Address::is_valid(JsValue::from_str("")));

        // Test uppercase string addresses are accepted (auto-lowercased)
        let uppercase_address = "ALEO1RHGDU77HGYQD3XJJ8UCU3JJ9R2KRWZ6MNZYD80GNCR5FXCWLH5RSVZP9PX";
        assert!(Address::is_valid(JsValue::from_str(uppercase_address)));

        // Test mixed case string addresses are accepted (auto-lowercased)
        let mixed_case_address = "Aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px";
        assert!(Address::is_valid(JsValue::from_str(mixed_case_address)));

        // Test valid bytes
        let address = Address::from_string(valid_address);
        let bytes = address.to_bytes_le().unwrap();
        assert!(Address::is_valid(JsValue::from(bytes)));

        // Test invalid bytes
        let invalid_bytes = Uint8Array::new_with_length(3);
        invalid_bytes.copy_from(&[1, 2, 3]);
        assert!(!Address::is_valid(JsValue::from(invalid_bytes)));

        // Test empty bytes
        let empty_bytes = Uint8Array::new_with_length(0);
        assert!(!Address::is_valid(JsValue::from(empty_bytes)));

        // Test wrong type (number)
        assert!(!Address::is_valid(JsValue::from_f64(42.0)));
    }

    #[wasm_bindgen_test]
    pub fn test_from_string_auto_lowercases() {
        let lowercase_address = "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px";
        let uppercase_address = "ALEO1RHGDU77HGYQD3XJJ8UCU3JJ9R2KRWZ6MNZYD80GNCR5FXCWLH5RSVZP9PX";
        let mixed_case_address = "Aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px";

        let expected = Address::from_string(lowercase_address);
        assert_eq!(Address::from_string(uppercase_address), expected);
        assert_eq!(Address::from_string(mixed_case_address), expected);
    }
}
