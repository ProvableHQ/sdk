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
    native_type_from_wasm_object_array,
    object,
    types::native::{
        CurrentNetwork,
        FieldNative,
        IdentifierNative,
        InputIDNative,
        ProgramIDNative,
        RecordPlaintextNative,
        RequestNative,
        U16Native,
        ValueNative,
        ValueTypeNative,
    },
};
use snarkvm_console::{
    network::Network,
    prelude::{One, ToFields, Zero},
    program::compute_function_id,
};
use snarkvm_wasm::utilities::{FromBytes, ToBytes};

use crate::types::native::GroupNative;
use js_sys::{Array, Object, Reflect, Uint8Array};
use rand::{SeedableRng, rngs::StdRng};
use std::{ops::Deref, str::FromStr};
use wasm_bindgen::{convert::TryFromJsValue, prelude::*};

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
    ///
    /// Each element is either a WASM `Field` (for constant/public/private/external_record inputs)
    /// or a JS Array `[Field, Group, Field, Field, Field]` (for record inputs: commitment, gamma,
    /// record_view_key, serial_number, tag).
    pub fn input_ids(&self) -> Array {
        self.0
            .input_ids()
            .iter()
            .map(|input_id| match input_id {
                InputIDNative::Constant(f)
                | InputIDNative::Public(f)
                | InputIDNative::Private(f)
                | InputIDNative::DynamicRecord(f)
                | InputIDNative::ExternalRecord(f) => JsValue::from(Field::from(*f)),
                InputIDNative::Record(commitment, gamma, record_view_key, serial_number, tag) => {
                    let tuple = Array::new();
                    tuple.push(&JsValue::from(Field::from(*commitment)));
                    tuple.push(&JsValue::from(Group::from(*gamma)));
                    tuple.push(&JsValue::from(Field::from(*record_view_key)));
                    tuple.push(&JsValue::from(Field::from(*serial_number)));
                    tuple.push(&JsValue::from(Field::from(*tag)));
                    JsValue::from(tuple)
                }
            })
            .collect::<Array>()
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

    // -----------------------------------------------------------------------
    // camelCase aliases (backwards-compatible additions to the JS API)
    // -----------------------------------------------------------------------

    /// Alias for `network_id` (camelCase).
    #[wasm_bindgen(js_name = "networkId")]
    pub fn network_id_camel(&self) -> u16 {
        self.network_id()
    }

    /// Alias for `program_id` (camelCase).
    #[wasm_bindgen(js_name = "programId")]
    pub fn program_id_camel(&self) -> String {
        self.program_id()
    }

    /// Alias for `function_name` (camelCase).
    #[wasm_bindgen(js_name = "functionName")]
    pub fn function_name_camel(&self) -> String {
        self.function_name()
    }

    /// Alias for `input_ids` (camelCase).
    #[wasm_bindgen(js_name = "inputIds")]
    pub fn input_ids_camel(&self) -> Array {
        self.input_ids()
    }

    /// Alias for `sk_tag` (camelCase).
    #[wasm_bindgen(js_name = "skTag")]
    pub fn sk_tag_camel(&self) -> Field {
        self.sk_tag()
    }

    /// Alias for `to_tpk` (camelCase).
    #[wasm_bindgen(js_name = "toTpk")]
    pub fn to_tpk_camel(&self) -> Group {
        self.to_tpk()
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
    /// @param {Field | undefined} program_checksum The checksum of the program. This is undefined if the call is not dynamic.
    /// @param {boolean} is_root Flag to indicate if this is the top level function in the call graph.
    /// @param {boolean} is_dynamic Flag to indicate if this is a dynamic call.
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
        is_dynamic: bool,
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
            is_dynamic,
            &mut rng,
        )
        .map_err(|e| e.to_string())?;

        // Return the execution request.
        Ok(ExecutionRequest(request))
    }

    /// Builds a request from externally-signed data using externally-supplied record view keys.
    ///
    /// For record inputs, the caller provides `record_view_keys` and `gammas` directly.
    /// The method uses these to compute commitment, serial number, tag, and InputID for each record.
    ///
    /// @param {string} program_id The id of the program.
    /// @param {string} function_name The function name.
    /// @param {string[]} inputs The inputs to the function.
    /// @param {string[]} input_types The input types of the function.
    /// @param {Signature} signature The externally-computed signature.
    /// @param {Field} tvk The transition view key.
    /// @param {Address} signer The signer address.
    /// @param {Field} sk_tag The tag secret key.
    /// @param {Field[] | undefined} record_view_keys Pre-computed record view keys (required when there are record inputs).
    /// @param {Group[] | undefined} gammas An array of gammas (required when there are record inputs).
    #[wasm_bindgen(js_name = "fromExternallySignedData")]
    #[allow(clippy::too_many_arguments)]
    pub fn from_externally_signed_data(
        program_id: String,
        function_name: String,
        inputs: Array,
        input_types: Array,
        signature: Signature,
        tvk: Field,
        signer: Address,
        sk_tag: Field,
        record_view_keys: Option<Array>,
        gammas: Option<Array>,
    ) -> Result<ExecutionRequest, String> {
        let (program_id, function_name, inputs_native, input_types_native, scm, tcm, network_id, function_id) =
            Self::parse_common_args(&program_id, &function_name, &inputs, &input_types, &signer, &tvk)?;

        let mut record_view_keys_native =
            native_type_from_wasm_object_array!(record_view_keys.unwrap_or(Array::new()), Field, FieldNative)?;

        let input_ids_native = Self::compute_input_ids_with_record_view_keys(
            &inputs_native,
            &input_types_native,
            &program_id,
            &sk_tag,
            &tvk,
            function_id,
            tcm,
            &mut record_view_keys_native,
            gammas,
        )?;

        Self::assemble_request(
            signer,
            network_id,
            program_id,
            function_name,
            input_ids_native,
            inputs_native,
            signature,
            sk_tag,
            tvk,
            tcm,
            scm,
        )
    }

    /// Builds a request from externally-signed data using a view key to derive record view keys.
    ///
    /// For record inputs, the method computes `record_view_key = (nonce * view_key).to_x_coordinate()`
    /// for each record, then uses it with the supplied `gammas` to compute commitment, serial number,
    /// tag, and InputID.
    ///
    /// @param {string} program_id The id of the program.
    /// @param {string} function_name The function name.
    /// @param {string[]} inputs The inputs to the function.
    /// @param {string[]} input_types The input types of the function.
    /// @param {Signature} signature The externally-computed signature.
    /// @param {Field} tvk The transition view key.
    /// @param {Address} signer The signer address.
    /// @param {Field} sk_tag The tag secret key.
    /// @param {ViewKey} view_key The view key of the signer.
    /// @param {Group[] | undefined} gammas An array of gammas (required when there are record inputs).
    #[wasm_bindgen(js_name = "fromExternallySignedDataWithViewKey")]
    #[allow(clippy::too_many_arguments)]
    pub fn from_externally_signed_data_with_view_key(
        program_id: String,
        function_name: String,
        inputs: Array,
        input_types: Array,
        signature: Signature,
        tvk: Field,
        signer: Address,
        sk_tag: Field,
        view_key: ViewKey,
        gammas: Option<Array>,
    ) -> Result<ExecutionRequest, String> {
        let (program_id, function_name, inputs_native, input_types_native, scm, tcm, network_id, function_id) =
            Self::parse_common_args(&program_id, &function_name, &inputs, &input_types, &signer, &tvk)?;

        // Derive record_view_keys from the view key for each record input.
        let mut record_view_keys_native = Vec::new();
        for (input, input_type) in inputs_native.iter().zip(input_types_native.iter()) {
            if let ValueTypeNative::Record(_) = input_type {
                let record_input = match input {
                    ValueNative::Record(record) => record,
                    _ => return Err("Expected a record input for record type".to_string()),
                };
                let record_view_key = (*record_input.nonce() * **view_key).to_x_coordinate();
                record_view_keys_native.push(record_view_key);
            }
        }

        let input_ids_native = Self::compute_input_ids_with_record_view_keys(
            &inputs_native,
            &input_types_native,
            &program_id,
            &sk_tag,
            &tvk,
            function_id,
            tcm,
            &mut record_view_keys_native,
            gammas,
        )?;

        Self::assemble_request(
            signer,
            network_id,
            program_id,
            function_name,
            input_ids_native,
            inputs_native,
            signature,
            sk_tag,
            tvk,
            tcm,
            scm,
        )
    }

    /// Builds a request from externally-signed data with pre-computed input IDs.
    ///
    /// Each element of `input_ids` is either:
    /// - A `Field` for constant, public, or private inputs (the input hash).
    /// - A JS Array `[Field, Group, Field, Field, Field]` for record inputs
    ///   (commitment, gamma, record_view_key, serial_number, tag).
    ///
    /// The `input_types` array is used to determine the InputID variant for scalar fields.
    ///
    /// @param {string} program_id The id of the program.
    /// @param {string} function_name The function name.
    /// @param {string[]} inputs The inputs to the function.
    /// @param {string[]} input_types The input types of the function.
    /// @param {Signature} signature The externally-computed signature.
    /// @param {Field} tvk The transition view key.
    /// @param {Address} signer The signer address.
    /// @param {Field} sk_tag The tag secret key.
    /// @param {(Field | [Field, Group, Field, Field, Field])[]} input_ids Pre-computed input IDs.
    #[wasm_bindgen(js_name = "fromExternallySignedDataWithInputIds")]
    #[allow(clippy::too_many_arguments)]
    pub fn from_externally_signed_data_with_input_ids(
        program_id: String,
        function_name: String,
        inputs: Array,
        input_types: Array,
        signature: Signature,
        tvk: Field,
        signer: Address,
        sk_tag: Field,
        input_ids: Array,
    ) -> Result<ExecutionRequest, String> {
        let (program_id, function_name, inputs_native, input_types_native, scm, tcm, network_id, _function_id) =
            Self::parse_common_args(&program_id, &function_name, &inputs, &input_types, &signer, &tvk)?;

        if input_ids.length() as usize != inputs_native.len() {
            return Err(format!(
                "input_ids length ({}) must match inputs length ({})",
                input_ids.length(),
                inputs_native.len()
            ));
        }

        let mut input_ids_native = Vec::with_capacity(inputs_native.len());
        for (i, (id_js, input_type)) in input_ids.iter().zip(input_types_native.iter()).enumerate() {
            if Array::is_array(&id_js) {
                // Record input: [Field, Group, Field, Field, Field] = [commitment, gamma, record_view_key, serial_number, tag]
                let id_array = Array::from(&id_js);
                if id_array.length() != 5 {
                    return Err(format!(
                        "input_ids[{i}] is an array but has length {} (expected 5 for record: [commitment, gamma, record_view_key, serial_number, tag])",
                        id_array.length()
                    ));
                }
                let commitment = FieldNative::from(
                    Field::try_from_js_value(id_array.get(0))
                        .map_err(|_| format!("input_ids[{i}][0] (commitment) must be a Field"))?,
                );
                let gamma = GroupNative::from(
                    Group::try_from_js_value(id_array.get(1))
                        .map_err(|_| format!("input_ids[{i}][1] (gamma) must be a Group"))?,
                );
                let record_view_key = FieldNative::from(
                    Field::try_from_js_value(id_array.get(2))
                        .map_err(|_| format!("input_ids[{i}][2] (record_view_key) must be a Field"))?,
                );
                let serial_number = FieldNative::from(
                    Field::try_from_js_value(id_array.get(3))
                        .map_err(|_| format!("input_ids[{i}][3] (serial_number) must be a Field"))?,
                );
                let tag = FieldNative::from(
                    Field::try_from_js_value(id_array.get(4))
                        .map_err(|_| format!("input_ids[{i}][4] (tag) must be a Field"))?,
                );

                input_ids_native.push(InputIDNative::Record(commitment, gamma, record_view_key, serial_number, tag));
            } else {
                // Scalar input: a single Field — variant determined by input_type.
                let input_hash = FieldNative::from(
                    Field::try_from_js_value(id_js)
                        .map_err(|_| format!("input_ids[{i}] must be a Field or an Array"))?,
                );
                let input_id = match input_type {
                    ValueTypeNative::Constant(_) => InputIDNative::Constant(input_hash),
                    ValueTypeNative::Public(_) => InputIDNative::Public(input_hash),
                    ValueTypeNative::Private(_) => InputIDNative::Private(input_hash),
                    ValueTypeNative::ExternalRecord(_) => InputIDNative::ExternalRecord(input_hash),
                    ValueTypeNative::DynamicRecord => InputIDNative::DynamicRecord(input_hash),
                    ValueTypeNative::Future(_) => {
                        return Err("Future inputs are not supported".to_string());
                    }
                    ValueTypeNative::DynamicFuture => {
                        return Err("Dynamic future inputs are not supported".to_string());
                    }
                    ValueTypeNative::Record(_) => {
                        return Err(format!(
                            "input_ids[{i}] is a scalar Field but input_type is record — expected [Field, Group, Field, Field, Field]"
                        ));
                    }
                };
                input_ids_native.push(input_id);
            }
        }

        Self::assemble_request(
            signer,
            network_id,
            program_id,
            function_name,
            input_ids_native,
            inputs_native,
            signature,
            sk_tag,
            tvk,
            tcm,
            scm,
        )
    }

    /// Verify the input types within a request.
    ///
    /// @param {string[]} input_types The input types within the request.
    /// @param {boolean} is_root Flag to indicate whether this request is the first function in the call graph.
    /// @param {Field | undefined} program_checksum The checksum of the program. This is undefined if the call is not dynamic.
    pub fn verify(&self, input_types: Array, is_root: bool, program_checksum: Option<Field>) -> bool {
        let input_types = input_types
            .iter()
            .map(|input_type| ValueTypeNative::from_str(&input_type.as_string().unwrap()).unwrap())
            .collect::<Vec<ValueTypeNative>>();

        let program_checksum = program_checksum.map(FieldNative::from);
        self.0.verify(&input_types, is_root, program_checksum)
    }

    /// Computes the function ID and serialized input data for a program function call.
    /// This is a helper for external signing wallets and other applications that need to compute
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
    /// @returns {ExternalSigningInput}
    #[wasm_bindgen(js_name = "computeExternalSigningInputs")]
    pub fn compute_external_signing_inputs(
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
                    Reflect::set(
                        &request_sign_input,
                        &JsValue::from_str("signingInputType"),
                        &JsValue::from_str("constant"),
                    )
                    .map_err(|_| "Failed to set signingInputType".to_string())?;
                }
                ValueTypeNative::Public(_) => {
                    Reflect::set(
                        &request_sign_input,
                        &JsValue::from_str("signingInputType"),
                        &JsValue::from_str("public"),
                    )
                    .map_err(|_| "Failed to set signingInputType".to_string())?;
                }
                ValueTypeNative::Private(_) => {
                    Reflect::set(
                        &request_sign_input,
                        &JsValue::from_str("signingInputType"),
                        &JsValue::from_str("private"),
                    )
                    .map_err(|_| "Failed to set signingInputType".to_string())?;
                }
                ValueTypeNative::Record(record_name) => {
                    // Set the signing input type and name.
                    Reflect::set(
                        &request_sign_input,
                        &JsValue::from_str("signingInputType"),
                        &JsValue::from_str("record"),
                    )
                    .map_err(|_| "Failed to set signingInputType".to_string())?;
                    Reflect::set(
                        &request_sign_input,
                        &JsValue::from_str("name"),
                        &JsValue::from_str(&record_name.to_string()),
                    )
                    .map_err(|_| "Failed to set name".to_string())?;

                    // If the input is a record, compute the tag and h values.
                    if let (ValueNative::Record(record_input), Some(vk)) = (input, view_key.as_ref()) {
                        let record_name = match input_type {
                            ValueTypeNative::Record(record_name) => record_name,
                            _ => {
                                return Err("Record inputs must have an input_type of record".to_string());
                            }
                        };

                        // Compute the sk_tag from the view key.
                        let sk_tag = GraphKey::from_view_key(vk).sk_tag();
                        let record_view_key = (*record_input.nonce() * ***vk).to_x_coordinate();

                        // Store the record view key on the per-input object.
                        let record_view_key_str = Field::from(record_view_key).to_string();
                        Reflect::set(
                            &request_sign_input,
                            &JsValue::from_str("recordViewKey"),
                            &JsValue::from_str(&record_view_key_str),
                        )
                        .map_err(|_| "Failed to set recordViewKey".to_string())?;

                        // Compute the commitment for the record input.
                        let commitment = record_input
                            .to_commitment(&program_id, &record_name, &record_view_key)
                            .map_err(|e| e.to_string())?;
                        // Compute the tag for the record input.
                        let tag =
                            RecordPlaintextNative::tag(*sk_tag, commitment).map_err(|e| e.to_string())?.to_string();
                        Reflect::set(&request_sign_input, &JsValue::from_str("tag"), &JsValue::from_str(&tag))
                            .map_err(|_| "Failed to set record tag".to_string())?;

                        // Compute h and store it in the resulting object.
                        let h =
                            CurrentNetwork::hash_to_group_psd2(&[CurrentNetwork::serial_number_domain(), commitment])
                                .map_err(|e| e.to_string())?
                                .to_x_coordinate()
                                .to_string();
                        Reflect::set(&request_sign_input, &JsValue::from_str("h"), &JsValue::from_str(&h))
                            .map_err(|_| "Failed to set h".to_string())?;
                    }
                }
                ValueTypeNative::ExternalRecord(locator) => {
                    // Set the signing input type and name.
                    Reflect::set(
                        &request_sign_input,
                        &JsValue::from_str("signingInputType"),
                        &JsValue::from_str("external_record"),
                    )
                    .map_err(|_| "Failed to set signingInputType".to_string())?;
                    Reflect::set(
                        &request_sign_input,
                        &JsValue::from_str("name"),
                        &JsValue::from_str(&locator.to_string()),
                    )
                    .map_err(|_| "Failed to set name".to_string())?;
                }
                ValueTypeNative::DynamicRecord => {
                    // Set the signing input type and name.
                    Reflect::set(
                        &request_sign_input,
                        &JsValue::from_str("signingInputType"),
                        &JsValue::from_str("dynamic_record"),
                    )
                    .map_err(|_| "Failed to set signingInputType".to_string())?;
                }
                ValueTypeNative::DynamicFuture => {
                    return Err("Dynamic future inputs are not supported".to_string());
                }
                ValueTypeNative::Future(_) => {
                    return Err("Future inputs are not supported".to_string());
                }
            };
            input_data.push(&request_sign_input);
        }

        // Build the result object.
        let result = object! {
            "function_id": JsValue::from(&function_id.to_string()),
            "isRoot": JsValue::from(&is_root_field.to_string()),
            "checksum": program_checksum.map(|checksum| JsValue::from(&checksum.to_string())),
            "requestInputs": input_data,
        };

        // When view_key is provided, compute and add signer and sk_tag for fromExternallySignedData.
        if let Some(vk) = view_key {
            let signer = Address::from_view_key(&vk);
            let sk_tag = GraphKey::from_view_key(&vk).sk_tag();
            Reflect::set(&result, &JsValue::from_str("signer"), &JsValue::from(signer))
                .map_err(|_| "Failed to set signer".to_string())?;
            Reflect::set(&result, &JsValue::from_str("skTag"), &JsValue::from(sk_tag))
                .map_err(|_| "Failed to set skTag".to_string())?;
        }

        Ok(result)
    }
}

