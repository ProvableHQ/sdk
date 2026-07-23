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
    Field,
    account::Address,
    types::native::{CurrentNetwork, IdentifierNative, ProgramNative},
};
use js_sys::{Array, Object, Reflect, Uint8Array};
use snarkvm_console::{
    prelude::ToField,
    program::{EntryType, PlaintextType, ValueType},
};
use std::{
    collections::{HashSet, VecDeque},
    ops::Deref,
    str::FromStr,
};
use wasm_bindgen::{JsValue, prelude::wasm_bindgen};

/// Webassembly Representation of an Aleo program
#[wasm_bindgen]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Program(ProgramNative);

/// The required signature of an interface function or view function, expressed in the
/// canonical `.aleo` bytecode type notation (e.g. "address.public", "Token.record").
/// The special output marker "future" matches any future type, since a future's locator
/// embeds the id of the program being checked.
struct InterfaceFunction {
    name: &'static str,
    inputs: &'static [&'static str],
    outputs: &'static [&'static str],
}

const FUTURE: &str = "future";

/// Input marker for the ARC-22 Merkle proof array, which is matched structurally rather
/// than by exact type string since the MerkleProof struct may be local or imported.
const MERKLE_PROOFS: &str = "[MerkleProof; 2u32].private";

/// The functions required by the ARC-20 token interface (IARC20).
const ARC20_FUNCTIONS: &[InterfaceFunction] = &[
    InterfaceFunction { name: "transfer_public", inputs: &["address.public", "u128.public"], outputs: &[FUTURE] },
    InterfaceFunction {
        name: "transfer_private",
        inputs: &["Token.record", "address.private", "u128.private"],
        outputs: &["Token.record", "Token.record"],
    },
    InterfaceFunction {
        name: "transfer_private_to_public",
        inputs: &["Token.record", "address.public", "u128.public"],
        outputs: &["Token.record", FUTURE],
    },
    InterfaceFunction {
        name: "transfer_public_to_private",
        inputs: &["address.private", "u128.public"],
        outputs: &["Token.record", FUTURE],
    },
    InterfaceFunction {
        name: "transfer_public_as_signer",
        inputs: &["address.public", "u128.public"],
        outputs: &[FUTURE],
    },
    InterfaceFunction {
        name: "transfer_from_public",
        inputs: &["address.public", "address.public", "u128.public"],
        outputs: &[FUTURE],
    },
    InterfaceFunction {
        name: "transfer_from_public_to_private",
        inputs: &["address.public", "address.private", "u128.public"],
        outputs: &["Token.record", FUTURE],
    },
    InterfaceFunction { name: "approve_public", inputs: &["address.public", "u128.public"], outputs: &[FUTURE] },
    InterfaceFunction { name: "unapprove_public", inputs: &["address.public", "u128.public"], outputs: &[FUTURE] },
    InterfaceFunction { name: "join", inputs: &["Token.record", "Token.record"], outputs: &["Token.record"] },
    InterfaceFunction {
        name: "split",
        inputs: &["Token.record", "u128.private"],
        outputs: &["Token.record", "Token.record"],
    },
];

/// The view functions required by both the ARC-20 (IARC20) and ARC-22 (IARC22) token
/// interfaces. View function inputs and outputs are always public.
const ARC20_VIEWS: &[InterfaceFunction] = &[
    InterfaceFunction { name: "balance_of", inputs: &["address.public"], outputs: &["u128.public"] },
    InterfaceFunction { name: "allowance", inputs: &["address.public", "address.public"], outputs: &["u128.public"] },
    InterfaceFunction { name: "supply", inputs: &[], outputs: &["u128.public"] },
    InterfaceFunction { name: "max_supply", inputs: &[], outputs: &["u128.public"] },
    InterfaceFunction { name: "decimals", inputs: &[], outputs: &["u8.public"] },
    InterfaceFunction { name: "name", inputs: &[], outputs: &["identifier.public"] },
    InterfaceFunction { name: "symbol", inputs: &[], outputs: &["identifier.public"] },
];

/// The functions required by the ARC-22 compliant token interface (IARC22).
const ARC22_FUNCTIONS: &[InterfaceFunction] = &[
    InterfaceFunction { name: "approve_public", inputs: &["address.public", "u128.public"], outputs: &[FUTURE] },
    InterfaceFunction { name: "unapprove_public", inputs: &["address.public", "u128.public"], outputs: &[FUTURE] },
    InterfaceFunction { name: "transfer_public", inputs: &["address.public", "u128.public"], outputs: &[FUTURE] },
    InterfaceFunction {
        name: "transfer_private",
        inputs: &["address.private", "u128.private", "Token.record", MERKLE_PROOFS],
        outputs: &["ComplianceRecord.record", "Token.record", "Token.record", FUTURE],
    },
    InterfaceFunction {
        name: "transfer_private_to_public",
        inputs: &["address.public", "u128.public", "Token.record", MERKLE_PROOFS],
        outputs: &["ComplianceRecord.record", "Token.record", FUTURE],
    },
    InterfaceFunction {
        name: "transfer_public_to_private",
        inputs: &["address.private", "u128.public"],
        outputs: &["ComplianceRecord.record", "Token.record", FUTURE],
    },
    InterfaceFunction {
        name: "transfer_from_public",
        inputs: &["address.public", "address.public", "u128.public"],
        outputs: &[FUTURE],
    },
    InterfaceFunction {
        name: "transfer_from_public_to_private",
        inputs: &["address.public", "address.private", "u128.public"],
        outputs: &["ComplianceRecord.record", "Token.record", FUTURE],
    },
    InterfaceFunction {
        name: "transfer_public_as_signer",
        inputs: &["address.public", "u128.public"],
        outputs: &[FUTURE],
    },
    InterfaceFunction { name: "join", inputs: &["Token.record", "Token.record"], outputs: &["Token.record"] },
    InterfaceFunction {
        name: "split",
        inputs: &["Token.record", "u128.private"],
        outputs: &["Token.record", "Token.record"],
    },
];

