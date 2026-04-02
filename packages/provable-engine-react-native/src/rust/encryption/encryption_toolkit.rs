use crate::{
    encryption::field::{field_from_value, FieldHandle},
    ensure_record_ciphertext_storage, ensure_view_key_storage, ffi,
    types::*,
};

type Result<T> = std::result::Result<T, String>;

pub fn generate_record_view_key(
    view_key_handle: &ffi::ViewKeyHandle,
    record_ciphertext_handle: &ffi::RecordCiphertextHandle,
) -> Result<Box<FieldHandle>> {
    let view_key_storage = ensure_view_key_storage();
    let view_keys = view_key_storage.lock().unwrap();

    let ciphertext_storage = ensure_record_ciphertext_storage();
    let ciphertexts = ciphertext_storage.lock().unwrap();

    if let (Some(view_key), Some(ciphertext)) = (
        view_keys.get(&view_key_handle.id),
        ciphertexts.get(&record_ciphertext_handle.id),
    ) {
        // record_view_key = (nonce * view_key_scalar).to_x_coordinate()
        // ViewKey<N> derefs to Scalar<N>, so **view_key yields the scalar value.
        let record_view_key = (*ciphertext.nonce() * **view_key).to_x_coordinate();
        Ok(field_from_value(record_view_key))
    } else {
        Err("Invalid view key or record ciphertext handle".to_string())
    }
}

pub fn generate_transition_view_key(
    view_key_handle: &ffi::ViewKeyHandle,
    transition_public_key_handle: &crate::GroupHandle,
) -> Result<Box<FieldHandle>> {
    let view_key_storage = ensure_view_key_storage();
    let view_keys = view_key_storage.lock().unwrap();

    if let Some(view_key) = view_keys.get(&view_key_handle.id) {
        let tpk = transition_public_key_handle.clone_value();
        // tvk = (tpk * view_key_scalar).to_x_coordinate()
        // ViewKey<N> derefs to Scalar<N>, so **view_key yields the scalar value.
        let tvk = (tpk * **view_key).to_x_coordinate();
        Ok(field_from_value(tvk))
    } else {
        Err("Invalid view key or transition public key handle".to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::account::view_key::view_key_from_string;
    use crate::encryption::record_ciphertext::record_ciphertext_from_string;
    use crate::encryption::group::group_from_string;

    const KNOWN_VIEW_KEY: &str = "AViewKey1mSnpFFC8Mj4fXbK5YiWgZ3mjiV8CxA79bYNa8ymUpTrw";

    #[test]
    fn generate_record_view_key_with_invalid_handles_returns_error() {
        let vk_handle = ffi::ViewKeyHandle { id: 999_999 };
        let ct_handle = ffi::RecordCiphertextHandle { id: 999_999 };
        let result = generate_record_view_key(&vk_handle, &ct_handle);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Invalid view key"));
    }

    #[test]
    fn generate_transition_view_key_with_invalid_view_key_returns_error() {
        let vk_handle = ffi::ViewKeyHandle { id: 999_999 };
        let group_handle = group_from_string("0group".to_string()).unwrap();
        let result = generate_transition_view_key(&vk_handle, &group_handle);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Invalid view key"));
    }

    #[test]
    fn generate_transition_view_key_with_valid_inputs_returns_field() {
        use crate::encryption::group::group_from_value;

        let vk_handle = view_key_from_string(KNOWN_VIEW_KEY.to_string());
        assert_ne!(vk_handle.id, 0);

        // Use the curve generator as a dummy tpk (valid non-zero group element)
        let generator = Group::<CurrentNetwork>::generator();
        let group_handle = group_from_value(generator);
        let result = generate_transition_view_key(&vk_handle, &group_handle);
        assert!(result.is_ok(), "Should produce a field: {:?}", result.err());
    }
}
