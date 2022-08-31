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

#![forbid(unsafe_code)]
#![allow(clippy::assertions_on_result_states)]

#[macro_use]
extern crate thiserror;

use lazy_static::lazy_static;

lazy_static! {
    static ref EXPLORER_URL: String = std::env::var("EXPLORER_URL").unwrap_or("https://www.aleo.network".to_string());
    static ref DEPLOY_URL: String = format!("{}/testnet3/deploy", crate::EXPLORER_URL.to_string());
}

pub mod commands;
pub mod errors;
pub mod helpers;

pub(crate) type Network = snarkvm::prelude::Testnet3;
pub(crate) type Aleo = snarkvm::circuit::AleoV0;
