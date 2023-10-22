// Copyright (C) 2019-2023 Aleo Systems Inc.
// This file is part of the Aleo SDK library.

// The Aleo SDK library is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// The Aleo SDK library is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with the Aleo SDK library. If not, see <https://www.gnu.org/licenses/>.

pub mod deploy;
pub use deploy::*;

pub mod execute;
pub use execute::*;

pub mod join;
pub use join::*;

pub mod split;
pub use split::*;

pub mod transfer;
pub use transfer::*;

use crate::{
    types::{
        cost_in_microcredits,
        deployment_cost,
        IdentifierNative,
        ProcessNative,
        ProgramIDNative,
        ProgramNative,
        ProvingKeyNative,
        QueryNative,
        Response,
        Testnet3,
        VerifyingKeyNative,
    },
    KeyPair,
    PrivateKey,
    ProvingKey,
    RecordPlaintext,
    VerifyingKey,
    log,
};

use snarkvm_synthesizer::Trace;

use js_sys::{Object, Array, Reflect};
use rand::{rngs::StdRng, SeedableRng};
use core::ops::Add;
use std::str::FromStr;
use std::collections::HashMap;
use wasm_bindgen::prelude::wasm_bindgen;

#[wasm_bindgen]
#[derive(Clone)]
pub struct ProgramManager;

#[wasm_bindgen]
impl ProgramManager {
    /// Validate that an amount being paid from a record is greater than zero and that the record
    /// has enough credits to pay the amount
    pub(crate) fn validate_amount(credits: f64, amount: &RecordPlaintext, fee: bool) -> Result<u64, String> {
        let name = if fee { "Fee" } else { "Amount" };

        if credits <= 0.0 {
            return Err(format!("{name} must be greater than zero to deploy or execute a program"));
        }
        let microcredits = (credits * 1_000_000.0f64) as u64;
        if amount.microcredits() < microcredits {
            return Err(format!("{name} record does not have enough credits to pay the specified fee"));
        }

        Ok(microcredits)
    }

    /// Synthesize proving and verifying keys for a program
    ///
    /// @param program {string} The program source code of the program to synthesize keys for
    /// @param function_id {string} The function to synthesize keys for
    /// @param inputs {Array} The inputs to the function
    /// @param imports {Object | undefined} The imports for the program
    #[wasm_bindgen(js_name = "synthesizeKeyPair")]
    pub async fn synthesize_keypair(
        private_key: &PrivateKey,
        program: &str,
        function_id: &str,
        inputs: js_sys::Array,
        imports: Option<Object>,
    ) -> Result<KeyPair, String> {
        let program_id = ProgramNative::from_str(program).map_err(|e| e.to_string())?.id().to_string();
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
        )
        .await?
        .get_keys(&program_id, function_id)
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

    /// Converts a JS array of strings into a `Vec<String>`.
    pub(crate) fn get_inputs(inputs: Array) -> Result<Vec<String>, String> {
        inputs.iter()
            .map(|input| {
                if let Some(input) = input.as_string() {
                    Ok(input)

                } else {
                    Err("Invalid input - all inputs must be a string specifying the type".to_string())
                }
            })
            .collect()
    }

    /// Converts a JS object into a `HashMap<String, String>`.
    pub(crate) fn get_imports(imports: Option<Object>) -> Result<Option<HashMap<String, String>>, String> {
        if let Some(imports) = imports {
            let mut hash = HashMap::new();

            for key in Object::keys(&imports).iter() {
                let value = Reflect::get(&imports, &key).unwrap();

                let key = key.as_string().ok_or_else(|| "Import key must be a string".to_string())?;
                let value = value.as_string().ok_or_else(|| "Import value must be a string".to_string())?;

                hash.insert(key, value);
            }

            Ok(Some(hash))

        } else {
            Ok(None)
        }
    }

