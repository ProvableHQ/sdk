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

#[derive(Clone, Eq, PartialEq, Serialize, Deserialize)]
pub struct ProvingRequestNative {
    pub authorization: AuthorizationNative,
    pub fee_authorization: Option<AuthorizationNative>,
    pub broadcast: bool,
}

impl ProvingRequestNative {
    /// Creates a new `ProvingRequestNative` from the given authorization and fee authorization.
    pub fn new(
        authorization: crate::Authorization,
        fee_authorization: Option<crate::Authorization>,
        broadcast: bool,
    ) -> Self {
        Self {
            authorization: AuthorizationNative::from(authorization),
            fee_authorization: fee_authorization.map(|auth| AuthorizationNative::from(auth)),
            broadcast,
        }
    }

    /// Creates a new `ProvingRequest` from native authorization types.
    pub fn new_from_native(
        authorization: AuthorizationNative,
        fee_authorization: Option<AuthorizationNative>,
        broadcast: bool,
    ) -> Self {
        Self { authorization, fee_authorization, broadcast }
    }

    /// Gets the authorization of the function the `signer` is attempting to call.
    pub fn authorization(&self) -> &AuthorizationNative {
        &self.authorization
    }

    /// Gets the fee authorization of the proving request.
    pub fn fee_authorization(&self) -> Option<&AuthorizationNative> {
        self.fee_authorization.as_ref()
    }

    /// Returns the broadcast flag.
    pub fn broadcast(&self) -> bool {
        self.broadcast
    }
}
