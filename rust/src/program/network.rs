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

impl<N: Network> ProgramManager<N> {
    /// Broadcast a transaction to the network
    pub fn broadcast_transaction(&self, transaction: Transaction<N>) -> Result<String> {
        let transaction_type = if let Transaction::Deploy(..) = &transaction { "Deployment" } else { "Execute" };
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
        test_utils::{random_program, GENERIC_PROGRAM_BODY, RECIPIENT_PRIVATE_KEY},
        AleoAPIClient,
    };
    use snarkvm_console::{account::PrivateKey, network::Testnet3};

    use std::{ops::Add, str::FromStr};

    #[test]
    fn test_network_functionality_works_as_expected() {
        let credits = snarkvm::synthesizer::Program::<Testnet3>::credits().unwrap();
        let api_client = AleoAPIClient::<Testnet3>::testnet3();
        let private_key = PrivateKey::<Testnet3>::from_str(RECIPIENT_PRIVATE_KEY).unwrap();
        // Create a temp dir without proper programs to test that the hybrid client works even if the local resource directory doesn't exist
        let temp_dir = std::env::temp_dir().join("no_op");
        let _ = std::fs::create_dir(&temp_dir);

        let program_manager =
            ProgramManager::<Testnet3>::new(Some(private_key), None, Some(api_client), Some(temp_dir.clone())).unwrap();

        // Test that API clients works
        let api_client = program_manager.api_client().unwrap();
        let network_credits_program = api_client.get_program("credits.aleo").unwrap();
        assert_eq!(network_credits_program, credits);

        // Test that on_chain_program_state gives a positive ID for a deployed program that matches
        // a local program
        let program_state = program_manager.on_chain_program_state(&credits).unwrap();
        assert!(matches!(program_state, OnChainProgramState::Same));

        // Test on_chain_program_state() identifies when a program is not deployed
        let random_program = random_program();
        let random_program_state = program_manager.on_chain_program_state(&random_program).unwrap();
        assert!(matches!(random_program_state, OnChainProgramState::NotDeployed));

        // Test on_chain_program_state() identifies when a program is deployed but different from
        // the local version
        let wrong_hello_program_string = String::from("program credits.aleo;\n").add(GENERIC_PROGRAM_BODY);
        let wrong_hello_program = Program::<Testnet3>::from_str(&wrong_hello_program_string).unwrap();
        let state_mismatch = program_manager.on_chain_program_state(&wrong_hello_program).unwrap();

        assert!(matches!(state_mismatch, OnChainProgramState::Different));

        let _ = std::fs::remove_dir_all(temp_dir);
    }
}
