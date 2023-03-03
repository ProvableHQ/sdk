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

use crate::{program::Resolver, OnChainProgramState, ProgramManager, RecordQuery};
use snarkvm_console::{
    account::PrivateKey,
    program::{Network, Plaintext, ProgramID, Record},
};
use snarkvm_synthesizer::{ConsensusMemory, ConsensusStore, Program, Query, Transaction, VM};

use anyhow::{anyhow, bail, ensure, Error, Result};

impl<N: Network, R: Resolver<N>> ProgramManager<N, R> {
    /// Deploy a program to the network
    pub fn deploy_program(
        &mut self,
        program_id: impl TryInto<ProgramID<N>>,
        fee_record: Option<Record<N, Plaintext<N>>>,
        fee: u64,
        password: Option<&str>,
        record_query: &RecordQuery,
        deploy_imports: bool,
    ) -> Result<()> {
        ensure!(fee > 0, "Fee must be greater than 0");

        // Ensure network config is set, otherwise deployment is not possible
        ensure!(self.api_client.is_some(), "Network config not set, cannot deploy");

        // Check program has a legal name
        let program_id = program_id.try_into().map_err(|_| anyhow!("Invalid program ID"))?;

        println!("Loading program {:?} from resolver", program_id);
        // Get the program if it already exists, otherwise load it from the specified resolver
        let program = if let Ok(program) = self.vm.process().write().get_program(program_id) {
            program.clone()
        } else {
            self.resolver.load_program(&program_id)?
        };
        println!("Loaded program {:?} from resolver", program_id);

        // Check if program is already deployed on chain, cancel deployment if so
        ensure!(
            self.api_client()?.get_program(program_id).is_err(),
            "Program {:?} already deployed on chain",
            program_id
        );

        // Check if program imports are deployed on chain and add them to the VM, cancel otherwise
        program.imports().keys().try_for_each(|program_id| {
            let contains_program = self.vm.process().read().contains_program(program_id);
            let _on_chain_status = if contains_program {
                println!("Imported program {:?} found locally", program_id);
                let program = self.vm.process().read().get_program(program_id)?.clone();
                match self.program_matches_on_chain(&program)? {
                    OnChainProgramState::NotDeployed => {
                        bail!("Imported program {:?} has a circular dependency", program_id)
                    }
                    OnChainProgramState::Different => {
                        bail!(
                            "Imported program {:?} is already deployed on chain and did not match local import",
                            program_id
                        );
                    }
                    OnChainProgramState::Same => (),
                };
            } else {
                println!("Attempting to loading imported program {:?} from resolver", program_id);
                let program = self.resolver.load_program(program_id)?;
                match self.program_matches_on_chain(&program)? {
                    OnChainProgramState::NotDeployed => {
                        if deploy_imports {
                            println!("Imported program {:?} not deployed, attempting to deploy now", program_id);
                            self.deploy_program(program_id, None, fee, password.clone(), record_query, false)?;
                            // Wait for the program import to show up on chain
                            std::thread::sleep(std::time::Duration::from_secs(25));
                        } else {
                            bail!("Imported program {:?} could not be found", program_id)
                        }
                    }
                    OnChainProgramState::Different => {
                        bail!(
                            "Imported program {:?} is already deployed on chain and did not match local import",
                            program_id
                        );
                    }
                    OnChainProgramState::Same => (),
                };
                self.vm.process().write().add_program(&program)?;
            };
            Ok::<_, Error>(())
        })?;

        // Try to get the private key
        let private_key = self.get_private_key(password)?;

        // Attempt to construct the transaction
        let rng = &mut rand::thread_rng();
        let query = Query::from(self.api_client.as_ref().unwrap().base_url());

        println!("Attempting to find a record with appropriate balance to pay the deployment fee");
        // If a fee record is not provided, find one
        let fee_record = if let Some(fee_record) = fee_record {
            fee_record
        } else {
            self.resolve_one_record_above_amount(&private_key, fee, record_query)?
        };

        // Create & broadcast a deploy transaction for a program
        println!("Building transaction..");
        let transaction =
            Transaction::<N>::deploy(&self.vm, &private_key, &program, (fee_record, fee), Some(query), rng)?;
        println!(
            "Attempting to broadcast a deploy transaction for program {:?} to node {:?}",
            program_id,
            self.api_client().unwrap().base_url()
        );
        self.broadcast_transaction(transaction)?;

        // Return okay if it's successful
        Ok(())
    }

    /// Create a deploy transaction for a program without instantiating the VM
    pub fn create_deploy_transaction(
        private_key: &PrivateKey<N>,
        fee: u64,
        fee_record: Record<N, Plaintext<N>>,
        program: &Program<N>,
        query: String,
    ) -> Result<Transaction<N>> {
        // Initialize an RNG.
        let rng = &mut rand::thread_rng();
        let query = Query::from(query);

        let store = ConsensusStore::<N, ConsensusMemory<N>>::open(None)?;
        let vm = VM::<N, ConsensusMemory<N>>::from(store)?;

        // Create the transaction
        Transaction::<N>::deploy(&vm, private_key, program, (fee_record, fee), Some(query), rng)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[cfg(not(feature = "wasm"))]
    use crate::{
        api::NetworkConfig,
        program::ProgramManager,
        resolvers::HybridResolver,
        test_utils::{setup_directory, transfer_to_test_account, ALEO_PROGRAM, HELLO_PROGRAM, RECIPIENT_PRIVATE_KEY},
    };
    #[cfg(not(feature = "wasm"))]
    use snarkvm_console::{account::PrivateKey, network::Testnet3};
    use snarkvm_synthesizer::Program;
    use std::{str::FromStr, thread};

    #[test]
    #[cfg(not(feature = "wasm"))]
    #[ignore]
    fn test_deploy() {
        let rng = &mut rand::thread_rng();
        let private_key = PrivateKey::<Testnet3>::new(rng).unwrap();
        // Wait for the node to bootup (rust is fast)
        thread::sleep(std::time::Duration::from_secs(25));
        transfer_to_test_account(200000000001, 4, private_key, "3030").unwrap();

        let imports = vec![("hello.aleo", HELLO_PROGRAM)];
        let temp_dir = setup_directory("aleo_test_deploy", ALEO_PROGRAM, imports).unwrap();
        let network_config = NetworkConfig::local_testnet3("3030");

        let mut program_manager =
            ProgramManager::<Testnet3, HybridResolver<Testnet3>>::program_manager_with_hybrid_resolution(
                Some(private_key),
                None,
                temp_dir,
                network_config,
            )
            .unwrap();

        let record_query =
            RecordQuery::Options { amounts: None, max_records: None, max_gates: Some(50000000000), unspent_only: true };
        program_manager.deploy_program("aleo_test.aleo", None, 1000000, None, &record_query, true).unwrap();

        // Wait for the program to show up on chain
        thread::sleep(std::time::Duration::from_secs(40));
        let hello_program = program_manager.api_client().unwrap().get_program("hello.aleo").unwrap();
        let aleo_test_program = program_manager.api_client().unwrap().get_program("aleo_test.aleo").unwrap();
        assert_eq!(hello_program, Program::from_str(HELLO_PROGRAM).unwrap());
        assert_eq!(aleo_test_program, Program::from_str(ALEO_PROGRAM).unwrap());
    }
}
