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

use super::RecordPlaintext;
use crate::{account::ViewKey, types::RecordCiphertextNative};

use std::{ops::Deref, str::FromStr};
use wasm_bindgen::prelude::*;

/// Encrypted Aleo record
#[wasm_bindgen]
#[derive(Clone)]
pub struct RecordCiphertext(RecordCiphertextNative);

#[wasm_bindgen]
impl RecordCiphertext {
    /// Return a record ciphertext from a string.
    #[wasm_bindgen(js_name = fromString)]
    pub fn from_string(record: &str) -> Result<RecordCiphertext, String> {
        Self::from_str(record).map_err(|_| "The ciphertext string provided was invalid".to_string())
    }

    /// Return the record ciphertext string.
    #[allow(clippy::inherent_to_string)]
    #[wasm_bindgen(js_name = toString)]
    pub fn to_string(&self) -> String {
        self.0.to_string()
    }

    /// Decrypt the record ciphertext into plaintext using the view key.
    pub fn decrypt(&self, view_key: &ViewKey) -> Result<RecordPlaintext, String> {
        Ok(RecordPlaintext::from(
            self.0.decrypt(view_key).map_err(|_| "Decryption failed - view key did not match record".to_string())?,
        ))
    }

    /// Returns `true` if the view key can decrypt the record ciphertext.
    #[wasm_bindgen(js_name = isOwner)]
    pub fn is_owner(&self, view_key: &ViewKey) -> bool {
        self.0.is_owner(view_key)
    }
}

impl FromStr for RecordCiphertext {
    type Err = anyhow::Error;

    fn from_str(ciphertext: &str) -> Result<Self, Self::Err> {
        Ok(Self(RecordCiphertextNative::from_str(ciphertext)?))
    }
}

impl Deref for RecordCiphertext {
    type Target = RecordCiphertextNative;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    use wasm_bindgen_test::wasm_bindgen_test;

    const OWNER_PLAINTEXT: &str = r"{
  owner: aleo1y50whk20gjtltkte2qcqz9dd6uaet8thhlj3t8utewp0j3hhmg8qae7s5a.public,
  gates: 1159017656332810u64.public,
  a: 6875465154712544327395236939215127424077297244802949502285127742492653680374field.private,
  b: 603076889203566020456049671526074557206943911693533670547825725507132399266scalar.private,
  _nonce: 1635890755607797813652478911794003479783620859881520791852904112255813473142group.public
}";
    const OWNER_CIPHERTEXT: &str = "record1qqj3a67efazf0awe09grqqg44htnh9vaw7l729vl309c972x7ldquqq2k2cax8s7qsqqyqtpgvqqyqsq4seyrzvfa98fkggzccqr68af8e9m0q8rzeqh8a8aqql3a854v58sgrygdv4jn9s8ckwfd48vujrmv0rtfasqh8ygn88ch34ftck8szspvfpsqqszqzvxx9t8s9g66teeepgxmvnw5ymgapcwt2lpy9d5eus580k08wpq544jcl437wjv206u5pxst6few9ll4yhufwldgpx80rlwq8nhssqywmfsd85skg564vqhm3gxsp8q6r30udmqxrxmxx2v8xycdg8pn5ps3dhfvv";
    const OWNER_VIEW_KEY: &str = "AViewKey1ghtvuJQQzQ31xSiVh6X1PK8biEVhQBygRGV4KdYmq4JT";
    const NON_OWNER_VIEW_KEY: &str = "AViewKey1e2WyreaH5H4RBcioLL2GnxvHk5Ud46EtwycnhTdXLmXp";

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
            Some("The ciphertext string provided was invalid".to_string())
        );
        assert!(RecordCiphertext::from_string(invalid_bech32).is_err());
    }

    #[wasm_bindgen_test]
    fn test_decrypt() {
        let record = RecordCiphertext::from_string(OWNER_CIPHERTEXT).unwrap();
        let view_key = ViewKey::from_string(OWNER_VIEW_KEY);
        let plaintext = record.decrypt(&view_key).unwrap();
        assert_eq!(plaintext.to_string(), OWNER_PLAINTEXT);
        let incorrect_view_key = ViewKey::from_string(NON_OWNER_VIEW_KEY);
        assert!(record.decrypt(&incorrect_view_key).is_err());
    }

    #[wasm_bindgen_test]
    fn test_is_owner() {
        let record = RecordCiphertext::from_string(OWNER_CIPHERTEXT).unwrap();
        let view_key = ViewKey::from_string(OWNER_VIEW_KEY);
        assert!(record.is_owner(&view_key));
        let incorrect_view_key = ViewKey::from_string(NON_OWNER_VIEW_KEY);
        assert!(!record.is_owner(&incorrect_view_key));
    }
}
