mod credits;
mod metadata;

use crate::types::native::VerifyingKeyNative;
use crate::types::CurrentNetwork;
use crate::{
    bytes_error_result, bytes_success_result, ensure_verifying_key_storage, ffi, get_next_id,
    string_error_result, string_success_result,
};
use sha2::Digest;
use snarkvm_console::network::Network;
use snarkvm_console::prelude::{FromBytes, ToBytes};
use std::{ops::Deref, str::FromStr};

pub use metadata::Metadata;

/// Verifying key for a function within an Aleo program
#[derive(Clone, Debug, PartialEq)]
pub struct VerifyingKey(VerifyingKeyNative);

impl VerifyingKey {
    /// Get the checksum of the verifying key
    pub fn checksum(&self) -> String {
        hex::encode(sha2::Sha256::digest(self.to_bytes().unwrap()))
    }

    /// Create a copy of the verifying key
    pub fn copy(&self) -> VerifyingKey {
        self.0.clone().into()
    }

    /// Construct a new verifying key from a byte array
    pub fn from_bytes(bytes: &[u8]) -> Result<VerifyingKey, String> {
        Ok(Self(
            VerifyingKeyNative::from_bytes_le(bytes).map_err(|e| e.to_string())?,
        ))
    }

    /// Create a verifying key from string
    pub fn from_string(string: &str) -> Result<VerifyingKey, String> {
        Ok(Self(
            VerifyingKeyNative::from_str(string).map_err(|e| e.to_string())?,
        ))
    }

    /// Create a byte array from a verifying key
    pub fn to_bytes(&self) -> Result<Vec<u8>, String> {
        self.0
            .to_bytes_le()
            .map_err(|_| "Failed to serialize verifying key".to_string())
    }

    /// Get a string representation of the verifying key
    pub fn to_string(&self) -> String {
        self.0.to_string()
    }

    /// Get the number of constraints associated with the circuit
    pub fn num_constraints(&self) -> u32 {
        self.0.circuit_info.num_constraints as u32
    }
}

