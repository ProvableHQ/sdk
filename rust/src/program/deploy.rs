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
    /// Deploy a program to the network
    pub fn deploy_program(
        &mut self,
        program_id: impl TryInto<ProgramID<N>>,
        priority_fee: u64,
        fee_record: Record<N, Plaintext<N>>,
        password: Option<&str>,
    ) -> Result<String> {
        // Ensure a network client is configured, otherwise deployment is not possible
        ensure!(
            self.api_client.is_some(),
            "❌ Network client not set, network config must be set before deployment in order to send transactions to the Aleo network"
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
        } else if let Some(dir) = self.local_program_directory.as_ref() {
            let program = self.find_program_on_disk(&program_id);
            if program.is_err() {
                bail!(
                    "❌ Program {program_id:?} could not be found at {dir:?} or in the program manager, please ensure the program is in the correct directory before continuing with deployment"
                );
            }
            program?
        } else {
            bail!(
                "❌ Program {:?} not found in program manager and no local program directory was configured",
                program_id
            );
        };

        // If the program has imports, check if they are deployed on chain. If they are not or if
        // the imports on disk or in-memory do not match the programs deployed on chain, cancel deployment
        program.imports().keys().try_for_each(|program_id| {
            let imported_program = if self.contains_program(program_id)? {
                // If the import is in memory, use it
                self.get_program(program_id)
            } else {
                // Else look on disk or on the network for the import
                self.find_program(program_id)
            }.map_err(|_| anyhow!("❌ Imported program {program_id:?} could not be found locally or on the Aleo Network"))?;

            // Check that the program import matches a deployed program on chain
            let imported_program_id = imported_program.id();
            match self.on_chain_program_state(&imported_program)? {
                OnChainProgramState::NotDeployed => {
                    // For now enforce that users deploy imports individually. In the future, create a more detailed program resolution method for local imports
                    bail!("❌ Imported program {imported_program_id:?} could not be found on the Aleo Network, please deploy this imported program first before continuing with deployment of {program_id:?}");
                }
                OnChainProgramState::Different => {
                    // If the on-chain program is different, cancel deployment
                    bail!("❌ Imported program {imported_program_id:?} is already deployed on chain and did not match local import");
                }
                OnChainProgramState::Same => (),
            };

            Ok::<_, Error>(())
        })?;

        // Try to get the private key
        let private_key = self.get_private_key(password)?;

        // Attempt to construct the transaction
        println!("Building transaction..");
        let query = self.api_client.as_ref().unwrap().base_url();
        let transaction = Self::create_deploy_transaction(
            &program,
            &private_key,
            priority_fee,
            fee_record,
            query.to_string(),
            self.api_client()?,
        )?;

        println!(
            "Attempting to broadcast a deploy transaction for program {:?} to node {:?}",
            program_id,
            self.api_client().unwrap().base_url()
        );

        let result = self.broadcast_transaction(transaction);

        // Notify the developer of the result
        if result.is_ok() {
            println!("✅ Deployment transaction for {program_id:?} broadcast successfully");
        } else {
            println!("❌ Deployment transaction for {program_id:?} failed to broadcast");
        };

        result
    }

    /// Create a deploy transaction for a program without instantiating the program manager
    pub fn create_deploy_transaction(
        program: &Program<N>,
        private_key: &PrivateKey<N>,
        priority_fee: u64,
        fee_record: Record<N, Plaintext<N>>,
        node_url: String,
        api_client: &AleoAPIClient<N>,
    ) -> Result<Transaction<N>> {
        // Initialize an RNG.
        let rng = &mut rand::thread_rng();
        let query = Query::from(node_url);

        // Initialize the VM
        let vm = Self::initialize_vm(api_client, program, false)?;

        // Create the deployment transaction
        vm.deploy(private_key, program, (fee_record, priority_fee), Some(query), rng)
    }

    /// Estimate deployment fee for a program in microcredits. The result will be in the form
    /// (total_cost, (storage_cost, namespace_cost))
    ///
    /// Disclaimer: Fee estimation is experimental and may not represent a correct estimate on any current or future network
    pub fn estimate_deployment_fee<A: Aleo<Network = N>>(&self, program: &Program<N>) -> Result<(u64, (u64, u64))> {
        let vm = Self::initialize_vm(self.api_client()?, program, false)?;
        let deployment = vm.deploy_raw(program, &mut rand::thread_rng())?;
        let (minimum_deployment_cost, (storage_cost, namespace_cost)) = deployment_cost::<N>(&deployment)?;
        Ok((minimum_deployment_cost, (storage_cost, namespace_cost)))
    }

    /// Estimate the component of the deployment cost derived from the program name. Note that this
    /// cost does not represent the entire cost of deployment. It is additional to the cost of the
    /// size (in bytes) of the deployment.
    ///
    /// Disclaimer: Fee estimation is experimental and may not represent a correct estimate on any current or future network
    pub fn estimate_namespace_fee(program_id: impl TryInto<ProgramID<N>>) -> Result<u64> {
        let program_id = program_id.try_into().map_err(|_| anyhow!("❌ Invalid program ID"))?;
        let num_characters = program_id.to_string().chars().count() as u32;
        let namespace_cost = 10u64
            .checked_pow(10u32.saturating_sub(num_characters))
            .ok_or(anyhow!("The namespace cost computation overflowed for a deployment"))?
            .saturating_mul(1_000_000); // 1 microcredit = 1e-6 credits.
        Ok(namespace_cost)
    }
}

