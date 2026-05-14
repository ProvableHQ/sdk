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
use std::{cell::RefCell, collections::HashMap, rc::Rc, str::FromStr};
use wasm_bindgen::{JsCast, JsValue, prelude::wasm_bindgen};

/// A builder for specifying program imports with optional proving and verifying keys.
///
/// Backed by a `ProcessNative` instance which stores programs, stacks, and keys
/// in a single location. This eliminates the double-storage overhead of the
/// previous HashMap-based approach where keys were cloned from the builder into
/// an execution Process.
///
/// # Example (JavaScript)
/// ```js
/// const imports = new ProgramImports();
/// imports.addProgram("my_program.aleo", programSource);
/// imports.addProvingKey("my_program.aleo", "my_function", provingKey);
/// imports.addVerifyingKey("my_program.aleo", "my_function", verifyingKey);
/// ```
pub(crate) struct ProgramImportsInner {
    pub(crate) process: ProcessNative,
    pub(crate) editions: HashMap<ProgramIDNative, u16>,
    pub(crate) sources: HashMap<ProgramIDNative, String>,
}

/// Backed by `Rc<RefCell<>>` for interior mutability — cloning produces a cheap
/// reference-counted copy that shares the same underlying data. This allows
/// execution functions to clone the builder internally while the caller's
/// original reference automatically sees any mutations (e.g. synthesized keys).
#[wasm_bindgen]
pub struct ProgramImports {
    inner: Rc<RefCell<ProgramImportsInner>>,
}

impl Clone for ProgramImports {
    fn clone(&self) -> Self {
        Self { inner: Rc::clone(&self.inner) }
    }
}

#[wasm_bindgen]
impl ProgramImports {
    /// Create a cheap clone that shares the same underlying data.
    ///
    /// Useful for passing to WASM execution functions which consume ownership:
    /// the caller keeps the original, and both copies see any mutations
    /// (e.g. synthesized keys) through the shared interior state.
    #[allow(clippy::should_implement_trait)]
    pub fn clone(&self) -> ProgramImports {
        Self { inner: Rc::clone(&self.inner) }
    }

