// Copyright (C) 2019-2026 Provable Inc.
// This file is part of the Provable SDK library.

// Licensed under the MIT License. See the LICENSE.md file in the project root
// or <https://opensource.org/licenses/MIT> for the full license text.

use crate::types::native::LiteralNative;

use wasm_bindgen::JsValue;

/// Turn a literal into a javascript value.
pub fn literal_to_js_value(literal: &LiteralNative) -> JsValue {
    match literal {
        LiteralNative::Address(literal) => {
            let js_string = literal.to_string();
            (&js_string).into()
        }
        LiteralNative::Boolean(literal) => {
            let js_boolean = **literal;
            js_boolean.into()
        }
        LiteralNative::Field(field) => {
            let js_string = field.to_string();
            (&js_string).into()
        }
        LiteralNative::Group(group) => {
            let js_string = group.to_string();
            (&js_string).into()
        }
        LiteralNative::I8(literal) => {
            let js_number = **literal;
            js_number.into()
        }
        LiteralNative::I16(literal) => {
            let js_number = **literal;
            js_number.into()
        }
        LiteralNative::I32(literal) => {
            let js_number = **literal;
            js_number.into()
        }
        LiteralNative::I64(literal) => {
            let js_number = **literal;
            js_number.into()
        }
        LiteralNative::I128(literal) => {
            let js_number = **literal;
            js_number.into()
        }
        LiteralNative::U8(literal) => {
            let js_number = **literal;
            js_number.into()
        }
        LiteralNative::U16(literal) => {
            let js_number = **literal;
            js_number.into()
        }
        LiteralNative::U32(literal) => {
            let js_number = **literal;
            js_number.into()
        }
        LiteralNative::U64(literal) => {
            let js_number = **literal;
            js_number.into()
        }
        LiteralNative::U128(literal) => {
            let js_number = **literal;
            js_number.into()
        }
        LiteralNative::Scalar(literal) => {
            let js_string = literal.to_string();
            (&js_string).into()
        }
        LiteralNative::Signature(literal) => {
            let js_string = literal.to_string();
            (&js_string).into()
        }
        LiteralNative::String(literal) => (&**literal).into(),
        LiteralNative::Identifier(identifier) => {
            let js_string = identifier.to_string();
            (&js_string).into()
        }
    }
}
