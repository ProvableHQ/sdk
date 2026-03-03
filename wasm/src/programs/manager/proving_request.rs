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
    ExecutionRequest,
    PrivateKey,
    ProvingRequest,
    RecordPlaintext,
    authorize,
    authorize_fee,
    log,
    process_inputs,
    types::native::{
        AuthorizationNative,
        CurrentAleo,
        IdentifierNative,
        ProcessNative,
        ProgramNative,
        RecordPlaintextNative,
    },
};

use js_sys::{Array, Object};
use rand::{SeedableRng, rngs::StdRng};
use std::str::FromStr;

#[wasm_bindgen]
impl ProgramManager {
    /// Create a `ProvingRequest` object. This object creates authorizations for the top level
    /// function and associated fee function. This object can be sent directly to a remote prover
    /// OR used to extract both execution and fee authorizations.
    ///
    /// @param private_key The private key of the signer.
    /// @param program The program source code containing the function to authorize.
    /// @param function_name The function to authorize.
    /// @param inputs A javascript array of inputs to the function.
    /// @param base_fee_credits The base fee to be paid for the authorization
    /// @param priority_fee_credits The optional priority fee to be paid for the transaction
    /// @param fee_record The record to spend the fee from
    /// @param imports The imports to the program in the format {"programname.aleo":"aleo instructions source code"}.
    /// @param url The url of the Aleo network node to send the transaction to
    /// @param broadcast (optional) Flag to indicate if the transaction should be broadcast
    /// @returns {Authorization}
    #[wasm_bindgen(js_name = buildProvingRequest)]
    #[allow(clippy::too_many_arguments)]
    pub async fn proving_request(
        private_key: &PrivateKey,
        program: &str,
        function_name: &str,
        inputs: Array,
        base_fee_credits: f64,
        priority_fee_credits: f64,
        fee_record: Option<RecordPlaintext>,
        imports: Option<Object>,
        broadcast: bool,
        unchecked: bool,
        edition: Option<u16>,
        use_fee_master: bool,
    ) -> Result<ProvingRequest, String> {
        log(&format!("Creating proving request for {function_name}"));
        let mut process_native = ProcessNative::load_web().map_err(|err| err.to_string())?;
        let process = &mut process_native;

        log("Check program imports are valid and add them to the process");
        let program_native = ProgramNative::from_str(program).map_err(|e| e.to_string())?;
        ProgramManager::resolve_imports(process, &program_native, imports.clone())?;
        let rng = &mut StdRng::from_entropy();

        // Convert the fee to microcredits.
        let _base_fee_microcredits = (base_fee_credits * 1_000_000.0) as u64;
        let priority_fee_microcredits = (priority_fee_credits * 1_000_000.0) as u64;
        let edition = edition.unwrap_or(1);

        // Authorize the main program.
        let authorization =
            authorize!(process, process_inputs!(inputs), program, function_name, private_key, rng, unchecked, edition);

        // Add base fee to the authorization.
        let base_fee_microcredits = ProgramManager::estimate_fee_for_authorization(
            &crate::Authorization::from(&authorization),
            program,
            imports,
            Some(edition),
        )?;

        // Authorize the fee.
        let execution_id = authorization.to_execution_id().map_err(|e| e.to_string())?;
        let fee_authorization = if (program_native.id().to_string().as_str() == "credits.aleo")
            && (function_name == "split"
                || function_name == "upgrade"
                || function_name == "fee_public"
                || function_name == "fee_private")
            || use_fee_master
        {
            None
        } else {
            Some(authorize_fee!(
                process,
                private_key,
                execution_id,
                base_fee_microcredits,
                priority_fee_microcredits,
                fee_record,
                rng
            ))
        };

        // Return the proving request.
        Ok(ProvingRequest::from((authorization, fee_authorization, broadcast)))
    }

    /// Build a proving request from a `Request` object. By default this method currently uses the feemaster.
    ///
    /// @param {ExecutionRequest} request The execution request to build the authorization from.
    /// @param {string} program The program source code containing the function to authorize.
    /// @param {object} imports The imports to the program in the format {"programname.aleo":"aleo instructions source code"}.
    /// @param {boolean} unchecked Whether or not to generate an unchecked authorization.
    /// @param {PrivateKey | undefined} [private_key] Optional private key of the signer. If not provided, functions which call other programs may not succeed.
    #[wasm_bindgen(js_name = buildProvingRequestFromExecutionRequest)]
    pub async fn proving_request_from_execution_request(
        request: &ExecutionRequest,
        program: &str,
        imports: Option<Object>,
        unchecked: bool,
        broadcast: bool,
        private_key: Option<PrivateKey>,
    ) -> Result<ProvingRequest, String> {
        let authorization = ProgramManager::authorize_request(request, program, imports, unchecked, private_key)
            .await
            .map_err(|e| e.to_string())?;

        // Return the proving request.
        Ok(ProvingRequest::from((AuthorizationNative::from(authorization), None, broadcast)))
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
        test::{PUZZLE_SPINNER_V002, generate_puzzle_imports, generate_puzzle_inputs, get_env},
    };