/// Private helper methods shared by the three `fromExternallySignedData*` methods.
impl ExecutionRequest {
    /// Parses and validates the common arguments shared by all three externally-signed methods.
    fn parse_common_args(
        program_id: &str,
        function_name: &str,
        inputs: &Array,
        input_types: &Array,
        signer: &Address,
        tvk: &Field,
    ) -> Result<
        (
            ProgramIDNative,
            IdentifierNative,
            Vec<ValueNative>,
            Vec<ValueTypeNative>,
            FieldNative,
            FieldNative,
            U16Native,
            FieldNative,
        ),
        String,
    > {
        let program_id = ProgramIDNative::from_str(program_id).map_err(|e| e.to_string())?;
        let function_name = IdentifierNative::from_str(function_name).map_err(|e| e.to_string())?;

        let input_types_length = input_types.length();
        let inputs_length = inputs.length();
        if input_types_length != inputs_length {
            return Err(format!(
                "input_types and inputs must have the same length. Input array length: {inputs_length} - input type array length: {input_types_length}"
            ));
        }

        let mut inputs_native = Vec::with_capacity(inputs_length as usize);
        for (i, input) in inputs.iter().enumerate() {
            let input_string = input.as_string().ok_or(format!("Input had invalid string encoding at index {i}"))?;
            let input = ValueNative::from_str(&input_string).map_err(|e| e.to_string())?;
            inputs_native.push(input);
        }

        let mut input_types_native = Vec::with_capacity(inputs_length as usize);
        for (i, input_type) in input_types.iter().enumerate() {
            let input_type_string =
                input_type.as_string().ok_or(format!("Input type had invalid string encoding at index {i}"))?;
            let input_type = ValueTypeNative::from_str(&input_type_string).map_err(|e| e.to_string())?;
            input_types_native.push(input_type);
        }

        let scm =
            CurrentNetwork::hash_psd2(&[*signer.to_group().to_x_coordinate(), **tvk]).map_err(|e| e.to_string())?;
        let tcm = CurrentNetwork::hash_psd2(&[**tvk]).map_err(|e| e.to_string())?;

        let network_id = U16Native::new(CurrentNetwork::ID);
        let function_id = compute_function_id(&network_id, &program_id, &function_name).map_err(|e| e.to_string())?;

        Ok((program_id, function_name, inputs_native, input_types_native, scm, tcm, network_id, function_id))
    }

