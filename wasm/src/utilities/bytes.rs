// Copyright (C) 2019-2025 Provable Inc.
// This file is part of the Provable SDK library.

// The Provable SDK library is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// The Provable SDK library is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with the Provable SDK library. If not, see <https://www.gnu.org/licenses/>.

use wasm_bindgen::prelude::*;
use js_sys::{Array, Uint8Array};

#[wasm_bindgen]
pub fn bytes_from_bits_le(bits: Array) -> Uint8Array {
    let bit_len = bits.length() as usize;
    let byte_len = (bit_len + 7) / 8;

    // We'll accumulate bytes in a JS Array first
    let bytes = Array::new();

    let mut current_byte: u8 = 0;
    let mut bit_index: u8 = 0;

    for i in 0..bit_len {
        let bit = bits.get(i as u32).as_bool().unwrap_or(false);

        if bit {
            current_byte |= 1 << bit_index;
        }

        bit_index += 1;

        if bit_index == 8 {
            bytes.push(&JsValue::from(current_byte));
            current_byte = 0;
            bit_index = 0;
        }
    }

    // Handle trailing bits
    if bit_index != 0 {
        bytes.push(&JsValue::from(current_byte));
    }

    // Convert JS Array → Uint8Array
    let output = Uint8Array::new_with_length(bytes.length());
    for i in 0..bytes.length() {
        output.set_index(i, bytes.get(i).as_f64().unwrap() as u8);
    }

    output
}
