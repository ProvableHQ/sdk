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

use crate::{AleoAPIClient, OnChainProgramState, ProgramManager, Resolver};
use snarkvm_console::program::Network;
use snarkvm_synthesizer::{Program, Transaction};

use anyhow::{anyhow, Result};

impl<N: Network, R: Resolver<N>> ProgramManager<N, R> {
    /// Broadcast a transaction to the network
    pub fn broadcast_transaction(&self, transaction: Transaction<N>) -> Result<String> {
        let transaction_type = if let Transaction::Deploy(_, _, _) = &transaction { "Deployment" } else { "Execute" };
        let api_client = self.api_client()?;
        let result = api_client.transaction_broadcast(transaction);
        if result.is_ok() {
            println!("✅ {} Transaction successfully posted to {}", transaction_type, api_client.base_url());
        } else {
            println!("❌ {} Transaction failed to post to {}", transaction_type, api_client.base_url());
        }
        result
    }

    /// Get a reference to the configured API client
    pub fn api_client(&self) -> Result<&AleoAPIClient<N>> {
        self.api_client.as_ref().ok_or_else(|| anyhow!("No API client found"))
    }

    /// Get a reference to the configured resource resolver
    pub fn resolver(&self) -> &R {
        &self.resolver
    }

    /// Check the on-chain version of a program to determine if it is deployed, and if so,
    /// if it is the same as the local version
    pub fn on_chain_program_state(&self, program: &Program<N>) -> Result<OnChainProgramState> {
        let program_id = program.id();
        Ok(self
            .api_client()?
            .get_program(program_id)
            .map(
                |chain_program| {
                    if chain_program.eq(program) { OnChainProgramState::Same } else { OnChainProgramState::Different }
                },
            )
            .unwrap_or(OnChainProgramState::NotDeployed))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    use crate::{
        random_program,
        AleoNetworkResolver,
        FileSystemResolver,
        HybridResolver,
        NetworkConfig,
        GENERIC_PROGRAM_BODY,
        HELLO_PROGRAM,
        RECIPIENT_PRIVATE_KEY,
    };
    use snarkvm_console::{
        account::{Address, PrivateKey},
        network::Testnet3,
    };

    use std::{ops::Add, str::FromStr};

    #[test]
    fn test_network_functionality_works_as_expected_for_all_default_concrete_resolver_types() {
        let network_config = NetworkConfig::testnet3();
        let private_key = PrivateKey::<Testnet3>::from_str(RECIPIENT_PRIVATE_KEY).unwrap();
        let address = Address::<Testnet3>::try_from(&private_key).unwrap();
        // Create a temp dir without proper programs to test that the hybrid client works even if the local resource directory doesn't exist
        let temp_dir = std::env::temp_dir().join("no_op");
        let _ = std::fs::create_dir(&temp_dir);

        let file_program_manager =
            ProgramManager::<Testnet3, FileSystemResolver<Testnet3>>::program_manager_with_local_resource_resolution(
                Some(private_key),
                None,
                &address,
                temp_dir.clone(),
                Some(network_config.clone()),
            )
            .unwrap();

        let hybrid_program_manager =
            ProgramManager::<Testnet3, HybridResolver<Testnet3>>::program_manager_with_hybrid_resolution(
                Some(private_key),
                None,
                temp_dir.clone(),
                network_config.clone(),
            )
            .unwrap();

        let network_program_manager =
            ProgramManager::<Testnet3, AleoNetworkResolver<Testnet3>>::program_manager_with_network_resolution(
                Some(private_key),
                None,
                network_config.clone(),
            )
            .unwrap();

        // Test that API clients work for all default program managers
        let file_api_client = file_program_manager.api_client().unwrap();
        let hybrid_api_client = hybrid_program_manager.api_client().unwrap();
        let network_api_client = network_program_manager.api_client().unwrap();

        let file_api_program = file_api_client.get_program("hello.aleo").unwrap();
        let hybrid_api_program = hybrid_api_client.get_program("hello.aleo").unwrap();
        let network_api_program = network_api_client.get_program("hello.aleo").unwrap();

        assert_eq!(file_api_program, hybrid_api_program);
        assert_eq!(file_api_program, network_api_program);
        assert_eq!(hybrid_api_program, network_api_program);

        // Test that network-enabled resolvers give the same results for all default program managers
        // when using the web pathways
        let file_resolver = file_program_manager.resolver();
        let hybrid_resolver = hybrid_program_manager.resolver();
        let network_resolver = network_program_manager.resolver();

        let program = Program::<Testnet3>::from_str(HELLO_PROGRAM).unwrap();

        let hybrid_hello_program = hybrid_resolver.load_program(&program.id()).unwrap();
        let network_hello_program = network_resolver.load_program(&program.id()).unwrap();
        let file_hello_program = file_resolver.load_program(&program.id());
        assert!(file_hello_program.is_err());
        assert_eq!(hybrid_hello_program, hybrid_api_program);
        assert_eq!(network_hello_program, network_api_program);

        // Test that on-chain program state is always a positive ID for network-enabled resolvers that resolve from the network
        let hybrid_hello_state = hybrid_program_manager.on_chain_program_state(&program).unwrap();
        let network_hello_state = network_program_manager.on_chain_program_state(&program).unwrap();
        assert!(matches!(hybrid_hello_state, OnChainProgramState::Same));
        assert!(matches!(network_hello_state, OnChainProgramState::Same));

        // Test on_chain_program_state() identifies when a program is not deployed
        let random_program = random_program();
        let file_random_state = file_program_manager.on_chain_program_state(&random_program).unwrap();
        let hybrid_random_state = hybrid_program_manager.on_chain_program_state(&random_program).unwrap();
        let network_random_state = network_program_manager.on_chain_program_state(&random_program).unwrap();
        assert!(matches!(file_random_state, OnChainProgramState::NotDeployed));
        assert!(matches!(hybrid_random_state, OnChainProgramState::NotDeployed));
        assert!(matches!(network_random_state, OnChainProgramState::NotDeployed));

        // Test on_chain_program_state() identifies when a program is deployed but different
        let wrong_hello_program_string = String::from("program hello.aleo;\n").add(GENERIC_PROGRAM_BODY);
        let wrong_hello_program = Program::<Testnet3>::from_str(&wrong_hello_program_string).unwrap();
        let file_state_mismatch = file_program_manager.on_chain_program_state(&wrong_hello_program).unwrap();
        let hybrid_state_mismatch = hybrid_program_manager.on_chain_program_state(&wrong_hello_program).unwrap();
        let network_state_mismatch = network_program_manager.on_chain_program_state(&wrong_hello_program).unwrap();

        assert!(matches!(file_state_mismatch, OnChainProgramState::Different));
        assert!(matches!(hybrid_state_mismatch, OnChainProgramState::Different));
        assert!(matches!(network_state_mismatch, OnChainProgramState::Different));

        let _ = std::fs::remove_dir_all(temp_dir);
    }
}
