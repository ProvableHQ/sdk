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
    prelude::{Identifier, Locator, Value},
};

use anyhow::Result;
use clap::Parser;
use colored::Colorize;
use core::str::FromStr;

/// Executes an Aleo program function.
#[derive(Debug, Parser)]
pub struct Run {
    /// The function name.
    #[clap(parse(try_from_str))]
    function: Identifier<Network>,
    /// The function inputs.
    #[clap(parse(try_from_str))]
    inputs: Vec<Value<Network>>,
    /// Uses the specified endpoint.
    #[clap(long)]
    endpoint: Option<String>,
    /// Toggles offline mode.
    #[clap(long)]
    offline: bool,
}

impl Run {
    /// Compiles an Aleo program function with the specified name.
    #[allow(clippy::format_in_format_args)]
    pub fn parse(self) -> Result<String> {
        // Derive the program directory path.
        let path = std::env::current_dir()?;

        // Load the package.
        let package = Package::open(&path)?;

        // Initialize an RNG.
        let rng = &mut rand::thread_rng();

        // Execute the request.
        let (response, _transition) = package.run::<Aleo, _>(
            self.endpoint,
            package.manifest_file().development_private_key(),
            self.function,
            &self.inputs,
            rng,
        )?;

        // Log the outputs.
        match response.outputs().len() {
            0 => (),
            1 => println!("\n➡️  Output\n"),
            _ => println!("\n➡️  Outputs\n"),
        };
        for output in response.outputs() {
            println!("{}", format!(" • {output}"));
        }
        println!();

        // Prepare the locator.
        let locator = Locator::<Network>::from_str(&format!("{}/{}", package.program_id(), self.function))?;
        // Prepare the path string.
        let path_string = format!("(in \"{}\")", path.display());

        Ok(format!("✅ Executed '{}' {}", locator.to_string().bold(), path_string.dimmed()))
    }
}
