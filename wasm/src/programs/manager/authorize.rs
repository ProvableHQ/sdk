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

use super::*;

use crate::{
    Authorization,
    ExecutionRequest,
    PrivateKey,
    RecordPlaintext,
    authorize,
    authorize_fee,
    log,
    process_inputs,
    types::native::{
        AuthorizationNative,
        CallStackNative,
        CurrentAleo,
        FieldNative,
        IdentifierNative,
        PrivateKeyNative,
        ProcessNative,
        ProgramNative,
        RecordPlaintextNative,
        RequestNative,
    },
};

use js_sys::{Array, Object};
use rand::{SeedableRng, rngs::StdRng};
use std::str::FromStr;

#[wasm_bindgen]
impl ProgramManager {
    #[allow(clippy::too_many_arguments)]
    /// Create an execution `Authorization` for a given program:function tuple with specified inputs.
    ///
    /// @param private_key The private key of the signer.
    /// @param program The program source code containing the function to authorize.
    /// @param function_name The function to authorize.
    /// @param inputs A javascript array of inputs to the function.
    /// @param imports The imports to the program in the format {"programname.aleo":"aleo instructions source code"}.
    pub async fn authorize(
        private_key: &PrivateKey,
        program: &str,
        function_name: &str,
        inputs: Array,
        imports: Option<Object>,
        edition: Option<u16>,
    ) -> Result<Authorization, String> {
        let mut process_native = ProcessNative::load_web().map_err(|err| err.to_string())?;
        let process = &mut process_native;

        log("Check program imports are valid and add them to the process");
        let program_native = ProgramNative::from_str(program).map_err(|e| e.to_string())?;
        let program_id = program_native.id().to_string();
        log(&format!("Creating proving request for {program_id}:{function_name}"));
        ProgramManager::resolve_imports(process, imports, Some(program_id.as_str()))?;
        let rng = &mut StdRng::from_entropy();

        // Authorize the main program.
        let edition = edition.unwrap_or(1);
        let unchecked = false;
        let authorization = Authorization::from(authorize!(
            process,
            process_inputs!(inputs),
            program,
            function_name,
            private_key,
            rng,
            unchecked,
            edition
        ));
        Ok(authorization)
    }

    /// Create an execution `Authorization` without generating a circuit. Use this function when
    /// fast delegated proving is needed.
    ///
    /// @param private_key The private key of the signer.
    /// @param program The program source code containing the function to authorize.
    /// @param function_name The function to authorize.
    /// @param inputs A javascript array of inputs to the function.
    /// @param imports The imports to the program in the format {"programname.aleo":"aleo instructions source code"}.
    #[wasm_bindgen(js_name = buildAuthorizationUnchecked)]
    pub async fn authorize_unchecked(
        private_key: &PrivateKey,
        program: &str,
        function_name: &str,
        inputs: Array,
        imports: Option<Object>,
        edition: Option<u16>,
    ) -> Result<Authorization, String> {
        let mut process_native = ProcessNative::load_web().map_err(|err| err.to_string())?;
        let process = &mut process_native;

        log("Check program imports are valid and add them to the process");
        let program_native = ProgramNative::from_str(program).map_err(|e| e.to_string())?;
        let program_id = program_native.id().to_string();
        log(&format!("Creating proving request for {program_id}:{function_name}"));
        ProgramManager::resolve_imports(process, imports, Some(program_id.as_str()))?;
        let rng = &mut StdRng::from_entropy();

        // Authorize the main program.
        let unchecked = true;
        let edition = edition.unwrap_or(1);
        let authorization = Authorization::from(authorize!(
            process,
            process_inputs!(inputs),
            program,
            function_name,
            private_key,
            rng,
            unchecked,
            edition
        ));
        Ok(authorization)
    }

