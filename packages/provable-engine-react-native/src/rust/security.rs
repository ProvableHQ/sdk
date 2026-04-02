use crate::libsodium::{self, SodiumError, PUBLIC_KEY_BYTES, SEAL_BYTES, SECRET_KEY_BYTES};
use crate::{
    bytes_error_result, bytes_success_result, ffi, string_error_result, string_success_result,
};
use base64::{engine::general_purpose::STANDARD, Engine as _};

pub fn crypto_box_seal_base64(public_key_b64: String, message: Vec<u8>) -> ffi::StringResult {
    let public_key_bytes = match STANDARD.decode(public_key_b64.as_bytes()) {
        Ok(bytes) => bytes,
        Err(error) => {
            return string_error_result(format!("invalid base64 public key: {error}"));
        }
    };

    let pk_arr: [u8; PUBLIC_KEY_BYTES] = match public_key_bytes.try_into() {
        Ok(arr) => arr,
        Err(v) => {
            return string_error_result(format!(
                "invalid public key length: expected {}, got {}",
                PUBLIC_KEY_BYTES,
                v.len()
            ));
        }
    };

    let sealed = match libsodium::encrypt(message.as_slice(), pk_arr) {
        Ok(ciphertext) => ciphertext,
        Err(_) => return string_error_result("encryption failed".to_string()),
    };

    string_success_result(STANDARD.encode(sealed))
}

