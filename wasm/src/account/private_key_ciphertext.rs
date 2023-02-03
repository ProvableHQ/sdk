// Copyright (C) 2019-2023 Aleo Systems Inc.
// This file is part of the Aleo library.

// The Aleo library is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// The Aleo library is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with the Aleo library. If not, see <https://www.gnu.org/licenses/>.

use crate::{CiphertextNative, Encryptor, PrivateKey};

use std::ops::Deref;
use wasm_bindgen::prelude::*;

/// Private Key in ciphertext form
#[wasm_bindgen]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PrivateKeyCiphertext(CiphertextNative);

#[wasm_bindgen]
impl PrivateKeyCiphertext {
    /// Encrypt a private key using a secret string.
    ///
    /// The secret is sensitive and will be needed to decrypt the private key later, so it should be stored securely.
    #[wasm_bindgen(js_name = encryptPrivateKey)]
    pub fn encrypt_private_key(private_key: &PrivateKey, secret: &str) -> Result<PrivateKeyCiphertext, String> {
        let ciphertext = Encryptor::encrypt_private_key_with_secret(private_key, secret)
            .map_err(|_| "Encryption failed".to_string())?;
        Ok(Self::from(ciphertext))
    }

    /// Decrypts a private ciphertext using a secret string.
    ///
    /// This must be the same secret used to encrypt the private key
    #[wasm_bindgen(js_name = decryptToPrivateKey)]
    pub fn decrypt_to_private_key(&self, secret: &str) -> Result<PrivateKey, String> {
        let private_key = Encryptor::decrypt_private_key_with_secret(&self.0, secret)
            .map_err(|_| "Decryption failed - view key did not match record")?;
        Ok(PrivateKey::from(private_key))
    }
}

impl From<CiphertextNative> for PrivateKeyCiphertext {
    fn from(ciphertext: CiphertextNative) -> Self {
        Self(ciphertext)
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
