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

use crate::{object, plaintext_to_js_value, types::native::{ArgumentNative, FutureNative}, Field, Plaintext};

use js_sys::{Array, Reflect};
use wasm_bindgen::JsValue;
use crate::types::native::FieldNative;

/// Convert a future to a javascript value.
pub fn future_to_js_value(argument: &FutureNative, convert_to_js: bool, id: &FieldNative) -> JsValue {
    let arguments = argument
        .arguments()
        .iter()
        .map(|argument| match argument {
            ArgumentNative::Plaintext(plaintext) => {
                if convert_to_js {
                    plaintext_to_js_value(plaintext)
                } else {
                    JsValue::from(Plaintext::from(plaintext))
                }
            }
            ArgumentNative::Future(future) => future_to_js_value(future, convert_to_js, id),
        })
        .collect::<Array>();
    let future_object = object! {
        "type" : "future",
        "id" : if convert_to_js { JsValue::from(&id.to_string()) } else { JsValue::from(Field::from(id)) },
        "programId" : argument.program_id().to_string(),
        "functionName" : argument.function_name().to_string(),
        "arguments" : arguments,
    };
    JsValue::from(future_object)
}
