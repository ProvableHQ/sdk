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

pub mod deploy;
pub use deploy::*;

pub mod execute;
pub use execute::*;

pub mod join;
pub use join::*;

pub mod split;
pub use split::*;

pub mod transfer;
pub use transfer::*;

pub mod utils;

use crate::types::CurrentNetwork;

use snarkvm_synthesizer::{ProvingKey, VerifyingKey};

use indexmap::IndexMap;
use wasm_bindgen::prelude::wasm_bindgen;

#[wasm_bindgen]
#[derive(Clone)]
pub struct ProgramManager {
    proving_key_cache: IndexMap<String, ProvingKey<CurrentNetwork>>,
    verifying_key_cache: IndexMap<String, VerifyingKey<CurrentNetwork>>,
}

#[wasm_bindgen]
impl ProgramManager {
    #[wasm_bindgen]
    pub fn new() -> Self {
        Self { proving_key_cache: IndexMap::new(), verifying_key_cache: IndexMap::new() }
    }
}

impl Default for ProgramManager {
    fn default() -> Self {
        Self::new()
    }
}
