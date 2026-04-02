use crate::{
    authorization_error_result, authorization_success_result, bytes_error_result,
    bytes_success_result, ensure_authorization_storage, ffi, get_next_id, string_error_result,
    string_success_result, types::*,
};
use snarkvm_console::prelude::{FromBytes, ToBytes};

/// Creates a valid empty authorization for testing purposes
fn create_empty_authorization() -> Result<Authorization<CurrentNetwork>, String> {
    Authorization::<CurrentNetwork>::try_from((vec![], vec![]))
        .map_err(|e| format!("Failed to create empty authorization: {}", e))
}

/// Creates a valid empty authorization string for testing purposes
pub fn create_test_authorization_string() -> Result<String, String> {
    let authorization = create_empty_authorization()?;
    Ok(authorization.to_string())
}

pub fn authorization_from_string(authorization_str: String) -> ffi::AuthorizationResult {
    match authorization_str.parse::<Authorization<CurrentNetwork>>() {
        Ok(authorization) => {
            let id = get_next_id();
            let storage = ensure_authorization_storage();
            let mut authorizations = storage.lock().unwrap();
            authorizations.insert(id, authorization);
            authorization_success_result(id)
        }
        Err(e) => authorization_error_result(format!("Failed to parse authorization: {}", e)),
    }
}

pub fn authorization_from_bytes_le(bytes: Vec<u8>) -> ffi::AuthorizationResult {
    match Authorization::<CurrentNetwork>::from_bytes_le(&bytes) {
        Ok(authorization) => {
            let id = get_next_id();
            let storage = ensure_authorization_storage();
            let mut authorizations = storage.lock().unwrap();
            authorizations.insert(id, authorization);
            authorization_success_result(id)
        }
        Err(e) => {
            authorization_error_result(format!("Failed to parse authorization from bytes: {}", e))
        }
    }
}

pub fn authorization_from_requests_and_transitions(
    requests: Vec<String>,
    transitions: Vec<String>,
) -> ffi::AuthorizationResult {
    let parsed_requests: Vec<snarkvm_console::program::Request<CurrentNetwork>> = match requests
        .iter()
        .map(|r| serde_json::from_str(r))
        .collect::<Result<Vec<_>, _>>()
    {
        Ok(reqs) => reqs,
        Err(e) => {
            return authorization_error_result(format!(
                "Failed to create authorization from requests and transitions: {}",
                e
            ));
        }
    };

    let parsed_transitions: Vec<TransitionNative> = match transitions
        .iter()
        .map(|t| serde_json::from_str(t))
        .collect::<Result<Vec<_>, _>>()
    {
        Ok(trans) => trans,
        Err(e) => {
            return authorization_error_result(format!(
                "Failed to create authorization from requests and transitions: {}",
                e
            ));
        }
    };

    match Authorization::<CurrentNetwork>::try_from((parsed_requests, parsed_transitions)) {
        Ok(authorization) => {
            let id = get_next_id();
            let storage = ensure_authorization_storage();
            let mut authorizations = storage.lock().unwrap();
            authorizations.insert(id, authorization);
            authorization_success_result(id)
        }
        Err(e) => authorization_error_result(format!(
            "Failed to create authorization from requests and transitions: {}",
            e
        )),
    }
}

pub fn authorization_to_string(handle: u64) -> ffi::StringResult {
    let storage = ensure_authorization_storage();
    let authorizations = storage.lock().unwrap();

    if let Some(authorization) = authorizations.get(&handle) {
        string_success_result(authorization.to_string())
    } else {
        string_error_result("Invalid authorization handle".to_string())
    }
}

pub fn authorization_to_bytes_le(handle: u64) -> ffi::BytesResult {
    let storage = ensure_authorization_storage();
    let authorizations = storage.lock().unwrap();

    if let Some(authorization) = authorizations.get(&handle) {
        match authorization.to_bytes_le() {
            Ok(bytes) => bytes_success_result(bytes),
            Err(e) => bytes_error_result(format!("Failed to serialize authorization: {}", e)),
        }
    } else {
        bytes_error_result("Invalid authorization handle".to_string())
    }
}

