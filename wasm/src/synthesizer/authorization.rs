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
    Field,
    Transition,
    types::native::{AuthorizationNative, RequestNative, TransitionNative},
};
use snarkvm_wasm::utilities::{FromBytes, ToBytes};

use js_sys::{Array, Uint8Array};
use std::{
    fmt::{Debug, Display},
    ops::Deref,
    str::FromStr,
};
use wasm_bindgen::prelude::*;

/// Authorization object containing the authorization for a transaction.
#[wasm_bindgen]
pub struct Authorization(AuthorizationNative);

#[wasm_bindgen]
impl Authorization {
    /// Create a new authorization from a request object.
    ///
    /// @param {ExecutionRequest} request The ExecutionRequest to build the authorization from.
    pub fn new(request: ExecutionRequest) -> Result<Authorization, JsValue> {
        Ok(Authorization(AuthorizationNative::new(RequestNative::from(request))))
    }

    /// Returns a new and independent replica of the Authorization.
    pub fn replicate(&self) -> Authorization {
        Authorization(self.0.replicate())
    }

    /// Returns the string representation of the Authorization.
    #[wasm_bindgen(js_name = "toString")]
    #[allow(clippy::inherent_to_string_shadow_display)]
    pub fn to_string(&self) -> String {
        self.0.to_string()
    }

    /// Reconstructs an Authorization object from its string representation.
    ///
    /// @param {String} authorization The string representation of the Authorization.
    #[wasm_bindgen(js_name = "fromString")]
    pub fn from_string(authorization: String) -> Result<Authorization, String> {
        Ok(Authorization(AuthorizationNative::from_str(&authorization).map_err(|e| e.to_string())?))
    }

    /// Returns the left-endian byte representation of the Authorization.
    #[wasm_bindgen(js_name = "toBytesLe")]
    pub fn to_bytes_le(&self) -> Result<Uint8Array, String> {
        let bytes = self.0.to_bytes_le().map_err(|e| e.to_string())?;
        Ok(Uint8Array::from(bytes.as_slice()))
    }

    /// Creates an authorization object from a left-endian byte representation of an Authorization.
    ///
    /// @param {Uint8Array} bytes Left-endian bytes representing the Authorization.
    #[wasm_bindgen(js_name = "fromBytesLe")]
    pub fn from_bytes_le(bytes: Uint8Array) -> Result<Authorization, String> {
        let rust_bytes = bytes.to_vec();
        let native = AuthorizationNative::from_bytes_le(rust_bytes.as_slice()).map_err(|e| e.to_string())?;
        Ok(Authorization(native))
    }

    /// Check if an Authorization object is the same as another.
    ///
    /// @param {Authorization} other The Authorization object to determine equality with.
    pub fn equals(&self, other: &Authorization) -> bool {
        self == other
    }

    /// Get the function name.
    ///
    /// @returns {string} The function name.
    #[wasm_bindgen(js_name = "functionName")]
    pub fn function_name(&self) -> Result<String, String> {
        Ok(self.get(0).map_err(|e| e.to_string())?.function_name().to_string())
    }
}

#[wasm_bindgen]
impl Authorization {
    /// Returns the number of `Request`s in the Authorization.
    pub fn len(&self) -> usize {
        self.0.len()
    }

    /// Return `true` if the Authorization is empty.
    #[wasm_bindgen(js_name = isEmpty)]
    pub fn is_empty(&self) -> bool {
        self.0.is_empty()
    }

    /// Returns `true` if the Authorization is for `credits.aleo/fee_private`.
    #[wasm_bindgen(js_name = isFeePrivate)]
    pub fn is_fee_private(&self) -> bool {
        self.0.is_fee_private()
    }

    /// Returns `true` if the Authorization is for `credits.aleo/fee_public`.
    #[wasm_bindgen(js_name = isFeePublic)]
    pub fn is_fee_public(&self) -> bool {
        self.0.is_fee_public()
    }

    /// Returns `true` if the Authorization is for `credits.aleo/split`.
    #[wasm_bindgen(js_name = isSplit)]
    pub fn is_split(&self) -> bool {
        self.0.is_split()
    }
}

#[wasm_bindgen]
impl Authorization {
    /// Insert a transition into the Authorization.
    ///
    /// @param {Transition} transition The transition object to insert into the Authorization.
    #[wasm_bindgen(js_name = insertTransition)]
    pub fn insert_transition(&self, transition: Transition) -> Result<(), String> {
        let transition = <TransitionNative as From<Transition>>::from(transition);
        self.0.insert_transition(transition).map_err(|e| e.to_string())
    }

