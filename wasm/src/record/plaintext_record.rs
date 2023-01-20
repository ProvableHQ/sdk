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

use aleo_account::{PlainTextRecord as PlainTextRecordNative};

use std::{ops::Deref, str::FromStr};
use wasm_bindgen::prelude::*;

/// Aleo plaintext record
#[wasm_bindgen]
#[derive(Clone)]
pub struct PlainTextRecord(PlainTextRecordNative);

#[wasm_bindgen]
impl PlainTextRecord {
    /// Create a plaintext record object from a string
    pub fn from_string(record: &str) -> Self {
        Self::from_str(record).unwrap()
    }

    /// Get a string representation of the record
    #[allow(clippy::inherent_to_string)]
    pub fn to_string(&self) -> String {
        self.0.to_string()
    }

    /// Get the amount of gates in the record
    pub fn gates(&self) -> u64 {
        ***self.0.gates()
    }
}

impl From<PlainTextRecordNative> for PlainTextRecord {
    fn from(record: PlainTextRecordNative) -> Self {
        Self(record)
    }
}

impl FromStr for PlainTextRecord {
    type Err = anyhow::Error;

    fn from_str(plaintext: &str) -> Result<Self, Self::Err> {
        Ok(Self(PlainTextRecordNative::from_str(plaintext)?))
    }
}

impl Deref for PlainTextRecord {
    type Target = PlainTextRecordNative;

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
        let record = PlainTextRecord::from_string(RECORD);
        assert_eq!(record.to_string().replace("\n ", "").replace("\n", " "), RECORD); // <-- Will fix before PR is set to ready
    }

    #[wasm_bindgen_test]
    fn test_gates_from_string() {
        let given = "{ owner: aleo1d5hg2z3ma00382pngntdp68e74zv54jdxy249qhaujhks9c72yrs33ddah.private, gates: 99u64.public, _nonce: 0group.public }";
        let record = PlainTextRecord::from_string(given);
        assert_eq!(record.gates(), 99);
    }
}
