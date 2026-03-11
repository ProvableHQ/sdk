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

use js_sys::{Array, Object, Reflect, Uint8Array};
use snarkvm_synthesizer_program::StackTrait;
use snarkvm_wasm::utilities::{FromBytes, ToBytes};
use std::{collections::HashMap, str::FromStr};
use wasm_bindgen::{JsCast, JsValue, prelude::wasm_bindgen};

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
    /// Accepts three formats:
    /// ```js
    /// // 1. Plain string — source code only.
    /// { "my_program.aleo": "program source..." }
    ///
    /// // 2. Structured — program source with optional edition.
    /// { "my_program.aleo": { program: "program source..." } }
    ///
    /// // 3. Structured with keys — program source plus proving/verifying keys per function.
    /// {
    ///   "my_program.aleo": {
    ///     program: "program source...",
    ///     keys: {
    ///       "my_function": {
    ///         provingKey: Uint8Array,
    ///         verifyingKey: Uint8Array
    ///       }
    ///     }
    ///   }
    /// }
    /// ```
    ///
    /// Programs created via this method default to edition 1.
    ///
    /// @param {Object} object A plain JavaScript object mapping program names to source code
    ///   and optional keys.
    /// @returns {ProgramImports}
    #[wasm_bindgen(js_name = "fromObject")]
    pub fn from_object(object: Object) -> Self {
        let mut imports = Self::new();
        let keys = Object::keys(&object);
        for i in 0..keys.length() {
            let Some(name) = keys.get(i).as_string() else {
                continue;
            };
            let value = Reflect::get(&object, &name.as_str().into()).ok();
            if let Some(source) = extract_source(&value) {
                let _ = imports.add_program(&name, &source, None);
                if let Some(value) = value.as_ref() {
                    extract_keys_from_value(&mut imports, &name, value);
                }
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
        let entry = self
            .entries
            .get_mut(&program_id)
            .ok_or_else(|| format!("Program '{program_name}' must be added via addProgram before adding keys"))?;
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
        let entry = self
            .entries
            .get_mut(&program_id)
            .ok_or_else(|| format!("Program '{program_name}' must be added via addProgram before adding keys"))?;
        entry.verifying_keys.insert(fn_id, VerifyingKeyNative::from(key));
        Ok(())
    }

    /// Add a proving key from its byte representation.
    ///
    /// Deserializes the bytes into a native proving key and stores it. The program
    /// must already have been added via `addProgram`.
    ///
    /// @param {string} program_name The program name (e.g., "my_program.aleo").
    /// @param {string} identifier The function name or record name the key belongs to.
    /// @param {Uint8Array} bytes The proving key bytes.
    #[wasm_bindgen(js_name = "addProvingKeyBytes")]
    pub fn add_proving_key_bytes(&mut self, program_name: &str, identifier: &str, bytes: &[u8]) -> Result<(), String> {
        let program_id = ProgramIDNative::from_str(program_name).map_err(|e| e.to_string())?;
        let fn_id = IdentifierNative::from_str(identifier).map_err(|e| e.to_string())?;
        let entry = self
            .entries
            .get_mut(&program_id)
            .ok_or_else(|| format!("Program '{program_name}' must be added via addProgram before adding keys"))?;
        let pk = ProvingKeyNative::from_bytes_le(bytes).map_err(|e| e.to_string())?;
        entry.proving_keys.insert(fn_id, pk);
        Ok(())
    }

    /// Add a verifying key from its byte representation.
    ///
    /// Deserializes the bytes into a native verifying key and stores it. The program
    /// must already have been added via `addProgram`.
    ///
    /// @param {string} program_name The program name (e.g., "my_program.aleo").
    /// @param {string} identifier The function name or record name the key belongs to.
    /// @param {Uint8Array} bytes The verifying key bytes.
    #[wasm_bindgen(js_name = "addVerifyingKeyBytes")]
    pub fn add_verifying_key_bytes(
        &mut self,
        program_name: &str,
        identifier: &str,
        bytes: &[u8],
    ) -> Result<(), String> {
        let program_id = ProgramIDNative::from_str(program_name).map_err(|e| e.to_string())?;
        let fn_id = IdentifierNative::from_str(identifier).map_err(|e| e.to_string())?;
        let entry = self
            .entries
            .get_mut(&program_id)
            .ok_or_else(|| format!("Program '{program_name}' must be added via addProgram before adding keys"))?;
        let vk = VerifyingKeyNative::from_bytes_le(bytes).map_err(|e| e.to_string())?;
        entry.verifying_keys.insert(fn_id, vk);
        Ok(())
    }

    /// Get a proving key for a specific program and identifier (function or record name).
    /// Uses `.take()` semantics — the key is removed from the builder on first call.
    ///
    /// @param {string} program_name The program name (e.g., "my_program.aleo").
    /// @param {string} identifier The function or record name.
    /// @returns {ProvingKey | undefined}
    #[wasm_bindgen(js_name = "getProvingKey")]
    pub fn get_proving_key(&mut self, program_name: &str, identifier: &str) -> Option<ProvingKey> {
        let program_id = ProgramIDNative::from_str(program_name).ok()?;
        let fn_id = IdentifierNative::from_str(identifier).ok()?;
        let entry = self.entries.get_mut(&program_id)?;
        entry.proving_keys.remove(&fn_id).map(ProvingKey::from)
    }

    /// Get a verifying key for a specific program and identifier (function or record name).
    /// Uses `.take()` semantics — the key is removed from the builder on first call.
    ///
    /// @param {string} program_name The program name (e.g., "my_program.aleo").
    /// @param {string} identifier The function or record name.
    /// @returns {VerifyingKey | undefined}
    #[wasm_bindgen(js_name = "getVerifyingKey")]
    pub fn get_verifying_key(&mut self, program_name: &str, identifier: &str) -> Option<VerifyingKey> {
        let program_id = ProgramIDNative::from_str(program_name).ok()?;
        let fn_id = IdentifierNative::from_str(identifier).ok()?;
        let entry = self.entries.get_mut(&program_id)?;
        entry.verifying_keys.remove(&fn_id).map(VerifyingKey::from)
    }

    /// Convert this ProgramImports to a plain JavaScript object.
    ///
    /// Entries without keys use the simple `{ "name.aleo": "source" }` format.
    /// Entries with keys use the structured format:
    /// ```js
    /// {
    ///   "name.aleo": {
    ///     program: "program source...",
    ///     keys: {
    ///       "function_name": {
    ///         provingKey: Uint8Array,
    ///         verifyingKey: Uint8Array
    ///       }
    ///     }
    ///   }
    /// }
    /// ```
    ///
    /// @returns {Object}
    #[wasm_bindgen(js_name = "toObject")]
    pub fn to_object(&self) -> Object {
        let obj = Object::new();
        for (program_id, entry) in &self.entries {
            let name = program_id.to_string();
            let source = entry.program().to_string();

            let has_keys = !entry.proving_keys.is_empty() || !entry.verifying_keys.is_empty();
            if !has_keys {
                Reflect::set(&obj, &name.as_str().into(), &source.as_str().into()).unwrap();
                continue;
            }

            // Structured format with keys.
            let structured = Object::new();
            Reflect::set(&structured, &"program".into(), &source.as_str().into()).unwrap();

            let keys_obj = Object::new();
            // Collect all identifier names that have at least one key.
            let mut fn_ids: Vec<&IdentifierNative> = Vec::new();
            for fn_id in entry.proving_keys.keys() {
                fn_ids.push(fn_id);
            }
            for fn_id in entry.verifying_keys.keys() {
                if !entry.proving_keys.contains_key(fn_id) {
                    fn_ids.push(fn_id);
                }
            }

            for fn_id in fn_ids {
                let fn_name = fn_id.to_string();
                let key_pair = Object::new();

                if let Some(pk) = entry.proving_keys.get(fn_id) {
                    if let Ok(bytes) = pk.to_bytes_le() {
                        let arr = Uint8Array::from(bytes.as_slice());
                        Reflect::set(&key_pair, &"provingKey".into(), &arr.into()).unwrap();
                    }
                }
                if let Some(vk) = entry.verifying_keys.get(fn_id) {
                    if let Ok(bytes) = vk.to_bytes_le() {
                        let arr = Uint8Array::from(bytes.as_slice());
                        Reflect::set(&key_pair, &"verifyingKey".into(), &arr.into()).unwrap();
                    }
                }

                Reflect::set(&keys_obj, &fn_name.as_str().into(), &key_pair.into()).unwrap();
            }

            Reflect::set(&structured, &"keys".into(), &keys_obj.into()).unwrap();
            Reflect::set(&obj, &name.as_str().into(), &structured.into()).unwrap();
        }
        obj
    }

    /// Return the names of all programs in this builder as a JS `Array<string>`.
    ///
    /// This is a lightweight alternative to `toObject()` when you only need to
    /// enumerate program names without serializing keys.
    ///
    /// @returns {Array<string>}
    #[wasm_bindgen(js_name = "programNames")]
    pub fn program_names(&self) -> Array {
        let arr = Array::new_with_length(self.entries.len() as u32);
        for (i, program_id) in self.entries.keys().enumerate() {
            arr.set(i as u32, JsValue::from_str(&program_id.to_string()));
        }
        arr
    }

    /// Return the source code of a program by name, without serializing keys.
    ///
    /// @param {string} name The program name (e.g., "my_program.aleo").
    /// @returns {string | undefined}
    #[wasm_bindgen(js_name = "getProgram")]
    pub fn get_program(&self, name: &str) -> Option<String> {
        let program_id = ProgramIDNative::from_str(name).ok()?;
        self.entries.get(&program_id).map(|entry| entry.program().to_string())
    }

    /// Check whether any programs have been added to this builder.
    ///
    /// @returns {boolean}
    #[wasm_bindgen(js_name = "isEmpty")]
    pub fn is_empty(&self) -> bool {
        self.entries.is_empty()
    }

    /// Check whether a specific program has been added.
    ///
    /// @param {string} name The program name.
    /// @returns {boolean}
    #[wasm_bindgen(js_name = "contains")]
    pub fn contains(&self, name: &str) -> bool {
        ProgramIDNative::from_str(name).map_or(false, |id| self.entries.contains_key(&id))
    }
}

/// Extract source code from a JS value (plain string or object with `.program`).
///
/// Supports both legacy format (`"source code"`) and structured format
/// (`{ program: "source code", ... }`).
pub(crate) fn extract_source(value: &Option<wasm_bindgen::JsValue>) -> Option<String> {
    let value = value.as_ref()?;
    // Plain string format: "source code"
    if let Some(program) = value.as_string() {
        return Some(program);
    }
    // Structured object format: { program: "source code", ... }
    Reflect::get(value, &"program".into()).ok().and_then(|v| v.as_string())
}

/// Extract proving and verifying keys from a structured JS value's `keys` property.
///
/// Keys must be provided as `Uint8Array` byte representations.
/// Expects the format:
/// ```js
/// { keys: { "fn_name": { provingKey: Uint8Array, verifyingKey: Uint8Array } } }
/// ```
/// Silently skips any entries that are missing, malformed, or not valid `Uint8Array` values.
fn extract_keys_from_value(imports: &mut ProgramImports, program_name: &str, value: &wasm_bindgen::JsValue) {
    let Ok(keys_obj) = Reflect::get(value, &"keys".into()) else { return };
    if keys_obj.is_undefined() || keys_obj.is_null() {
        return;
    }
    let Ok(keys_obj) = keys_obj.dyn_into::<Object>() else { return };
    let fn_names = Object::keys(&keys_obj);

    for i in 0..fn_names.length() {
        let Some(fn_name) = fn_names.get(i).as_string() else { continue };
        let Ok(key_pair) = Reflect::get(&keys_obj, &fn_name.as_str().into()) else { continue };

        if let Ok(pk_val) = Reflect::get(&key_pair, &"provingKey".into()) {
            if let Ok(arr) = pk_val.dyn_into::<Uint8Array>() {
                let _ = imports.add_proving_key_bytes(program_name, &fn_name, &arr.to_vec());
            }
        }
        if let Ok(vk_val) = Reflect::get(&key_pair, &"verifyingKey".into()) {
            if let Ok(arr) = vk_val.dyn_into::<Uint8Array>() {
                let _ = imports.add_verifying_key_bytes(program_name, &fn_name, &arr.to_vec());
            }
        }
    }
}

// Internal methods (not exported to JS).
impl ProgramImports {
    /// Load all programs and their keys into the given process.
    ///
    /// For each entry, this:
    /// 1. Recursively resolves transitive static imports (depth-first).
    /// 2. Adds the program to the process.
    /// 3. Inserts any pre-provided proving and verifying keys, avoiding
    ///    expensive on-demand key synthesis.
    pub(crate) fn load_programs(&self, process: &mut ProcessNative) -> Result<(), String> {
        let credits_id = ProgramIDNative::from_str("credits.aleo").map_err(|e| e.to_string())?;

        for (program_id, entry) in &self.entries {
            if program_id == &credits_id {
                continue;
            }
            if !process.contains_program(entry.id()) {
                log(&format!("Importing program: {program_id}"));
                self.resolve_program_imports(process, entry.program())?;
                log(&format!("Adding {program_id} to the process"));
                process.add_program_with_edition(entry.program(), entry.edition).map_err(|e| e.to_string())?;
            }
            self.insert_entry_keys(process, program_id, entry)?;
        }

        Ok(())
    }

    /// Insert pre-provided proving and verifying keys for a single program entry.
    fn insert_entry_keys(
        &self,
        process: &mut ProcessNative,
        program_id: &ProgramIDNative,
        entry: &ProgramEntry,
    ) -> Result<(), String> {
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

        Ok(())
    }

    /// Recursively resolve a program's static imports in depth-first order,
    /// inserting keys for each transitive import as it is loaded.
    fn resolve_program_imports(&self, process: &mut ProcessNative, program: &ProgramNative) -> Result<(), String> {
        let credits_id = ProgramIDNative::from_str("credits.aleo").map_err(|e| e.to_string())?;
        program.imports().keys().try_for_each(|import_id| {
            if *import_id == credits_id {
                return Ok(());
            }
            if let Some(entry) = self.entries.get(import_id) {
                if !process.contains_program(entry.id()) {
                    log(&format!("Importing program: {import_id}"));
                    self.resolve_program_imports(process, entry.program())?;
                    log(&format!("Adding {import_id} to the process"));
                    process.add_program_with_edition(entry.program(), entry.edition).map_err(|e| e.to_string())?;
                }
                self.insert_entry_keys(process, import_id, entry)?;
            }
            Ok::<(), String>(())
        })
    }

    /// Extract synthesized proving and verifying keys from the process back into
    /// this builder. For every program entry, iterates its functions and pulls
    /// any keys that exist in the process but are not already stored here.
    ///
    /// This is called after execution completes so the caller can persist the
    /// synthesized keys (e.g., to a KeyStore) without re-synthesis.
    pub(crate) fn extract_keys(&mut self, process: &ProcessNative) {
        let credits_id = ProgramIDNative::from_str("credits.aleo").ok();

        for (program_id, entry) in &mut self.entries {
            if credits_id.as_ref() == Some(program_id) {
                continue;
            }

            // Iterate all functions in the program and extract keys from the process.
            for function_name in entry.program.functions().keys() {
                if !entry.proving_keys.contains_key(function_name) {
                    if let Ok(pk) = process.get_proving_key(program_id, function_name) {
                        log(&format!("Extracted proving key for {program_id}/{function_name}"));
                        entry.proving_keys.insert(function_name.clone(), pk);
                    }
                }
                if !entry.verifying_keys.contains_key(function_name) {
                    if let Ok(vk) = process.get_verifying_key(program_id, function_name) {
                        log(&format!("Extracted verifying key for {program_id}/{function_name}"));
                        entry.verifying_keys.insert(function_name.clone(), vk);
                    }
                }
            }
        }
    }

    /// Extract the top-level program's proving and verifying keys from the process.
    ///
    /// Unlike `extract_keys` which only iterates existing entries (imports), this
    /// method adds the top-level program as an entry if needed, then extracts its
    /// keys for the specified function. This enables the caller to persist
    /// top-level keys to a KeyStore after execution.
    pub(crate) fn extract_top_level_keys(
        &mut self,
        process: &ProcessNative,
        program: &ProgramNative,
        function_name: &IdentifierNative,
        edition: u16,
    ) {
        let program_id = program.id();

        // Ensure the top-level program exists as an entry in the builder.
        self.entries.entry(program_id.clone()).or_insert_with(|| ProgramEntry {
            program: program.clone(),
            edition,
            proving_keys: HashMap::new(),
            verifying_keys: HashMap::new(),
        });

        let entry = self.entries.get_mut(program_id).unwrap();
        if !entry.proving_keys.contains_key(function_name) {
            if let Ok(pk) = process.get_proving_key(program_id, function_name) {
                log(&format!("Extracted top-level proving key for {program_id}/{function_name}"));
                entry.proving_keys.insert(function_name.clone(), pk);
            }
        }
        if !entry.verifying_keys.contains_key(function_name) {
            if let Ok(vk) = process.get_verifying_key(program_id, function_name) {
                log(&format!("Extracted top-level verifying key for {program_id}/{function_name}"));
                entry.verifying_keys.insert(function_name.clone(), vk);
            }
        }
    }
}
