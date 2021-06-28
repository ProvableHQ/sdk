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

use crate::PrivateKeyError;

use snarkvm_dpc::{
    account::AccountPrivateKey,
    testnet1::{instantiated::Components, parameters::SystemParameters},
};

use rand::{CryptoRng, Rng};
use std::{fmt, str::FromStr};

#[derive(Debug)]
pub struct PrivateKey {
    pub private_key: AccountPrivateKey<Components>,
}

impl PrivateKey {
    pub fn new<R: Rng + CryptoRng>(rng: &mut R) -> Result<Self, PrivateKeyError> {
        let parameters = SystemParameters::<Components>::load()?;
        let private_key =
            AccountPrivateKey::<Components>::new(&parameters.account_signature, &parameters.account_commitment, rng)?;
        Ok(Self { private_key })
    }
}

impl FromStr for PrivateKey {
    type Err = PrivateKeyError;

    fn from_str(private_key: &str) -> Result<Self, Self::Err> {
        Ok(Self {
            private_key: AccountPrivateKey::<Components>::from_str(private_key)?,
        })
    }
}

impl fmt::Display for PrivateKey {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{}", self.private_key.to_string())
    }
}
