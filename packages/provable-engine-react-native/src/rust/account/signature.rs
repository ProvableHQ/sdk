use crate::{ensure_signature_storage, error_result, ffi, get_next_id, success_result, types::*};
use std::str::FromStr;

pub fn signature_from_string(signature_str: String) -> ffi::SignatureHandle {
    match Signature::<CurrentNetwork>::from_str(&signature_str) {
        Ok(signature) => {
            let id = get_next_id();
            let storage = ensure_signature_storage();
            let mut signatures = storage.lock().unwrap();
            signatures.insert(id, signature);
            ffi::SignatureHandle { id }
        }
        Err(_) => ffi::SignatureHandle { id: 0 }, // Invalid handle
    }
}

pub fn signature_to_string(handle: &ffi::SignatureHandle) -> ffi::AccountResult {
    let storage = ensure_signature_storage();
    let signatures = storage.lock().unwrap();

    if let Some(signature) = signatures.get(&handle.id) {
        success_result(signature.to_string())
    } else {
        error_result("Invalid signature handle".to_string())
    }
}

pub fn validate_signature(signature_str: String) -> bool {
    signature_str.parse::<Signature<CurrentNetwork>>().is_ok()
}

pub fn destroy_signature(handle: &ffi::SignatureHandle) {
    let storage = ensure_signature_storage();
    let mut signatures = storage.lock().unwrap();
    signatures.remove(&handle.id);
}
