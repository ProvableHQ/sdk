// Copyright (C) 2019-2023 Aleo Systems Inc.
// This file is part of the Aleo library.

// The Aleo library is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// The Aleo library is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with the Aleo library. If not, see <https://www.gnu.org/licenses/>.

use crate::types::ProgramNative;

use std::{ops::Deref, str::FromStr};
use wasm_bindgen::{prelude::wasm_bindgen, JsValue};

/// Webassembly Representation of an Aleo program
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

    /// Get list of functions names in the program
    #[wasm_bindgen(js_name = "getFunctions")]
    pub fn get_functions(&self) -> js_sys::Array {
        let array = js_sys::Array::new_with_length(self.0.functions().len() as u32);
        let mut index = 0u32;
        self.0.functions().values().for_each(|function| {
            array.set(index, JsValue::from_str(&function.name().to_string()));
            index += 1;
        });
        array
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

    #[wasm_bindgen_test]
    fn test_get_functions() {
        let program_string = ProgramNative::credits().unwrap().to_string();
        let program = Program::from_string(&program_string).unwrap();
        assert_eq!(program.get_functions().to_vec(), vec!["mint", "transfer", "join", "split", "fee"]);
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
