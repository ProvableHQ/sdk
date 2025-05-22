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
    synthesizer::Authorization,
    types::native::{AuthorizationNative, ProvingRequestNative},
};
use snarkvm_wasm::utilities::{FromBytes, ToBytes};

use js_sys::Uint8Array;
use std::{
    fmt::{Debug, Display},
    ops::Deref,
    str::FromStr,
};
use wasm_bindgen::prelude::*;

/// Represents a proving request to a delegated proving service.
#[wasm_bindgen]
pub struct ProvingRequest(ProvingRequestNative);

#[wasm_bindgen]
impl ProvingRequest {
    /// Creates a new proving request from an authorization and fee authorization.
    pub fn new(authorization: Authorization, fee_authorization: Option<Authorization>, broadcast: bool) -> Self {
        ProvingRequest(ProvingRequestNative::new(authorization, fee_authorization, broadcast))
    }

    /// Creates a proving request from a string representation.
    #[wasm_bindgen(js_name = "fromString")]
    pub fn from_string(request: String) -> Result<ProvingRequest, String> {
        Ok(ProvingRequest(ProvingRequestNative::from_str(&request).map_err(|e| e.to_string())?))
    }

    /// Creates a string representation of the proving request.
    #[wasm_bindgen(js_name = "toString")]
    #[allow(clippy::inherent_to_string)]
    pub fn to_string(&self) -> String {
        self.0.to_string()
    }

    /// Creates a proving request from a bytes representation.
    #[wasm_bindgen(js_name = "fromBytesLe")]
    pub fn from_bytes_le(bytes: Uint8Array) -> Result<ProvingRequest, String> {
        let rust_bytes = bytes.to_vec();
        let native = ProvingRequestNative::from_bytes_le(rust_bytes.as_slice()).map_err(|e| e.to_string())?;
        Ok(ProvingRequest(native))
    }

    /// Creates a byte representation of the proving request.
    #[wasm_bindgen(js_name = "toBytesLe")]
    pub fn to_bytes_le(&self) -> Result<Uint8Array, String> {
        let bytes = self.0.to_bytes_le().map_err(|e| e.to_string())?;
        Ok(Uint8Array::from(bytes.as_slice()))
    }

    /// Get the main authorization for the request.
    pub fn authorization(&self) -> Authorization {
        Authorization::from(self.0.authorization())
    }

    /// Get the fee authorization for the request.
    #[wasm_bindgen(js_name = "feeAuthorization")]
    pub fn fee_authorization(&self) -> Option<Authorization> {
        self.0.fee_authorization().map(|auth| Authorization::from(auth))
    }

    /// Get the broadcast flag for the request.
    pub fn broadcast(&self) -> bool {
        self.0.broadcast()
    }

    /// Check if an authorization is the same as another.
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
        types::native::CurrentNetwork,
        utilities::test::{PUZZLE_SPINNER_V002_AUTHORIZATION, PUZZLE_SPINNER_V002_PROVING_REQUEST},
    };
    use snarkvm_wasm::console::network::Network;

    use wasm_bindgen_test::*;

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
            assert!(proving_request.authorization().equals(&authorization));
            assert!(proving_request.fee_authorization().unwrap().is_fee_public());
            assert_eq!(proving_request.broadcast, false);
        }
    }
}
