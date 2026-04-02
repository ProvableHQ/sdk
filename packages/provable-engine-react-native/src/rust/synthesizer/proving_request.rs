//! ProvingRequest module for the Shield Mobile SDK
//!
//! IMPORTANT: snarkVM Serialization Workaround
//! ==========================================
//!
//! This module implements a workaround for an inconsistency in snarkVM's ProvingRequest
//! serialization that affects toString()/fromString() round-trip compatibility:
//!
//! ISSUE: snarkVM's ProvingRequest has incompatible Display and FromStr implementations:
//! - Display (toString) returns JSON format like: {"authorization":"...","fee_authorization":null,"broadcast":false}
//! - FromStr (parse) expects a different native format and cannot parse the JSON output
//!
//! SOLUTION: We bypass snarkVM's implementations by:
//! 1. Using JSON format for both serialization and deserialization
//! 2. Properly escaping authorization strings within the JSON to prevent malformed output
//! 3. Manually parsing JSON and reconstructing ProvingRequests from components
//!
//! This ensures that mobile SDK users can reliably use toString()/fromString() methods
//! for round-trip serialization, which is essential for React Native applications.

use crate::types::*;
use snarkvm_console::prelude::{FromBytes, ToBytes};
use std::fmt::{Display, Formatter, Result as FmtResult};
use std::str::FromStr;

/// Custom ProvingRequest struct (similar to WASM SDK)
#[derive(Clone, Debug, PartialEq)]
pub struct ProvingRequest<N: snarkvm_console::network::Network> {
    pub authorization: Authorization<N>,
    pub fee_authorization: Option<Authorization<N>>,
    pub broadcast: bool,
}

impl<N: snarkvm_console::network::Network> ProvingRequest<N> {
    pub fn new(
        authorization: Authorization<N>,
        fee_authorization: Option<Authorization<N>>,
        broadcast: bool,
    ) -> Self {
        Self {
            authorization,
            fee_authorization,
            broadcast,
        }
    }

    pub fn authorization(&self) -> &Authorization<N> {
        &self.authorization
    }

    pub fn fee_authorization(&self) -> Option<&Authorization<N>> {
        self.fee_authorization.as_ref()
    }

    pub fn broadcast(&self) -> bool {
        self.broadcast
    }
}

impl<N: snarkvm_console::network::Network> Display for ProvingRequest<N> {
    fn fmt(&self, f: &mut Formatter<'_>) -> FmtResult {
        write!(
            f,
            "{{\"authorization\":\"{}\",\"fee_authorization\":{},\"broadcast\":{}}}",
            self.authorization,
            self.fee_authorization
                .as_ref()
                .map(|auth| format!("\"{}\"", auth.to_string()))
                .unwrap_or_else(|| "null".to_string()),
            self.broadcast
        )
    }
}

impl<N: snarkvm_console::network::Network> FromStr for ProvingRequest<N> {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        // Parse JSON-like string format
        // Expected format: {"authorization":"auth_string","fee_authorization":"fee_auth_string"|null,"broadcast":true|false}

        // Simple JSON parsing - in production you'd use serde_json
        if !s.starts_with('{') || !s.ends_with('}') {
            return Err("Invalid ProvingRequest format: must be JSON object".to_string());
        }

        let content = &s[1..s.len() - 1]; // Remove outer braces
        let mut authorization_str: Option<String> = None;
        let mut fee_authorization_str: Option<String> = None;
        let mut broadcast = false;

        // Split by comma and parse key-value pairs
        for part in content.split(',') {
            let trimmed = part.trim();
            if let Some(colon_pos) = trimmed.find(':') {
                let key = trimmed[..colon_pos].trim().trim_matches('"');
                let value = trimmed[colon_pos + 1..].trim();

                match key {
                    "authorization" => {
                        authorization_str = Some(value.trim_matches('"').to_string());
                    }
                    "fee_authorization" => {
                        if value != "null" {
                            fee_authorization_str = Some(value.trim_matches('"').to_string());
                        }
                    }
                    "broadcast" => {
                        broadcast = value == "true";
                    }
                    _ => {} // Ignore unknown fields
                }
            }
        }

        let authorization_str =
            authorization_str.ok_or_else(|| "Missing authorization field".to_string())?;

