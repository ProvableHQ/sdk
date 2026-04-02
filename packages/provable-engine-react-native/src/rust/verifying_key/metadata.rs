#[derive(Clone, Debug)]
pub struct Metadata {
    pub name: String,
    pub locator: String,
    pub prover: String,
    pub verifier: String,
    pub verifying_key: String,
}

impl Metadata {
    pub(crate) fn into_ffi(self) -> crate::ffi::MetadataFFI {
        crate::ffi::MetadataFFI {
            name: self.name,
            locator: self.locator,
            prover: self.prover,
            verifier: self.verifier,
            verifying_key: self.verifying_key,
        }
    }
    fn url(function_name: &str, kind: &str, metadata_json: &str) -> Option<String> {
        if metadata_json.is_empty() {
            return None;
        }
        let parsed: serde_json::Value = serde_json::from_str(metadata_json).ok()?;
        // Prefer prover_checksum to match WASM behavior; fall back to generic checksum/verifier_checksum if present
        let checksum = parsed
            .get("prover_checksum")
            .and_then(|v| v.as_str())
            .or_else(|| parsed.get("checksum").and_then(|v| v.as_str()))
            .or_else(|| parsed.get("verifier_checksum").and_then(|v| v.as_str()))?
            .to_string();
        let short = checksum.get(0..7).unwrap_or_default();
        Some(format!("{}.{}.{}", function_name, kind, short))
    }

    // Note: `prover_meta` and `verifier_meta` are JSON strings (metadata blobs)
    fn new(name: &str, verifying_key: &str, locator: &str, prover_meta: &str, verifier_meta: &str) -> Self {
        let prover_path = Self::url(name, "prover", prover_meta);
        let verifier_path = Self::url(name, "verifier", verifier_meta);
        // Return path-only (without BASE_URL) so TypeScript can construct URL with current network
        let prover = prover_path.unwrap_or_else(String::new);
        // If no metadata provided, keep verifier as-is (back-compat with existing TS usage)
        let verifier = verifier_path.unwrap_or_else(|| name.to_string());

        Self {
            name: name.to_string(),
            locator: locator.to_string(),
            prover,
            verifier,
            verifying_key: verifying_key.to_string(),
        }
    }
}

