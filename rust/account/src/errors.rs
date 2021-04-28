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

#[derive(Debug, Error)]
pub enum PrivateKeyError {
    #[error("{}: {}", _0, _1)]
    Crate(&'static str, String),
}

impl From<snarkvm_dpc::errors::AccountError> for PrivateKeyError {
    fn from(error: snarkvm_dpc::errors::AccountError) -> Self {
        PrivateKeyError::Crate("snarkvm_errors::objects::account", format!("{:?}", error))
    }
}

impl From<std::io::Error> for PrivateKeyError {
    fn from(error: std::io::Error) -> Self {
        PrivateKeyError::Crate("std::io", format!("{:?}", error))
    }
}

#[derive(Debug, Error)]
pub enum ViewKeyError {
    #[error("{}: {}", _0, _1)]
    Crate(&'static str, String),
}

impl From<snarkvm_dpc::errors::AccountError> for ViewKeyError {
    fn from(error: snarkvm_dpc::errors::AccountError) -> Self {
        ViewKeyError::Crate("snarkvm_errors::objects::account", format!("{:?}", error))
    }
}

impl From<snarkvm_algorithms::errors::SignatureError> for ViewKeyError {
    fn from(error: snarkvm_algorithms::errors::SignatureError) -> Self {
        ViewKeyError::Crate("snarkvm_errors::algorithms::signature", format!("{:?}", error))
    }
}

impl From<hex::FromHexError> for ViewKeyError {
    fn from(error: hex::FromHexError) -> Self {
        ViewKeyError::Crate("hex", format!("{:?}", error))
    }
}

impl From<std::io::Error> for ViewKeyError {
    fn from(error: std::io::Error) -> Self {
        ViewKeyError::Crate("std::io", format!("{:?}", error))
    }
}

#[derive(Debug, Error)]
pub enum AddressError {
    #[error("{}: {}", _0, _1)]
    Crate(&'static str, String),
}

impl From<snarkvm_dpc::errors::AccountError> for AddressError {
    fn from(error: snarkvm_dpc::errors::AccountError) -> Self {
        AddressError::Crate("snarkvm_errors::objects::account", format!("{:?}", error))
    }
}

impl From<snarkvm_algorithms::errors::SignatureError> for AddressError {
    fn from(error: snarkvm_algorithms::errors::SignatureError) -> Self {
        AddressError::Crate("snarkvm_errors::algorithms::signature", format!("{:?}", error))
    }
}

impl From<std::io::Error> for AddressError {
    fn from(error: std::io::Error) -> Self {
        AddressError::Crate("std::io", format!("{:?}", error))
    }
}
