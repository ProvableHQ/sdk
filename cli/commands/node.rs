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
    prelude::{
        Address,
        Block,
        BlockMemory,
        Identifier,
        PrivateKey,
        ProgramID,
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
        // Ensure the given block is a valid next block.
        self.ledger.read().check_next_block(&next_block)?;

        // Add the next block to the ledger.
        if let Err(error) = self.ledger.write().add_next_block(&next_block) {
            // Log the error.
            eprintln!("{error}");
        }
        // Return the next block.
        Ok(next_block)
    }

    /// Creates a transfer transaction.
    pub fn create_transfer(&self, to: &Address<Network>, amount: u64) -> Result<Transaction<Network>> {
        // Fetch the unspent records.
        let records = self
            .ledger
            .read()
            .find_records(&self.view_key, RecordsFilter::AllUnspent(self.private_key))
            .filter(|(_, record)| !record.gates().is_zero())
            .collect::<IndexMap<_, _>>();
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
    Start,
}

impl Node {
    pub fn parse(self) -> Result<String> {
        match self {
            Self::Start => {
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

                // // Initialize a channel to send requests to the ledger.
                // let (ledger_sender, ledger_receiver) = mpsc::channel(64);
                // let _handle_ledger = handle_ledger::<Network>(ledger.clone(), ledger_receiver);
                // let _handle_server = handle_server::<Network>(ledger.clone(), ledger_sender);

                loop {
                    // Create a transfer transaction.
                    let transaction = ledger.create_transfer(ledger.address(), 1)?;
                    // Add the transaction to the memory pool.
                    ledger.add_to_memory_pool(transaction)?;

                    // Advance to the next block.
                    let next_block = ledger.advance_to_next_block()?;
                    println!(
                        "Block {}: {}",
                        next_block.height(),
                        serde_json::to_string_pretty(&next_block)?
                    );
                }
            }
        }
    }
}
