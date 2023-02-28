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

use super::Resolver;
use crate::{api::AleoAPIClient, NetworkConfig, RecordQuery};
use snarkvm_console::{
    account::{PrivateKey, ViewKey},
    network::Network,
    program::{Plaintext, ProgramID, Record},
};
use snarkvm_synthesizer::Program;

use anyhow::{bail, Result};
use std::ops::Range;

/// Resolver for resources from the Aleo network
#[derive(Clone, Debug)]
pub struct AleoNetworkResolver<N: Network> {
    network_config: NetworkConfig,
    _phantom: core::marker::PhantomData<N>,
}

/// Reso
impl<N: Network> AleoNetworkResolver<N> {
    /// Create a new network resolver
    pub fn new(network_config: &NetworkConfig) -> Self {
        let _config = network_config.clone();
        Self { network_config: network_config.clone(), _phantom: core::marker::PhantomData }
    }
}

impl<N: Network> Resolver<N> for AleoNetworkResolver<N> {
    const NAME: &'static str = "AleoNetworkResolver";

    fn load_program(&self, program_id: &ProgramID<N>) -> Result<Program<N>> {
        AleoAPIClient::<N>::from(&self.network_config).get_program(program_id)
    }

    fn resolve_program_imports(&self, program: &Program<N>) -> Result<Vec<(ProgramID<N>, Result<Program<N>>)>> {
        let api_client = AleoAPIClient::<N>::from(&self.network_config);
        program
            .imports()
            .keys()
            .map(|program_id| {
                // Open the Aleo program file.
                let program = api_client.get_program(program_id);
                Ok((*program_id, program))
            })
            .collect::<Result<Vec<(ProgramID<N>, Result<Program<N>>)>>>()
    }

    fn find_owned_records(
        &self,
        private_key: &PrivateKey<N>,
        record_query: &RecordQuery,
    ) -> Result<Vec<Record<N, Plaintext<N>>>> {
        let (block_range, max_records, max_gates, unspent_only) = match record_query {
            RecordQuery::BlockRange { start, end, max_records, max_gates, unspent_only } => {
                if start > end {
                    bail!("Invalid block range");
                }
                (Range { start: *start, end: *end }, max_records, max_gates, *unspent_only)
            }
            RecordQuery::Options { max_records, max_gates, unspent_only } => {
                (Range { start: 0, end: u32::MAX }, max_records, max_gates, *unspent_only)
            }
            _ => bail!("Network resolver only supports block range queries"),
        };

        let api_client = AleoAPIClient::<N>::from(&self.network_config);
        let view_key = ViewKey::try_from(private_key)?;

        let records = if unspent_only {
            api_client.get_unspent_records(private_key, block_range, *max_records, *max_gates)?
        } else {
            api_client.scan(view_key, block_range, *max_records)?
        };

        Ok(records.into_iter().filter_map(|(_, record)| record.decrypt(&view_key).ok()).collect())
    }
}
