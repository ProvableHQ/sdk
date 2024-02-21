// Copyright (C) 2019-2024 Aleo Systems Inc.
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

use crate::{ProvingKey, VerifyingKey};

use crate::types::native::{ProvingKeyNative, VerifyingKeyNative};
use wasm_bindgen::prelude::wasm_bindgen;

/// Key pair object containing both the function proving and verifying keys
#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct KeyPair {
    proving_key: Option<ProvingKey>,
    verifying_key: Option<VerifyingKey>,
}

#[wasm_bindgen]
impl KeyPair {
    /// Create new key pair from proving and verifying keys
    ///
    /// @param {ProvingKey} proving_key Proving key corresponding to a function in an Aleo program
    /// @param {VerifyingKey} verifying_key Verifying key corresponding to a function in an Aleo program
    /// @returns {KeyPair} Key pair object containing both the function proving and verifying keys
    #[wasm_bindgen(constructor)]
    pub fn new(proving_key: ProvingKey, verifying_key: VerifyingKey) -> KeyPair {
        KeyPair { proving_key: Some(proving_key), verifying_key: Some(verifying_key) }
    }

    /// Get the proving key. This method will remove the proving key from the key pair
    ///
    /// @returns {ProvingKey | Error}
    #[wasm_bindgen(js_name = "provingKey")]
    pub fn proving_key(&mut self) -> Result<ProvingKey, String> {
        self.proving_key.take().ok_or("Proving key has already been removed".to_string())
    }

    /// Get the verifying key. This method will remove the verifying key from the key pair
    ///
    /// @returns {VerifyingKey | Error}
    #[wasm_bindgen(js_name = "verifyingKey")]
    pub fn verifying_key(&mut self) -> Result<VerifyingKey, String> {
        self.verifying_key.take().ok_or("Proving key has already been removed".to_string())
    }
}

impl From<(ProvingKeyNative, VerifyingKeyNative)> for KeyPair {
    fn from((proving_key, verifying_key): (ProvingKeyNative, VerifyingKeyNative)) -> Self {
        Self::new(proving_key.into(), verifying_key.into())
    }
}
