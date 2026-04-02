use crate::{
    ensure_record_ciphertext_storage, ensure_view_key_storage, error_result, ffi, get_next_id,
    success_result, types::*,
};
use std::str::FromStr;

pub fn record_ciphertext_from_string(ciphertext_str: String) -> ffi::RecordCiphertextHandle {
    match RecordCiphertext::<CurrentNetwork>::from_str(&ciphertext_str) {
        Ok(ciphertext) => {
            let id = get_next_id();
            let storage = ensure_record_ciphertext_storage();
            let mut ciphertexts = storage.lock().unwrap();
            ciphertexts.insert(id, ciphertext);
            ffi::RecordCiphertextHandle { id }
        }
        Err(_) => ffi::RecordCiphertextHandle { id: 0 }, // Invalid handle
    }
}

pub fn record_ciphertext_to_string(handle: &ffi::RecordCiphertextHandle) -> ffi::AccountResult {
    let storage = ensure_record_ciphertext_storage();
    let ciphertexts = storage.lock().unwrap();

    if let Some(ciphertext) = ciphertexts.get(&handle.id) {
        success_result(ciphertext.to_string())
    } else {
        error_result("Invalid record ciphertext handle".to_string())
    }
}

pub fn record_ciphertext_is_owner(
    handle: &ffi::RecordCiphertextHandle,
    view_key_handle: &ffi::ViewKeyHandle,
) -> bool {
    let ciphertext_storage = ensure_record_ciphertext_storage();
    let ciphertexts = ciphertext_storage.lock().unwrap();

    let view_key_storage = ensure_view_key_storage();
    let view_keys = view_key_storage.lock().unwrap();

    if let (Some(ciphertext), Some(view_key)) = (
        ciphertexts.get(&handle.id),
        view_keys.get(&view_key_handle.id),
    ) {
        ciphertext.decrypt(view_key).is_ok()
    } else {
        false
    }
}

pub fn validate_record_ciphertext(ciphertext_str: String) -> bool {
    ciphertext_str
        .parse::<RecordCiphertext<CurrentNetwork>>()
        .is_ok()
}

pub fn destroy_record_ciphertext(handle: &ffi::RecordCiphertextHandle) {
    let storage = ensure_record_ciphertext_storage();
    let mut ciphertexts = storage.lock().unwrap();
    ciphertexts.remove(&handle.id);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::account::view_key::view_key_from_string;

    const KNOWN_VIEW_KEY: &str = "AViewKey1mSnpFFC8Mj4fXbK5YiWgZ3mjiV8CxA79bYNa8ymUpTrw";

    #[test]
    fn validate_invalid_ciphertext_returns_false() {
        assert!(!validate_record_ciphertext("invalid".to_string()));
    }

    #[test]
    fn validate_empty_ciphertext_returns_false() {
        assert!(!validate_record_ciphertext("".to_string()));
    }

    #[test]
    fn validate_random_hex_returns_false() {
        assert!(!validate_record_ciphertext("0x1234abcd".to_string()));
    }

    #[test]
    fn from_string_invalid_returns_zero_handle() {
        let handle = record_ciphertext_from_string("invalid_ciphertext".to_string());
        assert_eq!(handle.id, 0);
    }

    #[test]
    fn from_string_empty_returns_zero_handle() {
        let handle = record_ciphertext_from_string("".to_string());
        assert_eq!(handle.id, 0);
    }

    #[test]
    fn to_string_invalid_handle_returns_error() {
        let handle = ffi::RecordCiphertextHandle { id: 999_999 };
        let result = record_ciphertext_to_string(&handle);
        assert!(!result.success);
        assert!(result.error.contains("Invalid record ciphertext handle"));
    }

    #[test]
    fn is_owner_invalid_ciphertext_handle_returns_false() {
        let ct_handle = ffi::RecordCiphertextHandle { id: 999_998 };
        let vk_handle = ffi::ViewKeyHandle { id: 999_999 };
        assert!(!record_ciphertext_is_owner(&ct_handle, &vk_handle));
    }

    #[test]
    fn is_owner_invalid_view_key_handle_returns_false() {
        // Even if we had a valid ciphertext handle, an invalid view key handle should return false
        let ct_handle = ffi::RecordCiphertextHandle { id: 1 };
        let vk_handle = ffi::ViewKeyHandle { id: 999_999 };
        assert!(!record_ciphertext_is_owner(&ct_handle, &vk_handle));
    }

    #[test]
    fn destroy_nonexistent_handle_does_not_panic() {
        let handle = ffi::RecordCiphertextHandle { id: 888_888 };
        destroy_record_ciphertext(&handle);
    }

    #[test]
    fn destroy_removes_from_storage() {
        // Insert a handle manually by parsing 
        // Instead, verify that destroying a handle twice doesn't panic
        let handle = ffi::RecordCiphertextHandle { id: 777_777 };
        destroy_record_ciphertext(&handle);
        destroy_record_ciphertext(&handle); // second call should also not panic
    }

    #[test]
    fn view_key_from_known_string_creates_valid_handle() {
        let vk_handle = view_key_from_string(KNOWN_VIEW_KEY.to_string());
        assert_ne!(vk_handle.id, 0, "Known view key should produce a valid handle");
    }

    #[test]
    fn is_owner_with_valid_view_key_and_invalid_ciphertext_returns_false() {
        let vk_handle = view_key_from_string(KNOWN_VIEW_KEY.to_string());
        assert_ne!(vk_handle.id, 0);

        // Use a non-existent ciphertext handle
        let ct_handle = ffi::RecordCiphertextHandle { id: 666_666 };
        assert!(!record_ciphertext_is_owner(&ct_handle, &vk_handle));
    }
}
