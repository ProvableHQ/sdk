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

use crate::AleoAPIClient;

use anyhow::{anyhow, bail, Result};
use snarkvm::{
    console::{
        program::{Network, ProgramID},
        types::Field,
    },
    synthesizer::{Block, Program, Transaction},
};
use std::convert::TryInto;

impl<N: Network> AleoAPIClient<N> {
    pub async fn latest_height(&self) -> Result<u32> {
        let url = format!("{}/{}/latest/height", self.base_url, self.chain);
        match self.client.get(url).send().await?.json().await {
            Ok(height) => Ok(height),
            Err(error) => bail!("Failed to parse the latest block height: {error}"),
        }
    }

    pub async fn latest_hash(&self) -> Result<N::BlockHash> {
        let url = format!("{}/{}/latest/hash", self.base_url, self.chain);
        match self.client.get(url).send().await?.json().await {
            Ok(hash) => Ok(hash),
            Err(error) => bail!("Failed to parse the latest block hash: {error}"),
        }
    }

    pub async fn latest_block(&self) -> Result<Block<N>> {
        let url = format!("{}/{}/latest/block", self.base_url, self.chain);
        match self.client.get(url).send().await?.json().await {
            Ok(block) => Ok(block),
            Err(error) => bail!("Failed to parse the latest block: {error}"),
        }
    }

    pub async fn get_block(&self, height: u32) -> Result<Block<N>> {
        let url = format!("{}/{}/block/{height}", self.base_url, self.chain);
        match self.client.get(url).send().await?.json().await {
            Ok(block) => Ok(block),
            Err(error) => bail!("Failed to parse block {height}: {error}"),
        }
    }

    pub async fn get_blocks(&self, start_height: u32, end_height: u32) -> Result<Vec<Block<N>>> {
        if start_height >= end_height {
            bail!("Start height must be less than end height");
        } else if end_height - start_height > 50 {
            bail!("Cannot request more than 50 blocks at a time");
        }

        let url = format!("{}/{}/blocks?start={start_height}&end={end_height}", self.base_url, self.chain);
        match self.client.get(url).send().await?.json().await {
            Ok(blocks) => Ok(blocks),
            Err(error) => {
                bail!("Failed to parse blocks {start_height} (inclusive) to {end_height} (exclusive): {error}")
            }
        }
    }

    pub async fn get_transaction(&self, transaction_id: N::TransactionID) -> Result<Transaction<N>> {
        let url = format!("{}/{}/transaction/{transaction_id}", self.base_url, self.chain);
        match self.client.get(url).send().await?.json().await {
            Ok(transaction) => Ok(transaction),
            Err(error) => bail!("Failed to parse transaction '{transaction_id}': {error}"),
        }
    }

    pub async fn get_memory_pool_transactions(&self) -> Result<Vec<Transaction<N>>> {
        let url = format!("{}/{}/memoryPool/transactions", self.base_url, self.chain);
        match self.client.get(url).send().await?.json().await {
            Ok(transactions) => Ok(transactions),
            Err(error) => bail!("Failed to parse memory pool transactions: {error}"),
        }
    }

    pub async fn get_program(&self, program_id: impl TryInto<ProgramID<N>>) -> Result<Program<N>> {
        // Prepare the program ID.
        let program_id = program_id.try_into().map_err(|_| anyhow!("Invalid program ID"))?;
        // Perform the request.
        let url = format!("{}/{}/program/{program_id}", self.base_url, self.chain);
        match self.client.get(url).send().await?.json().await {
            Ok(program) => Ok(program),
            Err(error) => bail!("Failed to parse program {program_id}: {error}"),
        }
    }

    pub async fn find_block_hash(&self, transaction_id: N::TransactionID) -> Result<N::BlockHash> {
        let url = format!("{}/{}/find/blockHash/{transaction_id}", self.base_url, self.chain);
        match self.client.get(url).send().await?.json().await {
            Ok(hash) => Ok(hash),
            Err(error) => bail!("Failed to parse block hash: {error}"),
        }
    }

    /// Returns the transition ID that contains the given `input ID` or `output ID`.
    pub async fn find_transition_id(&self, input_or_output_id: Field<N>) -> Result<N::TransitionID> {
        let url = format!("{}/{}/find/transitionID/{input_or_output_id}", self.base_url, self.chain);
        match self.client.get(url).send().await?.json().await {
            Ok(transition_id) => Ok(transition_id),
            Err(error) => bail!("Failed to parse transition ID: {error}"),
        }
    }

    pub async fn transaction_broadcast(&self, transaction: Transaction<N>) -> Result<Block<N>> {
        let url = format!("{}/{}/transaction/broadcast", self.base_url, self.chain);
        match self.client.post(url).body(serde_json::to_string(&transaction)?).send().await?.json().await {
            Ok(block) => Ok(block),
            Err(error) => bail!("Failed to parse memory pool transactions: {error}"),
        }
    }
}
