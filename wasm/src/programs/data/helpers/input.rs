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

use crate::{Ciphertext, Field, Plaintext, object, plaintext_to_js_value, types::native::InputNative};

use js_sys::Reflect;
use wasm_bindgen::JsValue;

pub fn input_to_js_value(input: &InputNative, convert_to_js: bool) -> JsValue {
    match input {
        InputNative::Constant(id, plaintext) => {
            let value = if let Some(plaintext) = plaintext {
                if convert_to_js { plaintext_to_js_value(plaintext) } else { JsValue::from(Plaintext::from(plaintext)) }
            } else {
                JsValue::UNDEFINED
            };
            let constant_input = object! {
                "type": "constant",
                "id": if convert_to_js { JsValue::from(&id.to_string()) } else { JsValue::from(Field::from(id)) },
                "value": value,
            };
            JsValue::from(constant_input)
        }
        InputNative::Public(id, plaintext) => {
            let value = if let Some(plaintext) = plaintext {
                if convert_to_js { plaintext_to_js_value(plaintext) } else { JsValue::from(Plaintext::from(plaintext)) }
            } else {
                JsValue::UNDEFINED
            };
            let public_input = object! {
                "type" : "public",
                "id" : if convert_to_js { JsValue::from(&id.to_string()) } else { JsValue::from(Field::from(id)) },
                "value" : value,
            };
            JsValue::from(public_input)
        }
        InputNative::Private(id, ciphertext) => {
            let value = if let Some(ciphertext) = ciphertext {
                if convert_to_js {
                    JsValue::from_str(&ciphertext.to_string())
                } else {
                    JsValue::from(Ciphertext::from(ciphertext))
                }
            } else {
                JsValue::UNDEFINED
            };
            let private_input = object! {
                "type" : "private",
                "id" : if convert_to_js { JsValue::from(&id.to_string()) } else { JsValue::from(Field::from(id)) },
                "value" : value,
            };
            JsValue::from(private_input)
        }
        InputNative::Record(serial_number, tag) => {
            let record = object! {
                "type": "record",
                "id": if convert_to_js { JsValue::from(serial_number.to_string()) } else { JsValue::from(Field::from(serial_number)) },
                "tag" : if convert_to_js { JsValue::from(Field::from(tag).to_string()) } else { JsValue::from(Field::from(tag)) },
            };
            JsValue::from(record)
        }
        InputNative::ExternalRecord(input_commitment) => {
            let external_record = object! {
                "type": "externalRecord",
                "id" : if convert_to_js { JsValue::from(input_commitment.to_string()) } else { JsValue::from(Field::from(input_commitment)) },
            };
            JsValue::from(external_record)
        }
    }
}
