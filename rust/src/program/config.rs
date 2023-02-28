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

    use crate::{HybridResolver, NetworkConfig};
    use snarkvm_console::{account::PrivateKey, network::Testnet3};
    use std::fs;

    const ALEO_PRIVATE_KEY: &str = "APrivateKey1zkp3dQx4WASWYQVWKkq14v3RoQDfY2kbLssUj7iifi1VUQ6";
    const ALEO_PROGRAM: &str = "
program hello.aleo;

function hello:
    input r0 as u32.public;
    input r1 as u32.private;
    add r0 r1 into r2;
    output r2 as u32.private;
";

    #[test]
    fn test_program_addition() {
        let private_key = PrivateKey::<Testnet3>::from_str(ALEO_PRIVATE_KEY).unwrap();
        let network_config = NetworkConfig::new("http://localhost:3030".to_string(), "testnet3".to_string());
        let temp_dir = std::env::temp_dir();
        let _ = fs::remove_file(temp_dir.join("account-plaintext.json"));
        let _ = fs::remove_file(temp_dir.join("account-ciphertext.json"));
        std::env::set_current_dir(&temp_dir).unwrap();
        let mut program_manager =
            ProgramManager::<Testnet3, HybridResolver<Testnet3>>::program_manager_with_hybrid_resolution(
                Some(private_key),
                None,
                temp_dir.clone(),
                network_config.clone(),
            )
            .unwrap();

        let mut program_manager_2 =
            ProgramManager::<Testnet3, HybridResolver<Testnet3>>::program_manager_with_hybrid_resolution(
                Some(private_key),
                None,
                temp_dir.clone(),
                network_config,
            )
            .unwrap();

        // Test program addition
        let program = Program::<Testnet3>::from_str(ALEO_PROGRAM).unwrap();
        assert!(!program_manager.contains_program(program.id()).unwrap());
        program_manager.add_program(&program).unwrap();
        assert!(program_manager.contains_program(program.id()).unwrap());
        assert_eq!(program_manager.get_program(program.id()).unwrap(), program);
        assert_eq!(program_manager.get_program("hello.aleo").unwrap(), program);
        assert!(program_manager.contains_program("hello.aleo").unwrap());
        assert!(program_manager.add_program(&program).is_err());

        // Ensure program can be added from string
        program_manager_2.add_program_from_string(ALEO_PROGRAM).unwrap();
        assert!(program_manager_2.contains_program(program.id()).unwrap());
        let recovered_program = program_manager_2.get_program(program.id()).unwrap();
        assert_eq!(recovered_program, program);
    }
}
