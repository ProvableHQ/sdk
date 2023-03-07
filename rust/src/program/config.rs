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

use crate::{Encryptor, ProgramManager, Resolver};
use snarkvm_console::{
    account::PrivateKey,
    program::{Network, ProgramID},
};
use snarkvm_synthesizer::Program;

use anyhow::{anyhow, bail, Result};
use std::str::FromStr;

impl<N: Network, R: Resolver<N>> ProgramManager<N, R> {
    // Program addition and retrieval methods. These methods are not currently thread-safe
    /// Manually add a program to the program manager if it does not already exist
    pub fn add_program(&mut self, program: &Program<N>) -> Result<()> {
        if self.contains_program(program.id())? {
            bail!("program already exists")
        };
        self.programs.entry(*program.id()).or_insert(program.clone());
        Ok(())
    }

    /// Manually add a program to the program manager from a string representation of the program
    /// if it does not already exist
    pub fn add_program_from_string(&mut self, program: &str) -> Result<()> {
        let program = Program::<N>::from_str(program)?;
        self.add_program(&program)?;
        Ok(())
    }

    /// Manually add a program to the program manager if it does not already exist or update
    /// it if it does
    pub fn add_or_update_program(&mut self, program: &Program<N>) -> Option<Program<N>> {
        self.programs.insert(*program.id(), program.clone())
    }

    /// Manually add a program to the program manager from a string representation of a program
    /// if it does not already exist or update it if it does
    pub fn add_or_update_program_from_string(&mut self, program: &str) -> Result<Option<Program<N>>> {
        let program = Program::<N>::from_str(program)?;
        Ok(self.add_or_update_program(&program))
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
        test_utils::{HELLO_PROGRAM, HELLO_PROGRAM_2, RECIPIENT_PRIVATE_KEY},
        HybridResolver,
        NetworkConfig,
    };
    use snarkvm_console::{account::PrivateKey, network::Testnet3};

    #[test]
    fn test_program_addition() {
        let private_key = PrivateKey::<Testnet3>::from_str(RECIPIENT_PRIVATE_KEY).unwrap();
        let network_config = NetworkConfig::new("http://localhost:3030".to_string(), "testnet3".to_string());
        let temp_dir = std::env::temp_dir();
        std::env::set_current_dir(&temp_dir).unwrap();
        let mut program_manager =
            ProgramManager::<Testnet3, HybridResolver<Testnet3>>::program_manager_with_hybrid_resolution(
                Some(private_key),
                None,
                temp_dir.clone(),
                network_config.clone(),
            )
            .unwrap();

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
        let replaced_program = program_manager.add_or_update_program(&program_2).unwrap();
        let retrieved_program = program_manager.get_program(program.id()).unwrap();
        assert_eq!(replaced_program, program);
        assert_eq!(retrieved_program, program_2);
        let replaced_program = program_manager.add_or_update_program_from_string(HELLO_PROGRAM).unwrap().unwrap();
        let retrieved_program = program_manager.get_program(program.id()).unwrap();
        assert_eq!(replaced_program, program_2);
        assert_eq!(retrieved_program, program);
    }

    #[test]
    fn test_program_can_be_added_from_string() {
        let private_key = PrivateKey::from_str(RECIPIENT_PRIVATE_KEY).unwrap();
        let temp_dir = std::env::temp_dir();
        let network_config = NetworkConfig::testnet3();
        let mut program_manager =
            ProgramManager::<Testnet3, HybridResolver<Testnet3>>::program_manager_with_hybrid_resolution(
                Some(private_key),
                None,
                temp_dir,
                network_config,
            )
            .unwrap();

        program_manager.add_program_from_string(HELLO_PROGRAM).unwrap();
        let contains_program = program_manager.contains_program("hello.aleo").unwrap();
        assert!(contains_program);
        let recovered_program = program_manager.get_program("hello.aleo").unwrap();
        assert_eq!(recovered_program, Program::from_str(HELLO_PROGRAM).unwrap());
    }

    #[test]
    fn test_private_key_retrieval_from_ciphertext() {
        let private_key = PrivateKey::from_str(RECIPIENT_PRIVATE_KEY).unwrap();
        let temp_dir = std::env::temp_dir();
        let network_config = NetworkConfig::testnet3();

        let private_key_ciphertext =
            Encryptor::<Testnet3>::encrypt_private_key_with_secret(&private_key, "password").unwrap();
        let program_manager =
            ProgramManager::<Testnet3, HybridResolver<Testnet3>>::program_manager_with_hybrid_resolution(
                None,
                Some(private_key_ciphertext),
                temp_dir,
                network_config,
            )
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
        let network_config = NetworkConfig::testnet3();

        let program_manager =
            ProgramManager::<Testnet3, HybridResolver<Testnet3>>::program_manager_with_hybrid_resolution(
                Some(private_key),
                None,
                temp_dir,
                network_config,
            )
            .unwrap();

        // Assert private key recovers correctly regardless of password
        let recovered_private_key = program_manager.get_private_key(Some("password")).unwrap();
        assert_eq!(recovered_private_key, private_key);

        let recovered_private_key = program_manager.get_private_key(Some("wrong_password")).unwrap();
        assert_eq!(recovered_private_key, private_key);
    }
}
