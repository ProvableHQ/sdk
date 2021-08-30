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

use aleo_account::Account as AccountInner;
use aleo_network::Testnet2;

use rand::{rngs::StdRng, SeedableRng};
use std::str::FromStr;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Account {
    pub(crate) account: AccountInner<Testnet2>,
}

#[wasm_bindgen]
impl Account {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        let rng = &mut StdRng::from_entropy();
        Self {
            account: AccountInner::new(rng).unwrap(),
        }
    }

    #[wasm_bindgen]
    pub fn from_private_key(private_key: &str) -> Self {
        Self {
            account: AccountInner::from_str(private_key).unwrap(),
        }
    }

    #[wasm_bindgen]
    pub fn to_private_key(&self) -> String {
        self.account.private_key().to_string()
    }

    #[wasm_bindgen]
    pub fn to_view_key(&self) -> String {
        self.account.view_key().to_string()
    }

    #[wasm_bindgen]
    pub fn to_address(&self) -> String {
        self.account.address().to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    use wasm_bindgen_test::*;

    #[wasm_bindgen_test]
    pub fn from_private_key_test() {
        let given_private_key = "APrivateKey1tvv5YV1dipNiku2My8jMkqpqCyYKvR5Jq4y2mtjw7s77Zpn";
        let given_view_key = "AViewKey1m8gvywHKHKfUzZiLiLoHedcdHEjKwo5TWo6efz8gK7wF";
        let given_address = "aleo1faksgtpmculyzt6tgaq26fe4fgdjtwualyljjvfn2q6k42ydegzspfz9uh";

        let account = Account::from_private_key(given_private_key);

        println!("{} == {}", given_private_key, account.private_key.to_string());
        assert_eq!(given_private_key, account.private_key.to_string());

        println!("{} == {}", given_view_key, account.view_key.to_string());
        assert_eq!(given_view_key, account.view_key.to_string());

        println!("{} == {}", given_address, account.address.to_string());
        assert_eq!(given_address, account.address.to_string());
    }

    #[wasm_bindgen_test]
    pub fn to_private_key_test() {
        let given_private_key = "APrivateKey1tvv5YV1dipNiku2My8jMkqpqCyYKvR5Jq4y2mtjw7s77Zpn";

        let account = Account::from_private_key(given_private_key);

        println!("{} == {}", given_private_key, account.to_private_key());
        assert_eq!(given_private_key, account.to_private_key());
    }

    #[wasm_bindgen_test]
    pub fn to_view_key_test() {
        let given_private_key = "APrivateKey1tvv5YV1dipNiku2My8jMkqpqCyYKvR5Jq4y2mtjw7s77Zpn";
        let given_view_key = "AViewKey1m8gvywHKHKfUzZiLiLoHedcdHEjKwo5TWo6efz8gK7wF";

        let account = Account::from_private_key(given_private_key);

        println!("{} == {}", given_view_key, account.to_view_key());
        assert_eq!(given_view_key, account.to_view_key());
    }

    #[wasm_bindgen_test]
    pub fn to_address_test() {
        let given_private_key = "APrivateKey1tvv5YV1dipNiku2My8jMkqpqCyYKvR5Jq4y2mtjw7s77Zpn";
        let given_address = "aleo1faksgtpmculyzt6tgaq26fe4fgdjtwualyljjvfn2q6k42ydegzspfz9uh";

        let account = Account::from_private_key(given_private_key);

        println!("{} == {}", given_address, account.to_address());
        assert_eq!(given_address, account.to_address());
    }
}
