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
    Group,
    Plaintext,
    PrivateKey,
    Scalar,
    from_js_typed_array,
    js_array_from_fields,
    native::LiteralNative,
    to_bits_array_le,
    types::native::{SignatureNative, ValueNative},
};
use snarkvm_console::prelude::{FromBits, FromBytes, ToBits, ToBytes, ToFields};

use core::{fmt, ops::Deref, str::FromStr};
use js_sys::{Array, Uint8Array};
use rand::{SeedableRng, rngs::StdRng};
use wasm_bindgen::prelude::*;

/// Cryptographic signature of a message signed by an Aleo account
#[wasm_bindgen]
pub struct Signature(SignatureNative);

#[wasm_bindgen]
impl Signature {
    /// Sign a message with a private key
    ///
    /// @param {PrivateKey} private_key The private key to sign the message with
    /// @param {Uint8Array} message Byte representation of the message to sign
    /// @returns {Signature} Signature of the message
    pub fn sign(private_key: &PrivateKey, message: &[u8]) -> Self {
        Self(SignatureNative::sign_bytes(private_key, message, &mut StdRng::from_entropy()).unwrap())
    }

    /// Sign an instance of a valid Aleo data type or record.
    ///
    /// @param {PrivateKey} private_key The private key used to sign the message.
    /// @param {String} message The string representation of the Aleo datatype or record to sign.
    /// @returns {Signature} Signature of the message.
    #[wasm_bindgen(js_name = "signValue")]
    pub fn sign_value(private_key: &PrivateKey, message: &str) -> Result<Self, String> {
        let fields =
            ValueNative::from_str(message).map_err(|e| e.to_string())?.to_fields().map_err(|e| e.to_string())?;

        Ok(Self(SignatureNative::sign(private_key, &fields, &mut StdRng::from_entropy()).map_err(|e| e.to_string())?))
    }

    /// Get an address from a signature.
    ///
    /// @returns {Address} Address object
    pub fn to_address(&self) -> Address {
        Address::from(self.0.to_address())
    }

    /// Get the challenge of a signature.
    pub fn challenge(&self) -> Scalar {
        Scalar::from(self.0.challenge())
    }

    /// Get the response of a signature.
    pub fn response(&self) -> Scalar {
        Scalar::from(self.0.response())
    }

    /// Verify a signature of a message with an address
    ///
    /// @param {Address} address The address to verify the signature with
    /// @param {Uint8Array} message Byte representation of the message to verify
    /// @returns {boolean} True if the signature is valid, false otherwise
    pub fn verify(&self, address: &Address, message: &[u8]) -> bool {
        self.0.verify_bytes(address, message)
    }

    /// Verify a signature over an Aleo datatype or record by an address.
    ///
    /// @param {Address} address The address used to verify the signature.
    /// @param {String} message The message to verify, which must be the string representation of a valid Aleo datatype or record.
    /// @returns {boolean} True if the signature is valid, false otherwise.
    #[wasm_bindgen(js_name = "verifyValue")]
    pub fn verify_value(&self, address: &Address, message: &str) -> Result<bool, String> {
        let fields =
            ValueNative::from_str(message).map_err(|e| e.to_string())?.to_fields().map_err(|e| e.to_string())?;
        Ok(self.0.verify(address, &fields))
    }

    /// Get a signature from a series of bytes.
    ///
    /// @param {Uint8Array} bytes A left endian byte array representing the signature.
    ///
    /// @returns {Signature} The signature object.
    #[wasm_bindgen(js_name = "fromBytesLe")]
    pub fn from_bytes_le(bytes: Uint8Array) -> Result<Self, String> {
        let rust_bytes = bytes.to_vec();
        let native = SignatureNative::from_bytes_le(rust_bytes.as_slice()).map_err(|e| e.to_string())?;
        Ok(Self(native))
    }

