// Copyright (C) 2019-2025 Provable Inc.
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

/// Converts a JS array of wasm-bindgen exported structs from JsValues to their native Rust type
/// representation.
#[macro_export]
macro_rules! from_wasm_object_array {
    ($input:expr, $wasm_type:ident) => {{
        $input
            .to_vec()
            .into_iter()
            .map(|x| {
                $wasm_type::try_from_js_value(x).map(|x| *x).map_err(|_| "Input must be an array of fields".to_string())
            })
            .collect::<Result<Vec<FieldNative>, String>>()
    }};
}

/// Converts an array of JS types to a vector of Rust analog types.
#[macro_export]
macro_rules! from_js_typed_array {
    ($input:expr, $method:ident, $_type:expr) => {{
        $input
            .to_vec()
            .iter()
            .map(|x| x.$method().ok_or_else(|| format!("Input must be a {} array", $_type)))
            .collect::<Result<Vec<bool>, String>>()
    }};
}
