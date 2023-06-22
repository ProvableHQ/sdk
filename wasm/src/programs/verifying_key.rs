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

use crate::types::{FromBytes, ToBytes, VerifyingKeyNative};

use wasm_bindgen::prelude::wasm_bindgen;

use std::ops::Deref;

#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct VerifyingKey(VerifyingKeyNative);

#[wasm_bindgen]
impl VerifyingKey {
    /// Construct a new verifying key from a byte array
    #[wasm_bindgen(js_name = "fromBytes")]
    pub fn from_bytes(bytes: &[u8]) -> Result<VerifyingKey, String> {
        Ok(Self(VerifyingKeyNative::from_bytes_le(bytes).map_err(|e| e.to_string())?))
    }

    /// Create a byte array from a verifying key
    #[wasm_bindgen(js_name = "toBytes")]
    pub fn to_bytes(&self) -> Result<Vec<u8>, String> {
        self.0.to_bytes_le().map_err(|_| "Failed to serialize verifying key".to_string())
    }
}

impl Deref for VerifyingKey {
    type Target = VerifyingKeyNative;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl From<VerifyingKey> for VerifyingKeyNative {
    fn from(verifying_key: VerifyingKey) -> VerifyingKeyNative {
        verifying_key.0
    }
}

impl From<VerifyingKeyNative> for VerifyingKey {
    fn from(verifying_key: VerifyingKeyNative) -> VerifyingKey {
        VerifyingKey(verifying_key)
    }
}

impl PartialEq for VerifyingKey {
    fn eq(&self, other: &Self) -> bool {
        *self.0 == *other.0
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use wasm_bindgen_test::*;

    const FEE_VERIFIER_URL: &str = "https://testnet3.parameters.aleo.org/fee.verifier.2de311b";

    #[wasm_bindgen_test]
    async fn test_verifying_key_roundtrip() {
        let fee_verifying_key_bytes = reqwest::get(FEE_VERIFIER_URL).await.unwrap().bytes().await.unwrap().to_vec();
        let fee_verifying_key = VerifyingKey::from_bytes(&fee_verifying_key_bytes).unwrap();
        let bytes = fee_verifying_key.to_bytes().unwrap();
        assert_eq!(bytes, fee_verifying_key_bytes);
    }
}
