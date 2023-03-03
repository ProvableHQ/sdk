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

use crate::{ProgramManager, RecordQuery, Resolver};
use snarkvm_console::{
    account::Address,
    program::{Network, Plaintext, Record, Value},
};
use snarkvm_synthesizer::{ConsensusMemory, ConsensusStore, Query, Transaction, VM};

use anyhow::{ensure, Result};
use std::str::FromStr;

impl<N: Network, R: Resolver<N>> ProgramManager<N, R> {
    /// Create a transfer transaction with specified records or record resolution queries.
    pub fn transfer_with_config(
        &self,
        amount: u64,
        fee: u64,
        recipient_address: Address<N>,
        password: Option<&str>,
        input_record: Option<Record<N, Plaintext<N>>>,
        fee_record: Option<Record<N, Plaintext<N>>>,
        record_query: &RecordQuery,
    ) -> Result<()> {
        ensure!(amount > 0, "Amount must be greater than 0");

        // Specify the network state query
        let query = Query::from(self.api_client.as_ref().unwrap().base_url());

        // Retrieve the private key.
        let private_key = self.get_private_key(password.clone())?;

        // Generate the execution transaction
        let execution = {
            let rng = &mut rand::thread_rng();

            // Initialize a VM
            let store = ConsensusStore::<N, ConsensusMemory<N>>::open(None)?;
            let vm = VM::from(store)?;

            // Prepare the records for the transfer and fee amounts
            let (input_record, fee_record) = self.resolve_amount_and_fee_from_parameters(
                amount,
                fee,
                input_record,
                fee_record,
                &private_key,
                record_query,
            )?;

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
                fee_record,
                Some(query),
                rng,
            )?
        };

        self.broadcast_transaction(execution)?;
        Ok(())
    }

    /// Executes an Aleo program function with the provided inputs.
    #[allow(clippy::format_in_format_args)]
    pub fn transfer(&self, amount: u64, fee: u64, recipient_address: Address<N>, password: Option<&str>) -> Result<()> {
        let record_query = RecordQuery::Options {
            amounts: Some(vec![amount, fee]),
            max_records: None,
            max_gates: None,
            unspent_only: true,
        };
        self.transfer_with_config(amount, fee, recipient_address, password, None, None, &record_query)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::AleoNetworkResolver;
    #[cfg(not(feature = "wasm"))]
    use crate::{api::NetworkConfig, test_utils::BEACON_PRIVATE_KEY};
    use snarkvm_console::account::ViewKey;
    #[cfg(not(feature = "wasm"))]
    use snarkvm_console::{
        account::{Address, PrivateKey},
        network::Testnet3,
    };

    use std::{str::FromStr, thread};

    #[test]
    #[cfg(not(feature = "wasm"))]
    #[ignore]
    fn test_transfer() {
        let network_config = NetworkConfig::local_testnet3("3030");
        let beacon_private_key = PrivateKey::<Testnet3>::from_str(BEACON_PRIVATE_KEY).unwrap();

        let program_manager =
            ProgramManager::<Testnet3, AleoNetworkResolver<Testnet3>>::program_manager_with_network_resolution(
                Some(beacon_private_key),
                None,
                network_config,
            )
            .unwrap();

        let rng = &mut rand::thread_rng();
        let recipient_private_key = PrivateKey::<Testnet3>::new(rng).unwrap();
        let recipient_view_key = ViewKey::try_from(&recipient_private_key).unwrap();
        let recipient_address = Address::try_from(&recipient_view_key).unwrap();

        // Wait for the chain to to start
        thread::sleep(std::time::Duration::from_secs(25));
        for _ in 0..10 {
            let result = program_manager.transfer(100, 0, recipient_address, None);
            if result.is_err() {
                println!("Transfer error: {} - retrying", result.unwrap_err());
            } else {
                println!("Transfer was a success!");
                break;
            }

            // Wait 2 seconds before trying again
            thread::sleep(std::time::Duration::from_secs(3));
        }

        // Wait for the chain to update blocks
        thread::sleep(std::time::Duration::from_secs(25));

        // Check the balance of the recipient
        let api_client = program_manager.api_client().unwrap();
        let height = api_client.latest_height().unwrap();
        let records = api_client.get_unspent_records(&recipient_private_key, 0..height, None, None, None).unwrap();
        assert_eq!(records.len(), 1);
        let (_, record) = &records[0];
        let record_plaintext = record.decrypt(&recipient_view_key).unwrap();
        assert_eq!(***record_plaintext.gates(), 100);
    }
}