pub fn authorization_to_json(handle: u64) -> ffi::StringResult {
    let storage = ensure_authorization_storage();
    let authorizations = storage.lock().unwrap();

    if let Some(authorization) = authorizations.get(&handle) {
        match serde_json::to_string(authorization) {
            Ok(json) => string_success_result(json),
            Err(e) => string_error_result(format!("Failed to serialize authorization to JSON: {}", e)),
        }
    } else {
        string_error_result("Invalid authorization handle".to_string())
    }
}

pub fn authorization_get_requests(handle: u64) -> ffi::StringResult {
    let storage = ensure_authorization_storage();
    let authorizations = storage.lock().unwrap();

    if let Some(authorization) = authorizations.get(&handle) {
        let requests = authorization.to_vec_deque();
        let serialized: Result<Vec<String>, _> = requests
            .iter()
            .map(|r| serde_json::to_string(r))
            .collect();
        match serialized {
            Ok(items) => string_success_result(format!("[{}]", items.join(","))),
            Err(e) => string_error_result(format!("Failed to serialize requests: {}", e)),
        }
    } else {
        string_error_result("Invalid authorization handle".to_string())
    }
}

pub fn authorization_get_transitions(handle: u64) -> ffi::StringResult {
    let storage = ensure_authorization_storage();
    let authorizations = storage.lock().unwrap();

    if let Some(authorization) = authorizations.get(&handle) {
        let transitions = authorization.transitions();
        let serialized: Result<Vec<String>, _> = transitions
            .values()
            .map(|t| serde_json::to_string(t))
            .collect();
        match serialized {
            Ok(items) => string_success_result(format!("[{}]", items.join(","))),
            Err(e) => string_error_result(format!("Failed to serialize transitions: {}", e)),
        }
    } else {
        string_error_result("Invalid authorization handle".to_string())
    }
}

pub fn authorization_insert_transition(
    handle: u64,
    transition_str: String,
) -> ffi::AuthorizationResult {
    let storage = ensure_authorization_storage();
    let authorizations = storage.lock().unwrap();

    if let Some(authorization) = authorizations.get(&handle) {
        // Parse the transition from JSON
        let transition: TransitionNative = match serde_json::from_str(&transition_str) {
            Ok(t) => t,
            Err(e) => {
                return authorization_error_result(format!(
                    "Failed to parse transition: {}",
                    e
                ))
            }
        };

        // Insert the transition into the authorization
        match authorization.insert_transition(transition) {
            Ok(()) => authorization_success_result(handle),
            Err(e) => authorization_error_result(format!(
                "Failed to insert transition: {}",
                e
            )),
        }
    } else {
        authorization_error_result("Invalid authorization handle".to_string())
    }
}

pub fn authorization_replicate(handle: u64) -> ffi::AuthorizationResult {
    let storage = ensure_authorization_storage();
    let authorizations = storage.lock().unwrap();

    if let Some(authorization) = authorizations.get(&handle) {
        let cloned_authorization = authorization.clone();
        drop(authorizations); // Release the lock before acquiring it again

        let id = get_next_id();
        let storage = ensure_authorization_storage();
        let mut new_authorizations = storage.lock().unwrap();
        new_authorizations.insert(id, cloned_authorization);
        authorization_success_result(id)
    } else {
        authorization_error_result("Invalid authorization handle".to_string())
    }
}

pub fn authorization_verify(handle: u64) -> bool {
    let storage = ensure_authorization_storage();
    let authorizations = storage.lock().unwrap();

    if let Some(authorization) = authorizations.get(&handle) {
        // Perform basic validation - check that authorization can be serialized
        match authorization.to_bytes_le() {
            Ok(_) => true,
            Err(_) => false,
        }
    } else {
        false
    }
}

