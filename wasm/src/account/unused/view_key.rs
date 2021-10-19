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

use aleo_account::{PrivateKey, ViewKey as ViewKeyNative};

use rand::{rngs::StdRng, SeedableRng};
use std::str::FromStr;
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
        let view_key = ViewKeyNative::from(&private_key).unwrap();
        Self { view_key }
    }

    #[wasm_bindgen]
    pub fn from_string(view_key: &str) -> Self {
        let view_key = ViewKeyNative::from_str(view_key).unwrap();
        Self { view_key }
    }

    #[wasm_bindgen]
    pub fn to_string(&self) -> String {
        self.view_key.to_string()
    }

    /// Sign a message with the view key.
    #[wasm_bindgen]
    pub fn sign(&self, message: &str) -> String {
        let rng = &mut StdRng::from_entropy();

        let message = message.as_bytes();

        let signature = self.view_key.sign(&message, rng).unwrap();

        signature.to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::account::address::Address;

    use wasm_bindgen_test::*;

    #[wasm_bindgen_test]
    pub fn from_private_key_test() {
        let given_private_key = "APrivateKey1tvv5YV1dipNiku2My8jMkqpqCyYKvR5Jq4y2mtjw7s77Zpn";
        let given_view_key = "AViewKey1m8gvywHKHKfUzZiLiLoHedcdHEjKwo5TWo6efz8gK7wF";

        let view_key = ViewKey::from_private_key(given_private_key);

        println!("{} == {}", given_view_key, view_key.to_string());
        assert_eq!(given_view_key, view_key.to_string());
    }

    // Test Schnorr signature scheme where:
    //   The Account View Key is the signature private key.
    //   The Account Address is the signature public key.

    #[wasm_bindgen_test]
    pub fn test_view_key_signature_verification() {
        let given_view_key = "AViewKey1m8gvywHKHKfUzZiLiLoHedcdHEjKwo5TWo6efz8gK7wF";
        let given_message = "test message";

        let view_key = ViewKey::from_string(given_view_key);
        let address = Address::from_view_key(given_view_key);

        let signature = view_key.sign(given_message);

        let signature_verification = address.verify(given_message, &signature);

        println!("{} == {}", true, signature_verification);
        assert!(signature_verification);
    }

    #[wasm_bindgen_test]
    pub fn test_view_key_signature_failed_verification() {
        let given_view_key = "AViewKey1m8gvywHKHKfUzZiLiLoHedcdHEjKwo5TWo6efz8gK7wF";
        let given_message = "test message";
        let bad_message = "bad message";

        let view_key = ViewKey::from_string(given_view_key);
        let address = Address::from_view_key(given_view_key);

        let signature = view_key.sign(given_message);

        let signature_verification = address.verify(bad_message, &signature);

        println!("{} == {}", false, signature_verification);
        assert!(!signature_verification);
    }
}
