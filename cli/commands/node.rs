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

use crate::{helpers::Ledger, Network};
use snarkvm::{
    file::{AleoFile, Manifest},
    package::Package,
};

use anyhow::{ensure, Result};
use clap::Parser;
use colored::*;
use std::sync::Arc;

/// Commands to operate a local development node.
#[derive(Debug, Parser)]
pub enum Node {
    /// Starts a local development node
    Start {
        /// Skips deploying the local program at genesis.
        #[clap(long)]
        nodeploy: bool,
    },
}

impl Node {
    pub fn parse(self) -> Result<String> {
        match self {
            Self::Start { nodeploy } => {
                // Derive the program directory path.
                let directory = std::env::current_dir()?;

                // Ensure the directory path exists.
                ensure!(directory.exists(), "The program directory does not exist: {}", directory.display());
                // Ensure the manifest file exists.
                ensure!(
                    Manifest::<Network>::exists_at(&directory),
                    "Please start a local node in an Aleo program directory (missing '{}' at '{}')",
                    Manifest::<Network>::file_name(),
                    directory.display()
                );

                // Open the manifest file.
                let manifest = Manifest::open(&directory)?;

                println!(
                    "⏳ Starting a local development node for '{}' (in-memory)...\n",
                    manifest.program_id().to_string().bold()
                );

                // Retrieve the private key.
                let private_key = manifest.development_private_key();

                // Initialize the ledger.
                let ledger = Arc::new(Ledger::<Network>::load(private_key)?);

                // Deploy the local program.
                if !nodeploy {
                    // Load the package.
                    let package = Package::open(&directory)?;
                    // Load the program.
                    let program = package.program();

                    // Prepare the imports directory.
                    let imports_directory = package.imports_directory();

                    // Load all of the imported programs (in order of imports).
                    let programs = program
                        .imports()
                        .keys()
                        .map(|program_id| {
                            // Open the Aleo imported program file.
                            let import_program_file = AleoFile::open(&imports_directory, program_id, false)?;
                            // Return the imported program.
                            Ok(import_program_file.program().clone())
                        })
                        .collect::<Result<Vec<_>>>()?;

                    // Deploy the imported programs (in order of imports), and the main program.
                    for program in programs.iter().chain([program.clone()].iter()) {
                        println!(
                            "📦 Deploying '{}' to the local development node...\n",
                            program.id().to_string().bold()
                        );

                        // Create a deployment transaction.
                        let transaction = ledger.create_deploy(program, 1)?;
                        // Add the transaction to the memory pool.
                        ledger.add_to_memory_pool(transaction.clone())?;

                        // Advance to the next block.
                        let next_block = ledger.advance_to_next_block()?;
                        println!(
                            "\n🛡️  Produced block {} ({})\n\n{}\n",
                            next_block.height(),
                            next_block.hash(),
                            serde_json::to_string_pretty(&next_block.header())?.dimmed()
                        );

                        println!(
                            "✅ Deployed '{}' in transaction '{}'\n",
                            program.id().to_string().bold(),
                            transaction.id()
                        );
                    }
                }

                loop {
                    // Create a transfer transaction.
                    let transaction = ledger.create_transfer(ledger.address(), 1)?;
                    // Add the transaction to the memory pool.
                    ledger.add_to_memory_pool(transaction)?;

                    // Advance to the next block.
                    let next_block = ledger.advance_to_next_block()?;
                    println!(
                        "\n🛡️  Produced block {} ({})\n\n{}\n",
                        next_block.height(),
                        next_block.hash(),
                        serde_json::to_string_pretty(&next_block.header())?.dimmed()
                    );
                }
            }
        }
    }
}
