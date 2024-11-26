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

use crate::types::{
    helpers::literal_to_js_value,
    native::{IdentifierNative, PlaintextNative},
};

use indexmap::IndexMap;
use js_sys::{Object, Reflect};
use wasm_bindgen::JsValue;

/// Insert a plaintext value into a javascript object.
pub fn insert_plaintext(js_object: &Object, key: &IdentifierNative, plaintext: &PlaintextNative) {
    match plaintext {
        PlaintextNative::Literal(literal, _) => {
            let js_value = literal_to_js_value(literal);
            Reflect::set(js_object, &key.to_string().into(), &js_value.into()).unwrap();
        }
        PlaintextNative::Struct(struct_members, ..) => {
            let struct_object = struct_to_js_object(struct_members);
            Reflect::set(&js_object, &key.to_string().into(), &struct_object.into()).unwrap();
        }
        PlaintextNative::Array(plaintext, ..) => {
            let js_array = js_sys::Array::new();
            for value in plaintext.iter() {
                js_array.push(&plaintext_to_js_value(value));
            }
            Reflect::set(&js_object, &key.to_string().into(), &js_array.into()).unwrap();
        }
    }
}

/// Convert a plaintext to a javascript value.
pub fn plaintext_to_js_value(plaintext: &PlaintextNative) -> JsValue {
    match plaintext {
        PlaintextNative::Literal(literal, _) => literal_to_js_value(literal),
        PlaintextNative::Struct(struct_members, ..) => JsValue::from(struct_to_js_object(struct_members)),
        PlaintextNative::Array(plaintext, ..) => {
            let js_array = js_sys::Array::new();
            for value in plaintext.iter() {
                js_array.push(&plaintext_to_js_value(value));
            }
            JsValue::from(js_array)
        }
    }
}

/// Make a struct into a javascript object.
pub fn struct_to_js_object(struct_members: &IndexMap<IdentifierNative, PlaintextNative>) -> Object {
    let js_object = Object::new();
    for (key, value) in struct_members {
        insert_plaintext(&js_object, key, value);
    }
    js_object
}
