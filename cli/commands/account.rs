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

use crate::Network;
use snarkvm::prelude::{Address, PrivateKey, ViewKey};

use anyhow::Result;
use clap::Parser;
use colored::*;
use rand::SeedableRng;
use rand_chacha::ChaChaRng;
use std::convert::TryFrom;

/// Commands to manage Aleo accounts.
#[derive(Debug, Parser)]
pub enum Account {
    /// Generates a new Aleo account
    New {
        /// Seed the RNG with a numeric value
        #[clap(short = 's', long)]
        seed: Option<u64>,
    },
}

impl Account {
    pub fn parse(self) -> Result<String> {
        match self {
            Self::New { seed } => {
                // Sample a new Aleo account.
                let private_key = match seed {
                    Some(seed) => PrivateKey::<Network>::new(&mut ChaChaRng::seed_from_u64(seed))?,
                    None => PrivateKey::new(&mut rand::thread_rng())?,
                };
                let view_key = ViewKey::try_from(&private_key)?;
                let address = Address::try_from(&view_key)?;

                // Print the new Aleo account.
                let output = format!(
                    " {:>12}  {private_key}\n {:>12}  {view_key}\n {:>12}  {address}",
                    "Private Key".cyan().bold(),
                    "View Key".cyan().bold(),
                    "Address".cyan().bold(),
                );

                Ok(output)
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use crate::commands::Account;
    use colored::Colorize;

    #[test]
    fn test_new() {
        for _ in 0..3 {
            let account = Account::New { seed: None };
            assert!(account.parse().is_ok());
        }
    }

    #[test]
    fn test_new_seeded() {
        let seed = Some(1231275789u64);
        let mut expected = format!(
            " {:>12}  {}\n",
            "Private Key".cyan().bold(),
            "APrivateKey1zkp2oVPTci9kKcUprnbzMwq95Di1MQERpYBhEeqvkrDirK1"
        );
        expected += &format!(
            " {:>12}  {}\n",
            "View Key".cyan().bold(),
            "AViewKey1mmLWAuYDaM1NfgNaD1Jy7THG8uS4Ui2zyugFuPEijgyQ"
        );
        expected += &format!(
            " {:>12}  {}",
            "Address".cyan().bold(),
            "aleo1whnlxsgnhc8ywft2l4nu9hywedspcjpwcsgg490ckz34tthqsupqdh5z64"
        );
        let account = Account::New { seed };
        let actual = account.parse().unwrap();
        assert_eq!(expected, actual);
    }
}
