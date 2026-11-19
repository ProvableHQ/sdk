// Copyright (C) 2019-2026 Provable Inc.
// This file is part of the Provable SDK library.

// Licensed under the MIT License. See the LICENSE.md file in the project root
// or <https://opensource.org/licenses/MIT> for the full license text.

#[macro_export]
macro_rules! to_bits_array_le {
    ($self:expr) => {{ $self.0.to_bits_le().iter().map(|x| wasm_bindgen::JsValue::from_bool(*x)).collect::<js_sys::Array>() }};
}
