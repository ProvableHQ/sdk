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

use crate::{ProgramManager, Resolver};
use anyhow::{anyhow, bail, Result};
use snarkvm_console::{
    account::PrivateKey,
    program::{Network, Plaintext, Record},
};

impl<N: Network, R: Resolver<N>> ProgramManager<N, R> {
    /// Resolve a record with a specific value. If successful it will return a record with a gate
    /// value equal to or greater than the specified amount.
    pub fn resolve_one_record_above_amount(
        &self,
        private_key: Option<&PrivateKey<N>>,
        amount: u64,
    ) -> Result<Record<N, Plaintext<N>>> {
        let amounts = vec![amount];
        self.resolver
            .find_owned_records(Some(&amounts), private_key)?
            .into_iter()
            .find(|record| ***record.gates() >= amount)
            .ok_or_else(|| anyhow!("Insufficient funds"))
    }

    /// Attempt to resolve records with specific gate values specified as a vector of u64s. If the
    /// function is successful at resolving the records, it will return a vector of records with
    /// gates equal to or greater than the specified amounts. If it cannot resolve records
    /// with the specified amounts, it will return an error.
    #[allow(clippy::unnecessary_filter_map)]
    pub fn resolve_specific_record_amounts(
        &self,
        amounts: Vec<u64>,
        private_key: Option<&PrivateKey<N>>,
    ) -> Result<Vec<Record<N, Plaintext<N>>>> {
        let records = self.resolver.find_owned_records(Some(&amounts), private_key)?;
        let found_records = amounts
            .iter()
            .filter_map(|amount| {
                records
                    .iter()
                    .filter_map(|record| if ***record.gates() >= *amount { Some(record) } else { None })
                    .take(1)
                    .collect::<Vec<_>>()
                    .pop()
            })
            .collect::<Vec<_>>();
        if records.len() >= amounts.len() {
            Ok(found_records.into_iter().cloned().collect())
        } else {
            bail!("Insufficient funds")
        }
    }

    /// Resolve two records for a transfer amount and fee respectively
    ///
    /// Basic Usage:
    /// let (amount_record, fee_record) = self.resolve_amount_and_fee(amount, fee, private_key);
    #[allow(clippy::type_complexity)]
    pub fn resolve_amount_and_fee(
        &self,
        amount: u64,
        fee: u64,
        private_key: Option<&PrivateKey<N>>,
    ) -> Result<(Record<N, Plaintext<N>>, Record<N, Plaintext<N>>)> {
        self.resolve_specific_record_amounts(vec![amount, fee], private_key)
            .map(|records| (records[0].clone(), records[1].clone()))
    }

    // Internal convenience method to resolve fees and amounts from parameters
    #[allow(clippy::type_complexity)]
    pub(crate) fn resolve_amount_and_fee_from_parameters(
        &self,
        amount: u64,
        fee: u64,
        transfer_amount_record: Option<Record<N, Plaintext<N>>>,
        fee_record: Option<Record<N, Plaintext<N>>>,
        private_key: &PrivateKey<N>,
    ) -> Result<(Record<N, Plaintext<N>>, Option<(Record<N, Plaintext<N>>, u64)>)> {
        let (transfer_amount_record, fee_record) = match (transfer_amount_record, fee_record) {
            // If both records are provided, return them
            (Some(transfer_amount_record), Some(fee_record)) => (transfer_amount_record, Some((fee_record, fee))),
            // If only the transfer amount record is provided, resolve the fee record
            (Some(transfer_amount_record), None) => {
                if fee > 0 {
                    let fee_record = self.resolve_one_record_above_amount(Some(private_key), fee)?;
                    (transfer_amount_record, Some((fee_record, fee)))
                } else {
                    (transfer_amount_record, None)
                }
            }
            // If only the fee record is provided, resolve the transfer amount record
            (None, Some(fee_record)) => {
                (self.resolve_one_record_above_amount(Some(private_key), amount)?, Some((fee_record, fee)))
            }
            // If neither record is provided, resolve both
            (None, None) => {
                if fee > 0 {
                    let (transfer_amount_record, fee_record) =
                        self.resolve_amount_and_fee(amount, fee, Some(private_key))?;
                    (transfer_amount_record, Some((fee_record, fee)))
                } else {
                    (self.resolve_one_record_above_amount(Some(private_key), amount)?, None)
                }
            }
        };
        Ok((transfer_amount_record, fee_record))
    }
}