    /// Computes input IDs using supplied record view keys (consumed in order for record inputs).
    fn compute_input_ids_with_record_view_keys(
        inputs_native: &[ValueNative],
        input_types_native: &[ValueTypeNative],
        program_id: &ProgramIDNative,
        sk_tag: &Field,
        tvk: &Field,
        function_id: FieldNative,
        tcm: FieldNative,
        record_view_keys: &mut Vec<FieldNative>,
        gammas: Option<Array>,
    ) -> Result<Vec<InputIDNative>, String> {
        let record_count = input_types_native.iter().filter(|t| matches!(t, ValueTypeNative::Record(_))).count();
        let mut gammas_native =
            native_type_from_wasm_object_array!(gammas.unwrap_or(Array::new()), Group, GroupNative)?;

        if record_count != gammas_native.len() {
            return Err(format!(
                "The number of gammas must match the number of record inputs. {} gammas specified for {} record input(s)",
                gammas_native.len(),
                record_count
            ));
        }
        if record_count != record_view_keys.len() {
            return Err(format!(
                "The number of record_view_keys must match the number of record inputs. {} record_view_keys specified for {} record input(s)",
                record_view_keys.len(),
                record_count
            ));
        }

        // Reverse so we can pop in order.
        record_view_keys.reverse();
        gammas_native.reverse();

        let mut computed_ids = Vec::with_capacity(inputs_native.len());
        for (index, (input, input_type)) in inputs_native.iter().zip(input_types_native.iter()).enumerate() {
            let index = u16::try_from(index).map_err(|_| format!("Input index {index} exceeds maximum allowed value"))?
            let index_field = FieldNative::from_u16(index);

            match &input_type {
                ValueTypeNative::Constant(_) | ValueTypeNative::Public(_) => {
                    let mut preimage = vec![function_id];
                    preimage.extend(input.to_fields().map_err(|e| e.to_string())?);
                    preimage.push(tcm);
                    preimage.push(index_field);
                    let input_hash = CurrentNetwork::hash_psd8(&preimage).map_err(|e| e.to_string())?;
                    computed_ids.push(match input_type {
                        ValueTypeNative::Constant(_) => InputIDNative::Constant(input_hash),
                        _ => InputIDNative::Public(input_hash),
                    });
                }
                ValueTypeNative::Private(_) => {
                    let input_view_key =
                        CurrentNetwork::hash_psd4(&[function_id, **tvk, index_field]).map_err(|e| e.to_string())?;
                    let ciphertext = match input {
                        ValueNative::Plaintext(plaintext) => {
                            plaintext.encrypt_symmetric(input_view_key).map_err(|e| e.to_string())?
                        }
                        _ => return Err("Expected a plaintext input for private type".to_string()),
                    };
                    let input_hash = CurrentNetwork::hash_psd8(&ciphertext.to_fields().map_err(|e| e.to_string())?)
                        .map_err(|e| e.to_string())?;
                    computed_ids.push(InputIDNative::Private(input_hash));
                }
                ValueTypeNative::Record(record_name) => {
                    let record_input = match input {
                        ValueNative::Record(record) => record,
                        _ => return Err("Expected a record input for record type".to_string()),
                    };
                    let record_view_key = record_view_keys.pop().unwrap();
                    let commitment = record_input
                        .to_commitment(program_id, record_name, &record_view_key)
                        .map_err(|e| e.to_string())?;

                    let gamma = gammas_native.pop().unwrap();
                    let serial_number = RecordPlaintextNative::serial_number_from_gamma(&gamma, commitment)
                        .map_err(|e| e.to_string())?;
                    let tag = RecordPlaintextNative::tag(**sk_tag, commitment).map_err(|e| e.to_string())?;
                    computed_ids.push(InputIDNative::Record(commitment, gamma, record_view_key, serial_number, tag));
                }
                ValueTypeNative::ExternalRecord(_) => {
                    let input_id = InputIDNative::external_record(function_id, &input, **tvk, index)
                        .map_err(|e| e.to_string())?;
                    computed_ids.push(input_id);
                }
                ValueTypeNative::DynamicRecord => {
                    let input_id = InputIDNative::dynamic_record(function_id, &input, **tvk, index)
                        .map_err(|e| e.to_string())?;
                    computed_ids.push(input_id);
                }
                ValueTypeNative::DynamicFuture => {
                    return Err("Dynamic future inputs are not supported".to_string());
                }
                ValueTypeNative::Future(_) => {
                    return Err("Future inputs are not supported".to_string());
                }
            }
        }
        Ok(computed_ids)
    }

