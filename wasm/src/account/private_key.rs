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

use crate::account::{Address, Signature, ViewKey};
use aleo_account::{CurrentNetwork, Environment, FromBytes, PrimeField, PrivateKey as PrivateKeyNative, ToBytes};

use core::{convert::TryInto, fmt, ops::Deref, str::FromStr};
use rand::{rngs::StdRng, SeedableRng};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct PrivateKey(PrivateKeyNative);

#[wasm_bindgen]
impl PrivateKey {
    #[wasm_bindgen(constructor)]
    #[allow(clippy::new_without_default)]
    pub fn new() -> Self {
        console_error_panic_hook::set_once();
        Self(PrivateKeyNative::new(&mut StdRng::from_entropy()).unwrap())
    }

    pub fn from_seed_unchecked(seed: &[u8]) -> Self {
        console_error_panic_hook::set_once();
        // Cast into a fixed-size byte array. Note: This is a **hard** requirement for security.
        let seed: [u8; 32] = seed.try_into().unwrap();
        // Recover the field element deterministically.
        let field = <CurrentNetwork as Environment>::Field::from_bytes_le_mod_order(&seed);
        // Cast and recover the private key from the seed.
        Self(PrivateKeyNative::try_from(FromBytes::read_le(&*field.to_bytes_le().unwrap()).unwrap()).unwrap())
    }

    pub fn from_string(private_key: &str) -> Self {
        Self::from_str(private_key).unwrap()
    }

    #[allow(clippy::inherent_to_string_shadow_display)]
    pub fn to_string(&self) -> String {
        self.0.to_string()
    }

    pub fn to_view_key(&self) -> ViewKey {
        ViewKey::from_private_key(self)
    }

    pub fn to_address(&self) -> Address {
        Address::from_private_key(self)
    }

    pub fn sign(&self, message: &[u8]) -> Signature {
        Signature::sign(self, message)
    }
}

impl FromStr for PrivateKey {
    type Err = anyhow::Error;

    fn from_str(private_key: &str) -> Result<Self, Self::Err> {
        Ok(Self(PrivateKeyNative::from_str(private_key)?))
    }
}

impl fmt::Display for PrivateKey {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl Deref for PrivateKey {
    type Target = PrivateKeyNative;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    use rand::Rng;
    use wasm_bindgen_test::*;

    const ITERATIONS: u64 = 1_000;

    const ALEO_PRIVATE_KEY: &str = "APrivateKey1zkp3dQx4WASWYQVWKkq14v3RoQDfY2kbLssUj7iifi1VUQ6";
    const ALEO_VIEW_KEY: &str = "AViewKey1cxguxtKkjYnT9XDza9yTvVMxt6Ckb1Pv4ck1hppMzmCB";
    const ALEO_ADDRESS: &str = "aleo184vuwr5u7u0ha5f5k44067dd2uaqewxx6pe5ltha5pv99wvhfqxqv339h4";

    #[wasm_bindgen_test]
    pub fn test_sanity_check() {
        let private_key = PrivateKey::from_string(ALEO_PRIVATE_KEY);

        println!("{} == {}", ALEO_PRIVATE_KEY, private_key.to_string());
        assert_eq!(ALEO_PRIVATE_KEY, private_key.to_string());

        println!("{} == {}", ALEO_VIEW_KEY, private_key.to_view_key());
        assert_eq!(ALEO_VIEW_KEY, private_key.to_view_key().to_string());

        println!("{} == {}", ALEO_ADDRESS, private_key.to_address());
        assert_eq!(ALEO_ADDRESS, private_key.to_address().to_string());
    }

    #[wasm_bindgen_test]
    pub fn test_new() {
        for _ in 0..ITERATIONS {
            // Generate a new private_key.
            let expected = PrivateKey::new();

            // Check the private_key derived from string.
            assert_eq!(expected, PrivateKey::from_string(&expected.to_string()));
        }
    }

    #[wasm_bindgen_test]
    pub fn test_from_seed_unchecked() {
        for _ in 0..ITERATIONS {
            // Sample a random seed.
            let seed: [u8; 32] = StdRng::from_entropy().gen();

            // Ensure the private key is deterministically recoverable.
            let expected = PrivateKey::from_seed_unchecked(&seed);
            assert_eq!(expected, PrivateKey::from_seed_unchecked(&seed));
        }
    }

    #[wasm_bindgen_test]
    pub fn test_to_address() {
        for _ in 0..ITERATIONS {
            // Sample a new private key.
            let private_key = PrivateKey::new();
            let expected = private_key.to_address();

            // Check the private_key derived from the view key.
            let view_key = private_key.to_view_key();
            assert_eq!(expected, Address::from_view_key(&view_key));
        }
    }

    #[wasm_bindgen_test]
    pub fn test_signature() {
        for _ in 0..ITERATIONS {
            // Sample a new private key and message.
            let private_key = PrivateKey::new();
            let message: [u8; 32] = StdRng::from_entropy().gen();

            // Sign the message.
            let signature = private_key.sign(&message);
            // Check the signature is valid.
            assert!(signature.verify(&private_key.to_address(), &message));
            // Check the signature is valid (natively).
            assert!(signature.verify_bytes(&private_key.to_address(), &message));
        }
    }
}
