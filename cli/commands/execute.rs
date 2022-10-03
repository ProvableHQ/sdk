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
    prelude::{Ciphertext, Identifier, Locator, PrivateKey, Record, Value, ViewKey},
};

use anyhow::{bail, Error, Result};
use clap::Parser;
use colored::Colorize;
use core::str::FromStr;
use std::convert::TryFrom;

/// Executes an Aleo program function.
#[derive(Debug, Parser)]
pub struct Execute {
    /// The function name.
    #[clap(parse(try_from_str))]
    function: Identifier<Network>,
    /// The function inputs.
    #[clap(parse(try_from_str))]
    inputs: Vec<Value<Network>>,
}

impl Execute {
    /// Executes a specified Aleo program's function
    #[allow(clippy::format_in_format_args)]
    pub fn parse(self) -> Result<String> {
        // Derive the program directory path.
        let path = std::env::current_dir()?;

        // Load the package.
        let package = Package::open(&path)?;

        // Initialize an RNG.
        let rng = &mut rand::thread_rng();

        // TODO: Find a way for not having to turn a snarkvm::snarkvm_circuit::PrivateKey into a string just to turn it back into a snarkvm::prelude::PrivateKey.
        let private_key =
            PrivateKey::<Network>::from_str(&package.manifest_file().development_private_key().to_string())?;

        // Derive the view key from the private key
        let view_key = ViewKey::try_from(private_key)?;

        // TODO: Find a better way to filter commitments from the program execution inputs.
        let mut inputs: Vec<Value<Network>> = Vec::new();
        self.inputs.into_iter().try_for_each(|input| {
            if input.to_string().ends_with("field") {
                let ciphertext: Record<Network, Ciphertext<Network>> =
                    ureq::get(&format!("http://localhost/testnet3/ciphertext/{input}"))
                        .call()?
                        .into_json()?;
                let record = ciphertext.decrypt(&view_key)?;
                inputs.push(Value::Record(record));
            } else {
                inputs.push(input);
            }
            Ok::<(), Error>(())
        })?;

        // Find an unspent ciphertext to use later for the fee.
        let ciphertext = ureq::post("http://localhost/testnet3/ciphertexts/unspent")
            .send_json(serde_json::json!(view_key.to_string()))?
            .into_json::<Vec<Record<Network, Ciphertext<Network>>>>()?
            .into_iter()
            .next();

        if let Some(ciphertext) = ciphertext {
            let record = ciphertext.decrypt(&view_key)?;
            // Execute the request.
            let (response, execution) = package.execute::<Aleo, _>(
                Some("http://localhost:4000/testnet3/execute".to_string()),
                package.manifest_file().development_private_key(),
                record,
                self.function,
                &inputs,
                rng,
            )?;

            // Print the transaction id.
            println!(
                "{}",
                format!("Transaction ID: {}", execution.id().to_string().bright_green())
            );

            // Log the outputs.
            match response.outputs().len() {
                0 => (),
                1 => println!("\n➡️  Output\n"),
                _ => println!("\n➡️  Outputs\n"),
            };
            // TODO: Handle output cases better.
            for (output, output_id) in response.outputs().iter().zip(response.output_ids()) {
                match output_id {
                    snarkvm::prelude::OutputID::Record(commitment, _) => {
                        println!("{}", format!(" • {output} - {commitment}"))
                    }
                    _ => println!("{}", format!(" • {output}")),
                }
            }
            println!();

            // Prepare the locator.
            let locator = Locator::<Network>::from_str(&format!("{}/{}", package.program_id(), self.function))?;
            // Prepare the path string.
            let path_string = format!("(in \"{}\")", path.display());

            Ok(format!(
                "✅ Executed '{}' {}",
                locator.to_string().bold(),
                path_string.dimmed()
            ))
        } else {
            bail!(
                "⚠️ Could not deploy '{}' {}",
                package.program_id().to_string().bold(),
                "No unspent ciphertexts found".dimmed()
            )
        }
    }
}
