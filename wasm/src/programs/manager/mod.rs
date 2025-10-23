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

mod authorize;
mod deploy;
mod execute;
mod join;
mod proving_request;
mod split;
mod transfer;

const DEFAULT_URL: &str = "https://api.explorer.provable.com/v1";

use crate::{
    Authorization,
    KeyPair,
    OfflineQuery,
    PrivateKey,
    ProvingKey,
    RecordPlaintext,
    VerifyingKey,
    latest_block_height,
    log,
    types::native::{
        AuthorizationNative,
        CurrentNetwork,
        IdentifierNative,
        ProcessNative,
        ProgramIDNative,
        ProgramNative,
        ProvingKeyNative,
        VerifyingKeyNative,
    },
};
use snarkvm_console::{network::{Network, ConsensusVersion}, prelude::ToBytes};
use snarkvm_synthesizer::process::{cost_in_microcredits_v2, deployment_cost};
use snarkvm_synthesizer_program::StackTrait;
use std::panic::{AssertUnwindSafe, catch_unwind};

use js_sys::{Object, Reflect};
use std::str::FromStr;
use wasm_bindgen::prelude::wasm_bindgen;

#[wasm_bindgen]
#[derive(Clone)]
pub struct ProgramManager;

#[wasm_bindgen]
impl ProgramManager {
    /// Synthesize proving and verifying keys for a program
    ///
    /// @param {string} program The program source code of the program to synthesize keys for
    /// @param {string} function_id The function to synthesize keys for
    /// @param {Array} inputs The inputs to the function
    /// @param {Object | undefined} imports The imports for the program
    #[wasm_bindgen(js_name = "synthesizeKeyPair")]
    pub async fn synthesize_keypair(
        private_key: &PrivateKey,
        program: &str,
        function_id: &str,
        inputs: js_sys::Array,
        imports: Option<Object>,
        edition: Option<u16>,
    ) -> Result<KeyPair, String> {
        ProgramManager::execute_function_offline(
            private_key,
            program,
            function_id,
            inputs,
            false,
            true,
            imports,
            None,
            None,
            None,
            None,
            edition,
        )
        .await?
        .get_keys()
    }

    #[wasm_bindgen(js_name = "loadInclusionProver")]
    pub fn load_inclusion_prover(proving_key: ProvingKey) {
        let result = catch_unwind(AssertUnwindSafe(|| {
            let bytes = ProvingKeyNative::from(proving_key).to_bytes_le().expect("failed to convert to bytes");
            <CurrentNetwork as Network>::inclusion_proving_key(Some(bytes));
        }));

        if let Err(err) = result {
            let msg = if let Some(s) = err.downcast_ref::<&str>() {
                format!("loadInclusionProver panicked: {}", s)
            } else if let Some(s) = err.downcast_ref::<String>() {
                format!("loadInclusionProver panicked: {}", s)
            } else {
                "loadInclusionProver panicked with unknown payload".to_string()
            };
            log(msg.as_str());
        }
    }

    /// Estimate the execution cost for an authorization in microcredits.
    /// This function calculates the cost of executing a function based on its authorization,
    /// which is useful for fee estimation before executing a transaction.
    ///
    /// @param {Authorization} authorization The authorization object for the function execution
    /// @param {string | undefined} url Optional URL of the Aleo network node to query block height
    /// @param {OfflineQuery | undefined} offline_query Optional offline query object for block height
    /// @returns {Promise<u64>} The estimated execution cost in microcredits
    #[wasm_bindgen(js_name = "executionCostForAuthorization")]
    pub async fn execution_cost_for_authorization(
        authorization: &Authorization,
        url: Option<String>,
        offline_query: Option<OfflineQuery>,
    ) -> Result<u64, String> {
        use snarkvm_ledger_query::QueryTrait;
        use snarkvm_synthesizer::prelude::{execution_cost_v1, execution_cost_v2};
        
        log("Calculating execution cost for authorization");
        
        // Load the process
        let mut process_native = ProcessNative::load_web().map_err(|err| err.to_string())?;
        let process = &mut process_native;
        
        // Get the block height to determine which version of cost calculation to use
        let node_url = url.as_deref().unwrap_or(DEFAULT_URL);
        let block_height = if let Some(ref offline_query) = offline_query {
            offline_query.current_block_height().map_err(|e| e.to_string())?
        } else {
            latest_block_height(node_url).await.map_err(|e| e.to_string())?
        };
        
        // Convert to native authorization
        let authorization_native = AuthorizationNative::from(authorization);
        
        // Calculate the execution cost using the appropriate version
        let (execution_cost, (_, _)) = if block_height >= CurrentNetwork::CONSENSUS_HEIGHT(ConsensusVersion::V2).unwrap() {
            execution_cost_v2(process, &authorization_native).map_err(|err| err.to_string())?
        } else {
            execution_cost_v1(process, &authorization_native).map_err(|err| err.to_string())?
        };
        
        log(&format!("Execution cost for authorization: {} microcredits", execution_cost));
        Ok(execution_cost)
    }

