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
    Ciphertext,
    Field,
    Plaintext,
    RecordCiphertext,
    future_to_js_value,
    object,
    plaintext_to_js_value,
    types::native::OutputNative,
};

use js_sys::Reflect;
use wasm_bindgen::JsValue;

pub fn output_to_js_value(output: &OutputNative, convert_to_js: bool) -> JsValue {
    let js_value = match output {
        OutputNative::Constant(id, plaintext) => {
            let value = if let Some(plaintext) = plaintext {
                if convert_to_js { plaintext_to_js_value(plaintext) } else { JsValue::from(Plaintext::from(plaintext)) }
            } else {
                JsValue::UNDEFINED
            };
            let constant = object! {
                "type" : "constant",
                "id" : if convert_to_js { JsValue::from(id.to_string()) } else { JsValue::from(Field::from(id)) },
                "value" : value,
            };
            JsValue::from(constant)
        }
        OutputNative::Public(id, plaintext) => {
            let value = if let Some(plaintext) = plaintext {
                if convert_to_js { plaintext_to_js_value(plaintext) } else { JsValue::from(Plaintext::from(plaintext)) }
            } else {
                JsValue::UNDEFINED
            };
            let public_output = object! {
                "type" : "public",
                "id" : if convert_to_js { JsValue::from(id.to_string()) } else { JsValue::from(Field::from(id)) },
                "value" : value,
            };
            JsValue::from(public_output)
        }
        OutputNative::Private(id, ciphertext) => {
            let value = if let Some(ciphertext) = ciphertext {
                if convert_to_js {
                    JsValue::from_str(&ciphertext.to_string())
                } else {
                    JsValue::from(Ciphertext::from(ciphertext))
                }
            } else {
                JsValue::UNDEFINED
            };
            let private_output = object! {
                "type" : "private",
                "id" : if convert_to_js { JsValue::from(id.to_string()) } else { JsValue::from(Field::from(id)) },
                "value" : value,
            };
            JsValue::from(private_output)
        }
        OutputNative::Record(commitment, checksum, record_ciphertext) => {
            let value = if let Some(record_ciphertext) = record_ciphertext {
                if convert_to_js {
                    JsValue::from(record_ciphertext.to_string())
                } else {
                    JsValue::from(RecordCiphertext::from(record_ciphertext))
                }
            } else {
                JsValue::UNDEFINED
            };
            let record = object! {
                "type": "record",
                "id": if convert_to_js { JsValue::from(commitment.to_string()) } else { JsValue::from(Field::from(commitment)) },
                "checksum": if convert_to_js { JsValue::from(checksum.to_string()) } else { JsValue::from(Field::from(checksum)) },
                "value" : value,
            };
            JsValue::from(record)
        }
        OutputNative::ExternalRecord(output_commitment) => {
            let external_record_object = object! {
                "type": "external_record",
                "id": if convert_to_js { JsValue::from(output_commitment.to_string()) } else { JsValue::from(Field::from(output_commitment)) },
            };
            JsValue::from(external_record_object)
        }
        OutputNative::Future(id, future) => {
            let value = if let Some(future) = future {
                future_to_js_value(future, convert_to_js, id)
            } else {
                JsValue::UNDEFINED
            };
            JsValue::from(&value)
        }
    };
    js_value
}
