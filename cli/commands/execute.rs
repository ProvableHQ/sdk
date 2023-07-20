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

use crate::{Aleo, CurrentNetwork};
use aleo_rust::{AleoAPIClient, Encryptor, ProgramManager, RecordFinder};
use snarkvm::prelude::{Ciphertext, Identifier, Plaintext, PrivateKey, ProgramID, Record, Value};

use anyhow::{anyhow, ensure, Result};
use clap::Parser;
use colored::Colorize;

/// Executes an Aleo program function
#[derive(Debug, Parser)]
pub struct Execute {
    /// The program identifier
    program_id: ProgramID<CurrentNetwork>,
    /// The function name
    function: Identifier<CurrentNetwork>,
    /// The function inputs
    inputs: Vec<Value<CurrentNetwork>>,
    /// Estimate the execution fee in credits. If set, this will estimate the fee for executing the
    /// program but will NOT execute the program
    #[clap(long)]
    estimate_fee: bool,
    /// Aleo Network peer to broadcast the transaction to
    #[clap(short, long)]
    endpoint: Option<String>,
    /// Execution fee in credits
    #[clap(long)]
    fee: Option<f64>,
    /// The record to spend the fee from
    #[clap(short, long)]
    record: Option<Record<CurrentNetwork, Plaintext<CurrentNetwork>>>,
    /// Private key used to generate the execution
    #[clap(short='k', long, conflicts_with_all = &["ciphertext", "password"])]
    private_key: Option<PrivateKey<CurrentNetwork>>,
    /// Private key ciphertext used to generate the execution (requires password to decrypt)
    #[clap(short, long, conflicts_with = "private_key", requires = "password")]
    ciphertext: Option<Ciphertext<CurrentNetwork>>,
    /// Password to decrypt the private key
    #[clap(short, long, conflicts_with = "private_key", requires = "ciphertext")]
    password: Option<String>,
}

