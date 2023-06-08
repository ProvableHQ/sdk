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
        transfer_type: TransferType,
        password: Option<&str>,
        amount_record: Option<Record<N, Plaintext<N>>>,
        fee_record: Record<N, Plaintext<N>>,
    ) -> Result<String> {
        ensure!(amount > 0, "Amount must be greater than 0");
        ensure!(fee > 0, "Fee must be greater than 0");

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
            let (transfer_function, inputs) = match transfer_type {
                TransferType::Public => {
                    let inputs = vec![
                        Value::from_str(&recipient_address.to_string())?,
                        Value::from_str(&format!("{}u64", amount))?,
                    ];
                    ("transfer_public", inputs)
                }
                TransferType::Private => {
                    if amount_record.is_none() {
                        bail!("Amount record must be specified for private transfers");
                    } else {
                        let inputs = vec![
                            Value::Record(amount_record.unwrap()),
                            Value::from_str(&recipient_address.to_string())?,
                            Value::from_str(&format!("{}u64", amount))?,
                        ];
                        ("transfer_private", inputs)
                    }
                }
                TransferType::PublicToPrivate => {
                    let inputs = vec![
                        Value::from_str(&recipient_address.to_string())?,
                        Value::from_str(&format!("{}u64", amount))?,
                    ];
                    ("transfer_public_to_private", inputs)
                }
                TransferType::PrivateToPublic => {
                    if amount_record.is_none() {
                        bail!("Amount record must be specified for private transfers");
                    } else {
                        let inputs = vec![
                            Value::Record(amount_record.unwrap()),
                            Value::from_str(&recipient_address.to_string())?,
                            Value::from_str(&format!("{}u64", amount))?,
                        ];
                        ("transfer_private_to_public", inputs)
                    }
                }
            };

            // Create a new transaction.
            vm.execute(
                &private_key,
                ("credits.aleo", transfer_function),
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
    fn test_private_transfer() {
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
            let records = record_finder.find_amount_and_fee_records(2_000_000, 2_000_000, &beacon_private_key);
            if records.is_err() {
                println!("Record not found: {} - retrying", records.unwrap_err());
                thread::sleep(std::time::Duration::from_secs(3));
                continue;
            }

            let (input_record, fee_record) = records.unwrap();
            let result = program_manager.transfer(
                1_000_000,
                1_000_000,
                recipient_address,
                TransferType::Private,
                None,
                Some(input_record),
                fee_record,
            );
            if result.is_err() {
                println!("Transfer error: {} - retrying", result.unwrap_err());
            } else if i > 8 {
                panic!("Failed to transfer after 8 transfer errors");
            }

            // Wait for the chain to update blocks
            thread::sleep(std::time::Duration::from_secs(25));

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

        // Execute transfer_private_to_public until the desired transaction shows up on chain
        for i in 0..10 {
            let records = record_finder.find_amount_and_fee_records(5_000_000, 3_000_000, &beacon_private_key);
            if records.is_err() {
                println!("Record not found: {} - retrying", records.unwrap_err());
                thread::sleep(std::time::Duration::from_secs(3));
                continue;
            }

            let (input_record, fee_record) = records.unwrap();
            let result = program_manager.transfer(
                4_000_000,
                2_000_000,
                recipient_address,
                TransferType::PrivateToPublic,
                None,
                Some(input_record),
                fee_record,
            );
            if result.is_err() {
                println!("Transfer error: {} - retrying", result.unwrap_err());
            } else if i > 8 {
                panic!("Failed to execute transfer_private_to_public after 8 transfer errors");
            }

            // Wait for the chain to update blocks
            thread::sleep(std::time::Duration::from_secs(25));
            // TODO (iamalwaysuncomfortable): Check that the balance of the recipient is correct
        }

        // Execute transfer_public until the desired transaction shows up on chain
        for i in 0..10 {
            let record = record_finder.find_one_record(&beacon_private_key, 2_000_000);
            if record.is_err() {
                println!("Record not found: {} - retrying", record.unwrap_err());
                thread::sleep(std::time::Duration::from_secs(3));
                continue;
            }

            let fee_record = record.unwrap();
            let result = program_manager.transfer(
                2_500_000,
                1_000_000,
                recipient_address,
                TransferType::Public,
                None,
                None,
                fee_record,
            );
            if result.is_err() {
                println!("Transfer error: {} - retrying", result.unwrap_err());
            } else if i > 8 {
                panic!("Failed to execute transfer_private_to_public after 8 transfer errors");
            }

            // Wait for the chain to update blocks
            thread::sleep(std::time::Duration::from_secs(25));
            // TODO (iamalwaysuncomfortable): Check that the balance of the recipient is correct
        }

        // Execute transfer_public_to_private until the desired transaction shows up on chain
        for i in 0..10 {
            let record = record_finder.find_one_record(&beacon_private_key, 2_000_000);
            if record.is_err() {
                println!("Record not found: {} - retrying", record.unwrap_err());
                thread::sleep(std::time::Duration::from_secs(3));
                continue;
            }

            let fee_record = record.unwrap();
            let result = program_manager.transfer(
                1_500_000,
                1_000_000,
                recipient_address,
                TransferType::Public,
                None,
                None,
                fee_record,
            );
            if result.is_err() {
                println!("Transfer error: {} - retrying", result.unwrap_err());
            } else if i > 8 {
                panic!("Failed to execute transfer_private_to_public after 8 transfer errors");
            }

            // Wait for the chain to update blocks
            thread::sleep(std::time::Duration::from_secs(25));

            // Check the balance of the recipient
            let api_client = program_manager.api_client().unwrap();
            let height = api_client.latest_height().unwrap();
            let records = api_client.get_unspent_records(&recipient_private_key, 0..height, None, None).unwrap();
            if !records.is_empty() {
                let (_, record) = &records[0];
                let record_plaintext = record.decrypt(&recipient_view_key).unwrap();
                let amount = record_plaintext.microcredits().unwrap();
                if amount == 1_500_000 {
                    break;
                }
            }
        }
    }
}