impl Metadata {
    pub fn bond_public(network: &str) -> Result<Metadata, String> {
        let (prover_meta, verifier_meta) = crate::types::native::parameters_runtime::get_bond_public_metadata(network)?;
        Ok(Metadata::new(
            "bond_public",
            "bondPublicVerifier",
            "credits.aleo/bond_public",
            prover_meta,
            verifier_meta,
        ))
    }
    pub fn bond_validator(network: &str) -> Result<Metadata, String> {
        let (prover_meta, verifier_meta) = crate::types::native::parameters_runtime::get_bond_validator_metadata(network)?;
        Ok(Metadata::new(
            "bond_validator",
            "bondValidatorVerifier",
            "credits.aleo/bond_validator",
            prover_meta,
            verifier_meta,
        ))
    }
    pub fn claim_unbond_public(network: &str) -> Result<Metadata, String> {
        let (prover_meta, verifier_meta) = crate::types::native::parameters_runtime::get_claim_unbond_public_metadata(network)?;
        Ok(Metadata::new(
            "claim_unbond_public",
            "claimUnbondPublicVerifier",
            "credits.aleo/claim_unbond_public",
            prover_meta,
            verifier_meta,
        ))
    }
    pub fn fee_private(network: &str) -> Result<Metadata, String> {
        let (prover_meta, verifier_meta) = crate::types::native::parameters_runtime::get_fee_private_metadata(network)?;
        Ok(Metadata::new(
            "fee_private",
            "feePrivateVerifier",
            "credits.aleo/fee_private",
            prover_meta,
            verifier_meta,
        ))
    }
    pub fn fee_public(network: &str) -> Result<Metadata, String> {
        let (prover_meta, verifier_meta) = crate::types::native::parameters_runtime::get_fee_public_metadata(network)?;
        Ok(Metadata::new(
            "fee_public",
            "feePublicVerifier",
            "credits.aleo/fee_public",
            prover_meta,
            verifier_meta,
        ))
    }
    pub fn inclusion(network: &str) -> Result<Metadata, String> {
        let (prover_meta, verifier_meta) = crate::types::native::parameters_runtime::get_inclusion_metadata(network)?;
        Ok(Metadata::new(
            "inclusion",
            "inclusionVerifier",
            "inclusion",
            prover_meta,
            verifier_meta,
        ))
    }
    pub fn join(network: &str) -> Result<Metadata, String> {
        let (prover_meta, verifier_meta) = crate::types::native::parameters_runtime::get_join_metadata(network)?;
        Ok(Metadata::new(
            "join",
            "joinVerifier",
            "credits.aleo/join",
            prover_meta,
            verifier_meta,
        ))
    }
    pub fn set_validator_state(network: &str) -> Result<Metadata, String> {
        let (prover_meta, verifier_meta) = crate::types::native::parameters_runtime::get_set_validator_state_metadata(network)?;
        Ok(Metadata::new(
            "set_validator_state",
            "setValidatorStateVerifier",
            "credits.aleo/set_validator_state",
            prover_meta,
            verifier_meta,
        ))
    }
    pub fn split(network: &str) -> Result<Metadata, String> {
        let (prover_meta, verifier_meta) = crate::types::native::parameters_runtime::get_split_metadata(network)?;
        Ok(Metadata::new(
            "split",
            "splitVerifier",
            "credits.aleo/split",
            prover_meta,
            verifier_meta,
        ))
    }
    pub fn transfer_private(network: &str) -> Result<Metadata, String> {
        let (prover_meta, verifier_meta) = crate::types::native::parameters_runtime::get_transfer_private_metadata(network)?;
        Ok(Metadata::new(
            "transfer_private",
            "transferPrivateVerifier",
            "credits.aleo/transfer_private",
            prover_meta,
            verifier_meta,
        ))
    }
    pub fn transfer_private_to_public(network: &str) -> Result<Metadata, String> {
        let (prover_meta, verifier_meta) = crate::types::native::parameters_runtime::get_transfer_private_to_public_metadata(network)?;
        Ok(Metadata::new(
            "transfer_private_to_public",
            "transferPrivateToPublicVerifier",
            "credits.aleo/transfer_private_to_public",
            prover_meta,
            verifier_meta,
        ))
    }
    pub fn transfer_public(network: &str) -> Result<Metadata, String> {
        let (prover_meta, verifier_meta) = crate::types::native::parameters_runtime::get_transfer_public_metadata(network)?;
        Ok(Metadata::new(
            "transfer_public",
            "transferPublicVerifier",
            "credits.aleo/transfer_public",
            prover_meta,
            verifier_meta,
        ))
    }
    pub fn transfer_public_as_signer(network: &str) -> Result<Metadata, String> {
        let (prover_meta, verifier_meta) = crate::types::native::parameters_runtime::get_transfer_public_as_signer_metadata(network)?;
        Ok(Metadata::new(
            "transfer_public_as_signer",
            "transferPublicAsSignerVerifier",
            "credits.aleo/transfer_public_as_signer",
            prover_meta,
            verifier_meta,
        ))
    }
    pub fn transfer_public_to_private(network: &str) -> Result<Metadata, String> {
        let (prover_meta, verifier_meta) = crate::types::native::parameters_runtime::get_transfer_public_to_private_metadata(network)?;
        Ok(Metadata::new(
            "transfer_public_to_private",
            "transferPublicToPrivateVerifier",
            "credits.aleo/transfer_public_to_private",
            prover_meta,
            verifier_meta,
        ))
    }
    pub fn unbond_public(network: &str) -> Result<Metadata, String> {
        let (prover_meta, verifier_meta) = crate::types::native::parameters_runtime::get_unbond_public_metadata(network)?;
        Ok(Metadata::new(
            "unbond_public",
            "unbondPublicVerifier",
            "credits.aleo/unbond_public",
            prover_meta,
            verifier_meta,
        ))
    }
}


