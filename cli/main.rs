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

#[cfg(not(feature = "wasm"))]
use aleo::{commands::CLI, helpers::Updater};
#[cfg(not(feature = "wasm"))]
use clap::Parser;

#[cfg(not(feature = "wasm"))]
fn main() -> anyhow::Result<()> {
    // Parse the given arguments.
    let cli = CLI::parse();
    // Run the updater.
    println!("{}", Updater::print_cli());
    // Run the CLI.
    match cli.command.parse() {
        Ok(output) => println!("{output}\n"),
        Err(error) => println!("⚠️  {error}\n"),
    }
    Ok(())
}

#[cfg(feature = "wasm")]
fn main() {
    println!("The rust CLI application and cannot be run when using the wasm feature flag");
}
