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

use hex::FromHexError;

use snarkvm_dpc::errors::{AccountError, RecordError as AleoRecordError};

#[derive(Debug, Error)]
pub enum RecordError {
    #[error("{}", _0)]
    AccountError(#[from] AccountError),

    #[error("{}", _0)]
    AleoRecordError(#[from] AleoRecordError),

    #[error("Failed to build Record data type. See console logs for error")]
    BuilderError,

    #[error("{}: {}", _0, _1)]
    Crate(&'static str, String),

    #[error("Attempted to set record builder argument {} twice", _0)]
    DuplicateArgument(String),

    #[error("{}", _0)]
    FromHexError(#[from] FromHexError),

    #[error("Attempted to build a record with an invalid commitment. Try `calculate_commitment()`")]
    InvalidCommitment,

    #[error("Missing Record field: {0}")]
    MissingField(String),

    #[error("Missing commitment randomness")]
    MissingRandomness,
}

impl From<std::io::Error> for RecordError {
    fn from(error: std::io::Error) -> Self {
        RecordError::Crate("std::io", format!("{:?}", error))
    }
}
