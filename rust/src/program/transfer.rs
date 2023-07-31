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
    #[allow(clippy::too_many_arguments)]
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
        // Ensure records provided have enough credits to cover the transfer amount and fee
        if let Some(amount_record) = amount_record.as_ref() {
            ensure!(
                amount_record.microcredits()? >= amount,
                "Credits in amount record must greater than transfer amount specified"
            );
        }
        ensure!(fee_record.microcredits()? >= fee, "Fee must be greater than the fee specified in the record");

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

    // Attempt to transfer the specified amount from the sender to the recipient.
    fn try_transfer(
        sender: &PrivateKey<Testnet3>,
        recipient: &Address<Testnet3>,
        amount: u64,
        visibility: TransferType,
    ) {
        println!("Attempting to transfer of type: {visibility:?} of {amount} to {recipient:?}");
        let api_client = AleoAPIClient::<Testnet3>::local_testnet3("3030");
        let program_manager =
            ProgramManager::<Testnet3>::new(Some(*sender), None, Some(api_client.clone()), None).unwrap();
        let record_finder = RecordFinder::new(api_client);
        let fee = 5_000_000;
        for i in 0..10 {
            let (amount_record, fee_record) = match &visibility {
                TransferType::Public => {
                    let fee_record = record_finder.find_one_record(sender, fee);
                    if fee_record.is_err() {
                        println!("Record not found: {} - retrying", fee_record.unwrap_err());
                        thread::sleep(std::time::Duration::from_secs(3));
                        if i == 9 {
                            panic!("Transfer failed after 10 attempts");
                        }
                        continue;
                    }
                    (None, fee_record.unwrap())
                }
                TransferType::PublicToPrivate => {
                    let fee_record = record_finder.find_one_record(sender, fee);
                    if fee_record.is_err() {
                        println!("Record not found: {} - retrying", fee_record.unwrap_err());
                        thread::sleep(std::time::Duration::from_secs(3));
                        if i == 9 {
                            panic!("Transfer failed after 10 attempts");
                        }
                        continue;
                    }
                    (None, fee_record.unwrap())
                }
                _ => {
                    let record = record_finder.find_amount_and_fee_records(amount, fee, sender);
                    if record.is_err() {
                        println!("Record not found: {} - retrying", record.unwrap_err());
                        thread::sleep(std::time::Duration::from_secs(3));
                        continue;
                    }
                    let (amount_record, fee_record) = record.unwrap();
                    (Some(amount_record), fee_record)
                }
            };

            let result = program_manager.transfer(amount, fee, *recipient, visibility, None, amount_record, fee_record);
            if result.is_err() {
                println!("Transfer error: {} - retrying", result.unwrap_err());
                if i == 9 {
                    panic!("Transfer failed after 10 attempts");
                }
            } else {
                break;
            }
        }
    }

    // Check that the specified amount has been transferred from the sender to the recipient.
    fn verify_transfer(
        amount: u64,
        api_client: &AleoAPIClient<Testnet3>,
        recipient_private_key: &PrivateKey<Testnet3>,
        visibility: TransferType,
    ) {
        for i in 0..10 {
            println!("Attempting to verify transfer of visibility: {visibility:?} for amount: {amount}");
            let height = api_client.latest_height().unwrap();
            let records = api_client.get_unspent_records(recipient_private_key, 0..height, None, None).unwrap();
            let mut is_verified = false;
            if !records.is_empty() {
                for record in records.iter() {
                    let (_, record) = record;
                    let record_amount = record.microcredits().unwrap();
                    println!("Found amount: {record_amount} - expected: {amount}");
                    if amount == record_amount {
                        println!("✅ Transfer of {amount} verified for transfer type: {visibility:?}");
                        is_verified = true;
                        break;
                    }
                }
                if is_verified {
                    break;
                }
            }
            thread::sleep(std::time::Duration::from_secs(3));
            if i > 8 {
                let error =
                    format!("❌ Failed to verify transfer of visibility: {visibility:?} after 8 transfer errors");
                panic!("{error}");
            }
        }
    }

    #[test]
    #[ignore]
    fn test_transfer_roundtrip() {
        // Initialize necessary key material
        // Use the beacon private key to make the initial transfer
        let beacon_private_key = PrivateKey::<Testnet3>::from_str(BEACON_PRIVATE_KEY).unwrap();
        let amount = 16_666_666;
        let amount_str = "16666666u64";
        let fee = 26_666_666;
        // Create a unique recipient for each transfer type so we can unique identify each transfer
        let private_recipient_private_key =
            PrivateKey::<Testnet3>::from_str("APrivateKey1zkpCF24vGLohfHWNZam1z7qDhDq5Bp1u8WPFhh9q2wWoNh8").unwrap();
        let private_recipient_view_key = ViewKey::try_from(&private_recipient_private_key).unwrap();
        let private_recipient_address = Address::try_from(&private_recipient_view_key).unwrap();
        let private_to_public_recipient_private_key =
            PrivateKey::<Testnet3>::from_str("APrivateKey1zkpFkojCEFsw3LaozkqaVkMuxdTq2DEsUV88WGexXoWGuNA").unwrap();
        let private_to_public_recipient_view_key = ViewKey::try_from(&private_to_public_recipient_private_key).unwrap();
        let private_to_public_recipient_address = Address::try_from(&private_to_public_recipient_view_key).unwrap();
        let public_recipient_private_key =
            PrivateKey::<Testnet3>::from_str("APrivateKey1zkp6rwhE5Jxz16cv32kM8Z8VMsLe78BCK8LU3FM7htmSsis").unwrap();
        let public_recipient_view_key = ViewKey::try_from(&public_recipient_private_key).unwrap();
        let public_recipient_address = Address::try_from(&public_recipient_view_key).unwrap();
        let public_to_private_recipient_private_key =
            PrivateKey::<Testnet3>::from_str("APrivateKey1zkp3NchSbrypyf2UoJSGyag58biAFPvtd1WtpM5M9pqoifK").unwrap();
        let public_to_private_recipient_view_key = ViewKey::try_from(&public_to_private_recipient_private_key).unwrap();
        let public_to_private_recipient_address = Address::try_from(&public_to_private_recipient_view_key).unwrap();
        let api_client = AleoAPIClient::<Testnet3>::local_testnet3("3030");
        let public_address_literal = Literal::<Testnet3>::from_str(&public_recipient_address.to_string()).unwrap();
        let private_to_public_address_literal =
            Literal::<Testnet3>::from_str(&private_to_public_recipient_address.to_string()).unwrap();
        let expected_value = Value::from(Plaintext::<Testnet3>::from_str(amount_str).unwrap());
        let zero_value = Value::from(Plaintext::<Testnet3>::from_str("0u64").unwrap());

        println!("Private recipient private_key: {}", private_recipient_private_key);
        println!("Private recipient address: {}", private_recipient_address);
        println!("Private to public recipient private_key: {}", private_to_public_recipient_private_key);
        println!("Private to public recipient address: {}", private_to_public_recipient_address);
        println!("Public recipient private_key: {}", public_recipient_private_key);
        println!("Public recipient address: {}", public_recipient_address);
        println!("Public to private recipient private_key: {}", public_to_private_recipient_private_key);
        println!("Public to private recipient address: {}", public_to_private_recipient_address);

        // Transfer funds to the private recipient and confirm that the transaction is on chain
        try_transfer(&beacon_private_key, &private_recipient_address, amount, TransferType::Private);

        // Transfer funds to each of the other recipients to pay the fee with
        try_transfer(&beacon_private_key, &private_recipient_address, fee, TransferType::Private);
        try_transfer(&beacon_private_key, &private_to_public_recipient_address, fee, TransferType::Private);
        try_transfer(&beacon_private_key, &public_recipient_address, fee, TransferType::Private);
        try_transfer(&beacon_private_key, &public_to_private_recipient_address, fee, TransferType::Private);
        thread::sleep(std::time::Duration::from_secs(20));

        // Verify private transfer
        verify_transfer(amount, &api_client, &private_recipient_private_key, TransferType::Private);

        // Transfer funds to the private_to_public recipient
        try_transfer(
            &private_recipient_private_key,
            &private_to_public_recipient_address,
            amount,
            TransferType::PrivateToPublic,
        );
        thread::sleep(std::time::Duration::from_secs(25));
        let value =
            api_client.get_mapping_value("credits.aleo", "account", &private_to_public_address_literal).unwrap();
        assert!(value.eq(&expected_value));

        try_transfer(&private_to_public_recipient_private_key, &public_recipient_address, amount, TransferType::Public);
        thread::sleep(std::time::Duration::from_secs(25));
        let value = api_client.get_mapping_value("credits.aleo", "account", public_address_literal).unwrap();
        assert!(value.eq(&expected_value));
        let value =
            api_client.get_mapping_value("credits.aleo", "account", &private_to_public_address_literal).unwrap();
        assert!(value.eq(&zero_value));

        // Transfer funds to the public_to_private recipient and ensure the funds made the entire journey
        try_transfer(
            &public_recipient_private_key,
            &public_to_private_recipient_address,
            amount,
            TransferType::PublicToPrivate,
        );
        thread::sleep(std::time::Duration::from_secs(25));
        verify_transfer(amount, &api_client, &public_to_private_recipient_private_key, TransferType::PublicToPrivate);
    }
}
