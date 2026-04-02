use crate::{
    encryption::field::field_from_value,
    ensure_address_storage, ensure_record_plaintext_storage, ensure_view_key_storage, error_result,
    ffi, get_next_id, success_result, types::*,
};
use snarkvm_console::prelude::*;
use snarkvm_console::network::Environment;
use std::str::FromStr;

pub fn view_key_from_string(view_key_str: String) -> ffi::ViewKeyHandle {
    match view_key_str.parse::<ViewKey<CurrentNetwork>>() {
        Ok(view_key) => {
            let id = get_next_id();
            let storage = ensure_view_key_storage();
            let mut view_keys = storage.lock().unwrap();
            view_keys.insert(id, view_key);
            ffi::ViewKeyHandle { id }
        }
        Err(_) => ffi::ViewKeyHandle { id: 0 }, // Invalid handle
    }
}

pub fn view_key_to_string(handle: &ffi::ViewKeyHandle) -> ffi::AccountResult {
    let storage = ensure_view_key_storage();
    let view_keys = storage.lock().unwrap();

    if let Some(view_key) = view_keys.get(&handle.id) {
        success_result(view_key.to_string())
    } else {
        error_result("Invalid view key handle".to_string())
    }
}

pub fn view_key_to_address(handle: &ffi::ViewKeyHandle) -> ffi::AddressHandle {
    let storage = ensure_view_key_storage();
    let view_keys = storage.lock().unwrap();

    if let Some(view_key) = view_keys.get(&handle.id) {
        match Address::<CurrentNetwork>::try_from(view_key) {
            Ok(address) => {
                let id = get_next_id();
                let addr_storage = ensure_address_storage();
                let mut addresses = addr_storage.lock().unwrap();
                addresses.insert(id, address);
                ffi::AddressHandle { id }
            }
            Err(_) => ffi::AddressHandle { id: 0 }, // Invalid handle
        }
    } else {
        ffi::AddressHandle { id: 0 } // Invalid handle
    }
}

pub fn view_key_to_field(handle: &ffi::ViewKeyHandle) -> Result<Box<crate::FieldHandle>, String> {
    let storage = ensure_view_key_storage();
    let view_keys = storage.lock().unwrap();

    if let Some(view_key) = view_keys.get(&handle.id) {
        let bytes = view_key.to_bytes_le().map_err(|e| e.to_string())?;
        let field = <CurrentNetwork as Environment>::Field::from_bytes_le_mod_order(&bytes);
        Ok(field_from_value(Field::<CurrentNetwork>::new(field)))
    } else {
        Err("Invalid view key handle".to_string())
    }
}

pub fn view_key_to_bytes_le(handle: &ffi::ViewKeyHandle) -> Result<Vec<u8>, String> {
    let storage = ensure_view_key_storage();
    let view_keys = storage.lock().unwrap();

    if let Some(view_key) = view_keys.get(&handle.id) {
        view_key.to_bytes_le().map_err(|e| e.to_string())
    } else {
        Err("Invalid view key handle".to_string())
    }
}

pub fn view_key_from_bytes_le(bytes: Vec<u8>) -> ffi::ViewKeyHandle {
    match ViewKey::<CurrentNetwork>::read_le(&bytes[..]) {
        Ok(view_key) => {
            let id = get_next_id();
            let storage = ensure_view_key_storage();
            let mut view_keys = storage.lock().unwrap();
            view_keys.insert(id, view_key);
            ffi::ViewKeyHandle { id }
        }
        Err(_) => ffi::ViewKeyHandle { id: 0 }, // Invalid handle
    }
}

pub fn view_key_decrypt(handle: &ffi::ViewKeyHandle, ciphertext: String) -> ffi::HandleResult {
    let vk_storage = ensure_view_key_storage();
    let view_keys = vk_storage.lock().unwrap();

    if let Some(view_key) = view_keys.get(&handle.id) {
        match RecordCiphertext::<CurrentNetwork>::from_str(&ciphertext) {
            Ok(ct) => match ct.decrypt(view_key) {
                Ok(plaintext) => {
                    let id = get_next_id();
                    let pt_storage = ensure_record_plaintext_storage();
                    let mut plaintexts = pt_storage.lock().unwrap();
                    plaintexts.insert(id, plaintext);
                    ffi::HandleResult { success: true, handle: id, error: String::new() }
                }
                Err(e) => ffi::HandleResult {
                    success: false,
                    handle: 0,
                    error: e.to_string(),
                },
            },
            Err(e) => ffi::HandleResult {
                success: false,
                handle: 0,
                error: e.to_string(),
            },
        }
    } else {
        ffi::HandleResult { success: false, handle: 0, error: "Invalid view key handle".to_string() }
    }
}

