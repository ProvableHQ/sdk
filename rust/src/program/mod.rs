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

//! Tools for deploying, executing, and managing programs on the Aleo network

use super::*;

pub mod deploy;
pub use deploy::*;

pub mod execute;
pub use execute::*;

pub mod helpers;
pub use helpers::*;

pub mod network;
pub use network::*;

pub mod resolver;
pub use resolver::*;

pub mod transfer;
pub use transfer::*;

/// Program management object for loading programs for building, execution, and deployment
///
/// This object is meant to be a software abstraction that can be consumed by software like
/// CLI tools, IDE plugins, Server-side stack components and other software that needs to
/// interact with the Aleo network.
#[derive(Clone)]
pub struct ProgramManager<N: Network> {
    pub(crate) programs: IndexMap<ProgramID<N>, Program<N>>,
    pub(crate) private_key: Option<PrivateKey<N>>,
    pub(crate) private_key_ciphertext: Option<Ciphertext<N>>,
    pub(crate) local_program_directory: Option<PathBuf>,
    pub(crate) api_client: Option<AleoAPIClient<N>>,
}

impl<N: Network> ProgramManager<N> {
    /// Create a new program manager by specifying custom options for the private key (or private
    /// key ciphertext) and resolver. Use this method if you want to create a custom resolver
    /// (i.e. one that searches a local or remote database) for program and record resolution.
    pub fn new(
        private_key: Option<PrivateKey<N>>,
        private_key_ciphertext: Option<Ciphertext<N>>,
        api_client: Option<AleoAPIClient<N>>,
        local_program_directory: Option<PathBuf>,
    ) -> Result<Self> {
        if private_key.is_some() && private_key_ciphertext.is_some() {
            bail!("Cannot have both private key and private key ciphertext");
        } else if private_key.is_none() && private_key_ciphertext.is_none() {
            bail!("Must have either private key or private key ciphertext");
        }
        let programs = IndexMap::new();
        Ok(Self { programs, private_key, private_key_ciphertext, local_program_directory, api_client })
    }

    /// Manually add a program to the program manager from memory if it does not already exist
    pub fn add_program(&mut self, program: &Program<N>) -> Result<()> {
        if self.contains_program(program.id())? {
            bail!("program already exists")
        };
        self.programs.entry(*program.id()).or_insert(program.clone());
        Ok(())
    }

    /// Manually add a program to the program manager if it does not already exist or update
    /// it if it does
    pub fn update_program(&mut self, program: &Program<N>) -> Option<Program<N>> {
        self.programs.insert(*program.id(), program.clone())
    }

    /// Retrieve a program from the program manager if it exists
    pub fn get_program(&self, program_id: impl TryInto<ProgramID<N>>) -> Result<Program<N>> {
        let program_id = program_id.try_into().map_err(|_| anyhow!("invalid program id"))?;
        self.programs.get(&program_id).map_or(Err(anyhow!("program not found")), |program| Ok(program.clone()))
    }

    /// Determine if a program exists in the program manager
    pub fn contains_program(&self, program_id: impl TryInto<ProgramID<N>>) -> Result<bool> {
        let program_id = program_id.try_into().map_err(|_| anyhow!("invalid program id"))?;
        Ok(self.programs.contains_key(&program_id))
    }

    /// Get the private key from the program manager. If the key is stored as ciphertext, a
    /// password must be provided to decrypt it
    pub(super) fn get_private_key(&self, password: Option<&str>) -> Result<PrivateKey<N>> {
        if self.private_key.is_none() && self.private_key_ciphertext.is_none() {
            bail!("Private key is not configured");
        };
        if let Some(private_key) = &self.private_key {
            if self.private_key_ciphertext.is_some() {
                bail!(
                    "Private key ciphertext is also configured, cannot have both private key and private key ciphertext"
                );
            }
            return Ok(*private_key);
        };
        if let Some(ciphertext) = &self.private_key_ciphertext {
            if self.private_key.is_some() {
                bail!("Private key is already configured, cannot have both private key and private key ciphertext");
            }

            let password = password.ok_or_else(|| anyhow!("Private key is encrypted, password is required"))?;
            return Encryptor::<N>::decrypt_private_key_with_secret(ciphertext, password);
        };
        bail!("Private key configuration error")
    }
}

#[cfg(test)]
mod tests {

    use super::*;
    use crate::{
        test_utils::{HELLO_PROGRAM, HELLO_PROGRAM_2},
        RECIPIENT_PRIVATE_KEY,
    };

