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

use crate::types::{FromBytes, ProvingKeyNative, ToBytes};

use std::ops::Deref;
use wasm_bindgen::prelude::wasm_bindgen;

#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct ProvingKey(ProvingKeyNative);

#[wasm_bindgen]
impl ProvingKey {
    /// Construct a new proving key from a byte array
    #[wasm_bindgen(js_name = "fromBytes")]
    pub fn from_bytes(bytes: &[u8]) -> Result<ProvingKey, String> {
        Ok(Self(ProvingKeyNative::from_bytes_le(bytes).map_err(|e| e.to_string())?))
    }

    /// Create a byte array from a proving key
    #[wasm_bindgen(js_name = "toBytes")]
    pub fn to_bytes(&self) -> Result<Vec<u8>, String> {
        self.0.to_bytes_le().map_err(|_| "Failed to serialize proving key".to_string())
    }
}

impl Deref for ProvingKey {
    type Target = ProvingKeyNative;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl From<ProvingKey> for ProvingKeyNative {
    fn from(proving_key: ProvingKey) -> ProvingKeyNative {
        proving_key.0
    }
}

impl From<ProvingKeyNative> for ProvingKey {
    fn from(proving_key: ProvingKeyNative) -> ProvingKey {
        ProvingKey(proving_key)
    }
}
