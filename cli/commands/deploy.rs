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
use snarkvm::{package::Package, prelude::{test_crypto_rng, Testnet3}};

use anyhow::Result;
use clap::Parser;
use colored::Colorize;

/// Compiles an Aleo program.
#[derive(Debug, Parser)]
pub struct Deploy {
    /// Uses the specified endpoint.
    #[clap(long)]
    endpoint: Option<String>,
    /// Toggles offline mode.
    #[clap(long)]
    offline: bool,
}

impl Deploy {
    /// Compiles an Aleo program with the specified name.
    pub fn parse(self) -> Result<String> {
        // Derive the program directory path.
        let path = std::env::current_dir()?;

        // Load the package.
        let package = Package::<Testnet3>::open(&path)?;

        Self::deploy(&package, self.endpoint, self.offline)?;

        // Prepare the path string.
        let path_string = format!("(in \"{}\")", path.display());

        // Log the deploy as successful.
        Ok(format!(
            "✅ Deployed '{}' {}",
            package.program_id().to_string().bold(),
            path_string.dimmed()
        ))
    }

    /// Performs the deploy command.
    pub(crate) fn deploy(package: &Package<Network>, endpoint: Option<String>, _offline: bool) -> Result<()> {
        println!("⏳ Deploying '{}'...\n", package.program_id().to_string().bold());
        // Retrieve the main program.
        let program = package.program();
        println!("{}", program.id());
        // Construct the process.
        let process = package.get_process()?;
        let rng = &mut test_crypto_rng();
        let deployment = process.deploy::<Aleo, _>(program, rng).unwrap();
        
        ureq::post("http://127.0.0.1/testnet3/deploy").send_json(&deployment)?.into_json()?;
        
        println!();
        Ok(())
    }
}
