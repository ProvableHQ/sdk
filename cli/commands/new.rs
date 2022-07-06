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

use crate::Network;
use snarkvm::{package::Package, prelude::ProgramID};

use anyhow::{bail, Result};
use clap::Parser;
use core::str::FromStr;

/// Create a new Aleo package.
#[derive(Debug, Parser)]
pub struct New {
    /// The program name.
    name: String,
}

impl New {
    pub fn parse(self) -> Result<String> {
        // Derive the program directory path.
        let mut path = std::env::current_dir()?;
        path.push(&self.name);

        // Create the program ID from the name.
        let id = ProgramID::<Network>::from_str(&self.name)?;

        // Create the package.
        Package::new(&path, &id)?;

        Ok(String::new())
    }
}
