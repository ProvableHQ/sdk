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
use crate::AccountError;
use aleo_network::Network;

use rand::{CryptoRng, Rng};
use snarkvm_dpc::{
    Account as AleoAccount,
    AccountScheme,
    Address as AleoAddress,
    ComputeKey as AleoComputeKey,
    PrivateKey as AleoPrivateKey,
    ViewKey as AleoViewKey,
};
use std::{convert::TryFrom, fmt, str::FromStr};

#[derive(Derivative)]
#[derivative(Clone(bound = "N: Network"), Debug(bound = "N: Network"))]
pub struct Account<N: Network> {
    pub account: AleoAccount<N::Parameters>,
}

impl<N: Network> Account<N> {
    pub fn new<R: Rng + CryptoRng>(rng: &mut R) -> Result<Self, AccountError> {
        Ok(Self {
            account: AleoAccount::new(rng)?,
        })
    }

    pub fn from_private_key(private_key: AleoPrivateKey<N::Parameters>) -> Result<Self, AccountError> {
        Ok(Self {
            account: AleoAccount::<N::Parameters>::try_from(private_key)?,
        })
    }

    pub fn private_key(&self) -> &AleoPrivateKey<N::Parameters> {
        self.account.private_key()
    }

    pub fn compute_key(&self) -> &AleoComputeKey<N::Parameters> {
        self.account.compute_key()
    }

    pub fn view_key(&self) -> &AleoViewKey<N::Parameters> {
        &self.account.view_key
    }

    pub fn address(&self) -> &AleoAddress<N::Parameters> {
        &self.account.address
    }
}

impl<N: Network> FromStr for Account<N> {
    type Err = AccountError;

    fn from_str(private_key: &str) -> Result<Self, Self::Err> {
        let private_key = AleoPrivateKey::<N::Parameters>::from_str(private_key)?;
        Self::from_private_key(private_key)
    }
}

impl<N: Network> fmt::Display for Account<N> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.account)
    }
}
