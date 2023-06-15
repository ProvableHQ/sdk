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

use crate::CurrentNetwork;
use aleo_rust::{AleoAPIClient, Encryptor, ProgramManager, RecordFinder};
use snarkvm::prelude::{Ciphertext, Plaintext, PrivateKey, ProgramID, Record};

use anyhow::{anyhow, ensure, Result};
use clap::Parser;
use colored::Colorize;

/// Deploys an Aleo program
#[derive(Debug, Parser)]
pub struct Deploy {
    /// The program identifier
    program_id: ProgramID<CurrentNetwork>,
    /// Directory containing the program files
    #[clap(short, long)]
    directory: Option<std::path::PathBuf>,
    /// Aleo Network peer to broadcast the deployment to
    #[clap(short, long)]
    endpoint: Option<String>,
    /// Deployment fee in credits
    #[clap(short, long)]
    fee: f64,
    /// The record to spend the fee from
    #[clap(short, long)]
    record: Option<Record<CurrentNetwork, Plaintext<CurrentNetwork>>>,
    /// Private key used to generate the deployment
    #[clap(short='k', long, conflicts_with_all = &["ciphertext", "password"])]
    private_key: Option<PrivateKey<CurrentNetwork>>,
    /// Private key ciphertext used to generate the deployment (requires password to decrypt)
    #[clap(short, long, conflicts_with = "private_key", requires = "password")]
    ciphertext: Option<Ciphertext<CurrentNetwork>>,
    /// Password to decrypt the private key
    #[clap(short, long, conflicts_with = "private_key", requires = "ciphertext")]
    password: Option<String>,
}

impl Deploy {
    pub fn parse(self) -> Result<String> {
        // Check for config errors
        ensure!(
            !(self.private_key.is_none() && self.ciphertext.is_none()),
            "Private key or private key ciphertext required to deploy a program"
        );

        ensure!(self.fee > 0.0, "Deployment fee must be greater than 0");

        // Convert deployment fee to microcredits
        let fee_microcredits = (self.fee * 1000000.0) as u64;

        // Get strings for the program for logging
        let program_string = self.program_id.to_string();

        println!(
            "{}",
            format!("Attempting to deploy program '{}' with a fee of {} credits", &program_string, self.fee)
                .bright_blue()
        );

        // Setup the API client to use configured peer or default to https://vm.aleo.org/api/testnet3
        let api_client = self
            .endpoint
            .map_or_else(
                || {
                    println!("Using default peer: https://vm.aleo.org/api/testnet3");
                    Ok(AleoAPIClient::<CurrentNetwork>::testnet3())
                },
                |peer| AleoAPIClient::<CurrentNetwork>::new(&peer, "testnet3"),
            )
            .map_err(|e| anyhow!("{:?}", e))?;

        // Verify program is not already deployed
        println!("Verifying {} is not already deployed on the aleo network..", program_string.bright_blue());
        ensure!(api_client.get_program(self.program_id).is_err(), "Program is already deployed");
        println!("{} was not found on the Aleo Network, continuing deployment..", program_string.bright_blue());

        // Assume the local directory is the program directory if none is specified
        let program_directory = self
            .directory
            .map_or_else(std::env::current_dir, Ok)
            .map_err(|_| anyhow!("No program directory specified and attempting to use local path failed"))?;
        println!("Using program directory: {program_directory:?}");

        // Create a program manager to deploy the program
        let mut program_manager = ProgramManager::<CurrentNetwork>::new(
            self.private_key,
            self.ciphertext.clone(),
            Some(api_client.clone()),
            Some(program_directory),
        )?;

        // Find a fee record to pay the fee if necessary
        let fee_record = if self.record.is_none() {
            println!("Searching for a record to spend the deployment fee from, this may take a while..");
            let private_key = if let Some(private_key) = self.private_key {
                private_key
            } else {
                let ciphertext = self.ciphertext.as_ref().unwrap();
                Encryptor::decrypt_private_key_with_secret(ciphertext, self.password.as_ref().unwrap())?
            };
            let record_finder = RecordFinder::new(api_client);
            record_finder.find_one_record(&private_key, fee_microcredits)?
        } else {
            self.record.unwrap()
        };

        // Deploy the program
        println!("Attempting to deploy program: {}", program_string.bright_blue());
        let result =
            program_manager.deploy_program(self.program_id, fee_microcredits, fee_record, self.password.as_deref());

        // Inform the user of the result of the program deployment
        if result.is_err() {
            println!("Deployment of program {} failed with error:", program_string.red().bold());
        } else {
            println!("Deployment of program {} successful!", program_string.green().bold());
            println!("Transaction ID:");
        }
        result
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use snarkvm::prelude::TestRng;

    #[test]
    fn test_deployment_config_errors() {
        // Generate key material
        let recipient_private_key = PrivateKey::<CurrentNetwork>::new(&mut TestRng::default()).unwrap();
        let ciphertext = Some(Encryptor::encrypt_private_key_with_secret(&recipient_private_key, "password").unwrap());

        // Assert deploy fails without a private key or private key ciphertext
        let deploy_missing_key_material = Deploy::try_parse_from(["aleo", "hello.aleo", "-f", "0.5"]);

        assert!(deploy_missing_key_material.unwrap().parse().is_err());

        // Assert deploy fails if both a private key and ciphertext are provided
        let deploy_conflicting_inputs = Deploy::try_parse_from([
            "aleo",
            "hello.aleo",
            "-f",
            "0.5",
            "-k",
            &recipient_private_key.to_string(),
            "--ciphertext",
            &ciphertext.as_ref().unwrap().to_string(),
            "--password",
            "password",
        ]);

        assert_eq!(deploy_conflicting_inputs.unwrap_err().kind(), clap::error::ErrorKind::ArgumentConflict);

        // Assert deploy fails if a ciphertext is provided without a password
        let ciphertext = Some(Encryptor::encrypt_private_key_with_secret(&recipient_private_key, "password").unwrap());
        let deploy_no_password = Deploy::try_parse_from([
            "aleo",
            "hello.aleo",
            "-f",
            "0.5",
            "--ciphertext",
            &ciphertext.as_ref().unwrap().to_string(),
        ]);

        assert_eq!(deploy_no_password.unwrap_err().kind(), clap::error::ErrorKind::MissingRequiredArgument);

        // Assert deploy fails if only a password is provided
        let deploy_password_only =
            Deploy::try_parse_from(["aleo", "hello.aleo", "-f", "0.5", "--password", "password"]);

        assert_eq!(deploy_password_only.unwrap_err().kind(), clap::error::ErrorKind::MissingRequiredArgument);

        // Assert deploy fails if invalid peer is specified
        let deploy_bad_peer = Deploy::try_parse_from([
            "aleo",
            "hello.aleo",
            "-f",
            "0.5",
            "-k",
            &recipient_private_key.to_string(),
            "-e",
            "localhost:3030",
        ]);

        assert!(deploy_bad_peer.unwrap().parse().is_err());
    }
}
