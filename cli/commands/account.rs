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

use crate::{helpers::AccountModel, CurrentNetwork};
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
        /// password to encrypt the private key
        #[clap(short = 'p', long)]
        password: Option<String>,
    },
    /// Derive view key and address from a private key plaintext
    Import {
        /// Private key plaintext
        private_key: PrivateKey<CurrentNetwork>,
        /// Write key data to disk
        #[clap(short = 'w', long)]
        write: bool,
    },
    /// Encrypt a private key plaintext
    Encrypt {
        /// Provide private key plaintext to command line
        #[clap(short = 'k', long)]
        private_key: Option<PrivateKey<CurrentNetwork>>,
        /// Get private key plaintext from file
        #[clap(short = 'f', long)]
        file: Option<String>,
        /// Write private key ciphertext and address to disk
        #[clap(short = 'w', long)]
        write: bool,
        /// password to encrypt the private key
        #[clap(short = 'p', long)]
        password: Option<String>,
    },
    /// Decrypt a private key ciphertext
    Decrypt {
        /// Provide ciphertext directly to command line
        #[clap(short = 'k', long)]
        ciphertext: Option<Ciphertext<CurrentNetwork>>,
        /// Get ciphertext from file
        #[clap(short = 'f', long)]
        file: Option<String>,
        /// Write account plaintext data to disk
        #[clap(short = 'w', long)]
        write: bool,
        /// password to encrypt the private key
        #[clap(short = 'p', long)]
        password: Option<String>,
    },
}

