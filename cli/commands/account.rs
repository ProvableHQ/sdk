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

use crate::{helpers::AccountModel, Network};
use aleo_rust::account::Encryptor;
use snarkvm::prelude::{Address, Ciphertext, PrivateKey, ViewKey};

use anyhow::{bail, Result};
use clap::Parser;
use colored::*;
use rand::SeedableRng;
use rand_chacha::ChaChaRng;
use std::{convert::TryFrom, fs::File};

/// Commands to manage Aleo account creation, import, and encryption/decryption
#[derive(Debug, Parser)]
pub enum Account {
    /// Generates a new aleo account
    New {
        /// Seed the RNG with a numeric value
        #[clap(short = 's', long)]
        seed: Option<u64>,
        /// Flag to encrypt the private key (will prompt for an encryption password)
        #[clap(short = 'e', long)]
        encrypt: bool,
        /// Write key data to disk
        #[clap(short = 'w', long)]
        write: bool,
    },
    /// Derive view key and address from a private key plaintext
    Import {
        /// Private key plaintext
        private_key: PrivateKey<Network>,
        /// Write key data to disk
        #[clap(short = 'w', long)]
        write: bool,
    },
    /// Encrypt a private key plaintext
    Encrypt {
        /// Provide private key plaintext to command line
        #[clap(short = 'k', long)]
        private_key: Option<PrivateKey<Network>>,
        /// Get private key plaintext from file
        #[clap(short = 'f', long)]
        file: Option<String>,
        /// Write private key ciphertext and address to disk
        #[clap(short = 'w', long)]
        write: bool,
    },
    /// Decrypt a private key ciphertext
    Decrypt {
        /// Provide ciphertext directly to command line
        #[clap(short = 'k', long)]
        ciphertext: Option<Ciphertext<Network>>,
        /// Get ciphertext from file
        #[clap(short = 'f', long)]
        file: Option<String>,
        /// Write account plaintext data to disk
        #[clap(short = 'w', long)]
        write: bool,
    },
}

