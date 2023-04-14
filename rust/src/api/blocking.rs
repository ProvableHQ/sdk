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
use snarkvm::{
    console::{
        account::{PrivateKey, ViewKey},
        program::{Ciphertext, Network, ProgramID, Record},
        types::Field,
    },
    synthesizer::{Block, Program, Transaction},
};

use anyhow::{anyhow, bail, ensure, Result};
use std::{convert::TryInto, ops::Range};

#[cfg(not(feature = "async"))]
#[allow(clippy::type_complexity)]
impl<N: Network> AleoAPIClient<N> {
    pub fn latest_height(&self) -> Result<u32> {
        let url = format!("{}/{}/latest/height", self.base_url, self.network_id);
        match self.client.get(&url).call()?.into_json() {
            Ok(height) => Ok(height),
            Err(error) => bail!("Failed to parse the latest block height: {error}"),
        }
    }

    pub fn latest_hash(&self) -> Result<N::BlockHash> {
        let url = format!("{}/{}/latest/hash", self.base_url, self.network_id);
        match self.client.get(&url).call()?.into_json() {
            Ok(hash) => Ok(hash),
            Err(error) => bail!("Failed to parse the latest block hash: {error}"),
        }
    }

    pub fn latest_block(&self) -> Result<Block<N>> {
        let url = format!("{}/{}/latest/block", self.base_url, self.network_id);
        match self.client.get(&url).call()?.into_json() {
            Ok(block) => Ok(block),
            Err(error) => bail!("Failed to parse the latest block: {error}"),
        }
    }

    pub fn get_block(&self, height: u32) -> Result<Block<N>> {
        let url = format!("{}/{}/block/{height}", self.base_url, self.network_id);
        match self.client.get(&url).call()?.into_json() {
            Ok(block) => Ok(block),
            Err(error) => bail!("Failed to parse block {height}: {error}"),
        }
    }

    pub fn get_blocks(&self, start_height: u32, end_height: u32) -> Result<Vec<Block<N>>> {
        if start_height >= end_height {
            bail!("Start height must be less than end height");
        } else if end_height - start_height > 50 {
            bail!("Cannot request more than 50 blocks at a time");
        }

        let url = format!("{}/{}/blocks?start={start_height}&end={end_height}", self.base_url, self.network_id);
        match self.client.get(&url).call()?.into_json() {
            Ok(blocks) => Ok(blocks),
            Err(error) => {
                bail!("Failed to parse blocks {start_height} (inclusive) to {end_height} (exclusive): {error}")
            }
        }
    }

    pub fn get_transaction(&self, transaction_id: N::TransactionID) -> Result<Transaction<N>> {
        let url = format!("{}/{}/transaction/{transaction_id}", self.base_url, self.network_id);
        match self.client.get(&url).call()?.into_json() {
            Ok(transaction) => Ok(transaction),
            Err(error) => bail!("Failed to parse transaction '{transaction_id}': {error}"),
        }
    }

    pub fn get_memory_pool_transactions(&self) -> Result<Vec<Transaction<N>>> {
        let url = format!("{}/{}/memoryPool/transactions", self.base_url, self.network_id);
        match self.client.get(&url).call()?.into_json() {
            Ok(transactions) => Ok(transactions),
            Err(error) => bail!("Failed to parse memory pool transactions: {error}"),
        }
    }

    pub fn get_program(&self, program_id: impl TryInto<ProgramID<N>>) -> Result<Program<N>> {
        // Prepare the program ID.
        let program_id = program_id.try_into().map_err(|_| anyhow!("Invalid program ID"))?;
        // Perform the request.
        let url = format!("{}/{}/program/{program_id}", self.base_url, self.network_id);
        match self.client.get(&url).call()?.into_json() {
            Ok(program) => Ok(program),
            Err(error) => bail!("Failed to parse program {program_id}: {error}"),
        }
    }

    pub fn find_block_hash(&self, transaction_id: N::TransactionID) -> Result<N::BlockHash> {
        let url = format!("{}/{}/find/blockHash/{transaction_id}", self.base_url, self.network_id);
        match self.client.get(&url).call()?.into_json() {
            Ok(hash) => Ok(hash),
            Err(error) => bail!("Failed to parse block hash: {error}"),
        }
    }

