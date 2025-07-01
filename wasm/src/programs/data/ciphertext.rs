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
    ViewKey,
    from_js_typed_array,
    from_wasm_object_array,
    js_array_from_fields,
    native::{
        CiphertextNative,
        CurrentNetwork,
        FieldNative,
        FromBytes,
        IdentifierNative,
        ProgramIDNative,
        ToBytes,
    },
    to_bits_array_le,
};
use snarkvm_console::{
    network::Network,
    program::{FromBits, FromFields, ToBits, ToFields, compute_function_id},
    types::U16,
};

use js_sys::{Array, Uint8Array};
use std::{ops::Deref, str::FromStr};
use wasm_bindgen::{convert::TryFromJsValue, prelude::wasm_bindgen};

/// SnarkVM Ciphertext object. A Ciphertext represents an symmetrically encrypted plaintext. This
/// object provides decryption methods to recover the plaintext from the ciphertext (given the
/// api consumer has the proper decryption materials).
///
/// @example
#[wasm_bindgen]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Ciphertext(CiphertextNative);

#[wasm_bindgen]
impl Ciphertext {
    /// Decrypt the ciphertext using the given view key.
    ///
    /// @param {ViewKey} viewKey The view key of the account that encrypted the ciphertext.
    /// @param {Group} nonce The nonce used to encrypt the ciphertext.
    ///
    /// @returns {Plaintext} The decrypted plaintext.
    pub fn decrypt(&self, view_key: ViewKey, nonce: Group) -> Result<Plaintext, String> {
        Ok(Plaintext::from(self.0.decrypt(*view_key, *nonce).map_err(|e| e.to_string())?))
    }

    /// Decrypt a ciphertext using the view key of the transition signer, transition public key, and
    /// (program, function, index) tuple.
    #[wasm_bindgen(js_name = decryptWithTransitionInfo)]
    pub fn decrypt_with_transition_info(
        &self,
        view_key: ViewKey,
        transition_public_key: Group,
        program: String,
        function_name: String,
        index: u16,
    ) -> Result<Plaintext, String> {
        // Gather all information needed to derive the input view key.
        let program_id = ProgramIDNative::from_str(&program).map_err(|e| e.to_string())?;
        let function_name = IdentifierNative::from_str(&function_name).map_err(|e| e.to_string())?;
        let function_id =
            compute_function_id(&U16::<CurrentNetwork>::new(CurrentNetwork::ID), &program_id, &function_name)
                .map_err(|e| e.to_string())?;
        let tvk = transition_public_key.scalar_multiply(&view_key.to_scalar()).to_x_coordinate();
        let index = FieldNative::from_u16(index);

        // Compute the input view key and decrypt the ciphertext.
        let input_view_key = CurrentNetwork::hash_psd4(&[function_id, *tvk, index])
            .map_err(|_| "The provided ciphertext decryption parameters are incorrect")?;
        Ok(Plaintext::from(self.0.decrypt_symmetric(input_view_key).map_err(|e| e.to_string())?))
    }

    /// Decrypt a ciphertext using the transition view key and a (program, function, index) tuple.
    #[wasm_bindgen(js_name = decryptWithTransitionViewKey)]
    pub fn decrypt_with_transition_view_key(
        &self,
        transition_view_key: Field,
        program: String,
        function_name: String,
        index: u16,
    ) -> Result<Plaintext, String> {
        // Gather all information needed to derive the input view key.
        let program_id = ProgramIDNative::from_str(&program).map_err(|e| e.to_string())?;
        let function_name = IdentifierNative::from_str(&function_name).map_err(|e| e.to_string())?;
        let function_id =
            compute_function_id(&U16::<CurrentNetwork>::new(CurrentNetwork::ID), &program_id, &function_name)
                .map_err(|e| e.to_string())?;
        let index = FieldNative::from_u16(index);

        // Compute the input view key and decrypt the ciphertext.
        let input_view_key = CurrentNetwork::hash_psd4(&[function_id, *transition_view_key, index])
            .map_err(|_| "The provided ciphertext decryption parameters are incorrect")?;
        Ok(Plaintext::from(self.0.decrypt_symmetric(input_view_key).map_err(|e| e.to_string())?))
    }

    /// Decrypts a ciphertext into plaintext using the given ciphertext view key.
    ///
    /// @param {Field} transition_view_key The transition view key that was used to encrypt the ciphertext.
    ///
    /// @returns {Plaintext} The decrypted plaintext.
    #[wasm_bindgen(js_name = decryptSymmetric)]
    pub fn decrypt_symmetric(&self, transition_view_key: Field) -> Result<Plaintext, String> {
        Ok(Plaintext::from(self.0.decrypt_symmetric(*transition_view_key).map_err(|e| e.to_string())?))
    }

