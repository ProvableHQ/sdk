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

use crate::{api::AleoAPIClient, NetworkConfig};
use anyhow::{bail, Result};

use snarkvm_console::program::{Ciphertext, Plaintext, ProgramID, Record};

use super::Resolver;

/// Resolver for resources from the Aleo network
pub struct AleoNetworkResolver<N: Network> {
    network_config: NetworkConfig,
    _phantom: core::marker::PhantomData<N>,
}

/// Reso
impl<N: Network> AleoNetworkResolver<N> {
    /// Create a new network resolver
    pub fn new(network_config: &NetworkConfig) -> Self {
        let _config = network_config.clone();
        Self { network_config: network_config.clone(), _phantom: core::marker::PhantomData }
    }
}

impl<N: Network> Resolver<N> for AleoNetworkResolver<N> {
    const NAME: &'static str = "AleoNetworkResolver";

    fn load_program(&self, program_id: &ProgramID<N>) -> Result<Program<N>> {
        AleoAPIClient::<N>::from(&self.network_config).get_program(program_id)
    }

    fn resolve_program_imports(&self, program: &Program<N>) -> Result<Vec<(ProgramID<N>, Result<Program<N>>)>> {
        let api_client = AleoAPIClient::<N>::from(&self.network_config);
        program
            .imports()
            .keys()
            .map(|program_id| {
                // Open the Aleo program file.
                let program = api_client.get_program(program_id);
                Ok((program_id.clone(), program))
            })
            .collect::<Result<Vec<(ProgramID<N>, Result<Program<N>>)>>>()
    }

    fn find_records(&self) -> Result<Vec<Record<N, Ciphertext<N>>>> {
        Ok(vec![])
    }

    fn find_unspent_records(&self) -> Result<Vec<Record<N, Plaintext<N>>>> {
        Ok(vec![])
    }
}
