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

use crate::{ProgramManager, RecordQuery, Resolver};
use anyhow::{anyhow, bail, Result};
use snarkvm_console::{
    account::PrivateKey,
    program::{Network, Plaintext, Record},
};

impl<N: Network, R: Resolver<N>> ProgramManager<N, R> {
    /// Resolve a record with a specific value.
    pub fn resolve_one_record_above_amount(
        &self,
        private_key: &PrivateKey<N>,
        amount: u64,
        record_query: &RecordQuery,
    ) -> Result<Record<N, Plaintext<N>>> {
        self.resolver
            .find_owned_records(private_key, record_query)?
            .into_iter()
            .find(|record| ***record.gates() >= amount)
            .ok_or_else(|| anyhow!("Insufficient funds"))
    }

    /// Resolve a record with specific values
    pub fn resolve_specific_record_amounts(
        &self,
        amounts: Vec<u64>,
        private_key: &PrivateKey<N>,
        record_query: &RecordQuery,
    ) -> Result<Vec<Record<N, Plaintext<N>>>> {
        let records = self.resolver.find_owned_records(private_key, record_query)?;
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
            Ok(found_records.into_iter().map(|record| record.clone()).collect())
        } else {
            bail!("Insufficient funds")
        }
    }

    /// Resolve record for a transfer amount and fee
    pub fn resolve_amount_and_fee(
        &self,
        amount: u64,
        fee: u64,
        private_key: &PrivateKey<N>,
        record_query: &RecordQuery,
    ) -> Result<(Record<N, Plaintext<N>>, Record<N, Plaintext<N>>)> {
        self.resolve_specific_record_amounts(vec![amount, fee], private_key, record_query)
            .map(|records| (records[0].clone(), records[1].clone()))
    }

    /// Resolve records for a transfer amount and fee based on passed options
    pub fn resolve_amount_and_fee_from_parameters(
        &self,
        amount: u64,
        fee: u64,
        input_record: Option<Record<N, Plaintext<N>>>,
        fee_record: Option<Record<N, Plaintext<N>>>,
        private_key: &PrivateKey<N>,
        record_query: &RecordQuery,
    ) -> Result<(Record<N, Plaintext<N>>, Option<(Record<N, Plaintext<N>>, u64)>)> {
        let (input_record, fee_record) = match (input_record, fee_record) {
            (Some(input_record), Some(fee_record)) => (input_record, Some((fee_record, fee))),
            (Some(input_record), None) => {
                if fee > 0 {
                    let fee_record = self.resolve_one_record_above_amount(&private_key, fee, record_query)?;
                    (input_record, Some((fee_record, fee)))
                } else {
                    (input_record, None)
                }
            }
            (None, Some(fee_record)) => {
                (self.resolve_one_record_above_amount(&private_key, amount, record_query)?, Some((fee_record, fee)))
            }
            (None, None) => {
                if fee > 0 {
                    let (input_record, fee_record) =
                        self.resolve_amount_and_fee(amount, fee, &private_key, record_query)?;
                    (input_record, Some((fee_record, fee)))
                } else {
                    (self.resolve_one_record_above_amount(&private_key, amount, record_query)?, None)
                }
            }
        };
        Ok((input_record, fee_record))
    }
}
