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
use snarkvm_synthesizer::{Process, Program};

use crate::{AleoAPIClient, NetworkConfig};
use anyhow::{bail, ensure, Result};
use core::str::FromStr;
use snarkvm_console::program::{Ciphertext, Plaintext, ProgramID, Record};
use std::path::PathBuf;

/// Trait that allows custom implementations of aleo program resource locators
pub trait Resolver<N: Network> {
    /// Find and load a program from a resource
    fn load_program(&mut self, program_id: impl TryInto<ProgramID<N>>) -> Result<Program<N>>;

    /// Resolve imports for a given program
    fn resolve_program_imports(&mut self, program_id: impl TryInto<ProgramID<N>>) -> Result<()>;

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

/// Resolver for imports from the Aleo network
pub struct NetworkResolver<N: Network> {
    network_config: NetworkConfig,
    _phantom: core::marker::PhantomData<N>,
}

/// Hybrid resolver that uses a combination of local file system and network imports
pub struct HybridResolver<N: Network> {
    file_system_resolver: FileSystemResolver<N>,
    network_resolver: NetworkResolver<N>,
    local_first: bool,
}

impl<N: Network> Resolver<N> for FileSystemResolver<N> {
    fn load_program(&mut self, program_id: impl TryInto<ProgramID<N>>) -> Result<Program<N>> {
        Program::credits()
    }

    fn resolve_program_imports(&self, program_id: &str) -> Result<()> {
        Ok(())
    }

    fn find_records(&self) -> Result<Vec<Record<N, Ciphertext<N>>>> {
        Ok(vec![])
    }

    fn find_unspent_records(&self) -> Result<Vec<Record<N, Plaintext<N>>>> {
        Ok(vec![])
    }
}

impl<N: Network> Resolver<N> for NetworkResolver<N> {
    fn load_program(&mut self, program_id: impl TryInto<ProgramID<N>>) -> Result<Program<N>> {
        Program::credits()
    }

    fn resolve_program_imports(&self, program: Program<N>) -> Result<Process<N>> {
        let mut process = Process::load()?;
        program.imports().iter().for_each(|import| {
            if process.contains_program(import.program_id()) {
                let program_id = import.program_id();
                let program =
                    AleoAPIClient::<N>::new("https://vm.aleo.org/api/", "testnet3").get_program(program_id)?;
                process.add_program(&program)?;
            }
        });
        Ok(process)
    }

    fn find_records(&self) -> Result<Vec<Record<N, Ciphertext<N>>>> {
        Ok(vec![])
    }

    fn find_unspent_records(&self) -> Result<Vec<Record<N, Plaintext<N>>>> {
        Ok(vec![])
    }
}