#[cfg(test)]
#[cfg(not(feature = "wasm"))]
mod tests {
    use super::*;
    use crate::{
        test_utils::{
            random_program,
            random_program_id,
            setup_directory,
            transfer_to_test_account,
            CREDITS_IMPORT_TEST_PROGRAM,
            HELLO_PROGRAM,
            MULTIPLY_IMPORT_PROGRAM,
            MULTIPLY_PROGRAM,
            RECORD_2000000001_MICROCREDITS,
            RECORD_5_MICROCREDITS,
        },
        AleoAPIClient,
        RecordFinder,
    };
    use snarkvm_console::network::Testnet3;

    use std::{ops::Add, str::FromStr, thread};

    #[test]
    #[ignore]
    fn test_deploy() {
        let recipient_private_key = PrivateKey::<Testnet3>::from_str(RECIPIENT_PRIVATE_KEY).unwrap();
        let finalize_program = Program::<Testnet3>::from_str(FINALIZE_TEST_PROGRAM).unwrap();
        let multiply_program = Program::<Testnet3>::from_str(MULTIPLY_PROGRAM).unwrap();
        let multiply_import_program = Program::<Testnet3>::from_str(MULTIPLY_IMPORT_PROGRAM).unwrap();

        // Wait for the node to bootup
        thread::sleep(std::time::Duration::from_secs(5));
        transfer_to_test_account(2000000001, 14, recipient_private_key, "3030").unwrap();
        let api_client = AleoAPIClient::<Testnet3>::local_testnet3("3030");
        let record_finder = RecordFinder::<Testnet3>::new(api_client.clone());
        let temp_dir = setup_directory("aleo_test_deploy", CREDITS_IMPORT_TEST_PROGRAM, vec![]).unwrap();

        // Ensure that program manager creation fails if no key is provided
        let mut program_manager =
            ProgramManager::<Testnet3>::new(Some(recipient_private_key), None, Some(api_client), Some(temp_dir))
                .unwrap();

        // Wait for the transactions to show up on chain
        thread::sleep(std::time::Duration::from_secs(30));
        let deployment_fee = 200_000_001;
        let fee_record = record_finder.find_one_record(&recipient_private_key, deployment_fee).unwrap();
        program_manager.deploy_program("credits_import_test.aleo", deployment_fee, fee_record, None).unwrap();

        // Wait for the program to show up on chain
        thread::sleep(std::time::Duration::from_secs(45));
        for _ in 0..4 {
            let deployed_program = program_manager.api_client().unwrap().get_program("credits_import_test.aleo");

            if deployed_program.is_ok() {
                assert_eq!(deployed_program.unwrap(), Program::from_str(CREDITS_IMPORT_TEST_PROGRAM).unwrap());
                break;
            }
            println!("Program has not yet appeared on chain, waiting another 15 seconds");
            thread::sleep(std::time::Duration::from_secs(15));
        }

        // Deploy a program with a finalize scope
        program_manager.add_program(&finalize_program).unwrap();

        let fee_record = record_finder.find_one_record(&recipient_private_key, deployment_fee).unwrap();
        program_manager.deploy_program("finalize_test.aleo", deployment_fee, fee_record, None).unwrap();

        // Wait for the program to show up on chain
        thread::sleep(std::time::Duration::from_secs(45));
        for _ in 0..4 {
            let deployed_program = program_manager.api_client().unwrap().get_program("finalize_test.aleo");

            if deployed_program.is_ok() {
                assert_eq!(deployed_program.unwrap(), Program::from_str(FINALIZE_TEST_PROGRAM).unwrap());
                break;
            }
            println!("Program has not yet appeared on chain, waiting another 15 seconds");
            thread::sleep(std::time::Duration::from_secs(15));
        }

        // Deploy a program other than credits.aleo to be imported
        program_manager.add_program(&multiply_program).unwrap();

        let fee_record = record_finder.find_one_record(&recipient_private_key, deployment_fee).unwrap();
        program_manager.deploy_program("multiply_test.aleo", deployment_fee, fee_record, None).unwrap();

        // Wait for the program to show up on chain
        thread::sleep(std::time::Duration::from_secs(45));
        for _ in 0..4 {
            let deployed_program = program_manager.api_client().unwrap().get_program("multiply_test.aleo");

            if deployed_program.is_ok() {
                assert_eq!(deployed_program.unwrap(), Program::from_str(MULTIPLY_PROGRAM).unwrap());
                break;
            }
            println!("Program has not yet appeared on chain, waiting another 15 seconds");
            thread::sleep(std::time::Duration::from_secs(15));
        }

        // Deploy a program with imports other than credits.aleo
        program_manager.add_program(&multiply_import_program).unwrap();

        let fee_record = record_finder.find_one_record(&recipient_private_key, deployment_fee).unwrap();
        program_manager.deploy_program("double_test.aleo", deployment_fee, fee_record, None).unwrap();

        // Wait for the program to show up on chain
        thread::sleep(std::time::Duration::from_secs(45));
        for _ in 0..4 {
            let deployed_program = program_manager.api_client().unwrap().get_program("double_test.aleo");

            if deployed_program.is_ok() {
                assert_eq!(deployed_program.unwrap(), Program::from_str(MULTIPLY_IMPORT_PROGRAM).unwrap());
                break;
            }
            println!("Program has not yet appeared on chain, waiting another 15 seconds");
            thread::sleep(std::time::Duration::from_secs(15));
        }
    }

