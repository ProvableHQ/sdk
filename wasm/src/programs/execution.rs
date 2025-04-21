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

pub use super::*;
use crate::{
    Transition,
    log,
    types::native::{
        ExecutionNative,
        IdentifierNative,
        ProcessNative,
        ProgramIDNative,
        ProgramNative,
        VerifyingKeyNative,
    },
};
use snarkvm_algorithms::snark::varuna::VarunaVersion;

use js_sys::{Array, Object, Reflect};
use std::{ops::Deref, str::FromStr};
use wasm_bindgen::{JsValue, prelude::wasm_bindgen};

/// Execution of an Aleo program.
#[wasm_bindgen]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Execution(ExecutionNative);

#[wasm_bindgen]
impl Execution {
    /// Returns the string representation of the execution.
    ///
    /// @returns {string} The string representation of the execution.
    #[wasm_bindgen(js_name = "toString")]
    #[allow(clippy::inherent_to_string)]
    pub fn to_string(&self) -> String {
        self.0.to_string()
    }

    /// Creates an execution object from a string representation of an execution.
    ///
    /// @returns {Execution | Error} The wasm representation of an execution object.
    #[wasm_bindgen(js_name = "fromString")]
    pub fn from_string(execution: &str) -> Result<Execution, String> {
        Ok(Self(ExecutionNative::from_str(execution).map_err(|e| e.to_string())?))
    }

    /// Returns the global state root of the execution.
    ///
    /// @returns {Execution | Error} The global state root used in the execution.
    #[wasm_bindgen(js_name = "globalStateRoot")]
    pub fn global_state_root(&self) -> String {
        self.0.global_state_root().to_string()
    }

    /// Returns the proof of the execution.
    ///
    /// @returns {string} The execution proof.
    pub fn proof(&self) -> String {
        self.0.proof().map(|proof| proof.to_string()).unwrap_or("".to_string())
    }

    /// Returns the transitions present in the execution.
    ///
    /// @returns Array<Transition> the array of transitions present in the execution.
    pub fn transitions(&self) -> Array {
        self.0.transitions().map(|transition| JsValue::from(Transition::from(transition))).collect::<Array>()
    }
}

impl From<ExecutionNative> for Execution {
    fn from(native: ExecutionNative) -> Self {
        Self(native)
    }
}

impl From<Execution> for ExecutionNative {
    fn from(execution: Execution) -> Self {
        execution.0
    }
}

impl Deref for Execution {
    type Target = ExecutionNative;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

/// Verify an execution. Executions with multiple transitions must have the program source code and
/// verifying keys of imported functions supplied from outside to correctly verify. Also, this does
/// not verify that the state root of the execution is included in the Aleo Network ledger.
///
/// @param {Execution} execution The function execution to verify
/// @param {VerifyingKey} verifying_key The verifying key for the function
/// @param {Program} program The program that the function execution belongs to
/// @param {String} function_id The name of the function that was executed
/// @param {Object} imports The imports for the program in the form of { "program_id.aleo":"source code", ... }
/// @param {Object} import_verifying_keys The verifying keys for the imports in the form of { "program_id.aleo": [["function, "verifying_key"], ...],  ...}
/// @returns {boolean} True if the execution is valid, false otherwise
#[wasm_bindgen(js_name = "verifyFunctionExecution")]
pub fn verify_function_execution(
    execution: &Execution,
    verifying_key: &VerifyingKey,
    program: &Program,
    function_id: &str,
    imports: Option<Object>,
    imported_verifying_keys: Option<Object>,
) -> Result<bool, String> {
    // Get the function
    let function = IdentifierNative::from_str(function_id).map_err(|e| e.to_string())?;
    let mut process = ProcessNative::load_web().map_err(|e| e.to_string())?;
    let program_native = ProgramNative::from(program);

    // First resolve the program's imports.
    ProgramManager::resolve_imports(&mut process, program, imports)?;

    // Secondly, get the verifying keys and insert them into the process object.
    if let Some(imported_verifying_keys) = imported_verifying_keys {
        // Go through the imports and get the program IDs.
        let program_ids = Object::keys(&imported_verifying_keys)
            .iter()
            .map(|entry| {
                let entry = entry.as_string().unwrap(); // Safe unwraps because `keys` returns array of string keys.
                ProgramIDNative::from_str(&entry)
                    .map_err(|_| format!("Program ID not found in imports provided: {entry}"))
            })
            .collect::<Result<Vec<_>, _>>()?;

        // Go through the imports and insert the verifying keys for each function.
        for imported_program_id in &program_ids {
            // Get the list of functions.
            let vk_list = Array::try_from(
                Reflect::get(&imported_verifying_keys, &imported_program_id.to_string().into())
                    .map_err(|_| format!("Verifying key not found for imported program {}", imported_program_id))?,
            )
            .map_err(|_| format!("Verifying key not found for imported program {}", imported_program_id))?;
            // Get the verifying key for each function.
            for vk in vk_list.iter() {
                let vk = Array::try_from(vk).map_err(|_| format!("Verifying key and function not found for {}, for each function provide an array of the form ['function_name', 'vk']", imported_program_id))?;
                {
                    // Insert the verifying key into the temporary process.
                    let imported_function = IdentifierNative::from_str(
                        &vk.get(0).as_string().ok_or("Function not found in imports provided")?,
                    )
                    .map_err(|e| e.to_string())?;
                    let verifying_key = VerifyingKeyNative::from_str(
                        &vk.get(1).as_string().ok_or("Verifying key not found in imports provided")?,
                    )
                    .map_err(|e| e.to_string())?;
                    log(&format!("Importing verifying key for function: {imported_program_id}/{imported_function}"));
                    process
                        .insert_verifying_key(imported_program_id, &imported_function, verifying_key)
                        .map_err(|e| e.to_string())?;
                }
            }
        }
    }

    // If the program is not credits.aleo, add the program and its verifying key to the process.
    if &program.id() != "credits.aleo" {
        process.add_program(&program_native).map_err(|e| e.to_string())?;
        process
            .insert_verifying_key(program_native.id(), &function, VerifyingKeyNative::from(verifying_key))
            .map_err(|e| e.to_string())?;
    }

    // Verify the execution.
    process.verify_execution(VarunaVersion::V2, execution).map_or(Ok(false), |_| Ok(true))
}
