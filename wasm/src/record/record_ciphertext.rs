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

use crate::{js_array_from_fields, to_bits_array_le, types::native::{CurrentNetwork, RecordCiphertextNative}, Field, GraphKey, Group, RecordPlaintext, ViewKey};
use snarkvm_console::prelude::{FromBytes, Network, ToBits, ToBytes, ToFields};

use js_sys::{Array, Uint8Array};
use std::{ops::Deref, str::FromStr};
use wasm_bindgen::prelude::*;
use crate::utilities::encrypt::EncryptionToolkit;

/// Encrypted Aleo record
#[wasm_bindgen]
#[derive(Clone)]
pub struct RecordCiphertext(RecordCiphertextNative);

#[wasm_bindgen]
impl RecordCiphertext {
    /// Create a record ciphertext from a string
    ///
    /// @param {string} record String representation of a record ciphertext
    /// @returns {RecordCiphertext} Record ciphertext
    #[wasm_bindgen(js_name = fromString)]
    pub fn from_string(record: &str) -> Result<RecordCiphertext, String> {
        Self::from_str(record).map_err(|_| "The record ciphertext string provided was invalid".to_string())
    }

    /// Return the string representation of the record ciphertext
    ///
    /// @returns {string} String representation of the record ciphertext
    #[allow(clippy::inherent_to_string)]
    #[wasm_bindgen(js_name = toString)]
    pub fn to_string(&self) -> String {
        self.0.to_string()
    }

    /// Decrypt the record ciphertext into plaintext using the view key. The record will only
    /// decrypt if the record was encrypted by the account corresponding to the view key
    ///
    /// @param {ViewKey} view_key View key used to decrypt the ciphertext
    /// @returns {RecordPlaintext} Record plaintext object
    pub fn decrypt(&self, view_key: &ViewKey) -> Result<RecordPlaintext, String> {
        Ok(RecordPlaintext::from(
            self.0.decrypt(view_key).map_err(|_| "Decryption failed - view key did not match record".to_string())?,
        ))
    }

    /// Generate the record view key. The record view key can only decrypt record if the
    /// supplied view key belongs to the record owner.
    ///
    /// @param {ViewKey} view_key View key used to generate the record view key
    ///
    /// @returns {Group} record view key
    #[wasm_bindgen(js_name = "recordViewKey")]
    pub fn record_view_key(&self, view_key: &ViewKey) -> Field {
        self.nonce().scalar_multiply(&view_key.to_scalar()).to_x_coordinate()
    }

    /// Determines if the account corresponding to the view key is the owner of the record
    ///
    /// @param {ViewKey} view_key View key used to decrypt the ciphertext
    /// @returns {boolean}
    #[wasm_bindgen(js_name = isOwner)]
    pub fn is_owner(&self, view_key: &ViewKey) -> bool {
        self.0.is_owner(view_key)
    }

    /// Get the tag of the record using the graph key.
    ///
    /// @param {GraphKey} graph key of the account associatd with the record.
    /// @param {Field} commitment of the record.
    ///
    /// @returns {Field} tag of the record.
    pub fn tag(graph_key: &GraphKey, commitment: Field) -> Result<Field, String> {
        RecordCiphertextNative::tag(*graph_key.sk_tag(), *commitment).map_err(|e| e.to_string()).map(Field::from)
    }

    /// Get a record ciphertext object from a series of bytes.
    ///
    /// @param {Uint8Array} bytes A left endian byte array representing the record ciphertext.
    ///
    /// @returns {RecordCiphertext}
    #[wasm_bindgen(js_name = "fromBytesLe")]
    pub fn from_bytes_le(bytes: Uint8Array) -> Result<Self, String> {
        let rust_bytes = bytes.to_vec();
        let native = RecordCiphertextNative::from_bytes_le(&rust_bytes).map_err(|e| e.to_string())?;
        Ok(Self(native))
    }