/// The members of the MerkleProof struct required by the ARC-22 interface, where
/// the siblings array is sized by `MAX_TREE_DEPTH + 1` with `MAX_TREE_DEPTH = 15`.
const ARC22_MERKLE_PROOF_MEMBERS: &[(&str, &str)] = &[("siblings", "[field; 16u32]"), ("leaf_index", "u32")];

#[wasm_bindgen]
impl Program {
    /// Create a program from a program string
    ///
    /// @param {string} program Aleo program source code
    /// @returns {Program} Program object
    #[wasm_bindgen(js_name = "fromString")]
    pub fn from_string(program: &str) -> Result<Program, String> {
        Ok(Self(ProgramNative::from_str(program).map_err(|err| err.to_string())?))
    }

    /// Get a string representation of the program
    ///
    /// @returns {string} String containing the program source code
    #[wasm_bindgen(js_name = "toString")]
    #[allow(clippy::inherent_to_string)]
    pub fn to_string(&self) -> String {
        self.0.to_string()
    }

    /// Determine if a function is present in the program
    ///
    /// @param {string} functionName Name of the function to check for
    /// @returns {boolean} True if the program is valid, false otherwise
    #[wasm_bindgen(js_name = "hasFunction")]
    pub fn has_function(&self, function_name: &str) -> bool {
        IdentifierNative::from_str(function_name).is_ok_and(|identifier| self.0.contains_function(&identifier))
    }

    /// Get javascript array of functions names in the program
    ///
    /// @returns {Array} Array of all function names present in the program
    ///
    /// @example
    /// const expected_functions = [
    ///   "mint",
    ///   "transfer_private",
    ///   "transfer_private_to_public",
    ///   "transfer_public",
    ///   "transfer_public_to_private",
    ///   "join",
    ///   "split",
    ///   "fee"
    /// ]
    ///
    /// const credits_program = aleo_wasm.Program.getCreditsProgram();
    /// const credits_functions = credits_program.getFunctions();
    /// console.log(credits_functions === expected_functions); // Output should be "true"
    #[wasm_bindgen(js_name = "getFunctions")]
    pub fn get_functions(&self) -> Array {
        let array = Array::new_with_length(self.0.functions().len() as u32);
        let mut index = 0u32;
        self.0.functions().values().for_each(|function| {
            array.set(index, JsValue::from_str(&function.name().to_string()));
            index += 1;
        });
        array
    }

    /// Get a javascript object representation of the function inputs and types. This can be used
    /// to generate a web form to capture user inputs for an execution of a function.
    ///
    /// @param {string} function_name Name of the function to get inputs for
    /// @returns {Array} Array of function inputs
    ///
    /// @example
    /// const expected_inputs = [
    ///     {
    ///       type:"record",
    ///       visibility:"private",
    ///       record:"credits",
    ///       members:[
    ///         {
    ///           name:"microcredits",
    ///           type:"u64",
    ///           visibility:"private"
    ///         }
    ///       ],
    ///       register:"r0"
    ///     },
    ///     {
    ///       type:"address",
    ///       visibility:"private",
    ///       register:"r1"
    ///     },
    ///     {
    ///       type:"u64",
    ///       visibility:"private",
    ///       register:"r2"
    ///     }
    /// ];
    ///
    /// const credits_program = aleo_wasm.Program.getCreditsProgram();
    /// const transfer_function_inputs = credits_program.getFunctionInputs("transfer_private");
    /// console.log(transfer_function_inputs === expected_inputs); // Output should be "true"
    #[wasm_bindgen(js_name = "getFunctionInputs")]
    pub fn get_function_inputs(&self, function_name: String) -> Result<Array, String> {
        let function_id = IdentifierNative::from_str(&function_name).map_err(|e| e.to_string())?;
        let function = self
            .0
            .functions()
            .get(&function_id)
            .ok_or_else(|| format!("function {} not found in {}", function_name, self.0.id()))?;
        let function_inputs = Array::new_with_length(function.inputs().len() as u32);
        for (index, input) in function.inputs().iter().enumerate() {
            let register = JsValue::from_str(&input.register().to_string());
            match input.value_type() {
                ValueType::Constant(plaintext) => {
                    function_inputs.set(index as u32, {
                        let input = self.get_plaintext_input(plaintext, Some("constant".to_string()), None)?;
                        Reflect::set(&input, &"register".into(), &register).map_err(|_| "Failed to set property")?;
                        input.into()
                    });
                }
                ValueType::Public(plaintext) => {
                    function_inputs.set(index as u32, {
                        let input = self.get_plaintext_input(plaintext, Some("public".to_string()), None)?;
                        Reflect::set(&input, &"register".into(), &register).map_err(|_| "Failed to set property")?;
                        input.into()
                    });
                }
                ValueType::Private(plaintext) => {
                    function_inputs.set(index as u32, {
                        let input = self.get_plaintext_input(plaintext, Some("private".to_string()), None)?;
                        Reflect::set(&input, &"register".into(), &register).map_err(|_| "Failed to set property")?;
                        input.into()
                    });
                }
                ValueType::Record(identifier) => {
                    function_inputs.set(index as u32, {
                        let input = self.get_record_members(identifier.to_string())?;
                        Reflect::set(&input, &"register".into(), &register).map_err(|_| "Failed to set property")?;
                        input.into()
                    });
                }
                ValueType::ExternalRecord(locator) => {
                    let input = Object::new();
                    let value_type = JsValue::from_str("external_record");
                    Reflect::set(&input, &"type".into(), &value_type).map_err(|_| "Failed to set property")?;
                    Reflect::set(&input, &"locator".into(), &locator.to_string().into())
                        .map_err(|_| "Failed to set property")?;
                    Reflect::set(&input, &"register".into(), &register).map_err(|_| "Failed to set property")?;
                    function_inputs.set(index as u32, input.into());
                }
                ValueType::Future(locator) => {
                    let input = Object::new();
                    let value_type = JsValue::from_str("future");
                    Reflect::set(&input, &"type".into(), &value_type).map_err(|_| "Failed to set property")?;
                    Reflect::set(&input, &"locator".into(), &locator.to_string().into())
                        .map_err(|_| "Failed to set property")?;
                    Reflect::set(&input, &"register".into(), &register).map_err(|_| "Failed to set property")?;
                    function_inputs.set(index as u32, input.into());
                }
                ValueType::DynamicRecord => {
                    let input = Object::new();
                    let value_type = JsValue::from_str("dynamic.record");
                    Reflect::set(&input, &"type".into(), &value_type).map_err(|_| "Failed to set property")?;
                    Reflect::set(&input, &"register".into(), &register).map_err(|_| "Failed to set property")?;
                    function_inputs.set(index as u32, input.into());
                }
                ValueType::DynamicFuture => {
                    let input = Object::new();
                    let value_type = JsValue::from_str("dynamic.future");
                    Reflect::set(&input, &"type".into(), &value_type).map_err(|_| "Failed to set property")?;
                    Reflect::set(&input, &"register".into(), &register).map_err(|_| "Failed to set property")?;
                    function_inputs.set(index as u32, input.into());
                }
            }
        }
        Ok(function_inputs)
    }

