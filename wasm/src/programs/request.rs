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
    Address,
    Field,
    Group,
    PrivateKey,
    Signature,
    types::native::{
        CurrentNetwork,
        FieldNative,
        IdentifierNative,
        ProgramIDNative,
        RequestNative,
        ValueNative,
        ValueTypeNative,
    },
};
use snarkvm_console::network::Network;
use snarkvm_wasm::utilities::{FromBytes, ToBytes};

use js_sys::{Array, Uint8Array};
use rand::{SeedableRng, rngs::StdRng};
use std::{ops::Deref, str::FromStr};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct ExecutionRequest(RequestNative);

#[wasm_bindgen]
impl ExecutionRequest {
    /// Returns the request as a string.
    #[wasm_bindgen(js_name = "toString")]
    #[allow(clippy::inherent_to_string)]
    pub fn to_string(&self) -> String {
        self.0.to_string()
    }

    /// Builds a request object from a string representation of a request.
    #[wasm_bindgen(js_name = "fromString")]
    pub fn from_string(request: String) -> Result<ExecutionRequest, String> {
        Ok(ExecutionRequest(RequestNative::from_str(&request).map_err(|e| e.to_string())?))
    }

    /// Returns the bytes representation of the request.
    #[wasm_bindgen(js_name = "toBytesLe")]
    pub fn to_bytes_le(&self) -> Result<Uint8Array, String> {
        let bytes = self.0.to_bytes_le().map_err(|e| e.to_string())?;
        Ok(Uint8Array::from(bytes.as_slice()))
    }

    /// Creates an request object from a bytes representation of an request.
    #[wasm_bindgen(js_name = "fromBytesLe")]
    pub fn from_bytes_le(bytes: Uint8Array) -> Result<ExecutionRequest, String> {
        let rust_bytes = bytes.to_vec();
        let native = RequestNative::from_bytes_le(rust_bytes.as_slice()).map_err(|e| e.to_string())?;
        Ok(ExecutionRequest(native))
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
        self.0.input_ids().iter().map(|input_id| JsValue::from_str(&input_id.to_string())).collect::<Array>()
    }

    /// Returns the function inputs as an array of strings.
    pub fn inputs(&self) -> Array {
        self.0.inputs().iter().map(|input| JsValue::from_str(&input.to_string())).collect::<Array>()
    }

    /// Returns the signature for the transition.
    pub fn signature(&self) -> Signature {
        Signature::from(*self.0.signature())
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
impl ExecutionRequest {
    /// Create a new request by signing over a program ID and set of inputs.
    ///
    /// @param {PrivateKey} private_key The private key of the signer.
    /// @param {string} program_id The id of the program to create the signature for.
    /// @param {string} function_name The function name to create the signature for.
    /// @param {string[]} inputs The inputs to the function.
    /// @param {string[]} input_types The input types of the function.
    /// @param {Field | undefined} root_tvk The tvk of the function at the top of the call graph. This is undefined if this request is built for the top-level call or if there is only one function in the call graph.
    /// @param {boolean} is_root Flag to indicate if this is the top level function in the call graph.
    pub fn sign(
        private_key: PrivateKey,
        program_id: String,
        function_name: String,
        inputs: Array,
        input_types: Array,
        root_tvk: Option<Field>,
        is_root: bool,
    ) -> Result<ExecutionRequest, String> {
        // Convert the ProgramID and function name to their native objects.
        let program_id = ProgramIDNative::from_str(&program_id).map_err(|e| e.to_string())?;
        let function_name = IdentifierNative::from_str(&function_name).map_err(|e| e.to_string())?;

        // Ensure the inputs are valid Aleo types.
        let inputs = inputs
            .iter()
            .map(|input| ValueNative::from_str(&input.as_string().unwrap()).unwrap())
            .collect::<Vec<ValueNative>>();

        // Ensure the input types specified match the types of the specified inputs.
        let input_types = input_types
            .iter()
            .map(|input_type| ValueTypeNative::from_str(&input_type.as_string().unwrap()).unwrap())
            .collect::<Vec<ValueTypeNative>>();

        // Get the root tvk if it was specified.
        let root_tvk = root_tvk.map(FieldNative::from);

        // Generate an RNG for the function fro system entropy.
        let mut rng = StdRng::from_entropy();

        // Generate the signature over the (program_id, function, input, and private_key) tuple.
        let request = RequestNative::sign(
            &private_key,
            program_id,
            function_name,
            inputs.into_iter(),
            &input_types,
            root_tvk,
            is_root,
            &mut rng,
        )
        .map_err(|e| e.to_string())?;

        // Return the execution request.
        Ok(ExecutionRequest(request))
    }

    /// Verify the input types within a request.
    ///
    /// @param {string[]} The input_types within the request.
    /// @param {boolean} Flag to indicate whether this request is the first function in the call graph.
    pub fn verify(&self, input_types: Array, is_root: bool) -> bool {
        let input_types = input_types
            .iter()
            .map(|input_type| ValueTypeNative::from_str(&input_type.as_string().unwrap()).unwrap())
            .collect::<Vec<ValueTypeNative>>();

        self.0.verify(&input_types, is_root)
    }
}

impl Deref for ExecutionRequest {
    type Target = RequestNative;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl From<RequestNative> for ExecutionRequest {
    fn from(native: RequestNative) -> Self {
        Self(native)
    }
}

impl From<&RequestNative> for ExecutionRequest {
    fn from(native: &RequestNative) -> Self {
        Self(native.clone())
    }
}

impl From<ExecutionRequest> for RequestNative {
    fn from(request: ExecutionRequest) -> Self {
        request.0
    }
}

impl From<&ExecutionRequest> for RequestNative {
    fn from(request: &ExecutionRequest) -> Self {
        request.0.clone()
    }
}
