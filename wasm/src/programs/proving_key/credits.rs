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
impl ProvingKey {
    fn prover_checksum(function_metadata: &'static str) -> String {
        let metadata: serde_json::Value =
            serde_json::from_str(function_metadata).expect("Metadata was not well-formatted");
        metadata["prover_checksum"].as_str().expect("Failed to parse checksum").to_string()
    }

    /// Verify if the proving key is for the bond_public function
    ///
    /// @example
    /// const provingKey = ProvingKey.fromBytes("bond_public_proving_key.bin");
    /// provingKey.isBondPublicProver() ? console.log("Key verified") : throw new Error("Invalid key");
    ///
    /// @returns {boolean} returns true if the proving key is for the bond_public function, false if otherwise
    #[wasm_bindgen(js_name = "isBondPublicProver")]
    pub fn is_bond_public_prover(&self) -> bool {
        self.checksum() == ProvingKey::prover_checksum(crate::types::native::parameters::BondPublicProver::METADATA)
    }

    /// Verify if the proving key is for the bond_validator function
    ///
    /// @example
    /// const provingKey = ProvingKey.fromBytes("bond_validator_proving_key.bin");
    /// provingKey.isBondPublicProver() ? console.log("Key verified") : throw new Error("Invalid key");
    ///
    /// @returns {boolean} returns true if the proving key is for the bond_validator function, false if otherwise
    #[wasm_bindgen(js_name = "isBondValidatorProver")]
    pub fn is_bond_validator_prover(&self) -> bool {
        self.checksum() == ProvingKey::prover_checksum(crate::types::native::parameters::BondValidatorProver::METADATA)
    }

    /// Verify if the proving key is for the claim_unbond function
    ///
    /// @example
    /// const provingKey = ProvingKey.fromBytes("claim_unbond_proving_key.bin");
    /// provingKey.isClaimUnbondProver() ? console.log("Key verified") : throw new Error("Invalid key");
    ///
    /// @returns {boolean} returns true if the proving key is for the claim_unbond function, false if otherwise
    #[wasm_bindgen(js_name = "isClaimUnbondPublicProver")]
    pub fn is_claim_unbond_public_prover(&self) -> bool {
        self.checksum()
            == ProvingKey::prover_checksum(crate::types::native::parameters::ClaimUnbondPublicProver::METADATA)
    }

    /// Verify if the proving key is for the fee_private function
    ///
    /// @example
    /// const provingKey = ProvingKey.fromBytes("fee_private_proving_key.bin");
    /// provingKey.isFeePrivateProver() ? console.log("Key verified") : throw new Error("Invalid key");
    ///
    /// @returns {boolean} returns true if the proving key is for the fee_private function, false if otherwise
    #[wasm_bindgen(js_name = "isFeePrivateProver")]
    pub fn is_fee_private_prover(&self) -> bool {
        self.checksum() == ProvingKey::prover_checksum(crate::types::native::parameters::FeePrivateProver::METADATA)
    }

    /// Verify if the proving key is for the fee_public function
    ///
    /// @example
    /// const provingKey = ProvingKey.fromBytes("fee_public_proving_key.bin");
    /// provingKey.isFeePublicProver() ? console.log("Key verified") : throw new Error("Invalid key");
    ///
    /// @returns {boolean} returns true if the proving key is for the fee_public function, false if otherwise
    #[wasm_bindgen(js_name = "isFeePublicProver")]
    pub fn is_fee_public_prover(&self) -> bool {
        self.checksum() == ProvingKey::prover_checksum(crate::types::native::parameters::FeePublicProver::METADATA)
    }

    /// Verify if the proving key is for the inclusion function
    ///
    /// @example
    /// const provingKey = ProvingKey.fromBytes("inclusion_proving_key.bin");
    /// provingKey.isInclusionProver() ? console.log("Key verified") : throw new Error("Invalid key");
    ///
    /// @returns {boolean} returns true if the proving key is for the inclusion function, false if otherwise
    #[wasm_bindgen(js_name = "isInclusionProver")]
    pub fn is_inclusion_prover(&self) -> bool {
        self.checksum() == ProvingKey::prover_checksum(crate::types::native::parameters::InclusionProver::METADATA)
    }

    /// Verify if the proving key is for the join function
    ///
    /// @example
    /// const provingKey = ProvingKey.fromBytes("join_proving_key.bin");
    /// provingKey.isJoinProver() ? console.log("Key verified") : throw new Error("Invalid key");
    ///
    /// @returns {boolean} returns true if the proving key is for the join function, false if otherwise
    #[wasm_bindgen(js_name = "isJoinProver")]
    pub fn is_join_prover(&self) -> bool {
        self.checksum() == ProvingKey::prover_checksum(crate::types::native::parameters::JoinProver::METADATA)
    }

