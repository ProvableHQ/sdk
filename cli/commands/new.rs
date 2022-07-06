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

use anyhow::{bail, Result};
use clap::Parser;

/// Create new Aleo program.
#[derive(Debug, Parser)]
pub struct New {
    /// The name of the program.
    name: String,
}

impl New {
    pub fn parse(self) -> Result<String> {
        // Check that the given program name is valid.
        // if !Package::is_program_name_valid(&self.name) {
        //     return Err(CliError::invalid_project_name().into());
        // }

        // Derive the program directory path.
        let mut path = std::env::current_dir()?;
        path.push(&self.name);

        // Verify the program directory path does not exist yet.
        if path.exists() {
            bail!("The program directory already exists: {}", path.display());
        }

        // Create the program directory.
        std::fs::create_dir_all(&path)?;

        // Package::initialize(&self.name, &path)?;

        Ok(String::new())
    }
}