impl Deref for VerifyingKey {
    type Target = VerifyingKeyNative;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl From<VerifyingKeyNative> for VerifyingKey {
    fn from(verifying_key: VerifyingKeyNative) -> VerifyingKey {
        VerifyingKey(verifying_key)
    }
}

impl From<VerifyingKey> for VerifyingKeyNative {
    fn from(verifying_key: VerifyingKey) -> VerifyingKeyNative {
        verifying_key.0
    }
}

impl From<&VerifyingKeyNative> for VerifyingKey {
    fn from(verifying_key: &VerifyingKeyNative) -> VerifyingKey {
        VerifyingKey::from(verifying_key.clone())
    }
}

impl From<&VerifyingKey> for VerifyingKeyNative {
    fn from(verifying_key: &VerifyingKey) -> VerifyingKeyNative {
        verifying_key.0.clone()
    }
}

// Creation helpers for well-known credits.aleo verifying keys
fn make_handle_result_from_vk(vk: VerifyingKey) -> ffi::HandleResult {
    let id = get_next_id();
    let storage = ensure_verifying_key_storage();
    let mut map = storage.lock().unwrap();
    let native: VerifyingKeyNative = (&vk).into();
    map.insert(id, native);
    ffi::HandleResult {
        success: true,
        handle: id,
        error: String::new(),
    }
}

pub fn verifying_key_bond_public_verifier() -> ffi::HandleResult {
    make_handle_result_from_vk(VerifyingKey::bond_public_verifier())
}
pub fn verifying_key_bond_validator_verifier() -> ffi::HandleResult {
    make_handle_result_from_vk(VerifyingKey::bond_validator_verifier())
}
pub fn verifying_key_claim_unbond_public_verifier() -> ffi::HandleResult {
    make_handle_result_from_vk(VerifyingKey::claim_unbond_public_verifier())
}
pub fn verifying_key_fee_private_verifier() -> ffi::HandleResult {
    make_handle_result_from_vk(VerifyingKey::fee_private_verifier())
}
pub fn verifying_key_fee_public_verifier() -> ffi::HandleResult {
    make_handle_result_from_vk(VerifyingKey::fee_public_verifier())
}
pub fn verifying_key_inclusion_verifier() -> ffi::HandleResult {
    make_handle_result_from_vk(VerifyingKey::inclusion_verifier())
}
pub fn verifying_key_join_verifier() -> ffi::HandleResult {
    make_handle_result_from_vk(VerifyingKey::join_verifier())
}
pub fn verifying_key_set_validator_state_verifier() -> ffi::HandleResult {
    make_handle_result_from_vk(VerifyingKey::set_validator_state_verifier())
}
pub fn verifying_key_split_verifier() -> ffi::HandleResult {
    make_handle_result_from_vk(VerifyingKey::split_verifier())
}
pub fn verifying_key_transfer_private_verifier() -> ffi::HandleResult {
    make_handle_result_from_vk(VerifyingKey::transfer_private_verifier())
}
pub fn verifying_key_transfer_private_to_public_verifier() -> ffi::HandleResult {
    make_handle_result_from_vk(VerifyingKey::transfer_private_to_public_verifier())
}
pub fn verifying_key_transfer_public_verifier() -> ffi::HandleResult {
    make_handle_result_from_vk(VerifyingKey::transfer_public_verifier())
}
pub fn verifying_key_transfer_public_as_signer_verifier() -> ffi::HandleResult {
    make_handle_result_from_vk(VerifyingKey::transfer_public_as_signer_verifier())
}
pub fn verifying_key_transfer_public_to_private_verifier() -> ffi::HandleResult {
    make_handle_result_from_vk(VerifyingKey::transfer_public_to_private_verifier())
}
pub fn verifying_key_unbond_public_verifier() -> ffi::HandleResult {
    make_handle_result_from_vk(VerifyingKey::unbond_public_verifier())
}

// Type checks for verifying keys
fn with_vk<F: FnOnce(&VerifyingKeyNative) -> bool>(handle: &ffi::VerifyingKeyHandle, f: F) -> bool {
    let storage = ensure_verifying_key_storage();
    let map = storage.lock().unwrap();
    if let Some(vk) = map.get(&handle.id) {
        f(vk)
    } else {
        false
    }
}

pub fn verifying_key_is_bond_public_verifier(handle: &ffi::VerifyingKeyHandle) -> bool {
    with_vk(handle, |vk| {
        VerifyingKey::from(vk).is_bond_public_verifier()
    })
}
pub fn verifying_key_is_bond_validator_verifier(handle: &ffi::VerifyingKeyHandle) -> bool {
    with_vk(handle, |vk| {
        VerifyingKey::from(vk).is_bond_validator_verifier()
    })
}
pub fn verifying_key_is_claim_unbond_public_verifier(handle: &ffi::VerifyingKeyHandle) -> bool {
    with_vk(handle, |vk| {
        VerifyingKey::from(vk).is_claim_unbond_public_verifier()
    })
}
pub fn verifying_key_is_fee_private_verifier(handle: &ffi::VerifyingKeyHandle) -> bool {
    with_vk(handle, |vk| {
        VerifyingKey::from(vk).is_fee_private_verifier()
    })
}
pub fn verifying_key_is_fee_public_verifier(handle: &ffi::VerifyingKeyHandle) -> bool {
    with_vk(handle, |vk| VerifyingKey::from(vk).is_fee_public_verifier())
}
pub fn verifying_key_is_inclusion_verifier(handle: &ffi::VerifyingKeyHandle) -> bool {
    with_vk(handle, |vk| VerifyingKey::from(vk).is_inclusion_verifier())
}
pub fn verifying_key_is_join_verifier(handle: &ffi::VerifyingKeyHandle) -> bool {
    with_vk(handle, |vk| VerifyingKey::from(vk).is_join_verifier())
}
pub fn verifying_key_is_set_validator_state_verifier(handle: &ffi::VerifyingKeyHandle) -> bool {
    with_vk(handle, |vk| {
        VerifyingKey::from(vk).is_set_validator_state_verifier()
    })
}
pub fn verifying_key_is_split_verifier(handle: &ffi::VerifyingKeyHandle) -> bool {
    with_vk(handle, |vk| VerifyingKey::from(vk).is_split_verifier())
}
pub fn verifying_key_is_transfer_private_verifier(handle: &ffi::VerifyingKeyHandle) -> bool {
    with_vk(handle, |vk| {
        VerifyingKey::from(vk).is_transfer_private_verifier()
    })
}
pub fn verifying_key_is_transfer_private_to_public_verifier(
    handle: &ffi::VerifyingKeyHandle,
) -> bool {
    with_vk(handle, |vk| {
        VerifyingKey::from(vk).is_transfer_private_to_public_verifier()
    })
}
pub fn verifying_key_is_transfer_public_verifier(handle: &ffi::VerifyingKeyHandle) -> bool {
    with_vk(handle, |vk| {
        VerifyingKey::from(vk).is_transfer_public_verifier()
    })
}
pub fn verifying_key_is_transfer_public_as_signer_verifier(
    handle: &ffi::VerifyingKeyHandle,
) -> bool {
    with_vk(handle, |vk| {
        VerifyingKey::from(vk).is_transfer_public_as_signer_verifier()
    })
}
pub fn verifying_key_is_transfer_public_to_private_verifier(
    handle: &ffi::VerifyingKeyHandle,
) -> bool {
    with_vk(handle, |vk| {
        VerifyingKey::from(vk).is_transfer_public_to_private_verifier()
    })
}
pub fn verifying_key_is_unbond_public_verifier(handle: &ffi::VerifyingKeyHandle) -> bool {
    with_vk(handle, |vk| {
        VerifyingKey::from(vk).is_unbond_public_verifier()
    })
}
// FFI functions
pub fn verifying_key_from_bytes(bytes: Vec<u8>) -> ffi::HandleResult {
    match VerifyingKeyNative::from_bytes_le(&bytes) {
        Ok(vk) => {
            let id = get_next_id();
            let storage = ensure_verifying_key_storage();
            let mut map = storage.lock().unwrap();
            map.insert(id, vk);
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

pub fn verifying_key_from_string(string: String) -> ffi::HandleResult {
    match VerifyingKeyNative::from_str(&string) {
        Ok(vk) => {
            let id = get_next_id();
            let storage = ensure_verifying_key_storage();
            let mut map = storage.lock().unwrap();
            map.insert(id, vk);
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

pub fn verifying_key_to_bytes(handle: &ffi::VerifyingKeyHandle) -> ffi::BytesResult {
    let storage = ensure_verifying_key_storage();
    let map = storage.lock().unwrap();
    if let Some(vk) = map.get(&handle.id) {
        match vk.to_bytes_le() {
            Ok(b) => bytes_success_result(b),
            Err(_) => bytes_error_result("Failed to serialize verifying key".to_string()),
        }
    } else {
        bytes_error_result("Invalid verifying key handle".to_string())
    }
}

pub fn destroy_verifying_key(handle: &ffi::VerifyingKeyHandle) {
    let storage = ensure_verifying_key_storage();
    let mut map = storage.lock().unwrap();
    map.remove(&handle.id);
}

pub fn verifying_key_checksum(handle: &ffi::VerifyingKeyHandle) -> ffi::StringResult {
    let storage = ensure_verifying_key_storage();
    let map = storage.lock().unwrap();
    if let Some(vk) = map.get(&handle.id) {
        match vk.to_bytes_le() {
            Ok(b) => {
                let sum = hex::encode(sha2::Sha256::digest(b));
                string_success_result(sum)
            }
            Err(_) => string_error_result("Failed to serialize verifying key".to_string()),
        }
    } else {
        string_error_result("Invalid verifying key handle".to_string())
    }
}

pub fn verifying_key_num_constraints(handle: &ffi::VerifyingKeyHandle) -> f64 {
    let storage = ensure_verifying_key_storage();
    let map = storage.lock().unwrap();
    if let Some(vk) = map.get(&handle.id) {
        vk.circuit_info.num_constraints as f64
    } else {
        0.0
    }
}

pub fn verifying_key_copy(handle: &ffi::VerifyingKeyHandle) -> ffi::HandleResult {
    let storage = ensure_verifying_key_storage();
    let mut map = storage.lock().unwrap();
    if let Some(vk) = map.get(&handle.id).cloned() {
        let id = get_next_id();
        map.insert(id, vk);
        ffi::HandleResult {
            success: true,
            handle: id,
            error: String::new(),
        }
    } else {
        ffi::HandleResult {
            success: false,
            handle: 0,
            error: "Invalid verifying key handle".to_string(),
        }
    }
}