    /// Returns the transition ID that contains the given `input ID` or `output ID`.
    pub fn find_transition_id(&self, input_or_output_id: Field<N>) -> Result<N::TransitionID> {
        let url = format!("{}/{}/find/transitionID/{input_or_output_id}", self.base_url, self.network_id);
        match self.client.get(&url).call()?.into_json() {
            Ok(transition_id) => Ok(transition_id),
            Err(error) => bail!("Failed to parse transition ID: {error}"),
        }
    }

    /// Scans the ledger for records that match the given view key.
    pub fn scan(
        &self,
        view_key: impl TryInto<ViewKey<N>>,
        block_heights: Range<u32>,
        max_records: Option<usize>,
    ) -> Result<Vec<(Field<N>, Record<N, Ciphertext<N>>)>> {
        // Prepare the view key.
        let view_key = view_key.try_into().map_err(|_| anyhow!("Invalid view key"))?;
        // Compute the x-coordinate of the address.
        let address_x_coordinate = view_key.to_address().to_x_coordinate();

        // Prepare the starting block height, by rounding down to the nearest step of 50.
        let start_block_height = block_heights.start - (block_heights.start % 50);
        // Prepare the ending block height, by rounding up to the nearest step of 50.
        let end_block_height = block_heights.end + (50 - (block_heights.end % 50));

        // Initialize a vector for the records.
        let mut records = Vec::new();

        for start_height in (start_block_height..end_block_height).step_by(50) {
            println!("Searching blocks {} to {} for records...", start_height, end_block_height);
            if start_height >= block_heights.end {
                break;
            }
            let end = start_height + 50;
            let end_height = if end > block_heights.end { block_heights.end } else { end };

            // Prepare the URL.
            let records_iter =
                self.get_blocks(start_height, end_height)?.into_iter().flat_map(|block| block.into_records());

            // Filter the records by the view key.
            records.extend(records_iter.filter_map(|(commitment, record)| {
                match record.is_owner_with_address_x_coordinate(&view_key, &address_x_coordinate) {
                    true => Some((commitment, record)),
                    false => None,
                }
            }));

            if records.len() >= max_records.unwrap_or(usize::MAX) {
                break;
            }
        }

        Ok(records)
    }

    /// Search for unspent records in the ledger
    pub fn get_unspent_records(
        &self,
        private_key: &PrivateKey<N>,
        block_heights: Range<u32>,
        max_gates: Option<u64>,
        specified_amounts: Option<&Vec<u64>>,
    ) -> Result<Vec<(Field<N>, Record<N, Ciphertext<N>>)>> {
        let view_key = ViewKey::try_from(private_key)?;
        let address_x_coordinate = view_key.to_address().to_x_coordinate();

        ensure!(
            block_heights.start < block_heights.end,
            "The start block height must be less than the end block height"
        );

        // Initialize a vector for the records.
        let mut records = Vec::new();

        let mut total_gates = 0u64;
        let mut end_height = block_heights.end;
        let mut start_height = block_heights.end.saturating_sub(50);

        for _ in (block_heights.start..block_heights.end).step_by(50) {
            println!("Searching blocks {} to {} for records...", start_height, end_height);
            // Get blocks
            let records_iter =
                self.get_blocks(start_height, end_height)?.into_iter().flat_map(|block| block.into_records());

            // Search in reverse order from the latest block to the earliest block
            end_height = start_height;
            start_height = start_height.saturating_sub(50);
            if start_height < block_heights.start {
                start_height = block_heights.start
            };

            // Filter the records by the view key.
            records.extend(records_iter.filter_map(|(commitment, record)| {
                match record.is_owner_with_address_x_coordinate(&view_key, &address_x_coordinate) {
                    true => {
                        let sn = Record::<N, Ciphertext<N>>::serial_number(*private_key, commitment).ok()?;
                        if self.find_transition_id(sn).is_err() {
                            if max_gates.is_some() {
                                let _ = record
                                    .decrypt(&view_key)
                                    .map(|record| {
                                        total_gates += ***record.gates();
                                        record
                                    })
                                    .ok();
                            }
                            Some((commitment, record))
                        } else {
                            None
                        }
                    }
                    false => None,
                }
            }));
            // If a maximum number of gates is specified, stop searching when the total gates
            // exceeds the specified limit
            if max_gates.is_some() && total_gates > max_gates.unwrap() {
                break;
            }
            // If a list of specified amounts is specified, stop searching when records matching
            // those amounts are found
            if let Some(specified_amounts) = specified_amounts {
                let found_records = specified_amounts
                    .iter()
                    .filter_map(|amount| {
                        let position = records.iter().position(|(_, record)| {
                            if let Ok(decrypted_record) = record.decrypt(&view_key) {
                                ***decrypted_record.gates() > *amount
                            } else {
                                false
                            }
                        });
                        position.map(|index| records.remove(index))
                    })
                    .collect::<Vec<_>>();
                if found_records.len() >= specified_amounts.len() {
                    return Ok(found_records);
                }
            }
        }

        Ok(records)
    }

