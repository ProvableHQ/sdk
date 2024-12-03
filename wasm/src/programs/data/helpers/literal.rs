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
        LiteralNative::String(literal) => {
            let js_string = literal.to_string();
            (&js_string).into()
        }
    }
}
