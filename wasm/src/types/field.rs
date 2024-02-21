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

use crate::types::native::FieldNative;

use wasm_bindgen::prelude::wasm_bindgen;

use std::str::FromStr;

#[wasm_bindgen]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Field(FieldNative);

#[wasm_bindgen]
impl Field {
    #[wasm_bindgen(js_name = "toString")]
    #[allow(clippy::inherent_to_string)]
    pub fn to_string(&self) -> String {
        self.0.to_string()
    }

    #[wasm_bindgen(js_name = "fromString")]
    pub fn from_string(field: &str) -> Result<Field, String> {
        Ok(Self(FieldNative::from_str(field).map_err(|e| e.to_string())?))
    }
}

impl From<FieldNative> for Field {
    fn from(native: FieldNative) -> Self {
        Self(native)
    }
}

impl From<Field> for FieldNative {
    fn from(field: Field) -> Self {
        field.0
    }
}
