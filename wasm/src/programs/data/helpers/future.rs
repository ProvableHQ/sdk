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

use crate::{
    Plaintext,
    plaintext_to_js_value,
    types::native::{ArgumentNative, FutureNative},
};

use js_sys::{Array, JsString, Object, Reflect};
use wasm_bindgen::JsValue;

/// Convert a future to a javascript value.
pub fn future_to_js_value(argument: &FutureNative, convert_to_js: bool) -> JsValue {
    let future_object = Object::new();
    Reflect::set(&future_object, &JsString::from("type"), &JsString::from("future")).unwrap();
    Reflect::set(&future_object, &JsString::from("programId"), &JsString::from(argument.program_id().to_string()))
        .unwrap();
    Reflect::set(
        &future_object,
        &JsString::from("functionName"),
        &JsString::from(argument.function_name().to_string()),
    )
    .unwrap();
    let arguments = Array::new();
    for argument in argument.arguments() {
        match argument {
            ArgumentNative::Plaintext(plaintext) => {
                if convert_to_js {
                    arguments.push(&plaintext_to_js_value(plaintext));
                } else {
                    arguments.push(&JsValue::from(Plaintext::from(plaintext)));
                }
            }
            ArgumentNative::Future(future) => {
                arguments.push(&future_to_js_value(future, convert_to_js));
            }
        }
    }
    Reflect::set(&future_object, &JsString::from("arguments"), &JsValue::from(&arguments)).unwrap();
    JsValue::from(future_object)
}
