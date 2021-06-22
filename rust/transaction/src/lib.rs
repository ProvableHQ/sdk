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

#[macro_use]
extern crate derivative;

#[macro_use]
extern crate thiserror;

pub mod empty_ledger;
pub use empty_ledger::*;

pub mod errors;
pub use errors::*;

pub mod transaction;
pub use transaction::*;

pub mod transaction_builder;
pub use transaction_builder::*;

#[cfg(test)]
mod tests;
