use crate::types::CurrentNetwork;
use snarkvm_console::program::{Field as FieldElement, StatePath};
use snarkvm_synthesizer::prelude::{ProvingKey as ProvingKeyVm, VerifyingKey as VerifyingKeyVm};

// Canonical aliases used by temp_rust modules
pub type FieldNative = FieldElement<CurrentNetwork>;
pub type StatePathNative = StatePath<CurrentNetwork>;
pub type ProvingKeyNative = ProvingKeyVm<CurrentNetwork>;
pub type VerifyingKeyNative = VerifyingKeyVm<CurrentNetwork>;

// Re-export for convenience
pub use FieldNative as Field;
pub use StatePathNative as StatePathAlias;
pub use ProvingKeyNative as ProvingKey;
pub use VerifyingKeyNative as VerifyingKey;

// Re-export snarkvm parameters for current network (kept for backward compatibility)
#[cfg(feature = "mainnet")]
pub use snarkvm_parameters::mainnet as parameters;
#[cfg(feature = "testnet")]
pub use snarkvm_parameters::testnet as parameters;

// Runtime parameter access helpers
// These functions allow accessing metadata from either network at runtime
// Note: We access both parameter modules directly from snarkvm-parameters,
// which always includes both mainnet and testnet modules regardless of our feature flags
pub mod parameters_runtime {
    // Import both parameter modules directly - they're always available in snarkvm-parameters
    // Our feature flags only control which one we re-export as `parameters`, but both are accessible
    use snarkvm_parameters::mainnet as mainnet_params;
    use snarkvm_parameters::testnet as testnet_params;

    // Helper macro to get metadata for a specific prover/verifier pair
    macro_rules! get_metadata {
        ($network:expr, $prover_type:ident, $verifier_type:ident) => {{
            // Normalize network string (trim and lowercase)
            let network_normalized = $network.trim().to_lowercase();
            match network_normalized.as_str() {
                "mainnet" => {
                    let prover_meta = mainnet_params::$prover_type::METADATA;
                    let verifier_meta = mainnet_params::$verifier_type::METADATA;
                    Ok((prover_meta, verifier_meta))
                }
                "testnet" => {
                    let prover_meta = testnet_params::$prover_type::METADATA;
                    let verifier_meta = testnet_params::$verifier_type::METADATA;
                    Ok((prover_meta, verifier_meta))
                }
                _ => {
                    Err(format!("Unknown network: {}. Expected 'mainnet' or 'testnet'", $network))
                }
            }
        }};
    }

    pub fn get_bond_public_metadata(network: &str) -> Result<(&'static str, &'static str), String> {
        get_metadata!(network, BondPublicProver, BondPublicVerifier)
    }

    pub fn get_bond_validator_metadata(network: &str) -> Result<(&'static str, &'static str), String> {
        get_metadata!(network, BondValidatorProver, BondValidatorVerifier)
    }

    pub fn get_claim_unbond_public_metadata(network: &str) -> Result<(&'static str, &'static str), String> {
        get_metadata!(network, ClaimUnbondPublicProver, ClaimUnbondPublicVerifier)
    }

    pub fn get_fee_private_metadata(network: &str) -> Result<(&'static str, &'static str), String> {
        get_metadata!(network, FeePrivateProver, FeePrivateVerifier)
    }

    pub fn get_fee_public_metadata(network: &str) -> Result<(&'static str, &'static str), String> {
        get_metadata!(network, FeePublicProver, FeePublicVerifier)
    }

    pub fn get_inclusion_metadata(network: &str) -> Result<(&'static str, &'static str), String> {
        get_metadata!(network, InclusionProver, InclusionVerifier)
    }

    pub fn get_join_metadata(network: &str) -> Result<(&'static str, &'static str), String> {
        get_metadata!(network, JoinProver, JoinVerifier)
    }

    pub fn get_set_validator_state_metadata(network: &str) -> Result<(&'static str, &'static str), String> {
        get_metadata!(network, SetValidatorStateProver, SetValidatorStateVerifier)
    }

    pub fn get_split_metadata(network: &str) -> Result<(&'static str, &'static str), String> {
        get_metadata!(network, SplitProver, SplitVerifier)
    }

    pub fn get_transfer_private_metadata(network: &str) -> Result<(&'static str, &'static str), String> {
        get_metadata!(network, TransferPrivateProver, TransferPrivateVerifier)
    }

    pub fn get_transfer_private_to_public_metadata(network: &str) -> Result<(&'static str, &'static str), String> {
        get_metadata!(network, TransferPrivateToPublicProver, TransferPrivateToPublicVerifier)
    }

    pub fn get_transfer_public_metadata(network: &str) -> Result<(&'static str, &'static str), String> {
        get_metadata!(network, TransferPublicProver, TransferPublicVerifier)
    }

    pub fn get_transfer_public_as_signer_metadata(network: &str) -> Result<(&'static str, &'static str), String> {
        get_metadata!(network, TransferPublicAsSignerProver, TransferPublicAsSignerVerifier)
    }

    pub fn get_transfer_public_to_private_metadata(network: &str) -> Result<(&'static str, &'static str), String> {
        get_metadata!(network, TransferPublicToPrivateProver, TransferPublicToPrivateVerifier)
    }

    pub fn get_unbond_public_metadata(network: &str) -> Result<(&'static str, &'static str), String> {
        get_metadata!(network, UnbondPublicProver, UnbondPublicVerifier)
    }
}