    #[test]
    fn test_constructors_fail_with_multiple_keys_or_no_keys() {
        let api_client = AleoAPIClient::<Testnet3>::testnet3();
        let private_key = PrivateKey::<Testnet3>::from_str(RECIPIENT_PRIVATE_KEY).unwrap();
        let private_key_ciphertext =
            Encryptor::<Testnet3>::encrypt_private_key_with_secret(&private_key, "password").unwrap();
        // Create a temp dir without proper programs to test that the hybrid client works even if the local resource directory doesn't exist
        let temp_dir = std::env::temp_dir();

        // Ensure that program manager creation fails if no key is provided
        let program_manager =
            ProgramManager::<Testnet3>::new(None, None, Some(api_client.clone()), Some(temp_dir.clone()));

        assert!(program_manager.is_err());

        // Ensure that program manager creation fails if both key and key ciphertext are provided
        let program_manager = ProgramManager::<Testnet3>::new(
            Some(private_key),
            Some(private_key_ciphertext.clone()),
            Some(api_client.clone()),
            Some(temp_dir.clone()),
        );

        assert!(program_manager.is_err());

        // Ensure program manager is created successfully if only a private key is provided
        let program_manager =
            ProgramManager::<Testnet3>::new(Some(private_key), None, Some(api_client.clone()), Some(temp_dir.clone()));

        assert!(program_manager.is_ok());

        // Ensure program manager is created successfully if only a private key ciphertext is provided
        let program_manager =
            ProgramManager::<Testnet3>::new(None, Some(private_key_ciphertext), Some(api_client), Some(temp_dir));

        assert!(program_manager.is_ok());
    }

    #[test]
    fn test_program_management_methods() {
        let private_key = PrivateKey::<Testnet3>::from_str(RECIPIENT_PRIVATE_KEY).unwrap();
        let mut program_manager = ProgramManager::<Testnet3>::new(Some(private_key), None, None, None).unwrap();

        // Test program addition
        let program = Program::<Testnet3>::from_str(HELLO_PROGRAM).unwrap();
        assert!(!program_manager.contains_program(program.id()).unwrap());
        program_manager.add_program(&program).unwrap();
        assert!(program_manager.contains_program(program.id()).unwrap());
        assert_eq!(program_manager.get_program(program.id()).unwrap(), program);
        assert_eq!(program_manager.get_program("hello.aleo").unwrap(), program);
        assert!(program_manager.contains_program("hello.aleo").unwrap());
        assert!(program_manager.add_program(&program).is_err());

        // Test program update methods
        let program_2 = Program::<Testnet3>::from_str(HELLO_PROGRAM_2).unwrap();
        let replaced_program = program_manager.update_program(&program_2).unwrap();
        let retrieved_program = program_manager.get_program(program.id()).unwrap();
        assert_eq!(replaced_program, program);
        assert_eq!(retrieved_program, program_2);
    }

    #[test]
    fn test_private_key_retrieval_from_ciphertext() {
        let private_key = PrivateKey::from_str(RECIPIENT_PRIVATE_KEY).unwrap();
        let private_key_ciphertext =
            Encryptor::<Testnet3>::encrypt_private_key_with_secret(&private_key, "password").unwrap();
        let temp_dir = std::env::temp_dir();
        let api_client = AleoAPIClient::<Testnet3>::testnet3();

        let program_manager =
            ProgramManager::<Testnet3>::new(None, Some(private_key_ciphertext), Some(api_client), Some(temp_dir))
                .unwrap();

        // Assert private key recovers correctly
        let recovered_private_key = program_manager.get_private_key(Some("password")).unwrap();
        assert_eq!(recovered_private_key, private_key);

        // Assert error is thrown if password is incorrect
        let recovered_private_key = program_manager.get_private_key(Some("wrong_password"));
        assert!(recovered_private_key.is_err());

        // Assert error is thrown if password is not provided
        let recoverd_private_key = program_manager.get_private_key(None);
        assert!(recoverd_private_key.is_err());
    }

    #[test]
    fn test_private_key_retrieval_from_plaintext() {
        let private_key = PrivateKey::<Testnet3>::from_str(RECIPIENT_PRIVATE_KEY).unwrap();
        let temp_dir = std::env::temp_dir();
        let api_client = AleoAPIClient::<Testnet3>::testnet3();

        let program_manager =
            ProgramManager::<Testnet3>::new(Some(private_key), None, Some(api_client), Some(temp_dir)).unwrap();

        // Assert private key recovers correctly regardless of password
        let recovered_private_key = program_manager.get_private_key(None).unwrap();
        assert_eq!(recovered_private_key, private_key);

        let recovered_private_key = program_manager.get_private_key(Some("password")).unwrap();
        assert_eq!(recovered_private_key, private_key);
    }
}
