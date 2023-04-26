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

use crate::types::ResponseNative;

use std::ops::Deref;
use wasm_bindgen::{prelude::wasm_bindgen, JsValue};

/// Webassembly Representation of an Aleo response
#[wasm_bindgen]
pub struct ExecutionResponse(ResponseNative);

#[wasm_bindgen]
impl ExecutionResponse {
    /// Get list of functions names in the response
    #[wasm_bindgen(js_name = "getOutputs")]
    pub fn get_outputs(&self) -> js_sys::Array {
        let array = js_sys::Array::new_with_length(0u32);
        self.0.outputs().iter().enumerate().for_each(|(i, output)| {
            array.set(i as u32, JsValue::from_str(&output.to_string()));
        });
        array
    }
}

impl Deref for ExecutionResponse {
    type Target = ResponseNative;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl From<ResponseNative> for ExecutionResponse {
    fn from(value: ResponseNative) -> Self {
        Self(value)
    }
}

impl From<ExecutionResponse> for ResponseNative {
    fn from(response: ExecutionResponse) -> Self {
        response.0
    }
}
