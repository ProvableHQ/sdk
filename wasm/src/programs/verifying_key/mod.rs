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

mod credits;
mod metadata;

use crate::types::native::{CurrentNetwork, FromBytes, Network, ToBytes, VerifyingKeyNative};

use sha2::Digest;
use wasm_bindgen::prelude::wasm_bindgen;

use std::{ops::Deref, str::FromStr};

pub use metadata::Metadata;

/// Verifying key for a function within an Aleo program
#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct VerifyingKey(VerifyingKeyNative);

#[wasm_bindgen]
impl VerifyingKey {
    /// Get the checksum of the verifying key
    ///
    /// @returns {string} Checksum of the verifying key
    pub fn checksum(&self) -> String {
        hex::encode(sha2::Sha256::digest(self.to_bytes().unwrap()))
    }

    /// Create a copy of the verifying key
    ///
    /// @returns {VerifyingKey} A copy of the verifying key
    #[wasm_bindgen]
    pub fn copy(&self) -> VerifyingKey {
        self.0.clone().into()
    }

    /// Construct a new verifying key from a byte array
    ///
    /// @param {Uint8Array} bytes Byte representation of a verifying key
    /// @returns {VerifyingKey | Error}
    #[wasm_bindgen(js_name = "fromBytes")]
    pub fn from_bytes(bytes: &[u8]) -> Result<VerifyingKey, String> {
        Ok(Self(VerifyingKeyNative::from_bytes_le(bytes).map_err(|e| e.to_string())?))
    }

    /// Create a verifying key from string
    ///
    /// @param {String} string String representation of a verifying key
    /// @returns {VerifyingKey | Error}
    #[wasm_bindgen(js_name = "fromString")]
    pub fn from_string(string: &str) -> Result<VerifyingKey, String> {
        Ok(Self(VerifyingKeyNative::from_str(string).map_err(|e| e.to_string())?))
    }

    /// Create a byte array from a verifying key
    ///
    /// @returns {Uint8Array | Error} Byte representation of a verifying key
    #[wasm_bindgen(js_name = "toBytes")]
    pub fn to_bytes(&self) -> Result<Vec<u8>, String> {
        self.0.to_bytes_le().map_err(|_| "Failed to serialize verifying key".to_string())
    }

