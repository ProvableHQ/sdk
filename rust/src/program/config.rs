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
use snarkvm_console::program::{Ciphertext, Network};
use snarkvm_synthesizer::Program;

use crate::{program::Resolver};
use anyhow::{bail, Result};

use std::str::FromStr;
use snarkvm_console::account::PrivateKey;

impl<N: Network, R: Resolver<N>> ProgramManager<N, R> {
    /// Add private key to the program manager
    pub fn set_private_key(&mut self, private_key: PrivateKey<N>) -> Result<()> {
        if self.private_key_ciphertext.is_some() {
            bail!("Private key is already configured, annot have both private key and private key ciphertext");
        }
        self.private_key = Some(private_key);
        Ok(())
    }

    /// Add private key ciphertext to the program manager
    pub fn set_private_key_ciphertext(&mut self, ciphertext: Ciphertext<N>) -> Result<()> {
        if self.private_key.is_some() {
            bail!("Private key is already configured, annot have both private key and private key ciphertext");
        }
        self.private_key_ciphertext = Some(ciphertext);
        Ok(())
    }

    /// Manually add a program to the program manager
    pub fn add_program(&mut self, program: &Program<N>) -> Result<()> {
        self.vm.process().write().add_program(program)?;
        Ok(())
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
    
    
    

    #[test]
    fn test_additive_configuration_flow() {

    }
}