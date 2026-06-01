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

mod bytes;
mod string;

use super::*;

use serde::{Deserialize, Serialize};

/// A proving request submitted to the Delegated Proving Service.
///
/// Mirrors the variant layout used by the DPS in `utils::types::ProvingRequest`:
/// `Authorization` carries a fully-constructed `Authorization` (and optional fee
/// `Authorization`); `Request` carries a single signed `Request` (and optional
/// fee `Request`) that the server turns into an `Authorization` via
/// `Process::authorize_request`. JSON is serialized untagged — the field shape
/// (`authorization`/`fee_authorization` vs. `request`/`fee_request`) determines
/// the variant. Bytes carry no discriminator; the reader must know the variant
/// out-of-band (see `bytes.rs`).
#[derive(Clone, Eq, PartialEq, Serialize, Deserialize)]
#[serde(untagged)]
pub enum ProvingRequestNative {
    Authorization {
        authorization: AuthorizationNative,
        fee_authorization: Option<AuthorizationNative>,
        broadcast: bool,
    },
    Request {
        requests: Vec<RequestNative>,
        fee_request: Option<RequestNative>,
        broadcast: bool,
    },
}

impl ProvingRequestNative {
    /// Creates a new Authorization-variant `ProvingRequestNative` from the
    /// given authorization and optional fee authorization.
    pub fn new(
        authorization: crate::Authorization,
        fee_authorization: Option<crate::Authorization>,
        broadcast: bool,
    ) -> Self {
        Self::Authorization {
            authorization: AuthorizationNative::from(authorization),
            fee_authorization: fee_authorization.map(AuthorizationNative::from),
            broadcast,
        }
    }

    /// Creates a new Authorization-variant `ProvingRequestNative` from native
    /// `AuthorizationNative` values.
    pub fn new_from_native(
        authorization: AuthorizationNative,
        fee_authorization: Option<AuthorizationNative>,
        broadcast: bool,
    ) -> Self {
        Self::Authorization { authorization, fee_authorization, broadcast }
    }

    /// Creates a new Request-variant `ProvingRequestNative` from a vector of
    /// signed `Request`s and an optional fee `Request`.
    pub fn new_requests(requests: Vec<RequestNative>, fee_request: Option<RequestNative>, broadcast: bool) -> Self {
        Self::Request { requests, fee_request, broadcast }
    }

    /// Returns the Authorization variant's inner authorization, or `None` if
    /// this is a Request variant.
    pub fn authorization(&self) -> Option<&AuthorizationNative> {
        match self {
            Self::Authorization { authorization, .. } => Some(authorization),
            Self::Request { .. } => None,
        }
    }

    /// Returns the Authorization variant's fee authorization, or `None` if this
    /// is a Request variant or no fee authorization is set.
    pub fn fee_authorization(&self) -> Option<&AuthorizationNative> {
        match self {
            Self::Authorization { fee_authorization, .. } => fee_authorization.as_ref(),
            Self::Request { .. } => None,
        }
    }

    /// Returns the Request variant's requests slice, or `None` if this is an
    /// Authorization variant.
    pub fn requests(&self) -> Option<&[RequestNative]> {
        match self {
            Self::Request { requests, .. } => Some(requests),
            Self::Authorization { .. } => None,
        }
    }

    /// Returns the Request variant's fee request, or `None` if this is an
    /// Authorization variant or no fee request is set.
    pub fn fee_request(&self) -> Option<&RequestNative> {
        match self {
            Self::Request { fee_request, .. } => fee_request.as_ref(),
            Self::Authorization { .. } => None,
        }
    }

    /// Returns the broadcast flag regardless of variant.
    pub fn broadcast(&self) -> bool {
        match self {
            Self::Authorization { broadcast, .. } | Self::Request { broadcast, .. } => *broadcast,
        }
    }

    /// Returns the first request in the Request variant, or `None`. Convenience
    /// accessor for the single-request case (e.g. simple public transfers).
    pub fn first_request(&self) -> Option<&RequestNative> {
        self.requests()?.first()
    }

    /// Returns `true` if this is the Authorization variant.
    pub fn is_authorization(&self) -> bool {
        matches!(self, Self::Authorization { .. })
    }

    /// Returns `true` if this is the Request variant.
    pub fn is_request(&self) -> bool {
        matches!(self, Self::Request { .. })
    }
}
