use crate::{bool_success_result, bool_error_result, string_success_result, string_error_result, ffi};

/// Generate a BIP39 mnemonic using cryptographically secure random entropy.
pub fn generate_mnemonic() -> ffi::StringResult {
    let mnemonic = bip39::Mnemonic::generate_in(bip39::Language::English, 12);
    match mnemonic {
        Ok(m) => string_success_result(m.to_string()),
        Err(e) => string_error_result(format!("Failed to generate mnemonic: {}", e)),
    }
}

/// Verify that a string is a valid BIP39 mnemonic with correct checksum.
pub fn verify_mnemonic(mnemonic: String) -> ffi::BoolResult {
    match bip39::Mnemonic::parse_in(bip39::Language::English, &mnemonic) {
        Ok(_) => bool_success_result(true),
        Err(_) => bool_success_result(false),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashSet;

    const VALID_MNEMONIC: &str =
        "ozone drill grab fiber curtain grace pudding thank cruise elder eight picnic";

    #[test]
    fn generate_mnemonic_returns_success() {
        let result = generate_mnemonic();
        assert!(result.success, "generate_mnemonic should succeed: {}", result.error);
        assert!(!result.result.is_empty(), "mnemonic should not be empty");
    }

    #[test]
    fn generate_mnemonic_returns_12_words() {
        let result = generate_mnemonic();
        assert!(result.success);
        let words: Vec<&str> = result.result.split_whitespace().collect();
        assert_eq!(words.len(), 12, "mnemonic should contain exactly 12 words, got {}", words.len());
    }

    #[test]
    fn generate_mnemonic_produces_valid_bip39() {
        let result = generate_mnemonic();
        assert!(result.success);
        let verify_result = verify_mnemonic(result.result);
        assert!(verify_result.success);
        assert!(verify_result.result, "generated mnemonic should be valid BIP39");
    }

    #[test]
    fn generate_mnemonic_is_unique() {
        let mut seen = HashSet::new();
        for _ in 0..5 {
            let result = generate_mnemonic();
            assert!(result.success);
            assert!(
                seen.insert(result.result.clone()),
                "generate_mnemonic returned a duplicate: '{}' — may still be hardcoded",
                result.result
            );
        }
    }

    #[test]
    fn generate_mnemonic_words_are_all_bip39_wordlist() {
        let result = generate_mnemonic();
        assert!(result.success);
        let wordlist = bip39::Language::English.word_list();
        for word in result.result.split_whitespace() {
            assert!(
                wordlist.contains(&word),
                "'{}' is not a valid BIP39 English word",
                word
            );
        }
    }

    #[test]
    fn verify_mnemonic_accepts_valid_mnemonic() {
        let result = verify_mnemonic(VALID_MNEMONIC.to_string());
        assert!(result.success, "verify_mnemonic should succeed: {}", result.error);
        assert!(result.result, "valid mnemonic should be accepted");
    }

    #[test]
    fn verify_mnemonic_rejects_empty_string() {
        let result = verify_mnemonic(String::new());
        assert!(result.success, "verify_mnemonic should succeed (not error) even for invalid input");
        assert!(!result.result, "empty string should not be a valid mnemonic");
    }

    #[test]
    fn verify_mnemonic_rejects_random_words() {
        let result = verify_mnemonic("hello world foo bar baz qux quux corge grault garply waldo fred".to_string());
        assert!(result.success);
        assert!(!result.result, "random non-BIP39 words should be rejected");
    }

    #[test]
    fn verify_mnemonic_rejects_wrong_word_count() {
        let result = verify_mnemonic(
            "ozone drill grab fiber curtain grace pudding thank cruise elder eight".to_string(),
        );
        assert!(result.success);
        assert!(!result.result, "11-word mnemonic should be rejected");
    }

    #[test]
    fn verify_mnemonic_rejects_bad_checksum() {
        let result = verify_mnemonic(
            "ozone drill grab fiber curtain grace pudding thank cruise elder eight zone".to_string(),
        );
        assert!(result.success);
        assert!(!result.result, "mnemonic with invalid checksum should be rejected");
    }

    #[test]
    fn verify_mnemonic_accepts_24_word_mnemonic() {
        let mnemonic = bip39::Mnemonic::generate_in(bip39::Language::English, 24).unwrap();
        let result = verify_mnemonic(mnemonic.to_string());
        assert!(result.success);
        assert!(result.result, "valid 24-word mnemonic should be accepted");
    }

    #[test]
    fn verify_mnemonic_handles_extra_whitespace() {
        let result = verify_mnemonic(
            "  ozone  drill  grab  fiber  curtain  grace  pudding  thank  cruise  elder  eight  picnic  ".to_string(),
        );
        assert!(result.success);
        assert!(result.result, "mnemonic with extra whitespace should still be valid");
    }

    #[test]
    fn round_trip_generate_then_verify() {
        for _ in 0..10 {
            let gen = generate_mnemonic();
            assert!(gen.success);
            let ver = verify_mnemonic(gen.result);
            assert!(ver.success);
            assert!(ver.result, "every generated mnemonic must pass verification");
        }
    }
}