    /// Get a string representation of the verifying key
    ///
    /// @returns {String} String representation of the verifying key
    #[wasm_bindgen(js_name = "toString")]
    #[allow(clippy::inherent_to_string)]
    pub fn to_string(&self) -> String {
        self.0.to_string()
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

    const TRANSFER_PUBLIC_VERIFYING_KEY: &str = "verifier1qygqqqqqqqqqqqp3xqqqqqqqqqqzvvqqqqqqqqqq23hqqqqqqqqqqau5qqqqqqqqqq5yzqqqqqqqqqqvqqqqqqqqqqqz2rh4q6m4u0ycv2z5qx95echpdcsktezkr2j9cvff0dngp45jfqggm8q3578nkhjudslm2rdpsgcpks4ulquyqrtd978zvj65pxmhkudyjtj005h66jcnwg3f6mdqqaqjed3avcz599kth8a3nak0tftsrk4hczcdvlmrdnzsa6rfppy72flsrhdhn6npxfxt2rrudk8jrk5fefkawhhrf0psccp6l9akckaps898v5mk7vprkx90gg798d6j5tvvtma0r9phq3jndan5rkwv8wmkngeha3pzrjzslkt8ct9umm4wfq8dhnpdv8m4plq70c3d6wxs4l3cv4gyqhgjtwfuydc5fflulwgjvdtaxxlmpf0l5n800jn2lwnt5kqqtdsx2lvzl3kw3ns5hnsu4jzg9ejptg7n7r7d9dvqsrvldw9paeq86hjxeaac6typemynwzt8w3vq3e27l4swd9aqxaas7zsy5mw7ftnjct9jq6t9rdq0kx8vjag77nt0z894xqkrfp27hehk83nfcg7cpjcc7f8mznga33xp36seafxpn26rq4w5l9uawtx02mzpq9kuyyx7nvhtad0mxk5su659xx5wv3yhqqy3577kwc40spvp9dst59ap2ll5uuq7qaauy9vy5yvrjd77c443evxrwfsee8jg5hvt6f9xaupjzq2cmuuwdvjs0qtxmnwjmdepu5979qy4nhqs63zljatt7kkggddxctt74crayt4djvnh3u6tjzm8wyqpc7nf0r0k9mp34x9musgdqegkmscey50ckyehm67c5tcdlawkh6my2v3xzwaug7c4y9xyw0dfkqup24jdckk5wxkyfd8rsp6h220dj786t54fyj59ehtq0gyut6lcattumgdss4kkchrdp7f5sjgcu7ycpzq0d47m6xe3yh2q5q76fa20lm46pe8fcd9yqcrxduhkdqfe4c9pw3pqqqqqqqqqq0qvtsl";

    #[allow(dead_code)]
    #[test]
    fn verifying_key_strings() {
        let bond_public_verifier_string =
            VerifyingKey::from_bytes(&snarkvm_parameters::testnet::BondPublicVerifier::load_bytes().unwrap())
                .unwrap()
                .to_string();
        let claim_unbond_public_verifier_string =
            VerifyingKey::from_bytes(&snarkvm_parameters::testnet::ClaimUnbondPublicVerifier::load_bytes().unwrap())
                .unwrap()
                .to_string();
        let fee_private_verifier_string =
            VerifyingKey::from_bytes(&snarkvm_parameters::testnet::FeePrivateVerifier::load_bytes().unwrap())
                .unwrap()
                .to_string();
        let fee_public_verifier_string =
            VerifyingKey::from_bytes(&snarkvm_parameters::testnet::FeePublicVerifier::load_bytes().unwrap())
                .unwrap()
                .to_string();
        let inclusion_verifier_string =
            VerifyingKey::from_bytes(&snarkvm_parameters::testnet::InclusionVerifier::load_bytes().unwrap())
                .unwrap()
                .to_string();
        let join_verifier_string =
            VerifyingKey::from_bytes(&snarkvm_parameters::testnet::JoinVerifier::load_bytes().unwrap())
                .unwrap()
                .to_string();
        let set_validator_state_verifier_string =
            VerifyingKey::from_bytes(&snarkvm_parameters::testnet::SetValidatorStateVerifier::load_bytes().unwrap())
                .unwrap()
                .to_string();
        let split_verifier_string =
            VerifyingKey::from_bytes(&snarkvm_parameters::testnet::SplitVerifier::load_bytes().unwrap())
                .unwrap()
                .to_string();
        let transfer_private_verifier_string =
            VerifyingKey::from_bytes(&snarkvm_parameters::testnet::TransferPrivateVerifier::load_bytes().unwrap())
                .unwrap()
                .to_string();
        let transfer_private_to_public_verifier_string = VerifyingKey::from_bytes(
            &snarkvm_parameters::testnet::TransferPrivateToPublicVerifier::load_bytes().unwrap(),
        )
        .unwrap()
        .to_string();
        let transfer_public_verifier_string =
            VerifyingKey::from_bytes(&snarkvm_parameters::testnet::TransferPublicVerifier::load_bytes().unwrap())
                .unwrap()
                .to_string();
        let transfer_public_to_private_verifier_string = VerifyingKey::from_bytes(
            &snarkvm_parameters::testnet::TransferPublicToPrivateVerifier::load_bytes().unwrap(),
        )
        .unwrap()
        .to_string();
        let unbond_public_verifier_string =
            VerifyingKey::from_bytes(&snarkvm_parameters::testnet::UnbondPublicVerifier::load_bytes().unwrap())
                .unwrap()
                .to_string();
        println!("bond_public_verifier:\nverifying_key: \"{}\"", bond_public_verifier_string);
        println!("claim_unbond_public_verifier:\nverifying_key: \"{}\"", claim_unbond_public_verifier_string);
        println!("fee_private_verifier:\nverifying_key: \"{}\"", fee_private_verifier_string);
        println!("fee_public_verifier:\nverifying_key: \"{}\"", fee_public_verifier_string);
        println!("inclusion_verifier:\nverifying_key: \"{}\"", inclusion_verifier_string);
        println!("join_verifier:\nverifying_key: \"{}\"", join_verifier_string);
        println!("set_validator_state_verifier:\nverifying_key: \"{}\"", set_validator_state_verifier_string);
        println!("split_verifier:\nverifying_key: \"{}\"", split_verifier_string);
        println!("transfer_private_verifier:\nverifying_key: \"{}\"", transfer_private_verifier_string);
        println!(
            "transfer_private_to_public_verifier:\nverifying_key: \"{}\"",
            transfer_private_to_public_verifier_string
        );
        println!("transfer_public_verifier:\nverifying_key: \"{}\"", transfer_public_verifier_string);
        println!(
            "transfer_public_to_private_verifier:\nverifying_key: \"{}\"",
            transfer_public_to_private_verifier_string
        );
        println!("unbond_public_verifier:\nverifying_key: \"{}\"", unbond_public_verifier_string);
    }

    #[wasm_bindgen_test]
    async fn test_verifying_key_roundtrip() {
        let transfer_public_verifier_bytes = snarkvm_parameters::testnet::TransferPublicVerifier::load_bytes().unwrap();
        let transfer_public_verifier = VerifyingKey::from_bytes(&transfer_public_verifier_bytes).unwrap();
        let transfer_public_verifying_key_string = transfer_public_verifier.to_string();
        assert_eq!(transfer_public_verifying_key_string, TRANSFER_PUBLIC_VERIFYING_KEY);
    }

    #[wasm_bindgen_test]
    async fn test_verifier_checksum() {
        let transfer_public_verifier_bytes = snarkvm_parameters::testnet::TransferPublicVerifier::load_bytes().unwrap();
        let transfer_public_verifier = VerifyingKey::from_bytes(&transfer_public_verifier_bytes).unwrap();
        let transfer_public_verifying_key_checksum = transfer_public_verifier.checksum();
        assert_eq!(
            transfer_public_verifying_key_checksum,
            "1b5109468e7992c39bbbc299dd1f94f18e49928e253e60ed68c7d9f02e73fe8d"
        );
    }
}