    /// Get the left endian byte array representation of the record ciphertext.
    #[wasm_bindgen(js_name = "toBytesLe")]
    pub fn to_bytes_le(&self) -> Result<Uint8Array, String> {
        let bytes_vec = self.0.to_bytes_le().map_err(|e| e.to_string())?;
        let bytes = bytes_vec.as_slice();
        Uint8Array::try_from(bytes).map_err(|e| e.to_string())
    }

    /// Get the left endian boolean array representation of the record ciphertext bits.
    #[wasm_bindgen(js_name = "toBitsLe")]
    pub fn to_bits_le(&self) -> Array {
        to_bits_array_le!(self)
    }

    /// Get the field array representation of the record ciphertext.
    #[wasm_bindgen(js_name = "toFields")]
    pub fn to_fields(&self) -> Result<Array, String> {
        let native = self.0.clone();
        let native_fields = native.to_fields().map_err(|e| e.to_string())?;
        Ok(js_array_from_fields!(&native_fields))
    }

    /// Decrypt the record ciphertext into plaintext using a record view key
    #[wasm_bindgen(js_name = "decryptWithRecordViewKey")]
    pub fn decrypt_with_record_view_key(&self, record_vk: Field) -> Result<RecordPlaintext, String> {
        let num_randomizers = EncryptionToolkit::num_record_randomizers(self)?;
        let randomizers =
            CurrentNetwork::hash_many_psd8(&[CurrentNetwork::encryption_domain(), *record_vk], num_randomizers);
        EncryptionToolkit::decrypt_with_randomizers(self, &randomizers)
    }
    
    /// Get the record nonce.
    pub fn nonce(&self) -> Group {
        Group::from(self.0.nonce())
    }
}

impl Deref for RecordCiphertext {
    type Target = RecordCiphertextNative;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl From<RecordCiphertextNative> for RecordCiphertext {
    fn from(record: RecordCiphertextNative) -> Self {
        Self(record)
    }
}

impl From<RecordCiphertext> for RecordCiphertextNative {
    fn from(record: RecordCiphertext) -> Self {
        record.0
    }
}

impl From<&RecordCiphertext> for RecordCiphertextNative {
    fn from(record: &RecordCiphertext) -> Self {
        record.0.clone()
    }
}

impl From<&RecordCiphertextNative> for RecordCiphertext {
    fn from(record: &RecordCiphertextNative) -> Self {
        Self(record.clone())
    }
}

impl FromStr for RecordCiphertext {
    type Err = anyhow::Error;

    fn from_str(ciphertext: &str) -> Result<Self, Self::Err> {
        Ok(Self(RecordCiphertextNative::from_str(ciphertext)?))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    use wasm_bindgen_test::wasm_bindgen_test;

    const OWNER_PLAINTEXT: &str = r"{
  owner: aleo1j7qxyunfldj2lp8hsvy7mw5k8zaqgjfyr72x2gh3x4ewgae8v5gscf5jh3.private,
  microcredits: 1500000000000000u64.private,
  _nonce: 3077450429259593211617823051143573281856129402760267155982965992208217472983group.public
}";
    const OWNER_CIPHERTEXT: &str = "record1qyqsqpe2szk2wwwq56akkwx586hkndl3r8vzdwve32lm7elvphh37rsyqyxx66trwfhkxun9v35hguerqqpqzqrtjzeu6vah9x2me2exkgege824sd8x2379scspmrmtvczs0d93qttl7y92ga0k0rsexu409hu3vlehe3yxjhmey3frh2z5pxm5cmxsv4un97q";
    const OWNER_VIEW_KEY: &str = "AViewKey1ccEt8A2Ryva5rxnKcAbn7wgTaTsb79tzkKHFpeKsm9NX";
    const RECORD_VIEW_KEY: &str = ""; // Needs to be computed
    const NON_OWNER_VIEW_KEY: &str = "AViewKey1e2WyreaH5H4RBcioLL2GnxvHk5Ud46EtwycnhTdXLmXp";
    const RECORD_TAG: &str = "1796466189545157638691489609907096471289658804813960182690905095269699169603field";

