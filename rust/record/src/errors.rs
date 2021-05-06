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
use aleo_account::{AddressError, PrivateKeyError, ViewKeyError};
use snarkvm_dpc::DPCError;

#[derive(Debug, Error)]
pub enum RecordError {
    #[error("{}", _0)]
    AddressError(#[from] AddressError),

    #[error("{}: {}", _0, _1)]
    Crate(&'static str, String),

    #[error("{}", _0)]
    DPCError(#[from] DPCError),

    #[error("{}", _0)]
    PrivateKeyError(#[from] PrivateKeyError),

    #[error("{}", _0)]
    ViewKeyError(#[from] ViewKeyError),
}

impl From<std::io::Error> for RecordError {
    fn from(error: std::io::Error) -> Self {
        RecordError::Crate("std::io", format!("{:?}", error))
    }
}
