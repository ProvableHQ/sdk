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
use snarkvm::prelude::AleoID;

impl<N: Network> ProgramManager<N> {
    /// Create an offline execution of a program to share with a third party.
    ///
    /// DISCLAIMER: Offline executions will not interact with the Aleo network and cannot use all
    /// of the features of the Leo programming language or Aleo instructions. Any code written
    /// inside finalize blocks will not be executed, mappings cannot be initialized, updated or read,
    /// and a chain of records cannot be created.
    ///
    /// Offline executions however can be used to verify that program outputs follow from program
    /// inputs and that the program was executed correctly. If this is the aim and no chain
    /// interaction is desired, this function can be used.
    #[allow(clippy::too_many_arguments)]
    pub fn execute_program_offline<A: Aleo<Network = N>>(
        &self,
        private_key: &PrivateKey<N>,
        program: &Program<N>,
        function: impl TryInto<Identifier<N>>,
        imports: &[Program<N>],
        inputs: impl ExactSizeIterator<Item = impl TryInto<Value<N>>>,
        include_outputs: bool,
        url: &str,
    ) -> Result<OfflineExecution<N>> {
        // Initialize an RNG and query object for the transaction
        let rng = &mut rand::thread_rng();
        let query = Query::<N, BlockMemory<N>>::from(url);

        // Check that the function exists in the program
        let function_name = function.try_into().map_err(|_| anyhow!("Invalid function name"))?;
        let program_id = program.id();
        println!("Checking function {function_name:?} exists in {program_id:?}");
        ensure!(
            program.contains_function(&function_name),
            "Program {program_id:?} does not contain function {function_name:?}, aborting execution"
        );

        // Create an ephemeral SnarkVM to store the programs
        let store = ConsensusStore::<N, ConsensusMemory<N>>::open(None)?;
        let vm = VM::<N, ConsensusMemory<N>>::from(store)?;
        let credits_id = ProgramID::<N>::from_str("credits.aleo")?;
        imports.iter().try_for_each(|program| {
            if &credits_id != program.id() {
                vm.process().write().add_program(program)?
            }
            Ok::<(), Error>(())
        })?;
        let _ = vm.process().write().add_program(program);

        // Compute the authorization.
        let authorization = vm.authorize(private_key, program_id, function_name, inputs, rng)?;

        // Compute the trace
        let locator = Locator::new(*program_id, function_name);
        let (response, mut trace) = vm.process().write().execute::<A>(authorization)?;
        trace.prepare(query)?;
        let execution = trace.prove_execution::<A, _>(&locator.to_string(), &mut rand::thread_rng())?;

        // Get the public outputs
        let mut public_outputs = vec![];
        response.outputs().iter().zip(response.output_ids().iter()).for_each(|(output, output_id)| {
            if let OutputID::Public(_) = output_id {
                public_outputs.push(output.clone());
            }
        });

        // If all outputs are requested, include them
        let response = if include_outputs { Some(response) } else { None };

        // Return the execution
        Ok(OfflineExecution::new(execution, response, trace, Some(public_outputs)))
    }

    /// Execute a program function on the Aleo Network.
    ///
    /// To run this function successfully, the program must already be deployed on the Aleo Network
    pub fn execute_program(
        &mut self,
        program_id: impl TryInto<ProgramID<N>>,
        function: impl TryInto<Identifier<N>>,
        inputs: impl ExactSizeIterator<Item = impl TryInto<Value<N>>>,
        priority_fee: u64,
        fee_record: Record<N, Plaintext<N>>,
        password: Option<&str>,
    ) -> Result<String> {
        // Ensure a network client is set, otherwise online execution is not possible
        ensure!(
            self.api_client.is_some(),
            "❌ Network client not set. A network client must be set before execution in order to send an execution transaction to the Aleo network"
        );

        // Check program and function have valid names
        let program_id = program_id.try_into().map_err(|_| anyhow!("Invalid program ID"))?;
        let function_id = function.try_into().map_err(|_| anyhow!("Invalid function name"))?;
        let function_name = function_id.to_string();

        // Get the program from chain, error if it doesn't exist
        let program = self
            .api_client()?
            .get_program(program_id)
            .map_err(|_| anyhow!("Program {program_id:?} does not exist on the Aleo Network. Try deploying the program first before executing."))?;

        // Create the execution transaction
        let private_key = self.get_private_key(password)?;
        let node_url = self.api_client.as_ref().unwrap().base_url().to_string();
        let transaction = Self::create_execute_transaction(
            &private_key,
            priority_fee,
            inputs,
            fee_record,
            &program,
            function_id,
            node_url,
            self.api_client()?,
        )?;

        // Broadcast the execution transaction to the network
        println!("Attempting to broadcast execution transaction for {program_id:?}");
        let execution = self.broadcast_transaction(transaction);

        // Tell the user about the result of the execution before returning it
        if execution.is_ok() {
            println!("✅ Execution of function {function_name:?} from program {program_id:?}' broadcast successfully");
        } else {
            println!("❌ Execution of function {function_name:?} from program {program_id:?} failed to broadcast");
        }

        execution
    }