    pub(crate) async fn prove_execution(
        rng: StdRng,
        locator: String,
        trace: Trace<Testnet3>,
        url: &str,
    ) -> Result<(u32), String> {
        log("Preparing inclusion proofs for execution");

        let query = QueryNative::from(url);
        trace.prepare_async(query).await.map_err(|err| err.to_string())?;

        log("Proving execution");

        crate::thread_pool::spawn(move || {
            let execution = trace
                .prove_execution::<CurrentAleo, _>(&locator, &mut rng)
                .map_err(|e| e.to_string())?;

            let execution_id = execution.to_execution_id().map_err(|e| e.to_string())?;

            Ok((execution, execution_id))
        })
    }

    /// Executes an Aleo program.
    pub(crate) fn execute_program(
        private_key: PrivateKey,
        program: String,
        function: String,
        inputs: Vec<String>,
        imports: Option<HashMap<String, String>>,
        proving_key: Option<ProvingKey>,
        verifying_key: Option<VerifyingKey>,
    ) -> impl Future<Output = Result<(ProcessNative, StdRng, String, Response<Testnet3>, Trace<Testnet3>), String>> {
        crate::thread_pool::spawn(move || {
            let mut rng = StdRng::from_entropy();

            let mut process = ProcessNative::load_web().map_err(|err| err.to_string())?;

            log("Loading program");
            let program = ProgramNative::from_str(&program).map_err(|e| e.to_string())?;

            log("Loading function");
            let function_name = IdentifierNative::from_str(&function)
                .map_err(|_| "The function name provided was invalid".to_string())?;

            log("Check program imports are valid and add them to the process");
            ProgramManager::resolve_imports(&mut process, &program, imports.as_ref())?;

            let program_id = program.id().to_string();

            if (proving_key.is_some() && verifying_key.is_none())
                || (proving_key.is_none() && verifying_key.is_some())
            {
                return Err(
                    "If specifying a key for a program execution, both the proving and verifying key must be specified"
                        .to_string(),
                );
            }

            if program_id != "credits.aleo" {
                log("Adding program to the process");
                if let Ok(stored_program) = process.get_program(program.id()) {
                    if stored_program != &program {
                        return Err("The program provided does not match the program stored in the cache, please clear the cache before proceeding".to_string());
                    }
                } else {
                    process.add_program(&program).map_err(|e| e.to_string())?;
                }
            }

            if let Some(proving_key) = proving_key {
                if Self::contains_key(&process, program.id(), &function_name) {
                    log(&format!("Proving & verifying keys were specified for {program_id} - {function_name:?} but a key already exists in the cache. Using cached keys"));

                } else {
                    log(&format!("Inserting externally provided proving and verifying keys for {program_id} - {function_name:?}"));
                    process
                        .insert_proving_key(program.id(), &function_name, ProvingKeyNative::from(proving_key))
                        .map_err(|e| e.to_string())?;
                    if let Some(verifying_key) = verifying_key {
                        process.insert_verifying_key(program.id(), &function_name, VerifyingKeyNative::from(verifying_key)).map_err(|e| e.to_string())?;
                    }
                }
            };

            log("Creating authorization");
            let authorization = process
                .authorize::<CurrentAleo, _>(
                    &private_key,
                    program.id(),
                    function_name,
                    inputs.into_iter(),
                    &mut rng,
                )
                .map_err(|err| err.to_string())?;

            log("Executing program");
            let (response, trace) = process
                .execute::<CurrentAleo>(authorization)
                .map_err(|err| err.to_string())?;

            let locator = program_id.add("/").add(&function);

            Ok((process, rng, locator, response, trace))
        })
    }