    /// Broadcast a deploy or execute transaction to the Aleo network
    pub fn transaction_broadcast(&self, transaction: Transaction<N>) -> Result<String> {
        let url = format!("{}/{}/transaction/broadcast", self.base_url, self.network_id);
        match self.client.post(&url).send_json(&transaction) {
            Ok(response) => match response.into_string() {
                Ok(success_response) => Ok(success_response),
                Err(error) => bail!("❌ Transaction response was malformed {}", error),
            },
            Err(error) => {
                let error_message = match error {
                    ureq::Error::Status(code, response) => {
                        format!("(status code {code}: {:?})", response.into_string()?)
                    }
                    ureq::Error::Transport(err) => format!("({err})"),
                };

                match transaction {
                    Transaction::Deploy(..) => {
                        bail!("❌ Failed to deploy program to {}: {}", &url, error_message)
                    }
                    Transaction::Execute(..) => {
                        bail!("❌ Failed to broadcast execution to {}: {}", &url, error_message)
                    }
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use snarkvm_console::{account::PrivateKey, network::Testnet3};

    use std::{convert::TryFrom, str::FromStr};

    type N = Testnet3;

    #[test]
    fn test_api_get_blocks() {
        let client = AleoAPIClient::<Testnet3>::testnet3();
        let blocks = client.get_blocks(0, 3).unwrap();

        // Check height matches
        assert_eq!(blocks[0].height(), 0);
        assert_eq!(blocks[1].height(), 1);
        assert_eq!(blocks[2].height(), 2);

        // Check block hashes
        assert_eq!(blocks[1].previous_hash(), blocks[0].hash());
        assert_eq!(blocks[2].previous_hash(), blocks[1].hash());
    }

    #[test]
    fn test_scan() {
        // Initialize the api client
        let client = AleoAPIClient::<Testnet3>::testnet3();

        // Derive the view key.
        let private_key =
            PrivateKey::<N>::from_str("APrivateKey1zkp5fCUVzS9b7my34CdraHBF9XzB58xYiPzFJQvjhmvv7A8").unwrap();
        let view_key = ViewKey::<N>::try_from(&private_key).unwrap();

        // Scan the ledger at this range.
        let records = client.scan(private_key, 14200..14250, None).unwrap();
        assert_eq!(records.len(), 1);

        // Check the commitment.
        let (commitment, record) = records[0].clone();
        assert_eq!(
            commitment.to_string(),
            "310298409899964034200900546312426933043797406211272306332560156413249565239field"
        );

        // Decrypt the record.
        let record = record.decrypt(&view_key).unwrap();
        let expected = r"{
  owner: aleo18x0yenrkceapvt85e6aqw2v8hq37hpt4ew6k6cgum6xlpmaxt5xqwnkuja.private,
  gates: 1099999999999864u64.private,
  _nonce: 3859911413360468505092363429199432421222291175370483298628506550397056121761group.public
}";
        assert_eq!(record.to_string(), expected);
    }
}
