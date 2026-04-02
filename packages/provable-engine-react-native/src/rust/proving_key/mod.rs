mod credits;

use crate::types::native::ProvingKeyNative;
use crate::{
    bytes_error_result, bytes_success_result, ensure_proving_key_storage, ffi, get_next_id,
    string_error_result, string_success_result,
};
use sha2::Digest;
use snarkvm_console::prelude::{FromBytes, ToBytes};
use std::{ops::Deref, str::FromStr};

/// Proving key for a function within an Aleo program
#[derive(Clone, Debug)]
pub struct ProvingKey(ProvingKeyNative);

impl ProvingKey {
    /// Return the checksum of the proving key
    pub fn checksum(&self) -> String {
        hex::encode(sha2::Sha256::digest(self.to_bytes().unwrap()))
    }

    /// Create a copy of the proving key
    pub fn copy(&self) -> ProvingKey {
        self.0.clone().into()
    }

    /// Construct a new proving key from a byte array
    pub fn from_bytes(bytes: &[u8]) -> Result<ProvingKey, String> {
        Ok(Self(
            ProvingKeyNative::from_bytes_le(bytes).map_err(|e| e.to_string())?,
        ))
    }

    /// Create a proving key from string
    pub fn from_string(string: &str) -> Result<ProvingKey, String> {
        Ok(Self(
            ProvingKeyNative::from_str(string).map_err(|e| e.to_string())?,
        ))
    }

    /// Return the byte representation of a proving key
    pub fn to_bytes(&self) -> Result<Vec<u8>, String> {
        self.0
            .to_bytes_le()
            .map_err(|_| "Failed to serialize proving key".to_string())
    }

    /// Get a string representation of the proving key
    pub fn to_string(&self) -> String {
        self.0.to_string()
    }
}

