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

use crate::{cli::Command, updater::Updater};
use aleo_account::{Address, PrivateKey, ViewKey};

use colored::*;
use rand::SeedableRng;
use rand_chacha::ChaChaRng;

pub fn parse(command: Command) -> anyhow::Result<String> {
    match command {
        Command::New { seed } => {
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
        Command::Update { list, quiet } => match list {
            true => match Updater::show_available_releases() {
                Ok(output) => Ok(output),
                Err(error) => Ok(format!("Failed to list the available versions of Aleo\n{}\n", error)),
            },
            false => {
                let result = Updater::update_to_latest_release(!quiet);
                if !quiet {
                    match result {
                        Ok(status) => {
                            if status.uptodate() {
                                Ok("\nAleo is already on the latest version".to_string())
                            } else if status.updated() {
                                Ok(format!("\nAleo has updated to version {}", status.version()))
                            } else {
                                Ok(format!(""))
                            }
                        }
                        Err(e) => Ok(format!("\nFailed to update Aleo to the latest version\n{}\n", e)),
                    }
                } else {
                    Ok(format!(""))
                }
            }
        }, // _ => Err(anyhow!("\nUnknown command\n")),
    }
}
