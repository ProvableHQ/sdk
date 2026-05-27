// Copyright (C) 2019-2025 Provable Inc.
// This file is part of the Provable SDK library.

// The Provable SDK library is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// The Provable SDK library is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with the Provable SDK library. If not, see <https://www.gnu.org/licenses/>.

use crate::{
    ExecutionRequest,
    synthesizer::Authorization,
    types::native::{AuthorizationNative, ProvingRequestNative, RequestNative},
};
use snarkvm_wasm::utilities::ToBytes;

use js_sys::Uint8Array;
use std::{
    fmt::{Debug, Display},
    ops::Deref,
    str::FromStr,
};
use wasm_bindgen::prelude::*;

/// Represents a proving request to a prover.
///
/// Carries one of two variants:
/// - `Authorization` — a fully-constructed snarkVM `Authorization` (plus optional
///   fee authorization). Submitted to `/prove/authorization` (encrypted-only).
/// - `Request` — a single signed snarkVM `Request` (plus optional fee `Request`)
///   that the prover authorizes server-side. Submitted to `/prove/request`
///   (encrypted-only).
///
/// Use {@link ProvingRequest#kind} when handling a `ProvingRequest` of unknown
/// variant (e.g. after deserialization). Variant-specific accessors throw if
/// called on the wrong variant.
#[wasm_bindgen]
pub struct ProvingRequest(ProvingRequestNative);

#[wasm_bindgen]
impl ProvingRequest {
    /// Creates a new Authorization-variant `ProvingRequest` from a function
    /// `Authorization` and an optional fee `Authorization`.
    ///
    /// @param {Authorization} authorization An Authorization for a function.
    /// @param {Authorization} fee_authorization The authorization for the `credits.aleo/fee_public` or `credits.aleo/fee_private` function that pays the fee for the execution of the main function.
    /// @param {boolean} broadcast Flag that indicates whether the remote proving service should attempt to submit the transaction on the caller's behalf.
    pub fn new(authorization: Authorization, fee_authorization: Option<Authorization>, broadcast: bool) -> Self {
        ProvingRequest(ProvingRequestNative::new(authorization, fee_authorization, broadcast))
    }

    /// Creates a new Request-variant `ProvingRequest` from a single signed
    /// `ExecutionRequest` and an optional signed fee `ExecutionRequest`.
    ///
    /// The Request variant is processed by the DPS at the `/prove/request`
    /// endpoint, which is encrypted-only. The server runs
    /// `Process::authorize_request` to turn each `Request` into an
    /// `Authorization` before proving.
    ///
    /// Only valid for single-public-request executions. Layered / nested
    /// calls are not supported by `/prove/request` at this time.
    ///
    /// @param {ExecutionRequest} request The signed request for the function.
    /// @param {ExecutionRequest} fee_request Optional signed request for the fee function. When omitted, the prover generates and pays the fee.
    /// @param {boolean} broadcast Flag that indicates whether the remote proving service should attempt to submit the transaction on the caller's behalf.
    #[wasm_bindgen(js_name = "fromRequest")]
    pub fn from_request(request: ExecutionRequest, fee_request: Option<ExecutionRequest>, broadcast: bool) -> Self {
        let request_native: RequestNative = request.into();
        let fee_request_native: Option<RequestNative> = fee_request.map(Into::into);
        ProvingRequest(ProvingRequestNative::new_request(request_native, fee_request_native, broadcast))
    }

    /// Returns the variant of this `ProvingRequest`: `"authorization"` or
    /// `"request"`. Useful when handling a `ProvingRequest` whose variant
    /// was determined at deserialization time.
    pub fn kind(&self) -> String {
        if self.0.is_request() { "request".to_string() } else { "authorization".to_string() }
    }

