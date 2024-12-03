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
    future_to_js_value,
    plaintext_to_js_value,
    types::native::OutputNative,
    Ciphertext,
    Field,
    Plaintext,
    RecordCiphertext,
};

use js_sys::{JsString, Object, Reflect};
use wasm_bindgen::JsValue;

pub fn output_to_js_value(output: &OutputNative, convert_to_js: bool) -> Result<JsValue, String> {
    let js_value = match output {
        OutputNative::Constant(_, plaintext) => {
            if let Some(plaintext) = plaintext {
                if convert_to_js { plaintext_to_js_value(plaintext) } else { JsValue::from(Plaintext::from(plaintext)) }
            } else {
                JsValue::NULL
            }
        }
        OutputNative::Public(_, plaintext) => {
            if let Some(plaintext) = plaintext {
                if convert_to_js { plaintext_to_js_value(plaintext) } else { JsValue::from(Plaintext::from(plaintext)) }
            } else {
                JsValue::NULL
            }
        }
        OutputNative::Private(_, ciphertext) => {
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
        OutputNative::Record(commitment, checksum, record_ciphertext) => {
            let record = Object::new();
            Reflect::set(&record, &JsString::from("type"), &JsString::from("record")).unwrap();
            if convert_to_js {
                Reflect::set(&record, &JsString::from("commitment"), &JsValue::from(commitment.to_string())).unwrap();
                Reflect::set(&record, &JsString::from("checksum"), &JsValue::from(checksum.to_string())).unwrap();
                if let Some(record_ciphertext) = record_ciphertext {
                    Reflect::set(
                        &record,
                        &JsString::from("recordCiphertext"),
                        &JsValue::from(record_ciphertext.to_string()),
                    )
                    .unwrap();
                }
            } else {
                Reflect::set(&record, &JsString::from("commitment"), &JsValue::from(Field::from(commitment))).unwrap();
                Reflect::set(&record, &JsString::from("checksum"), &JsValue::from(Field::from(checksum))).unwrap();
                if let Some(record_ciphertext) = record_ciphertext {
                    Reflect::set(
                        &record,
                        &JsString::from("recordCiphertext"),
                        &JsValue::from(RecordCiphertext::from(record_ciphertext)),
                    )
                    .unwrap();
                }
            }
            JsValue::from(&record)
        }
        OutputNative::ExternalRecord(output_commitment) => {
            let external_record_object = Object::new();
            Reflect::set(&external_record_object, &JsString::from("type"), &JsString::from("externalRecord")).unwrap();
            if convert_to_js {
                Reflect::set(
                    &external_record_object,
                    &JsString::from("outputCommitment"),
                    &JsString::from(output_commitment.to_string()),
                )
                .unwrap();
            } else {
                Reflect::set(
                    &external_record_object,
                    &JsString::from("outputCommitment"),
                    &JsValue::from(Field::from(output_commitment)),
                )
                .unwrap();
            }
            JsValue::from(external_record_object)
        }
        OutputNative::Future(_, future) => {
            if let Some(future) = future {
                future_to_js_value(future, convert_to_js)
            } else {
                JsValue::NULL
            }
        }
    };
    Ok(js_value)
}
