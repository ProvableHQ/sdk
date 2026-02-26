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
    PrivateKey,
    RecordPlaintext,
    authorize,
    authorize_fee,
    log,
    process_inputs,
    types::native::{CurrentAleo, FieldNative, IdentifierNative, ProcessNative, ProgramNative, RecordPlaintextNative},
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
        log(&format!("Creating proving request for {}:{function_name}", program_native.id()));
        ProgramManager::resolve_imports(process, &program_native, imports.clone())?;
        ProgramManager::resolve_dynamic_imports(process, imports)?;
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
        log(&format!("Creating proving request for {}:{function_name}", program_native.id()));
        ProgramManager::resolve_imports(process, &program_native, imports.clone())?;
        ProgramManager::resolve_dynamic_imports(process, imports)?;
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
    use crate::utilities::test::{PUZZLE_SPINNER_V002, generate_puzzle_imports, generate_puzzle_inputs, get_env};

    use wasm_bindgen_test::*;

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
