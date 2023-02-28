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

use super::Resolver;
use snarkvm_console::network::Network;
use snarkvm_synthesizer::Program;

use crate::{AleoNetworkResolver, FileSystemResolver, NetworkConfig, RecordQuery};
use anyhow::{bail, ensure, Result};

use snarkvm_console::program::{Ciphertext, Plaintext, ProgramID, Record};
use std::path::PathBuf;
use snarkvm::file::Manifest;
use snarkvm::package::Package;
use snarkvm::prelude::{PrivateKey, ViewKey};

/// Hybrid resolver that uses a combination of local file system and network imports
///
/// The default behavior is to first attempt to load a program from the local file system,
/// and if that fails, to attempt to load it from programs stored on the aleo network.
pub struct HybridResolver<N: Network> {
    file_system_resolver: FileSystemResolver<N>,
    network_resolver: AleoNetworkResolver<N>,
}

impl<N: Network> HybridResolver<N> {
    /// Create a new hybrid resolver
    pub fn new(network_config: &NetworkConfig, local_config: &PathBuf) -> Result<Self> {
        ensure!(local_config.exists(), "Path does not exist");
        ensure!(local_config.is_dir(), "Path is not a directory");
        let file_system_resolver = FileSystemResolver::new(local_config)?;
        let network_resolver = AleoNetworkResolver::new(network_config)?;
        Ok(Self {
            file_system_resolver,
            network_resolver,
        })
    }

    pub fn import_directory(&mut self) -> PathBuf {
        let mut import_directory = self.local_config.clone();
        import_directory.push("/imports");
        import_directory
    }

    pub fn inputs_directory(&self) -> PathBuf {
        self.local_config.join("/inputs")
    }
}

impl<N: Network> Resolver<N> for HybridResolver<N> {
    const NAME: &'static str = "FileSystemResolver";

    fn load_program(&self, program_id: &ProgramID<N>) -> Result<Program<N>> {
        self.file_system_resolver.load_program(program_id).or_else(|_| self.network_resolver.load_program(program_id))
    }

    fn resolve_program_imports(&self, program: &Program<N>) -> Result<Vec<(ProgramID<N>, Result<Program<N>>)>> {
        let results = self.file_system_resolver.resolve_program_imports(program)?;
        let mut results = results
            .into_iter()
            .map(|(program_id, result)| {
                if result.is_err() {
                    (program_id, self.network_resolver.load_program(&program_id)?)
                } else {
                    (program_id, result)
                }
            })
            .collect::<Vec<_>>();
    }

    fn find_owned_records(&self, private_key: &PrivateKey<N>, record_query: &RecordQuery) -> Result<Vec<Record<N, Plaintext<N>>>> {
        self.network_resolver.find_owned_records(private_key, record_query)
    }
}
