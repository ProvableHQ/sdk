// Copyright (C) 2019-2021 Aleo Systems Inc.
// This file is part of the Aleo library.

// The Aleo library is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// The Aleo library is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with the Aleo library. If not, see <https://www.gnu.org/licenses/>.

use aleo_account::RecordPlaintext as RecordPlaintextNative;

use std::{ops::Deref, str::FromStr};
use wasm_bindgen::prelude::*;

/// Aleo record plaintext
#[wasm_bindgen]
#[derive(Clone)]
pub struct RecordPlaintext(RecordPlaintextNative);

#[wasm_bindgen]
impl RecordPlaintext {
    /// Return a record plaintext from a string.
    pub fn from_string(record: &str) -> Result<RecordPlaintext, String> {
        Self::from_str(record).map_err(|_| "The record plaintext string provided was invalid".into())
    }

    /// Returns the record plaintext string
    #[allow(clippy::inherent_to_string)]
    pub fn to_string(&self) -> String {
        self.0.to_string()
    }

    /// Returns the amount of gates in the record
    pub fn gates(&self) -> u64 {
        ***self.0.gates()
    }
}

impl From<RecordPlaintextNative> for RecordPlaintext {
    fn from(record: RecordPlaintextNative) -> Self {
        Self(record)
    }
}

impl FromStr for RecordPlaintext {
    type Err = anyhow::Error;

    fn from_str(plaintext: &str) -> Result<Self, Self::Err> {
        Ok(Self(RecordPlaintextNative::from_str(plaintext)?))
    }
}

impl Deref for RecordPlaintext {
    type Target = RecordPlaintextNative;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    use wasm_bindgen_test::wasm_bindgen_test;

    const RECORD: &str = "{ owner: aleo1d5hg2z3ma00382pngntdp68e74zv54jdxy249qhaujhks9c72yrs33ddah.private, gates: 99u64.public, _nonce: 0group.public }";

    #[wasm_bindgen_test]
    fn test_to_and_from_string() {
        let expected_string = "{\n  owner: aleo1d5hg2z3ma00382pngntdp68e74zv54jdxy249qhaujhks9c72yrs33ddah.private,\n  gates: 99u64.public,\n  _nonce: 0group.public\n}";
        let record = RecordPlaintext::from_string(RECORD).unwrap();
        assert_eq!(record.to_string(), expected_string);

        // Ensure we can ingest strings with newlines properly
        let record2 = RecordPlaintext::from_string(expected_string).unwrap();
        assert_eq!(record2.to_string(), expected_string);
    }

    #[wasm_bindgen_test]
    fn test_gates_from_string() {
        let record = RecordPlaintext::from_string(RECORD).unwrap();
        assert_eq!(record.gates(), 99);
    }

    #[wasm_bindgen_test]
    fn test_bad_inputs_to_from_string() {
        let invalid_bech32 = "{ owner: aleo2d5hg2z3ma00382pngntdp68e74zv54jdxy249qhaujhks9c72yrs33ddah.private, gates: 99u64.public, _nonce: 0group.public }";
        assert_eq!(
            RecordPlaintext::from_string("string").err(),
            Some("The plaintext record string provided was invalid".into())
        );
        assert!(RecordPlaintext::from_string(invalid_bech32).is_err());
    }
}
