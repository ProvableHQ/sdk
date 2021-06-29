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

use crate::helpers::transaction::new_dummy_transaction;
use aleo_network::Testnet1;

use snarkvm_utilities::{to_bytes, ToBytes};

use colored::*;
use rand::SeedableRng;
use rand_chacha::ChaChaRng;
use structopt::StructOpt;

#[derive(StructOpt, Debug)]
#[structopt(setting = structopt::clap::AppSettings::ColoredHelp)]
pub enum Transaction {
    /// Generates a new Aleo account
    New {
        /// Craft a dummy transaction
        #[structopt(short = "d", long)]
        dummy: bool,
        /// Seed the RNG with a numeric value
        #[structopt(short = "s", long)]
        seed: Option<u64>,
    },
}

impl Transaction {
    #[allow(clippy::match_single_binding)]
    pub fn parse(self) -> anyhow::Result<String> {
        match self {
            Self::New { dummy, seed } => match dummy {
                _ => {
                    // Initialize the parameters.
                    let mut rng = match seed {
                        Some(seed) => ChaChaRng::seed_from_u64(seed),
                        None => ChaChaRng::from_entropy(),
                    };

                    // Create the dummy transaction.
                    let transaction = new_dummy_transaction::<_, Testnet1>(&mut rng)?;

                    // Hexify the transaction.
                    let transaction = hex::encode(to_bytes![transaction]?);

                    // Print the new Aleo transaction.
                    let mut output = format!("\n {}\n\n", "Transaction (Dummy)".cyan().bold());
                    output += &format!("{}\n", transaction);

                    Ok(output)
                }
            },
        }
    }
}
