// Copyright (C) 2019-2026 Provable Inc.
// This file is part of the Provable SDK library.

// Licensed under the MIT License. See the LICENSE.md file in the project root
// or <https://opensource.org/licenses/MIT> for the full license text.

/// Converts a JS array of wasm-bindgen exported structs from JsValues to their native Rust type
/// representation.
#[macro_export]
macro_rules! from_wasm_field_array {
    ($input:expr, $wasm_type:ident) => {{
        $input
            .iter()
            .map(|x| {
                $wasm_type::try_from_js_value(x).map(|x| *x).map_err(|_| "Input must be an array of fields".to_string())
            })
            .collect::<Result<Vec<FieldNative>, String>>()
    }};
}

/// Converts a JS array of wasm-bindgen exported structs from JsValues to their native Rust type
/// representation.
#[macro_export]
macro_rules! native_type_from_wasm_object_array {
    ($input:expr, $wasm_type:ident, $native_type:ident) => {{
        $input
            .iter()
            .map(|x| {
                $wasm_type::try_from_js_value(x).map(|x| *x).map_err(|_| "Input must be an array of fields".to_string())
            })
            .collect::<Result<Vec<$native_type>, String>>()
    }};
}

/// Converts an array of JS types to a vector of Rust analog types.
#[macro_export]
macro_rules! from_js_typed_array {
    ($input:expr, $method:ident, $_type:expr) => {{
        $input
            .iter()
            .map(|x| x.$method().ok_or_else(|| format!("Input must be a {} array", $_type)))
            .collect::<Result<Vec<bool>, String>>()
    }};
}

#[macro_export]
macro_rules! js_array_from_fields {
    ($input:expr) => {{
        let js_array = js_sys::Array::new();
        $input.iter().for_each(|field| {
            js_array.push(&wasm_bindgen::JsValue::from(Field::from(field)));
        });
        js_array
    }};
}