    /// Get a the list of a program's mappings and the names/types of their keys and values.
    ///
    /// @returns {Array} - An array of objects representing the mappings in the program
    /// @example
    /// const expected_mappings = [
    ///    {
    ///       name: "account",
    ///       key_name: "owner",
    ///       key_type: "address",
    ///       value_name: "microcredits",
    ///       value_type: "u64"
    ///    }
    /// ]
    ///
    /// const credits_program = aleo_wasm.Program.getCreditsProgram();
    /// const credits_mappings = credits_program.getMappings();
    /// console.log(credits_mappings === expected_mappings); // Output should be "true"
    #[wasm_bindgen(js_name = "getMappings")]
    pub fn get_mappings(&self) -> Result<Array, String> {
        let mappings = Array::new();

        // Set the mapping name and key/value names & types
        self.0.mappings().iter().try_for_each(|(name, mapping)| {
            let mapping_object = Object::new();
            Reflect::set(&mapping_object, &"name".into(), &name.to_string().into())
                .map_err(|_| "Failed to set property")?;
            Reflect::set(&mapping_object, &"key_type".into(), &mapping.key().plaintext_type().to_string().into())
                .map_err(|_| "Failed to set property")?;
            Reflect::set(&mapping_object, &"value_type".into(), &mapping.value().plaintext_type().to_string().into())
                .map_err(|_| "Failed to set property")?;
            mappings.push(&mapping_object);
            Ok::<(), String>(())
        })?;
        Ok(mappings)
    }

    // Get the value of a plaintext input as a javascript object (this function is not part of the
    // public API)
    fn get_plaintext_input(
        &self,
        plaintext: &PlaintextType<CurrentNetwork>,
        visibility: Option<String>,
        name: Option<String>,
    ) -> Result<Object, String> {
        let input = Object::new();
        match plaintext {
            PlaintextType::Array(array_type) => {
                if let Some(name) = name {
                    Reflect::set(&input, &"name".into(), &name.into()).map_err(|_| "Failed to set property")?;
                }
                Reflect::set(&input, &"type".into(), &"array".into()).map_err(|_| "Failed to set property")?;

                // Set the element types of the Array and record the length
                let element_type = self.get_plaintext_input(array_type.base_element_type(), None, None)?;
                let length = **array_type.length();
                Reflect::set(&input, &"element_type".into(), &element_type).map_err(|_| "Failed to set property")?;
                Reflect::set(&input, &"length".into(), &length.into()).map_err(|_| "Failed to set property")?;
            }
            PlaintextType::Literal(literal_type) => {
                if let Some(name) = name {
                    Reflect::set(&input, &"name".into(), &name.into()).map_err(|_| "Failed to set property")?;
                }
                let value_type = JsValue::from_str(&literal_type.to_string());
                Reflect::set(&input, &"type".into(), &value_type).map_err(|_| "Failed to set property")?;
            }
            PlaintextType::Struct(struct_id) => {
                let struct_name = struct_id.to_string();
                if let Some(name) = name {
                    Reflect::set(&input, &"name".into(), &name.into()).map_err(|_| "Failed to set property")?;
                }
                Reflect::set(&input, &"type".into(), &"struct".into()).map_err(|_| "Failed to set property")?;
                Reflect::set(&input, &"struct_id".into(), &struct_name.as_str().into())
                    .map_err(|_| "Failed to set property")?;
                let inputs = self.get_struct_members(struct_name)?;
                Reflect::set(&input, &"members".into(), &inputs.into()).map_err(|_| "Failed to set property")?;
            }
            PlaintextType::ExternalStruct(struct_locator) => {
                let struct_name = struct_locator.name();

                if let Some(name) = name {
                    Reflect::set(&input, &"name".into(), &name.into()).map_err(|_| "Failed to set property")?;
                }
                Reflect::set(&input, &"type".into(), &"struct".into()).map_err(|_| "Failed to set property")?;
                Reflect::set(&input, &"struct_id".into(), &struct_name.to_string().into())
                    .map_err(|_| "Failed to set property")?;
                let inputs = self.get_struct_members(struct_name.to_string())?;
                Reflect::set(&input, &"members".into(), &inputs.into()).map_err(|_| "Failed to set property")?;
            }
        }
        if let Some(visibility) = visibility {
            Reflect::set(&input, &"visibility".into(), &visibility.into()).map_err(|_| "Failed to set property")?;
        }

        Ok(input)
    }

