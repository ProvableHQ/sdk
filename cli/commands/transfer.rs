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
use snarkvm::prelude::{Address, Ciphertext, Plaintext, PrivateKey, Record};

use anyhow::{anyhow, ensure, Result};
use clap::Parser;
use colored::*;

/// Executes a transfer of Aleo credits
#[derive(Debug, Parser)]
pub struct Transfer {
    /// Recipient address
    #[clap(short, long)]
    recipient: Address<CurrentNetwork>,
    /// Record used to fund the transfer
    #[clap(short, long)]
    input_record: Option<Record<CurrentNetwork, Plaintext<CurrentNetwork>>>,
    /// Record to spend the fee from
    #[clap(long)]
    fee_record: Option<Record<CurrentNetwork, Plaintext<CurrentNetwork>>>,
    /// Number of credits to transfer
    #[clap(short, long)]
    amount: f64,
    /// Aleo Network peer to broadcast the transaction to
    #[clap(short, long)]
    endpoint: Option<String>,
    /// Transaction fee in credits, defaults to 0
    #[clap(short, long)]
    fee: Option<f64>,
    /// Private key used to generate the transfer
    #[clap(short='k', long, conflicts_with_all = &["ciphertext", "password"])]
    private_key: Option<PrivateKey<CurrentNetwork>>,
    /// Private key ciphertext used to generate the transfer (requires password to decrypt)
    #[clap(short, long, conflicts_with = "private-key", requires = "password")]
    ciphertext: Option<Ciphertext<CurrentNetwork>>,
    /// Password to decrypt the private key
    #[clap(short = 'p', long, conflicts_with = "private-key", requires = "ciphertext")]
    password: Option<String>,
}

impl Transfer {
    pub fn parse(self) -> Result<String> {
        // Check for config errors
        ensure!(self.amount > 0f64, "Transfer amount must be greater than 0 credits");
        ensure!(
            !(self.private_key.is_none() && self.ciphertext.is_none()),
            "Private key or private key ciphertext required"
        );

        // Convert transfer amount and fee to gates
        let amount_gates = (self.amount * 1000000.0) as u64;
        let fee_credits = self.fee.unwrap_or(0f64);
        let fee_gates = (fee_credits * 1000000.0) as u64;

        println!(
            "{}",
            format!(
                "Attempting to transfer {} credits to {} with a fee of {} credits...",
                self.amount, self.recipient, fee_credits
            )
            .bright_blue()
        );

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
        let program_manager = ProgramManager::<CurrentNetwork>::new(
            self.private_key,
            self.ciphertext.clone(),
            Some(api_client.clone()),
            None,
        )?;

        // Find the input records from the Aleo Network if not provided
        let private_key = if let Some(private_key) = self.private_key {
            private_key
        } else {
            let ciphertext = self.ciphertext.as_ref().unwrap();
            Encryptor::decrypt_private_key_with_secret(ciphertext, self.password.as_ref().unwrap())?
        };
        let record_finder = RecordFinder::new(api_client);

        let (input_record, fee_record) = if self.input_record.is_none() {
            println!("Finding records to make the requested transfer... (this may take a few minutes)");
            if self.fee.is_some() && self.fee_record.is_none() {
                // An amount and fee were provided without records, so find records for both
                let (input_record, fee_record) =
                    record_finder.find_amount_and_fee_records(amount_gates, fee_gates, &private_key)?;
                (input_record, Some(fee_record))
            } else {
                // Either the fee is none or the fee record is already provided, so just find the input record
                (record_finder.find_one_record(&private_key, amount_gates)?, self.fee_record)
            }
        } else if self.fee.is_some() && self.fee_record.is_none() {
            println!("Finding records to make the requested transfer... (this may take a few minutes)");
            // If the input record is provided, but the fee record was not, find a record for the fee
            (self.input_record.unwrap(), Some(record_finder.find_one_record(&private_key, fee_gates)?))
        } else {
            (self.input_record.unwrap(), self.fee_record)
        };

        // Execute the transfer
        let transfer = program_manager.transfer(
            amount_gates,
            fee_gates,
            self.recipient,
            self.password.as_deref(),
            input_record,
            fee_record,
        );

        // Inform the user of the result of the transfer
        if transfer.is_err() {
            println!("{}", "Transfer failed with error:".to_string().red().bold());
        } else {
            println!("{}", "Transfer successful!".to_string().bright_green().bold());
            println!("Transaction ID:");
        }
        transfer
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use snarkvm::prelude::TestRng;

    #[test]
    fn test_transfer_config_errors() {
        let recipient_private_key = PrivateKey::<CurrentNetwork>::new(&mut TestRng::default()).unwrap();
        let recipient_address = Address::<CurrentNetwork>::try_from(&recipient_private_key).unwrap();
        let ciphertext = Some(Encryptor::encrypt_private_key_with_secret(&recipient_private_key, "password").unwrap());

        // Assert that the transfer fails without a private key or private key ciphertext
        let transfer_missing_key_material =
            Transfer::try_parse_from(["aleo", "-r", &recipient_address.to_string(), "-a", "1.0"]);

        assert!(transfer_missing_key_material.unwrap().parse().is_err());

        // Assert transfer fails if both a private key and ciphertext are provided
        let transfer_conflicting_inputs = Transfer::try_parse_from([
            "aleo",
            "-r",
            &recipient_address.to_string(),
            "-a",
            "2.0",
            "-k",
            &recipient_private_key.to_string(),
            "--ciphertext",
            &ciphertext.as_ref().unwrap().to_string(),
            "--password",
            "password",
        ]);

        assert_eq!(transfer_conflicting_inputs.unwrap_err().kind(), clap::ErrorKind::ArgumentConflict);

        // Assert that the transfer fails if a ciphertext is provided without a password
        let ciphertext = Some(Encryptor::encrypt_private_key_with_secret(&recipient_private_key, "password").unwrap());
        let transfer_no_password = Transfer::try_parse_from([
            "aleo",
            "-r",
            &recipient_address.to_string(),
            "-a",
            "3.0",
            "--ciphertext",
            &ciphertext.as_ref().unwrap().to_string(),
        ]);

        assert_eq!(transfer_no_password.unwrap_err().kind(), clap::ErrorKind::MissingRequiredArgument);

        // Assert transfer fails if only a password is provided
        let transfer_password_only = Transfer::try_parse_from([
            "aleo",
            "-r",
            &recipient_address.to_string(),
            "-a",
            "4.0",
            "--password",
            "password",
        ]);

        assert_eq!(transfer_password_only.unwrap_err().kind(), clap::ErrorKind::MissingRequiredArgument);

        // Assert transfer fails if invalid peer is specified
        let transfer_bad_peer = Transfer::try_parse_from([
            "aleo",
            "-r",
            &recipient_address.to_string(),
            "-k",
            &recipient_private_key.to_string(),
            "-a",
            "5.0",
            "-e",
            "localhost:3030",
        ]);

        assert!(transfer_bad_peer.unwrap().parse().is_err());

        // Assert transfer fails if a zero amount is specified
        let transfer_zero_amount = Transfer::try_parse_from([
            "aleo",
            "-r",
            &recipient_address.to_string(),
            "-k",
            &recipient_private_key.to_string(),
            "-a",
            "0.0",
            "-e",
            "http://localhost:3030",
        ]);
        assert!(transfer_zero_amount.unwrap().parse().is_err());
    }
}
