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
    ProvingKey,
    VerifyingKey,
    log,
    types::native::{
        IdentifierNative,
        ProcessNative,
        ProgramIDNative,
        ProgramNative,
        ProvingKeyNative,
        VerifyingKeyNative,
    },
};

use js_sys::{Object, Reflect};
use snarkvm_synthesizer_program::StackTrait;
use std::{collections::HashMap, str::FromStr};
use wasm_bindgen::prelude::wasm_bindgen;

use super::ProgramManager;

/// Internal storage for a single imported program's source and optional keys.
#[derive(Clone)]
struct ProgramEntry {
    program: ProgramNative,
    edition: u16,
    proving_keys: HashMap<IdentifierNative, ProvingKeyNative>,
    verifying_keys: HashMap<IdentifierNative, VerifyingKeyNative>,
}

impl ProgramEntry {
    /// Get the program ID.
    pub fn id(&self) -> &ProgramIDNative {
        self.program.id()
    }

    /// Get the program.
    pub fn program(&self) -> &ProgramNative {
        &self.program
    }
}

/// A builder for specifying program imports with optional proving and verifying keys.
///
/// This type allows callers to provide pre-computed proving and verifying keys
/// alongside imported program source code. Keys are accepted as native WASM
/// `ProvingKey` / `VerifyingKey` objects — no serialization is required.
///
/// Keys are indexed by identifier which can be either a function name (for
/// function keys) or a record name (for translation keys used by `call.dynamic`).
///
/// # Example (JavaScript)
/// ```js
/// const imports = new ProgramImports();
/// imports.addProgram("my_program.aleo", programSource);
/// imports.addProvingKey("my_program.aleo", "my_function", provingKey);
/// imports.addVerifyingKey("my_program.aleo", "my_function", verifyingKey);
/// ```
#[wasm_bindgen]
#[derive(Clone)]
pub struct ProgramImports {
    entries: HashMap<ProgramIDNative, ProgramEntry>,
}

#[wasm_bindgen]
impl ProgramImports {
    /// Create a new empty ProgramImports builder.
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self { entries: HashMap::new() }
    }

    /// Create a ProgramImports from a plain JavaScript object.
    ///
    /// Accepts the legacy format where keys are program names and values are
    /// either source code strings or objects with a `source` property:
    /// ```js
    /// { "my_program.aleo": "program source..." }
    /// // or
    /// { "my_program.aleo": { source: "program source..." } }
    /// ```
    ///
    /// Programs created via this method default to edition 1.
    ///
    /// @param {Object} object A plain JavaScript object mapping program names to source code.
    /// @returns {ProgramImports}
    #[wasm_bindgen(js_name = "fromObject")]
    pub fn from_object(object: Object) -> Self {
        let mut imports = Self::new();
        let keys = Object::keys(&object);
        for i in 0..keys.length() {
            let Some(name) = keys.get(i).as_string() else { continue; };
            let value = Reflect::get(&object, &name.as_str().into()).ok();
            if let Some(source) = extract_source(&value) {
                let _ = imports.add_program(&name, &source, None);
            }
        }
        imports
    }

    /// Add a program's source code to the imports.
    ///
    /// The source is parsed and validated on insertion. Returns an error if the
    /// source is not a valid Aleo program.
    ///
    /// @param {string} name The program name (e.g., "my_program.aleo").
    /// @param {string} source The program source code.
    /// @param {number | undefined} edition The program edition (defaults to 1).
    #[wasm_bindgen(js_name = "addProgram")]
    pub fn add_program(&mut self, name: &str, source: &str, edition: Option<u16>) -> Result<(), String> {
        let program = ProgramNative::from_str(source).map_err(|e| e.to_string())?;
        let program_id = ProgramIDNative::from_str(name).map_err(|e| e.to_string())?;
        let edition = edition.unwrap_or(1);
        self.entries
            .entry(program_id)
            .and_modify(|e| {
                e.program = program.clone();
                e.edition = edition;
            })
            .or_insert_with(|| ProgramEntry {
                program,
                edition,
                proving_keys: HashMap::new(),
                verifying_keys: HashMap::new(),
            });
        Ok(())
    }

    /// Add a proving key for a function or record within an imported program.
    ///
    /// The key is transferred directly from the WASM `ProvingKey` type with no
    /// serialization overhead.
    ///
    /// @param {string} program_name The program name (e.g., "my_program.aleo").
    /// @param {string} identifier The function name or record name the key belongs to.
    /// @param {ProvingKey} key The proving key.
    #[wasm_bindgen(js_name = "addProvingKey")]
    pub fn add_proving_key(&mut self, program_name: &str, identifier: &str, key: ProvingKey) -> Result<(), String> {
        let program_id = ProgramIDNative::from_str(program_name).map_err(|e| e.to_string())?;
        let fn_id = IdentifierNative::from_str(identifier).map_err(|e| e.to_string())?;
        let entry = self.entries.get_mut(&program_id).ok_or_else(|| {
            format!("Program '{program_name}' must be added via addProgram before adding keys")
        })?;
        entry.proving_keys.insert(fn_id, ProvingKeyNative::from(key));
        Ok(())
    }

    /// Add a verifying key for a function or record within an imported program.
    ///
    /// The key is transferred directly from the WASM `VerifyingKey` type with no
    /// serialization overhead.
    ///
    /// @param {string} program_name The program name (e.g., "my_program.aleo").
    /// @param {string} identifier The function name or record name the key belongs to.
    /// @param {VerifyingKey} key The verifying key.
    #[wasm_bindgen(js_name = "addVerifyingKey")]
    pub fn add_verifying_key(&mut self, program_name: &str, identifier: &str, key: VerifyingKey) -> Result<(), String> {
        let program_id = ProgramIDNative::from_str(program_name).map_err(|e| e.to_string())?;
        let fn_id = IdentifierNative::from_str(identifier).map_err(|e| e.to_string())?;
        let entry = self.entries.get_mut(&program_id).ok_or_else(|| {
            format!("Program '{program_name}' must be added via addProgram before adding keys")
        })?;
        entry.verifying_keys.insert(fn_id, VerifyingKeyNative::from(key));
        Ok(())
    }

    /// Convert this ProgramImports to a plain JavaScript object containing only
    /// program sources (no keys). Useful for interop with APIs that accept the
    /// legacy `{ "name.aleo": "source" }` format.
    ///
    /// @returns {Object}
    #[wasm_bindgen(js_name = "toObject")]
    pub fn to_object(&self) -> Object {
        let obj = Object::new();
        for (program_id, entry) in &self.entries {
            let source = entry.program().to_string();
            let name = program_id.to_string();
            Reflect::set(&obj, &name.as_str().into(), &source.as_str().into()).unwrap();
        }
        obj
    }

    /// Check whether any programs have been added to this builder.
    ///
    /// @returns {boolean}
    #[wasm_bindgen(js_name = "hasPrograms")]
    pub fn has_programs(&self) -> bool {
        !self.entries.is_empty()
    }

    /// Check whether a specific program has been added.
    ///
    /// @param {string} name The program name.
    /// @returns {boolean}
    #[wasm_bindgen(js_name = "hasProgram")]
    pub fn has_program(&self, name: &str) -> bool {
        ProgramIDNative::from_str(name).map_or(false, |id| self.entries.contains_key(&id))
    }
}

