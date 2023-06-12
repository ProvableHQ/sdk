// Copyright (C) 2019-2023 Aleo Systems Inc.
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

use super::*;

pub mod state;
pub use state::*;

pub mod records;
pub use records::*;

/// Transfer Type to Perform
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum TransferType {
    /// Private credit transfer done via records associated with the account
    Private,
    /// Transfer credits from a record to the public account mapping for an Aleo account
    PrivateToPublic,
    /// Public credit transfer done via the account mapping
    Public,
    /// Transfer credits from the public account mapping to a record for an Aleo account
    PublicToPrivate,
}