    /// Create an execute transaction without initializing a program manager instance
    #[allow(clippy::too_many_arguments)]
    pub fn create_execute_transaction(
        private_key: &PrivateKey<N>,
        priority_fee: u64,
        inputs: impl ExactSizeIterator<Item = impl TryInto<Value<N>>>,
        fee_record: Record<N, Plaintext<N>>,
        program: &Program<N>,
        function: impl TryInto<Identifier<N>>,
        node_url: String,
        api_client: &AleoAPIClient<N>,
    ) -> Result<Transaction<N>> {
        // Initialize an RNG and query object for the transaction
        let rng = &mut rand::thread_rng();
        let query = Query::from(node_url);

        // Check that the function exists in the program
        let function_name = function.try_into().map_err(|_| anyhow!("Invalid function name"))?;
        let program_id = program.id();
        println!("Checking function {function_name:?} exists in {program_id:?}");
        ensure!(
            program.contains_function(&function_name),
            "Program {program_id:?} does not contain function {function_name:?}, aborting execution"
        );

        // Initialize the VM
        let vm = Self::initialize_vm(api_client, program, true)?;

        // Create an execution transaction
        vm.execute(private_key, (program_id, function_name), inputs, Some((fee_record, priority_fee)), Some(query), rng)
    }

    /// Estimate the cost of executing a program with the given inputs in microcredits. The response
    /// will be in the form of (total_cost, (storage_cost, finalize_cost))
    ///
    /// Disclaimer: Fee estimation is experimental and may not represent a correct estimate on any current or future network
    pub fn estimate_execution_fee<A: Aleo<Network = N>>(
        &self,
        program: &Program<N>,
        function: impl TryInto<Identifier<N>>,
        inputs: impl ExactSizeIterator<Item = impl TryInto<Value<N>>>,
    ) -> Result<(u64, (u64, u64))> {
        let url = self.api_client.as_ref().map_or_else(
            || bail!("A network client must be configured to estimate a program execution fee"),
            |api_client| Ok(api_client.base_url()),
        )?;

        // Check that the function exists in the program
        let function_name = function.try_into().map_err(|_| anyhow!("Invalid function name"))?;
        let program_id = program.id();
        println!("Checking function {function_name:?} exists in {program_id:?}");
        ensure!(
            program.contains_function(&function_name),
            "Program {program_id:?} does not contain function {function_name:?}, aborting execution"
        );

        // Create an ephemeral SnarkVM to store the programs
        // Initialize an RNG and query object for the transaction
        let rng = &mut rand::thread_rng();
        let query = Query::<N, BlockMemory<N>>::from(url);
        let vm = Self::initialize_vm(self.api_client()?, program, true)?;

        // Create an ephemeral private key for the sample execution
        let private_key = PrivateKey::<N>::new(rng)?;

        // Compute the authorization.
        let authorization = vm.authorize(&private_key, program_id, function_name, inputs, rng)?;

        let locator = Locator::new(*program_id, function_name);
        let (_, mut trace) = vm.process().write().execute::<A>(authorization)?;
        trace.prepare(query)?;
        let execution = trace.prove_execution::<A, _>(&locator.to_string(), &mut rand::thread_rng())?;
        execution_cost(&vm, &execution)
    }

    /// Estimate the finalize fee component for executing a function. This fee is additional to the
    /// size of the execution of the program in bytes. If the function does not have a finalize
    /// step, then the finalize fee is 0.
    ///
    /// Disclaimer: Fee estimation is experimental and may not represent a correct estimate on any current or future network
    pub fn estimate_finalize_fee(&self, program: &Program<N>, function: impl TryInto<Identifier<N>>) -> Result<u64> {
        let function_name = function.try_into().map_err(|_| anyhow!("Invalid function name"))?;
        match program.get_function(&function_name)?.finalize() {
            Some((_, finalize)) => cost_in_microcredits(finalize),
            None => Ok(0u64),
        }
    }
}

