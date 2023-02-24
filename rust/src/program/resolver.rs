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

use snarkvm_console::network::Network;
use snarkvm_synthesizer::Program;

use crate::NetworkConfig;
use anyhow::Result;

use snarkvm_console::program::{Ciphertext, Plaintext, ProgramID, Record};
use std::path::PathBuf;

/// Trait that allows custom implementations of resource resolution for resources
/// needed to run Aleo programs such as imports and records.
pub trait Resolver<N: Network> {
    /// Find and load a program from a resource
    fn load_program(&self, program_id: &ProgramID<N>) -> Result<Program<N>>;

    /// Resolve imports for a given program
    fn resolve_program_imports(&self, program_id: &ProgramID<N>) -> Result<()>;

    /// Find records that belong to a user
    fn find_records(&self) -> Result<Vec<Record<N, Ciphertext<N>>>>;

    /// Find unspent records that belong to a user
    fn find_unspent_records(&self) -> Result<Vec<Record<N, Plaintext<N>>>>;
}

/// Resolver for imports from the local file system
pub struct FileSystemResolver<N: Network> {
    path: PathBuf,
    _phantom: core::marker::PhantomData<N>,
}

impl<N: Network> FileSystemResolver<N> {
    /// Create a new file system resolver
    pub fn new(path: PathBuf) -> Self {
        Self { path, _phantom: core::marker::PhantomData }
    }
}

/// Resolver for resources from the Aleo network
pub struct AleoNetworkResolver<N: Network> {
    network_config: NetworkConfig,
    _phantom: core::marker::PhantomData<N>,
}

/// Reso
impl<N: Network> AleoNetworkResolver<N> {
    /// Create a new network resolver
    pub fn new(network_config: NetworkConfig) -> Self {
        Self { network_config, _phantom: core::marker::PhantomData }
    }
}

/// Hybrid resolver that uses a combination of local file system and network imports
pub struct HybridResolver<N: Network> {
    network_config: NetworkConfig,
    path: PathBuf,
    _phantom: core::marker::PhantomData<N>,
}

impl<N: Network> HybridResolver<N> {
    /// Create a new hybrid resolver
    pub fn new(network_config: NetworkConfig, path: PathBuf, local_first: bool) -> Self {
        Self { network_config, path, _phantom: core::marker::PhantomData }
    }
}

impl<N: Network> Resolver<N> for FileSystemResolver<N> {
    fn load_program(&self, _program_id: &ProgramID<N>) -> Result<Program<N>> {
        Program::credits()
    }

    fn resolve_program_imports(&self, _program: &ProgramID<N>) -> Result<()> {
        Ok(())
    }

    fn find_records(&self) -> Result<Vec<Record<N, Ciphertext<N>>>> {
        Ok(vec![])
    }

    fn find_unspent_records(&self) -> Result<Vec<Record<N, Plaintext<N>>>> {
        Ok(vec![])
    }
}

impl<N: Network> Resolver<N> for AleoNetworkResolver<N> {
    fn load_program(&self, _program_id: &ProgramID<N>) -> Result<Program<N>> {
        Program::credits()
    }

    fn resolve_program_imports(&self, _program: &ProgramID<N>) -> Result<()> {
        Ok(())
    }

    fn find_records(&self) -> Result<Vec<Record<N, Ciphertext<N>>>> {
        Ok(vec![])
    }

    fn find_unspent_records(&self) -> Result<Vec<Record<N, Plaintext<N>>>> {
        Ok(vec![])
    }
}