pub fn crypto_box_seal_open_base64(
    public_key_b64: String,
    private_key_b64: String,
    sealed_b64: String,
) -> ffi::BytesResult {
    let public_key_bytes = match STANDARD.decode(public_key_b64.as_bytes()) {
        Ok(bytes) => bytes,
        Err(error) => {
            return bytes_error_result(format!("invalid base64 public key: {error}"));
        }
    };
    let private_key_bytes = match STANDARD.decode(private_key_b64.as_bytes()) {
        Ok(bytes) => bytes,
        Err(error) => {
            return bytes_error_result(format!("invalid base64 private key: {error}"));
        }
    };
    let sealed_bytes = match STANDARD.decode(sealed_b64.as_bytes()) {
        Ok(bytes) => bytes,
        Err(error) => {
            return bytes_error_result(format!("invalid base64 sealed payload: {error}"));
        }
    };

    let recipient_pk_arr: [u8; PUBLIC_KEY_BYTES] = match public_key_bytes.try_into() {
        Ok(arr) => arr,
        Err(v) => {
            return bytes_error_result(format!(
                "invalid public key length: expected {}, got {}",
                PUBLIC_KEY_BYTES,
                v.len()
            ));
        }
    };
    let recipient_sk_arr: [u8; SECRET_KEY_BYTES] = match private_key_bytes.try_into() {
        Ok(arr) => arr,
        Err(v) => {
            return bytes_error_result(format!(
                "invalid private key length: expected {}, got {}",
                SECRET_KEY_BYTES,
                v.len()
            ));
        }
    };
    if sealed_bytes.len() < SEAL_BYTES {
        return bytes_error_result(format!(
            "sealed payload too short: expected at least {} bytes, got {}",
            SEAL_BYTES,
            sealed_bytes.len()
        ));
    }

    match libsodium::decrypt(&sealed_bytes, recipient_pk_arr, recipient_sk_arr) {
        Ok(plaintext) => bytes_success_result(plaintext),
        Err(SodiumError::CiphertextTooShort) => bytes_error_result(format!(
            "sealed payload too short: expected at least {} bytes, got {}",
            SEAL_BYTES,
            sealed_bytes.len()
        )),
        Err(_) => bytes_error_result("decryption failed".to_string()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn random_keypair_b64() -> (String, String) {
        let (pk, sk) = libsodium::keypair().expect("keypair should succeed");
        (STANDARD.encode(pk), STANDARD.encode(sk))
    }

    fn random_pk_b64() -> String {
        let (pk_b64, _) = random_keypair_b64();
        pk_b64
    }

    #[test]
    fn seal_returns_success_with_non_empty_result() {
        let result = crypto_box_seal_base64(random_pk_b64(), b"hello world".to_vec());
        assert!(result.success, "Seal should succeed: {}", result.error);
        assert!(!result.result.is_empty());
        assert!(result.error.is_empty());
    }

    #[test]
    fn seal_output_is_valid_base64() {
        let result = crypto_box_seal_base64(random_pk_b64(), b"test message".to_vec());
        assert!(result.success);
        assert!(
            STANDARD.decode(&result.result).is_ok(),
            "Output should be valid base64"
        );
    }

    #[test]
    fn seal_output_length_is_epk_plus_tag_plus_message() {
        let message = b"hello world".to_vec();
        let msg_len = message.len();
        let result = crypto_box_seal_base64(random_pk_b64(), message);
        assert!(result.success);

        let decoded = STANDARD.decode(&result.result).unwrap();
        assert_eq!(decoded.len(), SEAL_BYTES + msg_len);
    }

    #[test]
    fn seal_empty_message_produces_seal_bytes_output() {
        let result = crypto_box_seal_base64(random_pk_b64(), vec![]);
        assert!(
            result.success,
            "Seal of empty message should succeed: {}",
            result.error
        );

        let decoded = STANDARD.decode(&result.result).unwrap();
        assert_eq!(decoded.len(), SEAL_BYTES);
    }

    #[test]
    fn seal_is_non_deterministic() {
        let pk_b64 = random_pk_b64();
        let message = b"same message".to_vec();
        let result1 = crypto_box_seal_base64(pk_b64.clone(), message.clone());
        let result2 = crypto_box_seal_base64(pk_b64, message);
        assert!(result1.success && result2.success);
        assert_ne!(
            result1.result, result2.result,
            "Each call should use a fresh ephemeral key"
        );
    }

    #[test]
    fn seal_with_invalid_base64_key_returns_error() {
        let result = crypto_box_seal_base64("not valid base64!!!".to_string(), b"hello".to_vec());
        assert!(!result.success);
        assert!(result.error.contains("invalid base64 public key"));
    }

    #[test]
    fn seal_with_31_byte_key_returns_error() {
        let short_key = STANDARD.encode([0u8; 31]);
        let result = crypto_box_seal_base64(short_key, b"hello".to_vec());
        assert!(!result.success);
        assert!(result.error.contains("invalid public key length"));
    }

    #[test]
    fn seal_with_33_byte_key_returns_error() {
        let long_key = STANDARD.encode([0u8; 33]);
        let result = crypto_box_seal_base64(long_key, b"hello".to_vec());
        assert!(!result.success);
        assert!(result.error.contains("invalid public key length"));
    }

    #[test]
    fn seal_with_empty_key_returns_error() {
        let result = crypto_box_seal_base64("".to_string(), b"hello".to_vec());
        assert!(!result.success);
        assert!(result.error.contains("invalid public key length"));
    }

    #[test]
    fn seal_open_roundtrip_recovers_original_message() {
        let (pk_b64, sk_b64) = random_keypair_b64();
        let msg = b"roundtrip message bytes".to_vec();

        let sealed = crypto_box_seal_base64(pk_b64.clone(), msg.clone());
        assert!(sealed.success, "Seal should succeed: {}", sealed.error);

        let opened = crypto_box_seal_open_base64(pk_b64, sk_b64, sealed.result);
        assert!(opened.success, "Open should succeed: {}", opened.error);
        assert_eq!(opened.bytes, msg);
    }

    #[test]
    fn seal_open_with_wrong_private_key_fails() {
        let (pk_b64, _recipient_sk_b64) = random_keypair_b64();
        let (_wrong_pk_b64, wrong_sk_b64) = random_keypair_b64();

        let sealed = crypto_box_seal_base64(pk_b64.clone(), b"hello".to_vec());
        assert!(sealed.success);

        let opened = crypto_box_seal_open_base64(pk_b64, wrong_sk_b64, sealed.result);
        assert!(!opened.success);
        assert!(opened.error.contains("decryption failed"));
    }

    #[test]
    fn seal_open_with_tampered_payload_fails() {
        let (pk_b64, sk_b64) = random_keypair_b64();
        let sealed = crypto_box_seal_base64(pk_b64.clone(), b"secret".to_vec());
        assert!(sealed.success);

        let mut tampered = STANDARD.decode(sealed.result.as_bytes()).unwrap();
        let last = tampered.len() - 1;
        tampered[last] ^= 1;
        let tampered_b64 = STANDARD.encode(tampered);

        let opened = crypto_box_seal_open_base64(pk_b64, sk_b64, tampered_b64);
        assert!(!opened.success);
        assert!(opened.error.contains("decryption failed"));
    }

    #[test]
    fn seal_open_with_short_payload_fails() {
        let (pk_b64, sk_b64) = random_keypair_b64();
        let short_payload_b64 = STANDARD.encode([0u8; 10]);

        let opened = crypto_box_seal_open_base64(pk_b64, sk_b64, short_payload_b64);
        assert!(!opened.success);
        assert!(opened.error.contains("sealed payload too short"));
    }

    #[test]
    fn wrapper_constants_match_expected_sizes() {
        assert_eq!(PUBLIC_KEY_BYTES, 32);
        assert_eq!(SECRET_KEY_BYTES, 32);
        assert_eq!(SEAL_BYTES, 48);
    }
}