pub fn validate_view_key(view_key_str: String) -> bool {
    view_key_str.parse::<ViewKey<CurrentNetwork>>().is_ok()
}

pub fn destroy_view_key(handle: &ffi::ViewKeyHandle) {
    let storage = ensure_view_key_storage();
    let mut view_keys = storage.lock().unwrap();
    view_keys.remove(&handle.id);
}

#[cfg(test)]
mod tests {
    use super::*;

    const KNOWN_VIEW_KEY: &str = "AViewKey1mSnpFFC8Mj4fXbK5YiWgZ3mjiV8CxA79bYNa8ymUpTrw";

    #[test]
    fn from_string_with_known_view_key() {
        let handle = view_key_from_string(KNOWN_VIEW_KEY.to_string());
        assert_ne!(handle.id, 0, "Known view key should produce a valid handle");
    }

    #[test]
    fn from_string_with_invalid_view_key() {
        let handle = view_key_from_string("invalid_view_key".to_string());
        assert_eq!(handle.id, 0);
    }

    #[test]
    fn from_string_with_empty_string() {
        let handle = view_key_from_string("".to_string());
        assert_eq!(handle.id, 0);
    }

    #[test]
    fn to_string_roundtrip() {
        let handle = view_key_from_string(KNOWN_VIEW_KEY.to_string());
        assert_ne!(handle.id, 0);

        let result = view_key_to_string(&handle);
        assert!(result.success);
        assert_eq!(result.result, KNOWN_VIEW_KEY);
    }

    #[test]
    fn test_byte_serialization_roundtrip() {
        let vk = KNOWN_VIEW_KEY
            .parse::<ViewKey<CurrentNetwork>>()
            .expect("known view key should parse");
        let bytes = vk.to_bytes_le().expect("view key should serialize");
        let vk_from_bytes = ViewKey::<CurrentNetwork>::read_le(&bytes[..])
            .expect("serialized bytes should deserialize");
        assert_eq!(vk, vk_from_bytes);
    }

    #[test]
    fn to_string_invalid_handle_returns_error() {
        let handle = ffi::ViewKeyHandle { id: 999_999 };
        let result = view_key_to_string(&handle);
        assert!(!result.success);
        assert!(result.error.contains("Invalid view key handle"));
    }

    #[test]
    fn to_address_with_valid_handle() {
        let vk_handle = view_key_from_string(KNOWN_VIEW_KEY.to_string());
        assert_ne!(vk_handle.id, 0);

        let addr_handle = view_key_to_address(&vk_handle);
        assert_ne!(addr_handle.id, 0, "Valid view key should derive a valid address");
    }

    #[test]
    fn to_address_with_invalid_handle() {
        let vk_handle = ffi::ViewKeyHandle { id: 999_999 };
        let addr_handle = view_key_to_address(&vk_handle);
        assert_eq!(addr_handle.id, 0);
    }

    #[test]
    fn decrypt_with_invalid_view_key_handle() {
        let handle = ffi::ViewKeyHandle { id: 999_999 };
        let result = view_key_decrypt(&handle, "some_ciphertext".to_string());
        assert!(!result.success);
        assert!(result.error.contains("Invalid view key handle"));
    }

    #[test]
    fn decrypt_with_valid_handle_invalid_ciphertext() {
        let handle = view_key_from_string(KNOWN_VIEW_KEY.to_string());
        assert_ne!(handle.id, 0);

        let result = view_key_decrypt(&handle, "not_a_valid_ciphertext".to_string());
        assert!(!result.success);
        assert!(!result.error.is_empty());
    }

    #[test]
    fn decrypt_with_empty_ciphertext() {
        let handle = view_key_from_string(KNOWN_VIEW_KEY.to_string());
        assert_ne!(handle.id, 0);

        let result = view_key_decrypt(&handle, "".to_string());
        assert!(!result.success);
    }

    #[test]
    fn validate_known_view_key() {
        assert!(validate_view_key(KNOWN_VIEW_KEY.to_string()));
    }

    #[test]
    fn validate_invalid_view_key() {
        assert!(!validate_view_key("invalid".to_string()));
    }

    #[test]
    fn validate_empty_view_key() {
        assert!(!validate_view_key("".to_string()));
    }

    #[test]
    fn destroy_valid_handle() {
        let handle = view_key_from_string(KNOWN_VIEW_KEY.to_string());
        assert_ne!(handle.id, 0);

        destroy_view_key(&handle);

        // After destroy, to_string should return error
        let result = view_key_to_string(&handle);
        assert!(!result.success);
    }

    #[test]
    fn destroy_nonexistent_handle_does_not_panic() {
        let handle = ffi::ViewKeyHandle { id: 888_888 };
        destroy_view_key(&handle);
    }


}
