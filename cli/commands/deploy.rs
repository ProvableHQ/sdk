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

use crate::{Aleo, Network};
use snarkvm::{
    package::Package,
    prelude::{Ciphertext, PrivateKey, Record, ViewKey},
};

use anyhow::{bail, Result};
use clap::Parser;
use colored::Colorize;
use std::{convert::TryFrom, str::FromStr};

/// Deploys an Aleo program.
#[derive(Debug, Parser)]
pub struct Deploy;

impl Deploy {
    /// Deploys an Aleo program with the specified name.
    pub fn parse(self) -> Result<String> {
        // Derive the program directory path.
        let path = std::env::current_dir()?;

        // Load the package.
        let package = Package::<Network>::open(&path)?;

        // TODO: Find a way for not having to turn a snarkvm::snarkvm_circuit::PrivateKey into a string just to turn it back into a snarkvm::prelude::PrivateKey.
        let private_key =
            PrivateKey::<Network>::from_str(&package.manifest_file().development_private_key().to_string())?;
        let view_key = ViewKey::try_from(private_key)?;

        let ciphertext = ureq::post("http://localhost/testnet3/ciphertexts/unspent")
            .send_json(serde_json::json!(view_key.to_string()))?
            .into_json::<Vec<Record<Network, Ciphertext<Network>>>>()?
            .into_iter()
            .next();

        if let Some(ciphertext) = ciphertext {
            let record = ciphertext.decrypt(&view_key)?;
            // Deploy the package.
            let deployment_transaction = package.deploy::<Aleo>(
                Some("http://localhost:4000/testnet3/deploy".to_string()),
                &private_key,
                record,
            )?;
            println!();
            // Print the transaction id.
            println!(
                "{}",
                format_args!(
                    "Transaction ID: {}",
                    deployment_transaction.id().to_string().bright_green()
                )
            );
            println!();

            // Prepare the path string.
            let path_string = format!("(in \"{}\")", path.display());

            // Log the deploy as successful.
            Ok(format!(
                "✅ Deployed '{}' {}",
                package.program_id().to_string().bold(),
                path_string.dimmed()
            ))
        } else {
            bail!(
                "⚠️ Could not deploy '{}' {}",
                package.program_id().to_string().bold(),
                "No unspent records found".dimmed()
            )
        }
    }
}