    /// Executes the Aleo fee.
    pub(crate) fn execute_fee(
        process: &mut ProcessNative,
        rng: &mut StdRng,
        private_key: &PrivateKey,
        fee_record: Option<RecordPlaintext>,
        fee_microcredits: u64,
        url: String,
        fee_proving_key: Option<ProvingKey>,
        fee_verifying_key: Option<VerifyingKey>,
        execution_id: Field<Testnet3>,
    ) -> Result<Fee<Testnet3>, String> {
        if ((fee_proving_key.is_some() && fee_verifying_key.is_none())
            || (fee_proving_key.is_none() && fee_verifying_key.is_some()))
        {
            return Err(
                 "Missing key - both the proving and verifying key must be specified for a program execution"
                    .to_string(),
            );
        }

        if let Some(fee_proving_key) = fee_proving_key {
            let credits = ProgramIDNative::from_str("credits.aleo").unwrap();
            let fee = if fee_record.is_some() {
                IdentifierNative::from_str("fee_private").unwrap()
            } else {
                IdentifierNative::from_str("fee_public").unwrap()
            };
            if Self::contains_key(process, &credits, &fee) {
                log("Fee proving & verifying keys were specified but a key already exists in the cache. Using cached keys");
            } else {
                log("Inserting externally provided fee proving and verifying keys");
                process
                    .insert_proving_key(&credits, &fee, ProvingKeyNative::from(fee_proving_key)).map_err(|e| e.to_string())?;
                if let Some(fee_verifying_key) = fee_verifying_key {
                    process
                        .insert_verifying_key(&credits, &fee, VerifyingKeyNative::from(fee_verifying_key))
                        .map_err(|e| e.to_string())?;
                }
            }
        };

        log("Authorizing Fee");
        let fee_authorization = match fee_record {
            Some(fee_record) => {
                let fee_record_native = RecordPlaintextNative::from_str(&fee_record.to_string()).unwrap();
                process.authorize_fee_private(
                    private_key,
                    fee_record_native,
                    fee_microcredits,
                    execution_id,
                    rng,
                ).map_err(|e| e.to_string())?
            }
            None => {
                process.authorize_fee_public(private_key, fee_microcredits, execution_id, rng).map_err(|e| e.to_string())?
            }
        };

        log("Executing fee");
        let (_, mut trace) = process
            .execute::<CurrentAleo>(fee_authorization)
            .map_err(|err| err.to_string())?;

        let query = QueryNative::from(&submission_url);
        trace.prepare_async(query).await.map_err(|err| err.to_string())?;
        let fee = trace.prove_fee::<CurrentAleo, _>(&mut StdRng::from_entropy()).map_err(|e|e.to_string())?;

        log("Verifying fee execution");
        process.verify_fee(&fee, execution_id).map_err(|e| e.to_string())?;

        Ok(fee)
    }

    /// Resolve imports for a program in depth first search order
    pub(crate) fn resolve_imports(
        process: &mut ProcessNative,
        program: &ProgramNative,
        imports: Option<&HashMap<String, String>>,
    ) -> Result<(), String> {
        if let Some(imports) = imports {
            program.imports().keys().try_for_each(|program_id| {
                // Get the program string
                let program_id = program_id.to_string();
                if let Some(import_string) = imports.get(program_id.as_str()) {
                    if &program_id != "credits.aleo" {
                        crate::log(&format!("Importing program: {}", program_id));
                        let import = ProgramNative::from_str(&import_string).map_err(|err| err.to_string())?;
                        // If the program has imports, add them
                        Self::resolve_imports(process, &import, Some(imports))?;
                        // If the process does not already contain the program, add it
                        if !process.contains_program(import.id()) {
                            process.add_program(&import).map_err(|err| err.to_string())?;
                        }
                    }

                    Ok::<(), String>(())
                } else {
                    Err("Program import not found in imports provided".to_string())
                }
            })
        } else {
            Ok(())
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

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

        let add_import = process.get_program("addition_test.aleo").unwrap();
        let multiply_import = process.get_program("multiply_test.aleo").unwrap();
        let double_import = process.get_program("double_test.aleo").unwrap();
        let main_program = process.get_program("imported_add_mul.aleo");

        assert_eq!(add_import, &add_program);
        assert_eq!(multiply_import, &multiply_program);
        assert_eq!(double_import, &double_program);
        assert!(main_program.is_err());
    }
}