impl Execute {
    pub fn parse(self) -> Result<String> {
        if self.estimate_fee {
            println!(
                "Disclaimer: Fee estimation is experimental and may not represent a correct estimate on any current or future network"
            );
        }

        // Check for config errors
        ensure!(
            !(self.private_key.is_none() && self.ciphertext.is_none()),
            "Private key or private key ciphertext required to execute a function"
        );

        // Get strings for the program and function for logging
        let program_string = self.program_id.to_string();
        let function_string = self.function.to_string();

        // Get fee in credits, and microcredits
        let fee_microcredits = if !self.estimate_fee {
            ensure!(self.fee.is_some(), "Fee must be specified when executing a program");
            let fee = self.fee.unwrap();
            ensure!(fee > 0.0, "Execution fee must be greater than 0");
            println!(
                "{}",
                format!(
                    "Attempting to execute function '{}:{}' with a fee of {} credits",
                    &program_string, &function_string, fee
                )
                .bright_blue()
            );
            (fee * 1000000.0) as u64
        } else {
            println!(
                "{}",
                format!("Attempting to estimate the fee for '{}:{}'", &program_string, &function_string).bright_blue()
            );
            0u64
        };

        // Setup the API client to use configured peer or default to https://vm.aleo.org/api/testnet3
        let api_client = self
            .endpoint
            .clone()
            .map_or_else(
                || {
                    println!("Using default peer: https://vm.aleo.org/api/testnet3");
                    Ok(AleoAPIClient::<CurrentNetwork>::testnet3())
                },
                |peer| AleoAPIClient::<CurrentNetwork>::new(&peer, "testnet3"),
            )
            .map_err(|e| anyhow!("{:?}", e))?;

        // Create the program manager and find the program
        println!("Attempting to find program: {}", program_string.bright_blue());
        let mut program_manager = ProgramManager::<CurrentNetwork>::new(
            self.private_key,
            self.ciphertext.clone(),
            Some(api_client.clone()),
            None,
        )?;
        let program = program_manager.find_program(&self.program_id)?;

        if self.estimate_fee {
            let (total, (storage, finalize)) =
                program_manager.estimate_execution_fee::<Aleo>(&program, self.function, self.inputs.iter())?;
            let (total, storage, finalize) =
                ((total as f64) / 1_000_000.0, (storage as f64) / 1_000_000.0, (finalize as f64) / 1_000_000.0);
            let function_id = &self.function;
            let program_id = program.id();
            println!(
                "\n{} {} {} {} {} {} {} {} {}",
                "Function".bright_green(),
                format!("{program_id}:{function_id:?}").bright_blue(),
                "has a storage fee of".bright_green(),
                format!("{storage}").bright_blue(),
                "credits and a finalize fee of".bright_green(),
                format!("{finalize}").bright_blue(),
                "credits for a total execution fee of".bright_green(),
                format!("{total}").bright_blue(),
                "credits".bright_green()
            );
            return Ok("".to_string());
        }

        // Find a fee record to pay the fee if necessary
        let fee_record = if self.record.is_none() {
            println!("Searching for a record to spend the execution fee from, this may take a while..");
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

        // Execute the program function
        println!("Executing '{}:{}'", program_string.bright_blue(), function_string.bright_blue());
        let result = program_manager.execute_program(
            self.program_id,
            self.function,
            self.inputs.iter(),
            fee_microcredits,
            fee_record,
            self.password.as_deref(),
        );

        // Inform the user of the result of the program execution
        if result.is_err() {
            println!(
                "Execution of function '{}:{}' failed with error:",
                program_string.red().bold(),
                function_string.red().bold()
            );
        } else {
            println!(
                "Execution of function {} from {} successful!",
                function_string.green().bold(),
                program_string.green().bold()
            );
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
    fn test_execution_config_errors() {
        // Generate key material
        let recipient_private_key = PrivateKey::<CurrentNetwork>::new(&mut TestRng::default()).unwrap();
        let ciphertext = Some(Encryptor::encrypt_private_key_with_secret(&recipient_private_key, "password").unwrap());

        // Assert execute fails without a private key or private key ciphertext
        let execute_missing_key_material =
            Execute::try_parse_from(["aleo", "hello.aleo", "hello", "1337u32", "42u32", "--fee", "0.7"]);

        assert!(execute_missing_key_material.unwrap().parse().is_err());

        // Assert execute fails if both a private key and ciphertext are provided
        let execute_conflicting_inputs = Execute::try_parse_from([
            "aleo",
            "hello.aleo",
            "hello",
            "1337u32",
            "42u32",
            "-k",
            &recipient_private_key.to_string(),
            "--fee",
            "0.7",
            "--ciphertext",
            &ciphertext.as_ref().unwrap().to_string(),
            "--password",
            "password",
        ]);

        assert_eq!(execute_conflicting_inputs.unwrap_err().kind(), clap::error::ErrorKind::ArgumentConflict);

        // Assert execute fails if a ciphertext is provided without a password
        let ciphertext = Some(Encryptor::encrypt_private_key_with_secret(&recipient_private_key, "password").unwrap());
        let execute_no_password = Execute::try_parse_from([
            "aleo",
            "hello.aleo",
            "hello",
            "1337u32",
            "42u32",
            "--fee",
            "0.7",
            "--ciphertext",
            &ciphertext.as_ref().unwrap().to_string(),
        ]);

        assert_eq!(execute_no_password.unwrap_err().kind(), clap::error::ErrorKind::MissingRequiredArgument);

        // Assert execute fails if only a password is provided
        let execute_password_only =
            Execute::try_parse_from(["aleo", "hello.aleo", "hello", "1337u32", "42u32", "--password", "password"]);

        assert_eq!(execute_password_only.unwrap_err().kind(), clap::error::ErrorKind::MissingRequiredArgument);

        // Assert execute fails if invalid peer is specified
        let execute_bad_peer = Execute::try_parse_from([
            "aleo",
            "hello.aleo",
            "hello",
            "1337u32",
            "42u32",
            "-k",
            &recipient_private_key.to_string(),
            "--fee",
            "0.7",
            "-e",
            "localhost:3030",
        ]);

        assert!(execute_bad_peer.unwrap().parse().is_err());
    }
}
