// Copyright (C) 2019-2023 Aleo Systems Inc.
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

use crate::types::native::{FromBytes, ToBytes, VerifyingKeyNative};

use wasm_bindgen::prelude::wasm_bindgen;

use std::{ops::Deref, str::FromStr};

/// Verifying key for a function within an Aleo program
#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct VerifyingKey(VerifyingKeyNative);

#[wasm_bindgen]
impl VerifyingKey {
    /// Construct a new verifying key from a byte array
    ///
    /// @param {Uint8Array} bytes Byte representation of a verifying key
    /// @returns {VerifyingKey | Error}
    #[wasm_bindgen(js_name = "fromBytes")]
    pub fn from_bytes(bytes: &[u8]) -> Result<VerifyingKey, String> {
        Ok(Self(VerifyingKeyNative::from_bytes_le(bytes).map_err(|e| e.to_string())?))
    }

    /// Create a byte array from a verifying key
    ///
    /// @returns {Uint8Array | Error} Byte representation of a verifying key
    #[wasm_bindgen(js_name = "toBytes")]
    pub fn to_bytes(&self) -> Result<Vec<u8>, String> {
        self.0.to_bytes_le().map_err(|_| "Failed to serialize verifying key".to_string())
    }

    /// Create a verifying key from string
    ///
    /// @param {String} string String representation of a verifying key
    /// @returns {VerifyingKey | Error}
    #[wasm_bindgen(js_name = "fromString")]
    pub fn from_string(string: &str) -> Result<VerifyingKey, String> {
        Ok(Self(VerifyingKeyNative::from_str(string).map_err(|e| e.to_string())?))
    }

    /// Get a string representation of the verifying key
    ///
    /// @returns {String} String representation of the verifying key
    #[wasm_bindgen(js_name = "toString")]
    #[allow(clippy::inherent_to_string)]
    pub fn to_string(&self) -> String {
        self.0.to_string()
    }

    /// Create a copy of the verifying key
    ///
    /// @returns {VerifyingKey} A copy of the verifying key
    #[wasm_bindgen]
    pub fn copy(&self) -> VerifyingKey {
        self.0.clone().into()
    }
}

