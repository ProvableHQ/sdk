// Copyright (C) 2019-2021 Aleo Systems Inc.
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

use aleo_account::{PrivateKey, RecordCiphertext, ViewKey as ViewKeyNative};

use std::{convert::TryFrom, str::FromStr};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct ViewKey {
    pub(crate) view_key: ViewKeyNative,
}

#[wasm_bindgen]
impl ViewKey {
    #[wasm_bindgen]
    pub fn from_private_key(private_key: &str) -> Self {
        let private_key = PrivateKey::from_str(private_key).unwrap();
        let view_key = ViewKeyNative::try_from(private_key).unwrap();
        Self { view_key }
    }

    #[wasm_bindgen]
    pub fn from_string(view_key: &str) -> Self {
        let view_key = ViewKeyNative::from_str(view_key).unwrap();
        Self { view_key }
    }

    #[wasm_bindgen]
    #[allow(clippy::inherent_to_string)]
    pub fn to_string(&self) -> String {
        self.view_key.to_string()
    }

    #[wasm_bindgen]
    pub fn decrypt(&self, ciphertext: &str) -> Result<String, String> {
        let ciphertext = RecordCiphertext::from_str(ciphertext).map_err(|error| error.to_string())?;
        match ciphertext.decrypt(&self.view_key) {
            Ok(plaintext) => Ok(plaintext.to_string()),
            Err(_) => Err("Incorrect view key".to_string()),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    use wasm_bindgen_test::*;

    const CORRECT_VIEW_KEY: &str = "AViewKey1dcqVNvMqYGoVtaQJW1YnmH23XABeeQTq9d6XmYUmo7CW";
    const INCORRECT_VIEW_KEY: &str = "AViewKey1i3fn5SECcVBtQMCVtTPSvdApoMYmg3ToJfNDfgHJAuoD";

    #[wasm_bindgen_test]
    pub fn test_from_private_key() {
        let given_private_key = "APrivateKey1zkp4RyQ8Utj7aRcJgPQGEok8RMzWwUZzBhhgX6rhmBT8dcP";
        let given_view_key = "AViewKey1i3fn5SECcVBtQMCVtTPSvdApoMYmg3ToJfNDfgHJAuoD";

        let view_key = ViewKey::from_private_key(given_private_key);

        assert_eq!(given_view_key, view_key.to_string());
    }

    #[wasm_bindgen_test]
    pub fn test_decrypt_success() {
        let ciphertext = "record1qyqspplg2ud9gguy8ud9wjmee3cf2vztxcjxe2ernf8m7ru5wvsqkdqxqyqsq7y540qmemqx3675pufewwmywsudzrpstjx3fd38c6d8uz4r4mgpqqqt2q2jjczxp2y6986zdqz3mr5jmhggmge3exc72vgw2kgr4gea2zgzhrz8q";
        let view_key = ViewKey::from_string(CORRECT_VIEW_KEY);
        let plaintext = view_key.decrypt(ciphertext);
        let expected_plaintext = "{owner: aleo1snwe5h89dv6hv2q2pl3v8l9cweeuwrgejmlnwza6ndacygznlu9sjt8pgv.private, gates: 1u64.private, data: {}, _nonce: 4447510634654730534613001085815220248957154008834207042015711498717088580021group.public}";
        assert!(plaintext.is_ok());
        assert_eq!(expected_plaintext, plaintext.unwrap())
    }

    #[wasm_bindgen_test]
    pub fn test_decrypt_fails() {
        let ciphertext = "record1qyqspplg2ud9gguy8ud9wjmee3cf2vztxcjxe2ernf8m7ru5wvsqkdqxqyqsq7y540qmemqx3675pufewwmywsudzrpstjx3fd38c6d8uz4r4mgpqqqt2q2jjczxp2y6986zdqz3mr5jmhggmge3exc72vgw2kgr4gea2zgzhrz8q";
        let incorrect_private_key = ViewKey::from_string(INCORRECT_VIEW_KEY);
        let plaintext = incorrect_private_key.decrypt(ciphertext);
        assert!(plaintext.is_err());
    }
}