    /// Get a javascript object representation of a program record and its types
    ///
    /// @param {string} record_name Name of the record to get members for
    /// @returns {Object} Object containing the record name, type, and members
    ///
    /// @example
    ///
    /// const expected_record = {
    ///     type: "record",
    ///     record: "Credits",
    ///     members: [
    ///       {
    ///         name: "owner",
    ///         type: "address",
    ///         visibility: "private"
    ///       },
    ///       {
    ///         name: "microcredits",
    ///         type: "u64",
    ///         visibility: "private"
    ///       }
    ///     ];
    ///  };
    ///
    /// const credits_program = aleo_wasm.Program.getCreditsProgram();
    /// const credits_record = credits_program.getRecordMembers("Credits");
    /// console.log(credits_record === expected_record); // Output should be "true"
    #[wasm_bindgen(js_name = "getRecordMembers")]
    pub fn get_record_members(&self, record_name: String) -> Result<Object, String> {
        let record_id = IdentifierNative::from_str(&record_name).map_err(|e| e.to_string())?;
        let record = self
            .0
            .get_record(&record_id)
            .map_err(|_| format!("struct {} not found in {}", record_name, self.0.id()))?;

        let input = Object::new();
        Reflect::set(&input, &"type".into(), &"record".into()).map_err(|_| "Failed to set property")?;
        Reflect::set(&input, &"record".into(), &record_name.into()).map_err(|_| "Failed to set property")?;

        let record_members = Array::new_with_length(record.entries().len() as u32);

        for (index, (name, member_type)) in record.entries().iter().enumerate() {
            match member_type {
                EntryType::Constant(plaintext) => record_members.set(
                    index as u32,
                    self.get_plaintext_input(plaintext, Some("constant".to_string()), Some(name.to_string()))?.into(),
                ),
                EntryType::Public(plaintext) => record_members.set(
                    index as u32,
                    self.get_plaintext_input(plaintext, Some("public".to_string()), Some(name.to_string()))?.into(),
                ),
                EntryType::Private(plaintext) => record_members.set(
                    index as u32,
                    self.get_plaintext_input(plaintext, Some("private".to_string()), Some(name.to_string()))?.into(),
                ),
            }
        }

        Reflect::set(&input, &"members".into(), &record_members).map_err(|_| "Failed to set property")?;

        // Adding _nonce object to record
        let _nonce = Object::new();
        Reflect::set(&_nonce, &"name".into(), &"_nonce".into()).map_err(|_| "Failed to set property")?;
        Reflect::set(&_nonce, &"type".into(), &"group".into()).map_err(|_| "Failed to set property")?;
        Reflect::set(&_nonce, &"visibility".into(), &"public".into()).map_err(|_| "Failed to set property")?;

        record_members.push(&JsValue::from(_nonce));

        Ok(input)
    }

    /// Get a javascript object representation of a program struct and its types
    ///
    /// @param {string} struct_name Name of the struct to get members for
    /// @returns {Array} Array containing the struct members
    ///
    /// @example
    ///
    /// const STRUCT_PROGRAM = "program token_issue.aleo;
    ///
    /// struct token_metadata:
    ///     network as u32;
    ///     version as u32;
    ///
    /// struct token:
    ///     token_id as u32;
    ///     metadata as token_metadata;
    ///
    /// function no_op:
    ///    input r0 as u64;
    ///    output r0 as u64;"
    ///
    /// const expected_struct_members = [
    ///    {
    ///      name: "token_id",
    ///      type: "u32",
    ///    },
    ///    {
    ///      name: "metadata",
    ///      type: "struct",
    ///      struct_id: "token_metadata",
    ///      members: [
    ///       {
    ///         name: "network",
    ///         type: "u32",
    ///       }
    ///       {
    ///         name: "version",
    ///         type: "u32",
    ///       }
    ///     ]
    ///   }
    /// ];
    ///
    /// const program = aleo_wasm.Program.fromString(STRUCT_PROGRAM);
    /// const struct_members = program.getStructMembers("token");
    /// console.log(struct_members === expected_struct_members); // Output should be "true"
    #[wasm_bindgen(js_name = "getStructMembers")]
    pub fn get_struct_members(&self, struct_name: String) -> Result<Array, String> {
        let struct_id = IdentifierNative::from_str(&struct_name).map_err(|e| e.to_string())?;

        let program_struct = self
            .0
            .get_struct(&struct_id)
            .map_err(|_| format!("struct {} not found in {}", struct_name, self.0.id()))?;

        let struct_members = Array::new_with_length(program_struct.members().len() as u32);
        for (index, (name, member_type)) in program_struct.members().iter().enumerate() {
            let input = self.get_plaintext_input(member_type, None, Some(name.to_string()))?;
            struct_members.set(index as u32, input.into());
        }

        Ok(struct_members)
    }

    /// Get the credits.aleo program
    ///
    /// @returns {Program} The credits.aleo program
    #[wasm_bindgen(js_name = "getCreditsProgram")]
    pub fn get_credits_program() -> Program {
        Program::from(ProgramNative::credits().unwrap())
    }

    /// Get the id of the program
    ///
    /// @returns {string} The id of the program
    #[wasm_bindgen]
    pub fn id(&self) -> String {
        self.0.id().to_string()
    }

    /// Get a unique address of the program
    ///
    /// @returns {Address} The address of the program
    #[wasm_bindgen]
    pub fn address(&self) -> Result<Address, String> {
        Ok(Address::from(self.0.id().to_address().map_err(|e| e.to_string())?))
    }

    /// Determine equality with another program
    ///
    /// @param {Program} other The other program to compare
    /// @returns {boolean} True if the programs are equal, false otherwise
    #[wasm_bindgen(js_name = "isEqual")]
    pub fn is_equal(&self, other: &Program) -> bool {
        self == other
    }

    /// Get program_imports
    ///
    /// @returns {Array} The program imports
    ///
    /// @example
    ///
    /// const DOUBLE_TEST = "import multiply_test.aleo;
    ///
    /// program double_test.aleo;
    ///
    /// function double_it:
    ///     input r0 as u32.private;
    ///     call multiply_test.aleo/multiply 2u32 r0 into r1;
    ///     output r1 as u32.private;";
    ///
    /// const expected_imports = [
    ///    "multiply_test.aleo"
    /// ];
    ///
    /// const program = aleo_wasm.Program.fromString(DOUBLE_TEST_PROGRAM);
    /// const imports = program.getImports();
    /// console.log(imports === expected_imports); // Output should be "true"
    #[wasm_bindgen(js_name = "getImports")]
    pub fn get_imports(&self) -> Array {
        let imports = Array::new_with_length(self.0.imports().len() as u32);
        for (index, (import, _)) in self.0.imports().iter().enumerate() {
            imports.set(index as u32, import.to_string().into());
        }
        imports
    }

