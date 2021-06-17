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

use aleo_account::{Address, PrivateKey, ViewKey};

use colored::*;
use rand::SeedableRng;
use rand_chacha::ChaChaRng;
use structopt::StructOpt;

#[derive(StructOpt, Debug)]
pub enum Account {
    /// Generates a new Aleo account
    New {
        /// Seed the RNG with a numeric value
        #[structopt(short = "s", long)]
        seed: Option<u64>,
    },
}

impl Account {
    pub fn parse(self) -> anyhow::Result<String> {
        match self {
            Self::New { seed } => {
                // Sample a new Aleo private key.
                let private_key = match seed {
                    Some(seed) => PrivateKey::new(&mut ChaChaRng::seed_from_u64(seed))?,
                    None => PrivateKey::new(&mut rand::thread_rng())?,
                };
                let view_key = ViewKey::from(&private_key)?;
                let address = Address::from(&private_key)?;

                // Print the new Aleo account.
                let mut output = format!("\n {:>12}  {}\n", "Private Key".cyan().bold(), private_key);
                output += &format!(" {:>12}  {}\n", "View Key".cyan().bold(), view_key);
                output += &format!(" {:>12}  {}\n", "Address".cyan().bold(), address);

                Ok(output)
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use crate::commands::Account;

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
        let expected = r"
  Private Key  APrivateKey1tvv5YV1dipNiku2My8jMkqpqCyYKvR5Jq4y2mtjw7s77Zpn
     View Key  AViewKey1m8gvywHKHKfUzZiLiLoHedcdHEjKwo5TWo6efz8gK7wF
      Address  aleo1faksgtpmculyzt6tgaq26fe4fgdjtwualyljjvfn2q6k42ydegzspfz9uh
";
        let account = Account::New { seed };
        let actual = account.parse().unwrap();
        assert_eq!(expected, actual);
    }
}
