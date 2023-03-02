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

use crate::api::{config::NetworkConfig, AleoAPIClient};
use snarkvm_console::{
    account::PrivateKey,
    program::{Ciphertext, Network},
};
use snarkvm_synthesizer::{Block, ConsensusMemory, ConsensusStore, Transaction, VM};

use anyhow::{anyhow, bail, Result};
use std::path::PathBuf;

pub mod build;
pub use build::*;

pub mod config;
pub use config::*;

pub mod deploy;
pub use deploy::*;

pub mod helpers;
pub use helpers::*;

pub mod network;
pub use network::*;

pub mod resolvers;
pub use resolvers::*;

pub mod transfer;
pub use transfer::*;

pub mod validation;
pub use validation::*;

/// Program management object for loading programs for building, execution, and deployment
///
/// This object is meant to be a software abstraction that can be consumed by software like
/// CLI tools, IDE plugins, Server-side stack components and other software that needs to
/// interact with the Aleo network.
#[derive(Clone)]
pub struct ProgramManager<N: Network, R: Resolver<N>> {
    pub(crate) vm: VM<N, ConsensusMemory<N>>,
    pub(crate) private_key: Option<PrivateKey<N>>,
    pub(crate) private_key_ciphertext: Option<Ciphertext<N>>,
    pub(crate) api_client: Option<AleoAPIClient<N>>,
    pub(crate) resolver: R,
}

impl<N: Network, R: Resolver<N>> ProgramManager<N, R> {
    /// Create a new program manager by specifying custom options for the
    /// private key, private key ciphertext, and a resolver
    pub fn new(
        private_key: Option<PrivateKey<N>>,
        private_key_ciphertext: Option<Ciphertext<N>>,
        network_config: Option<NetworkConfig>,
        resolver: R,
    ) -> Result<Self> {
        if private_key.is_some() && private_key_ciphertext.is_some() {
            bail!("Cannot have both private key and private key ciphertext");
        } else if private_key.is_none() && private_key_ciphertext.is_none() {
            bail!("Must have either private key or private key ciphertext");
        }
        let api_client = network_config.map(|config| AleoAPIClient::<N>::from(&config));
        let store = ConsensusStore::<N, ConsensusMemory<N>>::open(None)?;
        let vm = VM::from(store)?;
        Ok(Self { vm, private_key, private_key_ciphertext, api_client, resolver })
    }

    pub fn program_manager_with_local_resource_resolution(
        private_key: Option<PrivateKey<N>>,
        private_key_ciphertext: Option<Ciphertext<N>>,
        local_directory: impl TryInto<PathBuf>,
        network_config: Option<NetworkConfig>,
    ) -> Result<ProgramManager<N, FileSystemResolver<N>>> {
        let local_directory = local_directory.try_into().map_err(|_| anyhow!("Path specified was not valid"))?;
        let resolver = FileSystemResolver::new(&local_directory)?;
        ProgramManager::<N, FileSystemResolver<N>>::new(private_key, private_key_ciphertext, network_config, resolver)
    }

    pub fn program_manager_with_network_resolution(
        private_key: Option<PrivateKey<N>>,
        private_key_ciphertext: Option<Ciphertext<N>>,
        network_config: NetworkConfig,
    ) -> Result<ProgramManager<N, AleoNetworkResolver<N>>> {
        let resolver = AleoNetworkResolver::new(&network_config);
        ProgramManager::<N, AleoNetworkResolver<N>>::new(
            private_key,
            private_key_ciphertext,
            Some(network_config),
            resolver,
        )
    }

    pub fn program_manager_with_hybrid_resolution(
        private_key: Option<PrivateKey<N>>,
        private_key_ciphertext: Option<Ciphertext<N>>,
        local_directory: impl TryInto<PathBuf>,
        network_config: NetworkConfig,
    ) -> Result<ProgramManager<N, HybridResolver<N>>> {
        let local_directory = local_directory.try_into().map_err(|_| anyhow!("Path specified was not valid"))?;
        let resolver = HybridResolver::new(&network_config, &local_directory)?;
        ProgramManager::<N, HybridResolver<N>>::new(private_key, private_key_ciphertext, Some(network_config), resolver)
    }
}