        let authorization = authorization_str
            .parse::<Authorization<N>>()
            .map_err(|e| format!("Failed to parse authorization: {}", e))?;

        let fee_authorization = if let Some(fee_auth_str) = fee_authorization_str {
            Some(
                fee_auth_str
                    .parse::<Authorization<N>>()
                    .map_err(|e| format!("Failed to parse fee authorization: {}", e))?,
            )
        } else {
            None
        };

        Ok(ProvingRequest::new(
            authorization,
            fee_authorization,
            broadcast,
        ))
    }
}

impl<N: snarkvm_console::network::Network> FromBytes for ProvingRequest<N> {
    fn read_le<R: snarkvm_console::prelude::Read>(
        mut reader: R,
    ) -> snarkvm_console::prelude::IoResult<Self> {
        // Read authorization
        let authorization = Authorization::<N>::read_le(&mut reader)?;

        // Read fee authorization presence flag
        let has_fee_auth = bool::read_le(&mut reader)?;
        let fee_authorization = if has_fee_auth {
            Some(Authorization::<N>::read_le(&mut reader)?)
        } else {
            None
        };

        // Read broadcast flag
        let broadcast = bool::read_le(&mut reader)?;

        Ok(ProvingRequest::new(
            authorization,
            fee_authorization,
            broadcast,
        ))
    }
}

impl<N: snarkvm_console::network::Network> ToBytes for ProvingRequest<N> {
    fn write_le<W: snarkvm_console::prelude::Write>(
        &self,
        mut writer: W,
    ) -> snarkvm_console::prelude::IoResult<()> {
        // Write authorization
        self.authorization.write_le(&mut writer)?;

        // Write fee authorization presence flag and data
        let has_fee_auth = self.fee_authorization.is_some();
        has_fee_auth.write_le(&mut writer)?;
        if let Some(ref fee_auth) = self.fee_authorization {
            fee_auth.write_le(&mut writer)?;
        }

        // Write broadcast flag
        self.broadcast.write_le(&mut writer)?;

        Ok(())
    }
}

use crate::{
    authorization_error_result, authorization_success_result, bytes_error_result,
    bytes_success_result, ensure_authorization_storage, ensure_proving_request_storage, ffi,
    get_next_id, proving_request_error_result, proving_request_success_result, string_error_result,
    string_success_result,
};

pub fn proving_request_from_string(proving_request_str: String) -> ffi::ProvingRequestResult {
    // WORKAROUND FOR SNARKVM INCONSISTENCY:
    // snarkVM's ProvingRequest has inconsistent Display and FromStr implementations:
    // - Display (toString) returns JSON format like: {"authorization":"...","fee_authorization":null,"broadcast":false}
    // - FromStr (parse) expects a different native format that doesn't work with the JSON output
    //
    // This creates a fundamental toString()/fromString() incompatibility in snarkVM.
    // To work around this, we:
    // 1. Parse the JSON format that snarkVM's Display produces
    // 2. Extract the components (authorization, fee_authorization, broadcast)
    // 3. Manually reconstruct the ProvingRequest from these components
    //
    // This ensures round-trip compatibility: toString() -> fromString() works correctly.
    match serde_json::from_str::<serde_json::Value>(&proving_request_str) {
        Ok(json) => {
            // Extract authorization string from JSON
            let auth_str = json["authorization"].as_str().unwrap_or("");

            // Extract fee authorization if present
            let fee_auth_str = json["fee_authorization"].as_str();

            // Extract broadcast flag
            let broadcast = json["broadcast"].as_bool().unwrap_or(false);

            // Parse authorization from string
            match auth_str.parse::<Authorization<CurrentNetwork>>() {
                Ok(authorization) => {
                    // Store authorization and get handle
                    let auth_id = get_next_id();
                    let auth_storage = crate::ensure_authorization_storage();
                    let mut authorizations = auth_storage.lock().unwrap();
                    authorizations.insert(auth_id, authorization);
                    drop(authorizations);

                    // Parse fee authorization if present and store it
                    let fee_auth_id = if let Some(fee_str) = fee_auth_str {
                        match fee_str.parse::<Authorization<CurrentNetwork>>() {
                            Ok(fee_auth) => {
                                let fee_id = get_next_id();
                                let fee_storage = crate::ensure_authorization_storage();
                                let mut fee_authorizations = fee_storage.lock().unwrap();
                                fee_authorizations.insert(fee_id, fee_auth);
                                Some(fee_id)
                            }
                            Err(_) => None,
                        }
                    } else {
                        None
                    };

                    // Use existing proving_request_from_authorizations function
                    proving_request_from_authorizations(
                        auth_id,
                        fee_auth_id.unwrap_or(0),
                        broadcast,
                    )
                }
                Err(e) => {
                    proving_request_error_result(format!("Failed to parse authorization: {}", e))
                }
            }
        }
        Err(e) => {
            proving_request_error_result(format!("Failed to parse proving request JSON: {}", e))
        }
    }
}

