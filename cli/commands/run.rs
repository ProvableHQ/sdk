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

use crate::{commands::Build, Aleo, Network};
use snarkvm::{
    package::Package,
    prelude::{Identifier, Locator, PrivateKey, Value},
};

use anyhow::{bail, Result};
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
}

impl Run {
    /// Compiles an Aleo program function with the specified name.
    pub fn parse(self) -> Result<String> {
        // Derive the program directory path.
        let path = std::env::current_dir()?;

        // Load the package.
        let package = Package::open(&path)?;
        // If the program requires a build, invoke the build command.
        if package.is_build_required::<Aleo>()? {
            Build::build(&package)?;
        }

        // Check that the function exists.
        if !package.program_file().program().contains_function(&self.function) {
            bail!("Function '{}' does not exist.", self.function)
        }

        // Initialize an RNG.
        let rng = &mut rand::thread_rng();

        // Initialize a new burner caller account.
        let private_key = PrivateKey::<Network>::new(rng)?;
        // let caller = Address::try_from(&private_key)?;

        // Compute the signed request.
        let request = package
            .program_file()
            .program()
            .sign(&private_key, self.function, &self.inputs, rng)?;

        // Prepare the locator.
        let locator = Locator::<Network>::from_str(&format!("{}/{}", package.program_id(), self.function))?;

        println!("🚀 Executing '{}'...\n", locator.to_string().bold());

        // Execute the request.
        let (response, _transition) = package.run::<Aleo>(&request)?;

        // Prepare the path string.
        let path_string = format!("(in \"{}\")", path.display());

        // Log the outputs.
        match response.outputs().len() > 1 {
            true => println!("\n➡️  {}\n", "Outputs"),
            false => println!("\n➡️  {}\n", "Output"),
        };
        for output in response.outputs() {
            println!("{}", format!(" • {}", output));
        }
        println!();

        Ok(format!(
            "✅ Executed '{}' {}",
            locator.to_string().bold(),
            path_string.dimmed()
        ))
    }
}