impl Account {
    pub fn parse(self) -> Result<String> {
        match self {
            Self::New { seed, encrypt, write, password } => {
                // Sample a new Aleo account.
                let private_key = match seed {
                    Some(seed) => PrivateKey::<CurrentNetwork>::new(&mut ChaChaRng::seed_from_u64(seed))?,
                    None => PrivateKey::new(&mut rand::thread_rng())?,
                };

                // Create success message
                let mut key_output = format!("\n{:>12}", "✅ Account keys successfully generated:\n".green().bold(),);

                // If encryption flag is specified encrypt private key and add it to the output
                let private_key_ciphertext = if encrypt {
                    let ciphertext = Self::encrypt_with_password(&private_key, password)?;
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
            Self::Encrypt { private_key, file, write, password } => {
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

                // Use the provided password or prompt for a password and encrypt private key
                let private_key_ciphertext = Self::encrypt_with_password(&private_key, password)?;
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
            Self::Decrypt { ciphertext, file, write, password } => {
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

                // Use supplied password or prompt for the user for a password and attempt to decrypt private key
                let secret = if let Some(password) = password {
                    password
                } else {
                    rpassword::prompt_password("Enter decryption password: ")?
                };
                let private_key = Encryptor::decrypt_private_key_with_secret(&private_key_ciphertext, &secret)
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
    fn encrypt_with_password(
        private_key: &PrivateKey<CurrentNetwork>,
        password: Option<String>,
    ) -> Result<Ciphertext<CurrentNetwork>> {
        if let Some(password) = password {
            Ok(Encryptor::encrypt_private_key_with_secret(private_key, &password)?)
        } else {
            let password = rpassword::prompt_password("Enter encryption password: ")?;
            let password_confirm = rpassword::prompt_password("Confirm encryption password: ")?;

            if password != password_confirm {
                bail!("❌ Passwords do not match");
            }

            Ok(Encryptor::encrypt_private_key_with_secret(private_key, &password)?)
        }
    }

    // Write the account keys to a file or return if write flag is not specified
    fn write_account_to_file(
        write: bool,
        private_key_ciphertext: Option<Ciphertext<CurrentNetwork>>,
        private_key: Option<PrivateKey<CurrentNetwork>>,
        view_key: Option<ViewKey<CurrentNetwork>>,
        address: Option<Address<CurrentNetwork>>,
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
    use std::{fs, str::FromStr};

    use snarkvm::prelude::TestRng;

    #[test]
    fn test_account_new() {
        for _ in 0..3 {
            let account = Account::New { seed: None, encrypt: false, write: false, password: None };
            assert!(account.parse().is_ok());
        }
    }

    #[test]
    fn test_account_create_import_encrypt_and_decrypt_from_file() {
        // Create a new account in a file
        let temp_dir = std::env::temp_dir();
        let _ = fs::remove_file(temp_dir.join("account-plaintext.json"));
        let _ = fs::remove_file(temp_dir.join("account-ciphertext.json"));
        std::env::set_current_dir(&temp_dir).unwrap();
        let account = Account::New { seed: None, encrypt: false, write: true, password: None };

        // Ensure it was created correctly
        let new_account_parse_attempt = account.parse().unwrap();

        // Assert a write message is emitted
        assert!(new_account_parse_attempt.contains("written to"));

        let account: AccountModel =
            serde_json::from_reader(&mut File::open(temp_dir.join("account-plaintext.json")).unwrap()).unwrap();
        assert!(account.private_key.is_some());
        assert!(account.view_key.is_some());
        assert!(account.address.is_some());
        assert!(account.private_key_ciphertext.is_none());

        // Encrypt the account
        let encrypted_account = Account::Encrypt {
            private_key: None,
            file: Some("account-plaintext.json".to_string()),
            write: true,
            password: Some("mypassword".to_string()),
        };
        assert!(encrypted_account.parse().is_ok());
        let account_ciphertext: AccountModel =
            serde_json::from_reader(&mut File::open(temp_dir.join("account-ciphertext.json")).unwrap()).unwrap();

        // Ensure the ciphertext exists
        assert!(account_ciphertext.private_key.is_none());
        assert!(account_ciphertext.view_key.is_none());
        assert_eq!(account_ciphertext.address, account.address);
        assert!(account_ciphertext.private_key_ciphertext.is_some());

        // Ensure creating, encrypting and decrypting to file fails to write file if file already exists
        let encrypt_parse_attempt = Account::Encrypt {
            private_key: None,
            file: Some("account-plaintext.json".to_string()),
            write: true,
            password: Some("mypassword".to_string()),
        };
        let encrypt_parse_attempt_result = encrypt_parse_attempt.parse().unwrap();
        assert!(encrypt_parse_attempt_result.contains("✅ Account private key successfully encrypted"));
        assert!(encrypt_parse_attempt_result.contains("not written to disk"));

        let decrypt_parse_attempt = Account::Decrypt {
            ciphertext: None,
            file: Some("account-ciphertext.json".to_string()),
            write: true,
            password: Some("mypassword".to_string()),
        };
        let decrypt_parse_attempt_result = decrypt_parse_attempt.parse().unwrap();
        assert!(decrypt_parse_attempt_result.contains("✅ Account keys successfully decrypted:"));
        assert!(decrypt_parse_attempt_result.contains("not written to disk"));

        // Remove plaintext files and ensure account decrypt from file works
        fs::remove_file(temp_dir.join("account-plaintext.json")).unwrap();
        let decrypt_parse_attempt_2 = Account::Decrypt {
            ciphertext: None,
            file: Some("account-ciphertext.json".to_string()),
            write: true,
            password: Some("mypassword".to_string()),
        };
        let decrypt_parse_attempt_2 = decrypt_parse_attempt_2.parse().unwrap();

        // Assert a write message is emitted
        assert!(decrypt_parse_attempt_2.contains("written to"));

        // Assert the decrypted account is correct
        let recovered_account: AccountModel =
            serde_json::from_reader(&mut File::open(temp_dir.join("account-plaintext.json")).unwrap()).unwrap();
        assert_eq!(recovered_account.private_key, account.private_key);
        assert_eq!(recovered_account.view_key, account.view_key);
        assert_eq!(recovered_account.address, account.address);

        // Assert no new plaintext accounts can be written to file
        let new_account_plaintext = Account::New { seed: None, encrypt: false, write: true, password: None };
        let new_plaintext_account_parse_attempt_result = new_account_plaintext.parse().unwrap();

        // Ensure a not written to disk message is emitted
        assert!(new_plaintext_account_parse_attempt_result.contains("not written to disk"));

        // Ensure the account was not written to disk
        let plaintext_recovered_account_check: AccountModel =
            serde_json::from_reader(&mut File::open(temp_dir.join("account-plaintext.json")).unwrap()).unwrap();
        assert_eq!(plaintext_recovered_account_check.private_key, account.private_key);
        assert_eq!(plaintext_recovered_account_check.view_key, account.view_key);
        assert_eq!(plaintext_recovered_account_check.address, account.address);

        // Assert no new encrypted accounts can be written to file
        let new_account_ciphertext =
            Account::New { seed: None, encrypt: false, write: true, password: Some("mypassword".to_string()) };
        let new_account_ciphertext_parse_attempt_result = new_account_ciphertext.parse().unwrap();

        // Ensure a not written to disk message is emitted
        assert!(new_account_ciphertext_parse_attempt_result.contains("not written to disk"));

        // Ensure the account was not written to disk
        let ciphertext_recovered_account_check: AccountModel =
            serde_json::from_reader(&mut File::open(temp_dir.join("account-plaintext.json")).unwrap()).unwrap();
        assert_eq!(ciphertext_recovered_account_check.private_key, account.private_key);
        assert_eq!(ciphertext_recovered_account_check.view_key, account.view_key);
        assert_eq!(ciphertext_recovered_account_check.address, account.address);

        // Ensure new encrypted accounts can be written to file if the file does not exist
        fs::remove_file(temp_dir.join("account-ciphertext.json")).unwrap();
        let new_account_ciphertext =
            Account::New { seed: None, encrypt: true, write: true, password: Some("mypassword".to_string()) };
        let new_account_ciphertext_parse_attempt_result_2 = new_account_ciphertext.parse().unwrap();
        let ciphertext_recovered_account_check_2: AccountModel =
            serde_json::from_reader(&mut File::open(temp_dir.join("account-ciphertext.json")).unwrap()).unwrap();
        // Assert a write confirmation is printed
        assert!(new_account_ciphertext_parse_attempt_result_2.contains("written to"));

        // Assert we've created a different account and that data was written properly
        assert_ne!(ciphertext_recovered_account_check_2.private_key_ciphertext, account.private_key_ciphertext);
        assert_ne!(ciphertext_recovered_account_check_2.address, account.address);
        assert!(ciphertext_recovered_account_check_2.private_key.is_none());
        assert!(ciphertext_recovered_account_check_2.view_key.is_none());

        fs::remove_file(temp_dir.join("account-ciphertext.json")).unwrap();
        fs::remove_file(temp_dir.join("account-plaintext.json")).unwrap();

        // Ensure we can import an account and write it
        let import_private_key =
            PrivateKey::<CurrentNetwork>::from_str("APrivateKey1zkp76ubxnPqcYFSiWpRAQQ2yJ9vRtEZB9t2ok2cFa8wTLKq")
                .unwrap();
        let import_view_key = ViewKey::<CurrentNetwork>::try_from(import_private_key).unwrap();
        let import_address = Address::<CurrentNetwork>::try_from(import_private_key).unwrap();
        let import_parse_attempt = Account::Import { private_key: import_private_key, write: true };
        let import_parse_attempt_result = import_parse_attempt.parse().unwrap();

        assert!(import_parse_attempt_result.contains("written to"));
        let imported_account: AccountModel =
            serde_json::from_reader(&mut File::open(temp_dir.join("account-plaintext.json")).unwrap()).unwrap();

        assert_eq!(imported_account.private_key.unwrap(), import_private_key);
        assert_eq!(imported_account.view_key.unwrap(), import_view_key);
        assert_eq!(imported_account.address.unwrap(), import_address);

        fs::remove_file(temp_dir.join("account-plaintext.json")).unwrap();

        // Ensure we can write an account ciphertext from console input
        let encrypted_from_console_parse_attempt = Account::Encrypt {
            private_key: Some(import_private_key),
            file: None,
            write: true,
            password: Some("mypassword".to_string()),
        };
        let encrypted_from_console_parse_attempt_result = encrypted_from_console_parse_attempt.parse().unwrap();

        // Ensure a write message is emitted
        assert!(encrypted_from_console_parse_attempt_result.contains("written to"));
        let encrypted_from_console_account: AccountModel =
            serde_json::from_reader(&mut File::open(temp_dir.join("account-ciphertext.json")).unwrap()).unwrap();

        // Ensure the result is well formed
        assert!(encrypted_from_console_account.private_key.is_none());
        assert!(encrypted_from_console_account.view_key.is_none());
        assert_eq!(encrypted_from_console_account.address, Some(import_address));
        assert!(encrypted_from_console_account.private_key_ciphertext.is_some());

        // Ensure we can decrypt the ciphertext to file from the command line
        let encrypted_from_console_parse_attempt = Account::Decrypt {
            ciphertext: encrypted_from_console_account.private_key_ciphertext,
            file: None,
            write: true,
            password: Some("mypassword".to_string()),
        };
        let encrypted_from_console_parse_attempt_result = encrypted_from_console_parse_attempt.parse().unwrap();

        // Ensure a write message is emitted
        assert!(encrypted_from_console_parse_attempt_result.contains("written to"));

        let decrypted_from_console_account: AccountModel =
            serde_json::from_reader(&mut File::open(temp_dir.join("account-plaintext.json")).unwrap()).unwrap();
        assert!(decrypted_from_console_account.private_key_ciphertext.is_none());
        assert_eq!(decrypted_from_console_account.private_key, Some(import_private_key));
        assert_eq!(decrypted_from_console_account.view_key, Some(import_view_key));
        assert_eq!(decrypted_from_console_account.address, Some(import_address));
        fs::remove_file(temp_dir.join("account-plaintext.json")).unwrap();
        fs::remove_file(temp_dir.join("account-ciphertext.json")).unwrap();
    }

    #[test]
    fn test_account_encrypt_fails_with_invalid_inputs() {
        let account_no_inputs = Account::Encrypt { private_key: None, file: None, write: false, password: None };
        assert!(account_no_inputs.parse().is_err());

        let private_key = Some(PrivateKey::<CurrentNetwork>::new(&mut TestRng::default()).unwrap());
        let account_ambiguous_inputs =
            Account::Encrypt { private_key, file: Some("test.json".to_string()), write: false, password: None };
        assert!(account_ambiguous_inputs.parse().is_err());
    }

    #[test]
    fn test_account_decrypt_fails_with_invalid_inputs() {
        let account_no_inputs = Account::Decrypt { ciphertext: None, file: None, write: false, password: None };
        assert!(account_no_inputs.parse().is_err());

        let private_key = PrivateKey::<CurrentNetwork>::new(&mut ChaChaRng::seed_from_u64(5)).unwrap();
        let ciphertext = Some(Encryptor::encrypt_private_key_with_secret(&private_key, "password").unwrap());
        let account_ambiguous_inputs =
            Account::Decrypt { ciphertext, file: Some("test.json".to_string()), write: false, password: None };
        assert!(account_ambiguous_inputs.parse().is_err());
    }
}