    /// Check if a process contains a keypair for a specific function
    pub(crate) fn contains_key(
        process: &ProcessNative,
        program_id: &ProgramIDNative,
        function_id: &IdentifierNative,
    ) -> bool {
        process.get_stack(program_id).map_or_else(
            |_| false,
            |stack| stack.contains_proving_key(function_id) && stack.contains_verifying_key(function_id),
        )
    }

    /// Resolve imports for a program in depth first search order
    pub(crate) fn resolve_imports(
        process: &mut ProcessNative,
        program: &ProgramNative,
        imports: Option<Object>,
    ) -> Result<(), String> {
        if let Some(imports) = imports {
            program.imports().keys().try_for_each(|program_id| {
                // Get the program string
                let program_id = program_id.to_string();
                if let Some(import_string) = Reflect::get(&imports, &program_id.as_str().into())
                    .map_err(|_| "Program import not found in imports provided".to_string())?
                    .as_string()
                {
                    if &program_id != "credits.aleo" {
                        log(&format!("Importing program: {program_id}"));
                        let import = ProgramNative::from_str(&import_string).map_err(|err| err.to_string())?;
                        // If the program has imports, add them
                        Self::resolve_imports(process, &import, Some(imports.clone()))?;
                        // If the process does not already contain the program, add it
                        if !process.contains_program(import.id()) {
                            process.add_program(&import).map_err(|err| err.to_string())?;
                            process.add_program(&import).map_err(|err| err.to_string())?;
                        }
                    }
                }
                Ok::<(), String>(())
            })
        } else {
            Ok(())
        }
    }