    /// Get the left endian byte array representation of the signature.
    #[wasm_bindgen(js_name = "toBytesLe")]
    pub fn to_bytes_le(&self) -> Result<Uint8Array, String> {
        let rust_bytes = self.0.to_bytes_le().map_err(|e| e.to_string())?;
        Ok(Uint8Array::from(rust_bytes.as_slice()))
    }

    /// Get a signature from a series of bits represented as a boolean array.
    ///
    /// @param {Array} bits A left endian boolean array representing the bits of the signature.
    ///
    /// @returns {Signature} The signature object.
    #[wasm_bindgen(js_name = "fromBitsLe")]
    pub fn from_bits_le(bits: Array) -> Result<Self, String> {
        let rust_bits = from_js_typed_array!(bits, as_bool, "boolean")?;
        let native = SignatureNative::from_bits_le(&rust_bits).map_err(|e| e.to_string())?;
        Ok(Self(native))
    }

    /// Get the left endian boolean array representation of the bits of the signature.
    #[wasm_bindgen(js_name = "toBitsLe")]
    pub fn to_bits_le(&self) -> Array {
        to_bits_array_le!(self)
    }

    /// Get the field array representation of the signature.
    #[wasm_bindgen(js_name = "toFields")]
    pub fn to_fields(&self) -> Result<Array, String> {
        let native = self.0;
        let native_fields = native.to_fields().map_err(|e| e.to_string())?;
        Ok(js_array_from_fields!(&native_fields))
    }

    /// Get a signature from a string representation of a signature
    ///
    /// @param {string} signature String representation of a signature
    /// @returns {Signature} Signature
    pub fn from_string(signature: &str) -> Self {
        Self::from_str(signature).unwrap()
    }

    /// Get a string representation of a signature
    ///
    /// @returns {string} String representation of a signature
    #[allow(clippy::inherent_to_string_shadow_display)]
    pub fn to_string(&self) -> String {
        self.0.to_string()
    }

    /// Get the plaintext representation of the signature.
    #[wasm_bindgen(js_name = "toPlaintext")]
    pub fn to_plaintext(&self) -> Plaintext {
        Plaintext::from(LiteralNative::Signature(Box::new(self.0)))
    }
}

