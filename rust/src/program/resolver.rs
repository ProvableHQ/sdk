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

use anyhow::Result;
use core::str::FromStr;

pub enum ImportResolver {
    /// Resolves imports from the local file system, using the given path as the root directory for import resolution
    FileSystem(FileSystemResolver),
    /// Resolves imports from the Aleo network, using a beacon node URI to download programs
    Network(NetworkResolver),
    Manual,
}

/// Trait that allows implementation of custom import resolution behavior
pub trait Resolver<N: Network> {
    fn resolve_program_from_id(&self, program_id: &str) -> Result<()>;

    /// Resolves a program's imports from a given program
    fn resolve_program(&self, program: Program<N>) -> Result<()>;

    /// Resolves a program from a string representation of .leo program's source code
    fn resolve_from_string(&self, program: &str) -> Result<()> {
        let program = Program::from_str(&program)?;
        self.resolve_program(program)?;
        Ok(())
    }
}

pub struct FileSystemResolver;
pub struct NetworkResolver;
