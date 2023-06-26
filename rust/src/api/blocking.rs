// Copyright (C) 2019-2023 Aleo Systems Inc.
// This file is part of the Aleo SDK library.

// The Aleo SDK library is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// The Aleo SDK library is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with the Aleo SDK library. If not, see <https://www.gnu.org/licenses/>.

use super::*;

#[cfg(not(feature = "async"))]
#[allow(clippy::type_complexity)]
impl<N: Network> AleoAPIClient<N> {
    /// Get the latest block height
    pub fn latest_height(&self) -> Result<u32> {
        let url = format!("{}/{}/latest/height", self.base_url, self.network_id);
        match self.client.get(&url).call()?.into_json() {
            Ok(height) => Ok(height),
            Err(error) => bail!("Failed to parse the latest block height: {error}"),
        }
    }

    /// Get the latest block hash
    pub fn latest_hash(&self) -> Result<N::BlockHash> {
        let url = format!("{}/{}/latest/hash", self.base_url, self.network_id);
        match self.client.get(&url).call()?.into_json() {
            Ok(hash) => Ok(hash),
            Err(error) => bail!("Failed to parse the latest block hash: {error}"),
        }
    }

    /// Get the latest block
    pub fn latest_block(&self) -> Result<Block<N>> {
        let url = format!("{}/{}/latest/block", self.base_url, self.network_id);
        match self.client.get(&url).call()?.into_json() {
            Ok(block) => Ok(block),
            Err(error) => bail!("Failed to parse the latest block: {error}"),
        }
    }

    /// Get the block matching the specific height from the network
    pub fn get_block(&self, height: u32) -> Result<Block<N>> {
        let url = format!("{}/{}/block/{height}", self.base_url, self.network_id);
        match self.client.get(&url).call()?.into_json() {
            Ok(block) => Ok(block),
            Err(error) => bail!("Failed to parse block {height}: {error}"),
        }
    }

    /// Get a range of blocks from the network (limited 50 blocks at a time)
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

    /// Retrieve a transaction by via its transaction id
    pub fn get_transaction(&self, transaction_id: N::TransactionID) -> Result<Transaction<N>> {
        let url = format!("{}/{}/transaction/{transaction_id}", self.base_url, self.network_id);
        match self.client.get(&url).call()?.into_json() {
            Ok(transaction) => Ok(transaction),
            Err(error) => bail!("Failed to parse transaction '{transaction_id}': {error}"),
        }
    }

    /// Get pending transactions currently in the mempool.
    pub fn get_memory_pool_transactions(&self) -> Result<Vec<Transaction<N>>> {
        let url = format!("{}/{}/memoryPool/transactions", self.base_url, self.network_id);
        match self.client.get(&url).call()?.into_json() {
            Ok(transactions) => Ok(transactions),
            Err(error) => bail!("Failed to parse memory pool transactions: {error}"),
        }
    }

    /// Get a program from the network by its ID. This method will return an error if it does not exist.
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

    /// Get all mappings associated with a program.
    pub fn get_program_mappings(&self, program_id: impl TryInto<ProgramID<N>>) -> Result<Vec<Identifier<N>>> {
        // Prepare the program ID.
        let program_id = program_id.try_into().map_err(|_| anyhow!("Invalid program ID"))?;
        // Perform the request.
        let url = format!("{}/{}/program/{program_id}/mappings", self.base_url, self.network_id);
        match self.client.get(&url).call()?.into_json() {
            Ok(program_mappings) => Ok(program_mappings),
            Err(error) => bail!("Failed to parse program {program_id}: {error}"),
        }
    }

