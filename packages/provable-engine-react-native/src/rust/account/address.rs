use crate::{
    ensure_address_storage, ensure_signature_storage, error_result, ffi, get_next_id,
    success_result, types::*,
};

pub fn address_from_string(address_str: String) -> ffi::AddressHandle {
    let lower_address_str = address_str.to_lowercase();
    match lower_address_str.parse::<Address<CurrentNetwork>>() {
        Ok(address) => {
            let id = get_next_id();
            let storage = ensure_address_storage();
            let mut addresses = storage.lock().unwrap();
            addresses.insert(id, address);
            ffi::AddressHandle { id }
        }
        Err(_) => ffi::AddressHandle { id: 0 }, // Invalid handle
    }
}

pub fn address_to_string(handle: &ffi::AddressHandle) -> ffi::AccountResult {
    let storage = ensure_address_storage();
    let addresses = storage.lock().unwrap();

    if let Some(address) = addresses.get(&handle.id) {
        success_result(address.to_string())
    } else {
        error_result("Invalid address handle".to_string())
    }
}

pub fn address_verify(
    handle: &ffi::AddressHandle,
    message: Vec<u8>,
    signature_handle: &ffi::SignatureHandle,
) -> bool {
    let addr_storage = ensure_address_storage();
    let addresses = addr_storage.lock().unwrap();

    let sig_storage = ensure_signature_storage();
    let signatures = sig_storage.lock().unwrap();

    if let (Some(address), Some(signature)) = (
        addresses.get(&handle.id),
        signatures.get(&signature_handle.id),
    ) {
        signature.verify_bytes(address, &message)
    } else {
        false
    }
}

pub fn validate_address(address_str: String) -> bool {
    if address_str != address_str.to_lowercase() {
        return false;
    }

    address_str.parse::<Address<CurrentNetwork>>().is_ok()
}

