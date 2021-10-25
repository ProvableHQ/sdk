// Copyright (C) 2019-2021 Aleo Systems Inc.
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

use aleo_account::ViewKey;
use aleo_record::RecordCiphertext;

use colored::Colorize;
use std::str::FromStr;
use structopt::StructOpt;

#[derive(StructOpt, Debug)]
#[structopt(setting = structopt::clap::AppSettings::ColoredHelp)]
pub enum Record {
    /// Creates a new Aleo record by attempting to decrypt a record with a given view key.
    From {
        #[structopt(short = "c", long)]
        ciphertext: String,
        #[structopt(short = "v", long)]
        view_key: String,
    },
}

impl Record {
    pub fn parse(self) -> anyhow::Result<String> {
        match self {
            Self::From { ciphertext, view_key } => {
                // Parse the record ciphertext.
                let ciphertext =
                    RecordCiphertext::from_str(&ciphertext).expect("failed to parse record ciphertext string");

                // Parse the account view key.
                let view_key = ViewKey::from_str(&view_key).expect("failed to parse account view key string");

                // Decrypt the record ciphertext using the view key.
                let record = ciphertext
                    .decrypt(&view_key)
                    .expect("failed to decrypt the record with the given view key");

                // Print the Aleo record.
                let mut output = format!("\n {:>24}  {}\n", "Owner".cyan().bold(), record.owner());
                output += &format!(" {:>24}  {}\n", "Value".cyan().bold(), record.value());
                output += &format!(" {:>24}  {}\n", "Payload".cyan().bold(), record.payload());
                output += &format!(" {:>24}  {}\n", "Program ID".cyan().bold(), record.program_id());
                output += &format!(
                    " {:>24}  {}\n",
                    "Serial Number Nonce".cyan().bold(),
                    record.serial_number_nonce().to_string()
                );
                output += &format!(
                    " {:>24}  {}\n",
                    "Commitment Randomness".cyan().bold(),
                    record.commitment_randomness()
                );
                output += &format!(" {:>24}  {}\n", "Commitment".cyan().bold(), record.commitment());

                Ok(output)
            }
        }
    }
}

// todo (@collinc97): impl tests.rs in rust/record module. call test structs to test CLI here
