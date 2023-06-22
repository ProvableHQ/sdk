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

use crate::types::{CurrentNetwork, IdentifierNative, ProgramNative};

use js_sys::{Array, Object, Reflect};
use snarkvm_console::program::{EntryType, PlaintextType, ValueType};
use std::{ops::Deref, str::FromStr};
use wasm_bindgen::{prelude::wasm_bindgen, JsValue};

/// Webassembly Representation of an Aleo program
///
/// This object is required to create an Execution or Deployment transaction. It includes several
/// convenience methods for enumerating available functions and each functions' inputs in a
/// javascript object for usage in creation of web forms for input capture.
#[wasm_bindgen]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Program(ProgramNative);

#[wasm_bindgen]
impl Program {
    /// Create a program from a program string
    #[wasm_bindgen(js_name = "fromString")]
    pub fn from_string(program: &str) -> Result<Program, String> {
        Ok(Self(ProgramNative::from_str(program).map_err(|err| err.to_string())?))
    }

    /// Get a string representation of the program
    #[wasm_bindgen(js_name = "toString")]
    #[allow(clippy::inherent_to_string)]
    pub fn to_string(&self) -> String {
        self.0.to_string()
    }

    /// Get javascript array of functions names in the program
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
    /// to generate a webform to capture user inputs for an execution of a function.
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
            match input.value_type() {
                ValueType::Constant(plaintext) => {
                    function_inputs.set(
                        index as u32,
                        self.get_plaintext_input(plaintext, Some("constant".to_string()), None)?.into(),
                    );
                }
                ValueType::Public(plaintext) => {
                    function_inputs.set(
                        index as u32,
                        self.get_plaintext_input(plaintext, Some("public".to_string()), None)?.into(),
                    );
                }
                ValueType::Private(plaintext) => {
                    function_inputs.set(
                        index as u32,
                        self.get_plaintext_input(plaintext, Some("private".to_string()), None)?.into(),
                    );
                }
                ValueType::Record(identifier) => {
                    function_inputs.set(index as u32, self.get_record_members(identifier.to_string())?.into());
                }
                ValueType::ExternalRecord(locator) => {
                    function_inputs.set(index as u32, locator.to_string().into());
                }
            }
        }
        Ok(function_inputs)
    }

    // Get the value of a plaintext input
    fn get_plaintext_input(
        &self,
        plaintext: &PlaintextType<CurrentNetwork>,
        visibility: Option<String>,
        name: Option<String>,
    ) -> Result<Object, String> {
        let input = Object::new();
        match plaintext {
            PlaintextType::Literal(literal_type) => {
                if let Some(name) = name {
                    Reflect::set(&input, &"name".into(), &name.into()).map_err(|_| "Failed to set property")?;
                }
                let value_type = JsValue::from_str(&literal_type.to_string());
                Reflect::set(&input, &"type".into(), &value_type).map_err(|_| "Failed to set property")?;
            }
            PlaintextType::Struct(struct_id) => {
                let name = struct_id.to_string();
                Reflect::set(&input, &"type".into(), &"struct".into()).map_err(|_| "Failed to set property")?;
                Reflect::set(&input, &"name".into(), &name.clone().into()).map_err(|_| "Failed to set property")?;
                let inputs = self.get_struct_members(name)?;
                Reflect::set(&input, &"members".into(), &inputs.into()).map_err(|_| "Failed to set property")?;
            }
        }
        if let Some(visibility) = visibility {
            Reflect::set(&input, &"visibility".into(), &visibility.into()).map_err(|_| "Failed to set property")?;
        }

        Ok(input)
    }

    /// Get a javascript object representation of a program record and its types
    #[wasm_bindgen(js_name = "getRecordMembers")]
    pub fn get_record_members(&self, record_name: String) -> Result<Object, String> {
        let record_id = IdentifierNative::from_str(&record_name).map_err(|e| e.to_string())?;
        let record = self
            .0
            .get_record(&record_id)
            .map_err(|_| format!("struct {} not found in {}", record_name, self.0.id()))?;

        let input = Object::new();
        Reflect::set(&input, &"type".into(), &"record".into()).map_err(|_| "Failed to set property")?;
        Reflect::set(&input, &"name".into(), &record_name.into()).map_err(|_| "Failed to set property")?;

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
        Ok(input)
    }

    /// Get a javascript object representation of a program struct and its types
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
    #[wasm_bindgen(js_name = "getCreditsProgram")]
    pub fn get_credits_program() -> Program {
        Program::from(ProgramNative::credits().unwrap())
    }

    /// Get the id of the program
    #[wasm_bindgen]
    pub fn id(&self) -> String {
        self.0.id().to_string()
    }

    /// Determine equality with another program
    #[wasm_bindgen(js_name = "isEqual")]
    pub fn is_equal(&self, other: &Program) -> bool {
        self == other
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

    #[wasm_bindgen_test]
    fn test_get_functions() {
        let program = Program::from(ProgramNative::credits().unwrap());
        let mint = JsValue::from_str("mint");
        let transfer_public = JsValue::from_str("transfer_public");
        let transfer_private = JsValue::from_str("transfer_private");
        let transfer_private_to_public = JsValue::from_str("transfer_private_to_public");
        let transfer_public_to_private = JsValue::from_str("transfer_public_to_private");
        let join = JsValue::from_str("join");
        let split = JsValue::from_str("split");
        let fee = JsValue::from_str("fee");

        assert_eq!(program.get_functions().to_vec(), vec![
            mint,
            transfer_public,
            transfer_private,
            transfer_private_to_public,
            transfer_public_to_private,
            join,
            split,
            fee
        ]);
    }

    #[wasm_bindgen_test]
    fn test_get_inputs() {
        let credits = Program::from(ProgramNative::credits().unwrap());
        let inputs = credits.get_function_inputs("transfer_private".to_string()).unwrap();
        let expected = r#"Array { obj: Object { obj: JsValue([Object({"type":"record","name":"credits","members":[{"name":"microcredits","type":"u64","visibility":"private"}]}), Object({"type":"address","visibility":"private"}), Object({"type":"u64","visibility":"private"})]) } }"#.to_string();
        assert_eq!(format!("{:?}", inputs), expected);

        let token_issue = Program::from_string(TOKEN_ISSUE).unwrap();
        let inputs = token_issue.get_function_inputs("bump_token_version".to_string()).unwrap();
        let expected = r#"Array { obj: Object { obj: JsValue([Object({"type":"address","visibility":"private"}), Object({"type":"record","name":"Token","members":[{"name":"microcredits","type":"u64","visibility":"private"},{"name":"amount","type":"u64","visibility":"private"},{"type":"struct","name":"token_metadata","members":[{"name":"token_id","type":"u32"},{"name":"version","type":"u32"}],"visibility":"private"}]}), Object({"type":"struct","name":"token_metadata","members":[{"name":"token_id","type":"u32"},{"name":"version","type":"u32"}],"visibility":"private"})]) } }"#;
        assert_eq!(format!("{:?}", inputs), expected);
    }

    #[wasm_bindgen_test]
    fn test_get_record() {
        let credits = Program::from(ProgramNative::credits().unwrap());
        let members = credits.get_record_members("credits".to_string()).unwrap();
        let expected = r#"Object { obj: JsValue(Object({"type":"record","name":"credits","members":[{"name":"microcredits","type":"u64","visibility":"private"}]})) }"#.to_string();
        assert_eq!(format!("{:?}", members), expected);

        let token_issue = Program::from_string(TOKEN_ISSUE).unwrap();
        let members = token_issue.get_record_members("Token".to_string()).unwrap();
        let expected = r#"Object { obj: JsValue(Object({"type":"record","name":"Token","members":[{"name":"microcredits","type":"u64","visibility":"private"},{"name":"amount","type":"u64","visibility":"private"},{"type":"struct","name":"token_metadata","members":[{"name":"token_id","type":"u32"},{"name":"version","type":"u32"}],"visibility":"private"}]})) }"#;
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
}
