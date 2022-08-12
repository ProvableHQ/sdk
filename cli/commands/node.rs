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
use snarkvm::{
    file::Manifest,
    package::Package,
    prelude::{
        Address,
        Block,
        BlockMemory,
        Field,
        Identifier,
        Plaintext,
        PrivateKey,
        Program,
        ProgramID,
        Record,
        RecordsFilter,
        Transaction,
        Value,
        ViewKey,
        Zero,
        VM,
    },
};

use anyhow::{ensure, Result};
use clap::Parser;
use colored::*;
use core::str::FromStr;
use indexmap::IndexMap;
use parking_lot::RwLock;
use std::{convert::TryFrom, sync::Arc};

pub(crate) type InternalLedger<N> = snarkvm::prelude::Ledger<N, BlockMemory<N>>;

pub struct Ledger {
    /// The internal ledger.
    ledger: RwLock<InternalLedger<Network>>,
    /// The account private key.
    private_key: PrivateKey<Network>,
    /// The account view key.
    view_key: ViewKey<Network>,
    /// The account address.
    address: Address<Network>,
}

impl Ledger {
    /// Initializes a new instance of the ledger.
    pub fn load(private_key: &PrivateKey<Network>) -> Result<Self> {
        // Derive the view key and address.
        let view_key = ViewKey::try_from(private_key)?;
        let address = Address::try_from(&view_key)?;

        // Initialize an RNG.
        let rng = &mut ::rand::thread_rng();
        // Create a genesis block.
        let genesis = Block::genesis(&VM::new()?, private_key, rng)?;
        // Initialize the ledger.
        let ledger = Self {
            ledger: RwLock::new(InternalLedger::new_with_genesis(&genesis, address)?),
            private_key: private_key.clone(),
            view_key,
            address,
        };
        // Return the ledger.
        Ok(ledger)
    }

    /// Returns the account address.
    pub const fn address(&self) -> &Address<Network> {
        &self.address
    }
}

impl Ledger {
    /// Adds the given transaction to the memory pool.
    pub fn add_to_memory_pool(&self, transaction: Transaction<Network>) -> Result<()> {
        self.ledger.write().add_to_memory_pool(transaction)
    }

    /// Advances the ledger to the next block.
    pub fn advance_to_next_block(&self) -> Result<Block<Network>> {
        // Initialize an RNG.
        let rng = &mut ::rand::thread_rng();
        // Propose the next block.
        let next_block = self.ledger.read().propose_next_block(&self.private_key, rng)?;
        // Add the next block to the ledger.
        if let Err(error) = self.ledger.write().add_next_block(&next_block) {
            // Log the error.
            eprintln!("{error}");
        }
        // Return the next block.
        Ok(next_block)
    }

    /// Returns the unspent records.
    pub fn unspent_records(&self) -> Result<IndexMap<Field<Network>, Record<Network, Plaintext<Network>>>> {
        // Fetch the unspent records.
        let records = self
            .ledger
            .read()
            .find_records(&self.view_key, RecordsFilter::AllUnspent(self.private_key))
            .filter(|(_, record)| !record.gates().is_zero())
            .collect::<IndexMap<_, _>>();
        // Return the unspent records.
        Ok(records)
    }

    /// Creates a deploy transaction.
    pub fn create_deploy(&self, program: &Program<Network>, additional_fee: u64) -> Result<Transaction<Network>> {
        // Fetch the unspent records.
        let records = self.unspent_records()?;
        ensure!(!records.len().is_zero(), "The Aleo account has no records to spend.");

        // Prepare the additional fee.
        let credits = records
            .values()
            .max_by(|a, b| (**a.gates()).cmp(&**b.gates()))
            .unwrap()
            .clone();
        ensure!(
            ***credits.gates() >= additional_fee,
            "The additional fee is more than the record balance."
        );

        // Initialize an RNG.
        let rng = &mut ::rand::thread_rng();
        // Deploy.
        let transaction = Transaction::deploy(
            &self.ledger.read().vm(),
            &self.private_key,
            program,
            (credits, additional_fee),
            rng,
        )?;
        // Verify.
        assert!(self.ledger.read().vm().verify(&transaction));
        // Return the transaction.
        Ok(transaction)
    }

    /// Creates a transfer transaction.
    pub fn create_transfer(&self, to: &Address<Network>, amount: u64) -> Result<Transaction<Network>> {
        // Fetch the unspent records.
        let records = self.unspent_records()?;
        ensure!(!records.len().is_zero(), "The Aleo account has no records to spend.");

        // Initialize an RNG.
        let rng = &mut ::rand::thread_rng();

        // Create a new transaction.
        Transaction::execute(
            &self.ledger.read().vm(),
            &self.private_key,
            &ProgramID::from_str("credits.aleo")?,
            Identifier::from_str("transfer")?,
            &[
                Value::Record(records.values().next().unwrap().clone()),
                Value::from_str(&format!("{to}"))?,
                Value::from_str(&format!("{amount}u64"))?,
            ],
            None,
            rng,
        )
    }
}

/// Commands to operate a local development node.
#[derive(Debug, Parser)]
pub enum Node {
    /// Starts a local development node
    Start {
        /// Skips deploying the local program at genesis.
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
                ensure!(
                    directory.exists(),
                    "The program directory does not exist: {}",
                    directory.display()
                );
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
                let ledger = Arc::new(Ledger::load(private_key)?);

                // Deploy the local program.
                if !nodeploy {
                    println!(
                        "\n📦 Deploying '{}' to the local development node...\n",
                        manifest.program_id().to_string().bold()
                    );

                    // Load the package.
                    let package = Package::open(&directory)?;
                    // Load the program.
                    let program = package.program();

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
                        manifest.program_id().to_string().bold(),
                        transaction.id()
                    );
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