impl Account {
    pub fn parse(self) -> Result<String> {
        match self {
            Self::New { seed, encrypt, write } => {
                // Sample a new Aleo account.
                let private_key = match seed {
                    Some(seed) => PrivateKey::<Network>::new(&mut ChaChaRng::seed_from_u64(seed))?,
                    None => PrivateKey::new(&mut rand::thread_rng())?,
                };

                // Create success message
                let mut key_output = format!("\n{:>12}", "✅ Account keys successfully generated:\n".green().bold(),);

                // If encryption flag is specified encrypt private key and add it to the output
                let private_key_ciphertext = if encrypt {
                    let ciphertext = Self::encrypt_with_password(&private_key)?;
                    key_output += format!("\n {:>1}  {ciphertext}", "Private Key Ciphertext".cyan().bold()).as_str();
                    Some(ciphertext)
                } else {
                    None
                };

                let view_key = ViewKey::try_from(&private_key)?;
                let address = Address::try_from(&view_key)?;

                // Add remaining keys to the output
                key_output += format!(
                    "\n {:>1}  {private_key}\n {:>1}  {view_key}\n {:>1}  {address}",
                    "Private Key".cyan().bold(),
                    "View Key".cyan().bold(),
                    "Address".cyan().bold(),
                )
                .as_str();

                // Save output to file if specified
                let save_output = Self::write_account_to_file(
                    write,
                    private_key_ciphertext,
                    private_key.into(),
                    view_key.into(),
                    address.into(),
                )?;

                Ok(format!("{key_output}{save_output}"))
            }
            Self::Import { private_key, write } => {
                let view_key = ViewKey::try_from(&private_key)?;
                let address = Address::try_from(&view_key)?;

                // Print the Aleo account corresponding to the provided private key
                let key_output = format!(
                    "\n{:>12}\n\n {:>1}  {private_key}\n {:>1}  {view_key}\n {:>1}  {address}",
                    "✅ Account keys successfully imported:".green().bold(),
                    "Private Key".cyan().bold(),
                    "View Key".cyan().bold(),
                    "Address".cyan().bold(),
                );

                // Save output to file if specified
                let save_output =
                    Self::write_account_to_file(write, None, private_key.into(), view_key.into(), address.into())?;

                Ok(format!("{key_output}{save_output}"))
            }
            Self::Encrypt { private_key, file, write } => {
                // Check for ambiguous input
                if private_key.is_some() && file.is_some() {
                    bail!("❌ Please provide either a private key or a filepath, not both");
                }

                // Get private key from file or command line
                let private_key = match file {
                    Some(file) => {
                        let mut file = File::open(file)?;
                        let account_keys: AccountModel = serde_json::from_reader(&mut file)?;
                        account_keys.private_key.ok_or_else(|| anyhow::anyhow!("❌ No private key found in file"))?
                    }
                    None => match private_key {
                        Some(private_key) => private_key,
                        None => bail!("❌ Please provide either a private key or a filepath"),
                    },
                };

                // Prompt for password and encrypt private key
                let private_key_ciphertext = Self::encrypt_with_password(&private_key)?;
                let address = Address::try_from(&private_key)?;

                // Display private key ciphertext and public address
                let key_output = format!(
                    "\n{:>12}\n\n {:>1}  {private_key_ciphertext}\n {:>1}  {address}",
                    "✅ Account private key successfully encrypted:".green().bold(),
                    "Private Key Ciphertext".cyan().bold(),
                    "Address".cyan().bold(),
                );

                // Save output to file if specified
                let save_output =
                    Self::write_account_to_file(write, private_key_ciphertext.into(), None, None, address.into())?;

                Ok(format!("{key_output}{save_output}"))
            }
            Self::Decrypt { ciphertext, file, write } => {
                // Check for ambiguous input
                if ciphertext.is_some() && file.is_some() {
                    bail!("❌ Please provide either a private key or a filepath, not both");
                }

                // Get the ciphertext from file or command line
                let private_key_ciphertext = match file {
                    Some(file) => {
                        let mut file = File::open(file)?;
                        let account_keys: AccountModel = serde_json::from_reader(&mut file)?;
                        account_keys
                            .private_key_ciphertext
                            .ok_or_else(|| anyhow::anyhow!("❌ No private key ciphertext found in file"))?
                    }
                    None => match ciphertext {
                        Some(ciphertext) => ciphertext,
                        None => bail!("❌ Please provide either a ciphertext or a filepath"),
                    },
                };

                // Prompt for password and attempt to decrypt private key
                let password = rpassword::prompt_password("Enter decryption password: ")?;
                let private_key = Encryptor::decrypt_private_key_with_secret(&private_key_ciphertext, &password)
                    .map_err(|_| anyhow::anyhow!("❌ Incorrect password"))?;

                let view_key = ViewKey::try_from(&private_key)?;
                let address = Address::try_from(&view_key)?;

                // Print the new Aleo account.
                let key_output = format!(
                    "\n{:>1}\n\n {:>1}  {private_key}\n {:>1}  {view_key}\n {:>1}  {address}",
                    "✅ Account keys successfully decrypted:".green().bold(),
                    "Private Key".cyan().bold(),
                    "View Key".cyan().bold(),
                    "Address".cyan().bold(),
                );

                // Save output to file if specified
                let save_output =
                    Self::write_account_to_file(write, None, private_key.into(), view_key.into(), address.into())?;

                Ok(format!("{key_output}{save_output}"))
            }
        }
    }

    // Encrypt the private key with a password specified at the command line
    fn encrypt_with_password(private_key: &PrivateKey<Network>) -> Result<Ciphertext<Network>> {
        let password = rpassword::prompt_password("Enter password: ")?;
        let password_confirm = rpassword::prompt_password("Confirm password: ")?;
        if password != password_confirm {
            bail!("❌ Passwords do not match");
        }
        Encryptor::encrypt_private_key_with_secret(private_key, &password)
    }

