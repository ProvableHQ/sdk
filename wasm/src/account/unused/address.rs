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

use aleo_account::{Address as AddressNative, PrivateKey, ViewKey};

use snarkvm_utilities::Uniform;

use rand::{rngs::StdRng, SeedableRng};
use std::{convert::TryFrom, str::FromStr};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Address {
    pub(crate) address: AddressNative,
}

#[wasm_bindgen]
impl Address {
    #[wasm_bindgen(constructor)]
    #[allow(clippy::new_without_default)]
    pub fn new() -> Self {
        console_error_panic_hook::set_once();

        let rng = &mut StdRng::from_entropy();
        Self {
            address: AddressNative::new(Uniform::rand(rng)),
        }
    }

    #[wasm_bindgen]
    pub fn from_private_key(private_key: &str) -> Self {
        let private_key = PrivateKey::from_str(private_key).unwrap();
        let address = AddressNative::try_from(&private_key).unwrap();
        Self { address }
    }

    #[wasm_bindgen]
    pub fn from_view_key(view_key: &str) -> Self {
        let view_key = ViewKey::from_str(view_key).unwrap();
        let address = AddressNative::try_from(&view_key).unwrap();
        Self { address }
    }

    #[wasm_bindgen]
    pub fn from_string(address: &str) -> Self {
        let address = AddressNative::from_str(address).unwrap();
        Self { address }
    }

    #[wasm_bindgen]
    pub fn to_string(&self) -> String {
        self.address.to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    use snarkvm_utilities::test_crypto_rng;
    use wasm_bindgen_test::*;

    const ITERATIONS: u64 = 1_000;

    #[wasm_bindgen_test]
    pub fn test_address_new() {
        for _ in 0..ITERATIONS {
            // Generate a new address.
            let expected = Address::new();

            // Check the address derived from string.
            assert_eq!(
                expected.to_string(),
                Address::from_string(&expected.to_string()).to_string()
            );
        }
    }

    #[wasm_bindgen_test]
    pub fn test_address_from_private_key() {
        for _ in 0..ITERATIONS {
            // Sample a new private key.
            let private_key = PrivateKey::new(&mut test_crypto_rng()).unwrap();
            let expected = Address::from_private_key(&private_key.to_string());

            // Check the address derived from the view key.
            let view_key = ViewKey::try_from(&private_key).unwrap();
            assert_eq!(
                expected.to_string(),
                Address::from_view_key(&view_key.to_string()).to_string()
            );
        }
    }
}
