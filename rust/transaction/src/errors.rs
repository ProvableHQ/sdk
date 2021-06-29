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
use aleo_account::{AddressError, PrivateKeyError};

use snarkvm_algorithms::{CRHError, SNARKError, SignatureError};
use snarkvm_dpc::{AccountError, DPCError, TransactionError as DPCTransactionError};

use anyhow::Error as AnyhowError;
use hex::FromHexError;

#[derive(Debug, Error)]
pub enum TransactionError {
    #[error("{}", _0)]
    AccountError(#[from] AccountError),

    #[error("{}", 0)]
    AddressError(#[from] AddressError),

    #[error("{}", _0)]
    AnyhowError(#[from] AnyhowError),

    #[error("Failed to build Transaction data type. See console logs for error")]
    BuilderError,

    #[error("{}: {}", _0, _1)]
    Crate(&'static str, String),

    #[error("{}", _0)]
    CRHError(#[from] CRHError),

    #[error("{}", _0)]
    DPCError(#[from] DPCError),

    #[error("{}", _0)]
    DPCTransactionError(#[from] DPCTransactionError),

    #[error("Attempted to set transaction builder argument twice: {} ", _0)]
    DuplicateArgument(String),

    #[error("{}", _0)]
    FromHexError(#[from] FromHexError),

    #[error("Attempted to pass invalid transaction builder argument: {}", _0)]
    InvalidArgument(String),

    #[error("Invalid number of inputs. (Current: {}, Max: {})", _0, _1)]
    InvalidNumberOfInputs(usize, usize),

    #[error("Invalid number of outputs. (Current: {}, Max: {})", _0, _1)]
    InvalidNumberOfOutputs(usize, usize),

    #[error("Invalid number of old death program proofs. (Current: {}, Max: {})", _0, _1)]
    InvalidNumberOfInputProofs(usize, usize),

    #[error("Invalid number of new birth program proofs. (Current: {}, Max: {})", _0, _1)]
    InvalidNumberOfOutputProofs(usize, usize),

    #[error("Transaction proof did not verify")]
    InvalidProof,

    #[error("Transaction signature did not verify")]
    InvalidSignature,

    #[error("Missing Transaction field: {}", _0)]
    MissingField(String),

    #[error("Missing transaction outputs)")]
    MissingOutputs,

    #[error("{}", _0)]
    PrivateKeyError(#[from] PrivateKeyError),

    #[error("{}", _0)]
    SignatureError(#[from] SignatureError),

    #[error("{}", _0)]
    SNARKError(#[from] SNARKError),
}

impl From<std::io::Error> for TransactionError {
    fn from(error: std::io::Error) -> Self {
        TransactionError::Crate("std::io", format!("{:?}", error))
    }
}
