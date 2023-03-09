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

use crate::{OnChainProgramState, ProgramManager};
use snarkvm_console::{
    account::PrivateKey,
    program::{Network, Plaintext, ProgramID, Record},
};
use snarkvm_synthesizer::{ConsensusMemory, ConsensusStore, Program, Query, Transaction, VM};
use snarkvm_utilities::ToBytes;

use anyhow::{anyhow, bail, ensure, Error, Result};

impl<N: Network> ProgramManager<N> {
    /// Deploy a program to the network
    pub fn deploy_program(
        &mut self,
        program_id: impl TryInto<ProgramID<N>>,
        fee: u64,
        fee_record: Record<N, Plaintext<N>>,
        password: Option<&str>,
    ) -> Result<()> {
        // Ensure network config is set, otherwise deployment is not possible
        ensure!(
            self.api_client.is_some(),
            "❌ Network client not set, network config must be set before deployment in order to send transactions to the Aleo network"
        );

        let record_amount = ***fee_record.gates();
        // Ensure a fee record is set
        ensure!(fee > 0, "❌ Fee must be greater than zero in order to deploy a program");
        ensure!(
            record_amount >= fee,
            "❌ The record supplied has balance of {record_amount:?} gates which is insufficient to pay the specified fee of {fee:?} gates"
        );

        // Check program has a valid name
        let program_id = program_id.try_into().map_err(|_| anyhow!("Invalid program ID"))?;

        // Check if program is already deployed on chain, cancel deployment if so
        ensure!(
            self.api_client()?.get_program(program_id).is_err(),
            "❌ Program {:?} already deployed on chain, cancelling deployment",
            program_id
        );

        // Get the program if it already exists, otherwise find it
        println!("Loading program {program_id:?}..");
        let program = if let Ok(program) = self.get_program(program_id) {
            println!("Program {:?} already exists in program manager, using existing program", program_id);
            program
        } else {
            let program = self.find_program_on_disk(&program_id);
            if program.is_err() {
                bail!(
                    "❌ Program {program_id:?} could not be found on disk or in the program manager, please ensure the program is in the correct directory before continuing with deployment"
                );
            }
            program?
        };

        let store = ConsensusStore::<N, ConsensusMemory<N>>::open(None)?;
        let vm = VM::<N, ConsensusMemory<N>>::from(store)?;
        // Check if program imports are deployed on chain and add them to program manager, cancel otherwise
        program.imports().keys().try_for_each(|program_id| {
            let program = if self.contains_program(program_id)? {
                self.get_program(program_id)
            } else {
                self.find_program(program_id)
            };
            let program = match program {
                Ok(program) => program,
                Err(err) => bail!("❌ Imported program {program_id:?} could not be found on chain with error: {err:?}, please deploy this program first before continuing with deployment"),
            };
            match self.on_chain_program_state(&program)? {
                OnChainProgramState::NotDeployed => {
                    bail!("❌ Imported program {:?} could not be found, please deploy this program first before continuing with deployment", program_id)
                }
                OnChainProgramState::Different => {
                    bail!(
                            "❌ Imported program {:?} is already deployed on chain and did not match local import",
                            program_id
                        );
                }
                OnChainProgramState::Same => (),
            };
            if &program_id.to_string() != "credits.aleo" {
                vm.process().write().add_program(&program)?;
            };
            Ok::<_, Error>(())
        })?;

        // Try to get the private key
        let private_key = self.get_private_key(password)?;

        // Attempt to construct the transaction
        let query = self.api_client.as_ref().unwrap().base_url();

        // Create & broadcast a deploy transaction for a program
        println!("Building transaction..");
        let transaction =
            Self::create_deploy_transaction(Some(vm), &private_key, fee, fee_record, &program, query.to_string())?;
        println!(
            "Attempting to broadcast a deploy transaction for program {:?} to node {:?}",
            program_id,
            self.api_client().unwrap().base_url()
        );

        // Ensure the fee is sufficient to pay for the transaction
        let required_fee = transaction.to_bytes_le()?.len();
        if usize::try_from(fee)? >= required_fee {
            self.broadcast_transaction(transaction)?;
        } else {
            bail!(
                "❌ Insufficient funds to pay for transaction fee, required fee: {}, fee specified in the record: {}",
                required_fee,
                fee
            )
        }

        println!("✅ Deployment transaction for {program_id:?} broadcast successfully");
        // Return okay if it's successful
        Ok(())
    }

