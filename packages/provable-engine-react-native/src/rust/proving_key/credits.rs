use super::*;
use serde_json::Value;

impl ProvingKey {
    fn prover_checksum_from_metadata(function_metadata: &str) -> Option<String> {
        let Ok(metadata): Result<Value, _> = serde_json::from_str(function_metadata) else {
            return None;
        };
        metadata
            .get("prover_checksum")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string())
    }

    fn has_checksum(&self, metadata_json: &str) -> bool {
        match Self::prover_checksum_from_metadata(metadata_json) {
            Some(expected) => self.checksum() == expected,
            None => false,
        }
    }

    // Credits.aleo helpers (runtime metadata-based). Callers pass the appropriate metadata JSON.
    pub fn is_bond_public_prover_with_metadata(&self, metadata_json: &str) -> bool {
        self.has_checksum(metadata_json)
    }
    pub fn is_bond_validator_prover_with_metadata(&self, metadata_json: &str) -> bool {
        self.has_checksum(metadata_json)
    }
    pub fn is_claim_unbond_public_prover_with_metadata(&self, metadata_json: &str) -> bool {
        self.has_checksum(metadata_json)
    }
    pub fn is_fee_private_prover_with_metadata(&self, metadata_json: &str) -> bool {
        self.has_checksum(metadata_json)
    }
    pub fn is_fee_public_prover_with_metadata(&self, metadata_json: &str) -> bool {
        self.has_checksum(metadata_json)
    }
    pub fn is_inclusion_prover_with_metadata(&self, metadata_json: &str) -> bool {
        self.has_checksum(metadata_json)
    }
    pub fn is_join_prover_with_metadata(&self, metadata_json: &str) -> bool {
        self.has_checksum(metadata_json)
    }
    pub fn is_set_validator_state_prover_with_metadata(&self, metadata_json: &str) -> bool {
        self.has_checksum(metadata_json)
    }
    pub fn is_split_prover_with_metadata(&self, metadata_json: &str) -> bool {
        self.has_checksum(metadata_json)
    }
    pub fn is_transfer_private_prover_with_metadata(&self, metadata_json: &str) -> bool {
        self.has_checksum(metadata_json)
    }
    pub fn is_transfer_private_to_public_prover_with_metadata(&self, metadata_json: &str) -> bool {
        self.has_checksum(metadata_json)
    }
    pub fn is_transfer_public_prover_with_metadata(&self, metadata_json: &str) -> bool {
        self.has_checksum(metadata_json)
    }
    pub fn is_transfer_public_as_signer_prover_with_metadata(&self, metadata_json: &str) -> bool {
        self.has_checksum(metadata_json)
    }
    pub fn is_transfer_public_to_private_prover_with_metadata(&self, metadata_json: &str) -> bool {
        self.has_checksum(metadata_json)
    }
    pub fn is_unbond_public_prover_with_metadata(&self, metadata_json: &str) -> bool {
        self.has_checksum(metadata_json)
    }
}
