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

use aleo_account::{Address as AddressNative, PrivateKey as PrivateKeyNative, ViewKey as ViewKeyNative};

use core::{convert::TryFrom, fmt, str::FromStr};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Copy, Clone, Debug, PartialEq, Eq)]
pub struct Address {
    pub(crate) address: AddressNative,
}

#[wasm_bindgen]
impl Address {
    pub fn from_private_key(private_key: &str) -> Self {
        let private_key = PrivateKeyNative::from_str(private_key).unwrap();
        Self { address: AddressNative::try_from(private_key).unwrap() }
    }

    pub fn from_view_key(view_key: &str) -> Self {
        let view_key = ViewKeyNative::from_str(view_key).unwrap();
        Self { address: AddressNative::try_from(&view_key).unwrap() }
    }

    pub fn from_string(address: &str) -> Self {
        Self { address: AddressNative::from_str(address).unwrap() }
    }
}

impl fmt::Display for Address {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{}", self.address)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::account::PrivateKey;

    use wasm_bindgen_test::*;

    const ITERATIONS: u64 = 1_000;

    #[wasm_bindgen_test]
    pub fn test_address_from_private_key() {
        for _ in 0..ITERATIONS {
            // Sample a new private key.
            let private_key = PrivateKey::new();
            let expected = Address::from_private_key(&private_key.to_string());

            // Check the address derived from the view key.
            let view_key = private_key.to_view_key();
            assert_eq!(expected, Address::from_view_key(&view_key));
        }
    }
}
