// Copyright (C) 2019-2024 Aleo Systems Inc.
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

use crate::types::native::{CurrentNetwork, EntryType, IdentifierNative, PlaintextType, ProgramNative, ValueType};

use js_sys::{Array, Object, Reflect};
use std::{ops::Deref, str::FromStr};
use wasm_bindgen::{prelude::wasm_bindgen, JsValue};

/// Webassembly Representation of an Aleo program
#[wasm_bindgen]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Program(ProgramNative);

#[wasm_bindgen]
impl Program {
    /// Create a program from a program string
    ///
    /// @param {string} program Aleo program source code
    /// @returns {Program | Error} Program object
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
        IdentifierNative::from_str(function_name).map_or(false, |identifier| self.0.contains_function(&identifier))
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
    /// @returns {Array | Error} Array of function inputs
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
            }
        }
        Ok(function_inputs)
    }

    /// Get a the list of a program's mappings and the names/types of their keys and values.
    ///
    /// @returns {Array | Error} - An array of objects representing the mappings in the program
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
        }
        if let Some(visibility) = visibility {
            Reflect::set(&input, &"visibility".into(), &visibility.into()).map_err(|_| "Failed to set property")?;
        }

        Ok(input)
    }

    /// Get a javascript object representation of a program record and its types
    ///
    /// @param {string} record_name Name of the record to get members for
    /// @returns {Object | Error} Object containing the record name, type, and members
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
    /// @returns {Array | Error} Array containing the struct members
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

impl FromStr for Program {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        Self::from_string(s)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

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

        // Create the expected mappings
        let account = Object::new();
        let array = Array::new();
        let bonded = Object::new();
        let committee = Object::new();
        let unbonding = Object::new();

        Reflect::set(&account, &JsValue::from_str("name"), &JsValue::from_str("account")).unwrap();
        Reflect::set(&account, &JsValue::from_str("key_type"), &JsValue::from_str("address")).unwrap();
        Reflect::set(&account, &JsValue::from_str("value_type"), &JsValue::from_str("u64")).unwrap();
        Reflect::set(&bonded, &JsValue::from_str("name"), &JsValue::from_str("bonded")).unwrap();
        Reflect::set(&bonded, &JsValue::from_str("key_type"), &JsValue::from_str("address")).unwrap();
        Reflect::set(&bonded, &JsValue::from_str("value_type"), &JsValue::from_str("bond_state")).unwrap();
        Reflect::set(&committee, &JsValue::from_str("name"), &JsValue::from_str("committee")).unwrap();
        Reflect::set(&committee, &JsValue::from_str("key_type"), &JsValue::from_str("address")).unwrap();
        Reflect::set(&committee, &JsValue::from_str("value_type"), &JsValue::from_str("committee_state")).unwrap();
        Reflect::set(&unbonding, &JsValue::from_str("name"), &JsValue::from_str("unbonding")).unwrap();
        Reflect::set(&unbonding, &JsValue::from_str("key_type"), &JsValue::from_str("address")).unwrap();
        Reflect::set(&unbonding, &JsValue::from_str("value_type"), &JsValue::from_str("unbond_state")).unwrap();

        array.push(&committee);
        array.push(&bonded);
        array.push(&unbonding);
        array.push(&account);

        // Assert that the mappings are equal
        assert_eq!(format!("{:?}", mappings.to_vec()), format!("{:?}", array.to_vec()));

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
        let expected = r#"Array { obj: Object { obj: JsValue([Object({"type":"record","record":"credits","members":[{"name":"microcredits","type":"u64","visibility":"private"},{"name":"_nonce","type":"group","visibility":"public"}],"register":"r0"}), Object({"type":"address","visibility":"private","register":"r1"}), Object({"type":"u64","visibility":"private","register":"r2"})]) } }"#.to_string();
        assert_eq!(format!("{:?}", inputs), expected);

        let token_issue = Program::from_string(TOKEN_ISSUE).unwrap();
        let inputs = token_issue.get_function_inputs("bump_token_version".to_string()).unwrap();
        let expected = r#"Array { obj: Object { obj: JsValue([Object({"type":"address","visibility":"private","register":"r0"}), Object({"type":"record","record":"Token","members":[{"name":"microcredits","type":"u64","visibility":"private"},{"name":"amount","type":"u64","visibility":"private"},{"name":"token_data","type":"struct","struct_id":"token_metadata","members":[{"name":"token_id","type":"u32"},{"name":"version","type":"u32"}],"visibility":"private"},{"name":"_nonce","type":"group","visibility":"public"}],"register":"r1"}), Object({"type":"struct","struct_id":"token_metadata","members":[{"name":"token_id","type":"u32"},{"name":"version","type":"u32"}],"visibility":"private","register":"r2"})]) } }"#;
        assert_eq!(format!("{:?}", inputs), expected);
    }

    #[wasm_bindgen_test]
    fn test_get_record() {
        let credits = Program::from(ProgramNative::credits().unwrap());
        let members = credits.get_record_members("credits".to_string()).unwrap();
        let expected = r#"Object { obj: JsValue(Object({"type":"record","record":"credits","members":[{"name":"microcredits","type":"u64","visibility":"private"},{"name":"_nonce","type":"group","visibility":"public"}]})) }"#.to_string();
        assert_eq!(format!("{:?}", members), expected);

        let token_issue = Program::from_string(TOKEN_ISSUE).unwrap();
        let members = token_issue.get_record_members("Token".to_string()).unwrap();
        let expected = r#"Object { obj: JsValue(Object({"type":"record","record":"Token","members":[{"name":"microcredits","type":"u64","visibility":"private"},{"name":"amount","type":"u64","visibility":"private"},{"name":"token_data","type":"struct","struct_id":"token_metadata","members":[{"name":"token_id","type":"u32"},{"name":"version","type":"u32"}],"visibility":"private"},{"name":"_nonce","type":"group","visibility":"public"}]})) }"#;
        assert_eq!(format!("{:?}", members), expected);
    }

    #[wasm_bindgen_test]
    fn test_get_struct() {
        let program = Program::from_string(TOKEN_ISSUE).unwrap();
        let members = program.get_struct_members("token_metadata".to_string()).unwrap();
        let expected = r#"Array { obj: Object { obj: JsValue([Object({"name":"token_id","type":"u32"}), Object({"name":"version","type":"u32"})]) } }"#;
        assert_eq!(format!("{:?}", members), expected);
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
}
