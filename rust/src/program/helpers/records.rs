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
    pub fn find_one_record(&self, private_key: &PrivateKey<N>, amount: u64) -> Result<Record<N, Plaintext<N>>> {
        let amounts = vec![amount];
        self.find_unspent_records_on_chain(Some(&amounts), None, private_key)?
            .into_iter()
            .find(|record| record.microcredits().unwrap_or(0) >= amount)
            .ok_or_else(|| anyhow!("Insufficient funds"))
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
}