    /// Returns all `ExecutionRequest`s in the Authorization as a JS array.
    ///
    /// The requests are returned in order (index 0 is always the root request).
    ///
    /// @returns {Array<ExecutionRequest>}
    pub fn requests(&self) -> Array {
        self.0
            .to_vec_deque()
            .into_iter()
            .map(|request| JsValue::from(ExecutionRequest::from(request)))
            .collect::<Array>()
    }

    /// Get the transitions in an Authorization.
    ///
    /// @returns {Array<Transition>} Array of transition objects
    pub fn transitions(&self) -> Array {
        self.0
            .transitions()
            .into_iter()
            .map(|(_, transition)| JsValue::from(Transition::from(transition)))
            .collect::<Array>()
    }

    /// Returns the execution ID for the Authorization.
    ///
    /// @returns {Field} The execution ID for the Authorization, call toString() after this result to get the string representation.
    #[wasm_bindgen(js_name = toExecutionId)]
    pub fn to_execution_id(&self) -> Result<Field, String> {
        let id = self.0.to_execution_id().map_err(|e| format!("{e:?}"))?;
        Ok(Field::from(id))
    }
}

impl Deref for Authorization {
    type Target = AuthorizationNative;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl From<AuthorizationNative> for Authorization {
    fn from(native: AuthorizationNative) -> Self {
        Self(native)
    }
}

impl From<&AuthorizationNative> for Authorization {
    fn from(native: &AuthorizationNative) -> Self {
        Self(native.clone())
    }
}

impl From<&Authorization> for AuthorizationNative {
    fn from(authorization: &Authorization) -> Self {
        authorization.0.clone()
    }
}

impl From<Authorization> for AuthorizationNative {
    fn from(authorization: Authorization) -> Self {
        authorization.0
    }
}

impl Debug for Authorization {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        Display::fmt(self, f)
    }
}

impl Display for Authorization {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl PartialEq for Authorization {
    fn eq(&self, other: &Self) -> bool {
        self.0 == other.0
    }
}

impl Eq for Authorization {}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{types::native::CurrentNetwork, utilities::test::PUZZLE_SPINNER_V002_AUTHORIZATION};
    use snarkvm_wasm::console::network::Network;

    use wasm_bindgen_test::*;

    #[wasm_bindgen_test]
    fn test_authorization_serialization() {
        if CurrentNetwork::ID == 0 {
            // Check to ensure the authorization deserialized correctly.
            let authorization = Authorization::from_string(PUZZLE_SPINNER_V002_AUTHORIZATION.to_string()).unwrap();

            // Check to ensure serialization roundtrips are correct and result in the same objects.
            let authorization_byte_roundtrip =
                Authorization::from_bytes_le(authorization.to_bytes_le().unwrap()).unwrap();
            let authorization_string_roundtrip = Authorization::from_string(authorization.to_string()).unwrap();
            assert!(
                authorization.equals(&authorization_byte_roundtrip)
                    && authorization.equals(&authorization_string_roundtrip)
            );
        }
    }

    #[wasm_bindgen_test]
    fn test_authorization_methods_work_as_expected() {
        if CurrentNetwork::ID == 0 {
            // Ensure the authorization has the expected content.
            let authorization = Authorization::from_string(PUZZLE_SPINNER_V002_AUTHORIZATION.to_string()).unwrap();
            let transitions = AuthorizationNative::from(&authorization).transitions();
            let (_, transition_0) = transitions.get_index(0).unwrap();
            let (_, transition_1) = transitions.get_index(1).unwrap();
            let (_, transition_2) = transitions.get_index(2).unwrap();

            // Ensure help methods result in the correct data.
            assert_eq!(transition_0.program_id().to_string(), "puzzle_arcade_coin_v002.aleo");
            assert_eq!(transition_1.program_id().to_string(), "puzzle_arcade_ticket_v002.aleo");
            assert_eq!(transition_2.program_id().to_string(), "puzzle_spinner_v002.aleo");
            assert!(!authorization.is_fee_public());
            assert!(!authorization.is_fee_private());
            assert!(!authorization.is_split());
            assert!(!authorization.is_empty());
            assert_eq!(authorization.len(), 3);
        }
    }
}
