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

    const TEST_PRIVATE_KEY: &'static str = "APrivateKey1y9jeNQybT9Mxk1AssbFmSXcFu9dG7sWkfYEsBUZrMin816z";
    const TEST_VIEW_KEY: &'static str = "AViewKey1hNsfjkmrfiYWqMKtpKUW9LfGw93Pzz82UmmMn7pHHqZc";
    const TEST_ADDRESS: &'static str = "aleo10kkut299n0fsmwu9z20hjmcdym4nv5s8adgtqaev3n3yqjlasqyqq6rk4d";

    #[wasm_bindgen_test]
    pub fn from_private_key_test() {
        let account = Account::from_private_key(TEST_PRIVATE_KEY);

        println!("{} == {}", TEST_PRIVATE_KEY, account.account.private_key().to_string());
        assert_eq!(TEST_PRIVATE_KEY, account.account.private_key().to_string());

        println!("{} == {}", TEST_VIEW_KEY, account.account.account.view_key.to_string());
        assert_eq!(TEST_VIEW_KEY, account.account.account.view_key.to_string());

        println!("{} == {}", TEST_ADDRESS, account.account.account.address.to_string());
        assert_eq!(TEST_ADDRESS, account.account.account.address.to_string());
    }

    #[wasm_bindgen_test]
    pub fn to_private_key_test() {
        let account = Account::from_private_key(TEST_PRIVATE_KEY);

        println!("{} == {}", TEST_PRIVATE_KEY, account.to_private_key());
        assert_eq!(TEST_PRIVATE_KEY, account.to_private_key());
    }

    #[wasm_bindgen_test]
    pub fn to_view_key_test() {
        let account = Account::from_private_key(TEST_PRIVATE_KEY);

        println!("{} == {}", TEST_VIEW_KEY, account.to_view_key());
        assert_eq!(TEST_VIEW_KEY, account.to_view_key());
    }

    #[wasm_bindgen_test]
    pub fn to_address_test() {
        let account = Account::from_private_key(TEST_PRIVATE_KEY);

        println!("{} == {}", TEST_ADDRESS, account.to_address());
        assert_eq!(TEST_ADDRESS, account.to_address());
    }
}
