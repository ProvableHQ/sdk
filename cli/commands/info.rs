// Copyright (C) 2019-2023 Aleo Systems Inc.
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

use crate::Aleo;
use snarkvm::package::Package;

use anyhow::Result;
use clap::Parser;
use colored::Colorize;

/// Returns information about the program, including:
///   - The JSON representation of the constraint system.
#[derive(Debug, Parser)]
pub struct Info {
    /// Uses the specified endpoint.
    #[clap(long)]
    endpoint: Option<String>,
    /// Toggles offline mode.
    #[clap(long)]
    offline: bool,
}

impl Info {
    /// Compiles an Aleo program with the specified name.
    pub fn parse(self) -> Result<String> {
        // Derive the program directory path.
        let path = std::env::current_dir()?;

        // Load the package.
        let package = Package::open(&path)?;

        // Query for the package information.
        let results = package.info::<Aleo>(self.endpoint)?;

        // Print the results.
        for (function_name, transcript) in results {
            let output = serde_json::to_string_pretty(&transcript).unwrap();
            println!("\nOutputting the JSON representation for '{}'", function_name.to_string().bold());
            println!("{}\n", output);
        }

        // package.info::<Aleo>(match self.offline {
        //     true => None,
        //     false => Some(endpoint.unwrap_or("https://vm.aleo.org/testnet3/build".to_string())),
        // })?;

        // Prepare the path string.
        let path_string = format!("(in \"{}\")", path.display());

        // Log the command as successful.
        Ok(format!("✅ Returned information on '{}' {}", package.program_id().to_string().bold(), path_string.dimmed()))
    }
}