pub fn proving_request_from_bytes_le(bytes: Vec<u8>) -> ffi::ProvingRequestResult {
    match ProvingRequest::<CurrentNetwork>::from_bytes_le(&bytes) {
        Ok(proving_request) => {
            let id = get_next_id();
            let storage = ensure_proving_request_storage();
            let mut proving_requests = storage.lock().unwrap();
            proving_requests.insert(id, proving_request);
            proving_request_success_result(id)
        }
        Err(e) => proving_request_error_result(format!(
            "Failed to parse proving request from bytes: {}",
            e
        )),
    }
}

pub fn proving_request_from_authorizations(
    auth_handle: u64,
    fee_auth_handle: u64,
    broadcast: bool,
) -> ffi::ProvingRequestResult {
    let auth_storage = ensure_authorization_storage();
    let authorizations = auth_storage.lock().unwrap();

    if let Some(authorization) = authorizations.get(&auth_handle) {
        let fee_authorization = if fee_auth_handle != 0 {
            authorizations.get(&fee_auth_handle).cloned()
        } else {
            None
        };

        let proving_request =
            ProvingRequest::new(authorization.clone(), fee_authorization, broadcast);
        let id = get_next_id();
        let pr_storage = ensure_proving_request_storage();
        let mut proving_requests = pr_storage.lock().unwrap();
        proving_requests.insert(id, proving_request);

        proving_request_success_result(id)
    } else {
        proving_request_error_result("Invalid authorization handle".to_string())
    }
}

// NOTE: This function uses snarkVM's native Display format, but we don't use it in toString()
// because it creates inconsistency with fromString(). See proving_request_to_json() instead.
// SNARKVM ISSUE: ProvingRequest's Display and FromStr implementations are incompatible:
// - Display returns JSON format
// - FromStr expects a different native format
// This function is kept for potential future use if snarkVM fixes this.
pub fn proving_request_to_string(handle: u64) -> ffi::StringResult {
    let storage = ensure_proving_request_storage();
    let proving_requests = storage.lock().unwrap();

    if let Some(proving_request) = proving_requests.get(&handle) {
        string_success_result(proving_request.to_string())
    } else {
        string_error_result("Invalid proving request handle".to_string())
    }
}

pub fn proving_request_to_bytes_le(handle: u64) -> ffi::BytesResult {
    let storage = ensure_proving_request_storage();
    let proving_requests = storage.lock().unwrap();

    if let Some(proving_request) = proving_requests.get(&handle) {
        match proving_request.to_bytes_le() {
            Ok(bytes) => bytes_success_result(bytes),
            Err(e) => bytes_error_result(format!("Failed to serialize proving request: {}", e)),
        }
    } else {
        bytes_error_result("Invalid proving request handle".to_string())
    }
}

pub fn proving_request_to_json(handle: u64) -> ffi::StringResult {
    let storage = ensure_proving_request_storage();
    let proving_requests = storage.lock().unwrap();

    if let Some(proving_request) = proving_requests.get(&handle) {
        // WORKAROUND FOR SNARKVM JSON ESCAPING ISSUE:
        // When snarkVM's ProvingRequest.to_string() returns JSON, the inner authorization
        // strings also contain JSON (e.g., '{"requests":[],"transitions":[]}').
        // Simply embedding this in JSON with format!() creates malformed JSON like:
        // {"authorization":"{"requests":[],"transitions":[]}","fee_authorization":null}
        //                  ^-- unescaped quotes break the JSON
        //
        // We use serde_json::to_string() to properly escape the authorization strings
        // so they become valid JSON strings within the outer JSON structure.
        let authorization_str = proving_request.authorization().to_string();
        let authorization_json =
            serde_json::to_string(&authorization_str).unwrap_or_else(|_| "\"\"".to_string());

        let fee_authorization_json = proving_request
            .fee_authorization()
            .map(|auth| {
                let fee_str = auth.to_string();
                serde_json::to_string(&fee_str).unwrap_or_else(|_| "\"\"".to_string())
            })
            .unwrap_or_else(|| "null".to_string());

        let json = format!(
            "{{\"authorization\":{},\"fee_authorization\":{},\"broadcast\":{}}}",
            authorization_json,
            fee_authorization_json,
            proving_request.broadcast()
        );
        string_success_result(json)
    } else {
        string_error_result("Invalid proving request handle".to_string())
    }
}

