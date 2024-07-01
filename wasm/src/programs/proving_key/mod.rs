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

mod credits;

use crate::types::native::{FromBytes, ProvingKeyNative, ToBytes};

use sha2::Digest;
use wasm_bindgen::prelude::wasm_bindgen;

use std::{ops::Deref, str::FromStr};

/// Proving key for a function within an Aleo program
#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct ProvingKey(ProvingKeyNative);

#[wasm_bindgen]
impl ProvingKey {
    /// Return the checksum of the proving key
    ///
    /// @returns {string} Checksum of the proving key
    pub fn checksum(&self) -> String {
        hex::encode(sha2::Sha256::digest(self.to_bytes().unwrap()))
    }

    /// Create a copy of the proving key
    ///
    /// @returns {ProvingKey} A copy of the proving key
    #[wasm_bindgen]
    pub fn copy(&self) -> ProvingKey {
        self.0.clone().into()
    }

    /// Construct a new proving key from a byte array
    ///
    /// @param {Uint8Array} bytes Byte array representation of a proving key
    /// @returns {ProvingKey | Error}
    #[wasm_bindgen(js_name = "fromBytes")]
    pub fn from_bytes(bytes: &[u8]) -> Result<ProvingKey, String> {
        Ok(Self(ProvingKeyNative::from_bytes_le(bytes).map_err(|e| e.to_string())?))
    }

    /// Create a proving key from string
    ///
    /// @param {string | Error} String representation of the proving key
    #[wasm_bindgen(js_name = "fromString")]
    pub fn from_string(string: &str) -> Result<ProvingKey, String> {
        Ok(Self(ProvingKeyNative::from_str(string).map_err(|e| e.to_string())?))
    }

    /// Return the byte representation of a proving key
    ///
    /// @returns {Uint8Array | Error} Byte array representation of a proving key
    #[wasm_bindgen(js_name = "toBytes")]
    pub fn to_bytes(&self) -> Result<Vec<u8>, String> {
        self.0.to_bytes_le().map_err(|_| "Failed to serialize proving key".to_string())
    }

    /// Get a string representation of the proving key
    ///
    /// @returns {string} String representation of the proving key
    #[wasm_bindgen(js_name = "toString")]
    #[allow(clippy::inherent_to_string)]
    pub fn to_string(&self) -> String {
        format!("{:?}", self.0)
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

impl PartialEq for ProvingKey {
    fn eq(&self, other: &Self) -> bool {
        *self.0 == *other.0
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::Metadata;
    use wasm_bindgen_test::*;

    #[wasm_bindgen_test]
    async fn test_proving_key() {
        let transer_public_prover = Metadata::transfer_public().prover;

        let bytes = reqwest::get(transer_public_prover).await.unwrap().bytes().await.unwrap().to_vec();
        let key = ProvingKey::from_bytes(&bytes).unwrap();

        let to_bytes = key.to_bytes().unwrap();
        assert_eq!(bytes, to_bytes);

        let transfer_public_proving_key_string = key.to_string();
        let transfer_public_proving_key_from_string =
            ProvingKey::from_string(&transfer_public_proving_key_string).unwrap();
        assert_eq!(key, transfer_public_proving_key_from_string);

        let transfer_public_proving_key_checksum = key.checksum();
        assert_eq!(
            transfer_public_proving_key_checksum,
            "846f86cabf9fa50e5abe347e559a8e9f3018459b5af9fdf52f1c44892b05f7e5"
        );
    }
}