    /// Get the current value of a mapping given a specific program, mapping name, and mapping key
    pub fn get_mapping_value(
        &self,
        program_id: impl TryInto<ProgramID<N>>,
        mapping_name: impl TryInto<Identifier<N>>,
        key: impl TryInto<Plaintext<N>>,
    ) -> Result<Value<N>> {
        // Prepare the program ID.
        let program_id = program_id.try_into().map_err(|_| anyhow!("Invalid program ID"))?;
        // Prepare the mapping name.
        let mapping_name = mapping_name.try_into().map_err(|_| anyhow!("Invalid mapping name"))?;
        // Prepare the key.
        let key = key.try_into().map_err(|_| anyhow!("Invalid key"))?;
        // Perform the request.
        let url = format!("{}/{}/program/{program_id}/mapping/{mapping_name}/{key}", self.base_url, self.network_id);
        match self.client.get(&url).call()?.into_json() {
            Ok(transition_id) => Ok(transition_id),
            Err(error) => bail!("Failed to parse transition ID: {error}"),
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
    ) -> Result<Vec<(Field<N>, Record<N, Plaintext<N>>)>> {
        let view_key = ViewKey::try_from(private_key)?;
        let address_x_coordinate = view_key.to_address().to_x_coordinate();

        let step_size = 49;
        let required_amounts = if let Some(amounts) = specified_amounts {
            ensure!(!amounts.is_empty(), "If specific amounts are specified, there must be one amount specified");
            let mut required_amounts = amounts.clone();
            required_amounts.sort_by(|a, b| b.cmp(a));
            required_amounts
        } else {
            vec![]
        };

        ensure!(
            block_heights.start < block_heights.end,
            "The start block height must be less than the end block height"
        );

        // Initialize a vector for the records.
        let mut records = vec![];

        let mut total_gates = 0u64;
        let mut end_height = block_heights.end;
        let mut start_height = block_heights.end.saturating_sub(step_size);

        for _ in (block_heights.start..block_heights.end).step_by(step_size as usize) {
            println!("Searching blocks {} to {} for records...", start_height, end_height);
            // Get blocks
            let records_iter =
                self.get_blocks(start_height, end_height)?.into_iter().flat_map(|block| block.into_records());

            // Search in reverse order from the latest block to the earliest block
            end_height = start_height;
            start_height = start_height.saturating_sub(step_size);
            if start_height < block_heights.start {
                start_height = block_heights.start
            };
            // Filter the records by the view key.
            records.extend(records_iter.filter_map(|(commitment, record)| {
                match record.is_owner_with_address_x_coordinate(&view_key, &address_x_coordinate) {
                    true => {
                        let sn = Record::<N, Ciphertext<N>>::serial_number(*private_key, commitment).ok()?;
                        if self.find_transition_id(sn).is_err() {
                            let record = record.decrypt(&view_key);
                            if let Ok(record) = record {
                                total_gates += record.microcredits().unwrap_or(0);
                                Some((commitment, record))
                            } else {
                                None
                            }
                        } else {
                            None
                        }
                    }
                    false => None,
                }
            }));
            // If a maximum number of gates is specified, stop searching when the total gates
            // exceeds the specified limit
            if max_gates.is_some() && total_gates >= max_gates.unwrap() {
                break;
            }
            // If a list of specified amounts is specified, stop searching when records matching
            // those amounts are found
            if !required_amounts.is_empty() {
                records.sort_by(|a, b| b.1.microcredits().unwrap_or(0).cmp(&a.1.microcredits().unwrap_or(0)));
                let mut found_indices = std::collections::HashSet::<usize>::new();
                required_amounts.iter().for_each(|amount| {
                    for (pos, record) in records.iter().enumerate() {
                        if !found_indices.contains(&pos) && record.1.microcredits().unwrap_or(0) >= *amount {
                            found_indices.insert(pos);
                        }
                    }
                });
                if found_indices.len() >= required_amounts.len() {
                    let found_records = records[0..required_amounts.len()].to_vec();
                    return Ok(found_records);
                }
            }
        }
        if !required_amounts.is_empty() {
            bail!(
                "Could not find enough records with the specified amounts, consider splitting records into smaller amounts"
            );
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
                    Transaction::Fee(..) => {
                        bail!("❌ Failed to broadcast fee execution to {}: {}", &url, error_message)
                    }
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

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
    #[ignore]
    fn test_mappings_query() {
        let client = AleoAPIClient::<Testnet3>::local_testnet3("3030");
        let mappings = client.get_program_mappings("credits.aleo").unwrap();
        // Assert there's only one mapping in credits.aleo
        assert_eq!(mappings.len(), 1);

        let identifier = mappings[0];
        // Assert the identifier is "account"
        assert_eq!(identifier.to_string(), "account");
    }
}
