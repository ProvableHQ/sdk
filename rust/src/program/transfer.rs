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
    /// Executes a transfer to the specified recipient_address with the specified amount and fee.
    /// Specify 0 for no fee.
    pub fn transfer(
        &self,
        amount: u64,
        fee: u64,
        recipient_address: Address<N>,
        password: Option<&str>,
        amount_record: Record<N, Plaintext<N>>,
        fee_record: Record<N, Plaintext<N>>,
    ) -> Result<String> {
        // Ensure records provided have enough credits to cover the transfer amount and fee
        ensure!(
            amount_record.microcredits()? >= amount,
            "Credits in amount record must greater than transfer amount specified"
        );
        ensure!(fee_record.microcredits()? >= fee, "Fee must be greater than 0");

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
                Value::Record(amount_record),
                Value::from_str(&recipient_address.to_string())?,
                Value::from_str(&format!("{}u64", amount))?,
            ];

            // Create a new transaction.
            vm.execute(
                &private_key,
                ("credits.aleo", "transfer"),
                inputs.iter(),
                Some((fee_record, fee)),
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
    use snarkvm_console::network::Testnet3;

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
        //thread::sleep(std::time::Duration::from_secs(60));

        // Make several transactions from the genesis account since the genesis account keeps spending records,
        // it may take a few tries to transfer successfully
        for i in 0..10 {
            let records = record_finder.find_amount_and_fee_records(100, 500_000, &beacon_private_key);
            if records.is_err() {
                println!("Record not found: {} - retrying", records.unwrap_err());
                thread::sleep(std::time::Duration::from_secs(3));
                continue;
            }

            let (input_record, fee_record) = records.unwrap();
            let result = program_manager.transfer(100, 500000, recipient_address, None, input_record, fee_record);
            if result.is_err() {
                println!("Transfer error: {} - retrying", result.unwrap_err());
            } else if i > 8 {
                panic!("Failed to transfer after 8 transfer errors");
            }

            // Wait for the chain to update blocks
            thread::sleep(std::time::Duration::from_secs(15));

            // Check the balance of the recipient
            let api_client = program_manager.api_client().unwrap();
            let height = api_client.latest_height().unwrap();
            let records = api_client.get_unspent_records(&recipient_private_key, 0..height, None, None).unwrap();
            if !records.is_empty() {
                let (_, record) = &records[0];
                let record_plaintext = record.decrypt(&recipient_view_key).unwrap();
                let amount = record_plaintext.microcredits().unwrap();
                if amount == 100 {
                    break;
                }
            }
        }
    }
}
