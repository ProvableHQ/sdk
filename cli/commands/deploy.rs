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
use snarkvm::package::Package;

use anyhow::Result;
use clap::Parser;
use colored::Colorize;

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

        // Deploy the package.
        package.deploy::<Aleo>(Some("https://www.aleo.network/testnet3/deploy".to_string()))?;
        println!();

        // Prepare the path string.
        let path_string = format!("(in \"{}\")", path.display());

        // Log the deploy as successful.
        Ok(format!("✅ Deployed '{}' {}", package.program_id().to_string().bold(), path_string.dimmed()))
    }
}
