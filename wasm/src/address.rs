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

use aleo_account::{
    address::Address as AddressNative,
    private_key::PrivateKey,
    view_key::{Signature, ViewKey},
};

use std::str::FromStr;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Address {
    pub(crate) address: AddressNative,
}

#[wasm_bindgen]
impl Address {
    #[wasm_bindgen]
    pub fn from_private_key(private_key: &str) -> Self {
        let private_key = PrivateKey::from_str(private_key).unwrap();
        let address = AddressNative::from(&private_key).unwrap();
        Self { address }
    }

    #[wasm_bindgen]
    pub fn from_view_key(view_key: &str) -> Self {
        let view_key = ViewKey::from_str(view_key).unwrap();
        let address = AddressNative::from_view_key(&view_key).unwrap();
        Self { address }
    }

    #[wasm_bindgen]
    pub fn from_string(address: &str) -> Self {
        let address = AddressNative::from_str(address).unwrap();
        Self { address }
    }

    /// Verify a signature signed by the view key
    /// Returns `true` if the signature is verified correctly. Otherwise, returns `false`.
    #[wasm_bindgen]
    pub fn verify(&self, message: &str, signature: &str) -> bool {
        let signature = Signature::from_str(signature).unwrap();
        let message = message.as_bytes();

        self.address.verify(&message, &signature).unwrap()
    }

    #[wasm_bindgen]
    pub fn to_string(&self) -> String {
        self.address.to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    use wasm_bindgen_test::*;

    #[wasm_bindgen_test]
    pub fn from_private_key_test() {
        let given_private_key = "APrivateKey1tvv5YV1dipNiku2My8jMkqpqCyYKvR5Jq4y2mtjw7s77Zpn";
        let given_address = "aleo1faksgtpmculyzt6tgaq26fe4fgdjtwualyljjvfn2q6k42ydegzspfz9uh";

        let address = Address::from_private_key(given_private_key);

        println!("{} == {}", given_address, address.to_string());
        assert_eq!(given_address, address.to_string());
    }

    #[wasm_bindgen_test]
    pub fn from_view_key_test() {
        let given_view_key = "AViewKey1m8gvywHKHKfUzZiLiLoHedcdHEjKwo5TWo6efz8gK7wF";
        let given_address = "aleo1faksgtpmculyzt6tgaq26fe4fgdjtwualyljjvfn2q6k42ydegzspfz9uh";

        let address = Address::from_view_key(given_view_key);

        println!("{} == {}", given_address, address.to_string());
        assert_eq!(given_address, address.to_string());
    }
}