    /// Creates a `ProvingRequest` from a JSON string representation.
    ///
    /// The variant is determined automatically by the JSON shape:
    /// `{ authorization, ... }` → Authorization variant; `{ request, ... }` →
    /// Request variant. Use {@link ProvingRequest#kind} to inspect the
    /// resulting variant.
    ///
    /// @param {string} request JSON string representation of the ProvingRequest.
    #[wasm_bindgen(js_name = "fromString")]
    pub fn from_string(request: String) -> Result<ProvingRequest, String> {
        Ok(ProvingRequest(ProvingRequestNative::from_str(&request).map_err(|e| e.to_string())?))
    }

    /// Creates a JSON string representation of the ProvingRequest.
    /// The shape carries enough information to recover the variant via
    /// {@link ProvingRequest.fromString}.
    #[wasm_bindgen(js_name = "toString")]
    #[allow(clippy::inherent_to_string_shadow_display)]
    pub fn to_string(&self) -> String {
        self.0.to_string()
    }

    /// Reads bytes as an Authorization-variant `ProvingRequest`. For the
    /// Request variant, use {@link ProvingRequest.fromBytesLeRequest}
    /// explicitly — byte layout carries no variant discriminator.
    ///
    /// @param {Uint8Array} bytes Left-endian bytes representing an Authorization-variant proving request.
    #[wasm_bindgen(js_name = "fromBytesLe")]
    pub fn from_bytes_le(bytes: Uint8Array) -> Result<ProvingRequest, String> {
        let rust_bytes = bytes.to_vec();
        let native = ProvingRequestNative::read_authorization_le(rust_bytes.as_slice()).map_err(|e| e.to_string())?;
        Ok(ProvingRequest(native))
    }

    /// Reads bytes as a Request-variant `ProvingRequest`. Byte layout is
    /// disjoint from the Authorization variant; callers must pick the right
    /// reader for the bytes they hold.
    ///
    /// @param {Uint8Array} bytes Left-endian bytes representing a Request-variant proving request.
    #[wasm_bindgen(js_name = "fromBytesLeRequest")]
    pub fn from_bytes_le_request(bytes: Uint8Array) -> Result<ProvingRequest, String> {
        let rust_bytes = bytes.to_vec();
        let native = ProvingRequestNative::read_request_le(rust_bytes.as_slice()).map_err(|e| e.to_string())?;
        Ok(ProvingRequest(native))
    }

    /// Creates a left-endian byte representation of the ProvingRequest,
    /// dispatching on the variant. The bytes are wire-compatible with the
    /// matching DPS route (`/prove[/encrypted]` for Authorization,
    /// `/prove/request` for Request).
    #[wasm_bindgen(js_name = "toBytesLe")]
    pub fn to_bytes_le(&self) -> Result<Uint8Array, String> {
        let bytes = self.0.to_bytes_le().map_err(|e| e.to_string())?;
        Ok(Uint8Array::from(bytes.as_slice()))
    }

    /// Returns the Authorization of the main function in the ProvingRequest.
    ///
    /// @throws If this `ProvingRequest` is a Request variant. Check
    /// {@link ProvingRequest#kind} or use {@link ProvingRequest#request} instead.
    pub fn authorization(&self) -> Result<Authorization, String> {
        self.0.authorization().map(Authorization::from).ok_or_else(|| {
            "ProvingRequest is a Request variant; call `request()` instead of `authorization()`".to_string()
        })
    }

    /// Returns the fee Authorization in the ProvingRequest, or `undefined`
    /// when no fee is set or this is a Request variant.
    #[wasm_bindgen(js_name = "feeAuthorization")]
    pub fn fee_authorization(&self) -> Option<Authorization> {
        self.0.fee_authorization().map(Authorization::from)
    }

    /// Returns the signed `ExecutionRequest` carried by the Request variant.
    ///
    /// @throws If this `ProvingRequest` is an Authorization variant. Check
    /// {@link ProvingRequest#kind} or use {@link ProvingRequest#authorization}
    /// instead.
    pub fn request(&self) -> Result<ExecutionRequest, String> {
        self.0.request().map(ExecutionRequest::from).ok_or_else(|| {
            "ProvingRequest is an Authorization variant; call `authorization()` instead of `request()`".to_string()
        })
    }

