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

use anyhow::{bail, Result};

use snarkvm_console::program::{Ciphertext, Plaintext, ProgramID, Record};

pub mod file;
pub use file::*;

pub mod hybrid;
pub use hybrid::*;

pub mod network;
pub use network::*;

/// Trait that allows custom implementations of resource resolution for resources
/// needed to run Aleo programs such as imports and records.
pub trait Resolver<N: Network> {
    const NAME: &'static str;

    /// Find and load a program from the specified resource location
    fn load_program(&self, program_id: &ProgramID<N>) -> Result<Program<N>>;

    /// Resolve imports for a given program
    fn resolve_program_imports(&self, program: &Program<N>) -> Result<Vec<(ProgramID<N>, Result<Program<N>>)>>;

    /// Find records that belong to a user
    fn find_records(&self) -> Result<Vec<Record<N, Ciphertext<N>>>>;

    /// Find unspent records that belong to a user
    fn find_unspent_records(&self) -> Result<Vec<Record<N, Plaintext<N>>>>;
}

/// Noop resolver that does not resolve any imports and assumes the user of the program
/// manager will manually provide the necessary resources.
pub struct NoOpResolver<N: Network> {
    _phantom: core::marker::PhantomData<N>,
}

impl<N: Network> Default for NoOpResolver<N> {
    fn default() -> Self {
        Self { _phantom: core::marker::PhantomData }
    }
}

impl<N: Network> Resolver<N> for NoOpResolver<N> {
    const NAME: &'static str = "FileSystemResolver";

    fn load_program(&self, _program_id: &ProgramID<N>) -> Result<Program<N>> {
        bail!("A functional resolver is required to load programs, please configure one");
    }

    fn resolve_program_imports(&self, _program: &Program<N>) -> Result<Vec<(ProgramID<N>, Result<Program<N>>)>> {
        bail!("A functional resolver is required to resolve imports, please configure one");
    }

    fn find_records(&self) -> Result<Vec<Record<N, Ciphertext<N>>>> {
        bail!("A functional resolver is required to find records, please configure one");
    }

    fn find_unspent_records(&self) -> Result<Vec<Record<N, Plaintext<N>>>> {
        bail!("A functional resolver is required to find records, please configure one");
    }
}
