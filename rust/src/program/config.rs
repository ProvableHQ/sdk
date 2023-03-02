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

use super::ProgramManager;
use snarkvm_console::program::{Network, ProgramID};
use snarkvm_synthesizer::Program;

use crate::program::Resolver;
use anyhow::{anyhow, Result};

use std::str::FromStr;

impl<N: Network, R: Resolver<N>> ProgramManager<N, R> {
    /// Manually add a program to the program manager
    pub fn add_program(&mut self, program: &Program<N>) -> Result<()> {
        self.vm.process().write().add_program(program)
    }

    /// Retrieve a program from the program manager
    pub fn get_program(&self, program_id: impl TryInto<ProgramID<N>>) -> Result<Program<N>> {
        let program_id = program_id.try_into().map_err(|_| anyhow!("invalid program id"))?;
        Ok(self.vm.process().read().get_program(program_id)?.clone())
    }

    /// Contains program
    pub fn contains_program(&self, program_id: impl TryInto<ProgramID<N>>) -> Result<bool> {
        let program_id = program_id.try_into().map_err(|_| anyhow!("invalid program id"))?;
        Ok(self.vm.process().read().contains_program(&program_id))
    }

    /// Manually add a program to the program manager from a string representation
    pub fn add_program_from_string(&mut self, program: &str) -> Result<()> {
        let program = Program::<N>::from_str(program)?;
        self.add_program(&program)?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {

    use super::*;

    use crate::{
        test_utils::{HELLO_PROGRAM, RECIPIENT_PRIVATE_KEY},
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
}
