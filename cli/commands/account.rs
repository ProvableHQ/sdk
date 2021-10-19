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

use aleo_account::{AccountScheme, AleoAccount, Testnet2};

use colored::*;
use rand::SeedableRng;
use rand_chacha::ChaChaRng;
use structopt::StructOpt;

#[derive(StructOpt, Debug)]
#[structopt(setting = structopt::clap::AppSettings::ColoredHelp)]
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
                // Sample a new Aleo account.
                let account = match seed {
                    Some(seed) => AleoAccount::<Testnet2>::new(&mut ChaChaRng::seed_from_u64(seed)),
                    None => AleoAccount::<Testnet2>::new(&mut rand::thread_rng()),
                };

                // Print the new Aleo account.
                let mut output = format!("\n {:>12}  {}\n", "Private Key".cyan().bold(), account.private_key());
                output += &format!(" {:>12}  {}\n", "View Key".cyan().bold(), account.view_key());
                output += &format!(" {:>12}  {}\n", "Address".cyan().bold(), account.address());

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
        // Will fail in IntelliJ since it runs cargo test --color=always, but should past in other circumstances
        // TODO(collinc97) ensure it passes regardless of color flag settings
        let expected = "\n \u{1b}[1;36m Private Key\u{1b}[0m  APrivateKey1zkp8cC4jgHEBnbtu3xxs1Ndja2EMizcvTRDq5Nikdkukg1p\n \u{1b}[1;36m    View Key\u{1b}[0m  AViewKey1iAf6a7fv6ELA4ECwAth1hDNUJJNNoWNThmREjpybqder\n \u{1b}[1;36m     Address\u{1b}[0m  aleo1d5hg2z3ma00382pngntdp68e74zv54jdxy249qhaujhks9c72yrsydapc4\n";
        let account = Account::New { seed };
        let actual = account.parse().unwrap();
        assert_eq!(expected, actual);
    }
}