    /// Returns the signed fee `ExecutionRequest` in the Request variant, or
    /// `undefined` when no fee request is set or this is an Authorization variant.
    #[wasm_bindgen(js_name = "feeRequest")]
    pub fn fee_request(&self) -> Option<ExecutionRequest> {
        self.0.fee_request().map(ExecutionRequest::from)
    }

    /// Get the broadcast flag set in the ProvingRequest.
    pub fn broadcast(&self) -> bool {
        self.0.broadcast()
    }

    /// Check if a ProvingRequest is the same as another ProvingRequest.
    pub fn equals(&self, other: &ProvingRequest) -> bool {
        self == other
    }
}

impl Deref for ProvingRequest {
    type Target = ProvingRequestNative;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl From<ProvingRequestNative> for ProvingRequest {
    fn from(native: ProvingRequestNative) -> Self {
        Self(native)
    }
}

impl From<&ProvingRequestNative> for ProvingRequest {
    fn from(native: &ProvingRequestNative) -> Self {
        Self(native.clone())
    }
}

impl From<ProvingRequest> for ProvingRequestNative {
    fn from(request: ProvingRequest) -> Self {
        request.0
    }
}

impl From<&ProvingRequest> for ProvingRequestNative {
    fn from(request: &ProvingRequest) -> Self {
        request.0.clone()
    }
}

impl From<(AuthorizationNative, Option<AuthorizationNative>, bool)> for ProvingRequest {
    fn from(tuple: (AuthorizationNative, Option<AuthorizationNative>, bool)) -> Self {
        Self(ProvingRequestNative::new_from_native(tuple.0, tuple.1, tuple.2))
    }
}

impl Debug for ProvingRequest {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        Display::fmt(self, f)
    }
}