/// Extract source code from a JS value (plain string or object with `.source`).
///
/// Supports both legacy format (`"source code"`) and structured format
/// (`{ source: "source code", ... }`).
pub(crate) fn extract_source(value: &Option<wasm_bindgen::JsValue>) -> Option<String> {
    let value = value.as_ref()?;
    // Plain string format: "source code"
    if let Some(source) = value.as_string() {
        return Some(source);
    }
    // Structured object format: { source: "source code", ... }
    Reflect::get(value, &"source".into()).ok().and_then(|v| v.as_string())
}

// Internal methods (not exported to JS).
impl ProgramImports {
    /// Resolve all programs and their keys into the given process.
    ///
    /// This performs the following steps:
    /// 1. Iterates all entries and loads program source code into the process
    ///    (respecting transitive static imports via depth-first resolution).
    /// 2. Inserts any pre-provided proving and verifying keys directly into
    ///    the process, avoiding expensive on-demand key synthesis.
    pub(crate) fn resolve_into(&self, process: &mut ProcessNative) -> Result<(), String> {
        let credits_id = ProgramIDNative::from_str("credits.aleo").map_err(|e| e.to_string())?;

        // Phase 1: Load all programs into the process.
        for (program_id, entry) in &self.entries {
            if program_id == &credits_id {
                continue;
            }
            let program = entry.program();
            if !process.contains_program(program.id()) {
                log(&format!("Importing program: {program_id}"));
                // Resolve transitive static imports first.
                self.resolve_program_imports(process, program)?;
                log(&format!("Adding {program_id} to the process"));
                process.add_program_with_edition(program, entry.edition).map_err(|e| e.to_string())?;
            }
        }

        // Phase 2: Insert keys into the process.
        for (program_id, entry) in &self.entries {
            if program_id == &credits_id {
                continue;
            }
            if !process.contains_program(program_id) {
                log(&format!("Program {program_id} not in process, skipping key insertion"));
                continue;
            }

            for (fn_id, pk) in &entry.proving_keys {
                if ProgramManager::contains_key(process, program_id, fn_id) {
                    log(&format!("Key already exists for {program_id}/{fn_id}, skipping"));
                    continue;
                }
                log(&format!("Inserting proving key for {program_id}/{fn_id}"));
                process.insert_proving_key(program_id, fn_id, pk.clone()).map_err(|e| e.to_string())?;
            }

            for (fn_id, vk) in &entry.verifying_keys {
                let has_vk = process.get_stack(program_id).map_or(false, |stack| stack.contains_verifying_key(fn_id));
                if has_vk {
                    log(&format!("Verifying key already exists for {program_id}/{fn_id}, skipping"));
                    continue;
                }
                log(&format!("Inserting verifying key for {program_id}/{fn_id}"));
                process.insert_verifying_key(program_id, fn_id, vk.clone()).map_err(|e| e.to_string())?;
            }
        }

        Ok(())
    }

    /// Recursively resolve a program's static imports in depth-first order.
    fn resolve_program_imports(&self, process: &mut ProcessNative, program: &ProgramNative) -> Result<(), String> {
        let credits_id = ProgramIDNative::from_str("credits.aleo").map_err(|e| e.to_string())?;
        program.imports().keys().try_for_each(|import_id| {
            if *import_id == credits_id {
                return Ok(());
            }
            if let Some(entry) = self.entries.get(import_id) {
                let import = entry.program();
                if !process.contains_program(import.id()) {
                    log(&format!("Importing program: {import_id}"));
                    self.resolve_program_imports(process, import)?;
                    log(&format!("Adding {import_id} to the process"));
                    process.add_program_with_edition(import, entry.edition).map_err(|e| e.to_string())?;
                }
            }
            Ok::<(), String>(())
        })
    }
}
