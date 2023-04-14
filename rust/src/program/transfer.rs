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

use crate::ProgramManager;
use snarkvm::{
    console::{
        account::Address,
        program::{Network, Plaintext, Record, Value},
    },
    synthesizer::{ConsensusMemory, ConsensusStore, Query, Transaction, VM},
};

use anyhow::{ensure, Result};
use std::str::FromStr;

impl<N: Network> ProgramManager<N> {
    /// Executes a transfer to the specified recipient_address with the specified amount and fee.
    /// Specify 0 for no fee.
    pub fn transfer(
        &self,
        amount: u64,
        fee: u64,
        recipient_address: Address<N>,
        password: Option<&str>,
        input_record: Record<N, Plaintext<N>>,
        fee_record: Option<Record<N, Plaintext<N>>>,
    ) -> Result<String> {
        ensure!(amount > 0, "Amount must be greater than 0");

        let additional_fee = if fee > 0 {
            ensure!(fee_record.is_some(), "If a fee is specified, a fee record must be specified to pay for it");
            Some((fee_record.unwrap(), fee))
        } else {
            if fee_record.is_some() {
                println!("⚠️ Warning: Fee record specified but fee is 0, the fee record will not be used");
            }
            None
        };

        // Specify the network state query
        let query = Query::from(self.api_client.as_ref().unwrap().base_url());

        // Retrieve the private key.
        let private_key = self.get_private_key(password)?;

        // Generate the execution transaction
        let execution = {
            let rng = &mut rand::thread_rng();

            // Initialize a VM
            let store = ConsensusStore::<N, ConsensusMemory<N>>::open(None)?;
            let vm = VM::from(store)?;

            // Prepare the inputs for a transfer.
            let inputs = vec![
                Value::Record(input_record),
                Value::from_str(&recipient_address.to_string())?,
                Value::from_str(&format!("{}u64", amount))?,
            ];

            // Create a new transaction.
            Transaction::execute(
                &vm,
                &private_key,
                "credits.aleo",
                "transfer",
                inputs.iter(),
                additional_fee,
                Some(query),
                rng,
            )?
        };

        self.broadcast_transaction(execution)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{test_utils::BEACON_PRIVATE_KEY, AleoAPIClient, RecordFinder};
    use snarkvm_console::{
        account::{Address, PrivateKey, ViewKey},
        network::Testnet3,
    };

    use std::{str::FromStr, thread};

    #[test]
    #[ignore]
    fn test_transfer() {
        let api_client = AleoAPIClient::<Testnet3>::local_testnet3("3030");
        let beacon_private_key = PrivateKey::<Testnet3>::from_str(BEACON_PRIVATE_KEY).unwrap();
        let rng = &mut rand::thread_rng();
        let recipient_private_key = PrivateKey::<Testnet3>::new(rng).unwrap();
        let recipient_view_key = ViewKey::try_from(&recipient_private_key).unwrap();
        let recipient_address = Address::try_from(&recipient_view_key).unwrap();
        let program_manager =
            ProgramManager::<Testnet3>::new(Some(beacon_private_key), None, Some(api_client.clone()), None).unwrap();
        let record_finder = RecordFinder::new(api_client);
        // Wait for the chain to to start
        thread::sleep(std::time::Duration::from_secs(60));

        // Make several transactions from the genesis account since the genesis account keeps spending records,
        // it may take a few tries to transfer successfully
        for i in 0..10 {
            let record = record_finder.find_one_record(&beacon_private_key, 100);
            if record.is_err() {
                println!("Record not found: {} - retrying", record.unwrap_err());
                thread::sleep(std::time::Duration::from_secs(3));
                continue;
            }
            let input_record = record.unwrap();
            let result = program_manager.transfer(100, 0, recipient_address, None, input_record, None);
            if result.is_err() {
                println!("Transfer error: {} - retrying", result.unwrap_err());
            } else if i > 6 {
                break;
            }

            // Wait 2 seconds before trying again
            thread::sleep(std::time::Duration::from_secs(2));
        }

        // Wait for the chain to update blocks
        thread::sleep(std::time::Duration::from_secs(35));

        // Check the balance of the recipient
        let api_client = program_manager.api_client().unwrap();
        let height = api_client.latest_height().unwrap();
        let records = api_client.get_unspent_records(&recipient_private_key, 0..height, None, None).unwrap();
        let (_, record) = &records[0];
        let record_plaintext = record.decrypt(&recipient_view_key).unwrap();
        assert_eq!(***record_plaintext.gates(), 100);
    }
}
