use crate::{
    account::{Address, PrivateKey, Signature},
    types::{
        Field,
        Group,
        native::{
            CurrentNetwork,
            FieldNative,
            FromBytes,
            IdentifierNative,
            ProgramIDNative,
            RequestNative,
            ToBytes,
            ValueNative,
            ValueTypeNative,
        },
    },
};

use js_sys::{Array, Uint8Array};
use rand::{SeedableRng, rngs::StdRng};
use std::{ops::Deref, str::FromStr};
use wasm_bindgen::prelude::*;

pub struct Request(RequestNative);

#[wasm_bindgen]
impl Request {
    /// Returns the request as a string.
    #[wasm_bindgen(js_name = "toString")]
    #[allow(clippy::inherent_to_string)]
    pub fn to_string(&self) -> String {
        self.0.to_string()
    }

    /// Builds a request object from a string representation of a request.
    #[wasm_bindgen(js_name = "fromString")]
    pub fn from_string(request: String) -> Result<Request, String> {
        Ok(Request(RequestNative::from_str(&request).map_err(|e| e.to_string())?))
    }

    /// Returns the bytes representation of the request.
    #[wasm_bindgen(js_name = "toBytesLe")]
    pub fn to_bytes_le(&self) -> Result<Uint8Array, String> {
        let bytes = self.0.to_bytes_le().map_err(|e| e.to_string())?;
        Ok(Uint8Array::from(bytes.as_slice()))
    }

    /// Creates an request object from a bytes representation of an request.
    #[wasm_bindgen(js_name = "fromBytesLe")]
    pub fn from_bytes_le(bytes: Uint8Array) -> Result<Request, String> {
        let rust_bytes = bytes.to_vec();
        let native = RequestNative::from_bytes_le(rust_bytes.as_slice()).map_err(|e| e.to_string())?;
        Ok(Request(native))
    }

    /// Returns the request signer.
    pub fn signer(&self) -> Address {
        Address::from(self.0.signer())
    }

    /// Returns the network ID.
    pub fn network_id(&self) -> u16 {
        **self.0.network_id()
    }

    /// Returns the program ID.
    pub fn program_id(&self) -> String {
        self.0.program_id().to_string()
    }

    /// Returns the function name.
    pub fn function_name(&self) -> String {
        self.0.function_name().to_string()
    }

    /// Returns the input IDs for the transition.
    pub fn input_ids(&self) -> Array {
        self.0.input_ids().map(|input_id| JsValue::from_str(&input_id.to_string()))
    }

    /// Returns the function inputs as an array of strings.
    pub fn inputs(&self) -> Array {
        self.0.inputs().map(|input| JsValue::from_str(&input.to_string()))
    }

    /// Returns the signature for the transition.
    pub fn signature(&self) -> Signature {
        Signature::from(self.0.signature().clone())
    }

    /// Returns the tag secret key `sk_tag`.
    pub fn sk_tag(&self) -> Field {
        Field::from(self.0.sk_tag())
    }

    /// Returns the transition view key `tvk`.
    pub fn tvk(&self) -> Field {
        Field::from(self.0.tvk())
    }

    /// Returns the transition public key `tpk`.
    pub fn to_tpk(&self) -> Group {
        // Retrieve the challenge from the signature.
        let challenge = self.0.signature().challenge();
        // Retrieve the response from the signature.
        let response = self.0.signature().response();
        // Retrieve `pk_sig` from the signature.
        let pk_sig = self.0.signature().compute_key().pk_sig();
        // Compute `tpk` as `(challenge * pk_sig) + (response * G)`, equivalent to `r * G`.
        Group::from((pk_sig * challenge) + CurrentNetwork::g_scalar_multiply(&response))
    }

    /// Returns the transition commitment `tcm`.
    pub fn tcm(&self) -> Field {
        Field::from(self.0.tcm())
    }

    /// Returns the signer commitment `scm`.
    pub fn scm(&self) -> Field {
        Field::from(self.0.scm())
    }
}

#[wasm_bindgen]
impl Request {
    pub fn sign(
        private_key: PrivateKey,
        program_id: String,
        function_name: String,
        inputs: Array,
        input_types: Array,
        root_tvk: Option<Field>,
        is_root: bool,
    ) -> Result<Request, String> {
        let program_id = ProgramIDNative::from_str(&program_id).map_err(|e| e.to_string())?;
        let function_name = IdentifierNative::from_str(&function_name).map_err(|e| e.to_string())?;

        let inputs =
            inputs.iter().map(|input| ValueNative::from_str(&input.as_string().unwrap())).collect::<Vec<ValueNative>>();

        let input_types = input_types
            .iter()
            .map(|input_type| ValueTypeNative::from_str(&input_type.as_string().unwrap()))
            .collect::<Vec<ValueTypeNative>>();

        let root_tvk = root_tvk.map(|tvk| FieldNative::from(tvk));

        let mut rng = StdRng::from_entropy();

        let request = RequestNative::sign(
            &private_key,
            program_id,
            function_name,
            inputs,
            &input_types,
            root_tvk,
            is_root,
            &mut rng,
        )
        .map_err(|e| e.to_string())?;

        Ok(Request(request))
    }

    pub fn verify(&self, input_types: Array, is_root: bool) -> bool {
        let input_types = input_types
            .iter()
            .map(|input_type| ValueTypeNative::from_str(&input_type.as_string().unwrap()))
            .collect::<Vec<ValueTypeNative>>();

        self.0.verify(&input_types, is_root)
    }
}

impl Deref for Request {
    type Target = RequestNative;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl From<RequestNative> for Request {
    fn from(native: RequestNative) -> Self {
        Self(native)
    }
}

impl From<&RequestNative> for Request {
    fn from(native: &RequestNative) -> Self {
        Self(native.clone())
    }
}

impl From<Request> for RequestNative {
    fn from(request: Request) -> Self {
        request.0
    }
}

impl From<&Request> for RequestNative {
    fn from(request: &Request) -> Self {
        request.0.clone()
    }
}