    /// Assembles a `RequestNative` from the computed parts.
    fn assemble_request(
        signer: Address,
        network_id: U16Native,
        program_id: ProgramIDNative,
        function_name: IdentifierNative,
        input_ids: Vec<InputIDNative>,
        inputs: Vec<ValueNative>,
        signature: Signature,
        sk_tag: Field,
        tvk: Field,
        tcm: FieldNative,
        scm: FieldNative,
    ) -> Result<ExecutionRequest, String> {
        let request = RequestNative::from((
            *signer,
            network_id,
            program_id,
            function_name,
            input_ids,
            inputs,
            *signature,
            *sk_tag,
            *tvk,
            tcm,
            scm,
            false,
        ));
        Ok(ExecutionRequest(request))
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
    use crate::{RecordPlaintext, array};
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
        let inputs = array![TRANSFER_PUBLIC_INPUTS[0].to_string(), TRANSFER_PUBLIC_INPUTS[1].to_string()];
        let input_types =
            array![TRANSFER_PUBLIC_INPUT_TYPES[0].to_string(), TRANSFER_PUBLIC_INPUT_TYPES[1].to_string()];

        let request = ExecutionRequest::sign(
            private_key,
            "credits.aleo".to_string(),
            "transfer_public".to_string(),
            inputs,
            input_types,
            None,
            None,
            true,
            false,
        )
        .expect("sign should succeed");

        assert_eq!(request.program_id(), "credits.aleo");
        assert_eq!(request.function_name(), "transfer_public");
        assert_eq!(request.network_id(), CurrentNetwork::ID);
        assert_eq!(request.inputs().length(), 2);
        assert_eq!(request.input_ids().length(), 2);
    }

