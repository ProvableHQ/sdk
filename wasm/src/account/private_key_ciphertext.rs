// Copyright (C) 2019-2024 Aleo Systems Inc.
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

use crate::account::{Encryptor, PrivateKey};

use crate::types::native::CiphertextNative;
use std::{ops::Deref, str::FromStr};
use wasm_bindgen::prelude::*;

/// Private Key in ciphertext form
#[wasm_bindgen]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PrivateKeyCiphertext(CiphertextNative);

#[wasm_bindgen]
impl PrivateKeyCiphertext {
    /// Encrypt a private key using a secret string. The secret is sensitive and will be needed to
    /// decrypt the private key later, so it should be stored securely
    ///
    /// @param {PrivateKey} private_key Private key to encrypt
    /// @param {string} secret Secret to encrypt the private key with
    /// @returns {PrivateKeyCiphertext | Error} Private key ciphertext
    #[wasm_bindgen(js_name = encryptPrivateKey)]
    pub fn encrypt_private_key(private_key: &PrivateKey, secret: &str) -> Result<PrivateKeyCiphertext, String> {
        let ciphertext = Encryptor::encrypt_private_key_with_secret(private_key, secret)
            .map_err(|_| "Encryption failed".to_string())?;
        Ok(Self::from(ciphertext))
    }

    /// Decrypts a private ciphertext using a secret string. This must be the same secret used to
    /// encrypt the private key
    ///
    /// @param {string} secret Secret used to encrypt the private key
    /// @returns {PrivateKey | Error} Private key
    #[wasm_bindgen(js_name = decryptToPrivateKey)]
    pub fn decrypt_to_private_key(&self, secret: &str) -> Result<PrivateKey, String> {
        let private_key = Encryptor::decrypt_private_key_with_secret(&self.0, secret)
            .map_err(|_| "Decryption failed - ciphertext was not a private key")?;
        Ok(PrivateKey::from(private_key))
    }

    /// Returns the ciphertext string
    ///
    /// @returns {string} Ciphertext string
    #[allow(clippy::inherent_to_string)]
    #[wasm_bindgen(js_name = toString)]
    pub fn to_string(&self) -> String {
        self.0.to_string()
    }

    /// Creates a PrivateKeyCiphertext from a string
    ///
    /// @param {string} ciphertext Ciphertext string
    /// @returns {PrivateKeyCiphertext | Error} Private key ciphertext
    #[wasm_bindgen(js_name = fromString)]
    pub fn from_string(ciphertext: String) -> Result<PrivateKeyCiphertext, String> {
        Self::try_from(ciphertext).map_err(|_| "Invalid ciphertext".to_string())
    }
}

impl From<CiphertextNative> for PrivateKeyCiphertext {
    fn from(ciphertext: CiphertextNative) -> Self {
        Self(ciphertext)
    }
}

impl TryFrom<String> for PrivateKeyCiphertext {
    type Error = String;

    fn try_from(ciphertext: String) -> Result<Self, Self::Error> {
        Ok(Self(CiphertextNative::from_str(&ciphertext).map_err(|_| "Invalid ciphertext".to_string())?))
    }
}

impl Deref for PrivateKeyCiphertext {
    type Target = CiphertextNative;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    use wasm_bindgen_test::wasm_bindgen_test;

    #[wasm_bindgen_test]
    fn test_private_key_ciphertext_to_and_from_string() {
        let private_key = PrivateKey::new();
        let private_key_ciphertext = PrivateKeyCiphertext::encrypt_private_key(&private_key, "mypasword").unwrap();
        let private_key_ciphertext_2 = PrivateKeyCiphertext::from_string(private_key_ciphertext.to_string()).unwrap();

        // Assert the round trip to and from string journey results in the same key
        assert_eq!(private_key_ciphertext, private_key_ciphertext_2);
    }