    // Write the account keys to a file or return if write flag is not specified
    fn write_account_to_file(
        write: bool,
        private_key_ciphertext: Option<Ciphertext<Network>>,
        private_key: Option<PrivateKey<Network>>,
        view_key: Option<ViewKey<Network>>,
        address: Option<Address<Network>>,
    ) -> Result<String> {
        if !write {
            return Ok("".to_string());
        }

        // Get file name and account serialization
        let (preamble, filename, account_keys) = if private_key_ciphertext.is_some() {
            ("✅ Account key ciphertext written to", "account-ciphertext.json", AccountModel {
                private_key_ciphertext,
                private_key: None,
                view_key: None,
                address,
            })
        } else {
            ("✅ Account key plaintexts written to", "account-plaintext.json", AccountModel {
                private_key_ciphertext,
                private_key,
                view_key,
                address,
            })
        };

        // Check if file already exists if so error, else write to file
        let path = std::env::current_dir()?.join(filename);
        if path.exists() {
            Ok(format!(
                "\n\n{} {} {} {}",
                "❌".red().bold(),
                "Keys not written to disk, an".red().bold(),
                filename.red().bold(),
                "file already exists in this directory".red().bold()
            ))
        } else {
            let mut file = File::create(path)?;

            serde_json::to_writer_pretty(&mut file, &account_keys)?;
            Ok(format!("\n\n{} {}", preamble.green().bold(), filename.green().bold()))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    use snarkvm::prelude::TestRng;

    #[test]
    fn test_account_new() {
        for _ in 0..3 {
            let account = Account::New { seed: None, encrypt: false, write: false };
            assert!(account.parse().is_ok());
        }
    }

    #[test]
    fn test_account_new_plaintext_write() {
        let temp_dir = std::env::temp_dir();
        std::env::set_current_dir(&temp_dir).unwrap();
        let account = Account::New { seed: None, encrypt: false, write: true };
        assert!(account.parse().is_ok());
        let account: AccountModel =
            serde_json::from_reader(&mut File::open(temp_dir.join("account-plaintext.json")).unwrap()).unwrap();
        assert!(account.private_key.is_some());
        assert!(account.view_key.is_some());
        assert!(account.address.is_some());
        assert!(account.private_key_ciphertext.is_none());
    }

    #[test]
    fn test_account_import_write() {
        let temp_dir = std::env::temp_dir();
        std::env::set_current_dir(&temp_dir).unwrap();
        let account = Account::New { seed: None, encrypt: false, write: true };
        assert!(account.parse().is_ok());
        let account: AccountModel =
            serde_json::from_reader(&mut File::open(temp_dir.join("account-plaintext.json")).unwrap()).unwrap();
        assert!(account.private_key.is_some());
        assert!(account.view_key.is_some());
        assert!(account.address.is_some());
        assert!(account.private_key_ciphertext.is_none());
    }

    #[test]
    fn test_account_encrypt_fails_with_invalid_inputs() {
        let account_no_inputs = Account::Encrypt { private_key: None, file: None, write: false };
        assert!(account_no_inputs.parse().is_err());

        let private_key = Some(PrivateKey::<Network>::new(&mut TestRng::default()).unwrap());
        let account_ambiguous_inputs =
            Account::Encrypt { private_key, file: Some("test.json".to_string()), write: false };
        assert!(account_ambiguous_inputs.parse().is_err());
    }

    #[test]
    fn test_account_decrypt_fails_with_invalid_inputs() {
        let account_no_inputs = Account::Decrypt { ciphertext: None, file: None, write: false };
        assert!(account_no_inputs.parse().is_err());

        let account = Account::Encrypt { private_key: None, file: None, write: false };
        assert!(account.parse().is_err());

        let private_key = PrivateKey::<Network>::new(&mut ChaChaRng::seed_from_u64(5)).unwrap();
        let ciphertext = Some(Encryptor::encrypt_private_key_with_secret(&private_key, "password").unwrap());
        let account_ambiguous_inputs =
            Account::Decrypt { ciphertext, file: Some("test.json".to_string()), write: false };
        assert!(account_ambiguous_inputs.parse().is_err());
    }
}
