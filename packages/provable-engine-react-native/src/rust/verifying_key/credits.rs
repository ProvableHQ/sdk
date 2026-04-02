use super::*;

impl VerifyingKey {
    fn get_credits_verifying_key(name: &str) -> VerifyingKey {
        let vk = CurrentNetwork::get_credits_verifying_key(name.to_string()).unwrap().clone();
        let num_variables = vk.circuit_info.num_public_and_private_variables as u64;
        VerifyingKey::from(VerifyingKeyNative::new(vk, num_variables))
    }

    // Static constructors for well-known credits.aleo functions
    pub fn bond_public_verifier() -> VerifyingKey {
        VerifyingKey::get_credits_verifying_key("bond_public")
    }
    pub fn bond_validator_verifier() -> VerifyingKey {
        VerifyingKey::get_credits_verifying_key("bond_validator")
    }
    pub fn claim_unbond_public_verifier() -> VerifyingKey {
        VerifyingKey::get_credits_verifying_key("claim_unbond_public")
    }
    pub fn fee_private_verifier() -> VerifyingKey {
        VerifyingKey::get_credits_verifying_key("fee_private")
    }
    pub fn fee_public_verifier() -> VerifyingKey {
        VerifyingKey::get_credits_verifying_key("fee_public")
    }
    pub fn inclusion_verifier() -> VerifyingKey {
        let vk = CurrentNetwork::inclusion_verifying_key().clone();
        let num_variables = vk.circuit_info.num_public_and_private_variables as u64;
        VerifyingKey::from(VerifyingKeyNative::new(vk, num_variables))
    }
    pub fn join_verifier() -> VerifyingKey {
        VerifyingKey::get_credits_verifying_key("join")
    }
    pub fn set_validator_state_verifier() -> VerifyingKey {
        VerifyingKey::get_credits_verifying_key("set_validator_state")
    }
    pub fn split_verifier() -> VerifyingKey {
        VerifyingKey::get_credits_verifying_key("split")
    }
    pub fn transfer_private_verifier() -> VerifyingKey {
        VerifyingKey::get_credits_verifying_key("transfer_private")
    }
    pub fn transfer_private_to_public_verifier() -> VerifyingKey {
        VerifyingKey::get_credits_verifying_key("transfer_private_to_public")
    }
    pub fn transfer_public_verifier() -> VerifyingKey {
        VerifyingKey::get_credits_verifying_key("transfer_public")
    }
    pub fn transfer_public_as_signer_verifier() -> VerifyingKey {
        VerifyingKey::get_credits_verifying_key("transfer_public_as_signer")
    }
    pub fn transfer_public_to_private_verifier() -> VerifyingKey {
        VerifyingKey::get_credits_verifying_key("transfer_public_to_private")
    }
    pub fn unbond_public_verifier() -> VerifyingKey {
        VerifyingKey::get_credits_verifying_key("unbond_public")
    }

    // Type check helpers
    pub fn is_bond_public_verifier(&self) -> bool {
        self == &Self::bond_public_verifier()
    }
    pub fn is_bond_validator_verifier(&self) -> bool {
        self == &Self::bond_validator_verifier()
    }
    pub fn is_claim_unbond_public_verifier(&self) -> bool {
        self == &Self::claim_unbond_public_verifier()
    }
    pub fn is_fee_private_verifier(&self) -> bool {
        self == &Self::fee_private_verifier()
    }
    pub fn is_fee_public_verifier(&self) -> bool {
        self == &Self::fee_public_verifier()
    }
    pub fn is_inclusion_verifier(&self) -> bool {
        self == &Self::inclusion_verifier()
    }
    pub fn is_join_verifier(&self) -> bool {
        self == &Self::join_verifier()
    }
    pub fn is_set_validator_state_verifier(&self) -> bool {
        self == &Self::set_validator_state_verifier()
    }
    pub fn is_split_verifier(&self) -> bool {
        self == &Self::split_verifier()
    }
    pub fn is_transfer_private_verifier(&self) -> bool {
        self == &Self::transfer_private_verifier()
    }
    pub fn is_transfer_private_to_public_verifier(&self) -> bool {
        self == &Self::transfer_private_to_public_verifier()
    }
    pub fn is_transfer_public_verifier(&self) -> bool {
        self == &Self::transfer_public_verifier()
    }
    pub fn is_transfer_public_as_signer_verifier(&self) -> bool {
        self == &Self::transfer_public_as_signer_verifier()
    }
    pub fn is_transfer_public_to_private_verifier(&self) -> bool {
        self == &Self::transfer_public_to_private_verifier()
    }
    pub fn is_unbond_public_verifier(&self) -> bool {
        self == &Self::unbond_public_verifier()
    }
}