    /// Get the external call graph reachable from a specific entry function.
    ///
    /// Starting from `entry_function`, traces all reachable functions and closures
    /// within this program (via local calls) and collects external calls
    /// (`call program.aleo/function`). Returns a JS object mapping program names
    /// to arrays of called function names.
    ///
    /// @param {string} entry_function The name of the entry function to trace from
    /// @returns {object} An object like `{ "program.aleo": ["fn1", "fn2"] }`
    #[wasm_bindgen(js_name = "getCallGraph")]
    pub fn get_call_graph(&self, entry_function: &str) -> Result<JsValue, String> {
        use snarkvm_synthesizer_program::CallOperator;
        use std::collections::HashMap;

        let entry_id = IdentifierNative::from_str(entry_function).map_err(|e| e.to_string())?;

        // Collect results in a Rust HashMap first, then convert to JS at the end.
        let mut external_calls: HashMap<String, Vec<String>> = HashMap::new();
        let mut visited = HashSet::new();
        let mut queue = VecDeque::new();
        queue.push_back(entry_id);

        while let Some(fn_id) = queue.pop_front() {
            if !visited.insert(fn_id.clone()) {
                continue;
            }

            // Get instructions from either a function or a closure
            let instructions: &[_] = if let Some(func) = self.0.functions().get(&fn_id) {
                func.instructions()
            } else if let Some(closure) = self.0.closures().get(&fn_id) {
                closure.instructions()
            } else {
                continue;
            };

            for instruction in instructions {
                if let Some(call_op) = instruction.call_operator() {
                    match call_op {
                        CallOperator::Locator(locator) => {
                            let prog_name = locator.program_id().to_string();
                            let fn_name = locator.resource().to_string();
                            external_calls.entry(prog_name).or_default().push(fn_name);
                        }
                        CallOperator::Resource(local_id) => {
                            if !visited.contains(local_id) {
                                queue.push_back(local_id.clone());
                            }
                        }
                    }
                }
            }
        }

        // Convert HashMap to JS object
        let result = Object::new();
        for (prog_name, fn_names) in &external_calls {
            let arr = Array::new_with_length(fn_names.len() as u32);
            for (i, fn_name) in fn_names.iter().enumerate() {
                arr.set(i as u32, JsValue::from_str(fn_name));
            }
            Reflect::set(&result, &JsValue::from_str(prog_name), &arr).map_err(|_| "Failed to set property")?;
        }

        Ok(result.into())
    }

    /// Determine if the program implements the ARC-20 fungible token interface (IARC20).
    ///
    /// This checks that the program defines a `Token` record with an `amount: u128` entry
    /// (additional entries are permitted, per the interface's open record definition) and
    /// that every function and view function required by ARC-20 is present with the exact
    /// input and output signature defined by the standard.
    ///
    /// @see https://github.com/ProvableHQ/ARCs/blob/master/arc-0020/README.md
    ///
    /// @returns {boolean} True if the program implements the ARC-20 token interface
    #[wasm_bindgen(js_name = "isArc20")]
    pub fn is_arc20(&self) -> bool {
        self.record_has_entries("Token", &[("amount", "u128")])
            && ARC20_FUNCTIONS.iter().all(|function| self.matches_function(function))
            && ARC20_VIEWS.iter().all(|view| self.matches_view(view))
    }

    /// Determine if the program implements the ARC-22 compliant token interface (IARC22).
    ///
    /// This checks that the program defines `Token` and `ComplianceRecord` records with the
    /// entries required by the standard (additional entries are permitted, per the
    /// interface's open record definitions), and that every function and view function
    /// required by ARC-22 is present with the exact input and output signature defined by
    /// the standard. The `MerkleProof` struct used by the private transfer functions may be
    /// declared locally (in which case its shape must match the standard exactly) or
    /// imported from another program such as a freeze list registry.
    ///
    /// Note: this checks the token interface (IARC22) only. The freeze list registry
    /// interface (IARC22Freezelist) is typically implemented by a separate program and is
    /// not required for a token program to be considered ARC-22 compliant.
    ///
    /// @see https://github.com/ProvableHQ/ARCs/blob/master/arc-0022/README.md
    ///
    /// @returns {boolean} True if the program implements the ARC-22 token interface
    #[wasm_bindgen(js_name = "isArc22")]
    pub fn is_arc22(&self) -> bool {
        self.record_has_entries("Token", &[("amount", "u128")])
            && self.record_has_entries("ComplianceRecord", &[
                ("amount", "u128"),
                ("sender", "address"),
                ("recipient", "address"),
            ])
            && ARC22_FUNCTIONS.iter().all(|function| self.matches_function(function))
            && ARC20_VIEWS.iter().all(|view| self.matches_view(view))
    }

    /// Get the program's name (without the `.aleo` suffix) encoded as a field element.
    ///
    /// This is the same value as casting the program name identifier to a field on-chain
    /// (e.g. `my_program.aleo` -> `Identifier("my_program") as field`), which is used as
    /// the program id in dynamic dispatch calls such as `IARC20@(token_id)`.
    ///
    /// @example
    /// const program = aleo_wasm.Program.getCreditsProgram();
    /// const field = program.nameToField(); // Field encoding of "credits"
    ///
    /// @returns {Field} The program name as a field element
    #[wasm_bindgen(js_name = "nameToField")]
    pub fn name_to_field(&self) -> Result<Field, String> {
        Ok(Field::from(self.0.id().name().to_field().map_err(|e| e.to_string())?))
    }