pub fn destroy_authorization(handle: u64) {
    let storage = ensure_authorization_storage();
    let mut authorizations = storage.lock().unwrap();
    authorizations.remove(&handle);
}

pub fn authorization_equals(handle1: u64, handle2: u64) -> bool {
    let storage = ensure_authorization_storage();
    let authorizations = storage.lock().unwrap();

    if let (Some(auth1), Some(auth2)) = (authorizations.get(&handle1), authorizations.get(&handle2))
    {
        // Use proper equality comparison
        auth1 == auth2
    } else {
        false
    }
}

pub fn authorization_len(handle: u64) -> f64 {
    let storage = ensure_authorization_storage();
    let authorizations = storage.lock().unwrap();

    if let Some(authorization) = authorizations.get(&handle) {
        // Return the byte length since we can't access the requests directly
        match authorization.to_bytes_le() {
            Ok(bytes) => bytes.len() as f64,
            Err(_) => 0.0,
        }
    } else {
        0.0
    }
}

pub fn authorization_is_empty(handle: u64) -> bool {
    let storage = ensure_authorization_storage();
    let authorizations = storage.lock().unwrap();

    if let Some(authorization) = authorizations.get(&handle) {
        // Check if authorization is effectively empty by creating a reference empty authorization
        // and comparing their string representations
        match Authorization::<CurrentNetwork>::try_from((vec![], vec![])) {
            Ok(empty_auth) => {
                let auth_str = authorization.to_string();
                let empty_str = empty_auth.to_string();
                auth_str == empty_str
            }
            Err(_) => {
                // If we can't create an empty authorization, fall back to string length check
                let auth_str = authorization.to_string();
                auth_str.len() <= 64
            }
        }
    } else {
        true
    }
}

pub fn authorization_is_fee_private(handle: u64) -> bool {
    let storage = ensure_authorization_storage();
    let authorizations = storage.lock().unwrap();

    if let Some(authorization) = authorizations.get(&handle) {
        // Check if this authorization contains fee-related private operations
        // This is a simplified check based on string representation
        let auth_str = authorization.to_string();
        auth_str.contains("fee") && auth_str.contains("private")
    } else {
        false
    }
}

pub fn authorization_is_fee_public(handle: u64) -> bool {
    let storage = ensure_authorization_storage();
    let authorizations = storage.lock().unwrap();

    if let Some(authorization) = authorizations.get(&handle) {
        // Check if this authorization contains fee-related public operations
        // This is a simplified check based on string representation
        let auth_str = authorization.to_string();
        auth_str.contains("fee") && auth_str.contains("public")
    } else {
        false
    }
}

pub fn authorization_is_split(handle: u64) -> bool {
    let storage = ensure_authorization_storage();
    let authorizations = storage.lock().unwrap();

    if let Some(authorization) = authorizations.get(&handle) {
        // Check if this authorization contains split-related operations
        // This is a simplified check based on string representation
        let auth_str = authorization.to_string();
        auth_str.contains("split")
    } else {
        false
    }
}

