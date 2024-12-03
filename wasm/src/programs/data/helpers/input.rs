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

use crate::{Ciphertext, Field, Plaintext, plaintext_to_js_value, types::native::InputNative};

use js_sys::{JsString, Object, Reflect};
use wasm_bindgen::JsValue;

pub fn input_to_js_value(input: &InputNative, convert_to_js: bool) -> JsValue {
    match input {
        InputNative::Constant(_, plaintext) => {
            if let Some(plaintext) = plaintext {
                if convert_to_js { plaintext_to_js_value(plaintext) } else { JsValue::from(Plaintext::from(plaintext)) }
            } else {
                JsValue::NULL
            }
        }
        InputNative::Public(_, plaintext) => {
            if let Some(plaintext) = plaintext {
                if convert_to_js { plaintext_to_js_value(plaintext) } else { JsValue::from(Plaintext::from(plaintext)) }
            } else {
                JsValue::NULL
            }
        }
        InputNative::Private(_, ciphertext) => {
            if let Some(ciphertext) = ciphertext {
                if convert_to_js {
                    JsValue::from_str(&ciphertext.to_string())
                } else {
                    JsValue::from(Ciphertext::from(ciphertext))
                }
            } else {
                JsValue::NULL
            }
        }
        InputNative::Record(serial_number, tag) => {
            let record = Object::new();
            Reflect::set(&record, &JsString::from("type"), &JsValue::from_str("record")).unwrap();
            if convert_to_js {
                Reflect::set(&record, &JsString::from("serialNumber"), &JsValue::from(serial_number.to_string()))
                    .unwrap();
                Reflect::set(&record, &JsString::from("tag"), &JsValue::from(Field::from(tag).to_string())).unwrap();
            } else {
                Reflect::set(&record, &JsString::from("serialNumber"), &JsValue::from(Field::from(serial_number)))
                    .unwrap();
                Reflect::set(&record, &JsString::from("tag"), &JsValue::from(Field::from(tag))).unwrap();
            }
            JsValue::from(record)
        }
        InputNative::ExternalRecord(input_commitment) => {
            let record = Object::new();
            Reflect::set(&record, &JsString::from("type"), &JsValue::from_str("externalRecord")).unwrap();
            if convert_to_js {
                Reflect::set(&record, &JsString::from("inputCommitment"), &JsValue::from(input_commitment.to_string()))
                    .unwrap();
            } else {
                Reflect::set(
                    &record,
                    &JsString::from("inputCommitment"),
                    &JsValue::from(Field::from(input_commitment)),
                )
                .unwrap();
            }
            JsValue::from(record)
        }
    }
}