    pub(crate) fn validate_fee_record(
        fee_record: &Option<RecordPlaintext>,
        minimum_execution_cost: u64,
        priority_fee_microcredits: u64,
    ) -> Result<(), String> {
        let total_fee = priority_fee_microcredits.saturating_add(minimum_execution_cost);
        if let Some(fee_record) = fee_record {
            log("Validating the fee record");
            if fee_record.microcredits() < total_fee {
                return Err(format!(
                    "Fee record does not have enough credits to pay for a fee of {} credits. (base fee: {} credits - priority fee: {} credits)",
                    total_fee as f64 / 1_000_000.0,
                    minimum_execution_cost as f64 / 1_000_000.0,
                    priority_fee_microcredits as f64 / 1_000_000.0,
                ));
            }
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    use crate::Metadata;
    use js_sys::{Object, Reflect};
    use wasm_bindgen::JsValue;
    use wasm_bindgen_test::*;

    pub const MULTIPLY_PROGRAM: &str = r#"// The 'multiply_test.aleo' program which is imported by the 'double_test.aleo' program.
program multiply_test.aleo;

function multiply:
    input r0 as u32.public;
    input r1 as u32.private;
    mul r0 r1 into r2;
    output r2 as u32.private;
"#;

    pub const MULTIPLY_IMPORT_PROGRAM: &str = r#"// The 'double_test.aleo' program that uses a single import from another program to perform doubling.
import multiply_test.aleo;

program double_test.aleo;

function double_it:
    input r0 as u32.private;
    call multiply_test.aleo/multiply 2u32 r0 into r1;
    output r1 as u32.private;
"#;

    pub const ADDITION_PROGRAM: &str = r#"// The 'addition_test.aleo' program is imported by the 'double_test.aleo' program.
program addition_test.aleo;

function binary_add:
    input r0 as u32.public;
    input r1 as u32.private;
    add r0 r1 into r2;
    output r2 as u32.private;
"#;

    pub const NESTED_IMPORT_PROGRAM: &str = r#"// The 'imported_add_mul.aleo' program uses a nested series of imports. It imports the 'double_test.aleo' program
// which then imports the 'multiply_test.aleo' program and implicitly uses that to perform the doubling.
import double_test.aleo;
import addition_test.aleo;

program imported_add_mul.aleo;

function add_and_double:
    input r0 as u32.public;
    input r1 as u32.private;
    call addition_test.aleo/binary_add r0 r1 into r2;
    call double_test.aleo/double_it r2 into r3;
    output r3 as u32.private;
"#;

    #[wasm_bindgen_test]
    fn test_import_resolution() {
        let imports = Object::new();
        Reflect::set(&imports, &JsValue::from_str("multiply_test.aleo"), &JsValue::from_str(MULTIPLY_PROGRAM)).unwrap();
        Reflect::set(&imports, &JsValue::from_str("addition_test.aleo"), &JsValue::from_str(ADDITION_PROGRAM)).unwrap();
        Reflect::set(&imports, &JsValue::from_str("double_test.aleo"), &JsValue::from_str(MULTIPLY_IMPORT_PROGRAM))
            .unwrap();

        let mut process = ProcessNative::load_web().unwrap();
        let program = ProgramNative::from_str(NESTED_IMPORT_PROGRAM).unwrap();
        let add_program = ProgramNative::from_str(ADDITION_PROGRAM).unwrap();
        let multiply_program = ProgramNative::from_str(MULTIPLY_PROGRAM).unwrap();
        let double_program = ProgramNative::from_str(MULTIPLY_IMPORT_PROGRAM).unwrap();

        ProgramManager::resolve_imports(&mut process, &program, Some(imports)).unwrap();

        assert!(process.contains_program(add_program.id()));
        assert!(process.contains_program(multiply_program.id()));
        assert!(process.contains_program(double_program.id()));
    }

    #[wasm_bindgen_test]
    async fn test_load_inclusion_prover() {
        let inclusion_prover_url = Metadata::inclusion().prover;
        console_log!("inclusion prover url: {}", inclusion_prover_url);

        let bytes = reqwest::get(inclusion_prover_url).await.unwrap().bytes().await.unwrap().to_vec();
        let key = ProvingKey::from_bytes(&bytes).unwrap();
        ProgramManager::load_inclusion_prover(key);
    }

    #[wasm_bindgen_test]
    async fn test_execution_cost_for_authorization() {
        use crate::utilities::test::{PUZZLE_SPINNER_V002, generate_puzzle_imports, generate_puzzle_inputs, get_env};
        
        // Create the private key, function name, inputs, and imports.
        let private_key = PrivateKey::from_string(&get_env("PUZZLE_PK")).unwrap();
        let function_name = "spin";
        let inputs = generate_puzzle_inputs();
        let imports = Some(generate_puzzle_imports());

        // Create the authorization.
        let authorization =
            ProgramManager::authorize(&private_key, PUZZLE_SPINNER_V002, function_name, inputs, imports, None)
                .await
                .unwrap();

        // Test execution cost calculation.
        let cost = ProgramManager::execution_cost_for_authorization(&authorization, None, None).await;
        
        // The cost should be a valid u64 value
        assert!(cost.is_ok(), "Execution cost calculation should succeed");
        
        let cost_value = cost.unwrap();
        console_log!("Execution cost for authorization: {} microcredits", cost_value);
        
        // The cost should be greater than zero for a non-trivial function
        assert!(cost_value > 0, "Execution cost should be greater than zero");
    }
}
