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

use crate::CurrentNetwork;
use snarkvm::{
    console::program::Ciphertext,
    prelude::{Address, PrivateKey, ViewKey},
};

use aleo_rust::TransferType;
use serde::{Deserialize, Serialize};

/// Serialization model for writing Aleo key material to disk
#[derive(Debug, Serialize, Deserialize)]
pub struct AccountModel {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub private_key_ciphertext: Option<Ciphertext<CurrentNetwork>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub private_key: Option<PrivateKey<CurrentNetwork>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub view_key: Option<ViewKey<CurrentNetwork>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub address: Option<Address<CurrentNetwork>>,
}

/// Transfer Type to Perform
#[derive(Debug, Clone, PartialEq, Eq, clap::ValueEnum)]
pub enum TransferTypeArg {
    /// Private credit transfer done via records associated with the account
    Private,
    /// Transfer credits from a record to the public account mapping for an Aleo account
    PrivateToPublic,
    /// Public credit transfer done via the account mapping
    Public,
    /// Transfer credits from the public account mapping to a record for an Aleo account
    PublicToPrivate,
}

impl From<TransferTypeArg> for TransferType {
    fn from(arg: TransferTypeArg) -> Self {
        match arg {
            TransferTypeArg::Public => TransferType::Public,
            TransferTypeArg::Private => TransferType::Private,
            TransferTypeArg::PublicToPrivate => TransferType::PublicToPrivate,
            TransferTypeArg::PrivateToPublic => TransferType::PrivateToPublic,
        }
    }
}
