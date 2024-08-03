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
impl VerifyingKey {
    fn get_credits_verifying_key(name: &str) -> VerifyingKey {
        let vk = CurrentNetwork::get_credits_verifying_key(name.to_string()).unwrap().clone();
        let num_variables = vk.circuit_info.num_public_and_private_variables as u64;
        VerifyingKey::from(VerifyingKeyNative::new(vk, num_variables))
    }

    /// Returns the verifying key for the bond_public function
    ///
    /// @returns {VerifyingKey} Verifying key for the bond_public function
    #[wasm_bindgen(js_name = "bondPublicVerifier")]
    pub fn bond_public_verifier() -> VerifyingKey {
        VerifyingKey::get_credits_verifying_key("bond_public")
    }

    /// Returns the verifying key for the bond_validator function
    ///
    /// @returns {VerifyingKey} Verifying key for the bond_validator function
    #[wasm_bindgen(js_name = "bondValidatorVerifier")]
    pub fn bond_validator_verifier() -> VerifyingKey {
        VerifyingKey::get_credits_verifying_key("bond_validator")
    }

    /// Returns the verifying key for the claim_delegator function
    ///
    /// @returns {VerifyingKey} Verifying key for the claim_unbond_public function
    #[wasm_bindgen(js_name = "claimUnbondPublicVerifier")]
    pub fn claim_unbond_public_verifier() -> VerifyingKey {
        VerifyingKey::get_credits_verifying_key("claim_unbond_public")
    }

    /// Returns the verifying key for the fee_private function
    ///
    /// @returns {VerifyingKey} Verifying key for the fee_private function
    #[wasm_bindgen(js_name = "feePrivateVerifier")]
    pub fn fee_private_verifier() -> VerifyingKey {
        VerifyingKey::get_credits_verifying_key("fee_private")
    }

    /// Returns the verifying key for the fee_public function
    ///
    /// @returns {VerifyingKey} Verifying key for the fee_public function
    #[wasm_bindgen(js_name = "feePublicVerifier")]
    pub fn fee_public_verifier() -> VerifyingKey {
        VerifyingKey::get_credits_verifying_key("fee_public")
    }

    /// Returns the verifying key for the inclusion function
    ///
    /// @returns {VerifyingKey} Verifying key for the inclusion function
    #[wasm_bindgen(js_name = "inclusionVerifier")]
    pub fn inclusion_verifier() -> VerifyingKey {
        let vk = CurrentNetwork::inclusion_verifying_key().clone();
        let num_variables = vk.circuit_info.num_public_and_private_variables as u64;
        VerifyingKey::from(VerifyingKeyNative::new(vk, num_variables))
    }

    /// Returns the verifying key for the join function
    ///
    /// @returns {VerifyingKey} Verifying key for the join function
    #[wasm_bindgen(js_name = "joinVerifier")]
    pub fn join_verifier() -> VerifyingKey {
        VerifyingKey::get_credits_verifying_key("join")
    }

    /// Returns the verifying key for the set_validator_state function
    ///
    /// @returns {VerifyingKey} Verifying key for the set_validator_state function
    #[wasm_bindgen(js_name = "setValidatorStateVerifier")]
    pub fn set_validator_state_verifier() -> VerifyingKey {
        VerifyingKey::get_credits_verifying_key("set_validator_state")
    }

    /// Returns the verifying key for the split function
    ///
    /// @returns {VerifyingKey} Verifying key for the split function
    #[wasm_bindgen(js_name = "splitVerifier")]
    pub fn split_verifier() -> VerifyingKey {
        VerifyingKey::get_credits_verifying_key("split")
    }

    /// Returns the verifying key for the transfer_private function
    ///
    /// @returns {VerifyingKey} Verifying key for the transfer_private function
    #[wasm_bindgen(js_name = "transferPrivateVerifier")]
    pub fn transfer_private_verifier() -> VerifyingKey {
        VerifyingKey::get_credits_verifying_key("transfer_private")
    }