    /// Build an authorization from a `Request` object.
    ///
    /// @param {ExecutionRequest} request The execution request to build the authorization from.
    /// @param {string} program The program source code containing the function to authorize.
    /// @param {boolean} unchecked Whether or not to generate an unchecked authorization.
    /// @param {number | undefined} edition The edition of the program.
    /// @param {object | undefined} imports The imports to the program in the format {"programname.aleo":"aleo instructions source code"}.
    /// @param {PrivateKey | undefined} [private_key] Optional private key of the signer. If not provided, functions which call other programs may not succeed.
    #[wasm_bindgen(js_name = buildAuthorizationFromExecutionRequest)]
    pub async fn authorize_request(
        request: &ExecutionRequest,
        program: &str,
        unchecked: bool,
        edition: Option<u16>,
        imports: Option<Object>,
        private_key: Option<PrivateKey>,
    ) -> Result<Authorization, String> {
        // Load the process.
        let mut process_native = ProcessNative::load_web().map_err(|err| err.to_string())?;
        let process = &mut process_native;

        // Get the private key.
        let private_key_native = private_key.map(|pk| PrivateKeyNative::from(pk));

        // Get the request from the wasm wrapper.
        let request_native = RequestNative::from(request);

        log("Check program imports are valid and add them to the process");
        let program_native = ProgramNative::from_str(program).map_err(|e| e.to_string())?;

        // Check that the program id matches the program id in the request.
        let request_program_id = request_native.program_id();
        if request_program_id != program_native.id() {
            return Err(format!(
                "ExecutionRequest program id '{}' does not match provided program source id '{}'",
                request_program_id,
                program_native.id()
            ));
        }

        let program_id = program_native.id().to_string();
        log(&format!("Creating proving request for {request_program_id}:{}", request.function_name()));
        ProgramManager::resolve_imports(process, imports, Some(program_id.as_str()))?;
        let rng = &mut StdRng::from_entropy();

        // Add the program to the process if it is not already there.
        let edition = edition.unwrap_or(1);
        if request_program_id.to_string() != "credits.aleo" {
            if !process.contains_program(request_program_id) {
                log("Adding program to the process");
                process.add_program_with_edition(&program_native, edition).map_err(|e| e.to_string())?;
            }
        }

        // If a private key is provided, use it to authorize the request, otherwise use authorize_request method.
        let authorization = match private_key_native {
            Some(private_key_native) => {
                // Initialize the authorization from the request.
                let authorization = AuthorizationNative::new(request_native.clone());

                // Get the stack.
                let stack = process.get_stack(program_native.id()).map_err(|e| e.to_string())?;

                // Construct the call stack.
                let call_stack =
                    CallStackNative::Authorize(vec![request_native], Some(private_key_native), authorization.clone());
                let caller = None;
                let root_tvk = None;

                // Build unchecked or checked authorization depending on the flag.
                if unchecked {
                    let _response = stack
                        .evaluate_function::<CurrentAleo, _>(call_stack, caller, root_tvk, rng)
                        .map_err(|e| e.to_string())?;
                } else {
                    let _response = stack
                        .execute_function::<CurrentAleo, _>(call_stack, caller, root_tvk, rng)
                        .map_err(|e| e.to_string())?;
                }
                authorization
            }
            None => process.authorize_request::<CurrentAleo, _>(request_native, rng).map_err(|e| e.to_string())?,
        };

        Ok(Authorization::from(authorization))
    }

    /// Create an `Authorization` for `credits.aleo/fee_public` or `credits.aleo/fee_private`.
    /// This object requires an associated execution or deployment ID. This can be gained from
    /// any previously created authorization by calling (authorization.toExecutionId()).
    ///
    /// @param private_key The private key of the signer.
    /// @param deployment_or_execution_id The id of the deployment or execution to authorize the fee program for.
    /// @param base_fee_credits The base fee to be paid for the authorization
    /// @param priority_fee_credits The optional priority fee to be paid for the transaction
    /// @param fee_record The record to spend the fee from
    /// @returns {Authorization}
    #[wasm_bindgen(js_name = authorizeFee)]
    pub async fn authorize_fee(
        private_key: &PrivateKey,
        deployment_or_execution_id: &str,
        base_fee_credits: f64,
        priority_fee_credits: f64,
        fee_record: Option<RecordPlaintext>,
    ) -> Result<Authorization, String> {
        let mut process_native = ProcessNative::load_web().map_err(|err| err.to_string())?;
        let process = &mut process_native;

        log("Check program imports are valid and add them to the process");
        let rng = &mut StdRng::from_entropy();

        let base_fee_microcredits = (base_fee_credits * 1_000_000.0) as u64;
        let priority_fee_microcredits = (priority_fee_credits * 1_000_000.0) as u64;

        // Convert the execution or deployment id string into a Field.
        let id = FieldNative::from_str(deployment_or_execution_id)
            .map_err(|e| format!("Execution or Deployment ID {deployment_or_execution_id} Invalid: {e:?}"))?;

        // Authorize the main program.
        Ok(Authorization::from(authorize_fee!(
            process,
            private_key,
            id,
            base_fee_microcredits,
            priority_fee_microcredits,
            fee_record,
            rng
        )))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        ExecutionRequest,
        PrivateKey,
        Program,
        array,
        utilities::test::{PUZZLE_SPINNER_V002, generate_puzzle_imports, generate_puzzle_inputs, get_env},
    };

