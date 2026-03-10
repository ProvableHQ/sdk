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
    GraphKey,
    Group,
    PrivateKey,
    Signature,
    ViewKey,
    object,
    types::native::{
        CurrentNetwork,
        FieldNative,
        IdentifierNative,
        InputIDNative,
        PlaintextNative,
        ProgramIDNative,
        RecordPlaintextNative,
        RequestNative,
        SignatureNative,
        U16Native,
        ValueNative,
        ValueTypeNative,
        ViewKeyNative,
    },
};
use snarkvm_console::{
    network::Network,
    prelude::{One, ToFields, Zero},
    program::{compute_function_id, InputID},
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

    /// Builds a request from MPC options and MPC-signed fields, computing `sk_tag` and `scm` internally.
    ///
    /// For record inputs, the caller must provide the record input IDs (which require `sk_sig` to compute).
    /// These can be obtained from a signed request's `input_ids()` or from the MPC output.
    ///
    /// @param {string} program_id The id of the program.
    /// @param {string} function_name The function name.
    /// @param {string[]} inputs The inputs to the function.
    /// @param {string[]} input_types The input types of the function.
    /// @param {boolean} is_root Flag to indicate if this is the top level function in the call graph.
    /// @param {Field | undefined} program_checksum The program checksum (required if the program has a constructor).
    /// @param {Signature} signature The MPC-computed signature.
    /// @param {Field} tvk The transition view key.
    /// @param {Field} tcm The transition commitment.
    /// @param {ViewKey} view_key The view key of the signer.
    /// @param {string | undefined} record_input_ids_json JSON string of record input ID array (one per record input, in order).
    ///        Required when inputs include records. E.g. '["{\"type\":\"record\",...}"]'. Each element is the JSON representation of InputID::Record.
    #[wasm_bindgen(js_name = "fromMPC")]
    #[allow(clippy::too_many_arguments)]
    pub fn from_mpc(
        program_id: String,
        function_name: String,
        inputs: Array,
        input_types: Array,
        signature_native: Signature,
        tvk: Field,
        view_key: ViewKey,
        gammas: Option<Array>, // Optional array of gammas.  One gamma per input record.
    ) -> Result<ExecutionRequest, String> {
        let program_id = ProgramIDNative::from_str(&program_id).map_err(|e| e.to_string())?;
        let function_name = IdentifierNative::from_str(&function_name).map_err(|e| e.to_string())?;

        let inputs: Vec<ValueNative> = inputs
            .iter()
            .map(|input| {
                ValueNative::from_str(&input.as_string().unwrap()).map_err(|e| e.to_string())
            })
            .collect::<Result<Vec<_>, _>>()?;

        let input_types: Vec<ValueTypeNative> = input_types
            .iter()
            .map(|input_type| {
                ValueTypeNative::from_str(&input_type.as_string().unwrap()).map_err(|e| e.to_string())
            })
            .collect::<Result<Vec<_>, _>>()?;

        if input_types.len() != inputs.len() {
            return Err("input_types and inputs must have the same length".to_string());
        }

        let signer = Address::from_view_key(&view_key);
        let sk_tag = GraphKey::from_view_key(&view_key).sk_tag();
        let root_tvk = tvk;
        let signer_x = *signer.to_x_coordinate();
        let scm = CurrentNetwork::hash_psd2(&[signer_x, *root_tvk]).map_err(|e| e.to_string())?;
        let tcm = CurrentNetwork::hash_psd2(&[*tvk]).map_err(|e| e.to_string())?;

        let network_id = U16Native::new(CurrentNetwork::ID);
        let function_id = compute_function_id(&network_id, &program_id, &function_name).map_err(|e| e.to_string())?;

        let record_count = input_types
            .iter()
            .filter(|t| matches!(t, ValueTypeNative::Record(_)))
            .count();
        
        let gamma_length = gammas.as_ref().map_or(0, |a| a.length() as usize);
        if record_count != gamma_length {
            return Err(format!(
                "record_input_ids must have length {} for {} record input(s), got {}",
                record_count,
                record_count,
                gamma_length
            ));
        }

        let mut record_input_idx = 0;
        let mut input_ids = Vec::with_capacity(inputs.len());
        for (index, (input, input_type)) in inputs.iter().zip(&input_types).enumerate() {
            let index_field = FieldNative::from_u16(
                u16::try_from(index).map_err(|_| format!("Input index {index} exceeds maximum allowed value"))?,
            );

            match input_type {
                ValueTypeNative::Constant(_) | ValueTypeNative::Public(_) => {
                    let mut preimage = vec![function_id];
                    preimage.extend(input.to_fields().map_err(|e| e.to_string())?);
                    preimage.push(tcm);
                    preimage.push(index_field);
                    let input_hash = CurrentNetwork::hash_psd8(&preimage).map_err(|e| e.to_string())?;
                    input_ids.push(match input_type {
                        ValueTypeNative::Constant(_) => InputIDNative::Constant(input_hash),
                        _ => InputIDNative::Public(input_hash),
                    });
                }
                ValueTypeNative::Private(_) => {
                    let input_view_key =
                        CurrentNetwork::hash_psd4(&[function_id, *tvk, index_field]).map_err(|e| e.to_string())?;
                    let ciphertext = match input {
                        ValueNative::Plaintext(plaintext) => {
                            plaintext.encrypt_symmetric(input_view_key).map_err(|e| e.to_string())?
                        }
                        _ => return Err("Expected a plaintext input for private type".to_string()),
                    };
                    let input_hash =
                        CurrentNetwork::hash_psd8(&ciphertext.to_fields().map_err(|e| e.to_string())?)
                            .map_err(|e| e.to_string())?;
                    input_ids.push(InputIDNative::Private(input_hash));
                }
                ValueTypeNative::Record(record_name) => {
                    // Deserialize the record input
                    let ValueNative::Record(record_input) = input;
                    // Compute the record input ID from the gamma, record commitment, h, and h_r.
                    let record_view_key = (**record_input.nonce() * ***view_key).to_x_coordinate();
                    // Compute the commitment for the record input.
                    let commitment = record_input
                        .to_commitment(&program_id, &record_name, &record_view_key)
                        .map_err(|e| e.to_string())?;
                    // Obtain the correct gamme from the Option<Array> deserialize to group element.
                    let gamma = Group::from(gammas.as_ref().unwrap().get(record_input_idx as u32)); // Not great to use unwrap()...even though the existence of the array is valid at this point.
                    // Compute the serial number
                    let serial_number = RecordPlaintextNative::serial_number_from_gamma(&gamma, commitment).map_err(|e| e.to_string())?;
                    // Compute the tag
                    let tag = RecordPlaintextNative::tag(*sk_tag, commitment).map_err(|e| e.to_string())?;
                    // Add the input ID to the input_id vector and increment the count.
                    input_ids.push(InputIDNative::Record(commitment, *gamma, record_view_key, serial_number, tag));
                    record_input_idx += 1;
                }
                ValueTypeNative::ExternalRecord(_) => {
                    return Err("external_record inputs are not yet supported in fromMPC".to_string());
                }
                ValueTypeNative::Future(_) => {
                    return Err("Future inputs are not supported".to_string());
                }
            }
        }

        let request = RequestNative::from((
            signer,
            network_id,
            program_id,
            function_name,
            input_ids,
            inputs,
            signature_native,
            sk_tag,
            tvk,
            tcm,
            scm,
        ));

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
                "data": fields_array,
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
            input_data.push(&request_sign_input);
        }

        // Return the serialized input data.
        Ok(object! {
            "function_id": JsValue::from(&function_id.to_string()),
            "isRoot": JsValue::from(&is_root_field.to_string()),
            "checksum": program_checksum.map(|checksum| JsValue::from(&checksum.to_string())),
            "requestInputs": input_data,
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

#[cfg(test)]
mod tests {
    use super::*;
    use js_sys::Reflect;
    use wasm_bindgen::JsValue;
    use wasm_bindgen_test::*;

    /// Test vectors from program-manager.test.ts: transfer_public with address + u64.
    const PRIVATE_KEY_STR: &str = "APrivateKey1zkp7Vc4xJt8HqW9U7VhY6h32d8Z9Xi5C6ZZX3gtXxbBSJmj";
    /// Beacon private key (produces aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px).
    const BEACON_PRIVATE_KEY_STR: &str = "APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH";
    const TRANSFER_PUBLIC_INPUTS: [&str; 2] =
        ["aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", "100u64"];
    const TRANSFER_PUBLIC_INPUT_TYPES: [&str; 2] = ["address.public", "u64.public"];

    #[wasm_bindgen_test]
    fn test_execution_request_sign_and_accessors() {
        let private_key = PrivateKey::from_string(PRIVATE_KEY_STR).unwrap();
        let inputs = crate::array![TRANSFER_PUBLIC_INPUTS[0].to_string(), TRANSFER_PUBLIC_INPUTS[1].to_string()];
        let input_types =
            crate::array![TRANSFER_PUBLIC_INPUT_TYPES[0].to_string(), TRANSFER_PUBLIC_INPUT_TYPES[1].to_string()];

        let request = ExecutionRequest::sign(
            private_key,
            "credits.aleo".to_string(),
            "transfer_public".to_string(),
            inputs,
            input_types,
            None,
            None,
            true,
        )
        .expect("sign should succeed");

        assert_eq!(request.program_id(), "credits.aleo");
        assert_eq!(request.function_name(), "transfer_public");
        assert_eq!(request.network_id(), CurrentNetwork::ID);
        assert_eq!(request.inputs().length(), 2);
        assert_eq!(request.input_ids().length(), 2);
    }

    #[wasm_bindgen_test]
    fn test_execution_request_from_mpc_matches_sign() {
        let private_key = PrivateKey::from_string(PRIVATE_KEY_STR).unwrap();
        let view_key = ViewKey::from_private_key(&private_key);
        let inputs = crate::array![TRANSFER_PUBLIC_INPUTS[0].to_string(), TRANSFER_PUBLIC_INPUTS[1].to_string()];
        let input_types =
            crate::array![TRANSFER_PUBLIC_INPUT_TYPES[0].to_string(), TRANSFER_PUBLIC_INPUT_TYPES[1].to_string()];

        let signed_request = ExecutionRequest::sign(
            private_key,
            "credits.aleo".to_string(),
            "transfer_public".to_string(),
            inputs.clone(),
            input_types.clone(),
            None,
            None,
            true,
        )
        .expect("sign should succeed");

        let mpc_request = ExecutionRequest::from_mpc(
            "credits.aleo".to_string(),
            "transfer_public".to_string(),
            inputs,
            input_types,
            true,
            None,
            signed_request.signature(),
            signed_request.tvk(),
            signed_request.tcm(),
            view_key,
            None, // no record inputs
        )
        .expect("from_mpc should succeed");

        assert_eq!(mpc_request.program_id(), signed_request.program_id());
        assert_eq!(mpc_request.function_name(), signed_request.function_name());
        assert_eq!(mpc_request.inputs().length(), signed_request.inputs().length());
        assert_eq!(mpc_request.input_ids().length(), signed_request.input_ids().length());
        assert_eq!(mpc_request.to_string(), signed_request.to_string());
    }

    #[wasm_bindgen_test]
    fn test_execution_request_from_mpc_matches_sign_transfer_private() {
        let private_key = PrivateKey::from_string(BEACON_PRIVATE_KEY_STR).unwrap();
        let view_key = ViewKey::from_private_key(&private_key);
        let record_beacon_owned = "{ owner: aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px.private, microcredits: 1000000u64.private, _nonce: 3634848344765318974603121890869676775499130077229666060613233255327643175219group.public, _version: 1u8.public }";
        let inputs = crate::array![
            record_beacon_owned.to_string(),
            "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px".to_string(),
            "100u64".to_string(),
        ];
        let input_types = crate::array![
            "credits.record".to_string(),
            "address.private".to_string(),
            "u64.private".to_string(),
        ];

        let signed_request = ExecutionRequest::sign(
            private_key,
            "credits.aleo".to_string(),
            "transfer_private".to_string(),
            inputs.clone(),
            input_types.clone(),
            None,
            None,
            true,
        )
        .expect("sign should succeed");

        let record_input_id_0 = signed_request
            .input_ids()
            .get(0)
            .as_string()
            .expect("record input id should be string");
        let record_input_ids_json = serde_json::to_string(&[record_input_id_0]).expect("JSON serialize");
        let mpc_request = ExecutionRequest::from_mpc(
            "credits.aleo".to_string(),
            "transfer_private".to_string(),
            inputs,
            input_types,
            true,
            None,
            signed_request.signature(),
            signed_request.tvk(),
            signed_request.tcm(),
            view_key,
            Some(record_input_ids_json),
        )
        .expect("from_mpc should succeed");

        assert_eq!(mpc_request.program_id(), signed_request.program_id());
        assert_eq!(mpc_request.function_name(), signed_request.function_name());
        assert_eq!(mpc_request.inputs().length(), signed_request.inputs().length());
        assert_eq!(mpc_request.input_ids().length(), signed_request.input_ids().length());
        assert_eq!(mpc_request.to_string(), signed_request.to_string());
    }

    #[wasm_bindgen_test]
    fn test_execution_request_verify() {
        let private_key = PrivateKey::from_string(PRIVATE_KEY_STR).unwrap();
        let inputs = crate::array![TRANSFER_PUBLIC_INPUTS[0].to_string(), TRANSFER_PUBLIC_INPUTS[1].to_string()];
        let input_types =
            crate::array![TRANSFER_PUBLIC_INPUT_TYPES[0].to_string(), TRANSFER_PUBLIC_INPUT_TYPES[1].to_string()];

        let request = ExecutionRequest::sign(
            private_key,
            "credits.aleo".to_string(),
            "transfer_public".to_string(),
            inputs,
            input_types.clone(),
            None,
            None,
            true,
        )
        .expect("sign should succeed");

        let valid = request.verify(input_types, true, None);
        assert!(valid, "verify should pass for matching input types and is_root");
    }

    #[wasm_bindgen_test]
    fn test_compute_mpc_inputs_transfer_public() {
        // Build the inputs and input types.
        let inputs = crate::array![TRANSFER_PUBLIC_INPUTS[0].to_string(), TRANSFER_PUBLIC_INPUTS[1].to_string()];
        let input_types =
            crate::array![TRANSFER_PUBLIC_INPUT_TYPES[0].to_string(), TRANSFER_PUBLIC_INPUT_TYPES[1].to_string()];

        // Compute the MPC inputs.
        let result = ExecutionRequest::compute_mpc_inputs(
            "credits.aleo".to_string(),
            "transfer_public".to_string(),
            inputs,
            input_types,
            true,
            None,
            None,
        )
        .expect("compute_mpc_inputs should succeed");

        // Check the function ID.
        let function_id = Reflect::get(&result, &JsValue::from_str("function_id"))
            .ok()
            .and_then(|v| v.as_string())
            .expect("function_id should be a string");
        assert!(!function_id.is_empty());
        let expected_function_id = compute_function_id(
            &U16Native::new(CurrentNetwork::ID),
            &ProgramIDNative::from_str("credits.aleo").unwrap(),
            &IdentifierNative::from_str("transfer_public").unwrap(),
        )
        .unwrap();
        assert_eq!(function_id, expected_function_id.to_string());

        // Check the isRoot is correct.
        let is_root = Reflect::get(&result, &JsValue::from_str("isRoot"))
            .ok()
            .and_then(|v| v.as_string())
            .expect("isRoot should be a string");
        assert_eq!(is_root, "1field", "isRoot should be 1field when true");

        // Check the checksum is correct.
        let checksum = Reflect::get(&result, &JsValue::from_str("checksum")).ok();
        assert!(checksum.is_some());
        let checksum = checksum.unwrap();
        assert!(checksum.is_undefined() || checksum.is_null());

        // Check the request inputs.
        let request_inputs =
            Reflect::get(&result, &JsValue::from_str("requestInputs")).expect("requestInputs should be present");
        let request_inputs_array = js_sys::Array::from(&request_inputs);
        assert_eq!(request_inputs_array.length(), 2, "requestInputs should have length 2 for two inputs");

        // Check the output type of the first input.
        let first_input = Reflect::get(&request_inputs_array, &JsValue::from(0u32)).unwrap();
        let second_input = Reflect::get(&request_inputs_array, &JsValue::from(1u32)).unwrap();
        let output_type = Reflect::get(&first_input, &JsValue::from_str("outputType"))
            .ok()
            .and_then(|v| v.as_string())
            .expect("outputType should be present");
        assert_eq!(output_type, "public");
        let index = Reflect::get(&first_input, &JsValue::from_str("index"))
            .ok()
            .and_then(|v| v.as_string())
            .expect("index should be present");
        assert_eq!(index, "0field");
        let data = Reflect::get(&first_input, &JsValue::from_str("data")).unwrap();
        let data_array = js_sys::Array::from(&data);
        assert!(data_array.length() >= 1, "data should be a non-empty array of fields");

        // Check the output type of the second input.
        let output_type = Reflect::get(&second_input, &JsValue::from_str("outputType"))
            .ok()
            .and_then(|v| v.as_string())
            .expect("outputType should be present");
        assert_eq!(output_type, "public");
        let index = Reflect::get(&second_input, &JsValue::from_str("index"))
            .ok()
            .and_then(|v| v.as_string())
            .expect("index should be present");
        assert_eq!(index, "1field");
        let data = Reflect::get(&second_input, &JsValue::from_str("data")).unwrap();
        let data_array = js_sys::Array::from(&data);
        assert!(data_array.length() >= 1, "data should be a non-empty array of fields");
    }

    #[wasm_bindgen_test]
    fn test_compute_mpc_inputs_input_types_inputs_length_mismatch() {
        let inputs = crate::array!["aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px"];
        let input_types = crate::array!["address.public", "u64.public"];

        let result = ExecutionRequest::compute_mpc_inputs(
            "credits.aleo".to_string(),
            "transfer_public".to_string(),
            inputs,
            input_types,
            true,
            None,
            None,
        );

        assert!(result.is_err());
        let err = result.unwrap_err();
        assert!(err.contains("same length"), "expected error about input_types and inputs length");
    }
}