    #[test]
    fn test_deploy_failure_conditions() {
        let rng = &mut rand::thread_rng();
        let recipient_private_key = PrivateKey::<Testnet3>::new(rng).unwrap();
        let record_5_microcredits = Record::<Testnet3, Plaintext<Testnet3>>::from_str(RECORD_5_MICROCREDITS).unwrap();
        let record_2000000001_microcredits =
            Record::<Testnet3, Plaintext<Testnet3>>::from_str(RECORD_2000000001_MICROCREDITS).unwrap();
        let api_client = AleoAPIClient::<Testnet3>::local_testnet3("3030");
        let randomized_program = random_program();
        let randomized_program_id = randomized_program.id().to_string();
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
        let deployment = program_manager.deploy_program(&randomized_program_id, 0, record_5_microcredits.clone(), None);
        assert!(deployment.is_err());

        // Ensure that deployment fails if the fee is insufficient
        let deployment = program_manager.deploy_program(&randomized_program_id, 2, record_5_microcredits.clone(), None);
        assert!(deployment.is_err());

        // Ensure that deployment fails if the record used to pay the fee is insufficient
        let deployment =
            program_manager.deploy_program(&randomized_program_id, deployment_fee, record_5_microcredits, None);
        assert!(deployment.is_err());

        // Ensure that deployment fails if the program is already on chain
        let deployment =
            program_manager.deploy_program("hello.aleo", deployment_fee, record_2000000001_microcredits.clone(), None);
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

        let deployment = program_manager.deploy_program(
            &randomized_program_id,
            deployment_fee,
            record_2000000001_microcredits,
            None,
        );
        assert!(deployment.is_err());
    }
}