    use wasm_bindgen_test::*;

    /// Build an ExecutionRequest for credits.aleo transfer_public for use in proving_request_from_execution_request test.
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
    async fn test_proving_request_from_execution_request() {
        let request = transfer_public_execution_request();
        let private_key =
            PrivateKey::from_string("APrivateKey1zkp7Vc4xJt8HqW9U7VhY6h32d8Z9Xi5C6ZZX3gtXxbBSJmj").unwrap();
        let program = Program::get_credits_program();
        let program_str = program.to_string();

        let proving_request = ProgramManager::proving_request_from_execution_request(
            &request,
            &program_str,
            None,
            false,
            false,
            Some(private_key),
        )
        .await
        .unwrap();

        let authorization = proving_request.authorization();
        assert_eq!(authorization.len(), 1, "transfer_public should have 1 request");
        assert_eq!(authorization.transitions().length(), 1, "transfer_public should have 1 transition");
        // No fee authorization when built from ExecutionRequest (fee is paid by fee master or handled separately).
        assert!(proving_request.fee_authorization().is_none());
    }

    #[wasm_bindgen_test]
    async fn test_nested_proving_request() {
        let private_key = PrivateKey::from_string(&get_env("PUZZLE_PK")).unwrap();
        let function_name = "spin";
        let inputs = generate_puzzle_inputs();
        let imports = Some(generate_puzzle_imports());

        let proving_request = ProgramManager::proving_request(
            &private_key,
            PUZZLE_SPINNER_V002,
            function_name,
            inputs,
            0.0,
            0.0,
            None,
            imports,
            false,
            false,
            Some(1),
            false, // use_fee_master: expect fee authorization
        )
        .await
        .unwrap();

        // Ensure the proving_request serialization roundtrips are valid.
        console_log!("{}", proving_request.to_string());
        let request_from_string = ProvingRequest::from_string(proving_request.to_string()).unwrap();
        let request_from_bytes = ProvingRequest::from_bytes_le(proving_request.to_bytes_le().unwrap()).unwrap();

        // Ensure the proving_request serializations match by the transitive property.
        assert!(request_from_string.equals(&proving_request) && request_from_bytes.equals(&proving_request));

        // Get the main authorization from the proving request.
        let authorization = proving_request.authorization();

        // Assert the number of requests is correct.
        assert_eq!(authorization.len(), 3);
        // Assert the number of transitions is correct.
        assert_eq!(authorization.transitions().length(), 3);

        // Get the fee authorization.
        let fee_authorization = proving_request.fee_authorization().unwrap();

        // Assert the authorization is for fee public.
        assert!(fee_authorization.is_fee_public());
        // Assert there is only one request.
        assert_eq!(fee_authorization.len(), 1);
        // Assert there is only one transition.
        assert_eq!(fee_authorization.transitions().length(), 1);
        assert!(fee_authorization.is_fee_public());
    }

    /// When use_fee_master is true, the ProvingRequest is built without a fee authorization
    /// (fee_authorization is None). The fee will be paid by the fee master instead.
    #[wasm_bindgen_test]
    async fn test_proving_request_with_use_fee_master_has_no_fee_authorization() {
        let private_key = PrivateKey::from_string(&get_env("PUZZLE_PK")).unwrap();
        let function_name = "spin";
        let inputs = generate_puzzle_inputs();
        let imports = Some(generate_puzzle_imports());

        let proving_request = ProgramManager::proving_request(
            &private_key,
            PUZZLE_SPINNER_V002,
            function_name,
            inputs,
            0.0,
            0.0,
            None,
            imports,
            false,
            false,
            Some(1),
            true, // use_fee_master: no fee authorization
        )
        .await
        .unwrap();

        // With use_fee_master, fee is paid by fee master; proving request must have no fee authorization.
        assert!(
            proving_request.fee_authorization().is_none(),
            "use_fee_master=true should produce a ProvingRequest without fee_authorization"
        );

        // Main authorization is still present.
        let authorization = proving_request.authorization();
        assert_eq!(authorization.len(), 3);
        assert_eq!(authorization.transitions().length(), 3);
    }
}