pub fn destroy_address(handle: &ffi::AddressHandle) {
    let storage = ensure_address_storage();
    let mut addresses = storage.lock().unwrap();
    addresses.remove(&handle.id);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::account::private_key::{private_key_from_string, private_key_sign, private_key_to_address};

    const KNOWN_PRIVATE_KEY: &str =
        "APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH";
    // Derived from KNOWN_PRIVATE_KEY (mainnet bech32m address)
    const KNOWN_ADDRESS: &str =
        "aleo1qnr4dkkvkgfqph0vzc3y6z2eu975wnpz2925ntjccd5cfqxtyu8s7pyjh9";

    // ── address_from_string ───────────────────────────────────────────────────

    #[test]
    fn from_string_with_known_address() {
        let handle = address_from_string(KNOWN_ADDRESS.to_string());
        assert_ne!(handle.id, 0, "Known address should produce a valid handle");
    }

    #[test]
    fn from_string_with_invalid_address() {
        let handle = address_from_string("invalid_address".to_string());
        assert_eq!(handle.id, 0);
    }

    #[test]
    fn from_string_with_empty_string() {
        let handle = address_from_string("".to_string());
        assert_eq!(handle.id, 0);
    }

    #[test]
    fn from_string_is_case_insensitive() {
        // address_from_string lowercases the input before parsing
        let handle = address_from_string(KNOWN_ADDRESS.to_uppercase());
        assert_ne!(handle.id, 0, "Uppercase address should still produce a valid handle");
    }

    #[test]
    fn from_string_auto_lowercases() {
        let lowercase_address = "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px";
        let uppercase_address = "ALEO1RHGDU77HGYQD3XJJ8UCU3JJ9R2KRWZ6MNZYD80GNCR5FXCWLH5RSVZP9PX";
        let mixed_case_address = "Aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px";

        let lower_handle = address_from_string(lowercase_address.to_string());
        let upper_handle = address_from_string(uppercase_address.to_string());
        let mixed_handle = address_from_string(mixed_case_address.to_string());

        assert_ne!(lower_handle.id, 0);
        assert_ne!(upper_handle.id, 0);
        assert_ne!(mixed_handle.id, 0);

        let lower_str = address_to_string(&lower_handle).result;
        let upper_str = address_to_string(&upper_handle).result;
        let mixed_str = address_to_string(&mixed_handle).result;

        assert_eq!(upper_str, lower_str);
        assert_eq!(mixed_str, lower_str);
    }

    // ── address_to_string ─────────────────────────────────────────────────────

    #[test]
    fn to_string_roundtrip() {
        let handle = address_from_string(KNOWN_ADDRESS.to_string());
        assert_ne!(handle.id, 0);

        let result = address_to_string(&handle);
        assert!(result.success);
        assert_eq!(result.result, KNOWN_ADDRESS);
    }

    #[test]
    fn to_string_invalid_handle_returns_error() {
        let handle = ffi::AddressHandle { id: 999_999 };
        let result = address_to_string(&handle);
        assert!(!result.success);
        assert!(result.error.contains("Invalid address handle"));
    }

    // ── validate_address ──────────────────────────────────────────────────────

    #[test]
    fn validate_known_address() {
        assert!(validate_address(KNOWN_ADDRESS.to_string()));
    }

    #[test]
    fn validate_invalid_address() {
        assert!(!validate_address("invalid".to_string()));
    }

    #[test]
    fn validate_empty_address() {
        assert!(!validate_address("".to_string()));
    }

    #[test]
    fn validate_wrong_prefix_returns_false() {
        assert!(!validate_address("aleo2qnr4dkkvkgfqph0vzc3y6z2eu975wnpz2925ntjccd5cfqxtyu8s".to_string()));
    }

    #[test]
    fn validate_mixed_case_address_returns_false() {
        assert!(!validate_address("Aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px".to_string()));
    }

    #[test]
    fn validate_all_uppercase_address_returns_false() {
        assert!(!validate_address("ALEO1RHGDU77HGYQD3XJJ8UCU3JJ9R2KRWZ6MNZYD80GNCR5FXCWLH5RSVZP9PX".to_string()));
    }

    // ── address_verify ────────────────────────────────────────────────────────

    #[test]
    fn verify_with_valid_signature() {
        let pk_handle = private_key_from_string(KNOWN_PRIVATE_KEY.to_string());
        assert_ne!(pk_handle.id, 0);

        let addr_handle = private_key_to_address(&pk_handle);
        assert_ne!(addr_handle.id, 0);

        let message = b"hello aleo".to_vec();
        let sig_result = private_key_sign(&pk_handle, message.clone());
        assert!(sig_result.success, "Signing should succeed: {}", sig_result.error);

        let sig_handle = ffi::SignatureHandle { id: sig_result.signature_handle };
        assert!(address_verify(&addr_handle, message, &sig_handle));
    }

    #[test]
    fn verify_with_wrong_message_returns_false() {
        let pk_handle = private_key_from_string(KNOWN_PRIVATE_KEY.to_string());
        assert_ne!(pk_handle.id, 0);

        let addr_handle = private_key_to_address(&pk_handle);
        assert_ne!(addr_handle.id, 0);

        let message = b"original message".to_vec();
        let sig_result = private_key_sign(&pk_handle, message);
        assert!(sig_result.success);

        let sig_handle = ffi::SignatureHandle { id: sig_result.signature_handle };
        let different_message = b"tampered message".to_vec();
        assert!(!address_verify(&addr_handle, different_message, &sig_handle));
    }

    #[test]
    fn verify_with_invalid_address_handle_returns_false() {
        let pk_handle = private_key_from_string(KNOWN_PRIVATE_KEY.to_string());
        let sig_result = private_key_sign(&pk_handle, b"test".to_vec());
        assert!(sig_result.success);

        let addr_handle = ffi::AddressHandle { id: 999_999 };
        let sig_handle = ffi::SignatureHandle { id: sig_result.signature_handle };
        assert!(!address_verify(&addr_handle, b"test".to_vec(), &sig_handle));
    }

    #[test]
    fn verify_with_invalid_signature_handle_returns_false() {
        let addr_handle = address_from_string(KNOWN_ADDRESS.to_string());
        assert_ne!(addr_handle.id, 0);

        let sig_handle = ffi::SignatureHandle { id: 999_999 };
        assert!(!address_verify(&addr_handle, b"test".to_vec(), &sig_handle));
    }

    // ── destroy_address ───────────────────────────────────────────────────────

    #[test]
    fn destroy_valid_handle() {
        let handle = address_from_string(KNOWN_ADDRESS.to_string());
        assert_ne!(handle.id, 0);

        destroy_address(&handle);

        // After destroy, to_string should return error
        let result = address_to_string(&handle);
        assert!(!result.success);
    }

    #[test]
    fn destroy_nonexistent_handle_does_not_panic() {
        let handle = ffi::AddressHandle { id: 888_888 };
        destroy_address(&handle); // should not panic
    }

    #[test]
    fn destroy_twice_does_not_panic() {
        let handle = ffi::AddressHandle { id: 777_777 };
        destroy_address(&handle);
        destroy_address(&handle); // second call should also not panic
    }
}
