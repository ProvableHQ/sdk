use crate::{
    ensure_private_key_storage, ensure_record_plaintext_storage, ensure_view_key_storage, error_result, ffi, get_next_id,
    success_result, types::*,
};
use snarkvm_console::program::{Identifier, ProgramID};
use std::str::FromStr;

pub fn record_plaintext_from_string(plaintext_str: String) -> ffi::RecordPlaintextHandle {
    match RecordPlaintext::<CurrentNetwork>::from_str(&plaintext_str) {
        Ok(plaintext) => {
            let id = get_next_id();
            let storage = ensure_record_plaintext_storage();
            let mut plaintexts = storage.lock().unwrap();
            plaintexts.insert(id, plaintext);
            ffi::RecordPlaintextHandle { id }
        }
        Err(_) => ffi::RecordPlaintextHandle { id: 0 }, // Invalid handle
    }
}

pub fn record_plaintext_to_string(handle: &ffi::RecordPlaintextHandle) -> ffi::AccountResult {
    let storage = ensure_record_plaintext_storage();
    let plaintexts = storage.lock().unwrap();

    if let Some(plaintext) = plaintexts.get(&handle.id) {
        success_result(plaintext.to_string())
    } else {
        error_result("Invalid record plaintext handle".to_string())
    }
}

pub fn validate_record_plaintext(plaintext_str: String) -> bool {
    plaintext_str
        .parse::<RecordPlaintext<CurrentNetwork>>()
        .is_ok()
}

pub fn destroy_record_plaintext(handle: &ffi::RecordPlaintextHandle) {
    let storage = ensure_record_plaintext_storage();
    let mut plaintexts = storage.lock().unwrap();
    plaintexts.remove(&handle.id);
}

/// Compute the commitment for a record plaintext.
/// This is needed to fetch state paths for inclusion proofs.
pub fn record_plaintext_to_commitment(
    record_str: String,
    program_id: String,
    record_name: String,
    view_key_handle: &ffi::ViewKeyHandle,
) -> ffi::StringResult {
    // Parse the record plaintext
    let record = match RecordPlaintext::<CurrentNetwork>::from_str(&record_str) {
        Ok(r) => r,
        Err(e) => return ffi::StringResult {
            success: false,
            result: String::new(),
            error: format!("Failed to parse record plaintext: {}", e),
        },
    };

    // Get the view key
    let view_key_storage = ensure_view_key_storage();
    let view_keys = view_key_storage.lock().unwrap();
    let view_key = match view_keys.get(&view_key_handle.id) {
        Some(vk) => vk,
        None => return ffi::StringResult {
            success: false,
            result: String::new(),
            error: "Invalid view key handle".to_string(),
        },
    };

    // Parse program ID
    let program_id_native = match ProgramID::<CurrentNetwork>::from_str(&program_id) {
        Ok(id) => id,
        Err(e) => return ffi::StringResult {
            success: false,
            result: String::new(),
            error: format!("Failed to parse program ID: {}", e),
        },
    };

    // Parse record name
    let record_name_native = match Identifier::<CurrentNetwork>::from_str(&record_name) {
        Ok(id) => id,
        Err(e) => return ffi::StringResult {
            success: false,
            result: String::new(),
            error: format!("Failed to parse record name: {}", e),
        },
    };

    // Compute record view key: (nonce * view_key).to_x_coordinate()
    let record_view_key = (*record.nonce() * **view_key).to_x_coordinate();

    // Compute commitment
    match record.to_commitment(&program_id_native, &record_name_native, &record_view_key) {
        Ok(commitment) => ffi::StringResult {
            success: true,
            result: commitment.to_string(),
            error: String::new(),
        },
        Err(e) => ffi::StringResult {
            success: false,
            result: String::new(),
            error: format!("Failed to compute commitment: {}", e),
        },
    }
}