impl Deref for Signature {
    type Target = SignatureNative;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl fmt::Display for Signature {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl From<SignatureNative> for Signature {
    fn from(signature: SignatureNative) -> Self {
        Self(signature)
    }
}

impl From<Signature> for SignatureNative {
    fn from(signature: Signature) -> Self {
        signature.0
    }
}

impl From<&SignatureNative> for Signature {
    fn from(signature: &SignatureNative) -> Self {
        Self(*signature)
    }
}

impl From<&Signature> for SignatureNative {
    fn from(signature: &Signature) -> Self {
        signature.0
    }
}

impl FromStr for Signature {
    type Err = anyhow::Error;

    fn from_str(signature: &str) -> Result<Self, Self::Err> {
        Ok(Self(SignatureNative::from_str(signature).unwrap()))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    use crate::utilities::test::{
        plaintext::{INVALID_NESTED_STRUCT, NESTED_STRUCT},
        record::{CREDITS_RECORD, INVALID_CREDITS_RECORD},
    };
    use rand::{Rng, SeedableRng, rngs::StdRng};
    use wasm_bindgen_test::*;

    const ITERATIONS: u64 = 1_000;

    #[wasm_bindgen_test]
    pub fn test_sign_and_verify() {
        for _ in 0..ITERATIONS {
            // Sample a new private key and message.
            let private_key = PrivateKey::new();
            let message: [u8; 32] = StdRng::from_entropy().gen();

            // Sign the message.
            let signature = Signature::sign(&private_key, &message);
            // Check the signature is valid.
            assert!(signature.verify(&private_key.to_address(), &message));

            // Sample a different message.
            let bad_message: [u8; 32] = StdRng::from_entropy().gen();
            // Check the signature is invalid.
            assert!(!signature.verify(&private_key.to_address(), &bad_message));
        }
    }

    #[wasm_bindgen_test]
    pub fn test_sign_and_verify_fields() {
        for _ in 0..ITERATIONS {
            // Sample a new private key and message.
            let private_key = PrivateKey::new();
            let rand_val: u64 = StdRng::from_entropy().gen();
            let message = format!("{rand_val}field");

            // Sign the message.
            let signature = Signature::sign_value(&private_key, &message).unwrap();
            // Check the signature is valid.
            assert!(signature.verify_value(&private_key.to_address(), &message).unwrap());

            // Sample a different message.
            let rand_val: u64 = StdRng::from_entropy().gen();
            let bad_message = format!("{rand_val}field");
            // Check the signature is invalid.
            assert!(!signature.verify_value(&private_key.to_address(), &bad_message).unwrap());
        }
    }

    #[wasm_bindgen_test]
    pub fn test_sign_and_verify_groups() {
        for _ in 0..ITERATIONS {
            // Sample a new private key and message.
            let private_key = PrivateKey::new();
            let rand_group: Group = Group::random();
            let message = rand_group.to_string();

            // Sign the message.
            let signature = Signature::sign_value(&private_key, &message).unwrap();
            // Check the signature is valid.
            assert!(signature.verify_value(&private_key.to_address(), &message).unwrap());

            // Sample a different message.
            let rand_group: Group = Group::random();
            let bad_message = rand_group.to_string();
            // Check the signature is invalid.
            assert!(!signature.verify_value(&private_key.to_address(), &bad_message).unwrap());
        }
    }

    #[wasm_bindgen_test]
    pub fn test_sign_and_verify_scalars() {
        for _ in 0..ITERATIONS {
            // Sample a new private key and message.
            let private_key = PrivateKey::new();
            let rand_scalar: Scalar = Scalar::random();
            let message = rand_scalar.to_string();

            // Sign the message.
            let signature = Signature::sign_value(&private_key, &message).unwrap();
            // Check the signature is valid.
            assert!(signature.verify_value(&private_key.to_address(), &message).unwrap());

            // Sample a different message.
            let rand_scalar: Scalar = Scalar::random();
            let bad_message = rand_scalar.to_string();
            // Check the signature is invalid.
            assert!(!signature.verify_value(&private_key.to_address(), &bad_message).unwrap());
        }
    }

    #[wasm_bindgen_test]
    pub fn test_sign_and_verify_u8() {
        for _ in 0..ITERATIONS {
            // Sample a new private key and message.
            let private_key = PrivateKey::new();
            let rand_u8: u8 = StdRng::from_entropy().gen();
            let message = format!("{rand_u8}u8");

            // Sign the message.
            let signature = Signature::sign_value(&private_key, &message).unwrap();
            // Check the signature is valid.
            assert!(signature.verify_value(&private_key.to_address(), &message).unwrap());

            // Sample a different message.
            let rand_u8: u8 = rand_u8.wrapping_add(1);
            let bad_message = format!("{rand_u8}u8");
            // Check the signature is invalid.
            assert!(!signature.verify_value(&private_key.to_address(), &bad_message).unwrap());
        }
    }

    #[wasm_bindgen_test]
    pub fn test_sign_and_verify_u16() {
        for _ in 0..ITERATIONS {
            // Sample a new private key and message.
            let private_key = PrivateKey::new();
            let rand_u16: u16 = StdRng::from_entropy().gen();
            let message = format!("{rand_u16}u16");

            // Sign the message.
            let signature = Signature::sign_value(&private_key, &message).unwrap();
            // Check the signature is valid.
            assert!(signature.verify_value(&private_key.to_address(), &message).unwrap());

            // Sample a different message.
            let rand_u16_new: u16 = StdRng::from_entropy().gen();
            let bad_message = format!("{rand_u16_new}u16");
            // Check the signature is invalid.
            assert!(!signature.verify_value(&private_key.to_address(), &bad_message).unwrap());
        }
    }

    #[wasm_bindgen_test]
    pub fn test_sign_and_verify_u32() {
        for _ in 0..ITERATIONS {
            // Sample a new private key and message.
            let private_key = PrivateKey::new();
            let rand_u32: u32 = StdRng::from_entropy().gen();
            let message = format!("{rand_u32}u32");

            // Sign the message.
            let signature = Signature::sign_value(&private_key, &message).unwrap();
            // Check the signature is valid.
            assert!(signature.verify_value(&private_key.to_address(), &message).unwrap());

            // Sample a different message.
            let rand_u32: u32 = StdRng::from_entropy().gen();
            let bad_message = format!("{rand_u32}u32");
            // Check the signature is invalid.
            assert!(!signature.verify_value(&private_key.to_address(), &bad_message).unwrap());
        }
    }

    #[wasm_bindgen_test]
    pub fn test_sign_and_verify_u64() {
        for _ in 0..ITERATIONS {
            // Sample a new private key and message.
            let private_key = PrivateKey::new();
            let rand_u64: u64 = StdRng::from_entropy().gen();
            let message = format!("{rand_u64}u64");

            // Sign the message.
            let signature = Signature::sign_value(&private_key, &message).unwrap();
            // Check the signature is valid.
            assert!(signature.verify_value(&private_key.to_address(), &message).unwrap());

            // Sample a different message.
            let rand_u64: u64 = StdRng::from_entropy().gen();
            let bad_message = format!("{rand_u64}u64");
            // Check the signature is invalid.
            assert!(!signature.verify_value(&private_key.to_address(), &bad_message).unwrap());
        }
    }

    #[wasm_bindgen_test]
    pub fn test_sign_and_verify_u128() {
        for _ in 0..ITERATIONS {
            // Sample a new private key and message.
            let private_key = PrivateKey::new();
            let rand_u128: u128 = StdRng::from_entropy().gen();
            let message = format!("{rand_u128}u128");

            // Sign the message.
            let signature = Signature::sign_value(&private_key, &message).unwrap();
            // Check the signature is valid.
            assert!(signature.verify_value(&private_key.to_address(), &message).unwrap());

            // Sample a different message.
            let rand_u128: u128 = StdRng::from_entropy().gen();
            let bad_message = format!("{rand_u128}u128");
            // Check the signature is invalid.
            assert!(!signature.verify_value(&private_key.to_address(), &bad_message).unwrap());
        }
    }

    #[wasm_bindgen_test]
    pub fn test_sign_and_verify_i8() {
        for _ in 0..ITERATIONS {
            // Sample a new private key and message.
            let private_key = PrivateKey::new();
            let rand_i8: i8 = StdRng::from_entropy().gen();
            let message = format!("{rand_i8}i8");

            // Sign the message.
            let signature = Signature::sign_value(&private_key, &message).unwrap();
            // Check the signature is valid.
            assert!(signature.verify_value(&private_key.to_address(), &message).unwrap());

            // Sample a different message.
            let rand_i8_new: i8 = rand_i8.wrapping_add(1);
            let bad_message = format!("{rand_i8_new}i8");
            // Check the signature is invalid.
            assert!(!signature.verify_value(&private_key.to_address(), &bad_message).unwrap());
        }
    }

    #[wasm_bindgen_test]
    pub fn test_sign_and_verify_i16() {
        for _ in 0..ITERATIONS {
            // Sample a new private key and message.
            let private_key = PrivateKey::new();
            let rand_i16: i16 = StdRng::from_entropy().gen();
            let message = format!("{rand_i16}i16");

            // Sign the message.
            let signature = Signature::sign_value(&private_key, &message).unwrap();
            // Check the signature is valid.
            assert!(signature.verify_value(&private_key.to_address(), &message).unwrap());

            // Sample a different message.
            let rand_i16_new: i16 = StdRng::from_entropy().gen();
            let bad_message = format!("{rand_i16_new}i16");
            // Check the signature is invalid.
            assert!(!signature.verify_value(&private_key.to_address(), &bad_message).unwrap());
        }
    }

    #[wasm_bindgen_test]
    pub fn test_sign_and_verify_i32() {
        for _ in 0..ITERATIONS {
            // Sample a new private key and message.
            let private_key = PrivateKey::new();
            let rand_i32: i32 = StdRng::from_entropy().gen();
            let message = format!("{rand_i32}i32");

            // Sign the message.
            let signature = Signature::sign_value(&private_key, &message).unwrap();
            // Check the signature is valid.
            assert!(signature.verify_value(&private_key.to_address(), &message).unwrap());

            // Sample a different message.
            let rand_i32_new: i32 = StdRng::from_entropy().gen();
            let bad_message = format!("{rand_i32_new}i32");
            // Check the signature is invalid.
            assert!(!signature.verify_value(&private_key.to_address(), &bad_message).unwrap());
        }
    }

    #[wasm_bindgen_test]
    pub fn test_sign_and_verify_i64() {
        for _ in 0..ITERATIONS {
            // Sample a new private key and message.
            let private_key = PrivateKey::new();
            let rand_i64: i64 = StdRng::from_entropy().gen();
            let message = format!("{rand_i64}i64");

            // Sign the message.
            let signature = Signature::sign_value(&private_key, &message).unwrap();
            // Check the signature is valid.
            assert!(signature.verify_value(&private_key.to_address(), &message).unwrap());

            // Sample a different message.
            let rand_i64_new: i64 = StdRng::from_entropy().gen();
            let bad_message = format!("{rand_i64_new}i64");
            // Check the signature is invalid.
            assert!(!signature.verify_value(&private_key.to_address(), &bad_message).unwrap());
        }
    }

    #[wasm_bindgen_test]
    pub fn test_sign_and_verify_i128() {
        for _ in 0..ITERATIONS {
            // Sample a new private key and message.
            let private_key = PrivateKey::new();
            let rand_i128: i128 = StdRng::from_entropy().gen();
            let message = format!("{rand_i128}i128");

            // Sign the message.
            let signature = Signature::sign_value(&private_key, &message).unwrap();
            // Check the signature is valid.
            assert!(signature.verify_value(&private_key.to_address(), &message).unwrap());

            // Sample a different message.
            let rand_i128_new: i128 = StdRng::from_entropy().gen();
            let bad_message = format!("{rand_i128_new}i128");
            // Check the signature is invalid.
            assert!(!signature.verify_value(&private_key.to_address(), &bad_message).unwrap());
        }
    }

    #[wasm_bindgen_test]
    pub fn test_sign_record_and_verify() {
        let signature = Signature::sign_value(&PrivateKey::new(), CREDITS_RECORD).unwrap();
        assert!(signature.verify_value(&signature.to_address(), CREDITS_RECORD).unwrap());
        assert!(!signature.verify_value(&signature.to_address(), INVALID_CREDITS_RECORD).unwrap());
    }

    #[wasm_bindgen_test]
    pub fn test_sign_nested_struct_and_verify() {
        let signature = Signature::sign_value(&PrivateKey::new(), NESTED_STRUCT).unwrap();
        assert!(signature.verify_value(&signature.to_address(), NESTED_STRUCT).unwrap());
        assert!(!signature.verify_value(&signature.to_address(), INVALID_NESTED_STRUCT).unwrap());
    }

    #[wasm_bindgen_test]
    pub fn test_sign_array_and_verify() {
        const VALID_ARRAY: &str = "[1u8, 2u8, 3u8, 4u8, 5u8]";
        const INVALID_ARRAY: &str = "[1u8, 2u8, 3u8, 4u8, 6u8]";
        let signature = Signature::sign_value(&PrivateKey::new(), INVALID_ARRAY).unwrap();
        assert!(signature.verify_value(&signature.to_address(), INVALID_ARRAY).unwrap());
        assert!(!signature.verify_value(&signature.to_address(), VALID_ARRAY).unwrap());
    }

    #[wasm_bindgen_test]
    #[should_panic]
    pub fn test_sign_value_failure() {
        let private_key = PrivateKey::new();
        let invalid_message = "this is not a valid Aleo value";

        let _sign_result = Signature::sign_value(&private_key, invalid_message).unwrap();
    }
}