    /// Create a deploy transaction for a program without instantiating the program manager
    pub fn create_deploy_transaction(
        vm: Option<VM<N, ConsensusMemory<N>>>,
        private_key: &PrivateKey<N>,
        fee: u64,
        fee_record: Record<N, Plaintext<N>>,
        program: &Program<N>,
        query: String,
    ) -> Result<Transaction<N>> {
        // Initialize an RNG.
        let rng = &mut rand::thread_rng();
        let query = Query::from(query);

        let deployment_vm = if let Some(deployment_vm) = vm {
            deployment_vm
        } else {
            let store = ConsensusStore::<N, ConsensusMemory<N>>::open(None)?;
            VM::<N, ConsensusMemory<N>>::from(store)?
        };

        // Create the transaction
        Transaction::<N>::deploy(&deployment_vm, private_key, program, (fee_record, fee), Some(query), rng)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[cfg(not(feature = "wasm"))]
    use crate::{
        test_utils::{
            random_program,
            random_program_id,
            setup_directory,
            transfer_to_test_account,
            CREDITS_IMPORT_TEST_PROGRAM,
            HELLO_PROGRAM,
            RECORD_2000000001_GATES,
            RECORD_5_GATES,
        },
        AleoAPIClient,
        RecordFinder,
    };
    use snarkvm_console::network::Testnet3;

    use std::{ops::Add, str::FromStr, thread};

    #[test]
    #[cfg(not(feature = "wasm"))]
    #[ignore]
    fn test_deploy() {
        let rng = &mut rand::thread_rng();
        let recipient_private_key = PrivateKey::<Testnet3>::new(rng).unwrap();

        // Wait for the node to bootup
        thread::sleep(std::time::Duration::from_secs(5));
        transfer_to_test_account(2000000001, 4, recipient_private_key, "3030").unwrap();
        let api_client = AleoAPIClient::<Testnet3>::local_testnet3("3030");
        let record_finder = RecordFinder::<Testnet3>::new(api_client.clone());
        let temp_dir = setup_directory("aleo_test_deploy", CREDITS_IMPORT_TEST_PROGRAM, vec![]).unwrap();

        // Ensure that program manager creation fails if no key is provided
        let mut program_manager =
            ProgramManager::<Testnet3>::new(Some(recipient_private_key), None, Some(api_client), Some(temp_dir))
                .unwrap();

        // Wait for the transactions to show up on chain
        thread::sleep(std::time::Duration::from_secs(10));
        let deployment_fee = 200000001;
        let fee_record = record_finder.find_one_record(&recipient_private_key, deployment_fee).unwrap();
        program_manager.deploy_program("credits_import_test.aleo", deployment_fee, fee_record, None).unwrap();

        // Wait for the program to show up on chain
        thread::sleep(std::time::Duration::from_secs(40));
        let credits_import_test =
            program_manager.api_client().unwrap().get_program("credits_import_test.aleo").unwrap();
        assert_eq!(credits_import_test, Program::from_str(CREDITS_IMPORT_TEST_PROGRAM).unwrap());
    }

    #[test]
    #[cfg(not(feature = "wasm"))]
    fn test_deploy_failure_conditions() {
        let rng = &mut rand::thread_rng();
        let recipient_private_key = PrivateKey::<Testnet3>::new(rng).unwrap();
        let record_5_gates = Record::<Testnet3, Plaintext<Testnet3>>::from_str(RECORD_5_GATES).unwrap();
        let record_2000000001_gates =
            Record::<Testnet3, Plaintext<Testnet3>>::from_str(RECORD_2000000001_GATES).unwrap();
        let api_client = AleoAPIClient::<Testnet3>::local_testnet3("3030");
        let randomized_program = random_program();
        let randomized_program_id = randomized_program.to_string();
        let randomized_program_string = randomized_program.to_string();
        let temp_dir = setup_directory("aleo_unit_test_fees", &randomized_program.to_string(), vec![]).unwrap();

        // Ensure that program manager creation fails if no key is provided
        let mut program_manager = ProgramManager::<Testnet3>::new(
            Some(recipient_private_key),
            None,
            Some(api_client.clone()),
            Some(temp_dir),
        )
        .unwrap();

        let deployment_fee = 200000001;
        // Ensure that deployment fails if the fee is zero
        let deployment = program_manager.deploy_program(&randomized_program_id, 0, record_5_gates.clone(), None);
        assert!(deployment.is_err());

        // Ensure that deployment fails if the fee is insufficient
        let deployment = program_manager.deploy_program(&randomized_program_id, 2, record_5_gates.clone(), None);
        assert!(deployment.is_err());

        // Ensure that deployment fails if the record used to pay the fee is insufficient
        let deployment = program_manager.deploy_program(&randomized_program_id, deployment_fee, record_5_gates, None);
        assert!(deployment.is_err());

        // Ensure that deployment fails if the program is already on chain
        let deployment =
            program_manager.deploy_program("hello.aleo", deployment_fee, record_2000000001_gates.clone(), None);
        assert!(deployment.is_err());

        // Ensure that deployment fails if import cannot be found on chain
        let missing_import_program_string =
            format!("import {};\n", random_program_id(16)).add(&randomized_program_string);
        let temp_dir_2 = setup_directory("aleo_unit_test_imports", &missing_import_program_string, vec![
            ("hello.aleo", HELLO_PROGRAM),
            (&randomized_program_id, &missing_import_program_string),
        ])
        .unwrap();
        let mut program_manager =
            ProgramManager::<Testnet3>::new(Some(recipient_private_key), None, Some(api_client), Some(temp_dir_2))
                .unwrap();

        let deployment =
            program_manager.deploy_program(&randomized_program_id, deployment_fee, record_2000000001_gates, None);
        assert!(deployment.is_err());
    }
}