    /// Get the checksum of the program.
    ///
    /// @returns {Uint8Array} The checksum of the program as a 32-byte Uint8Array
    #[wasm_bindgen(js_name = "toChecksum")]
    pub fn to_checksum(&self) -> Uint8Array {
        let checksum: Vec<u8> = self.0.to_checksum().iter().map(|b| **b).collect();
        Uint8Array::from(checksum.as_slice())
    }
}

// Native helpers backing the ARC-20/ARC-22 interface checks. These methods operate on
// snarkVM types directly and are not exported to wasm.
impl Program {
    // Check that a function exists with the exact interface signature.
    fn matches_function(&self, interface_function: &InterfaceFunction) -> bool {
        let Ok(name) = IdentifierNative::from_str(interface_function.name) else {
            return false;
        };
        let Some(function) = self.0.functions().get(&name) else {
            return false;
        };
        let inputs = function.input_types();
        let outputs = function.output_types();
        inputs.len() == interface_function.inputs.len()
            && outputs.len() == interface_function.outputs.len()
            && inputs.iter().zip(interface_function.inputs).all(|(input, expected)| {
                if *expected == MERKLE_PROOFS {
                    self.is_merkle_proof_array(input)
                } else {
                    input.to_string() == *expected
                }
            })
            && outputs.iter().zip(interface_function.outputs).all(|(output, expected)| {
                if *expected == FUTURE {
                    // A `Final` output must be the function's own future — a future pointing
                    // at another program's function does not satisfy the interface.
                    matches!(output, ValueType::Future(locator)
                        if locator.program_id() == self.0.id()
                            && locator.resource().to_string() == interface_function.name)
                } else {
                    output.to_string() == *expected
                }
            })
    }

    // Check that a function input is a private two-element array of the ARC-22 MerkleProof
    // struct. The struct may be declared locally, in which case its shape must match the
    // standard exactly, or imported from another program (e.g. a freeze list registry),
    // whose definition cannot be resolved from this program alone.
    fn is_merkle_proof_array(&self, input: &ValueType<CurrentNetwork>) -> bool {
        let ValueType::Private(PlaintextType::Array(array)) = input else {
            return false;
        };
        if **array.length() != 2u32 {
            return false;
        }
        match array.next_element_type() {
            PlaintextType::Struct(name) => {
                name.to_string() == "MerkleProof" && self.struct_matches("MerkleProof", ARC22_MERKLE_PROOF_MEMBERS)
            }
            PlaintextType::ExternalStruct(locator) => locator.resource().to_string() == "MerkleProof",
            _ => false,
        }
    }

    // Check that a view function exists with the exact interface signature.
    fn matches_view(&self, interface_view: &InterfaceFunction) -> bool {
        let Ok(name) = IdentifierNative::from_str(interface_view.name) else {
            return false;
        };
        let Some(view) = self.0.views().get(&name) else {
            return false;
        };
        let inputs = view.input_types();
        let outputs = view.output_types();
        inputs.len() == interface_view.inputs.len()
            && outputs.len() == interface_view.outputs.len()
            && inputs.iter().zip(interface_view.inputs).all(|(input, expected)| input.to_string() == *expected)
            && outputs.iter().zip(interface_view.outputs).all(|(output, expected)| output.to_string() == *expected)
    }

    // Check that a record exists with a private owner, containing at least the given
    // private entries; additional entries are permitted, matching the `..` in interface
    // record definitions.
    fn record_has_entries(&self, record_name: &str, entries: &[(&str, &str)]) -> bool {
        let Ok(name) = IdentifierNative::from_str(record_name) else {
            return false;
        };
        let Ok(record) = self.0.get_record(&name) else {
            return false;
        };
        if !record.owner().is_private() {
            return false;
        }
        entries.iter().all(|(entry_name, entry_type)| {
            record.entries().iter().any(|(name, ty)| {
                name.to_string() == *entry_name
                    && matches!(ty, EntryType::Private(plaintext) if plaintext.to_string() == *entry_type)
            })
        })
    }

    // Check that a struct exists with exactly the given members in order.
    fn struct_matches(&self, struct_name: &str, members: &[(&str, &str)]) -> bool {
        let Ok(name) = IdentifierNative::from_str(struct_name) else {
            return false;
        };
        let Ok(struct_) = self.0.get_struct(&name) else {
            return false;
        };
        struct_.members().len() == members.len()
            && struct_.members().iter().zip(members).all(|((name, ty), (expected_name, expected_type))| {
                name.to_string() == *expected_name && ty.to_string() == *expected_type
            })
    }
}

impl Deref for Program {
    type Target = ProgramNative;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl From<ProgramNative> for Program {
    fn from(value: ProgramNative) -> Self {
        Self(value)
    }
}

impl From<Program> for ProgramNative {
    fn from(program: Program) -> Self {
        program.0
    }
}

impl From<&Program> for ProgramNative {
    fn from(program: &Program) -> Self {
        program.0.clone()
    }
}

impl FromStr for Program {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        Self::from_string(s)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        array,
        object,
        utilities::test::{ARC20_TOKEN_PROGRAM, ARC22_TOKEN_PROGRAM, COMPLIANT_TOKEN_TEMPLATE, TEST_USDCX_STABLECOIN},
    };

    use wasm_bindgen_test::*;