#[cfg(test)]
#[cfg(not(feature = "wasm"))]
mod tests {
    use super::*;
    use crate::{random_program, random_program_id, AleoAPIClient, RECORD_5_MICROCREDITS};
    use snarkvm::circuit::AleoV0;
    use snarkvm_console::network::Testnet3;

    #[test]
    fn test_fee_estimation() {
        let private_key = PrivateKey::<Testnet3>::from_str(RECIPIENT_PRIVATE_KEY).unwrap();
        let api_client = AleoAPIClient::<Testnet3>::testnet3();
        let program_manager =
            ProgramManager::<Testnet3>::new(Some(private_key), None, Some(api_client.clone()), None).unwrap();

        let finalize_program = program_manager.api_client.as_ref().unwrap().get_program("lottery_first.aleo").unwrap();
        let hello_hello = program_manager.api_client.as_ref().unwrap().get_program("hello_hello.aleo").unwrap();
        // Ensure a finalize scope program execution fee is estimated correctly
        let (total, (storage, finalize)) = program_manager
            .estimate_execution_fee::<AleoV0>(&finalize_program, "play", Vec::<&str>::new().into_iter())
            .unwrap();
        let finalize_only = program_manager.estimate_finalize_fee(&finalize_program, "play").unwrap();
        assert!(finalize_only > 0);
        assert!(finalize > storage);
        assert_eq!(finalize, finalize_only);
        assert_eq!(total, finalize_only + storage);
        assert_eq!(storage, total - finalize_only);

        // Ensure a non-finalize scope program execution fee is estimated correctly
        let (total, (storage, finalize)) = program_manager
            .estimate_execution_fee::<AleoV0>(&hello_hello, "hello", vec!["5u32", "5u32"].into_iter())
            .unwrap();
        let finalize_only = program_manager.estimate_finalize_fee(&hello_hello, "hello").unwrap();
        assert!(storage > 0);
        assert_eq!(finalize_only, 0);
        assert_eq!(finalize, finalize_only);
        assert_eq!(total, finalize_only + storage);
        assert_eq!(storage, total - finalize_only);

        // Ensure a deployment fee is estimated correctly
        let random = random_program();
        let (total, (storage, namespace)) = program_manager.estimate_deployment_fee::<AleoV0>(&random).unwrap();
        let namespace_only = ProgramManager::estimate_namespace_fee(random.id()).unwrap();
        assert_eq!(namespace, 1000000);
        assert_eq!(namespace, namespace_only);
        assert_eq!(total, namespace_only + storage);
        assert_eq!(storage, total - namespace_only);

        // Ensure a program with imports is estimated correctly
        let nested_import_program = api_client.get_program("imported_add_mul.aleo").unwrap();
        let finalize_only = program_manager.estimate_finalize_fee(&nested_import_program, "add_and_double").unwrap();
        let (total, (storage, finalize)) = program_manager
            .estimate_execution_fee::<AleoV0>(
                &nested_import_program,
                "add_and_double",
                vec!["5u32", "5u32"].into_iter(),
            )
            .unwrap();
        assert!(storage > 0);
        assert_eq!(finalize_only, 0);
        assert_eq!(finalize, finalize_only);
        assert_eq!(total, finalize_only + storage);
        assert_eq!(storage, total - finalize_only);

        let (total, (storage, namespace)) =
            program_manager.estimate_deployment_fee::<AleoV0>(&nested_import_program).unwrap();
        let namespace_only = ProgramManager::estimate_namespace_fee(nested_import_program.id()).unwrap();
        assert_eq!(namespace, 1000000);
        assert_eq!(namespace, namespace_only);
        assert_eq!(total, namespace_only + storage);
        assert_eq!(storage, total - namespace_only);
    }

