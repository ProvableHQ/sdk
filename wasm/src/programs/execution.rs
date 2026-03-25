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
    native::ProgramIDNative,
    types::native::{
        CurrentNetwork,
        ExecutionNative,
        FieldNative,
        IdentifierNative,
        ProcessNative,
        ProgramNative,
        VerifyingKeyNative,
    },
};
use snarkvm_algorithms::snark::varuna::VarunaVersion;
use snarkvm_console::{network::Network, prelude::Environment};
use snarkvm_synthesizer::prelude::InclusionVersion;

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
    block_height: u32,
) -> Result<bool, String> {
    // Get the function
    let function = IdentifierNative::from_str(function_id).map_err(|e| e.to_string())?;
    let mut process = ProcessNative::load_web().map_err(|e| e.to_string())?;
    let program_native = ProgramNative::from(program);
    let program_id = program_native.id().to_string();

    // First resolve the program's imports.
    ProgramManager::resolve_imports(&mut process, imports, Some(program_id.as_str()))?;

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
                    .map_err(|_| format!("Verifying key not found for imported program {imported_program_id}"))?,
            )
            .map_err(|_| format!("Verifying key not found for imported program {imported_program_id}"))?;
            // Get the verifying key for each function.
            for vk in vk_list.iter() {
                let vk = Array::try_from(vk).map_err(|_| format!("Verifying key and function not found for {imported_program_id}, for each function provide an array of the form ['function_name', 'vk']"))?;
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
    let consensus_version = <CurrentNetwork as Network>::CONSENSUS_VERSION(block_height).map_err(|e| e.to_string())?;
    let inclusion_version =
        if block_height >= <CurrentNetwork as Network>::INCLUSION_UPGRADE_HEIGHT().map_err(|e| e.to_string())? {
            InclusionVersion::V1
        } else {
            InclusionVersion::V0
        };
    process
        .verify_execution(consensus_version, VarunaVersion::V2, inclusion_version, execution)
        .map_or(Ok(false), |_| Ok(true))
}

/// Verify a SNARK proof against a verifying key and public inputs.
///
/// This function verifies a proof produced by an Aleo program that may not be deployed on chain.
/// It directly invokes the Varuna proof verification from snarkVM.
///
/// @param {VerifyingKey} verifying_key The verifying key for the circuit
/// @param {Array<string>} inputs Array of field element strings representing public inputs (e.g. ["1field", "2field"])
/// @param {Proof} proof The proof to verify
/// @returns {boolean} True if the proof is valid, false otherwise
#[wasm_bindgen(js_name = "snarkVerify")]
pub fn snark_verify(verifying_key: &VerifyingKey, inputs: Array, proof: &Proof) -> Result<bool, String> {
    // Parse the input field elements from strings.
    let raw_inputs = parse_field_inputs(&inputs)?;

    // Verify the proof using VarunaVersion::V2 (current standard).
    let is_valid = verifying_key.verify("snark_verify", VarunaVersion::V2, &raw_inputs, proof);

    Ok(is_valid)
}

/// Verify a batch SNARK proof against multiple verifying keys and their corresponding public inputs.
///
/// This function verifies a batch proof produced by Aleo programs that may not be deployed on chain.
/// Each verifying key is paired with one or more sets of public inputs (instances).
///
/// @param {Array<string>} verifying_keys Array of verifying key strings, one per circuit
/// @param {Array<Array<Array<string>>>} inputs 3D array of field element strings [circuit_idx][instance_idx][field_idx]
/// @param {Proof} proof The batch proof to verify
/// @returns {boolean} True if the batch proof is valid, false otherwise
#[wasm_bindgen(js_name = "snarkVerifyBatch")]
pub fn snark_verify_batch(verifying_keys: Array, inputs: Array, proof: &Proof) -> Result<bool, String> {
    if verifying_keys.length() != inputs.length() {
        return Err(format!(
            "Mismatch: {} verifying keys but {} input groups provided. # of input groups must match # of verifying keys.",
            verifying_keys.length(),
            inputs.length()
        ));
    }

    // Build the (VerifyingKey, Vec<Vec<Field>>) pairs for batch verification.
    let mut vks_with_inputs = Vec::with_capacity(verifying_keys.length() as usize);

    for i in 0..verifying_keys.length() {
        // Parse the verifying key from its string representation.
        let vk_str =
            verifying_keys.get(i).as_string().ok_or_else(|| format!("Expected verifying key string at index {i}"))?;
        let vk_native = VerifyingKeyNative::from_str(&vk_str)
            .map_err(|e| format!("Failed to parse verifying key at index {i}: {e}"))?;

        // Get the instances array for this circuit (Array<Array<string>>).
        let instances_js = Array::from(&inputs.get(i));
        let mut instances = Vec::with_capacity(instances_js.length() as usize);

        for j in 0..instances_js.length() {
            let instance_js = Array::from(&instances_js.get(j));
            let fields = parse_field_inputs(&instance_js)?;
            instances.push(fields);
        }

        vks_with_inputs.push((vk_native, instances));
    }

    // Verify the batch proof.
    VerifyingKeyNative::verify_batch("snark_verify_batch", VarunaVersion::V2, vks_with_inputs, proof)
        .map_or(Ok(false), |_| Ok(true))
}

/// Parse an Array of field element strings into a Vec of raw N::Field elements.
fn parse_field_inputs(inputs: &Array) -> Result<Vec<<CurrentNetwork as Environment>::Field>, String> {
    inputs
        .iter()
        .map(|input| {
            let input_str = input
                .as_string()
                .ok_or_else(|| "Invalid input - all inputs must be field element strings".to_string())?;
            let field = FieldNative::from_str(&input_str)
                .map_err(|e| format!("Failed to parse field element '{}': {}", input_str, e))?;
            Ok(*field)
        })
        .collect()
}
