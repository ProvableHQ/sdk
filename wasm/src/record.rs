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

use aleo_record::Record as RecordNative;

use rand::{rngs::StdRng, SeedableRng};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Record {
    pub(crate) record: RecordNative,
}

#[wasm_bindgen]
impl Record {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        let rng = &mut StdRng::from_entropy();
        let record = RecordNative::new(rng);

        Self { record }
    }

    #[wasm_bindgen]
    pub fn to_string(&self) -> String {
        self.record.to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    use wasm_bindgen_test::*;

    #[wasm_bindgen_test]
    pub fn new_test() {
        let _dummy_record = Record::new();
    }
}