/// Compute the serial number for a record plaintext.
/// This is needed to determine if a record has been spent.
pub fn record_plaintext_to_serial_number(
    record_str: String,
    private_key_handle: &ffi::PrivateKeyHandle,
    program_id: String,
    record_name: String,
    record_view_key: String,
) -> ffi::StringResult {
    // Parse the record plaintext
    let record = match RecordPlaintext::<CurrentNetwork>::from_str(&record_str) {
        Ok(r) => r,
        Err(e) => return ffi::StringResult {
            success: false,
            result: String::new(),
            error: format!("Failed to parse record plaintext: {}", e),
        },
    };

    // Get the private key
    let private_key_storage = ensure_private_key_storage();
    let private_keys = private_key_storage.lock().unwrap();
    let private_key = match private_keys.get(&private_key_handle.id) {
        Some(pk) => pk.clone(),
        None => return ffi::StringResult {
            success: false,
            result: String::new(),
            error: "Invalid private key handle".to_string(),
        },
    };
    drop(private_keys); // Release the lock before expensive computation

    // Parse record view key as Field
    let record_view_key_field = match Field::<CurrentNetwork>::from_str(&record_view_key) {
        Ok(f) => f,
        Err(e) => return ffi::StringResult {
            success: false,
            result: String::new(),
            error: format!("Failed to parse record view key: {}", e),
        },
    };

    // Parse program ID
    let program_id_native = match ProgramID::<CurrentNetwork>::from_str(&program_id) {
        Ok(id) => id,
        Err(e) => return ffi::StringResult {
            success: false,
            result: String::new(),
            error: format!("Failed to parse program ID: {}", e),
        },
    };

    // Parse record name
    let record_name_native = match Identifier::<CurrentNetwork>::from_str(&record_name) {
        Ok(id) => id,
        Err(e) => return ffi::StringResult {
            success: false,
            result: String::new(),
            error: format!("Failed to parse record name: {}", e),
        },
    };

    // Compute commitment
    let commitment = match record.to_commitment(&program_id_native, &record_name_native, &record_view_key_field) {
        Ok(c) => c,
        Err(e) => return ffi::StringResult {
            success: false,
            result: String::new(),
            error: format!("Failed to compute commitment: {}", e),
        },
    };

    // Compute serial number
    match RecordPlaintext::<CurrentNetwork>::serial_number(private_key, commitment) {
        Ok(serial_number) => ffi::StringResult {
            success: true,
            result: serial_number.to_string(),
            error: String::new(),
        },
        Err(e) => ffi::StringResult {
            success: false,
            result: String::new(),
            error: format!("Failed to compute serial number: {}", e),
        },
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::account::private_key::private_key_from_string;
    use crate::account::view_key::view_key_from_string;

    const KNOWN_PRIVATE_KEY: &str = "APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH";
    const KNOWN_VIEW_KEY: &str = "AViewKey1mSnpFFC8Mj4fXbK5YiWgZ3mjiV8CxA79bYNa8ymUpTrw";

    #[test]
    fn record_plaintext_from_string_valid() {
        let plaintext = "{ owner: aleo1qnr4dkkvkgfqph0vzc3y6z2eu975wnpz2925ntjccd5cfqxtyu8s7pyjh9.private, microcredits: 100u64.private, _nonce: 0group.public }";
        let handle = record_plaintext_from_string(plaintext.to_string());
        assert_ne!(handle.id, 0, "Valid plaintext should produce a non-zero handle");
    }

    #[test]
    fn record_plaintext_from_string_invalid() {
        let handle = record_plaintext_from_string("not a valid record".to_string());
        assert_eq!(handle.id, 0, "Invalid plaintext should produce a zero handle");
    }

    #[test]
    fn record_plaintext_to_commitment_valid() {
        let plaintext = "{ owner: aleo1qnr4dkkvkgfqph0vzc3y6z2eu975wnpz2925ntjccd5cfqxtyu8s7pyjh9.private, microcredits: 100u64.private, _nonce: 0group.public }";
        let vk_handle = view_key_from_string(KNOWN_VIEW_KEY.to_string());
        assert_ne!(vk_handle.id, 0);

        let result = record_plaintext_to_commitment(
            plaintext.to_string(),
            "credits.aleo".to_string(),
            "credits".to_string(),
            &vk_handle,
        );
        assert!(result.success, "Commitment should succeed: {}", result.error);
        assert!(!result.result.is_empty());
    }

    #[test]
    fn record_plaintext_to_serial_number_valid() {
        let plaintext = "{ owner: aleo1qnr4dkkvkgfqph0vzc3y6z2eu975wnpz2925ntjccd5cfqxtyu8s7pyjh9.private, microcredits: 100u64.private, _nonce: 0group.public }";
        let pk_handle = private_key_from_string(KNOWN_PRIVATE_KEY.to_string());
        assert_ne!(pk_handle.id, 0);

        let vk_handle = view_key_from_string(KNOWN_VIEW_KEY.to_string());
        assert_ne!(vk_handle.id, 0);

        // Compute the record view key
        let commitment_result = record_plaintext_to_commitment(
            plaintext.to_string(),
            "credits.aleo".to_string(),
            "credits".to_string(),
            &vk_handle,
        );
        assert!(commitment_result.success, "Commitment should succeed: {}", commitment_result.error);

        // Compute the record view key field
        let record = RecordPlaintext::<CurrentNetwork>::from_str(plaintext).unwrap();
        let view_key_storage = ensure_view_key_storage();
        let view_keys = view_key_storage.lock().unwrap();
        let view_key = view_keys.get(&vk_handle.id).unwrap();
        let record_view_key = (*record.nonce() * **view_key).to_x_coordinate();
        drop(view_keys);

        let result = record_plaintext_to_serial_number(
            plaintext.to_string(),
            &pk_handle,
            "credits.aleo".to_string(),
            "credits".to_string(),
            record_view_key.to_string(),
        );
        assert!(result.success, "Serial number should succeed: {}", result.error);
        assert!(!result.result.is_empty());
        assert!(result.result.contains("field"), "Serial number should be a field element: {}", result.result);
    }

    #[test]
    fn record_plaintext_to_serial_number_invalid_private_key() {
        let plaintext = "{ owner: aleo1qnr4dkkvkgfqph0vzc3y6z2eu975wnpz2925ntjccd5cfqxtyu8s7pyjh9.private, microcredits: 100u64.private, _nonce: 0group.public }";
        let invalid_pk_handle = ffi::PrivateKeyHandle { id: 999_999 };

        let result = record_plaintext_to_serial_number(
            plaintext.to_string(),
            &invalid_pk_handle,
            "credits.aleo".to_string(),
            "credits".to_string(),
            "0field".to_string(),
        );
        assert!(!result.success);
        assert!(result.error.contains("Invalid private key"));
    }

    #[test]
    fn record_plaintext_to_serial_number_deterministic() {
        let plaintext = "{ owner: aleo1qnr4dkkvkgfqph0vzc3y6z2eu975wnpz2925ntjccd5cfqxtyu8s7pyjh9.private, microcredits: 100u64.private, _nonce: 0group.public }";
        let pk_handle = private_key_from_string(KNOWN_PRIVATE_KEY.to_string());
        let vk_handle = view_key_from_string(KNOWN_VIEW_KEY.to_string());

        // Compute record view key
        let record = RecordPlaintext::<CurrentNetwork>::from_str(plaintext).unwrap();
        let view_key_storage = ensure_view_key_storage();
        let view_keys = view_key_storage.lock().unwrap();
        let view_key = view_keys.get(&vk_handle.id).unwrap();
        let record_view_key = (*record.nonce() * **view_key).to_x_coordinate();
        drop(view_keys);

        let result1 = record_plaintext_to_serial_number(
            plaintext.to_string(),
            &pk_handle,
            "credits.aleo".to_string(),
            "credits".to_string(),
            record_view_key.to_string(),
        );
        let result2 = record_plaintext_to_serial_number(
            plaintext.to_string(),
            &pk_handle,
            "credits.aleo".to_string(),
            "credits".to_string(),
            record_view_key.to_string(),
        );
        assert!(result1.success && result2.success);
        assert_eq!(result1.result, result2.result, "Serial number derivation should be deterministic");
    }
}