impl Display for ProvingRequest {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl PartialEq for ProvingRequest {
    fn eq(&self, other: &Self) -> bool {
        self.0 == other.0
    }
}

impl Eq for ProvingRequest {}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        PrivateKey,
        array,
        types::native::CurrentNetwork,
        utilities::test::{PUZZLE_SPINNER_V002_AUTHORIZATION, PUZZLE_SPINNER_V002_PROVING_REQUEST},
    };
    use snarkvm_wasm::console::network::Network;

    use wasm_bindgen_test::*;

    // ---- Authorization variant (legacy) ----------------------------------

    #[wasm_bindgen_test]
    fn test_proving_request_serialization_roundtrip() {
        if CurrentNetwork::ID == 0 {
            // Check to ensure the ProvingRequest is deserialized correctly.
            let proving_request = ProvingRequest::from_string(PUZZLE_SPINNER_V002_PROVING_REQUEST.to_string()).unwrap();

            // Check to ensure serialization roundtrips are correct and result in the same objects.
            let proving_request_byte_roundtrip =
                ProvingRequest::from_bytes_le(proving_request.to_bytes_le().unwrap()).unwrap();
            let proving_request_string_roundtrip = ProvingRequest::from_string(proving_request.to_string()).unwrap();
            assert!(
                proving_request.equals(&proving_request_byte_roundtrip)
                    && proving_request.equals(&proving_request_string_roundtrip)
            );
        }
    }

    #[wasm_bindgen_test]
    fn test_proving_request_accessor_methods_give_correct_authorizations() {
        if CurrentNetwork::ID == 0 {
            // Ensure the authorization has the expected content.
            let proving_request = ProvingRequest::from_string(PUZZLE_SPINNER_V002_PROVING_REQUEST.to_string()).unwrap();

            // Ensure the authorizations and broadcast flags match expected values.
            let authorization = Authorization::from_string(PUZZLE_SPINNER_V002_AUTHORIZATION.to_string()).unwrap();
            assert!(proving_request.authorization().unwrap().equals(&authorization));
            assert!(proving_request.fee_authorization().unwrap().is_fee_public());
            assert_eq!(proving_request.broadcast(), false);
            assert_eq!(proving_request.kind(), "authorization");
        }
    }

    // ---- Request variant -------------------------------------------------

    /// Beacon private key — matches the existing wasm-side fixtures.
    const BEACON_PRIVATE_KEY_STR: &str = "APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH";

    fn sample_execution_request() -> ExecutionRequest {
        let private_key = PrivateKey::from_string(BEACON_PRIVATE_KEY_STR).unwrap();
        let inputs =
            array!["aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px".to_string(), "100u64".to_string()];
        let input_types = array!["address.public".to_string(), "u64.public".to_string()];
        ExecutionRequest::sign(
            private_key,
            "credits.aleo".to_string(),
            "transfer_public".to_string(),
            inputs,
            input_types,
            None,
            None,
            true,
            false,
        )
        .expect("sign should succeed")
    }

    #[wasm_bindgen_test]
    fn test_request_variant_construction_and_kind() {
        let request = sample_execution_request();
        let proving_request = ProvingRequest::from_request(request, None, false);

        assert_eq!(proving_request.kind(), "request");
        assert!(proving_request.0.is_request());
        assert!(!proving_request.0.is_authorization());
        assert!(proving_request.request().is_ok());
        assert!(proving_request.fee_request().is_none());
        assert_eq!(proving_request.broadcast(), false);
    }

    #[wasm_bindgen_test]
    fn test_request_variant_byte_roundtrip() {
        let request = sample_execution_request();
        let proving_request = ProvingRequest::from_request(request, None, true);

        // Roundtrip via the explicit Request reader. Using `fromBytesLe`
        // (Authorization reader) on these bytes would fail or produce garbage,
        // which is the intended behavior — the byte layout carries no
        // discriminator.
        let bytes = proving_request.to_bytes_le().expect("toBytesLe should succeed");
        let roundtripped = ProvingRequest::from_bytes_le_request(bytes).expect("fromBytesLeRequest should succeed");

        assert!(proving_request.equals(&roundtripped));
        assert_eq!(roundtripped.kind(), "request");
        assert_eq!(roundtripped.broadcast(), true);
    }

    #[wasm_bindgen_test]
    fn test_request_variant_string_roundtrip_autodetects() {
        let request = sample_execution_request();
        let proving_request = ProvingRequest::from_request(request, None, false);

        // JSON shape carries the variant — fromString picks the right one via
        // serde's untagged dispatch on disjoint field names.
        let s = proving_request.to_string();
        let roundtripped = ProvingRequest::from_string(s).expect("fromString should succeed");

        assert_eq!(roundtripped.kind(), "request");
        assert!(proving_request.equals(&roundtripped));
    }

    #[wasm_bindgen_test]
    fn test_request_variant_accessors_throw_on_authorization_methods() {
        let request = sample_execution_request();
        let proving_request = ProvingRequest::from_request(request, None, false);

        // `authorization()` on a Request variant should be a clear error.
        let err = proving_request.authorization().expect_err("expected authorization() to error");
        assert!(err.contains("Request variant"), "error should mention Request variant: {err}");

        // `feeAuthorization()` returns None rather than throwing — matches
        // the optional return shape callers already expect.
        assert!(proving_request.fee_authorization().is_none());
    }

    #[wasm_bindgen_test]
    fn test_authorization_variant_throws_on_request_accessor() {
        if CurrentNetwork::ID == 0 {
            let proving_request = ProvingRequest::from_string(PUZZLE_SPINNER_V002_PROVING_REQUEST.to_string()).unwrap();
            // `expect_err` requires `T: Debug`; `ExecutionRequest` doesn't impl
            // it, so use `.err().expect(...)` to extract the error message.
            let err = proving_request.request().err().expect("expected request() to error");
            assert!(err.contains("Authorization variant"), "error should mention Authorization variant: {err}");
            assert!(proving_request.fee_request().is_none());
        }
    }
}
