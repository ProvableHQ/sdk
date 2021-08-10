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

use rand::{CryptoRng, Rng};
use snarkvm_dpc::{
    account::Account as AleoAccount,
    address::Address as AleoAddress,
    private_key::PrivateKey as AleoPrivateKey,
    testnet1::Testnet1Parameters,
    view_key::ViewKey as AleoViewKey,
    AccountScheme,
};
use std::{fmt, str::FromStr};

// todo @collin: pass network into types.
/// An Aleo private key, e.g. APrivateKey1tn8cnHPNtcZ9pH89YBMmpPS3fP5kxooguzpbRz3pLWoSzhg
pub type PrivateKey = AleoPrivateKey<Testnet1Parameters>;
/// An Aleo view key, e.g. AViewKey1m9cmnBtfWziAmT1SBC63a96fo18hLddrjweMxhcqhNo5
pub type ViewKey = AleoViewKey<Testnet1Parameters>;
/// An Aleo address, e.g. aleo1h47qwdqqv25gwp0fkxgnqvm7ykrz0ud2vaw2cj4ac68w8wq5vqqqv58jvr
pub type Address = AleoAddress<Testnet1Parameters>;

pub struct Account {
    account: AleoAccount<Testnet1Parameters>,
}

impl Account {
    pub fn new<R: Rng + CryptoRng>(rng: &mut R) -> Result<Self, AccountError> {
        Ok(Self {
            account: AleoAccount::new(rng)?,
        })
    }

    pub fn from_private_key(private_key: PrivateKey) -> Result<Self, AccountError> {
        let view_key = ViewKey::from_private_key(&private_key)?;
        let address = Address::from_private_key(&private_key)?;

        Ok(Self {
            account: AleoAccount::<Testnet1Parameters> {
                private_key,
                view_key,
                address,
            },
        })
    }

    pub fn private_key(&self) -> &PrivateKey {
        &self.account.private_key
    }

    pub fn view_key(&self) -> &ViewKey {
        &self.account.view_key
    }

    pub fn address(&self) -> &Address {
        &self.account.address
    }
}

impl FromStr for Account {
    type Err = AccountError;

    fn from_str(private_key: &str) -> Result<Self, Self::Err> {
        let private_key = PrivateKey::from_str(private_key)?;
        Ok(Self::from_private_key(private_key)?)
    }
}

impl fmt::Display for Account {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "Private Key  {}", self.account.private_key.to_string())?;
        write!(f, "   View Key  {}", self.account.view_key.to_string())?;
        write!(f, "    Address  {}", self.account.address.to_string())
    }
}
