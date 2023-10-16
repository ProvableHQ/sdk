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

use crate::types::{ExecutionNative, ProcessNative, ResponseNative};

use crate::{Execution, KeyPair};
use std::ops::Deref;
use wasm_bindgen::{prelude::wasm_bindgen, JsValue};

/// Webassembly Representation of an Aleo function execution response
///
/// This object is returned by the execution of an Aleo function off-chain. It provides methods for
/// retrieving the outputs of the function execution.
#[wasm_bindgen]
pub struct ExecutionResponse {
    response: ResponseNative,
    execution: Option<Execution>,
    process: Option<ProcessNative>,
}

#[wasm_bindgen]
impl ExecutionResponse {
    /// Get the outputs of the executed function
    ///
    /// @returns {Array} Array of strings representing the outputs of the function
    #[wasm_bindgen(js_name = "getOutputs")]
    pub fn get_outputs(&self) -> js_sys::Array {
        let array = js_sys::Array::new_with_length(0u32);
        self.response.outputs().iter().enumerate().for_each(|(i, output)| {
            array.set(i as u32, JsValue::from_str(&output.to_string()));
        });
        array
    }

    /// Returns the execution object if present, null if otherwise. Please note that this function
    /// removes the WebAssembly object from the response object and will return null if called a
    /// second time.
    ///
    /// @returns {Execution} The execution object if present, null if otherwise
    #[wasm_bindgen(js_name = "getExecution")]
    pub fn get_execution(&mut self) -> Option<Execution> {
        self.execution.take()
    }

    /// Returns the program keys if present
    #[wasm_bindgen(js_name = "getKeys")]
    pub fn get_keys(&self, program_id: &str, function_name: &str) -> Result<KeyPair, String> {
        if let Some(process) = &self.process {
            let proving_key = process.get_proving_key(program_id, function_name).map_err(|e| e.to_string())?;
            let verifying_key = process.get_verifying_key(program_id, function_name).map_err(|e| e.to_string())?;
            return Ok(KeyPair::from((proving_key, verifying_key)));
        }
        Err(format!("Could not find {program_id}:{function_name}"))
    }
}

impl Deref for ExecutionResponse {
    type Target = ResponseNative;

    fn deref(&self) -> &Self::Target {
        &self.response
    }
}

impl From<(ResponseNative, Option<ProcessNative>)> for ExecutionResponse {
    fn from((response, process): (ResponseNative, Option<ProcessNative>)) -> Self {
        Self { response, execution: None, process }
    }
}

impl From<(ResponseNative, ExecutionNative, Option<ProcessNative>)> for ExecutionResponse {
    fn from((response, execution, process): (ResponseNative, ExecutionNative, Option<ProcessNative>)) -> Self {
        Self { response, execution: Some(Execution::from(execution)), process }
    }
}

impl From<ExecutionResponse> for ResponseNative {
    fn from(response: ExecutionResponse) -> Self {
        response.response
    }
}