    #[wasm_bindgen_test]
    fn test_execution_request_from_externally_signed_data_matches_sign() {
        // Uses fromExternallySignedDataWithViewKey (no records, view_key path).
        let private_key = PrivateKey::from_string(PRIVATE_KEY_STR).unwrap();
        let view_key = ViewKey::from_private_key(&private_key);
        let inputs = array![TRANSFER_PUBLIC_INPUTS[0].to_string(), TRANSFER_PUBLIC_INPUTS[1].to_string()];
        let input_types =
            array![TRANSFER_PUBLIC_INPUT_TYPES[0].to_string(), TRANSFER_PUBLIC_INPUT_TYPES[1].to_string()];

        let signed_request = ExecutionRequest::sign(
            private_key,
            "credits.aleo".to_string(),
            "transfer_public".to_string(),
            inputs.clone(),
            input_types.clone(),
            None,
            None,
            true,
            false,
        )
        .expect("sign should succeed");

        let externally_signed_request = ExecutionRequest::from_externally_signed_data_with_view_key(
            "credits.aleo".to_string(),
            "transfer_public".to_string(),
            inputs,
            input_types,
            signed_request.signature(),
            signed_request.tvk(),
            signed_request.signer(),
            signed_request.sk_tag(),
            view_key,
            None, // no record inputs
        )
        .expect("from_externally_signed_data_with_view_key should succeed");

        assert_eq!(externally_signed_request.program_id(), signed_request.program_id());
        assert_eq!(externally_signed_request.function_name(), signed_request.function_name());
        assert_eq!(externally_signed_request.inputs().length(), signed_request.inputs().length());
        assert_eq!(externally_signed_request.input_ids().length(), signed_request.input_ids().length());
        assert_eq!(externally_signed_request.to_string(), signed_request.to_string());
    }

    #[wasm_bindgen_test]
    fn test_execution_request_from_externally_signed_data_matches_sign_transfer_private() {
        // Uses fromExternallySignedDataWithViewKey (records, view_key path).
        let private_key = PrivateKey::from_string(BEACON_PRIVATE_KEY_STR).unwrap();
        let view_key = ViewKey::from_private_key(&private_key);
        let record_beacon_owned = "{ owner: aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px.private, microcredits: 1000000u64.private, _nonce: 3634848344765318974603121890869676775499130077229666060613233255327643175219group.public, _version: 1u8.public }";
        let inputs = array![
            record_beacon_owned.to_string(),
            "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px".to_string(),
            "100u64".to_string(),
        ];
        let input_types =
            array!["credits.record".to_string(), "address.private".to_string(), "u64.private".to_string(),];
        let record = RecordPlaintext::from_string(record_beacon_owned).unwrap();
        let gamma = record.gamma("credits.aleo", "credits", &private_key).unwrap();
        let gammas = array![gamma];

        let signed_request = ExecutionRequest::sign(
            private_key,
            "credits.aleo".to_string(),
            "transfer_private".to_string(),
            inputs.clone(),
            input_types.clone(),
            None,
            None,
            true,
            false,
        )
        .expect("sign should succeed");

        let externally_signed_request = ExecutionRequest::from_externally_signed_data_with_view_key(
            "credits.aleo".to_string(),
            "transfer_private".to_string(),
            inputs,
            input_types,
            signed_request.signature(),
            signed_request.tvk(),
            signed_request.signer(),
            signed_request.sk_tag(),
            view_key,
            Some(gammas),
        )
        .expect("from_externally_signed_data_with_view_key should succeed");

        assert_eq!(externally_signed_request.program_id(), signed_request.program_id());
        assert_eq!(externally_signed_request.function_name(), signed_request.function_name());
        assert_eq!(externally_signed_request.inputs().length(), signed_request.inputs().length());
        assert_eq!(externally_signed_request.input_ids().length(), signed_request.input_ids().length());
        assert_eq!(externally_signed_request.to_string(), signed_request.to_string());
    }

    #[wasm_bindgen_test]
    fn test_execution_request_verify() {
        let private_key = PrivateKey::from_string(PRIVATE_KEY_STR).unwrap();
        let inputs = array![TRANSFER_PUBLIC_INPUTS[0].to_string(), TRANSFER_PUBLIC_INPUTS[1].to_string()];
        let input_types =
            array![TRANSFER_PUBLIC_INPUT_TYPES[0].to_string(), TRANSFER_PUBLIC_INPUT_TYPES[1].to_string()];

        let request = ExecutionRequest::sign(
            private_key,
            "credits.aleo".to_string(),
            "transfer_public".to_string(),
            inputs,
            input_types.clone(),
            None,
            None,
            true,
            false,
        )
        .expect("sign should succeed");

        let valid = request.verify(input_types, true, None);
        assert!(valid, "verify should pass for matching input types and is_root");
    }