    #[wasm_bindgen_test]
    fn test_private_key_from_string_decryption_edge_cases() {
        let private_key =
            PrivateKey::from_string("APrivateKey1zkpAYS46Dq4rnt9wdohyWMwdmjmTeMJKPZdp5AhvjXZDsVG").unwrap();
        let ciphertext = "ciphertext1qvqg7rgvam3xdcu55pwu6sl8rxwefxaj5gwthk0yzln6jv5fastzup0qn0qftqlqq7jcckyx03fzv9kke0z9puwd7cl7jzyhxfy2f2juplz39dkqs6p24urhxymhv364qm3z8mvyklv5gr52n4fxr2z59jgqytyddj8";
        let private_key_ciphertext = PrivateKeyCiphertext::from_string(ciphertext.to_string()).unwrap();
        let decrypted_private_key = private_key_ciphertext.decrypt_to_private_key("mypassword").unwrap();

        // Assert that the private key is the same as the original for a valid ciphertext and secret
        assert_eq!(private_key, decrypted_private_key);
        // Assert the incorrect secret fails
        assert!(private_key_ciphertext.decrypt_to_private_key("badpassword").is_err());
        // Ensure invalid ciphertexts fail
        let bad_ciphertext = "ciphertext1qvqg7rgvam3xdcu55pwu6sl8rxwefxaj5gwthk0yzln6jv5fastzup0qn0qftqlqq7jcckyx03fzv9kke0z9puwd7cl7jzyhxfy2f2juplz39dkqs6p24urhxymhv364qm3z8mvyklv5er52n4fxr2z59jgqytyddj8";
        assert!(PrivateKeyCiphertext::from_string(bad_ciphertext.to_string()).is_err());
    }

    #[wasm_bindgen_test]
    fn test_private_key_ciphertext_encrypt_and_decrypt() {
        let private_key = PrivateKey::new();
        let private_key_ciphertext = PrivateKeyCiphertext::encrypt_private_key(&private_key, "mypassword").unwrap();
        let recovered_private_key = private_key_ciphertext.decrypt_to_private_key("mypassword").unwrap();
        assert_eq!(private_key, recovered_private_key);
    }

    #[wasm_bindgen_test]
    fn test_private_key_ciphertext_doesnt_decrypt_with_wrong_password() {
        let private_key = PrivateKey::new();
        let private_key_ciphertext = PrivateKeyCiphertext::encrypt_private_key(&private_key, "mypassword").unwrap();
        let recovered_private_key = private_key_ciphertext.decrypt_to_private_key("wrong_password");
        assert!(recovered_private_key.is_err())
    }

    #[wasm_bindgen_test]
    fn test_private_key_ciphertext_doesnt_produce_same_ciphertext_on_different_runs() {
        let private_key = PrivateKey::new();
        let private_key_ciphertext = PrivateKeyCiphertext::encrypt_private_key(&private_key, "mypassword").unwrap();
        let private_key_ciphertext_2 = PrivateKeyCiphertext::encrypt_private_key(&private_key, "mypassword").unwrap();
        assert_ne!(private_key_ciphertext, private_key_ciphertext_2);

        // Assert that we can decrypt both ciphertexts with the same secret despite being different
        let recovered_key_1 = private_key_ciphertext.decrypt_to_private_key("mypassword").unwrap();
        let recovered_key_2 = private_key_ciphertext_2.decrypt_to_private_key("mypassword").unwrap();
        assert_eq!(recovered_key_1, recovered_key_2);
    }

    #[wasm_bindgen_test]
    fn test_private_key_ciphertext_encrypted_with_different_passwords_match() {
        let private_key = PrivateKey::new();
        let private_key_ciphertext = PrivateKeyCiphertext::encrypt_private_key(&private_key, "mypassword").unwrap();
        let private_key_ciphertext_2 = PrivateKeyCiphertext::encrypt_private_key(&private_key, "mypassword2").unwrap();
        assert_ne!(private_key_ciphertext, private_key_ciphertext_2);

        // Assert that we can decrypt both ciphertexts with the same secret despite being different
        let recovered_key_1 = private_key_ciphertext.decrypt_to_private_key("mypassword").unwrap();
        let recovered_key_2 = private_key_ciphertext_2.decrypt_to_private_key("mypassword2").unwrap();
        assert_eq!(recovered_key_1, recovered_key_2);
    }

