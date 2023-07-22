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
use snarkvm_console::account::Group;

/// Helper struct for finding records on chain during program development
#[derive(Clone)]
pub struct RecordFinder<N: Network> {
    api_client: AleoAPIClient<N>,
}

impl<N: Network> RecordFinder<N> {
    pub fn new(api_client: AleoAPIClient<N>) -> Self {
        Self { api_client }
    }

    /// Resolve two records for a transfer amount and fee respectively
    ///
    /// Basic Usage:
    /// let (amount_record, fee_record) = self.resolve_amount_and_fee(amount, fee, private_key);
    #[allow(clippy::type_complexity)]
    pub fn find_amount_and_fee_records(
        &self,
        amount: u64,
        fee: u64,
        private_key: &PrivateKey<N>,
    ) -> Result<(Record<N, Plaintext<N>>, Record<N, Plaintext<N>>)> {
        let records = self.find_record_amounts(vec![amount, fee], private_key)?;
        if records.len() < 2 { bail!("Insufficient funds") } else { Ok((records[0].clone(), records[1].clone())) }
    }

    /// Resolve a record with a specific value. If successful it will return a record with a gate
    /// value equal to or greater than the specified amount.
    pub fn find_one_record(
        &self,
        private_key: &PrivateKey<N>,
        amount: u64,
        found_nonces: Option<&[Group<N>]>,
    ) -> Result<Record<N, Plaintext<N>>> {
        let step_size = 49u32;
        let amounts = Some(vec![amount]);
        let current_height = self.api_client.latest_height()?;
        let mut end_height = current_height;
        let mut start_height = end_height.saturating_sub(49);
        for _ in (0..current_height).step_by(step_size as usize) {
            let result = self
                .api_client
                .get_unspent_records(private_key, start_height..end_height, None, amounts.as_ref())
                .map_or(vec![], |records| records)
                .into_iter()
                .find(|(_, record)| {
                    record.microcredits().unwrap_or(0) >= amount && {
                        if let Some(found_nonces) = found_nonces {
                            !found_nonces.contains(record.nonce())
                        } else {
                            true
                        }
                    }
                })
                .ok_or_else(|| anyhow!("Insufficient funds"));

            if let Ok(record) = result {
                return Ok(record.1);
            }
            end_height = start_height;
            start_height = start_height.saturating_sub(step_size);
        }
        bail!("Insufficient funds")
    }

    /// Attempt to resolve records with specific gate values specified as a vector of u64s. If the
    /// function is successful at resolving the records, it will return a vector of records with
    /// microcredits equal to or greater than the specified amounts. If it cannot resolve records
    /// with the specified amounts, it will return an error.
    pub fn find_record_amounts(
        &self,
        amounts: Vec<u64>,
        private_key: &PrivateKey<N>,
    ) -> Result<Vec<Record<N, Plaintext<N>>>> {
        self.find_unspent_records_on_chain(Some(&amounts), None, private_key)
    }

    pub fn find_unspent_records_on_chain(
        &self,
        amounts: Option<&Vec<u64>>,
        max_microcredits: Option<u64>,
        private_key: &PrivateKey<N>,
    ) -> Result<Vec<Record<N, Plaintext<N>>>> {
        let latest_height = self.api_client.latest_height()?;
        let records = self.api_client.get_unspent_records(private_key, 0..latest_height, max_microcredits, amounts)?;
        Ok(records.into_iter().map(|(_, record)| record).collect())
    }

    /// Find matching records from a program using a user-specified function to match records
    pub fn find_matching_records_from_program(
        &self,
        private_key: &PrivateKey<N>,
        program_id: &ProgramID<N>,
        matching_function: impl FnOnce(Vec<Record<N, Plaintext<N>>>) -> Result<Vec<Record<N, Plaintext<N>>>>,
        unspent_only: bool,
        max_records: Option<usize>,
    ) -> Result<Vec<Record<N, Plaintext<N>>>> {
        let latest_height = self.api_client.latest_height()?;
        let view_key = ViewKey::try_from(private_key)?;
        let records = self.api_client.get_program_records(
            private_key,
            program_id,
            0..latest_height,
            unspent_only,
            max_records,
        )?;
        let decrypted_records =
            records.into_iter().map(|(_, record)| record.decrypt(&view_key).unwrap()).collect::<Vec<_>>();
        matching_function(decrypted_records)
    }
}
