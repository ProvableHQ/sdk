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

use crate::types::FeeNative;

use std::ops::Deref;
use wasm_bindgen::prelude::wasm_bindgen;

/// Webassembly Representation of an Aleo function fee execution response
///
/// This object is returned by the execution of the `fee` function in credits.aleo. If a fee is
/// specified when attempting to create an on-chain program execution transaction, this will be
/// required as part of the transaction. However, it can be executed in parallel to execution of
/// main program in separate web workers prior to creation of the transaction.
#[wasm_bindgen]
pub struct FeeExecution(FeeNative);

#[wasm_bindgen]
impl FeeExecution {
    /// Get the amount of the fee
    pub fn fee(&self) -> Result<u64, String> {
        Ok(*self.0.amount().map_err(|e| e.to_string())?)
    }
}

impl Deref for FeeExecution {
    type Target = FeeNative;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl From<FeeNative> for FeeExecution {
    fn from(value: FeeNative) -> Self {
        Self(value)
    }
}

impl From<FeeExecution> for FeeNative {
    fn from(response: FeeExecution) -> Self {
        response.0
    }
}
