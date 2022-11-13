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

use super::*;

impl<N: Network> Client<N> {
    pub async fn latest_height(&self) -> Result<u32> {
        let url = format!("{}/testnet3/latest/height", self.base_url);
        match self.client.get(url).send().await?.json().await {
            Ok(height) => Ok(height),
            Err(error) => bail!("Failed to parse the latest block height: {error}"),
        }
    }

    pub async fn latest_hash(&self) -> Result<N::BlockHash> {
        let url = format!("{}/testnet3/latest/hash", self.base_url);
        match self.client.get(url).send().await?.json().await {
            Ok(hash) => Ok(hash),
            Err(error) => bail!("Failed to parse the latest block hash: {error}"),
        }
    }

    pub async fn latest_block(&self) -> Result<Block<N>> {
        let url = format!("{}/testnet3/latest/block", self.base_url);
        match self.client.get(url).send().await?.json().await {
            Ok(block) => Ok(block),
            Err(error) => bail!("Failed to parse the latest block: {error}"),
        }
    }

    pub async fn get_block(&self, height: u32) -> Result<Block<N>> {
        let url = format!("{}/testnet3/block/{height}", self.base_url);
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

        let url = format!("{}/testnet3/blocks?start={start_height}&end={end_height}", self.base_url);
        match self.client.get(url).send().await?.json().await {
            Ok(blocks) => Ok(blocks),
            Err(error) => {
                bail!("Failed to parse blocks {start_height} (inclusive) to {end_height} (exclusive): {error}")
            }
        }
    }

    pub async fn get_transaction(&self, transaction_id: N::TransactionID) -> Result<Block<N>> {
        let url = format!("{}/testnet3/transaction/{transaction_id}", self.base_url);
        match self.client.get(url).send().await?.json().await {
            Ok(block) => Ok(block),
            Err(error) => bail!("Failed to parse transaction '{transaction_id}': {error}"),
        }
    }

    pub async fn get_memory_pool_transactions(&self) -> Result<Block<N>> {
        let url = format!("{}/testnet3/memoryPool/transactions", self.base_url);
        match self.client.get(url).send().await?.json().await {
            Ok(block) => Ok(block),
            Err(error) => bail!("Failed to parse memory pool transactions: {error}"),
        }
    }

    pub async fn get_program(&self, program_id: impl TryInto<ProgramID<N>>) -> Result<Program<N>> {
        // Prepare the program ID.
        let program_id = program_id.try_into().map_err(|_| anyhow!("Invalid program ID"))?;
        // Perform the request.
        let url = format!("{}/testnet3/program/{program_id}", self.base_url);
        match self.client.get(url).send().await?.json().await {
            Ok(program) => Ok(program),
            Err(error) => bail!("Failed to parse program {program_id}: {error}"),
        }
    }

    pub async fn transaction_broadcast(&self, transaction: Transaction<N>) -> Result<Block<N>> {
        let url = format!("{}/testnet3/transaction/broadcast", self.base_url);
        match self.client.post(url).body(serde_json::to_string(&transaction)?).send().await?.json().await {
            Ok(block) => Ok(block),
            Err(error) => bail!("Failed to parse memory pool transactions: {error}"),
        }
    }
}