    /// Create a new empty ProgramImports builder.
    ///
    /// Initializes an internal snarkVM Process. This is the same cost as a
    /// single execution call, but is paid once and reused across all operations.
    #[wasm_bindgen(constructor)]
    pub fn new() -> Result<ProgramImports, String> {
        let process = ProcessNative::load_web().map_err(|e| e.to_string())?;
        Ok(Self {
            inner: Rc::new(RefCell::new(ProgramImportsInner {
                process,
                editions: HashMap::new(),
                sources: HashMap::new(),
            })),
        })
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
    pub fn from_object(object: Object) -> Result<ProgramImports, String> {
        let mut imports = Self::new()?;
        let keys = Object::keys(&object);
        for i in 0..keys.length() {
            let name = keys.get(i).as_string().ok_or_else(|| format!("Program name at index {i} must be a string"))?;
            let value = Reflect::get(&object, &name.as_str().into()).ok();
            if let Some(source) = extract_source(&value) {
                imports
                    .add_program(&name, &source, None)
                    .map_err(|e| format!("Failed to add program '{name}' from object: {e}"))?;
                if let Some(value) = value.as_ref() {
                    extract_keys_from_value(&mut imports, &name, value);
                }
            }
        }
        Ok(imports)
    }

    /// Add a program's source code to the imports.
    ///
    /// The source is parsed, validated, and added to the internal Process.
    /// Static imports of the program are resolved depth-first from programs
    /// already present in this builder.
    ///
    /// @param {string} name The program name (e.g., "my_program.aleo").
    /// @param {string} source The program source code.
    /// @param {number | undefined} edition The program edition (defaults to 1).
    #[wasm_bindgen(js_name = "addProgram")]
    pub fn add_program(&mut self, name: &str, source: &str, edition: Option<u16>) -> Result<(), String> {
        let program = ProgramNative::from_str(source).map_err(|e| e.to_string())?;
        let program_id = ProgramIDNative::from_str(name).map_err(|e| e.to_string())?;
        let edition = edition.unwrap_or(1);

        if program.id() != &program_id {
            return Err(format!("Program name '{}' does not match source program ID '{}'", name, program.id()));
        }

        if program_id.to_string() == "credits.aleo" {
            return Ok(());
        }

        let mut inner = self.inner.borrow_mut();
        if !inner.process.contains_program(&program_id) {
            // Resolve static imports depth-first before adding this program.
            Self::resolve_program_imports_inner(&mut inner, &program)?;
            log(&format!("Adding {program_id} to the process"));
            inner.process.add_program_with_edition(&program, edition).map_err(|e| e.to_string())?;
        }

        inner.sources.insert(program_id.clone(), source.to_string());
        inner.editions.insert(program_id, edition);
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
        let inner = self.inner.borrow_mut();
        if !inner.process.contains_program(&program_id) {
            return Err(format!("Program '{program_name}' must be added via addProgram before adding keys"));
        }
        let has_pk = inner.process.get_stack(&program_id).map_or(false, |stack| stack.contains_proving_key(&fn_id));
        if !has_pk {
            log(&format!("Inserting proving key for {program_name}/{identifier}"));
            inner
                .process
                .insert_proving_key(&program_id, &fn_id, ProvingKeyNative::from(key))
                .map_err(|e| e.to_string())?;
        }
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
        let inner = self.inner.borrow_mut();
        if !inner.process.contains_program(&program_id) {
            return Err(format!("Program '{program_name}' must be added via addProgram before adding keys"));
        }
        let has_vk = inner.process.get_stack(&program_id).map_or(false, |stack| stack.contains_verifying_key(&fn_id));
        if !has_vk {
            log(&format!("Inserting verifying key for {program_name}/{identifier}"));
            inner
                .process
                .insert_verifying_key(&program_id, &fn_id, VerifyingKeyNative::from(key))
                .map_err(|e| e.to_string())?;
        }
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
        let inner = self.inner.borrow_mut();
        if !inner.process.contains_program(&program_id) {
            return Err(format!("Program '{program_name}' must be added via addProgram before adding keys"));
        }
        let has_pk = inner.process.get_stack(&program_id).map_or(false, |stack| stack.contains_proving_key(&fn_id));
        if !has_pk {
            let pk = ProvingKeyNative::from_bytes_le(bytes).map_err(|e| e.to_string())?;
            inner.process.insert_proving_key(&program_id, &fn_id, pk).map_err(|e| e.to_string())?;
        }
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
        let inner = self.inner.borrow_mut();
        if !inner.process.contains_program(&program_id) {
            return Err(format!("Program '{program_name}' must be added via addProgram before adding keys"));
        }
        let has_vk = inner.process.get_stack(&program_id).map_or(false, |stack| stack.contains_verifying_key(&fn_id));
        if !has_vk {
            let vk = VerifyingKeyNative::from_bytes_le(bytes).map_err(|e| e.to_string())?;
            inner.process.insert_verifying_key(&program_id, &fn_id, vk).map_err(|e| e.to_string())?;
        }
        Ok(())
    }

    /// Get a proving key for a specific program and identifier (function or record name).
    /// Returns a clone of the key from the internal Process. Non-destructive — the key
    /// remains available for future calls.
    ///
    /// @param {string} program_name The program name (e.g., "my_program.aleo").
    /// @param {string} identifier The function or record name.
    /// @returns {ProvingKey | undefined}
    #[wasm_bindgen(js_name = "getProvingKey")]
    pub fn get_proving_key(&self, program_name: &str, identifier: &str) -> Option<ProvingKey> {
        let program_id = ProgramIDNative::from_str(program_name).ok()?;
        let fn_id = IdentifierNative::from_str(identifier).ok()?;
        let inner = self.inner.borrow();
        inner.process.get_proving_key(&program_id, &fn_id).ok().map(ProvingKey::from)
    }

    /// Get a verifying key for a specific program and identifier (function or record name).
    /// Returns a clone of the key from the internal Process. Non-destructive — the key
    /// remains available for future calls.
    ///
    /// @param {string} program_name The program name (e.g., "my_program.aleo").
    /// @param {string} identifier The function or record name.
    /// @returns {VerifyingKey | undefined}
    #[wasm_bindgen(js_name = "getVerifyingKey")]
    pub fn get_verifying_key(&self, program_name: &str, identifier: &str) -> Option<VerifyingKey> {
        let program_id = ProgramIDNative::from_str(program_name).ok()?;
        let fn_id = IdentifierNative::from_str(identifier).ok()?;
        let inner = self.inner.borrow();
        inner.process.get_verifying_key(&program_id, &fn_id).ok().map(VerifyingKey::from)
    }

    /// Return the names of functions that have both a proving key and a verifying key
    /// stored for the given program.
    ///
    /// @param {string} program_name The program name (e.g., "my_program.aleo").
    /// @returns {Array<string>}
    #[wasm_bindgen(js_name = "functionKeysAvailable")]
    pub fn function_keys_available(&self, program_name: &str) -> Result<Array, String> {
        let program_id = ProgramIDNative::from_str(program_name).map_err(|e| e.to_string())?;
        let inner = self.inner.borrow();
        let stack = inner.process.get_stack(&program_id).map_err(|e| e.to_string())?;
        let result = Array::new();
        for function_name in stack.program().functions().keys() {
            if stack.contains_proving_key(function_name) && stack.contains_verifying_key(function_name) {
                result.push(&JsValue::from_str(&function_name.to_string()));
            }
        }
        Ok(result)
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
        let inner = self.inner.borrow();
        let obj = Object::new();
        for (program_id, source) in &inner.sources {
            let name = program_id.to_string();

            // Check if this program has any keys in the process.
            let Ok(stack) = inner.process.get_stack(program_id) else {
                let _ = Reflect::set(&obj, &name.as_str().into(), &source.as_str().into());
                continue;
            };
            let has_keys = stack
                .program()
                .functions()
                .keys()
                .any(|fn_name| stack.contains_proving_key(fn_name) || stack.contains_verifying_key(fn_name));

            if !has_keys {
                let _ = Reflect::set(&obj, &name.as_str().into(), &source.as_str().into());
                continue;
            }

            // Structured format with keys.
            let structured = Object::new();
            let _ = Reflect::set(&structured, &"program".into(), &source.as_str().into());

            let keys_obj = Object::new();
            for fn_name in stack.program().functions().keys() {
                let has_pk = stack.contains_proving_key(fn_name);
                let has_vk = stack.contains_verifying_key(fn_name);
                if !has_pk && !has_vk {
                    continue;
                }

                let fn_name_str = fn_name.to_string();
                let key_pair = Object::new();

                if has_pk {
                    if let Ok(pk) = inner.process.get_proving_key(program_id, fn_name) {
                        if let Ok(bytes) = pk.to_bytes_le() {
                            let arr = Uint8Array::from(bytes.as_slice());
                            let _ = Reflect::set(&key_pair, &"provingKey".into(), &arr.into());
                        }
                    }
                }
                if has_vk {
                    if let Ok(vk) = inner.process.get_verifying_key(program_id, fn_name) {
                        if let Ok(bytes) = vk.to_bytes_le() {
                            let arr = Uint8Array::from(bytes.as_slice());
                            let _ = Reflect::set(&key_pair, &"verifyingKey".into(), &arr.into());
                        }
                    }
                }

                let _ = Reflect::set(&keys_obj, &fn_name_str.as_str().into(), &key_pair.into());
            }

            let _ = Reflect::set(&structured, &"keys".into(), &keys_obj.into());
            let _ = Reflect::set(&obj, &name.as_str().into(), &structured.into());
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
        let inner = self.inner.borrow();
        let arr = Array::new_with_length(inner.sources.len() as u32);
        for (i, program_id) in inner.sources.keys().enumerate() {
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
        let inner = self.inner.borrow();
        inner.sources.get(&program_id).cloned()
    }

    /// Check whether any programs have been added to this builder.
    ///
    /// @returns {boolean}
    #[wasm_bindgen(js_name = "isEmpty")]
    pub fn is_empty(&self) -> bool {
        self.inner.borrow().sources.is_empty()
    }

    /// Check whether a specific program has been added.
    ///
    /// @param {string} name The program name.
    /// @returns {boolean}
    #[wasm_bindgen(js_name = "contains")]
    pub fn contains(&self, name: &str) -> bool {
        ProgramIDNative::from_str(name).map_or(false, |id| self.inner.borrow().sources.contains_key(&id))
    }
}

/// Resolved process state — either backed by a `ProgramImports` builder or a
/// fresh `ProcessNative`. Owns all necessary state so the caller only needs a
/// single local variable.
///
/// # Usage
/// ```ignore
/// let mut resolved = ResolvedProcess::resolve(program_imports, program, edition, imports)?;
/// let process = resolved.process_mut();
/// let program_native = resolved.program();
/// ```
pub(crate) enum ResolvedProcess<'a> {
    Builder { program: ProgramNative, guard: std::cell::RefMut<'a, ProgramImportsInner> },
    Owned { program: ProgramNative, process: ProcessNative },
}

impl<'a> ResolvedProcess<'a> {
    /// Resolve a process from either a `ProgramImports` builder or a fresh load.
    pub fn resolve(
        program_imports: &'a Option<ProgramImports>,
        program_source: &str,
        edition: u16,
        imports: Option<Object>,
    ) -> Result<Self, String> {
        match program_imports.as_ref() {
            Some(pi) => {
                let (native, guard) = pi.prepare_for_execution(program_source, edition)?;
                Ok(ResolvedProcess::Builder { program: native, guard })
            }
            None => {
                let mut process = ProcessNative::load_web().map_err(|err| err.to_string())?;
                let program = ProgramNative::from_str(program_source).map_err(|e| e.to_string())?;
                super::ProgramManager::resolve_imports(&mut process, imports, Some(&program.id().to_string()))?;
                Ok(ResolvedProcess::Owned { program, process })
            }
        }
    }

    /// Resolve a process when the program is already parsed (used by deploy paths).
    /// The pre-parsed program is used directly; no re-parsing occurs.
    pub fn resolve_with_program(
        program_imports: &'a Option<ProgramImports>,
        program: &ProgramNative,
        imports: Option<Object>,
    ) -> Result<Self, String> {
        match program_imports.as_ref() {
            Some(pi) => {
                let (_, guard) = pi.prepare_for_execution(&program.to_string(), 1)?;
                Ok(ResolvedProcess::Builder { program: program.clone(), guard })
            }
            None => {
                let mut process = ProcessNative::load_web().map_err(|err| err.to_string())?;
                super::ProgramManager::resolve_imports(&mut process, imports, Some(&program.id().to_string()))?;
                Ok(ResolvedProcess::Owned { program: program.clone(), process })
            }
        }
    }

    /// Get a mutable reference to the process.
    pub fn process_mut(&mut self) -> &mut ProcessNative {
        match self {
            ResolvedProcess::Builder { guard, .. } => &mut guard.process,
            ResolvedProcess::Owned { process, .. } => process,
        }
    }

    /// Get a reference to the parsed program.
    pub fn program(&self) -> &ProgramNative {
        match self {
            ResolvedProcess::Builder { program, .. } => program,
            ResolvedProcess::Owned { program, .. } => program,
        }
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
    /// Borrow the inner state mutably, giving access to the Process.
    ///
    /// Use when the program is already in the process and no setup is needed
    /// (e.g. verification after execution).
    pub(crate) fn borrow_inner_mut(&self) -> std::cell::RefMut<'_, ProgramImportsInner> {
        self.inner.borrow_mut()
    }

    /// Prepare the builder for execution: ensure the top-level program is
    /// present and return both the parsed program and a mutable borrow of
    /// the inner state. The caller holds the `RefMut` for the duration of
    /// execution, preventing double-borrow panics.
    pub(crate) fn prepare_for_execution(
        &self,
        program: &str,
        edition: u16,
    ) -> Result<(ProgramNative, std::cell::RefMut<'_, ProgramImportsInner>), String> {
        let mut inner = self.inner.borrow_mut();
        let program_native = ProgramNative::from_str(program).map_err(|e| e.to_string())?;
        let program_id = program_native.id();
        if program_id.to_string() != "credits.aleo" && !inner.process.contains_program(program_id) {
            inner.process.add_program_with_edition(&program_native, edition).map_err(|e| e.to_string())?;
        }
        inner.sources.entry(program_id.clone()).or_insert_with(|| program.to_string());
        inner.editions.entry(program_id.clone()).or_insert(edition);
        Ok((program_native, inner))
    }

    /// Recursively resolve a program's declared static imports (operates on inner directly).
    fn resolve_program_imports_inner(inner: &mut ProgramImportsInner, program: &ProgramNative) -> Result<(), String> {
        let credits_id = ProgramIDNative::from_str("credits.aleo").map_err(|e| e.to_string())?;
        let import_ids: Vec<ProgramIDNative> = program.imports().keys().cloned().collect();
        for import_id in import_ids {
            if import_id == credits_id {
                continue;
            }
            if inner.process.contains_program(&import_id) {
                continue;
            }
            let source =
                inner.sources.get(&import_id).cloned().ok_or_else(|| {
                    format!("Missing import '{import_id}' — add it to the builder before its dependents")
                })?;
            let import_program = ProgramNative::from_str(&source).map_err(|e| e.to_string())?;
            log(&format!("Importing program: {import_id}"));
            Self::resolve_program_imports_inner(inner, &import_program)?;
            let edition = inner.editions.get(&import_id).copied().unwrap_or(1);
            log(&format!("Adding {import_id} to the process"));
            inner.process.add_program_with_edition(&import_program, edition).map_err(|e| e.to_string())?;
        }
        Ok(())
    }
}
