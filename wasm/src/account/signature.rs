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

use aleo_account::{Address, Signature as SignatureNative};

use std::str::FromStr;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Signature {
    pub(crate) signature: SignatureNative,
}

#[wasm_bindgen]
impl Signature {
    #[wasm_bindgen]
    pub fn from_string(signature: &str) -> Self {
        let signature = SignatureNative::from_str(signature).unwrap();

        Self { signature }
    }

    #[wasm_bindgen]
    pub fn verify(&self, address: &str, message: &[u8]) -> bool {
        let address_obj = Address::from_str(address).unwrap();

        self.signature.verify_bytes(&address_obj, &message)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    use aleo_account::PrivateKey;
    use rand::{rngs::StdRng, SeedableRng};
    use std::convert::TryFrom;
    use wasm_bindgen_test::*;

    const ITERATIONS: u64 = 100;

    #[wasm_bindgen_test]
    pub fn test_verify_good_signature() {
        for _ in 0..ITERATIONS {
            let private_key = PrivateKey::new(&mut StdRng::from_entropy()).unwrap();
            let message: [u8; 32] = [1; 32];
            let address = Address::try_from(&private_key).unwrap().to_string();

            let signature_string = SignatureNative::sign_bytes(&private_key, &message, &mut StdRng::from_entropy())
                .unwrap()
                .to_string();
            let signature = Signature::from_string(&signature_string);

            // Check the private_key derived from the view key.
            assert_eq!(true, signature.verify(&address, &message));
        }
    }

    #[wasm_bindgen_test]
    pub fn test_verify_bad_signature() {
        for _ in 0..ITERATIONS {
            let private_key = PrivateKey::new(&mut StdRng::from_entropy()).unwrap();
            let message: [u8; 32] = [1; 32];
            let bad_message: [u8; 32] = [2; 32];
            let address = Address::try_from(&private_key).unwrap().to_string();

            let signature_string = SignatureNative::sign_bytes(&private_key, &message, &mut StdRng::from_entropy())
                .unwrap()
                .to_string();
            let signature = Signature::from_string(&signature_string);

            // Check the private_key derived from the view key.
            assert_eq!(false, signature.verify(&address, &bad_message));
        }
    }
}