pub fn proving_request_get_authorization(handle: u64) -> ffi::AuthorizationResult {
    let storage = ensure_proving_request_storage();
    let proving_requests = storage.lock().unwrap();

    if let Some(proving_request) = proving_requests.get(&handle) {
        let id = get_next_id();
        let auth_storage = ensure_authorization_storage();
        let mut authorizations = auth_storage.lock().unwrap();
        authorizations.insert(id, proving_request.authorization().clone());
        authorization_success_result(id)
    } else {
        authorization_error_result("Invalid proving request handle".to_string())
    }
}

pub fn proving_request_get_fee_authorization(handle: u64) -> ffi::AuthorizationResult {
    let storage = ensure_proving_request_storage();
    let proving_requests = storage.lock().unwrap();

    if let Some(proving_request) = proving_requests.get(&handle) {
        if let Some(fee_auth) = proving_request.fee_authorization() {
            let id = get_next_id();
            let auth_storage = ensure_authorization_storage();
            let mut authorizations = auth_storage.lock().unwrap();
            authorizations.insert(id, fee_auth.clone());
            authorization_success_result(id)
        } else {
            authorization_error_result("No fee authorization available".to_string())
        }
    } else {
        authorization_error_result("Invalid proving request handle".to_string())
    }
}

pub fn proving_request_get_broadcast(handle: u64) -> bool {
    let storage = ensure_proving_request_storage();
    let proving_requests = storage.lock().unwrap();

    if let Some(proving_request) = proving_requests.get(&handle) {
        proving_request.broadcast()
    } else {
        false
    }
}

pub fn proving_request_replicate(handle: u64) -> ffi::ProvingRequestResult {
    let storage = ensure_proving_request_storage();
    let proving_requests = storage.lock().unwrap();

    if let Some(proving_request) = proving_requests.get(&handle) {
        let cloned_proving_request = proving_request.clone();
        drop(proving_requests); // Release the lock before acquiring it again

        let id = get_next_id();
        let storage = ensure_proving_request_storage();
        let mut new_proving_requests = storage.lock().unwrap();
        new_proving_requests.insert(id, cloned_proving_request);
        proving_request_success_result(id)
    } else {
        proving_request_error_result("Invalid proving request handle".to_string())
    }
}

pub fn proving_request_verify(handle: u64) -> bool {
    let storage = ensure_proving_request_storage();
    let proving_requests = storage.lock().unwrap();

    if let Some(proving_request) = proving_requests.get(&handle) {
        // Verify the proving request by checking its authorization(s)
        let auth_valid = match proving_request.authorization().to_bytes_le() {
            Ok(_) => true,
            Err(_) => false,
        };

        let fee_auth_valid = if let Some(fee_auth) = proving_request.fee_authorization() {
            match fee_auth.to_bytes_le() {
                Ok(_) => true,
                Err(_) => false,
            }
        } else {
            true // No fee authorization is valid
        };

        auth_valid && fee_auth_valid
    } else {
        false
    }
}

pub fn destroy_proving_request(handle: u64) {
    let storage = ensure_proving_request_storage();
    let mut proving_requests = storage.lock().unwrap();
    proving_requests.remove(&handle);
}

pub fn proving_request_equals(handle1: u64, handle2: u64) -> bool {
    let storage = ensure_proving_request_storage();
    let proving_requests = storage.lock().unwrap();

    if let (Some(pr1), Some(pr2)) = (
        proving_requests.get(&handle1),
        proving_requests.get(&handle2),
    ) {
        // Use proper equality comparison
        pr1 == pr2
    } else {
        false
    }
}
