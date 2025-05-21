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
    PrivateKey,
    ProvingRequest,
    RecordPlaintext,
    authorize_execution,
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
    /// OR
    ///
    /// @param private_key The private key of the sender
    /// @param program The source code of the program being executed
    /// @param function The name of the function to execute
    /// @param inputs A javascript array of inputs to the function
    /// @param base_fee_credits The base fee to be paid for the authorization
    /// @param priority_fee_credits The optional priority fee to be paid for the transaction
    /// @param fee_record The record to spend the fee from
    /// @param imports (optional) Provide a list of imports to use for the function execution in the
    /// form of a javascript object where the keys are a string of the program name and the values
    /// are a string representing the program source code \{ "hello.aleo": "hello.aleo source code" \}
    /// @param url The url of the Aleo network node to send the transaction to
    /// @param broadcast (optional) Flag to indicate if the transaction should be broadcast
    /// @returns {Authorization}
    #[wasm_bindgen(js_name = provingRequest)]
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
    ) -> Result<ProvingRequest, String> {
        log(&format!("Creating proving request for {program}:{function_name}"));
        let mut process_native = ProcessNative::load_web().map_err(|err| err.to_string())?;
        let process = &mut process_native;

        log("Check program imports are valid and add them to the process");
        let program_native = ProgramNative::from_str(program).map_err(|e| e.to_string())?;
        ProgramManager::resolve_imports(process, &program_native, imports)?;
        let rng = &mut StdRng::from_entropy();

        let base_fee_microcredits = (base_fee_credits * 1_000_000.0) as u64;
        let priority_fee_microcredits = (priority_fee_credits * 1_000_000.0) as u64;

        log("Authorizing program");
        let (authorization, fee_authorization) = authorize_execution!(
            process,
            process_inputs!(inputs),
            program,
            function_name,
            private_key,
            base_fee_microcredits,
            priority_fee_microcredits,
            fee_record,
            rng
        );

        // Return the proving
        Ok(ProvingRequest::from((authorization, fee_authorization, broadcast)))
    }
}