impl Deref for VerifyingKey {
    type Target = VerifyingKeyNative;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl From<VerifyingKey> for VerifyingKeyNative {
    fn from(verifying_key: VerifyingKey) -> VerifyingKeyNative {
        verifying_key.0
    }
}

impl From<&VerifyingKey> for VerifyingKeyNative {
    fn from(verifying_key: &VerifyingKey) -> VerifyingKeyNative {
        verifying_key.0.clone()
    }
}

impl From<VerifyingKeyNative> for VerifyingKey {
    fn from(verifying_key: VerifyingKeyNative) -> VerifyingKey {
        VerifyingKey(verifying_key)
    }
}

impl PartialEq for VerifyingKey {
    fn eq(&self, other: &Self) -> bool {
        *self.0 == *other.0
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use wasm_bindgen_test::*;

    const JOIN_VERIFYING_KEY_STRING: &str = "verifier1qygqqqqqqqqqqqz2cvqqqqqqqqqx0scqqqqqqqqqc42qzqqqqqqqpvmfqyqqqqqqqquzwqgqqqqqqqqvqqqqqqqqqqqpz6knqjfm77py0mpx68rmc6yavzrjpn3vdn5rmhum6u47fxt3j7auv5mk8epjx0hsa7nfm4llzwqqj84x9cnerm5gach0nzfy0jsvfrylvld5ffe8g63nhw5qng68rs6yrlzrc5229ezc8j4n4y0f2hrqqmdphh3mpglur7evq52n6mx9nls064fpn8wr3vqz75vextjhjmpvcrgs8har5txjnh9tj8lmlusns8nklkw8dh8nc8sv0llh4cgw95l3m7mwugu5nfrrlmyccnmrues4wl0hdfwsq8wvn60y2hl036g3aqzh5cn6n2366fy4hawjn22mj86w2w7twq80pdrea6svl7uq5zyh9nz4qgd72tql95n2xx0zh3wcjyqca5wzv4276exszaunpjduuvjmture49av40ve03akc9qw709wuf9a8hhpwlwwz8acf2z5ngk2d95qzfqhkmllqx4lnupyevkn8zthgu54x55t4cqm7uvmmnu3vtvkmsr4tldemm26shwk8ux27v6lmxkqppuesjj5d3m7x5rsg7yn8cg6hkat6fy8u8zj3n0z26ehqvmq8x2fadtw5jt6pxxfp3cm40ak7x9yqym5qrwjzpr7xwr4t6pjn5ca9g02hnuyvxd9jqpv70a7w05mqatnyzhnfl462xmsehgcwczjkrzz2qxk3wa0elrnvnh9qlz3cc2g8xyag9yrds0jepsvskl55zqtntp6qvkj9nkmlercd95j8g9xdgxv0sq0y6gq32ng5r9zcs4wt3vryhldxtr9epyz5vnnx4mf2lhv4r56mftaugjemxezpjcv9enr259tf7qq66a7ngsc3y0a5jlm8jg2rnd9c38ny2m5egl7ssx62zcscztkmjqpkvta2za4ym5jkatgzd2zspfcrc7gesjxjgcvhsua3jpyzpdan6mestyqsx5eatkmzv9zmpwkur3c34sjzc";

    #[allow(dead_code)]
    #[test]
    fn verifying_key_strings() {
        let fee_private_verifier_bytes =
            VerifyingKey::from_bytes(&snarkvm_parameters::testnet3::FeePrivateVerifier::load_bytes().unwrap())
                .unwrap()
                .to_string();
        let fee_public_verifier_bytes =
            VerifyingKey::from_bytes(&snarkvm_parameters::testnet3::FeePublicVerifier::load_bytes().unwrap())
                .unwrap()
                .to_string();
        let inclusion_verifier_bytes =
            VerifyingKey::from_bytes(&snarkvm_parameters::testnet3::InclusionVerifier::load_bytes().unwrap())
                .unwrap()
                .to_string();
        let join_verifier_bytes =
            VerifyingKey::from_bytes(&snarkvm_parameters::testnet3::JoinVerifier::load_bytes().unwrap())
                .unwrap()
                .to_string();
        let split_verifier_bytes =
            VerifyingKey::from_bytes(&snarkvm_parameters::testnet3::SplitVerifier::load_bytes().unwrap())
                .unwrap()
                .to_string();
        let transfer_private_verifier_bytes =
            VerifyingKey::from_bytes(&snarkvm_parameters::testnet3::TransferPrivateVerifier::load_bytes().unwrap())
                .unwrap()
                .to_string();
        let transfer_private_to_public_verifier_bytes = VerifyingKey::from_bytes(
            &snarkvm_parameters::testnet3::TransferPrivateToPublicVerifier::load_bytes().unwrap(),
        )
        .unwrap()
        .to_string();
        let transfer_public_verifier_bytes =
            VerifyingKey::from_bytes(&snarkvm_parameters::testnet3::TransferPublicVerifier::load_bytes().unwrap())
                .unwrap()
                .to_string();
        let transfer_public_to_private_verifier_bytes = VerifyingKey::from_bytes(
            &snarkvm_parameters::testnet3::TransferPublicToPrivateVerifier::load_bytes().unwrap(),
        )
        .unwrap()
        .to_string();
        let bond_public_verifier_bytes =
            VerifyingKey::from_bytes(&snarkvm_parameters::testnet3::BondPublicVerifier::load_bytes().unwrap())
                .unwrap()
                .to_string();
        let unbond_public_verifier_bytes =
            VerifyingKey::from_bytes(&snarkvm_parameters::testnet3::UnbondPublicVerifier::load_bytes().unwrap())
                .unwrap()
                .to_string();
        let claim_unbond_public_verifier_bytes =
            VerifyingKey::from_bytes(&snarkvm_parameters::testnet3::ClaimUnbondPublicVerifier::load_bytes().unwrap())
                .unwrap()
                .to_string();
        println!("bond_public_verifier: {}", bond_public_verifier_bytes);
        println!("claim_unbond_public_verifier: {}", claim_unbond_public_verifier_bytes);
        println!("fee_private_verifier: {}", fee_private_verifier_bytes);
        println!("fee_public_verifier: {}", fee_public_verifier_bytes);
        println!("inclusion_verifier: {}", inclusion_verifier_bytes);
        println!("join_verifier: {}", join_verifier_bytes);
        println!("split_verifier: {}", split_verifier_bytes);
        println!("transfer_private_verifier: {}", transfer_private_verifier_bytes);
        println!("transfer_private_to_public_verifier: {}", transfer_private_to_public_verifier_bytes);
        println!("transfer_public_verifier: {}", transfer_public_verifier_bytes);
        println!("transfer_public_to_private_verifier: {}", transfer_public_to_private_verifier_bytes);
        println!("unbond_public_verifier: {}", unbond_public_verifier_bytes);
    }

    #[wasm_bindgen_test]
    async fn test_verifying_key_roundtrip() {
        let join_verifier_bytes = snarkvm_parameters::testnet3::JoinVerifier::load_bytes().unwrap();
        let join_verifier = VerifyingKey::from_bytes(&join_verifier_bytes).unwrap();
        let join_key_string = join_verifier.to_string();
        assert_eq!(join_key_string, JOIN_VERIFYING_KEY_STRING);
    }
}
