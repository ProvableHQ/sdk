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

use crate::account::{Address, ViewKey};
use aleo_account::PrivateKey as PrivateKeyNative;

use rand::{rngs::StdRng, SeedableRng};
use std::{str::FromStr};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct PrivateKey {
    pub(crate) private_key: PrivateKeyNative,
}

#[wasm_bindgen]
impl PrivateKey {
    #[wasm_bindgen(constructor)]
    #[allow(clippy::new_without_default)]
    pub fn new() -> Self {
        console_error_panic_hook::set_once();
        Self {
            private_key: PrivateKeyNative::new(&mut StdRng::from_entropy()).unwrap(),
        }
    }

    #[wasm_bindgen]
    pub fn from_string(private_key: &str) -> Self {
        Self {
            private_key: PrivateKeyNative::from_str(private_key).unwrap(),
        }
    }

    #[wasm_bindgen]
    #[allow(clippy::inherent_to_string)]
    pub fn to_string(&self) -> String {
        self.private_key.to_string()
    }

    #[wasm_bindgen]
    pub fn to_view_key(&self) -> String {
        ViewKey::from_private_key(&self.to_string()).to_string()
    }

    #[wasm_bindgen]
    pub fn to_address(&self) -> String {
        Address::from_private_key(&self.to_string()).to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    use wasm_bindgen_test::*;

    const ITERATIONS: u64 = 1_000;

    #[wasm_bindgen_test]
    pub fn test_private_key_new() {
        for _ in 0..ITERATIONS {
            // Generate a new private_key.
            let expected = PrivateKey::new();

            // Check the private_key derived from string.
            assert_eq!(
                expected,
                PrivateKey::from_string(&expected.to_string())
            );
        }
    }

    #[wasm_bindgen_test]
    pub fn test_private_key_to_address() {
        for _ in 0..ITERATIONS {
            // Sample a new private key.
            let private_key = PrivateKey::new();
            let expected = private_key.to_address();

            // Check the private_key derived from the view key.
            let view_key = private_key.to_view_key();
            assert_eq!(expected, Address::from_view_key(&view_key).to_string());
        }
    }
}