    /// Returns the verifying key for the transfer_private_to_public function
    ///
    /// @returns {VerifyingKey} Verifying key for the transfer_private_to_public function
    #[wasm_bindgen(js_name = "transferPrivateToPublicVerifier")]
    pub fn transfer_private_to_public_verifier() -> VerifyingKey {
        VerifyingKey::get_credits_verifying_key("transfer_private_to_public")
    }

    /// Returns the verifying key for the transfer_public function
    ///
    /// @returns {VerifyingKey} Verifying key for the transfer_public function
    #[wasm_bindgen(js_name = "transferPublicVerifier")]
    pub fn transfer_public_verifier() -> VerifyingKey {
        VerifyingKey::get_credits_verifying_key("transfer_public")
    }

    /// Returns the verifying key for the transfer_public_as_signer function
    ///
    /// @returns {VerifyingKey} Verifying key for the transfer_public_as_signer function
    #[wasm_bindgen(js_name = "transferPublicAsSignerVerifier")]
    pub fn transfer_public_as_signer_verifier() -> VerifyingKey {
        VerifyingKey::get_credits_verifying_key("transfer_public_as_signer")
    }

    /// Returns the verifying key for the transfer_public_to_private function
    ///
    /// @returns {VerifyingKey} Verifying key for the transfer_public_to_private function
    #[wasm_bindgen(js_name = "transferPublicToPrivateVerifier")]
    pub fn transfer_public_to_private_verifier() -> VerifyingKey {
        VerifyingKey::get_credits_verifying_key("transfer_public_to_private")
    }

    /// Returns the verifying key for the unbond_public function
    ///
    /// @returns {VerifyingKey} Verifying key for the unbond_public function
    #[wasm_bindgen(js_name = "unbondPublicVerifier")]
    pub fn unbond_public_verifier() -> VerifyingKey {
        VerifyingKey::get_credits_verifying_key("unbond_public")
    }

    /// Returns the verifying key for the bond_public function
    ///
    /// @returns {VerifyingKey} Verifying key for the bond_public function
    #[wasm_bindgen(js_name = "isBondPublicVerifier")]
    pub fn is_bond_public_verifier(&self) -> bool {
        self == &Self::bond_public_verifier()
    }

    /// Returns the verifying key for the bond_validator function
    ///
    /// @returns {VerifyingKey} Verifying key for the bond_validator function
    #[wasm_bindgen(js_name = "isBondValidatorVerifier")]
    pub fn is_bond_validator_verifier(&self) -> bool {
        self == &Self::bond_validator_verifier()
    }

    /// Verifies the verifying key is for the claim_delegator function
    ///
    /// @returns {bool}
    #[wasm_bindgen(js_name = "isClaimUnbondPublicVerifier")]
    pub fn is_claim_unbond_public_verifier(&self) -> bool {
        self == &Self::claim_unbond_public_verifier()
    }

    /// Verifies the verifying key is for the fee_private function
    ///
    /// @returns {bool}
    #[wasm_bindgen(js_name = "isFeePrivateVerifier")]
    pub fn is_fee_private_verifier(&self) -> bool {
        self == &Self::fee_private_verifier()
    }

    /// Verifies the verifying key is for the fee_public function
    ///
    /// @returns {bool}
    #[wasm_bindgen(js_name = "isFeePublicVerifier")]
    pub fn is_fee_public_verifier(&self) -> bool {
        self == &Self::fee_public_verifier()
    }

    /// Verifies the verifying key is for the inclusion function
    ///
    /// @returns {bool}
    #[wasm_bindgen(js_name = "isInclusionVerifier")]
    pub fn is_inclusion_verifier(&self) -> bool {
        self == &Self::inclusion_verifier()
    }

    /// Verifies the verifying key is for the join function
    ///
    /// @returns {bool}
    #[wasm_bindgen(js_name = "isJoinVerifier")]
    pub fn is_join_verifier(&self) -> bool {
        self == &Self::join_verifier()
    }

    /// Verifies the verifying key is for the set_validator_state function
    ///
    /// @returns {bool}
    #[wasm_bindgen(js_name = "isSetValidatorStateVerifier")]
    pub fn is_set_validator_state_verifier(&self) -> bool {
        self == &Self::set_validator_state_verifier()
    }