    use wasm_bindgen_test::*;

    /// Build an ExecutionRequest for credits.aleo transfer_public for use in authorize_request / proving_request_from_execution_request tests.
    fn transfer_public_execution_request() -> ExecutionRequest {
        let private_key =
            PrivateKey::from_string("APrivateKey1zkp7Vc4xJt8HqW9U7VhY6h32d8Z9Xi5C6ZZX3gtXxbBSJmj").unwrap();
        let inputs = array!["aleo1wp5f52cujua034ts029lq96ke2p505sqc0yrt7yx7x0fcel82yxqe867q9", "500u64"];
        let input_types = array!["address.public", "u64.public"];
        ExecutionRequest::sign(
            private_key,
            "credits.aleo".to_string(),
            "transfer_public".to_string(),
            inputs,
            input_types,
            None,
            None,
            true,
        )
        .unwrap()
    }

    #[wasm_bindgen_test]
    async fn test_authorize_request_from_execution_request() {
        let request = transfer_public_execution_request();
        let private_key =
            PrivateKey::from_string("APrivateKey1zkp7Vc4xJt8HqW9U7VhY6h32d8Z9Xi5C6ZZX3gtXxbBSJmj").unwrap();
        let program = Program::get_credits_program();
        let program_str = program.to_string();

        let authorization =
            ProgramManager::authorize_request(&request, &program_str, false, Some(1), None, Some(private_key))
                .await
                .unwrap();

        assert_eq!(authorization.len(), 1, "transfer_public authorization should have 1 request");
        assert_eq!(authorization.transitions().length(), 1, "transfer_public authorization should have 1 transition");
    }

    #[wasm_bindgen_test]
    async fn test_authorization() {
        // Create the pk, function name, inputs, and imports.
        let private_key = PrivateKey::from_string(&get_env("PUZZLE_PK")).unwrap();
        let function_name = "spin";
        let inputs = generate_puzzle_inputs();
        let imports = Some(generate_puzzle_imports());

        // Create the puzzle spinner authorization and ensure it has the correct amount of transitions.
        let authorization =
            ProgramManager::authorize(&private_key, PUZZLE_SPINNER_V002, function_name, inputs, imports, None)
                .await
                .unwrap();
        console_log!("{authorization:?}");

        // Ensure the number of requests is correct.
        assert_eq!(authorization.len(), 3);
        // Ensure the number of transitions is correct.
        assert_eq!(authorization.transitions().length(), 3);

        // Ensure the authorization serialization roundtrips are valid.
        let authorization_from_string = Authorization::from_string(authorization.to_string()).unwrap();
        let authorization_from_bytes = Authorization::from_bytes_le(authorization.to_bytes_le().unwrap()).unwrap();

        // Ensure the authorization serializations match by the transitive property.
        assert!(authorization_from_string.equals(&authorization) && authorization_from_bytes.equals(&authorization));

        // Create the fee authorization.
        let execution_id = authorization.to_execution_id().unwrap().to_string();
        let fee_authorization =
            ProgramManager::authorize_fee(&private_key, &execution_id, 1.0, 0.0, None).await.unwrap();

        // Assert the authorization is for fee public.
        assert!(fee_authorization.is_fee_public());
        // Assert there is only one request.
        assert_eq!(fee_authorization.len(), 1);
        // Assert there is only one transition.
        assert_eq!(fee_authorization.transitions().length(), 1);
    }
}
