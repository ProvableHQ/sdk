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

use snarkvm_algorithms::{CRHError, CommitmentError, EncryptionError};
use snarkvm_dpc::{AccountError, DPCError};

use hex::FromHexError;

#[derive(Debug, Error)]
pub enum RecordError {
    #[error("{}", _0)]
    AccountError(#[from] AccountError),

    #[error("{}", _0)]
    AddressError(#[from] AddressError),

    #[error("Failed to build Record data type. See console logs for error")]
    BuilderError,

    #[error("Cannot verify the provided record commitment")]
    CannotVerifyCommitment,

    #[error("{}", _0)]
    CommitmentError(#[from] CommitmentError),

    #[error("{}: {}", _0, _1)]
    Crate(&'static str, String),

    #[error("{}", _0)]
    CRHError(#[from] CRHError),

    #[error("{}", _0)]
    DPCError(#[from] DPCError),

    #[error("Attempted to set `value: {}` on a dummy record", _0)]
    DummyMustBeZero(u64),

    #[error("Attempted to set record builder argument {} twice", _0)]
    DuplicateArgument(String),

    #[error("{}", _0)]
    EncryptionError(#[from] EncryptionError),

    #[error("{}", _0)]
    FromHexError(#[from] FromHexError),

    #[error("Attempted to build a record with an invalid commitment. Try `calculate_commitment()`")]
    InvalidCommitment,

    #[error("invalid private key for the record")]
    InvalidPrivateKey,

    #[error("Missing Record field: {}", _0)]
    MissingField(String),

    #[error("Missing commitment randomness")]
    MissingRandomness,

    #[error("Attempted to set `is_dummy: true` on a record with a non-zero value")]
    NonZeroValue,

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

#[derive(Debug, Error)]
pub enum EncodedRecordError {
    #[error("{}: {}", _0, _1)]
    Crate(&'static str, String),

    #[error("{}", _0)]
    DPCError(#[from] DPCError),
}

#[derive(Debug, Error)]
pub enum EncryptedRecordError {
    #[error("{}: {}", _0, _1)]
    Crate(&'static str, String),

    #[error("{}", _0)]
    DPCError(#[from] DPCError),

    #[error("{}", _0)]
    FromHexError(#[from] FromHexError),
}

impl From<std::io::Error> for EncryptedRecordError {
    fn from(error: std::io::Error) -> Self {
        EncryptedRecordError::Crate("std::io", format!("{:?}", error))
    }
}