    /// Deserialize a left endian byte array into a Ciphertext.
    ///
    /// @param {Uint8Array} bytes The byte array representing the Ciphertext.
    ///
    /// @returns {Ciphertext} The Ciphertext object.
    #[wasm_bindgen(js_name = fromBytesLe)]
    pub fn from_bytes_le(bytes: Uint8Array) -> Result<Ciphertext, String> {
        Ok(Ciphertext(CiphertextNative::from_bytes_le(&bytes.to_vec()).map_err(|e| e.to_string())?))
    }

    /// Get the left endian byte array representation of the ciphertext.
    #[wasm_bindgen(js_name = toBytesLe)]
    pub fn to_bytes_le(&self) -> Result<Uint8Array, String> {
        let rust_bytes = self.0.to_bytes_le().map_err(|e| e.to_string())?;
        Ok(Uint8Array::from(rust_bytes.as_slice()))
    }

    /// Get a ciphertext object from a series of bits represented as a boolean array.
    ///
    /// @param {Array} bits A left endian boolean array representing the bits of the ciphertext.
    ///
    /// @returns {Ciphertext} The ciphertext object.
    #[wasm_bindgen(js_name = "fromBitsLe")]
    pub fn from_bits_le(bits: Array) -> Result<Ciphertext, String> {
        let rust_bits = from_js_typed_array!(bits, as_bool, "boolean")?;
        let native = CiphertextNative::from_bits_le(&rust_bits).map_err(|e| e.to_string())?;
        Ok(Ciphertext(native))
    }

    /// Get the left endian boolean array representation of the bits of the ciphertext.
    #[wasm_bindgen(js_name = "toBitsLe")]
    pub fn to_bits_le(&self) -> Array {
        to_bits_array_le!(self)
    }

    /// Get a ciphertext object from an array of fields.
    ///
    /// @param {Array} fields An array of fields.
    ///
    /// @returns {Ciphertext} The ciphertext object.
    #[wasm_bindgen(js_name = "fromFields")]
    pub fn from_fields(fields: Array) -> Result<Ciphertext, String> {
        let native_fields = from_wasm_object_array!(fields, Field)?;
        let native = CiphertextNative::from_fields(&native_fields).map_err(|e| e.to_string())?;
        Ok(Self(native))
    }

    /// Get the field array representation of the ciphertext.
    #[wasm_bindgen(js_name = "toFields")]
    pub fn to_fields(&self) -> Result<Array, String> {
        let native = self.0.clone();
        let native_fields = native.to_fields().map_err(|e| e.to_string())?;
        Ok(js_array_from_fields!(&native_fields))
    }

    /// Deserialize a Ciphertext string into a Ciphertext object.
    ///
    /// @param {string} ciphertext A string representation of the ciphertext.
    ///
    /// @returns {Ciphertext} The Ciphertext object.
    #[wasm_bindgen(js_name = fromString)]
    pub fn from_string(ciphertext: String) -> Result<Ciphertext, String> {
        CiphertextNative::from_str(&ciphertext).map_err(|e| e.to_string()).map(Ciphertext)
    }

    /// Serialize a Ciphertext object into a byte array.
    ///
    /// @returns {Uint8Array} The serialized Ciphertext.
    #[wasm_bindgen(js_name = toBytes)]
    pub fn to_bytes(&self) -> Result<Uint8Array, String> {
        let bytes = self.0.to_bytes_le().map_err(|e| e.to_string())?;
        Ok(Uint8Array::from(bytes.as_slice()))
    }

    /// Serialize a Ciphertext into a js string.
    ///
    /// @returns {string} The serialized Ciphertext.
    #[wasm_bindgen(js_name = toString)]
    #[allow(clippy::inherent_to_string)]
    pub fn to_string(&self) -> String {
        self.0.to_string()
    }
}