    /// Verifies the verifying key is for the split function
    ///
    /// @returns {bool}
    #[wasm_bindgen(js_name = "isSplitVerifier")]
    pub fn is_split_verifier(&self) -> bool {
        self == &Self::split_verifier()
    }

    /// Verifies the verifying key is for the transfer_private function
    ///
    /// @returns {bool}
    #[wasm_bindgen(js_name = "isTransferPrivateVerifier")]
    pub fn is_transfer_private_verifier(&self) -> bool {
        self == &Self::transfer_private_verifier()
    }

    /// Verifies the verifying key is for the transfer_private_to_public function
    ///
    /// @returns {bool}
    #[wasm_bindgen(js_name = "isTransferPrivateToPublicVerifier")]
    pub fn is_transfer_private_to_public_verifier(&self) -> bool {
        self == &Self::transfer_private_to_public_verifier()
    }

    /// Verifies the verifying key is for the transfer_public function
    ///
    /// @returns {bool}
    #[wasm_bindgen(js_name = "isTransferPublicVerifier")]
    pub fn is_transfer_public_verifier(&self) -> bool {
        self == &Self::transfer_public_verifier()
    }

    /// Verifies the verifying key is for the transfer_public_as_signer function
    ///
    /// @returns {bool}
    #[wasm_bindgen(js_name = "isTransferPublicAsSignerVerifier")]
    pub fn is_transfer_public_as_signer_verifier(&self) -> bool {
        self == &Self::transfer_public_as_signer_verifier()
    }

    /// Verifies the verifying key is for the transfer_public_to_private function
    ///
    /// @returns {bool}
    #[wasm_bindgen(js_name = "isTransferPublicToPrivateVerifier")]
    pub fn is_transfer_public_to_private_verifier(&self) -> bool {
        self == &Self::transfer_public_to_private_verifier()
    }

    /// Verifies the verifying key is for the unbond_public function
    ///
    /// @returns {bool}
    #[wasm_bindgen(js_name = "isUnbondPublicVerifier")]
    pub fn is_unbond_public_verifier(&self) -> bool {
        self == &Self::unbond_public_verifier()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use wasm_bindgen_test::*;

    #[wasm_bindgen_test]
    fn test_key_loading() {
        let bond_public = VerifyingKey::bond_public_verifier();
        assert!(bond_public.is_bond_public_verifier());
        let bond_validator = VerifyingKey::bond_validator_verifier();
        assert!(bond_validator.is_bond_validator_verifier());
        let claim_unbond_public = VerifyingKey::claim_unbond_public_verifier();
        assert!(claim_unbond_public.is_claim_unbond_public_verifier());
        let fee_private = VerifyingKey::fee_private_verifier();
        assert!(fee_private.is_fee_private_verifier());
        let fee_public = VerifyingKey::fee_public_verifier();
        assert!(fee_public.is_fee_public_verifier());
        let inclusion = VerifyingKey::inclusion_verifier();
        assert!(inclusion.is_inclusion_verifier());
        let join = VerifyingKey::join_verifier();
        assert!(join.is_join_verifier());
        let set_validator_state = VerifyingKey::set_validator_state_verifier();
        assert!(set_validator_state.is_set_validator_state_verifier());
        let split = VerifyingKey::split_verifier();
        assert!(split.is_split_verifier());
        let transfer_private = VerifyingKey::transfer_private_verifier();
        assert!(transfer_private.is_transfer_private_verifier());
        let transfer_private_to_public = VerifyingKey::transfer_private_to_public_verifier();
        assert!(transfer_private_to_public.is_transfer_private_to_public_verifier());
        let transfer_public = VerifyingKey::transfer_public_verifier();
        assert!(transfer_public.is_transfer_public_verifier());
        let transfer_public_as_signer = VerifyingKey::transfer_public_as_signer_verifier();
        assert!(transfer_public_as_signer.is_transfer_public_as_signer_verifier());
        let transfer_public_to_private = VerifyingKey::transfer_public_to_private_verifier();
        assert!(transfer_public_to_private.is_transfer_public_to_private_verifier());
        let unbond_public = VerifyingKey::unbond_public_verifier();
        assert!(unbond_public.is_unbond_public_verifier());
    }
}