impl Deref for ProvingKey {
    type Target = ProvingKeyNative;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl From<ProvingKey> for ProvingKeyNative {
    fn from(proving_key: ProvingKey) -> ProvingKeyNative {
        proving_key.0
    }
}

impl From<ProvingKeyNative> for ProvingKey {
    fn from(proving_key: ProvingKeyNative) -> ProvingKey {
        ProvingKey(proving_key)
    }
}

// Type checks against credits.aleo metadata JSON
fn with_pk<F: FnOnce(&ProvingKey) -> bool>(handle: &ffi::ProvingKeyHandle, f: F) -> bool {
    let storage = ensure_proving_key_storage();
    let keys = storage.lock().unwrap();
    if let Some(pk) = keys.get(&handle.id) {
        let wrapper = ProvingKey::from(pk.clone());
        f(&wrapper)
    } else {
        false
    }
}

pub fn proving_key_is_bond_public_prover_with_metadata(
    handle: &ffi::ProvingKeyHandle,
    metadata_json: String,
) -> bool {
    with_pk(handle, |pk| {
        pk.is_bond_public_prover_with_metadata(&metadata_json)
    })
}
pub fn proving_key_is_bond_validator_prover_with_metadata(
    handle: &ffi::ProvingKeyHandle,
    metadata_json: String,
) -> bool {
    with_pk(handle, |pk| {
        pk.is_bond_validator_prover_with_metadata(&metadata_json)
    })
}
pub fn proving_key_is_claim_unbond_public_prover_with_metadata(
    handle: &ffi::ProvingKeyHandle,
    metadata_json: String,
) -> bool {
    with_pk(handle, |pk| {
        pk.is_claim_unbond_public_prover_with_metadata(&metadata_json)
    })
}
pub fn proving_key_is_fee_private_prover_with_metadata(
    handle: &ffi::ProvingKeyHandle,
    metadata_json: String,
) -> bool {
    with_pk(handle, |pk| {
        pk.is_fee_private_prover_with_metadata(&metadata_json)
    })
}
pub fn proving_key_is_fee_public_prover_with_metadata(
    handle: &ffi::ProvingKeyHandle,
    metadata_json: String,
) -> bool {
    with_pk(handle, |pk| {
        pk.is_fee_public_prover_with_metadata(&metadata_json)
    })
}
pub fn proving_key_is_inclusion_prover_with_metadata(
    handle: &ffi::ProvingKeyHandle,
    metadata_json: String,
) -> bool {
    with_pk(handle, |pk| {
        pk.is_inclusion_prover_with_metadata(&metadata_json)
    })
}
pub fn proving_key_is_join_prover_with_metadata(
    handle: &ffi::ProvingKeyHandle,
    metadata_json: String,
) -> bool {
    with_pk(handle, |pk| pk.is_join_prover_with_metadata(&metadata_json))
}
pub fn proving_key_is_set_validator_state_prover_with_metadata(
    handle: &ffi::ProvingKeyHandle,
    metadata_json: String,
) -> bool {
    with_pk(handle, |pk| {
        pk.is_set_validator_state_prover_with_metadata(&metadata_json)
    })
}
pub fn proving_key_is_split_prover_with_metadata(
    handle: &ffi::ProvingKeyHandle,
    metadata_json: String,
) -> bool {
    with_pk(handle, |pk| {
        pk.is_split_prover_with_metadata(&metadata_json)
    })
}
pub fn proving_key_is_transfer_private_prover_with_metadata(
    handle: &ffi::ProvingKeyHandle,
    metadata_json: String,
) -> bool {
    with_pk(handle, |pk| {
        pk.is_transfer_private_prover_with_metadata(&metadata_json)
    })
}
pub fn proving_key_is_transfer_private_to_public_prover_with_metadata(
    handle: &ffi::ProvingKeyHandle,
    metadata_json: String,
) -> bool {
    with_pk(handle, |pk| {
        pk.is_transfer_private_to_public_prover_with_metadata(&metadata_json)
    })
}
pub fn proving_key_is_transfer_public_prover_with_metadata(
    handle: &ffi::ProvingKeyHandle,
    metadata_json: String,
) -> bool {
    with_pk(handle, |pk| {
        pk.is_transfer_public_prover_with_metadata(&metadata_json)
    })
}
pub fn proving_key_is_transfer_public_as_signer_prover_with_metadata(
    handle: &ffi::ProvingKeyHandle,
    metadata_json: String,
) -> bool {
    with_pk(handle, |pk| {
        pk.is_transfer_public_as_signer_prover_with_metadata(&metadata_json)
    })
}
pub fn proving_key_is_transfer_public_to_private_prover_with_metadata(
    handle: &ffi::ProvingKeyHandle,
    metadata_json: String,
) -> bool {
    with_pk(handle, |pk| {
        pk.is_transfer_public_to_private_prover_with_metadata(&metadata_json)
    })
}
pub fn proving_key_is_unbond_public_prover_with_metadata(
    handle: &ffi::ProvingKeyHandle,
    metadata_json: String,
) -> bool {
    with_pk(handle, |pk| {
        pk.is_unbond_public_prover_with_metadata(&metadata_json)
    })
}
// FFI functions
pub fn proving_key_from_bytes(bytes: Vec<u8>) -> ffi::HandleResult {
    match ProvingKeyNative::from_bytes_le(&bytes) {
        Ok(pk) => {
            let id = get_next_id();
            let storage = ensure_proving_key_storage();
            let mut keys = storage.lock().unwrap();
            keys.insert(id, pk);
            ffi::HandleResult {
                success: true,
                handle: id,
                error: String::new(),
            }
        }
        Err(e) => ffi::HandleResult {
            success: false,
            handle: 0,
            error: e.to_string(),
        },
    }
}

pub fn proving_key_to_bytes(handle: &ffi::ProvingKeyHandle) -> ffi::BytesResult {
    let storage = ensure_proving_key_storage();
    let keys = storage.lock().unwrap();
    if let Some(key) = keys.get(&handle.id) {
        match key.to_bytes_le() {
            Ok(b) => bytes_success_result(b),
            Err(_) => bytes_error_result("Failed to serialize proving key".to_string()),
        }
    } else {
        bytes_error_result("Invalid proving key handle".to_string())
    }
}

pub fn destroy_proving_key(handle: &ffi::ProvingKeyHandle) {
    let storage = ensure_proving_key_storage();
    let mut keys = storage.lock().unwrap();
    keys.remove(&handle.id);
}

pub fn proving_key_from_string(string: String) -> ffi::HandleResult {
    match ProvingKeyNative::from_str(&string) {
        Ok(pk) => {
            let id = get_next_id();
            let storage = ensure_proving_key_storage();
            let mut keys = storage.lock().unwrap();
            keys.insert(id, pk);
            ffi::HandleResult {
                success: true,
                handle: id,
                error: String::new(),
            }
        }
        Err(e) => ffi::HandleResult {
            success: false,
            handle: 0,
            error: e.to_string(),
        },
    }
}

pub fn proving_key_checksum(handle: &ffi::ProvingKeyHandle) -> ffi::StringResult {
    let storage = ensure_proving_key_storage();
    let keys = storage.lock().unwrap();
    if let Some(pk) = keys.get(&handle.id) {
        match pk.to_bytes_le() {
            Ok(b) => {
                let sum = hex::encode(sha2::Sha256::digest(b));
                string_success_result(sum)
            }
            Err(_) => string_error_result("Failed to serialize proving key".to_string()),
        }
    } else {
        string_error_result("Invalid proving key handle".to_string())
    }
}

pub fn proving_key_copy(handle: &ffi::ProvingKeyHandle) -> ffi::HandleResult {
    let storage = ensure_proving_key_storage();
    let mut keys = storage.lock().unwrap();
    if let Some(pk) = keys.get(&handle.id).cloned() {
        let id = get_next_id();
        keys.insert(id, pk);
        ffi::HandleResult {
            success: true,
            handle: id,
            error: String::new(),
        }
    } else {
        ffi::HandleResult {
            success: false,
            handle: 0,
            error: "Invalid proving key handle".to_string(),
        }
    }
}