    #[wasm_bindgen_test]
    fn test_compute_external_signing_inputs_transfer_public() {
        // Build the inputs and input types.
        let inputs = array![TRANSFER_PUBLIC_INPUTS[0].to_string(), TRANSFER_PUBLIC_INPUTS[1].to_string()];
        let input_types =
            array![TRANSFER_PUBLIC_INPUT_TYPES[0].to_string(), TRANSFER_PUBLIC_INPUT_TYPES[1].to_string()];

        // Compute the external signing inputs.
        let result = ExecutionRequest::compute_external_signing_inputs(
            "credits.aleo".to_string(),
            "transfer_public".to_string(),
            inputs,
            input_types,
            true,
            None,
            None,
        )
        .expect("compute_external_signing_inputs should succeed");

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

        // Check the signing input type of the first input.
        let first_input = Reflect::get(&request_inputs_array, &JsValue::from(0u32)).unwrap();
        let second_input = Reflect::get(&request_inputs_array, &JsValue::from(1u32)).unwrap();
        let signing_input_type = Reflect::get(&first_input, &JsValue::from_str("signingInputType"))
            .ok()
            .and_then(|v| v.as_string())
            .expect("signingInputType should be present");
        assert_eq!(signing_input_type, "public");
        let index = Reflect::get(&first_input, &JsValue::from_str("index"))
            .ok()
            .and_then(|v| v.as_string())
            .expect("index should be present");
        assert_eq!(index, "0field");
        let data = Reflect::get(&first_input, &JsValue::from_str("data")).unwrap();
        let data_array = js_sys::Array::from(&data);
        assert!(data_array.length() >= 1, "data should be a non-empty array of fields");

        // Check the signing input type of the second input.
        let signing_input_type = Reflect::get(&second_input, &JsValue::from_str("signingInputType"))
            .ok()
            .and_then(|v| v.as_string())
            .expect("signingInputType should be present");
        assert_eq!(signing_input_type, "public");
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
    fn test_compute_external_signing_inputs_transfer_private_with_view_key() {
        let private_key = PrivateKey::from_string(BEACON_PRIVATE_KEY_STR).unwrap();
        let view_key = ViewKey::from_private_key(&private_key);

        let inputs = array![
            RECORD_BEACON_OWNED.to_string(),
            "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px".to_string(),
            "100u64".to_string(),
        ];
        let input_types =
            array!["credits.record".to_string(), "address.private".to_string(), "u64.private".to_string()];

        let result = ExecutionRequest::compute_external_signing_inputs(
            "credits.aleo".to_string(),
            "transfer_private".to_string(),
            inputs,
            input_types,
            true,
            None,
            Some(view_key.clone()),
        )
        .expect("compute_external_signing_inputs should succeed");

        // Verify the per-input recordViewKey matches the expected computation.
        let record_native = RecordPlaintextNative::from_str(RECORD_BEACON_OWNED).unwrap();
        let expected_record_view_key = (*record_native.nonce() * **view_key).to_x_coordinate();

        let request_inputs = Reflect::get(&result, &JsValue::from_str("requestInputs")).unwrap();
        let request_inputs_array = js_sys::Array::from(&request_inputs);
        let first_input = Reflect::get(&request_inputs_array, &JsValue::from(0u32)).unwrap();
        let per_input_rvk = Reflect::get(&first_input, &JsValue::from_str("recordViewKey"))
            .ok()
            .and_then(|v| v.as_string())
            .expect("recordViewKey should be set on the record input");
        assert_eq!(per_input_rvk, expected_record_view_key.to_string());

        // Check that non-record inputs do not have recordViewKey.
        let second_input = Reflect::get(&request_inputs_array, &JsValue::from(1u32)).unwrap();
        let second_rvk = Reflect::get(&second_input, &JsValue::from_str("recordViewKey")).unwrap();
        assert!(second_rvk.is_undefined(), "non-record input should not have recordViewKey");
    }

    #[wasm_bindgen_test]
    fn test_compute_external_signing_inputs_no_view_key_no_record_view_key() {
        // Without a view key, per-input recordViewKey should not be present.
        let inputs = array![
            RECORD_BEACON_OWNED.to_string(),
            "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px".to_string(),
            "100u64".to_string(),
        ];
        let input_types =
            array!["credits.record".to_string(), "address.private".to_string(), "u64.private".to_string()];

        let result = ExecutionRequest::compute_external_signing_inputs(
            "credits.aleo".to_string(),
            "transfer_private".to_string(),
            inputs,
            input_types,
            true,
            None,
            None,
        )
        .expect("compute_external_signing_inputs should succeed");

        let request_inputs = Reflect::get(&result, &JsValue::from_str("requestInputs")).unwrap();
        let request_inputs_array = js_sys::Array::from(&request_inputs);
        let first_input = Reflect::get(&request_inputs_array, &JsValue::from(0u32)).unwrap();
        let rvk = Reflect::get(&first_input, &JsValue::from_str("recordViewKey")).unwrap();
        assert!(rvk.is_undefined(), "recordViewKey should not be present without view_key");
    }

    // =========================================================================
    // Tests for the three new fromExternallySignedData* methods
    // =========================================================================

    /// Helper: sign a transfer_public request and return it.
    fn sign_transfer_public(private_key: &str) -> ExecutionRequest {
        let pk = PrivateKey::from_string(private_key).unwrap();
        let inputs = array![TRANSFER_PUBLIC_INPUTS[0].to_string(), TRANSFER_PUBLIC_INPUTS[1].to_string()];
        let input_types =
            array![TRANSFER_PUBLIC_INPUT_TYPES[0].to_string(), TRANSFER_PUBLIC_INPUT_TYPES[1].to_string()];
        ExecutionRequest::sign(
            pk,
            "credits.aleo".to_string(),
            "transfer_public".to_string(),
            inputs,
            input_types,
            None,
            None,
            true,
            false,
        )
        .expect("sign should succeed")
    }

    const RECORD_BEACON_OWNED: &str = "{ owner: aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px.private, microcredits: 1000000u64.private, _nonce: 3634848344765318974603121890869676775499130077229666060613233255327643175219group.public, _version: 1u8.public }";

    /// Helper: sign a transfer_private request and return it along with the gamma.
    fn sign_transfer_private() -> (ExecutionRequest, Group) {
        let pk = PrivateKey::from_string(BEACON_PRIVATE_KEY_STR).unwrap();
        let inputs = array![
            RECORD_BEACON_OWNED.to_string(),
            "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px".to_string(),
            "100u64".to_string(),
        ];
        let input_types =
            array!["credits.record".to_string(), "address.private".to_string(), "u64.private".to_string()];
        let record = RecordPlaintext::from_string(RECORD_BEACON_OWNED).unwrap();
        let gamma = record.gamma("credits.aleo", "credits", &pk).unwrap();

        let request = ExecutionRequest::sign(
            pk,
            "credits.aleo".to_string(),
            "transfer_private".to_string(),
            inputs,
            input_types,
            None,
            None,
            true,
            false,
        )
        .expect("sign should succeed");
        (request, gamma)
    }

    // --- Method 1: fromExternallySignedData (record_view_keys + gammas) ---

    #[wasm_bindgen_test]
    fn test_from_externally_signed_data_no_records() {
        // No record inputs — record_view_keys and gammas are None.
        let signed = sign_transfer_public(PRIVATE_KEY_STR);
        let inputs = array![TRANSFER_PUBLIC_INPUTS[0].to_string(), TRANSFER_PUBLIC_INPUTS[1].to_string()];
        let input_types =
            array![TRANSFER_PUBLIC_INPUT_TYPES[0].to_string(), TRANSFER_PUBLIC_INPUT_TYPES[1].to_string()];

        let result = ExecutionRequest::from_externally_signed_data(
            "credits.aleo".to_string(),
            "transfer_public".to_string(),
            inputs,
            input_types,
            signed.signature(),
            signed.tvk(),
            signed.signer(),
            signed.sk_tag(),
            None, // no record_view_keys
            None, // no gammas
        )
        .expect("fromExternallySignedData with no records should succeed");

        assert_eq!(result.to_string(), signed.to_string());
    }

    #[wasm_bindgen_test]
    fn test_from_externally_signed_data_with_records() {
        // Record inputs — supply externally-computed record_view_keys and gammas.
        let private_key = PrivateKey::from_string(BEACON_PRIVATE_KEY_STR).unwrap();
        let view_key = ViewKey::from_private_key(&private_key);
        let (signed, gamma) = sign_transfer_private();

        // Compute record_view_key externally (same computation the view_key path does).
        let record_native = RecordPlaintextNative::from_str(RECORD_BEACON_OWNED).unwrap();
        let record_view_key = (*record_native.nonce() * **view_key).to_x_coordinate();
        let record_view_keys = array![Field::from(record_view_key)];
        let gammas = array![gamma];

        let inputs = array![
            RECORD_BEACON_OWNED.to_string(),
            "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px".to_string(),
            "100u64".to_string(),
        ];
        let input_types =
            array!["credits.record".to_string(), "address.private".to_string(), "u64.private".to_string()];

        let result = ExecutionRequest::from_externally_signed_data(
            "credits.aleo".to_string(),
            "transfer_private".to_string(),
            inputs,
            input_types,
            signed.signature(),
            signed.tvk(),
            signed.signer(),
            signed.sk_tag(),
            Some(record_view_keys),
            Some(gammas),
        )
        .expect("fromExternallySignedData with records should succeed");

        assert_eq!(result.to_string(), signed.to_string());
    }

    // --- Method 2: fromExternallySignedDataWithViewKey ---

    #[wasm_bindgen_test]
    fn test_from_externally_signed_data_with_view_key_no_records() {
        let private_key = PrivateKey::from_string(PRIVATE_KEY_STR).unwrap();
        let view_key = ViewKey::from_private_key(&private_key);
        let signed = sign_transfer_public(PRIVATE_KEY_STR);

        let inputs = array![TRANSFER_PUBLIC_INPUTS[0].to_string(), TRANSFER_PUBLIC_INPUTS[1].to_string()];
        let input_types =
            array![TRANSFER_PUBLIC_INPUT_TYPES[0].to_string(), TRANSFER_PUBLIC_INPUT_TYPES[1].to_string()];

        let result = ExecutionRequest::from_externally_signed_data_with_view_key(
            "credits.aleo".to_string(),
            "transfer_public".to_string(),
            inputs,
            input_types,
            signed.signature(),
            signed.tvk(),
            signed.signer(),
            signed.sk_tag(),
            view_key,
            None, // no record inputs
        )
        .expect("fromExternallySignedDataWithViewKey with no records should succeed");

        assert_eq!(result.to_string(), signed.to_string());
    }

    #[wasm_bindgen_test]
    fn test_from_externally_signed_data_with_view_key_records() {
        let private_key = PrivateKey::from_string(BEACON_PRIVATE_KEY_STR).unwrap();
        let view_key = ViewKey::from_private_key(&private_key);
        let (signed, gamma) = sign_transfer_private();
        let gammas = array![gamma];

        let inputs = array![
            RECORD_BEACON_OWNED.to_string(),
            "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px".to_string(),
            "100u64".to_string(),
        ];
        let input_types =
            array!["credits.record".to_string(), "address.private".to_string(), "u64.private".to_string()];

        let result = ExecutionRequest::from_externally_signed_data_with_view_key(
            "credits.aleo".to_string(),
            "transfer_private".to_string(),
            inputs,
            input_types,
            signed.signature(),
            signed.tvk(),
            signed.signer(),
            signed.sk_tag(),
            view_key,
            Some(gammas),
        )
        .expect("fromExternallySignedDataWithViewKey with records should succeed");

        assert_eq!(result.to_string(), signed.to_string());
    }

    // --- Method 3: fromExternallySignedDataWithInputIds ---

    #[wasm_bindgen_test]
    fn test_from_externally_signed_data_with_input_ids_public() {
        // Public inputs — each input_id is a single Field computed from the hash.
        let signed = sign_transfer_public(PRIVATE_KEY_STR);

        // Compute the public input hashes the same way the protocol does:
        // hash_psd8([function_id, ...input.to_fields(), tcm, index])
        let network_id = U16Native::new(CurrentNetwork::ID);
        let program_id = ProgramIDNative::from_str("credits.aleo").unwrap();
        let function_name_native = IdentifierNative::from_str("transfer_public").unwrap();
        let function_id = compute_function_id(&network_id, &program_id, &function_name_native).unwrap();
        let tcm = CurrentNetwork::hash_psd2(&[*signed.tvk()]).unwrap();

        let input_values = [
            ValueNative::from_str(TRANSFER_PUBLIC_INPUTS[0]).unwrap(),
            ValueNative::from_str(TRANSFER_PUBLIC_INPUTS[1]).unwrap(),
        ];

        let input_ids = Array::new();
        for (index, input) in input_values.iter().enumerate() {
            let index_field = FieldNative::from_u16(index as u16);
            let mut preimage = vec![function_id];
            preimage.extend(input.to_fields().unwrap());
            preimage.push(tcm);
            preimage.push(index_field);
            let input_hash = CurrentNetwork::hash_psd8(&preimage).unwrap();
            input_ids.push(&JsValue::from(Field::from(input_hash)));
        }

        let inputs = array![TRANSFER_PUBLIC_INPUTS[0].to_string(), TRANSFER_PUBLIC_INPUTS[1].to_string()];
        let input_types =
            array![TRANSFER_PUBLIC_INPUT_TYPES[0].to_string(), TRANSFER_PUBLIC_INPUT_TYPES[1].to_string()];

        let result = ExecutionRequest::from_externally_signed_data_with_input_ids(
            "credits.aleo".to_string(),
            "transfer_public".to_string(),
            inputs,
            input_types,
            signed.signature(),
            signed.tvk(),
            signed.signer(),
            signed.sk_tag(),
            input_ids,
        )
        .expect("fromExternallySignedDataWithInputIds with public inputs should succeed");

        assert_eq!(result.to_string(), signed.to_string());
    }

    #[wasm_bindgen_test]
    fn test_from_externally_signed_data_with_input_ids_records() {
        // Record inputs — input_id is [Field, Group, Field, Field, Field].
        let private_key = PrivateKey::from_string(BEACON_PRIVATE_KEY_STR).unwrap();
        let view_key = ViewKey::from_private_key(&private_key);
        let (signed, gamma_wasm) = sign_transfer_private();

        // Compute all input IDs natively, as a user would provide them.
        let network_id = U16Native::new(CurrentNetwork::ID);
        let program_id = ProgramIDNative::from_str("credits.aleo").unwrap();
        let function_name_native = IdentifierNative::from_str("transfer_private").unwrap();
        let function_id = compute_function_id(&network_id, &program_id, &function_name_native).unwrap();

        let record_native = RecordPlaintextNative::from_str(RECORD_BEACON_OWNED).unwrap();
        let record_view_key = (*record_native.nonce() * **view_key).to_x_coordinate();
        let record_name = IdentifierNative::from_str("credits").unwrap();
        let commitment = record_native.to_commitment(&program_id, &record_name, &record_view_key).unwrap();
        let gamma_native = GroupNative::from(gamma_wasm.clone());
        let serial_number = RecordPlaintextNative::serial_number_from_gamma(&gamma_native, commitment).unwrap();
        let sk_tag_native = FieldNative::from(signed.sk_tag());
        let tag = RecordPlaintextNative::tag(sk_tag_native, commitment).unwrap();

        // Input 0: record → [commitment, gamma, record_view_key, serial_number, tag]
        let record_tuple = Array::new();
        record_tuple.push(&JsValue::from(Field::from(commitment)));
        record_tuple.push(&JsValue::from(gamma_wasm));
        record_tuple.push(&JsValue::from(Field::from(record_view_key)));
        record_tuple.push(&JsValue::from(Field::from(serial_number)));
        record_tuple.push(&JsValue::from(Field::from(tag)));

        // Input 1: address.private → hash
        let input1 = ValueNative::from_str("aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px").unwrap();
        let input1_view_key =
            CurrentNetwork::hash_psd4(&[function_id, *signed.tvk(), FieldNative::from_u16(1)]).unwrap();
        let ciphertext1 = match &input1 {
            ValueNative::Plaintext(pt) => pt.encrypt_symmetric(input1_view_key).unwrap(),
            _ => panic!("Expected plaintext"),
        };
        let hash1 = CurrentNetwork::hash_psd8(&ciphertext1.to_fields().unwrap()).unwrap();

        // Input 2: u64.private → hash
        let input2 = ValueNative::from_str("100u64").unwrap();
        let input2_view_key =
            CurrentNetwork::hash_psd4(&[function_id, *signed.tvk(), FieldNative::from_u16(2)]).unwrap();
        let ciphertext2 = match &input2 {
            ValueNative::Plaintext(pt) => pt.encrypt_symmetric(input2_view_key).unwrap(),
            _ => panic!("Expected plaintext"),
        };
        let hash2 = CurrentNetwork::hash_psd8(&ciphertext2.to_fields().unwrap()).unwrap();

        let input_ids = Array::new();
        input_ids.push(&record_tuple);
        input_ids.push(&JsValue::from(Field::from(hash1)));
        input_ids.push(&JsValue::from(Field::from(hash2)));

        let inputs = array![
            RECORD_BEACON_OWNED.to_string(),
            "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px".to_string(),
            "100u64".to_string(),
        ];
        let input_types =
            array!["credits.record".to_string(), "address.private".to_string(), "u64.private".to_string()];

        let result = ExecutionRequest::from_externally_signed_data_with_input_ids(
            "credits.aleo".to_string(),
            "transfer_private".to_string(),
            inputs,
            input_types,
            signed.signature(),
            signed.tvk(),
            signed.signer(),
            signed.sk_tag(),
            input_ids,
        )
        .expect("fromExternallySignedDataWithInputIds with records should succeed");

        assert_eq!(result.to_string(), signed.to_string());
    }

    // --- Error cases for the new methods ---

    #[wasm_bindgen_test]
    fn test_from_externally_signed_data_mismatched_record_view_keys_count() {
        let (signed, gamma) = sign_transfer_private();
        let gammas = array![gamma];

        let inputs = array![
            RECORD_BEACON_OWNED.to_string(),
            "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px".to_string(),
            "100u64".to_string(),
        ];
        let input_types =
            array!["credits.record".to_string(), "address.private".to_string(), "u64.private".to_string()];

        // Provide gammas but no record_view_keys — should fail.
        let result = ExecutionRequest::from_externally_signed_data(
            "credits.aleo".to_string(),
            "transfer_private".to_string(),
            inputs,
            input_types,
            signed.signature(),
            signed.tvk(),
            signed.signer(),
            signed.sk_tag(),
            None, // missing record_view_keys
            Some(gammas),
        );
        assert!(result.is_err(), "Should fail when record_view_keys missing for record inputs");
    }

    #[wasm_bindgen_test]
    fn test_from_externally_signed_data_with_input_ids_length_mismatch() {
        let signed = sign_transfer_public(PRIVATE_KEY_STR);

        let inputs = array![TRANSFER_PUBLIC_INPUTS[0].to_string(), TRANSFER_PUBLIC_INPUTS[1].to_string()];
        let input_types =
            array![TRANSFER_PUBLIC_INPUT_TYPES[0].to_string(), TRANSFER_PUBLIC_INPUT_TYPES[1].to_string()];

        // Provide only 1 input_id for 2 inputs.
        let input_ids = Array::new();
        let dummy_field = Field::from_string("0field").unwrap();
        input_ids.push(&JsValue::from(dummy_field));

        let result = ExecutionRequest::from_externally_signed_data_with_input_ids(
            "credits.aleo".to_string(),
            "transfer_public".to_string(),
            inputs,
            input_types,
            signed.signature(),
            signed.tvk(),
            signed.signer(),
            signed.sk_tag(),
            input_ids,
        );
        assert!(result.is_err(), "Should fail when input_ids length doesn't match inputs length");
    }

    #[wasm_bindgen_test]
    fn test_from_externally_signed_data_with_input_ids_scalar_for_record_type_fails() {
        // Passing a scalar Field for a record-typed input should fail.
        let (signed, _gamma) = sign_transfer_private();

        let inputs = array![
            RECORD_BEACON_OWNED.to_string(),
            "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px".to_string(),
            "100u64".to_string(),
        ];
        let input_types =
            array!["credits.record".to_string(), "address.private".to_string(), "u64.private".to_string()];

        // Pass a scalar Field for the record input instead of [Field, Group, Field, Field, Field].
        let input_ids = Array::new();
        let dummy_field = Field::from_string("0field").unwrap();
        input_ids.push(&JsValue::from(dummy_field.clone()));
        input_ids.push(&JsValue::from(dummy_field.clone()));
        input_ids.push(&JsValue::from(dummy_field));

        let result = ExecutionRequest::from_externally_signed_data_with_input_ids(
            "credits.aleo".to_string(),
            "transfer_private".to_string(),
            inputs,
            input_types,
            signed.signature(),
            signed.tvk(),
            signed.signer(),
            signed.sk_tag(),
            input_ids,
        );
        assert!(result.is_err(), "Should fail when scalar Field passed for record input type");
        let err = match result {
            Err(e) => e,
            Ok(_) => panic!("Expected error"),
        };
        assert!(err.contains("record"), "Error should mention record type mismatch");
    }

    #[wasm_bindgen_test]
    fn test_compute_external_signing_inputs_input_types_inputs_length_mismatch() {
        let inputs = array!["aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px"];
        let input_types = array!["address.public", "u64.public"];

        let result = ExecutionRequest::compute_external_signing_inputs(
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
