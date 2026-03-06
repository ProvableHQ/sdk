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
    Address, Field, GraphKey, Group, PrivateKey, Signature, ViewKey, object,
    types::native::{
        CurrentNetwork, FieldNative, IdentifierNative, ProgramIDNative, RecordPlaintextNative, RequestNative,
        U16Native, ValueNative, ValueTypeNative,
    },
};
use snarkvm_console::{
    network::Network,
    prelude::{One, ToFields, Zero},
    program::compute_function_id,
};
use snarkvm_wasm::utilities::{FromBytes, ToBytes};

use js_sys::{Array, Object, Reflect, Uint8Array};
use rand::{SeedableRng, rngs::StdRng};
use std::{ops::Deref, str::FromStr};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct ExecutionRequest(RequestNative);

#[wasm_bindgen]
impl ExecutionRequest {
    /// Returns the request as a string.
    ///
    /// @returns {string} String representation of the request.
    #[wasm_bindgen(js_name = "toString")]
    #[allow(clippy::inherent_to_string)]
    pub fn to_string(&self) -> String {
        self.0.to_string()
    }

    /// Builds a request object from a string representation of a request.
    ///
    /// @param {string} request String representation of the request.
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
    #[allow(clippy::too_many_arguments)]
    pub fn sign(
        private_key: PrivateKey,
        program_id: String,
        function_name: String,
        inputs: Array,
        input_types: Array,
        root_tvk: Option<Field>,
        program_checksum: Option<Field>,
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
        let program_checksum = program_checksum.map(FieldNative::from);

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
            program_checksum,
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
    pub fn verify(&self, input_types: Array, is_root: bool, program_checksum: Option<Field>) -> bool {
        let input_types = input_types
            .iter()
            .map(|input_type| ValueTypeNative::from_str(&input_type.as_string().unwrap()).unwrap())
            .collect::<Vec<ValueTypeNative>>();

        let program_checksum = program_checksum.map(FieldNative::from);
        self.0.verify(&input_types, is_root, program_checksum)
    }

    /// Computes the function ID and serialized input data for a program function call.
    /// This is a helper for MPC wallets and other applications that need to compute
    /// publicly computable inputs for the `Request::sign` function.
    ///
    /// @param {string} program_id The id of the program.
    /// @param {string} function_name The function name.
    /// @param {string[]} input_types The input types of the function as strings.
    /// @param {string[]} inputs The inputs to the function as strings.
    /// @param {boolean} is_root Flag to indicate if this is the top level function in the call graph.
    /// @param {Field | undefined} program_checksum The program checksum (required if the program has a constructor).
    /// @param {ViewKey | undefined} view_key The view key of the signer to compute a record's tag and h values.
    ///
    /// @returns {MpcInput}
    #[wasm_bindgen(js_name = "computeMPCInputs")]
    pub fn compute_mpc_inputs(
        program_id: String,
        function_name: String,
        inputs: Array,
        input_types: Array,
        is_root: bool,
        program_checksum: Option<Field>,
        view_key: Option<ViewKey>,
    ) -> Result<Object, String> {
        // Build the per-input data array.
        let input_data = Array::new();

        // Convert the ProgramID and function name to their native objects.
        let program_id = ProgramIDNative::from_str(&program_id).map_err(|e| e.to_string())?;
        let function_name = IdentifierNative::from_str(&function_name).map_err(|e| e.to_string())?;

        // Retrieve the network ID.
        let network_id = U16Native::new(CurrentNetwork::ID);

        // Compute the function ID.
        let function_id =
            Field::from(compute_function_id(&network_id, &program_id, &function_name).map_err(|e| e.to_string())?)
                .to_string();

        // Compute 'is_root' as a field element.
        let is_root_field = Field::from(if is_root { FieldNative::one() } else { FieldNative::zero() });

        // Zip types and values together, verifying lengths match.
        let input_type_strs: Vec<JsValue> = input_types.iter().collect();
        let input_strs: Vec<JsValue> = inputs.iter().collect();
        if input_type_strs.len() != input_strs.len() {
            return Err("input_types and inputs must have the same length".to_string());
        }

        for (index, (input_type_js, input_js)) in input_type_strs.iter().zip(input_strs.iter()).enumerate() {
            // Parse the input types.
            let input_type = ValueTypeNative::from_str(
                &input_type_js.as_string().ok_or_else(|| "Input type must be a string".to_string())?,
            )
            .map_err(|e| e.to_string())?;

            // Parse the input value.
            let input =
                ValueNative::from_str(&input_js.as_string().ok_or_else(|| "Input must be a string".to_string())?)
                    .map_err(|e| e.to_string())?;

            // Compute the index as a field element.
            let index_field = Field::from(FieldNative::from_u16(
                u16::try_from(index).map_err(|_| format!("Input index {index} exceeds maximum allowed value"))?,
            ));

            // Serialize the input as fields.
            let fields_array: Array =
                input.to_fields().map_err(|e| e.to_string())?.iter().map(|f| JsValue::from(&f.to_string())).collect();

            let request_sign_input = object! {
                "index": index_field.to_string(),
                "fields": fields_array,
                "data": input.to_string(),
            };

            match &input_type {
                ValueTypeNative::Constant(_) => {
                    Reflect::set(&request_sign_input, &JsValue::from_str("outputType"), &JsValue::from_str("constant"))
                        .map_err(|_| "Failed to set outputType".to_string())?;
                }
                ValueTypeNative::Public(_) => {
                    Reflect::set(&request_sign_input, &JsValue::from_str("outputType"), &JsValue::from_str("public"))
                        .map_err(|_| "Failed to set outputType".to_string())?;
                }
                ValueTypeNative::Private(_) => {
                    Reflect::set(&request_sign_input, &JsValue::from_str("outputType"), &JsValue::from_str("private"))
                        .map_err(|_| "Failed to set outputType".to_string())?;
                }
                ValueTypeNative::Record(record_name) => {
                    // Set the output type and name.
                    Reflect::set(&request_sign_input, &JsValue::from_str("outputType"), &JsValue::from_str("record"))
                        .map_err(|_| "Failed to set outputType".to_string())?;
                    Reflect::set(
                        &request_sign_input,
                        &JsValue::from_str("name"),
                        &JsValue::from_str(&record_name.to_string()),
                    )
                    .map_err(|_| "Failed to set outputType".to_string())?;
                }
                ValueTypeNative::ExternalRecord(locator) => {
                    // Set the output type and name.
                    Reflect::set(
                        &request_sign_input,
                        &JsValue::from_str("outputType"),
                        &JsValue::from_str("external_record"),
                    )
                    .map_err(|_| "Failed to set outputType".to_string())?;
                    Reflect::set(
                        &request_sign_input,
                        &JsValue::from_str("name"),
                        &JsValue::from_str(&locator.to_string()),
                    )
                    .map_err(|_| "Failed to set outputType".to_string())?;
                }
                ValueTypeNative::Future(_) => {
                    return Err("Future inputs are not supported".to_string());
                }
            };

            // If the input is a record, compute the tag and h values.
            if let (ValueNative::Record(record_input), Some(vk)) = (input, view_key.as_ref()) {
                let record_name = match input_type {
                    ValueTypeNative::ExternalRecord(locator) => *locator.name(),
                    ValueTypeNative::Record(record_name) => record_name,
                    _ => {
                        return Err("Record inputs must have an input_type of record or external_record".to_string());
                    }
                };

                // Compute the sk_tag from the view key.
                let sk_tag = GraphKey::from_view_key(vk).sk_tag();
                let record_view_key = (*record_input.nonce() * ***vk).to_x_coordinate();
                // Compute the commitment for the record input.
                let commitment = record_input
                    .to_commitment(&program_id, &record_name, &record_view_key)
                    .map_err(|e| e.to_string())?;
                // Compute the tag for the record input.
                let tag = RecordPlaintextNative::tag(*sk_tag, commitment).map_err(|e| e.to_string())?.to_string();
                Reflect::set(&request_sign_input, &JsValue::from_str("tag"), &JsValue::from_str(&tag))
                    .map_err(|_| "Failed to set record tag".to_string())?;

                // Compute h and store it in the resulting object.
                let h = CurrentNetwork::hash_to_group_psd2(&[CurrentNetwork::serial_number_domain(), commitment])
                    .map_err(|e| e.to_string())?
                    .to_x_coordinate()
                    .to_string();
                Reflect::set(&request_sign_input, &JsValue::from_str("h"), &JsValue::from_str(&h))
                    .map_err(|_| "Failed to set outputType".to_string())?;
            }
        }

        // Return the serialized input data.
        Ok(object! {
            "function_id": JsValue::from(&function_id.to_string()),
            "is_root": JsValue::from(&is_root_field.to_string()),
            "program_checksum": program_checksum.map(|checksum| JsValue::from(&checksum.to_string())),
            "inputs": input_data,
        })
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