impl Deref for Ciphertext {
    type Target = CiphertextNative;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl From<CiphertextNative> for Ciphertext {
    fn from(ciphertext: CiphertextNative) -> Self {
        Self(ciphertext)
    }
}

impl From<Ciphertext> for CiphertextNative {
    fn from(ciphertext: Ciphertext) -> Self {
        ciphertext.0
    }
}

impl From<&CiphertextNative> for Ciphertext {
    fn from(ciphertext: &CiphertextNative) -> Self {
        Self(ciphertext.clone())
    }
}

impl From<&Ciphertext> for CiphertextNative {
    fn from(ciphertext: &Ciphertext) -> Self {
        ciphertext.0.clone()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{PrivateKey, Transition, plaintext_to_js_value};
    use snarkvm_console::{collections::OrHalt, program::compute_function_id, types::U16};

    use crate::types::native::{CurrentNetwork, FieldNative, IdentifierNative, Network, ProgramID};
    use wasm_bindgen_test::wasm_bindgen_test;

    // Ciphertext encoding 2u32 from hello_hello.aleo.
    const CIPHERTEXT: &str = "ciphertext1qyq0m5mp0d2gzh2pv9p25z70gz2avhqdt3dp8y8thzwf3aq6g35zcqcuyptz3";
    // Development private key of node 0 in a SnarkOS test network.
    const PRIVATE_KEY: &str = "APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH";
    // Transition associated with the ciphertext.
    const TRANSITION: &str = r#"{"id":"au1u62jasyx78x9hktak24awyj38fz73aseq8g9cx98u8egd9pj9uxq3u6s2z","program":"hello_hello.aleo","function":"hello","inputs":[{"type":"public","id":"3748790614260807060977840590007893602934308327222309419419577452790958781330field","value":"1u32"},{"type":"private","id":"5954208307642819953251922459490586292095132973876550778604572231610245257004field","value":"ciphertext1qyq0m5mp0d2gzh2pv9p25z70gz2avhqdt3dp8y8thzwf3aq6g35zcqcuyptz3"}],"outputs":[{"type":"private","id":"1557506318887190915592751299113729867877933642317637206076176689093854281418field","value":"ciphertext1qyqzmhw8ln9r6uuyh0n5jrsqlt25wdggqp3d9yqyttpr3g7g00k2sysdf9rmv"}],"tpk":"7532444547840484531569841377269810017844130178606467837628364672670182422388group","tcm":"7292056195970541935877520517416922164990366931599720071937561392936678536563field","scm":"8283770351301010771186520129040704279224805960417079922462917369178354050332field"}"#;
    #[wasm_bindgen_test]
    fn test_to_and_from_serialization() {
        // Test string serialization.
        let ciphertext = Ciphertext::from_string(CIPHERTEXT.to_string()).unwrap();
        let serialized = ciphertext.to_string();
        assert_eq!(serialized, CIPHERTEXT);

        // Test byte serialization.
        let bytes = ciphertext.to_bytes().unwrap();
        assert!(Ciphertext::from_bytes_le(bytes).is_ok());
    }

    #[wasm_bindgen_test]
    fn test_ciphertext_to_plaintext_decryption() {
        // Construct the private key and view key associated with the transition.
        let private_key = PrivateKey::from_string(PRIVATE_KEY).unwrap();
        let view_key = ViewKey::from_private_key(&private_key);

        // Construct the ciphertext to be decrypted and the transition it is a part of.
        let transition = Transition::from_string(TRANSITION).unwrap();
        let ciphertext = Ciphertext::from_string(CIPHERTEXT.to_string()).unwrap();

        // Get the transition public key.
        let tpk = transition.tpk();
        // Reconstruct the transition view key (vk*tpk*r)).
        let tvk = tpk.scalar_multiply(&view_key.to_scalar()).to_x_coordinate();

        // Construct all the key material needed to decrypt the ciphertext.
        let network_id = U16::<CurrentNetwork>::new(1);
        let program_id = ProgramID::<CurrentNetwork>::from_str(&transition.program_id()).unwrap();
        let function_name = IdentifierNative::from_str(&transition.function_name()).unwrap();
        let function_id = compute_function_id(&network_id, &program_id, &function_name).unwrap();
        let index = FieldNative::from_u16(u16::try_from(1).or_halt_with::<CurrentNetwork>("Input index exceeds u16"));

        // Construct the view key used to encrypt the input.
        let input_view_key = Field::from(CurrentNetwork::hash_psd4(&[function_id, *tvk, index]).unwrap());

        // Decrypt the ciphertext.
        let decrypted_plaintext = ciphertext.decrypt_symmetric(input_view_key).unwrap();

        // Ensure the decrypted plaintext matches the expected input parameter.
        assert_eq!(decrypted_plaintext.to_string(), "2u32");

        // Ensure the decrypted plaintext matches the expected output.
        let js_value = plaintext_to_js_value(&*decrypted_plaintext).as_f64().unwrap();
        assert_eq!(js_value, 2.0);
    }

    #[wasm_bindgen_test]
    fn test_ciphertext_decryption_method() {
        // Construct the private key and view key associated with the transition.
        let private_key = PrivateKey::from_string(PRIVATE_KEY).unwrap();
        let view_key = ViewKey::from_private_key(&private_key);

        // Construct the ciphertext to be decrypted and the transition it is a part of.
        let transition = Transition::from_string(TRANSITION).unwrap();
        let ciphertext = Ciphertext::from_string(CIPHERTEXT.to_string()).unwrap();

        // Compute the tpk and tvk.
        let tpk = transition.tpk();
        let tvk = tpk.scalar_multiply(&view_key.to_scalar()).to_x_coordinate();

        // Decrypt the ciphertext using the transition view key.
        if CurrentNetwork::ID == 1 {
            let decrypted_plaintext_1 = ciphertext
                .decrypt_with_transition_info(view_key, tpk, transition.program_id(), transition.function_name(), 1)
                .unwrap();
            let decrypted_plaintext_2 = ciphertext
                .decrypt_with_transition_view_key(tvk, transition.program_id(), transition.function_name(), 1)
                .unwrap();

            // Ensure the decrypted plaintexts are correct.
            assert_eq!(decrypted_plaintext_1.to_string(), "2u32");
            assert_eq!(decrypted_plaintext_2.to_string(), "2u32");
        }
    }
}
