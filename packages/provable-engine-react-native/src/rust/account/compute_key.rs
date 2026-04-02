use crate::{ensure_compute_key_storage, error_result, ffi, get_next_id, success_result, types::*};
use snarkvm_console::prelude::{FromBytes, ToBytes};

pub fn compute_key_from_string(compute_key_str: String) -> ffi::ComputeKeyHandle {
    // Deserialize from the custom "ComputeKey:{hex}" format produced by compute_key_to_string.
    // ComputeKey<N> does not implement FromStr in snarkvm-console, so we use the
    // round-trip via ToBytes/FromBytes with our own hex prefix format.
    let hex_part = match compute_key_str.strip_prefix("ComputeKey:") {
        Some(h) => h,
        None => return ffi::ComputeKeyHandle { id: 0 },
    };
    let bytes = match hex::decode(hex_part) {
        Ok(b) => b,
        Err(_) => return ffi::ComputeKeyHandle { id: 0 },
    };
    match ComputeKey::<CurrentNetwork>::from_bytes_le(&bytes) {
        Ok(key) => {
            let id = get_next_id();
            let storage = ensure_compute_key_storage();
            let mut keys = storage.lock().unwrap();
            keys.insert(id, key);
            ffi::ComputeKeyHandle { id }
        }
        Err(_) => ffi::ComputeKeyHandle { id: 0 },
    }
}

pub fn compute_key_to_string(handle: &ffi::ComputeKeyHandle) -> ffi::AccountResult {
    let storage = ensure_compute_key_storage();
    let keys = storage.lock().unwrap();

    if let Some(key) = keys.get(&handle.id) {
        // ComputeKey<N> does not implement Display, so we serialize via ToBytes + hex encoding.
        match key.to_bytes_le() {
            Ok(bytes) => {
                // Convert to hex string representation
                let hex_string = hex::encode(bytes);
                success_result(format!("ComputeKey:{}", hex_string))
            }
            Err(_) => error_result("Failed to serialize compute key".to_string()),
        }
    } else {
        error_result("Invalid compute key handle".to_string())
    }
}

pub fn validate_compute_key(compute_key_str: String) -> bool {
    // Attempt a full round-trip parse to validate the key is well-formed.
    let handle = compute_key_from_string(compute_key_str);
    if handle.id == 0 {
        return false;
    }
    destroy_compute_key(&handle);
    true
}

pub fn destroy_compute_key(handle: &ffi::ComputeKeyHandle) {
    let storage = ensure_compute_key_storage();
    let mut keys = storage.lock().unwrap();
    keys.remove(&handle.id);
}
