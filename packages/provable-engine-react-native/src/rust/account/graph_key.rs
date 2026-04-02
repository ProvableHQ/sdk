use crate::{error_result, ffi, success_result, types::*};
use std::str::FromStr;

/// Derive a graph key from a private key string.
/// The graph key contains `sk_tag` which is used for record tag derivation.
pub fn graph_key_from_private_key(private_key_str: String) -> ffi::AccountResult {
    // Parse the private key
    let private_key = match PrivateKey::<CurrentNetwork>::from_str(&private_key_str) {
        Ok(pk) => pk,
        Err(e) => return error_result(format!("Failed to parse private key: {}", e)),
    };

    // Derive the view key
    let view_key = match ViewKey::<CurrentNetwork>::try_from(&private_key) {
        Ok(vk) => vk,
        Err(e) => return error_result(format!("Failed to derive view key: {}", e)),
    };

    // Derive the graph key
    let graph_key = match GraphKey::<CurrentNetwork>::try_from(&view_key) {
        Ok(gk) => gk,
        Err(e) => return error_result(format!("Failed to derive graph key: {}", e)),
    };

    success_result(graph_key.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    const KNOWN_PRIVATE_KEY: &str =
        "APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH";

    #[test]
    fn graph_key_from_valid_private_key() {
        let result = graph_key_from_private_key(KNOWN_PRIVATE_KEY.to_string());
        assert!(result.success, "Should succeed: {}", result.error);
        assert!(
            result.result.starts_with("AGraphKey1"),
            "Graph key should start with AGraphKey1, got: {}",
            result.result
        );
    }

    #[test]
    fn graph_key_from_invalid_private_key() {
        let result = graph_key_from_private_key("invalid_key".to_string());
        assert!(!result.success);
        assert!(result.error.contains("Failed to parse private key"));
    }

    #[test]
    fn graph_key_deterministic() {
        let result1 = graph_key_from_private_key(KNOWN_PRIVATE_KEY.to_string());
        let result2 = graph_key_from_private_key(KNOWN_PRIVATE_KEY.to_string());
        assert!(result1.success && result2.success);
        assert_eq!(
            result1.result, result2.result,
            "Graph key derivation should be deterministic"
        );
    }
}
