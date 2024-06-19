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

use super::*;

#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct Metadata {
    #[wasm_bindgen(getter_with_clone)]
    pub locator: String,

    #[wasm_bindgen(getter_with_clone)]
    pub prover: String,

    #[wasm_bindgen(getter_with_clone)]
    pub verifier: String,

    #[wasm_bindgen(getter_with_clone, js_name = verifyingKey)]
    pub verifying_key: VerifyingKey,
}

impl Metadata {
    const BASE_URL: &'static str = "https://s3-us-west-1.amazonaws.com/testnet.parameters/";

    fn new(
        name: &str,
        locator: &str,
        prover: &'static str,
        verifier: &'static str,
        verifying_key: VerifyingKey,
    ) -> Self {
        fn url(function_name: &str, kind: &str, proving_key_metadata: &'static str) -> String {
            let metadata: serde_json::Value =
                serde_json::from_str(proving_key_metadata).expect("Metadata was not well-formatted");
            let checksum = metadata["prover_checksum"].as_str().expect("Failed to parse checksum").to_string();
            format!("{}.{}.{}", function_name, kind, checksum.get(0..7).unwrap())
        }

        Self {
            locator: locator.to_string(),
            prover: format!("{}{}", Self::BASE_URL, url(name, "prover", prover)),
            verifier: url(name, "verifier", verifier),
            verifying_key,
        }
    }
}

#[wasm_bindgen]
impl Metadata {
    #[wasm_bindgen(js_name = baseUrl)]
    pub fn base_url() -> String {
        Self::BASE_URL.to_string()
    }

    #[wasm_bindgen]
    pub fn bond_public() -> Metadata {
        Metadata::new(
            "bond_public",
            "credits.aleo/bond_public",
            snarkvm_parameters::testnet::BondPublicProver::METADATA,
            snarkvm_parameters::testnet::BondPublicVerifier::METADATA,
            VerifyingKey::bond_public_verifier(),
        )
    }

    #[wasm_bindgen]
    pub fn claim_unbond_public() -> Metadata {
        Metadata::new(
            "claim_unbond_public",
            "credits.aleo/claim_unbond_public",
            snarkvm_parameters::testnet::ClaimUnbondPublicProver::METADATA,
            snarkvm_parameters::testnet::ClaimUnbondPublicVerifier::METADATA,
            VerifyingKey::claim_unbond_public_verifier(),
        )
    }

    #[wasm_bindgen]
    pub fn fee_private() -> Metadata {
        Metadata::new(
            "fee_private",
            "credits.aleo/fee_private",
            snarkvm_parameters::testnet::FeePrivateProver::METADATA,
            snarkvm_parameters::testnet::FeePrivateVerifier::METADATA,
            VerifyingKey::fee_private_verifier(),
        )
    }

    #[wasm_bindgen]
    pub fn fee_public() -> Metadata {
        Metadata::new(
            "fee_public",
            "credits.aleo/fee_public",
            snarkvm_parameters::testnet::FeePublicProver::METADATA,
            snarkvm_parameters::testnet::FeePublicVerifier::METADATA,
            VerifyingKey::fee_public_verifier(),
        )
    }

    #[wasm_bindgen]
    pub fn inclusion() -> Metadata {
        Metadata::new(
            "inclusion",
            "inclusion",
            snarkvm_parameters::testnet::InclusionProver::METADATA,
            snarkvm_parameters::testnet::InclusionVerifier::METADATA,
            VerifyingKey::inclusion_verifier(),
        )
    }

    #[wasm_bindgen]
    pub fn join() -> Metadata {
        Metadata::new(
            "join",
            "credits.aleo/join",
            snarkvm_parameters::testnet::JoinProver::METADATA,
            snarkvm_parameters::testnet::JoinVerifier::METADATA,
            VerifyingKey::join_verifier(),
        )
    }

    #[wasm_bindgen]
    pub fn set_validator_state() -> Metadata {
        Metadata::new(
            "set_validator_state",
            "credits.aleo/set_validator_state",
            snarkvm_parameters::testnet::SetValidatorStateProver::METADATA,
            snarkvm_parameters::testnet::SetValidatorStateVerifier::METADATA,
            VerifyingKey::set_validator_state_verifier(),
        )
    }

    #[wasm_bindgen]
    pub fn split() -> Metadata {
        Metadata::new(
            "split",
            "credits.aleo/split",
            snarkvm_parameters::testnet::SplitProver::METADATA,
            snarkvm_parameters::testnet::SplitVerifier::METADATA,
            VerifyingKey::split_verifier(),
        )
    }

    #[wasm_bindgen]
    pub fn transfer_private() -> Metadata {
        Metadata::new(
            "transfer_private",
            "credits.aleo/transfer_private",
            snarkvm_parameters::testnet::TransferPrivateProver::METADATA,
            snarkvm_parameters::testnet::TransferPrivateVerifier::METADATA,
            VerifyingKey::transfer_private_verifier(),
        )
    }

    #[wasm_bindgen]
    pub fn transfer_private_to_public() -> Metadata {
        Metadata::new(
            "transfer_private_to_public",
            "credits.aleo/transfer_private_to_public",
            snarkvm_parameters::testnet::TransferPrivateToPublicProver::METADATA,
            snarkvm_parameters::testnet::TransferPrivateToPublicVerifier::METADATA,
            VerifyingKey::transfer_private_to_public_verifier(),
        )
    }

    #[wasm_bindgen]
    pub fn transfer_public() -> Metadata {
        Metadata::new(
            "transfer_public",
            "credits.aleo/transfer_public",
            snarkvm_parameters::testnet::TransferPublicProver::METADATA,
            snarkvm_parameters::testnet::TransferPublicVerifier::METADATA,
            VerifyingKey::transfer_public_verifier(),
        )
    }

    #[wasm_bindgen]
    pub fn transfer_public_to_private() -> Metadata {
        Metadata::new(
            "transfer_public_to_private",
            "credits.aleo/transfer_public_to_private",
            snarkvm_parameters::testnet::TransferPublicToPrivateProver::METADATA,
            snarkvm_parameters::testnet::TransferPublicToPrivateVerifier::METADATA,
            VerifyingKey::transfer_public_to_private_verifier(),
        )
    }

    #[wasm_bindgen]
    pub fn unbond_delegator_as_validator() -> Metadata {
        Metadata::new(
            "unbond_delegator_as_validator",
            "credits.aleo/unbond_delegator_as_validator",
            snarkvm_parameters::testnet::UnbondDelegatorAsValidatorProver::METADATA,
            snarkvm_parameters::testnet::UnbondDelegatorAsValidatorVerifier::METADATA,
            VerifyingKey::unbond_delegator_as_validator_verifier(),
        )
    }

    #[wasm_bindgen]
    pub fn unbond_public() -> Metadata {
        Metadata::new(
            "unbond_public",
            "credits.aleo/unbond_public",
            snarkvm_parameters::testnet::UnbondPublicProver::METADATA,
            snarkvm_parameters::testnet::UnbondPublicVerifier::METADATA,
            VerifyingKey::unbond_public_verifier(),
        )
    }
}
