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
use snarkvm_console::{account::PrivateKey, program::Network};
use snarkvm_synthesizer::Program;

use crate::NetworkConfig;
use anyhow::{bail, Result};
use snarkvm_console::program::Ciphertext;
use std::str::FromStr;

impl<N: Network> ProgramManager<N> {
    /// Add private key to the program manager
    pub fn add_private_key(&mut self, private_key: PrivateKey<N>) -> Result<&mut Self> {
        if self.private_key_ciphertext.is_some() {
            bail!("Cannot add private key to program manager when private key ciphertext is already present")
        };
        self.private_key = Some(private_key);
        Ok(self)
    }

    /// Add private key ciphertext to the program manager
    pub fn add_private_key_ciphertext(&mut self, private_key_ciphertext: Ciphertext<N>) -> Result<&mut Self> {
        if self.private_key.is_some() {
            bail!("Cannot add private key ciphertext to program manager when private key is already present")
        };
        self.private_key_ciphertext = Some(private_key_ciphertext);
        Ok(self)
    }

    /// Add program to the program manager
    pub fn add_network_config(&mut self, network_config: NetworkConfig) -> &mut Self {
        self.network_config = Some(network_config);
        self
    }

    /// Add testnet3 network config to the program manager
    pub fn add_testnet3_network_config(&mut self) -> &mut Self {
        self.add_network_config(NetworkConfig::testnet3())
    }

    /// Add local testnet3 network config to the program manager
    pub fn add_local_testnet3_network_config(&mut self, port: &str) -> &mut Self {
        self.add_network_config(NetworkConfig::local_testnet3(port))
    }

    pub fn load_program_from_str(&self, program: &str) -> Result<()> {
        let _ = Program::<N>::from_str(program)?;
        Ok(())
    }
}