    /// Verify if the proving key is for the set_validator_state function
    ///
    /// @example
    /// const provingKey = ProvingKey.fromBytes("set_validator_set_proving_key.bin");
    /// provingKey.isSetValidatorStateProver() ? console.log("Key verified") : throw new Error("Invalid key");
    ///
    /// @returns {boolean} returns true if the proving key is for the set_validator_state function, false if otherwise
    #[wasm_bindgen(js_name = "isSetValidatorStateProver")]
    pub fn is_set_validator_state_prover(&self) -> bool {
        self.checksum()
            == ProvingKey::prover_checksum(crate::types::native::parameters::SetValidatorStateProver::METADATA)
    }

    /// Verify if the proving key is for the split function
    ///
    /// @example
    /// const provingKey = ProvingKey.fromBytes("split_proving_key.bin");
    /// provingKey.isSplitProver() ? console.log("Key verified") : throw new Error("Invalid key");
    ///
    /// @returns {boolean} returns true if the proving key is for the split function, false if otherwise
    #[wasm_bindgen(js_name = "isSplitProver")]
    pub fn is_split_prover(&self) -> bool {
        self.checksum() == ProvingKey::prover_checksum(crate::types::native::parameters::SplitProver::METADATA)
    }

    /// Verify if the proving key is for the transfer_private function
    ///
    /// @example
    /// const provingKey = ProvingKey.fromBytes("transfer_private_proving_key.bin");
    /// provingKey.isTransferPrivateProver() ? console.log("Key verified") : throw new Error("Invalid key");
    ///
    /// @returns {boolean} returns true if the proving key is for the transfer_private function, false if otherwise
    #[wasm_bindgen(js_name = "isTransferPrivateProver")]
    pub fn is_transfer_private_prover(&self) -> bool {
        self.checksum()
            == ProvingKey::prover_checksum(crate::types::native::parameters::TransferPrivateProver::METADATA)
    }

    /// Verify if the proving key is for the transfer_private_to_public function
    ///
    /// @example
    /// const provingKey = ProvingKey.fromBytes("transfer_private_to_public_proving_key.bin");
    /// provingKey.isTransferPrivateToPublicProver() ? console.log("Key verified") : throw new Error("Invalid key");
    ///
    /// @returns {boolean} returns true if the proving key is for the transfer_private_to_public function, false if otherwise
    #[wasm_bindgen(js_name = "isTransferPrivateToPublicProver")]
    pub fn is_transfer_private_to_public_prover(&self) -> bool {
        self.checksum()
            == ProvingKey::prover_checksum(crate::types::native::parameters::TransferPrivateToPublicProver::METADATA)
    }

    /// Verify if the proving key is for the transfer_public function
    ///
    /// @example
    /// const provingKey = ProvingKey.fromBytes("transfer_public_proving_key.bin");
    /// provingKey.isTransferPublicProver() ? console.log("Key verified") : throw new Error("Invalid key");
    ///
    /// @returns {boolean} returns true if the proving key is for the transfer_public function, false if otherwise
    #[wasm_bindgen(js_name = "isTransferPublicProver")]
    pub fn is_transfer_public_prover(&self) -> bool {
        self.checksum() == ProvingKey::prover_checksum(crate::types::native::parameters::TransferPublicProver::METADATA)
    }

    /// Verify if the proving key is for the transfer_public_as_signer function
    ///
    /// @example
    /// const provingKey = ProvingKey.fromBytes("transfer_public_as_signer_proving_key.bin");
    /// provingKey.isTransferPublicAsSignerProver() ? console.log("Key verified") : throw new Error("Invalid key");
    ///
    /// @returns {boolean} returns true if the proving key is for the transfer_public function, false if otherwise
    #[wasm_bindgen(js_name = "isTransferPublicAsSignerProver")]
    pub fn is_transfer_public_as_signer_prover(&self) -> bool {
        self.checksum()
            == ProvingKey::prover_checksum(crate::types::native::parameters::TransferPublicAsSignerProver::METADATA)
    }

    /// Verify if the proving key is for the transfer_public_to_private function
    ///
    /// @example
    /// const provingKey = ProvingKey.fromBytes("transfer_public_to_private_proving_key.bin");
    /// provingKey.isTransferPublicToPrivateProver() ? console.log("Key verified") : throw new Error("Invalid key");
    ///
    /// @returns {boolean} returns true if the proving key is for the transfer_public_to_private function, false if otherwise
    #[wasm_bindgen(js_name = "isTransferPublicToPrivateProver")]
    pub fn is_transfer_public_to_private_prover(&self) -> bool {
        self.checksum()
            == ProvingKey::prover_checksum(crate::types::native::parameters::TransferPublicToPrivateProver::METADATA)
    }

