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

use crate::CurrentNetwork;
use aleo_rust::{AleoAPIClient, Encryptor, ProgramManager, RecordFinder};
use snarkvm::prelude::{Address, Ciphertext, Plaintext, PrivateKey, Record, Testnet3};

use anyhow::{anyhow, bail, Result};
use clap::Parser;
use colored::*;

/// Executes an Aleo program function.
#[derive(Debug, Parser)]
pub struct Transfer {
    /// The recipient address
    #[clap(parse(try_from_str), short, long)]
    recipient: Address<CurrentNetwork>,
    /// The input record used to fund the transfer
    #[clap(short, long)]
    input_record: Option<Record<CurrentNetwork, Plaintext<CurrentNetwork>>>,
    /// The record to spend the fee from
    #[clap(long, conflicts_with = "auto_find_records")]
    fee_record: Option<Record<CurrentNetwork, Plaintext<CurrentNetwork>>>,
    /// The number of credits to transfer
    #[clap(short, long)]
    amount: f64,
    /// Peer to broadcast the transaction to
    #[clap(short, long)]
    endpoint: Option<String>,
    /// The deployment fee in credits, defaults to 0
    #[clap(short, long)]
    fee: Option<f64>,
    /// The private key used to generate the execution.
    #[clap(short='k', long, conflicts_with_all = &["ciphertext", "password"])]
    private_key: Option<PrivateKey<CurrentNetwork>>,
    /// Provide ciphertext directly to command line
    #[clap(short = 'c', long, conflicts_with = "private_key")]
    ciphertext: Option<Ciphertext<CurrentNetwork>>,
    /// Password to decrypt the private key
    #[clap(short = 'p', long, conflicts_with = "private_key")]
    password: Option<String>,
}

impl Transfer {
    pub fn parse(self) -> Result<String> {
        if self.private_key.is_none() && self.ciphertext.is_none() {
            bail!("Must provide either a private key or ciphertext to send a transfer");
        }

        // Setup the API client to use configured peer or default to https://vm.aleo.org/api/testnet3
        let api_client = self
            .endpoint
            .map_or_else(
                || {
                    println!("Using default peer: {}", "https://vm.aleo.org/api/testnet3".bright_blue().bold());
                    Ok(AleoAPIClient::<CurrentNetwork>::testnet3())
                },
                |peer| AleoAPIClient::<CurrentNetwork>::new(&peer, "testnet3"),
            )
            .map_err(|e| anyhow!("{:?}", e))?;

        // Create the program manager
        let amount = (self.amount * 1000000.0) as u64;
        let fee = (self.fee.unwrap_or(0f64) * 1000000.0) as u64;
        let program_manager =
            ProgramManager::<Testnet3>::new(self.private_key, self.ciphertext.clone(), Some(api_client.clone()), None)?;

        // Execute the transfer
        if self.input_record.is_none() {
            // Get private key needed to find records
            let private_key = if let Some(private_key) = self.private_key {
                private_key
            } else {
                let ciphertext = self.ciphertext.as_ref().unwrap();
                Encryptor::decrypt_private_key_with_secret(ciphertext, self.password.as_ref().unwrap())?
            };

            // Find records from the chain
            println!("Finding records to make the requested transfer... (this may take a few minutes)");
            let record_finder = RecordFinder::new(api_client);
            let (input_record, fee_record) = if self.fee.is_some() && self.fee_record.is_none() {
                let (input_record, fee_record) =
                    record_finder.find_amount_and_fee_records(amount, fee, &private_key)?;
                (input_record, Some(fee_record))
            } else {
                (record_finder.find_one_record(&private_key, amount)?, self.fee_record)
            };

            println!(
                "Attempting to transfer {} gates to {} with a fee of {} gates...",
                self.amount, self.recipient, fee
            );
            program_manager.transfer(amount, fee, self.recipient, self.password.as_deref(), input_record, fee_record)
        } else {
            // Use supplied records to make the transfer
            program_manager.transfer(
                amount,
                fee,
                self.recipient,
                self.password.as_deref(),
                self.input_record.unwrap(),
                self.fee_record,
            )
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    use snarkvm::prelude::TestRng;

    #[test]
    fn test_transfer_config_errors() {
        let sender_private_key = PrivateKey::<CurrentNetwork>::new(&mut TestRng::default()).unwrap();
        let recipient_private_key = PrivateKey::<CurrentNetwork>::new(&mut TestRng::default()).unwrap();
        let recipient_address = Address::<CurrentNetwork>::try_from(&recipient_private_key).unwrap();

        // Assert that the transfer fails with a private key
        let transfer_no_inputs = Transfer {
            recipient: recipient_address,
            input_record: None,
            fee_record: None,
            amount: 10.0,
            endpoint: None,
            fee: None,
            private_key: None,
            ciphertext: None,
            password: None,
        };
        assert!(transfer_no_inputs.parse().is_err());

        // Assert that the transfer fails if both a ciphertext and private key are supplied
        let ciphertext = Some(Encryptor::encrypt_private_key_with_secret(&recipient_private_key, "password").unwrap());
        let transfer_no_inputs = Transfer {
            recipient: recipient_address,
            input_record: None,
            fee_record: None,
            amount: 10.0,
            endpoint: None,
            fee: None,
            private_key: Some(recipient_private_key),
            ciphertext,
            password: Some("password".to_string()),
        };
        assert!(transfer_no_inputs.parse().is_err());

        // Assert transfer fails if invalid peer is specified
        let transfer_bad_peer = Transfer {
            recipient: recipient_address,
            input_record: None,
            fee_record: None,
            amount: 10.0,
            endpoint: Some("localhost:3030".to_string()),
            fee: None,
            private_key: Some(sender_private_key),
            ciphertext: None,
            password: None,
        };
        assert!(transfer_bad_peer.parse().is_err());
    }
}