pub fn authorization_to_execution_id(handle: u64) -> ffi::StringResult {
    let storage = ensure_authorization_storage();
    let authorizations = storage.lock().unwrap();

    if let Some(authorization) = authorizations.get(&handle) {
        match authorization.to_execution_id() {
            Ok(execution_id) => string_success_result(execution_id.to_string()),
            Err(e) => string_error_result(format!("Failed to get execution ID: {}", e)),
        }
    } else {
        string_error_result("Invalid authorization handle".to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Create an empty authorization and return its handle ID.
    fn create_empty_auth_handle() -> u64 {
        let result = authorization_from_requests_and_transitions(vec![], vec![]);
        assert!(result.success, "Empty authorization creation should succeed: {}", result.error);
        assert_ne!(result.handle, 0);
        result.handle
    }

    #[test]
    fn empty_authorization_roundtrip_string() {
        let handle = create_empty_auth_handle();

        let str_result = authorization_to_string(handle);
        assert!(str_result.success, "to_string should succeed: {}", str_result.error);
        assert!(!str_result.result.is_empty());

        // Parse back from string
        let parsed = authorization_from_string(str_result.result.clone());
        assert!(parsed.success, "from_string should succeed: {}", parsed.error);
        assert_ne!(parsed.handle, 0);

        // Verify equality
        assert!(authorization_equals(handle, parsed.handle));

        destroy_authorization(handle);
        destroy_authorization(parsed.handle);
    }

    #[test]
    fn empty_authorization_roundtrip_bytes() {
        let handle = create_empty_auth_handle();

        let bytes_result = authorization_to_bytes_le(handle);
        assert!(bytes_result.success, "to_bytes should succeed: {}", bytes_result.error);
        assert!(!bytes_result.bytes.is_empty());

        // snarkVM's Authorization::read_le requires at least one request, so
        // an empty authorization cannot round-trip through bytes. Verify that
        // from_bytes reports a clear error rather than panicking.
        let parsed = authorization_from_bytes_le(bytes_result.bytes);
        assert!(!parsed.success, "from_bytes should fail for empty authorization");
        assert!(
            parsed.error.contains("no requests"),
            "Error should mention missing requests: {}",
            parsed.error
        );

        destroy_authorization(handle);
    }

    #[test]
    fn empty_authorization_to_json() {
        let handle = create_empty_auth_handle();

        let json_result = authorization_to_json(handle);
        assert!(json_result.success, "to_json should succeed: {}", json_result.error);

        // Verify the JSON has the expected structure
        let json: serde_json::Value = serde_json::from_str(&json_result.result)
            .expect("Should produce valid JSON");
        assert!(json.is_object(), "Authorization JSON should be an object");
        // Authorization JSON should contain requests and transitions arrays
        assert!(json.get("requests").is_some(), "JSON should have 'requests' key");
        assert!(json.get("transitions").is_some(), "JSON should have 'transitions' key");

        let requests = json["requests"].as_array().expect("requests should be an array");
        let transitions = json["transitions"].as_array().expect("transitions should be an array");
        assert_eq!(requests.len(), 0, "Empty auth should have 0 requests");
        assert_eq!(transitions.len(), 0, "Empty auth should have 0 transitions");

        destroy_authorization(handle);
    }

    #[test]
    fn empty_authorization_get_requests_returns_empty_array() {
        let handle = create_empty_auth_handle();

        let result = authorization_get_requests(handle);
        assert!(result.success, "get_requests should succeed: {}", result.error);
        assert_eq!(result.result, "[]", "Empty auth should have empty requests array");

        destroy_authorization(handle);
    }

    #[test]
    fn empty_authorization_get_transitions_returns_empty_array() {
        let handle = create_empty_auth_handle();

        let result = authorization_get_transitions(handle);
        assert!(result.success, "get_transitions should succeed: {}", result.error);
        assert_eq!(result.result, "[]", "Empty auth should have empty transitions array");

        destroy_authorization(handle);
    }

    #[test]
    fn authorization_to_json_roundtrip_via_requests_and_transitions() {
        // Create an empty authorization, serialize to JSON, extract requests/transitions,
        // and reconstruct, verifying the JSON to Rust roundtrip works
        let handle = create_empty_auth_handle();

        let requests_result = authorization_get_requests(handle);
        let transitions_result = authorization_get_transitions(handle);
        assert!(requests_result.success);
        assert!(transitions_result.success);

        // Parse the JSON arrays to get individual items
        let request_items: Vec<String> = serde_json::from_str(&requests_result.result)
            .unwrap_or_default();
        let transition_items: Vec<String> = serde_json::from_str(&transitions_result.result)
            .unwrap_or_default();

        // Reconstruct from the extracted JSON items
        let reconstructed = authorization_from_requests_and_transitions(
            request_items,
            transition_items,
        );
        assert!(reconstructed.success, "Reconstruction should succeed: {}", reconstructed.error);

        // Both should be equal
        assert!(authorization_equals(handle, reconstructed.handle));

        destroy_authorization(handle);
        destroy_authorization(reconstructed.handle);
    }

    #[test]
    fn authorization_from_invalid_string_returns_error() {
        let result = authorization_from_string("not valid".to_string());
        assert!(!result.success);
        assert!(result.error.contains("Failed to parse"));
    }

    #[test]
    fn authorization_from_invalid_bytes_returns_error() {
        let result = authorization_from_bytes_le(vec![0, 1, 2, 3]);
        assert!(!result.success);
        assert!(result.error.contains("Failed to parse"));
    }

    #[test]
    fn authorization_from_invalid_request_json_returns_error() {
        let result = authorization_from_requests_and_transitions(
            vec!["not valid json".to_string()],
            vec![],
        );
        assert!(!result.success);
        assert!(result.error.contains("Failed to create authorization"));
    }

    #[test]
    fn authorization_from_invalid_transition_json_returns_error() {
        let result = authorization_from_requests_and_transitions(
            vec![],
            vec!["not valid json".to_string()],
        );
        assert!(!result.success);
        assert!(result.error.contains("Failed to create authorization"));
    }

    #[test]
    fn authorization_invalid_handle_operations() {
        let bad_handle = 999_999u64;

        let str_result = authorization_to_string(bad_handle);
        assert!(!str_result.success);
        assert!(str_result.error.contains("Invalid authorization handle"));

        let bytes_result = authorization_to_bytes_le(bad_handle);
        assert!(!bytes_result.success);

        let json_result = authorization_to_json(bad_handle);
        assert!(!json_result.success);

        let req_result = authorization_get_requests(bad_handle);
        assert!(!req_result.success);

        let tr_result = authorization_get_transitions(bad_handle);
        assert!(!tr_result.success);

        assert!(!authorization_verify(bad_handle));
        assert!(authorization_is_empty(bad_handle));
    }

    #[test]
    fn authorization_replicate_creates_independent_copy() {
        let handle = create_empty_auth_handle();

        let clone_result = authorization_replicate(handle);
        assert!(clone_result.success, "Replicate should succeed: {}", clone_result.error);
        assert_ne!(clone_result.handle, handle, "Clone should have different handle");

        assert!(authorization_equals(handle, clone_result.handle));

        // Destroying the original should not affect the clone
        destroy_authorization(handle);
        let str_result = authorization_to_string(clone_result.handle);
        assert!(str_result.success, "Clone should still be valid after original destroyed");

        destroy_authorization(clone_result.handle);
    }

    #[test]
    fn empty_authorization_verify_succeeds() {
        let handle = create_empty_auth_handle();
        assert!(authorization_verify(handle));
        destroy_authorization(handle);
    }

    #[test]
    fn empty_authorization_is_empty() {
        let handle = create_empty_auth_handle();
        assert!(authorization_is_empty(handle));
        destroy_authorization(handle);
    }

    #[test]
    fn authorization_insert_transition_with_invalid_handle() {
        let result = authorization_insert_transition(999_999, "{}".to_string());
        assert!(!result.success);
        assert!(result.error.contains("Invalid authorization handle"));
    }

    #[test]
    fn authorization_insert_transition_with_invalid_json() {
        let handle = create_empty_auth_handle();

        let result = authorization_insert_transition(handle, "not valid json".to_string());
        assert!(!result.success);
        assert!(
            result.error.contains("Failed to parse transition"),
            "Error should mention parsing: {}",
            result.error
        );

        destroy_authorization(handle);
    }
}