    #[test]
    #[ignore]
    fn test_execution() {
        let private_key = PrivateKey::<Testnet3>::from_str(RECIPIENT_PRIVATE_KEY).unwrap();
        let encrypted_private_key =
            crate::Encryptor::encrypt_private_key_with_secret(&private_key, "password").unwrap();
        let api_client = AleoAPIClient::<Testnet3>::local_testnet3("3030");
        let record_finder = RecordFinder::new(api_client.clone());
        let mut program_manager =
            ProgramManager::<Testnet3>::new(Some(private_key), None, Some(api_client.clone()), None).unwrap();

        let fee = 2_500_000;
        let finalize_fee = 8_000_000;

        // Test execution of an on chain program is successful
        for i in 0..5 {
            let fee_record = record_finder.find_one_record(&private_key, fee).unwrap();
            // Test execution of a on chain program is successful
            let execution = program_manager.execute_program(
                "credits_import_test.aleo",
                "test",
                ["1312u32", "62131112u32"].into_iter(),
                fee,
                fee_record,
                None,
            );
            println!("{:?}", execution);

            if execution.is_ok() {
                break;
            } else if i == 4 {
                panic!("{}", format!("Execution failed after 5 attempts with error: {:?}", execution));
            }
        }

        // Test programs can be executed with an encrypted private key
        let mut program_manager =
            ProgramManager::<Testnet3>::new(None, Some(encrypted_private_key), Some(api_client), None).unwrap();

        for i in 0..5 {
            let fee_record = record_finder.find_one_record(&private_key, fee).unwrap();
            // Test execution of an on chain program is successful using an encrypted private key
            let execution = program_manager.execute_program(
                "credits_import_test.aleo",
                "test",
                ["1337u32", "42u32"].into_iter(),
                fee,
                fee_record,
                Some("password"),
            );
            if execution.is_ok() {
                break;
            } else if i == 4 {
                panic!("{}", format!("Execution failed after 5 attempts with error: {:?}", execution));
            }
        }

        // Test execution with a finalize scope can be done
        for i in 0..5 {
            let fee_record = record_finder.find_one_record(&private_key, finalize_fee).unwrap();
            // Test execution of an on chain program is successful using an encrypted private key
            let execution = program_manager.execute_program(
                "finalize_test.aleo",
                "increase_counter",
                ["0u32", "42u32"].into_iter(),
                finalize_fee,
                fee_record,
                Some("password"),
            );
            if execution.is_ok() {
                break;
            } else if i == 4 {
                panic!("{}", format!("Execution failed after 5 attempts with error: {:?}", execution));
            }
        }

        // Test execution of a program with imports other than credits.aleo is successful
        for i in 0..5 {
            let fee_record = record_finder.find_one_record(&private_key, finalize_fee).unwrap();
            // Test execution of an on chain program is successful using an encrypted private key
            let execution = program_manager.execute_program(
                "double_test.aleo",
                "double_it",
                ["42u32"].into_iter(),
                finalize_fee,
                fee_record,
                Some("password"),
            );
            if execution.is_ok() {
                break;
            } else if i == 4 {
                panic!("{}", format!("Execution failed after 5 attempts with error: {:?}", execution));
            }
        }
    }

    #[test]
    fn test_execution_failure_modes() {
        let rng = &mut rand::thread_rng();
        let recipient_private_key = PrivateKey::<Testnet3>::new(rng).unwrap();
        let api_client = AleoAPIClient::<Testnet3>::testnet3();
        let record_5_microcredits = Record::<Testnet3, Plaintext<Testnet3>>::from_str(RECORD_5_MICROCREDITS).unwrap();
        let record_2000000001_microcredits =
            Record::<Testnet3, Plaintext<Testnet3>>::from_str(RECORD_2000000001_MICROCREDITS).unwrap();

        // Ensure that program manager creation fails if no key is provided
        let mut program_manager =
            ProgramManager::<Testnet3>::new(Some(recipient_private_key), None, Some(api_client), None).unwrap();

        // Assert that execution fails if record's available microcredits are below the fee
        let execution = program_manager.execute_program(
            "hello.aleo",
            "hello",
            ["5u32", "6u32"].into_iter(),
            500000,
            record_5_microcredits,
            None,
        );

        assert!(execution.is_err());

        // Assert that execution fails if a fee is specified but no records are
        let execution = program_manager.execute_program(
            "hello.aleo",
            "hello",
            ["5u32", "6u32"].into_iter(),
            200,
            record_2000000001_microcredits.clone(),
            None,
        );

        assert!(execution.is_err());

        // Assert that execution fails if the program is not found
        let randomized_program_id = random_program_id(16);
        let execution = program_manager.execute_program(
            &randomized_program_id,
            "hello",
            ["5u32", "6u32"].into_iter(),
            500000,
            record_2000000001_microcredits.clone(),
            None,
        );

        assert!(execution.is_err());

        // Assert that execution fails if the function is not found
        let execution = program_manager.execute_program(
            "hello.aleo",
            "random_function",
            ["5u32", "6u32"].into_iter(),
            500000,
            record_2000000001_microcredits.clone(),
            None,
        );

        assert!(execution.is_err());

        // Assert that execution fails if the function is not found
        let execution = program_manager.execute_program(
            "hello.aleo",
            "random_function",
            ["5u32", "6u32"].into_iter(),
            500000,
            record_2000000001_microcredits,
            None,
        );

        assert!(execution.is_err());
    }
}
