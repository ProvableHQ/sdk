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
        CurrentAleo,
        CurrentNetwork,
        Execution,
        Field,
        IdentifierNative,
        ProcessNative,
        ProgramIDNative,
        ProgramNative,
        ProgramOwnerNative,
        ProvingKeyNative,
        QueryNative,
        Response,
        Testnet3,
        TransactionNative,
        VerifyingKeyNative,
    },
    KeyPair,
    PrivateKey,
    ProvingKey,
    RecordPlaintext,
    RecordPlaintextNative,
    Transaction,
    VerifyingKey,
    ExecutionResponse,
    log,
};

use snarkvm_synthesizer::Trace;
use snarkvm_ledger_block::{Fee, Deployment};

use js_sys::{Object, Array, Reflect};
use rand::{rngs::StdRng, SeedableRng};
use core::ops::Add;
use std::future::Future;
use std::str::FromStr;
use std::collections::HashMap;
use wasm_bindgen::prelude::wasm_bindgen;


/// Converts a JS object into a `HashMap<String, String>`.
fn get_imports(imports: Option<Object>) -> Result<Option<HashMap<String, String>>, String> {
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


pub(crate) struct ExecuteFee {
    fee: Fee<Testnet3>,
    private_key: PrivateKey,
}


pub(crate) struct ProveExecution {
    execute: ExecuteProgram,
    execution: Execution<Testnet3>,
}

impl ProveExecution {
    pub(crate) fn execution_id(&self) -> Result<Field<Testnet3>, String> {
        self.execution.to_execution_id().map_err(|e| e.to_string())
    }

    pub(crate) fn into_transaction(self, fee: Option<ExecuteFee>) -> impl Future<Output = Result<Transaction, String>> {
        crate::thread_pool::spawn(move || {
            log("Creating execution transaction");
            let transaction = TransactionNative::from_execution(self.execution, fee.map(|fee| fee.fee))
                .map_err(|err| err.to_string())?;

            Ok(Transaction::from(transaction))
        })
    }
}


pub(crate) struct Deploy {
    deployment: Deployment<Testnet3>,
    minimum_deployment_cost: u64,
}

impl Deploy {
    pub(crate) fn minimum_deployment_cost(&self) -> u64 {
        self.minimum_deployment_cost
    }

    pub(crate) fn execution_id(&self) -> Result<Field<Testnet3>, String> {
        self.deployment.to_deployment_id().map_err(|e| e.to_string())
    }

    pub(crate) fn check_fee(&self, fee_microcredits: u64) -> Result<(), String> {
        log("Ensuring the fee is sufficient to pay for the deployment");

        if fee_microcredits < self.minimum_deployment_cost {
            return Err(format!(
                "Fee is too low to pay for the deployment. The minimum fee is {} credits",
                self.minimum_deployment_cost as f64 / 1_000_000.0
            ));
        }

        Ok(())
    }
}


pub(crate) struct ExecuteProgram {
    locator: String,
    response: Response<Testnet3>,
    trace: Trace<Testnet3>,
}

impl ExecuteProgram {
    pub(crate) fn set_locator(&mut self, locator: String) {
        self.locator = locator;
    }
}


pub(crate) struct ProgramState {
    rng: StdRng,
    process: ProcessNative,
    program: ProgramNative,
}


impl ProgramState {
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


    pub(crate) fn new(
        program_string: String,
        imports: Option<Object>,
    ) -> impl Future<Output = Result<Self, String>> {
        let imports = get_imports(imports);

        crate::thread_pool::spawn(move || {
            let imports = imports?;

            let rng = StdRng::from_entropy();

            let mut process = ProcessNative::load_web().map_err(|err| err.to_string())?;

            log("Loading program");
            let program = ProgramNative::from_str(&program_string).map_err(|e| e.to_string())?;

            log("Check program imports are valid and add them to the process");
            ProgramManager::resolve_imports(&mut process, &program, imports.as_ref())?;

            Ok(Self { rng, process, program })
        })
    }


    /// Check if a process contains a keypair for a specific function
    fn contains_key(
        &self,
        program_id: &ProgramIDNative,
        function_id: &IdentifierNative,
    ) -> bool {
        self.process.get_stack(program_id).map_or_else(
            |_| false,
            |stack| stack.contains_proving_key(function_id) && stack.contains_verifying_key(function_id),
        )
    }


    pub(crate) fn insert_proving_keys(
        self,
        fee_record: Option<RecordPlaintext>,
        fee_proving_key: Option<ProvingKey>,
        fee_verifying_key: Option<VerifyingKey>,
    ) -> impl Future<Output = Result<(Self, Option<RecordPlaintext>, Option<ProvingKey>, Option<VerifyingKey>), String>> {
        crate::thread_pool::spawn(move || {
            let fee_identifier = if fee_record.is_some() {
                IdentifierNative::from_str("fee_private").map_err(|e| e.to_string())?
            } else {
                IdentifierNative::from_str("fee_public").map_err(|e| e.to_string())?
            };

            let stack = self.process.get_stack("credits.aleo").map_err(|e| e.to_string())?;

            if !stack.contains_proving_key(&fee_identifier) && fee_proving_key.is_some() && fee_verifying_key.is_some() {
                let fee_proving_key = fee_proving_key.clone().unwrap();
                let fee_verifying_key = fee_verifying_key.clone().unwrap();
                stack
                    .insert_proving_key(&fee_identifier, ProvingKeyNative::from(fee_proving_key))
                    .map_err(|e| e.to_string())?;
                stack
                    .insert_verifying_key(&fee_identifier, VerifyingKeyNative::from(fee_verifying_key))
                    .map_err(|e| e.to_string())?;
            }

            Ok((self, fee_record, fee_proving_key, fee_verifying_key))
        })
    }


    pub(crate) fn execute_program(
        mut self,
        function_id: String,
        inputs: Vec<String>,
        private_key: PrivateKey,
        proving_key: Option<ProvingKey>,
        verifying_key: Option<VerifyingKey>,
    ) -> impl Future<Output = Result<(Self, ExecuteProgram), String>> {
        crate::thread_pool::spawn(move || {
            if (proving_key.is_some() && verifying_key.is_none()) ||
                (proving_key.is_none() && verifying_key.is_some())
            {
                return Err(
                    "If specifying a key for a program execution, both the proving and verifying key must be specified"
                        .to_string(),
                );
            }

            log("Loading function");
            let function_name = IdentifierNative::from_str(&function_id)
                .map_err(|_| "The function name provided was invalid".to_string())?;

            let id = self.program.id();

            let program_id = id.to_string();

            if program_id != "credits.aleo" {
                log("Adding program to the process");
                if let Ok(stored_program) = self.process.get_program(id) {
                    if stored_program != &self.program {
                        return Err("The program provided does not match the program stored in the cache, please clear the cache before proceeding".to_string());
                    }
                } else {
                    self.process.add_program(&self.program).map_err(|e| e.to_string())?;
                }
            }

            if let Some(proving_key) = proving_key {
                if self.contains_key(id, &function_name) {
                    log(&format!("Proving & verifying keys were specified for {program_id} - {function_name:?} but a key already exists in the cache. Using cached keys"));

                } else {
                    log(&format!("Inserting externally provided proving and verifying keys for {program_id} - {function_name:?}"));

                    self.process
                        .insert_proving_key(id, &function_name, ProvingKeyNative::from(proving_key))
                        .map_err(|e| e.to_string())?;

                    if let Some(verifying_key) = verifying_key {
                        self.process.insert_verifying_key(id, &function_name, VerifyingKeyNative::from(verifying_key))
                            .map_err(|e| e.to_string())?;
                    }
                }
            }


            log("Creating authorization");
            let authorization = self.process
                .authorize::<CurrentAleo, _>(
                    &private_key,
                    id,
                    function_name,
                    inputs.into_iter(),
                    &mut self.rng,
                )
                .map_err(|err| err.to_string())?;

            log("Executing program");
            let (response, trace) = self.process
                .execute::<CurrentAleo>(authorization)
                .map_err(|err| err.to_string())?;

            let locator = program_id.add("/").add(&function_id);

            Ok((self, ExecuteProgram { locator, response, trace }))
        })
    }


    pub(crate) fn prove_execution(
        mut self,
        mut execute: ExecuteProgram,
        url: String,
    ) -> impl Future<Output = Result<(Self, ProveExecution), String>> {
        async move {
            log("Preparing inclusion proofs for execution");
            let query = QueryNative::from(url);
            execute.trace.prepare_async(query).await.map_err(|err| err.to_string())?;

            crate::thread_pool::spawn(move || {
                log("Proving execution");
                let execution = execute.trace.prove_execution::<CurrentAleo, _>(&execute.locator, &mut self.rng)
                    .map_err(|e| e.to_string())?;

                // Verify the execution
                self.process.verify_execution(&execution)
                    .map_err(|err| err.to_string())?;

                Ok((self, ProveExecution { execution, execute }))
            }).await
        }
    }


    pub(crate) fn execute_response(self, execute: ExecuteProgram, cache: bool) -> Result<ExecutionResponse, String> {
        let process = if cache { Some(self.process) } else { None };

        Ok(ExecutionResponse::from((execute.response, process)))
    }


    pub(crate) fn prove_response(self, prove: ProveExecution, cache: bool) -> Result<ExecutionResponse, String> {
        let ProveExecution { execute: ExecuteProgram { response, .. }, execution } = prove;

        let process = if cache { Some(self.process) } else { None };

        Ok(ExecutionResponse::from((response, execution, process)))
    }


    pub(crate) fn estimate_fee(self, execution: ProveExecution) -> impl Future<Output = Result<u64, String>> {
        crate::thread_pool::spawn(move || {
            // Get the storage cost in bytes for the program execution
            log("Estimating cost");

            let storage_cost = execution.execution.size_in_bytes().map_err(|e| e.to_string())?;

            // Compute the finalize cost in microcredits.
            let mut finalize_cost = 0u64;
            // Iterate over the transitions to accumulate the finalize cost.
            for transition in execution.execution.transitions() {
                // Retrieve the function name, program id, and program.
                let function_name = transition.function_name();
                let program_id = transition.program_id();
                let program = self.process.get_program(program_id).map_err(|e| e.to_string())?;

                // Calculate the finalize cost for the function identified in the transition
                let cost = match &program.get_function(function_name).map_err(|e| e.to_string())?.finalize_logic() {
                    Some(finalize) => cost_in_microcredits(finalize).map_err(|e| e.to_string())?,
                    None => continue,
                };

                // Accumulate the finalize cost.
                finalize_cost = finalize_cost
                    .checked_add(cost)
                    .ok_or("The finalize cost computation overflowed for an execution".to_string())?;
            }

            Ok(storage_cost + finalize_cost)
        })
    }


    pub(crate) fn execute_fee(
        mut self,
        execution_id: Field<Testnet3>,
        submission_url: String,
        private_key: PrivateKey,
        fee_microcredits: u64,
        fee_record: Option<RecordPlaintext>,
        fee_proving_key: Option<ProvingKey>,
        fee_verifying_key: Option<VerifyingKey>,
    ) -> impl Future<Output = Result<(Self, ExecuteFee), String>> {
        async move {
            log("Executing fee");

            let (mut state, execution_id, private_key, mut trace) = crate::thread_pool::spawn(move || {
                if (fee_proving_key.is_some() && fee_verifying_key.is_none()) ||
                    (fee_proving_key.is_none() && fee_verifying_key.is_some())
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
                    if self.contains_key(&credits, &fee) {
                        log("Fee proving & verifying keys were specified but a key already exists in the cache. Using cached keys");
                    } else {
                        log("Inserting externally provided fee proving and verifying keys");
                        self.process
                            .insert_proving_key(&credits, &fee, ProvingKeyNative::from(fee_proving_key)).map_err(|e| e.to_string())?;
                        if let Some(fee_verifying_key) = fee_verifying_key {
                            self.process
                                .insert_verifying_key(&credits, &fee, VerifyingKeyNative::from(fee_verifying_key))
                                .map_err(|e| e.to_string())?;
                        }
                    }
                };

                log("Authorizing Fee");
                let fee_authorization = match fee_record {
                    Some(fee_record) => {
                        let fee_record_native = RecordPlaintextNative::from_str(&fee_record.to_string()).unwrap();
                        self.process.authorize_fee_private::<CurrentAleo, _>(
                            &private_key,
                            fee_record_native,
                            fee_microcredits,
                            0u64,
                            execution_id,
                            &mut self.rng,
                        ).map_err(|e| e.to_string())?
                    }
                    None => {
                        self.process.authorize_fee_public::<CurrentAleo, _>(&private_key, fee_microcredits, 0u64, execution_id, &mut self.rng)
                            .map_err(|e| e.to_string())?
                    }
                };

                log("Executing fee");
                let (_, trace) = self.process
                    .execute::<CurrentAleo>(fee_authorization)
                    .map_err(|err| err.to_string())?;

                Ok((self, execution_id, private_key, trace))
            }).await?;

            let query = QueryNative::from(submission_url);
            trace.prepare_async(query).await.map_err(|err| err.to_string())?;

            crate::thread_pool::spawn(move || {
                let fee = trace.prove_fee::<CurrentAleo, _>(&mut state.rng).map_err(|e|e.to_string())?;

                log("Verifying fee execution");
                state.process.verify_fee(&fee, execution_id).map_err(|e| e.to_string())?;

                Ok((state, ExecuteFee { fee, private_key }))
            }).await
        }
    }


    pub(crate) fn deploy(mut self) -> impl Future<Output = Result<(Self, Deploy), String>> {
        crate::thread_pool::spawn(move || {
            log("Creating deployment");
            let deployment = self.process.deploy::<CurrentAleo, _>(&self.program, &mut self.rng).map_err(|err| err.to_string())?;

            if deployment.program().functions().is_empty() {
                return Err("Attempted to create an empty transaction deployment".to_string());
            }

            log("Estimate the deployment fee");
            let (minimum_deployment_cost, (_, _)) =
                deployment_cost::<CurrentNetwork>(&deployment).map_err(|err| err.to_string())?;

            Ok((self, Deploy { deployment, minimum_deployment_cost }))
        })
    }


    pub(crate) fn deploy_transaction(
        mut self,
        deploy: Deploy,
        fee: ExecuteFee,
    ) -> impl Future<Output = Result<Transaction, String>> {
        crate::thread_pool::spawn(move || {
            let deployment_id = deploy.execution_id()?;

            // Create the program owner
            let owner = ProgramOwnerNative::new(&fee.private_key, deployment_id, &mut self.rng)
                .map_err(|err| err.to_string())?;

            log("Verifying the deployment and fees");
            self.process
                .verify_deployment::<CurrentAleo, _>(&deploy.deployment, &mut self.rng)
                .map_err(|err| err.to_string())?;

            log("Creating deployment transaction");
            Ok(Transaction::from(
                TransactionNative::from_deployment(owner, deploy.deployment, fee.fee)
                    .map_err(|err| err.to_string())?,
            ))
        })
    }
}


#[wasm_bindgen]
#[derive(Clone)]
pub struct ProgramManager;

#[wasm_bindgen]
impl ProgramManager {
    pub(crate) fn microcredits(fee_credits: f64, fee_record: &Option<RecordPlaintext>) -> Result<u64, String> {
        match fee_record {
            Some(fee_record) => Self::validate_amount(fee_credits, fee_record, true),
            None => Ok((fee_credits * 1_000_000.0) as u64),
        }
    }

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
        program: String,
        function_id: String,
        inputs: js_sys::Array,
        imports: Option<Object>,
    ) -> Result<KeyPair, String> {
        let program_id = ProgramNative::from_str(&program).map_err(|e| e.to_string())?.id().to_string();
        ProgramManager::execute_function_offline(
            private_key,
            program,
            function_id.clone(),
            inputs,
            false,
            true,
            imports,
            None,
            None,
        )
        .await?
        .get_keys(&program_id, &function_id)
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