    const TOKEN_ISSUE: &str = r#"program token_issue.aleo;

struct token_metadata:
    token_id as u32;
    version as u32;

record Token:
    owner as address.private;
    microcredits as u64.private;
    amount as u64.private;
    token_data as token_metadata.private;

function issue:
    input r0 as address.private;
    input r1 as u64.private;
    input r2 as token_metadata.private;
    assert.eq self.caller aleo1t0uer3jgtsgmx5tq6x6f9ecu8tr57rzzfnc2dgmcqldceal0ls9qf6st7a;
    cast r0 0u64 r1 r2 into r3 as Token.record;
    output r3 as Token.record;

function bump_token_version:
    input r0 as address.private;
    input r1 as Token.record;
    input r2 as token_metadata.private;
    assert.eq r1 r3.owner;
    cast r0 r1.microcredits r1.amount r2 into r3 as Token.record;
    output r3 as Token.record;"#;

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
    fn test_mappings() {
        // Get the mappings from the program
        let program = Program::get_credits_program();
        let mappings = program.get_mappings().unwrap();

        let expected = array![
            object! {
                "name": "committee",
                "key_type": "address",
                "value_type": "committee_state",
            },
            object! {
                "name": "delegated",
                "key_type": "address",
                "value_type": "u64",
            },
            object! {
                "name": "metadata",
                "key_type": "address",
                "value_type": "u32",
            },
            object! {
                "name": "bonded",
                "key_type": "address",
                "value_type": "bond_state",
            },
            object! {
                "name": "unbonding",
                "key_type": "address",
                "value_type": "unbond_state",
            },
            object! {
                "name": "account",
                "key_type": "address",
                "value_type": "u64",
            },
            object! {
                "name": "withdraw",
                "key_type": "address",
                "value_type": "address",
            },
            object! {
                "name":"pool",
                "key_type":"address",
                "value_type":"u64",
            }
        ];

        // Assert that the mappings are equal
        assert_eq!(format!("{:?}", mappings.to_vec()), format!("{:?}", expected.to_vec()));

        // Assert a program with no mappings providers an empty array
        let program = Program::from_string(TOKEN_ISSUE).unwrap();
        let mappings = program.get_mappings().unwrap();
        let empty: Vec<JsValue> = vec![];
        assert_eq!(mappings.to_vec(), empty);
    }

    #[wasm_bindgen_test]
    fn test_get_functions() {
        let program = Program::from_string(NESTED_IMPORT_PROGRAM).unwrap();
        let add_and_double = JsValue::from_str("add_and_double");

        assert_eq!(program.get_functions().to_vec(), vec![add_and_double]);
    }

    #[wasm_bindgen_test]
    fn test_get_inputs() {
        let credits = Program::from(ProgramNative::credits().unwrap());
        let inputs = credits.get_function_inputs("transfer_private".to_string()).unwrap();

        let expected = array![
            object! {
                "type": "record",
                "record": "credits",
                "members": array![
                    object! {
                        "name": "microcredits",
                        "type": "u64",
                        "visibility": "private",
                    },
                    object! {
                        "name": "_nonce",
                        "type": "group",
                        "visibility": "public",
                    },
                ],
                "register": "r0",
            },
            object! {
                "type": "address",
                "visibility": "private",
                "register": "r1",
            },
            object! {
                "type": "u64",
                "visibility": "private",
                "register": "r2",
            },
        ];

        assert_eq!(format!("{:?}", inputs), format!("{:?}", expected));

        let token_issue = Program::from_string(TOKEN_ISSUE).unwrap();
        let inputs = token_issue.get_function_inputs("bump_token_version".to_string()).unwrap();

        let expected = array![
            object! {
                "type": "address",
                "visibility": "private",
                "register": "r0",
            },
            object! {
                "type": "record",
                "record": "Token",
                "members": array![
                    object! {
                        "name": "microcredits",
                        "type": "u64",
                        "visibility": "private",
                    },
                    object! {
                        "name": "amount",
                        "type": "u64",
                        "visibility": "private",
                    },
                    object! {
                        "name": "token_data",
                        "type": "struct",
                        "struct_id": "token_metadata",
                        "members": array![
                            object!{
                                "name": "token_id",
                                "type": "u32",
                            },
                            object! {
                                "name": "version",
                                "type": "u32",
                            },
                        ],
                        "visibility": "private",
                    },
                    object! {
                        "name": "_nonce",
                        "type": "group",
                        "visibility": "public",
                    },
                ],
                "register": "r1",
            },
            object! {
                "type": "struct",
                "struct_id": "token_metadata",
                "members": array![
                    object! {
                        "name": "token_id",
                        "type": "u32",
                    },
                    object! {
                        "name": "version",
                        "type": "u32",
                    },
                ],
                "visibility": "private",
                "register": "r2",
            },
        ];

        assert_eq!(format!("{:?}", inputs), format!("{:?}", expected));
    }

    #[wasm_bindgen_test]
    fn test_get_record() {
        let credits = Program::from(ProgramNative::credits().unwrap());
        let members = credits.get_record_members("credits".to_string()).unwrap();

        let expected = object! {
            "type": "record",
            "record": "credits",
            "members": array![
                object! {
                    "name": "microcredits",
                    "type": "u64",
                    "visibility": "private",
                },
                object! {
                    "name": "_nonce",
                    "type": "group",
                    "visibility": "public",
                },
            ],
        };

        assert_eq!(format!("{:?}", members), format!("{:?}", expected));

        let token_issue = Program::from_string(TOKEN_ISSUE).unwrap();
        let members = token_issue.get_record_members("Token".to_string()).unwrap();

        let expected = object! {
            "type": "record",
            "record": "Token",
            "members": array![
                object! {
                    "name": "microcredits",
                    "type": "u64",
                    "visibility": "private",
                },
                object! {
                    "name": "amount",
                    "type": "u64",
                    "visibility": "private",
                },
                object! {
                    "name": "token_data",
                    "type": "struct",
                    "struct_id": "token_metadata",
                    "members": array![
                        object! {
                            "name": "token_id",
                            "type": "u32",
                        },
                        object! {
                            "name": "version",
                            "type": "u32",
                        },
                    ],
                    "visibility": "private",
                },
                object! {
                    "name": "_nonce",
                    "type": "group",
                    "visibility": "public",
                },
            ],
        };

        assert_eq!(format!("{:?}", members), format!("{:?}", expected));
    }

    #[wasm_bindgen_test]
    fn test_get_struct() {
        let program = Program::from_string(TOKEN_ISSUE).unwrap();
        let members = program.get_struct_members("token_metadata".to_string()).unwrap();

        let expected = array![
            object! {
                "name": "token_id",
                "type": "u32",
            },
            object! {
                "name": "version",
                "type": "u32",
            },
        ];

        assert_eq!(format!("{:?}", members), format!("{:?}", expected));
    }

