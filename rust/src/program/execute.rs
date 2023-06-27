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
    /// Execute a program function on the Aleo Network.
    ///
    /// To run this function successfully, the program must already be deployed on the Aleo Network
    pub fn execute_program(
        &mut self,
        program_id: impl TryInto<ProgramID<N>>,
        function: impl TryInto<Identifier<N>>,
        inputs: impl ExactSizeIterator<Item = impl TryInto<Value<N>>>,
        fee: u64,
        fee_record: Record<N, Plaintext<N>>,
        password: Option<&str>,
    ) -> Result<String> {
        ensure!(fee > 0, "Fee must be greater than 0");

        // Ensure network config is set, otherwise execution is not possible
        ensure!(
            self.api_client.is_some(),
            "❌ Network client not set. A network client must be set before execution in order to send an execution transaction to the Aleo network"
        );

        // Check program and function has a valid name
        let program_id = program_id.try_into().map_err(|_| anyhow!("Invalid program ID"))?;
        let function_id = function.try_into().map_err(|_| anyhow!("Invalid function name"))?;
        let function_name = function_id.to_string();

        // Get the program from chain, error if it doesn't exist
        let program = self
            .api_client()?
            .get_program(program_id)
            .map_err(|_| anyhow!("Program {program_id:?} does not exist on the Aleo Network. Try deploying the program first before executing."))?;

        // Try to get the private key configured in the program manager
        let private_key = self.get_private_key(password)?;

        // Attempt to construct the execution transaction
        println!("Building transaction..");
        let query = self.api_client.as_ref().unwrap().base_url();
        let transaction = Self::create_execute_transaction(
            &private_key,
            fee,
            inputs,
            fee_record,
            &program,
            function_id,
            query.to_string(),
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

    /// Create an execute transaction
    pub fn create_execute_transaction(
        private_key: &PrivateKey<N>,
        fee: u64,
        inputs: impl ExactSizeIterator<Item = impl TryInto<Value<N>>>,
        fee_record: Record<N, Plaintext<N>>,
        program: &Program<N>,
        function: impl TryInto<Identifier<N>>,
        query: String,
    ) -> Result<Transaction<N>> {
        // Initialize an RNG and query object for the transaction
        let rng = &mut rand::thread_rng();
        let query = Query::from(query);

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
        let _ = &vm.process().write().add_program(program);

        // Create an execution transaction
        vm.execute(private_key, (program_id, function_name), inputs, Some((fee_record, fee)), Some(query), rng)
    }
}

#[cfg(test)]
#[cfg(not(feature = "wasm"))]
mod tests {
    use super::*;
    use crate::{random_program_id, AleoAPIClient, RECORD_5_MICROCREDITS};
    use snarkvm::circuit::AleoV0;
    use snarkvm_console::network::Testnet3;

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
