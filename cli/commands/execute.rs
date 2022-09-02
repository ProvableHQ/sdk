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

use anyhow::{Error, Result};
use clap::Parser;
use colored::Colorize;
use core::str::FromStr;
use serde_json::json;
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
                    ureq::get(&format!("https://www.aleo.network/testnet3/ciphertext/unspent/{input}"))
                        .send_json(json!(view_key.to_string()))?
                        .into_json()?;
                let record = ciphertext.decrypt(&view_key)?;
                inputs.push(Value::Record(record));
            } else {
                inputs.push(input);
            }
            Ok::<(), Error>(())
        })?;

        // Execute the request.
        let execution = package.execute::<Aleo, _>(
            Some("https://www.aleo.network/testnet3/program/execute".to_string()),
            package.manifest_file().development_private_key(),
            self.function,
            &inputs,
            rng,
        )?;

        // Prepare the locator.
        let locator = Locator::<Network>::from_str(&format!("{}/{}", package.program_id(), self.function))?;
        // Prepare the path string.
        let path_string = format!("(in \"{}\")", path.display());

        Ok(format!(
            "✅ Executed '{}' {}",
            locator.to_string().bold(),
            path_string.dimmed()
        ))
    }
}
