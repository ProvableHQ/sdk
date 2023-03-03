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

use crate::{api::AleoAPIClient, NetworkConfig, RecordQuery, Resolver};
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
        program
            .imports()
            .keys()
            .map(|program_id| {
                // Open the Aleo program file.
                let program = self.load_program(program_id);
                Ok((*program_id, program))
            })
            .collect::<Result<Vec<(ProgramID<N>, Result<Program<N>>)>>>()
    }

    fn find_owned_records(
        &self,
        private_key: &PrivateKey<N>,
        record_query: &RecordQuery,
    ) -> Result<Vec<Record<N, Plaintext<N>>>> {
        let (amounts, block_range, max_records, max_gates, unspent_only) = match record_query {
            RecordQuery::BlockRange { amounts, start, end, max_records, max_gates, unspent_only } => {
                if start > end {
                    bail!("Invalid block range");
                }
                (amounts, Range { start: *start, end: *end }, max_records, max_gates, *unspent_only)
            }
            RecordQuery::Options { amounts, max_records, max_gates, unspent_only } => {
                let latest_height = AleoAPIClient::<N>::from(&self.network_config).latest_height()?;
                println!("Searching block range 0-{} for spendable records", latest_height);
                (amounts, Range { start: 0, end: latest_height }, max_records, max_gates, *unspent_only)
            }
            _ => bail!("Network resolver only supports block range and option queries"),
        };

        let api_client = AleoAPIClient::<N>::from(&self.network_config);
        let view_key = ViewKey::try_from(private_key)?;

        let records = if unspent_only {
            api_client.get_unspent_records(private_key, block_range, *max_records, *max_gates, amounts.clone())?
        } else {
            api_client.scan(view_key, block_range, *max_records)?
        };

        Ok(records.into_iter().filter_map(|(_, record)| record.decrypt(&view_key).ok()).collect())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::{random_program_id, ALEO_PROGRAM, HELLO_PROGRAM};
    use snarkvm_console::network::Testnet3;
    use std::{ops::Add, str::FromStr};

    #[test]
    fn test_network_resolver_program_resolution() {
        let testnet_3 = NetworkConfig::testnet3();
        let resolver = AleoNetworkResolver::<Testnet3>::new(&testnet_3);
        let program_id = ProgramID::<Testnet3>::from_str("credits.aleo").unwrap();
        let credits_off_the_chain = Program::<Testnet3>::credits().unwrap();
        let credits_on_the_chain = resolver.load_program(&program_id).unwrap();
        assert_eq!(credits_off_the_chain, credits_on_the_chain);
    }

    #[test]
    fn test_network_resolver_program_imports_are_resolved_correctly() {
        let testnet_3 = NetworkConfig::testnet3();
        let resolver = AleoNetworkResolver::<Testnet3>::new(&testnet_3);
        let test_program = Program::<Testnet3>::from_str(ALEO_PROGRAM).unwrap();
        let hello_program = Program::<Testnet3>::from_str(HELLO_PROGRAM).unwrap();
        let credits_program = Program::<Testnet3>::credits().unwrap();
        let imports = resolver.resolve_program_imports(&test_program).unwrap();
        assert_eq!(imports.len(), 2);

        let (hello_id, hello_program_on_chain) = &imports[0];
        let (credits_id, online_credits_on_chain) = &imports[1];
        let (hello_program_on_chain, online_credits_on_chain) =
            (hello_program_on_chain.as_ref().unwrap(), online_credits_on_chain.as_ref().unwrap());
        assert_eq!(hello_id.to_string(), "hello.aleo");
        assert_eq!(credits_id.to_string(), "credits.aleo");
        assert_eq!(&hello_program, hello_program_on_chain);
        assert_eq!(&credits_program, online_credits_on_chain);
    }

    #[test]
    fn test_network_resolver_doesnt_load_programs_not_on_chain() {
        let random_program = random_program_id(16);
        let testnet_3 = NetworkConfig::testnet3();
        let resolver = AleoNetworkResolver::<Testnet3>::new(&testnet_3);
        let program_id = ProgramID::<Testnet3>::from_str(&random_program).unwrap();
        assert!(resolver.load_program(&program_id).is_err())
    }

    #[test]
    fn test_network_resolver_produces_resolution_errors_for_bad_imports() {
        // Create a bad program with a bad import
        let testnet_3 = NetworkConfig::testnet3();
        let resolver = AleoNetworkResolver::<Testnet3>::new(&testnet_3);
        let bad_import_code = String::from("import ").add(&random_program_id(16)).add(";").add(ALEO_PROGRAM);
        let bad_import_program = Program::<Testnet3>::from_str(&bad_import_code).unwrap();
        let imports = resolver.resolve_program_imports(&bad_import_program).unwrap();

        // Ensure that the bad import is the only one that failed
        let (_, bad_import_program_on_chain) = &imports[0];
        let (hello_id, hello_program_on_chain) = &imports[1];
        let (credits_id, online_credits_on_chain) = &imports[2];
        assert!(bad_import_program_on_chain.is_err());
        assert_eq!(hello_id.to_string(), "hello.aleo");
        assert_eq!(credits_id.to_string(), "credits.aleo");

        // Make sure the other imports are still resolved correctly
        let hello_program = Program::<Testnet3>::from_str(HELLO_PROGRAM).unwrap();
        let credits_program = Program::<Testnet3>::credits().unwrap();
        let (hello_program_on_chain, online_credits_on_chain) =
            (hello_program_on_chain.as_ref().unwrap(), online_credits_on_chain.as_ref().unwrap());

        assert_eq!(&hello_program, hello_program_on_chain);
        assert_eq!(&credits_program, online_credits_on_chain);
    }

    #[test]
    fn test_network_resolver_doesnt_resolve_imports_for_programs_with_no_imports() {
        let testnet_3 = NetworkConfig::testnet3();
        let resolver = AleoNetworkResolver::<Testnet3>::new(&testnet_3);
        let credits = Program::<Testnet3>::credits().unwrap();
        let imports = resolver.resolve_program_imports(&credits).unwrap();
        assert_eq!(imports.len(), 0);
    }
}
