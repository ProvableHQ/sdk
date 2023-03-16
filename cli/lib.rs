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

#![forbid(unsafe_code)]

#[cfg(not(feature = "wasm"))]
#[macro_use]
extern crate thiserror;

#[cfg(not(feature = "wasm"))]
pub mod commands;
#[cfg(not(feature = "wasm"))]
pub mod errors;
#[cfg(not(feature = "wasm"))]
pub mod helpers;

#[cfg(not(feature = "wasm"))]
pub type CurrentNetwork = snarkvm::prelude::Testnet3;
#[cfg(not(feature = "wasm"))]
pub type Aleo = snarkvm::circuit::AleoV0;
