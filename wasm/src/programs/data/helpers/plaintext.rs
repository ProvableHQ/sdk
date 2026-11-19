// Copyright (C) 2019-2026 Provable Inc.
// This file is part of the Provable SDK library.

// Licensed under the MIT License. See the LICENSE.md file in the project root
// or <https://opensource.org/licenses/MIT> for the full license text.

use crate::{
    literal_to_js_value,
    types::native::{IdentifierNative, PlaintextNative},
};

use indexmap::IndexMap;
use js_sys::{Array, Object, Reflect};
use wasm_bindgen::JsValue;

/// Insert a plaintext value into a javascript object.
pub fn insert_plaintext(js_object: &Object, key: &IdentifierNative, plaintext: &PlaintextNative) {
    match plaintext {
        PlaintextNative::Literal(literal, _) => {
            let js_value = literal_to_js_value(literal);
            Reflect::set(js_object, &key.to_string().into(), &js_value).unwrap();
        }
        PlaintextNative::Struct(struct_members, ..) => {
            let struct_object = struct_to_js_object(struct_members);
            Reflect::set(js_object, &key.to_string().into(), &struct_object.into()).unwrap();
        }
        PlaintextNative::Array(array, ..) => {
            let js_array = array.iter().map(plaintext_to_js_value).collect::<Array>();
            Reflect::set(js_object, &key.to_string().into(), &js_array.into()).unwrap();
        }
    }
}

/// Convert a plaintext to a javascript value.
pub fn plaintext_to_js_value(plaintext: &PlaintextNative) -> JsValue {
    match plaintext {
        PlaintextNative::Literal(literal, _) => literal_to_js_value(literal),
        PlaintextNative::Struct(struct_members, ..) => JsValue::from(struct_to_js_object(struct_members)),
        PlaintextNative::Array(array, ..) => {
            let js_array = array.iter().map(plaintext_to_js_value).collect::<Array>();
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
