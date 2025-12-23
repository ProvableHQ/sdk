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

use crate::{Field, Group, Scalar, from_js_typed_array, types::native::ECDSA6Native};
use snarkvm_console::algorithms::{Commit, CommitUncompressed, Hash, HashUncompressed};

use js_sys::Array;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct ECDSASignature(ECDSASignatureNative);

#[wasm_bindgen]
impl ECDSASignature {
    #[wasm_bindgen(js_name = recoveryId)]
    pub fn recovery_id(&self) -> u8 {
        self.0.recovery_id()
    }
    
    #[wasm_bindgen]
    pub fn sign(r: &[u8], s: &[u8]) -> ECDSASignature {

    }

    #[wasm_bindgen]
    pub fn r(&self) -> Array {
        self.0.r.to_js_typed_array()
    }

    #[wasm_bindgen]
    pub fn s(&self) -> Array {
        self.0.s.to_js_typed_array()
    }
}