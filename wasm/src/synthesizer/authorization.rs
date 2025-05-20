use crate::{
    Request,
    Transition,
    types::{
        Field,
        native::{AuthorizationNative, FromBytes, RequestNative, ToBytes, TransitionNative},
    },
};

use js_sys::{Array, Uint8Array};
use std::{ops::Deref, str::FromStr};
use wasm_bindgen::prelude::*;

/// Authorization object containing the authorization for a transaction.
pub struct Authorization(AuthorizationNative);

#[wasm_bindgen]
impl Authorization {
    /// Create transition.
    #[wasm_bindgen(constructor)]
    pub fn new(request: Request) -> Result<Authorization, JsValue> {
        Ok(Authorization(AuthorizationNative::new(RequestNative::from(request))))
    }

    /// Returns a new and independent replica of the authorization.
    pub fn replicate(&self) -> Authorization {
        Authorization(self.0.replicate())
    }

    #[wasm_bindgen(js_name = "toString")]
    #[allow(clippy::inherent_to_string)]
    pub fn to_string(&self) -> String {
        self.0.to_string()
    }

    #[wasm_bindgen(js_name = "fromString")]
    pub fn from_string(authorization: String) -> Result<Authorization, String> {
        Ok(Authorization(AuthorizationNative::from_str(&authorization).map_err(|e| e.to_string())?))
    }

    /// Returns the bytes representation of the authorization.
    #[wasm_bindgen(js_name = "toBytesLe")]
    pub fn to_bytes_le(&self) -> Result<Uint8Array, String> {
        let bytes = self.0.to_bytes_le().map_err(|e| e.to_string())?;
        Ok(Uint8Array::from(bytes.as_slice()))
    }

    /// Creates an authorization object from a bytes representation of an authorization.
    #[wasm_bindgen(js_name = "fromBytesLe")]
    pub fn from_bytes_le(bytes: Uint8Array) -> Result<Authorization, String> {
        let rust_bytes = bytes.to_vec();
        let native = AuthorizationNative::from_bytes_le(rust_bytes.as_slice()).map_err(|e| e.to_string())?;
        Ok(Authorization(native))
    }
}

#[wasm_bindgen]
impl Authorization {
    /// Returns the number of `Request`s in the authorization.
    pub fn len(&self) -> usize {
        self.0.len()
    }

    /// Return `true` if the authorization is empty.
    #[wasm_bindgen(js_name = isEmpty)]
    pub fn is_empty(&self) -> bool {
        self.0.is_empty()
    }

    /// Returns `true` if the authorization is for call to `credits.aleo/fee_private`.
    #[wasm_bindgen(js_name = isFeePrivate)]
    pub fn is_fee_private(&self) -> bool {
        self.0.is_fee_private()
    }

    /// Returns `true` if the authorization is for call to `credits.aleo/fee_public`.
    #[wasm_bindgen(js_name = isFeePublic)]
    pub fn is_fee_public(&self) -> bool {
        self.0.is_fee_public()
    }

    /// Returns `true` if the authorization is for call to `credits.aleo/split`.
    #[wasm_bindgen(js_name = isSplit)]
    pub fn is_split(&self) -> bool {
        self.0.is_split()
    }
}

#[wasm_bindgen]
impl Authorization {
    #[wasm_bindgen(js_name = insertTransition)]
    pub fn insert_transition(&self, transition: Transition) -> Result<(), String> {
        self.0.insert_transition(TransitionNative::from(transition)).map_err(|e| e.to_string())
    }

    /// Get the transitions in an authorization.
    ///
    /// @returns {Array<Transition>} Array of transition objects
    pub fn transitions(&self) -> Array {
        self.0.transitions().map(|transition| JsValue::from(Transition::from(transition))).collect::<Array>()
    }

    /// Returns the execution ID for the authorization.
    ///
    /// @returns {Field} The execution ID for the authorization, call toString() after this result to get the string representation.
    #[wasm_bindgen(js_name = toExecutionId)]
    pub fn to_execution_id(&self) -> Result<Field, String> {
        let id = self.0.to_execution_id().map_err(|e| format!("{:?}", e))?;
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
