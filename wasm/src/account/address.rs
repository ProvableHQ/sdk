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

use crate::account::{PrivateKey, Signature, ViewKey};

use crate::types::native::AddressNative;
use core::{convert::TryFrom, fmt, ops::Deref, str::FromStr};
use wasm_bindgen::prelude::*;

/// Public address of an Aleo account
#[wasm_bindgen]
#[derive(Copy, Clone, Debug, PartialEq, Eq)]
pub struct Address(AddressNative);

#[wasm_bindgen]
impl Address {
    /// Derive an Aleo address from a private key
    ///
    /// @param {PrivateKey} private_key The private key to derive the address from
    /// @returns {Address} Address corresponding to the private key
    pub fn from_private_key(private_key: &PrivateKey) -> Self {
        Self(AddressNative::try_from(**private_key).unwrap())
    }

    /// Derive an Aleo address from a view key
    ///
    /// @param {ViewKey} view_key The view key to derive the address from
    /// @returns {Address} Address corresponding to the view key
    pub fn from_view_key(view_key: &ViewKey) -> Self {
        Self(AddressNative::try_from(**view_key).unwrap())
    }

    /// Create an aleo address object from a string representation of an address
    ///
    /// @param {string} address String representation of an addressm
    /// @returns {Address} Address
    pub fn from_string(address: &str) -> Self {
        Self::from_str(address).unwrap()
    }

    /// Get a string representation of an Aleo address object
    ///
    /// @param {Address} Address
    /// @returns {string} String representation of the address
    #[allow(clippy::inherent_to_string_shadow_display)]
    pub fn to_string(&self) -> String {
        self.0.to_string()
    }

    /// Verify a signature for a message signed by the address
    ///
    /// @param {Uint8Array} Byte array representing a message signed by the address
    /// @returns {boolean} Boolean representing whether or not the signature is valid
    pub fn verify(&self, message: &[u8], signature: &Signature) -> bool {
        signature.verify(self, message)
    }
}

impl FromStr for Address {
    type Err = anyhow::Error;

    fn from_str(address: &str) -> Result<Self, Self::Err> {
        Ok(Self(AddressNative::from_str(address)?))
    }
}

impl fmt::Display for Address {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl Deref for Address {
    type Target = AddressNative;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::account::PrivateKey;

    use wasm_bindgen_test::*;

    const ITERATIONS: u64 = 1_000;

    #[wasm_bindgen_test]
    pub fn test_from_private_key() {
        for _ in 0..ITERATIONS {
            // Sample a new private key.
            let private_key = PrivateKey::new();
            let expected = Address::from_private_key(&private_key);

            // Check the address derived from the view key.
            let view_key = private_key.to_view_key();
            assert_eq!(expected, Address::from_view_key(&view_key));
        }
    }
}