    #[wasm_bindgen_test]
    fn test_program_from_methods() {
        // Test the from_string creates a valid object and to_string matches the source string
        let program_string = ProgramNative::credits().unwrap().to_string();
        let program = Program::from_string(&program_string).unwrap();
        assert_eq!(program_string, program.to_string());

        // Test the to and from methods from the native objects work
        let program_native = ProgramNative::from_str(&program.to_string()).unwrap();
        let program_from_native = Program::from(program_native.clone());
        assert_eq!(program, program_from_native);
        let native_from_program = ProgramNative::from(program);
        assert_eq!(program_native, native_from_program);
    }

    #[wasm_bindgen_test]
    fn test_get_imports() {
        let program = Program::from_string(NESTED_IMPORT_PROGRAM).unwrap();
        let imports = program.get_imports().to_vec();
        assert_eq!(&imports[0].as_string().unwrap(), "double_test.aleo");
        assert_eq!(&imports[1].as_string().unwrap(), "addition_test.aleo");
    }

    #[wasm_bindgen_test]
    fn test_is_arc20() {
        // A fully compliant ARC-20 token program is detected.
        let arc20 = Program::from_string(ARC20_TOKEN_PROGRAM).unwrap();
        assert!(arc20.is_arc20());

        // An ARC-20 token is not an ARC-22 token (transfer signatures differ).
        assert!(!arc20.is_arc22());

        // credits.aleo is not an ARC-20 token.
        assert!(!Program::get_credits_program().is_arc20());

        // A token using u64 amounts instead of u128 is not compliant.
        let wrong_amount_type = Program::from_string(&ARC20_TOKEN_PROGRAM.replace("u128", "u64")).unwrap();
        assert!(!wrong_amount_type.is_arc20());

        // A token missing a required function is not compliant.
        let missing_function =
            Program::from_string(&ARC20_TOKEN_PROGRAM.replace("function join:", "function join_tokens:")).unwrap();
        assert!(!missing_function.is_arc20());

        // A token without the required view functions is not compliant.
        let no_views = Program::from_string(ARC20_TOKEN_PROGRAM.split("view balance_of:").next().unwrap()).unwrap();
        assert!(!no_views.is_arc20());

        // A token missing a single required view function is not compliant.
        let missing_view =
            Program::from_string(&ARC20_TOKEN_PROGRAM.replace("view symbol:", "view symbol_of:")).unwrap();
        assert!(!missing_view.is_arc20());

        // A view function that is present but has the wrong signature is not compliant.
        let wrong_view = Program::from_string(&ARC20_TOKEN_PROGRAM.replace(
            "view balance_of:\n    input r0 as address.public;",
            "view balance_of:\n    input r0 as field.public;",
        ))
        .unwrap();
        assert!(!wrong_view.is_arc20());

        // A token whose future outputs point at another program is not compliant.
        let foreign_futures =
            Program::from_string(&ARC20_TOKEN_PROGRAM.replace("arc20_token.aleo/", "credits.aleo/")).unwrap();
        assert!(!foreign_futures.is_arc20());

        // A token whose record owner is public is not compliant.
        let public_owner =
            Program::from_string(&ARC20_TOKEN_PROGRAM.replace("owner as address.private", "owner as address.public"))
                .unwrap();
        assert!(!public_owner.is_arc20());

        // A token whose record is not named `Token` is not compliant.
        let wrong_record_name = Program::from_string(&ARC20_TOKEN_PROGRAM.replace("Token", "Coupon")).unwrap();
        assert!(!wrong_record_name.is_arc20());
    }

    #[wasm_bindgen_test]
    fn test_is_arc22() {
        // A fully compliant ARC-22 token program is detected (the extra `token_id`
        // entry on the Token record is permitted by the interface's `..`).
        let arc22 = Program::from_string(ARC22_TOKEN_PROGRAM).unwrap();
        assert!(arc22.is_arc22());

        // An ARC-22 token is not an ARC-20 token (transfer signatures differ).
        assert!(!arc22.is_arc20());

        // credits.aleo is not an ARC-22 token.
        assert!(!Program::get_credits_program().is_arc22());

        // A program whose local MerkleProof struct has the wrong shape is not compliant.
        let wrong_merkle_proof =
            Program::from_string(&ARC22_TOKEN_PROGRAM.replace("[field; 16u32]", "[field; 8u32]")).unwrap();
        assert!(!wrong_merkle_proof.is_arc22());

        // A token missing the ComplianceRecord is not compliant.
        let missing_compliance_record =
            Program::from_string(&ARC22_TOKEN_PROGRAM.replace("ComplianceRecord", "AuditRecord")).unwrap();
        assert!(!missing_compliance_record.is_arc22());
    }

    #[wasm_bindgen_test]
    fn test_name_to_field() {
        // The field encoding of the program's name (minus the .aleo suffix) matches the
        // identifier-to-field conversion of the bare name.
        let credits = Program::get_credits_program();
        assert_eq!(
            credits.name_to_field().unwrap().to_string(),
            crate::utilities::string_to_field("credits").unwrap().to_string()
        );

        let arc20 = Program::from_string(ARC20_TOKEN_PROGRAM).unwrap();
        assert_eq!(
            arc20.name_to_field().unwrap().to_string(),
            crate::utilities::string_to_field("arc20_token").unwrap().to_string()
        );
    }

    #[wasm_bindgen_test]
    fn test_is_arc22_real_programs() {
        // The Leo-compiled compliant token template is ARC-22 compliant. It declares all
        // seven view functions and imports its MerkleProof struct from freezelist.aleo.
        let template = Program::from_string(COMPLIANT_TOKEN_TEMPLATE).unwrap();
        assert!(template.is_arc22());
        assert!(!template.is_arc20());

        // The deployed testnet USDCx stablecoin matches all IARC22 function and record
        // signatures but declares no view functions, so it is not ARC-22 compliant.
        let usdcx = Program::from_string(TEST_USDCX_STABLECOIN).unwrap();
        assert!(!usdcx.is_arc22());
        assert!(!usdcx.is_arc20());
    }
}
