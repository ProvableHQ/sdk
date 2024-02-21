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

use crate::types::native::{
    CiphertextNative,
    CurrentNetwork,
    FieldNative,
    IdentifierNative,
    LiteralNative,
    Network,
    PlaintextNative,
    PrivateKeyNative,
    Uniform,
};

use once_cell::sync::OnceCell;
use std::str::FromStr;

/// Tool for encrypting and decrypting Aleo key material into ciphertext
pub struct Encryptor;

impl Encryptor {
    /// Encrypt a private key into ciphertext using a secret
    pub(crate) fn encrypt_private_key_with_secret(
        private_key: &PrivateKeyNative,
        secret: &str,
    ) -> Result<CiphertextNative, String> {
        Self::encrypt_field(&private_key.seed(), secret, "private_key")
    }

    /// Decrypt a private key from ciphertext using a secret
    pub(crate) fn decrypt_private_key_with_secret(
        ciphertext: &CiphertextNative,
        secret: &str,
    ) -> Result<PrivateKeyNative, String> {
        let seed = Self::decrypt_field(ciphertext, secret, "private_key")?;
        PrivateKeyNative::try_from(seed).map_err(|e| e.to_string())
    }

    // Encrypted a field element into a ciphertext representation
    fn encrypt_field(field: &FieldNative, secret: &str, domain: &str) -> Result<CiphertextNative, String> {
        // Derive the domain separators and the secret.
        let domain = FieldNative::new_domain_separator(domain);
        let secret = FieldNative::new_domain_separator(secret);

        // Generate a nonce
        let mut rng = rand::thread_rng();
        let nonce = Uniform::rand(&mut rng);

        // Derive a blinding factor and create an encryption target
        let blinding = CurrentNetwork::hash_psd2(&[domain, nonce, secret]).map_err(|e| e.to_string())?;
        let key = blinding * field;
        let plaintext = PlaintextNative::Struct(
            indexmap::IndexMap::from_iter(vec![
                (
                    IdentifierNative::from_str("key").map_err(|e| e.to_string())?,
                    PlaintextNative::from(LiteralNative::Field(key)),
                ),
                (
                    IdentifierNative::from_str("nonce").map_err(|e| e.to_string())?,
                    PlaintextNative::from(LiteralNative::Field(nonce)),
                ),
            ]),
            OnceCell::new(),
        );
        plaintext.encrypt_symmetric(secret).map_err(|e| e.to_string())
    }

    // Recover a field element encrypted within ciphertext
    fn decrypt_field(ciphertext: &CiphertextNative, secret: &str, domain: &str) -> Result<FieldNative, String> {
        let domain = FieldNative::new_domain_separator(domain);
        let secret = FieldNative::new_domain_separator(secret);
        let decrypted = ciphertext.decrypt_symmetric(secret).map_err(|e| e.to_string())?;
        let recovered_key = Self::extract_value(&decrypted, "key")?;
        let recovered_nonce = Self::extract_value(&decrypted, "nonce")?;
        let recovered_blinding =
            CurrentNetwork::hash_psd2(&[domain, recovered_nonce, secret]).map_err(|e| e.to_string())?;
        Ok(recovered_key / recovered_blinding)
    }

    // Extract a field element from a plaintext
    fn extract_value(plaintext: &PlaintextNative, identifier: &str) -> Result<FieldNative, String> {
        let identity = IdentifierNative::from_str(identifier).map_err(|e| e.to_string())?;
        let value = plaintext.find(&[identity]).map_err(|e| e.to_string())?;
        match value {
            PlaintextNative::Literal(literal, ..) => match literal {
                LiteralNative::Field(recovered_value) => Ok(recovered_value),
                _ => Err("Wrong literal type".to_string()),
            },
            _ => Err("Expected literal".to_string()),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    use snarkvm_console::prelude::TestRng;
    use wasm_bindgen_test::*;

    #[wasm_bindgen_test]
    fn test_encryptor_encrypt_and_decrypt() {
        let mut rng = TestRng::default();
        let private_key = PrivateKeyNative::new(&mut rng).unwrap();
        let enc = Encryptor::encrypt_private_key_with_secret(&private_key, "mypassword").unwrap();
        let recovered_private_key = Encryptor::decrypt_private_key_with_secret(&enc, "mypassword").unwrap();
        assert_eq!(private_key, recovered_private_key);
    }

    #[wasm_bindgen_test]
    fn test_encryptor_wrong_private_key_doesnt_decrypt() {
        let mut rng = TestRng::default();
        let private_key = PrivateKeyNative::new(&mut rng).unwrap();
        let enc = Encryptor::encrypt_private_key_with_secret(&private_key, "mypassword").unwrap();
        let recovered_private_key = Encryptor::decrypt_private_key_with_secret(&enc, "wrong_password");
        assert!(recovered_private_key.is_err())
    }

    #[wasm_bindgen_test]
    fn test_encryptor_same_secret_doesnt_produce_same_ciphertext_on_different_runs() {
        let mut rng = TestRng::default();
        let private_key = PrivateKeyNative::new(&mut rng).unwrap();
        let enc = Encryptor::encrypt_private_key_with_secret(&private_key, "mypassword").unwrap();
        let enc2 = Encryptor::encrypt_private_key_with_secret(&private_key, "mypassword").unwrap();
        assert_ne!(enc, enc2);

        // Assert that we can decrypt both ciphertexts with the same secret despite being different
        let recovered_key_1 = Encryptor::decrypt_private_key_with_secret(&enc, "mypassword").unwrap();
        let recovered_key_2 = Encryptor::decrypt_private_key_with_secret(&enc, "mypassword").unwrap();
        assert_eq!(recovered_key_1, recovered_key_2);
    }

    #[wasm_bindgen_test]
    fn test_encryptor_private_keys_encrypted_with_different_passwords_match() {
        let mut rng = TestRng::default();
        let private_key = PrivateKeyNative::new(&mut rng).unwrap();
        let enc = Encryptor::encrypt_private_key_with_secret(&private_key, "mypassword").unwrap();
        let enc2 = Encryptor::encrypt_private_key_with_secret(&private_key, "mypassword2").unwrap();
        assert_ne!(enc, enc2);

        // Assert that we can decrypt both ciphertexts with to the same key
        let recovered_key_1 = Encryptor::decrypt_private_key_with_secret(&enc, "mypassword").unwrap();
        let recovered_key_2 = Encryptor::decrypt_private_key_with_secret(&enc2, "mypassword2").unwrap();
        assert_eq!(recovered_key_1, recovered_key_2);
    }

    #[wasm_bindgen_test]
    fn test_encryptor_different_private_keys_encrypted_with_same_password_dont_match() {
        let mut rng = TestRng::default();
        let private_key = PrivateKeyNative::new(&mut rng).unwrap();
        let private_key2 = PrivateKeyNative::new(&mut rng).unwrap();
        let enc = Encryptor::encrypt_private_key_with_secret(&private_key, "mypassword").unwrap();
        let enc2 = Encryptor::encrypt_private_key_with_secret(&private_key2, "mypassword").unwrap();
        assert_ne!(enc, enc2);

        // Assert that private key plaintexts don't match
        let recovered_key_1 = Encryptor::decrypt_private_key_with_secret(&enc, "mypassword").unwrap();
        let recovered_key_2 = Encryptor::decrypt_private_key_with_secret(&enc2, "mypassword").unwrap();
        assert_ne!(recovered_key_1, recovered_key_2);
    }
}
