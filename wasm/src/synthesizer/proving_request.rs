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
    types::native::{AuthorizationNative, FromBytes, ProvingRequestNative, ToBytes},
};

use js_sys::Uint8Array;
use std::{ops::Deref, str::FromStr};
use wasm_bindgen::prelude::*;

/// Represents a proving request to a delegated proving service.
#[wasm_bindgen]
pub struct ProvingRequest(ProvingRequestNative);

#[wasm_bindgen]
impl ProvingRequest {
    /// Creates a new proving request from an authorization and fee authorization.
    pub fn new(authorization: &Authorization, fee_authorization: &Authorization, broadcast: bool) -> Self {
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

    /// Creates a bytes representation of the proving request.
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
    pub fn fee_authorization(&self) -> Authorization {
        Authorization::from(self.0.fee_authorization())
    }

    /// Get the broadcast flag for the request.
    pub fn broadcast(&self) -> bool {
        self.0.broadcast()
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

impl From<(AuthorizationNative, AuthorizationNative, bool)> for ProvingRequest {
    fn from(tuple: (AuthorizationNative, AuthorizationNative, bool)) -> Self {
        Self(ProvingRequestNative::new_from_native(tuple.0, tuple.1, tuple.2))
    }
}
