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
use snarkvm_console::program::Network;
use snarkvm_synthesizer::Program;

use crate::{program::Resolver, NetworkConfig};
use anyhow::{bail, Result};

use std::str::FromStr;

impl<N: Network, R: Resolver<N>> ProgramManager<N, R> {
    /// Add default beacon network config to the program manager
    pub fn create_remote_network_config(&mut self) -> Result<()> {
        match N::NAME {
            "Aleo Testnet 3" => self.network_config = Some(NetworkConfig::testnet3()),
            _ => bail!("Testnet 3 is the only supported network at this time"),
        }
        Ok(())
    }

    /// Add local testnet3 network config to the program manager
    pub fn create_local_network_config(&mut self, port: &str) -> Result<()> {
        match N::NAME {
            "Aleo Testnet 3" => self.network_config = Some(NetworkConfig::local_testnet3(port)),
            _ => bail!("Testnet 3 is the only supported network at this time"),
        }
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