    /// Verify if the proving key is for the unbond_public function
    ///
    /// @example
    /// const provingKey = ProvingKey.fromBytes("unbond_public.bin");
    /// provingKey.isUnbondPublicProver() ? console.log("Key verified") : throw new Error("Invalid key");
    ///
    /// @returns {boolean} returns true if the proving key is for the unbond_public_prover function, false if otherwise
    #[wasm_bindgen(js_name = "isUnbondPublicProver")]
    pub fn is_unbond_public_prover(&self) -> bool {
        self.checksum() == ProvingKey::prover_checksum(crate::types::native::parameters::UnbondPublicProver::METADATA)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::Metadata;
    use wasm_bindgen_test::*;

    // This is needed to fix throttling issues with AWS
    async fn sleep(time: u32) {
        gloo_timers::future::TimeoutFuture::new(time).await;
    }

    #[wasm_bindgen_test]
    async fn test_proving_key_checksum() {
        const DELAY: u32 = 100;

        let prover_uri = Metadata::bond_public().prover;
        let proving_key_bytes = reqwest::get(prover_uri).await.unwrap().bytes().await.unwrap().to_vec();
        let prover = ProvingKey::from_bytes(&proving_key_bytes).unwrap();
        assert!(prover.is_bond_public_prover());
        assert!(!prover.is_claim_unbond_public_prover());

        sleep(DELAY).await;

        let prover_uri = Metadata::claim_unbond_public().prover;
        let proving_key_bytes = reqwest::get(prover_uri).await.unwrap().bytes().await.unwrap().to_vec();
        let prover = ProvingKey::from_bytes(&proving_key_bytes).unwrap();
        assert!(prover.is_claim_unbond_public_prover());
        assert!(!prover.is_fee_private_prover());

        sleep(DELAY).await;

        let prover_uri = Metadata::fee_private().prover;
        let proving_key_bytes = reqwest::get(prover_uri).await.unwrap().bytes().await.unwrap().to_vec();
        let prover = ProvingKey::from_bytes(&proving_key_bytes).unwrap();
        assert!(prover.is_fee_private_prover());
        assert!(!prover.is_fee_public_prover());

        sleep(DELAY).await;

        let prover_uri = Metadata::fee_public().prover;
        let proving_key_bytes = reqwest::get(prover_uri).await.unwrap().bytes().await.unwrap().to_vec();
        let prover = ProvingKey::from_bytes(&proving_key_bytes).unwrap();
        assert!(prover.is_fee_public_prover());
        assert!(!prover.is_join_prover());

        sleep(DELAY).await;

        let prover_uri = Metadata::join().prover;
        let proving_key_bytes = reqwest::get(prover_uri).await.unwrap().bytes().await.unwrap().to_vec();
        let prover = ProvingKey::from_bytes(&proving_key_bytes).unwrap();
        assert!(prover.is_join_prover());
        assert!(!prover.is_set_validator_state_prover());

        sleep(DELAY).await;

        let prover_uri = Metadata::set_validator_state().prover;
        let proving_key_bytes = reqwest::get(prover_uri).await.unwrap().bytes().await.unwrap().to_vec();
        let prover = ProvingKey::from_bytes(&proving_key_bytes).unwrap();
        assert!(prover.is_set_validator_state_prover());
        assert!(!prover.is_split_prover());
        sleep(DELAY).await;

        let prover_uri = Metadata::split().prover;
        let proving_key_bytes = reqwest::get(prover_uri).await.unwrap().bytes().await.unwrap().to_vec();
        let prover = ProvingKey::from_bytes(&proving_key_bytes).unwrap();
        assert!(prover.is_split_prover());
        assert!(!prover.is_transfer_private_prover());
        sleep(DELAY).await;

        let prover_uri = Metadata::transfer_private().prover;
        let proving_key_bytes = reqwest::get(prover_uri).await.unwrap().bytes().await.unwrap().to_vec();
        let prover = ProvingKey::from_bytes(&proving_key_bytes).unwrap();
        assert!(prover.is_transfer_private_prover());
        assert!(!prover.is_transfer_private_to_public_prover());

        sleep(DELAY).await;

        let prover_uri = Metadata::transfer_private_to_public().prover;
        let proving_key_bytes = reqwest::get(prover_uri).await.unwrap().bytes().await.unwrap().to_vec();
        let prover = ProvingKey::from_bytes(&proving_key_bytes).unwrap();
        assert!(prover.is_transfer_private_to_public_prover());
        assert!(!prover.is_transfer_public_prover());

        sleep(DELAY).await;

        let prover_uri = Metadata::transfer_public().prover;
        let proving_key_bytes = reqwest::get(prover_uri).await.unwrap().bytes().await.unwrap().to_vec();
        let prover = ProvingKey::from_bytes(&proving_key_bytes).unwrap();
        assert!(prover.is_transfer_public_prover());
        assert!(!prover.is_transfer_public_to_private_prover());

        sleep(DELAY).await;

        let prover_uri = Metadata::transfer_public_to_private().prover;
        let proving_key_bytes = reqwest::get(prover_uri).await.unwrap().bytes().await.unwrap().to_vec();
        let prover = ProvingKey::from_bytes(&proving_key_bytes).unwrap();
        assert!(prover.is_transfer_public_to_private_prover());
        sleep(DELAY).await;

        let prover_uri = Metadata::unbond_public().prover;
        let proving_key_bytes = reqwest::get(prover_uri).await.unwrap().bytes().await.unwrap().to_vec();
        let prover = ProvingKey::from_bytes(&proving_key_bytes).unwrap();
        assert!(prover.is_unbond_public_prover());
        assert!(!prover.is_bond_public_prover());
    }
}
