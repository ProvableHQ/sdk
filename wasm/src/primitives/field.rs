// Copyright (C) 2019-2023 Aleo Systems Inc.
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

use crate::types::FieldNative;
use std::str::FromStr;

use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

/// Aleo field element
#[wasm_bindgen]
#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
pub struct Field(FieldNative);

#[wasm_bindgen]
impl Field {
    /// Creates a field element from a string
    #[wasm_bindgen(js_name = fromString)]
    pub fn from_string(field: &str) -> Result<Field, String> {
        Self::from_str(field).map_err(|_| "The field element provided was invalid".to_string())
    }

    /// Return the field element as a string
    #[allow(clippy::inherent_to_string)]
    #[wasm_bindgen(js_name = toString)]
    pub fn to_string(&self) -> String {
        self.0.to_string()
    }
}

impl From<FieldNative> for Field {
    fn from(field: FieldNative) -> Self {
        Self(field)
    }
}

impl FromStr for Field {
    type Err = ();

    fn from_str(field: &str) -> Result<Self, Self::Err> {
        Ok(Self(FieldNative::from_str(field).map_err(|_| ())?))
    }
}