    #[wasm_bindgen_test]
    fn test_private_key_ciphertext_different_private_keys_encrypted_with_same_password_dont_match() {
        let private_key = PrivateKey::new();
        let private_key_2 = PrivateKey::new();
        let private_key_ciphertext = PrivateKeyCiphertext::encrypt_private_key(&private_key, "mypassword").unwrap();
        let private_key_ciphertext_2 = PrivateKeyCiphertext::encrypt_private_key(&private_key_2, "mypassword").unwrap();
        assert_ne!(private_key_ciphertext, private_key_ciphertext_2);

        // Assert that private key plaintexts dont match
        let recovered_key_1 = private_key_ciphertext.decrypt_to_private_key("mypassword").unwrap();
        let recovered_key_2 = private_key_ciphertext_2.decrypt_to_private_key("mypassword").unwrap();
        assert_ne!(recovered_key_1, recovered_key_2);
    }

    #[wasm_bindgen_test]
    fn test_private_key_ciphertext_decrypts_properly_when_formed_with_secret() {
        let private_key_ciphertext_1 = PrivateKey::new_encrypted("mypassword").unwrap();
        let private_key_ciphertext_2 = PrivateKey::new_encrypted("mypassword").unwrap();

        // Assert that ciphertexts are different
        assert_ne!(private_key_ciphertext_1, private_key_ciphertext_2);

        // Check both possible decryption methods recover the first key
        let recovered_private_key_1_1 = private_key_ciphertext_1.decrypt_to_private_key("mypassword").unwrap();
        let recovered_private_key_1_2 =
            PrivateKey::from_private_key_ciphertext(&private_key_ciphertext_1, "mypassword").unwrap();
        assert_eq!(recovered_private_key_1_1, recovered_private_key_1_2);

        // Check both possible decryption methods recover the second key
        let recovered_private_key_2_1 = private_key_ciphertext_2.decrypt_to_private_key("mypassword").unwrap();
        let recovered_private_key_2_2 =
            PrivateKey::from_private_key_ciphertext(&private_key_ciphertext_2, "mypassword").unwrap();
        assert_eq!(recovered_private_key_2_1, recovered_private_key_2_2);

        // Check that the two keys recovered are different
        assert_ne!(recovered_private_key_1_1, recovered_private_key_2_1);
        assert_ne!(recovered_private_key_1_2, recovered_private_key_2_2);
        assert_ne!(recovered_private_key_1_1, recovered_private_key_2_1);
        assert_ne!(recovered_private_key_1_2, recovered_private_key_2_2);
    }

    #[wasm_bindgen_test]
    fn test_private_key_encryption_functions() {
        let private_key = PrivateKey::new();
        let private_key_ciphertext = private_key.to_ciphertext("mypassword").unwrap();
        let recovered_private_key_1 =
            PrivateKey::from_private_key_ciphertext(&private_key_ciphertext, "mypassword").unwrap();
        let recovered_private_key_2 = private_key_ciphertext.decrypt_to_private_key("mypassword").unwrap();

        // Check both possible decryption methods recover the key
        assert_eq!(private_key, recovered_private_key_2);
        assert_eq!(private_key, recovered_private_key_1);
        // Check transitivity holds explicitly
        assert_eq!(recovered_private_key_1, recovered_private_key_2);

        // Ensure decryption fails with incorrect secret
        let bad_secret_attempt = PrivateKey::from_private_key_ciphertext(&private_key_ciphertext, "badpassword");
        assert!(bad_secret_attempt.is_err());
    }
}