    // Related material for use in future tests
    const _OWNER_PRIVATE_KEY: &str = "APrivateKey1zkpJkyYRGYtkeHDaFfwsKtUJzia7csiWhfBWPXWhXJzy9Ls";
    const _OWNER_ADDRESS: &str = "aleo1j7qxyunfldj2lp8hsvy7mw5k8zaqgjfyr72x2gh3x4ewgae8v5gscf5jh3";

    #[wasm_bindgen_test]
    fn test_to_and_from_string() {
        let record = RecordCiphertext::from_string(OWNER_CIPHERTEXT).unwrap();
        assert_eq!(record.to_string(), OWNER_CIPHERTEXT);
    }

    #[wasm_bindgen_test]
    fn test_invalid_strings() {
        let invalid_bech32 = "record2qqj3a67efazf0awe09grqqg44htnh9vaw7l729vl309c972x7ldquqq2k2cax8s7qsqqyqtpgvqqyqsq4seyrzvfa98fkggzccqr68af8e9m0q8rzeqh8a8aqql3a854v58sgrygdv4jn9s8ckwfd48vujrmv0rtfasqh8ygn88ch34ftck8szspvfpsqqszqzvxx9t8s9g66teeepgxmvnw5ymgapcwt2lpy9d5eus580k08wpq544jcl437wjv206u5pxst6few9ll4yhufwldgpx80rlwq8nhssqywmfsd85skg564vqhm3gxsp8q6r30udmqxrxmxx2v8xycdg8pn5ps3dhfvv";
        assert_eq!(
            RecordCiphertext::from_string("garbage").err(),
            Some("The record ciphertext string provided was invalid".to_string())
        );
        assert!(RecordCiphertext::from_string(invalid_bech32).is_err());
    }

    #[wasm_bindgen_test]
    fn test_decrypt_and_tag_computation() {
        let record = RecordCiphertext::from_string(OWNER_CIPHERTEXT).unwrap();
        let view_key = ViewKey::from_string(OWNER_VIEW_KEY);
        let graph_key = GraphKey::from_view_key(&view_key);
        let plaintext = record.decrypt(&view_key).unwrap();
        assert_eq!(plaintext.to_string(), OWNER_PLAINTEXT);
        let incorrect_view_key = ViewKey::from_string(NON_OWNER_VIEW_KEY);
        assert!(record.decrypt(&incorrect_view_key).is_err());

        let commitment = plaintext.commitment("credits.aleo", "credits").unwrap();
        let tag = RecordCiphertext::tag(&graph_key, commitment).unwrap();
        let expected_tag = Field::from_str(RECORD_TAG).unwrap();
        assert_eq!(tag, expected_tag);
    }

    #[wasm_bindgen_test]
    fn test_is_owner() {
        let record = RecordCiphertext::from_string(OWNER_CIPHERTEXT).unwrap();
        let view_key = ViewKey::from_string(OWNER_VIEW_KEY);
        assert!(record.is_owner(&view_key));
        let incorrect_view_key = ViewKey::from_string(NON_OWNER_VIEW_KEY);
        assert!(!record.is_owner(&incorrect_view_key));
    }

    #[wasm_bindgen_test]
    fn test_record_view_key_generation() {
        let record = RecordCiphertext::from_string(OWNER_CIPHERTEXT).unwrap();
        let view_key = ViewKey::from_string(OWNER_VIEW_KEY);
        let record_vk = record.record_view_key(&view_key);
        assert_eq!(record_vk.to_string(), RECORD_VIEW_KEY);
    }

    #[wasm_bindgen_test]
    fn test_decrypt_with_record_vk() {
        let record = RecordCiphertext::from_string(OWNER_CIPHERTEXT).unwrap();
        let record_plaintext = RecordPlaintext::from_string(OWNER_PLAINTEXT).unwrap();
        let view_key = ViewKey::from_string(OWNER_VIEW_KEY);
        let record_vk = record.record_view_key(&view_key);
        let decrypted_plaintext = record.decrypt_with_record_view_key(record_vk).unwrap();
        assert_eq!(record_plaintext.to_string(), decrypted_plaintext.to_string());
    }
}
