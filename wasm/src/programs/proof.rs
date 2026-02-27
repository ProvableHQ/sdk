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

use crate::types::native::ProofNative;
use snarkvm_wasm::utilities::{FromBytes, ToBytes};

use std::{ops::Deref, str::FromStr};
use wasm_bindgen::prelude::wasm_bindgen;

/// SNARK proof for verification of program execution
#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct Proof(ProofNative);

#[wasm_bindgen]
impl Proof {
    /// Construct a new proof from a byte array
    ///
    /// @param {Uint8Array} bytes Byte array representation of a proof
    /// @returns {Proof}
    #[wasm_bindgen(js_name = "fromBytes")]
    pub fn from_bytes(bytes: &[u8]) -> Result<Proof, String> {
        Ok(Self(ProofNative::from_bytes_le(bytes).map_err(|e| e.to_string())?))
    }

    /// Create a proof from string
    ///
    /// @param {string} string String representation of the proof
    /// @returns {Proof}
    #[wasm_bindgen(js_name = "fromString")]
    pub fn from_string(string: &str) -> Result<Proof, String> {
        Ok(Self(ProofNative::from_str(string).map_err(|e| e.to_string())?))
    }

    /// Return the byte representation of a proof
    ///
    /// @returns {Uint8Array} Byte array representation of a proof
    #[wasm_bindgen(js_name = "toBytes")]
    pub fn to_bytes(&self) -> Result<Vec<u8>, String> {
        self.0.to_bytes_le().map_err(|_| "Failed to serialize proof".to_string())
    }

    /// Get a string representation of the proof
    ///
    /// @returns {string} String representation of the proof
    #[wasm_bindgen(js_name = "toString")]
    #[allow(clippy::inherent_to_string)]
    pub fn to_string(&self) -> String {
        self.0.to_string()
    }
}

impl Deref for Proof {
    type Target = ProofNative;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl From<Proof> for ProofNative {
    fn from(proof: Proof) -> ProofNative {
        proof.0
    }
}

impl From<ProofNative> for Proof {
    fn from(proof: ProofNative) -> Proof {
        Proof(proof)
    }
}

impl PartialEq for Proof {
    fn eq(&self, other: &Self) -> bool {
        *self.0 == *other.0
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_proof_from_invalid_string() {
        let result = Proof::from_string("invalid_proof_string");
        assert!(result.is_err());
    }

    #[test]
    fn test_proof_from_invalid_bytes() {
        let result = Proof::from_bytes(&[0u8; 10]);
        assert!(result.is_err());
    }
}
