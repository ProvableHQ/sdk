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
    program::{Ciphertext, Network, ProgramID},
};
use snarkvm_synthesizer::Program;

use anyhow::{anyhow, bail, Result};
use indexmap::IndexMap;
use snarkvm_console::program::Address;
use std::path::PathBuf;

pub mod config;
pub use config::*;

pub mod helpers;
pub use helpers::*;

pub mod network;
pub use network::*;

pub mod resolvers;
pub use resolvers::*;

pub mod transfer;
pub use transfer::*;

/// Program management object for loading programs for building, execution, and deployment
///
/// This object is meant to be a software abstraction that can be consumed by software like
/// CLI tools, IDE plugins, Server-side stack components and other software that needs to
/// interact with the Aleo network.
#[derive(Clone)]
pub struct ProgramManager<N: Network, R: Resolver<N>> {
    pub(crate) programs: IndexMap<ProgramID<N>, Program<N>>,
    pub(crate) private_key: Option<PrivateKey<N>>,
    pub(crate) private_key_ciphertext: Option<Ciphertext<N>>,
    pub(crate) api_client: Option<AleoAPIClient<N>>,
    pub(crate) resolver: R,
}

impl<N: Network, R: Resolver<N>> ProgramManager<N, R> {
    /// Create a new program manager by specifying custom options for the private key (or private
    /// key ciphertext) and resolver. Use this method if you want to create a custom resolver
    /// (i.e. one that searches a local or remote database) for program and record resolution.
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
        let programs = IndexMap::new();
        Ok(Self { programs, private_key, private_key_ciphertext, api_client, resolver })
    }

    /// Create a program manager with a file resolver that only uses the local file system to
    /// resolve programs and records
    pub fn program_manager_with_local_resource_resolution(
        private_key: Option<PrivateKey<N>>,
        private_key_ciphertext: Option<Ciphertext<N>>,
        address: &Address<N>,
        local_directory: impl TryInto<PathBuf>,
        network_config: Option<NetworkConfig>,
    ) -> Result<ProgramManager<N, FileSystemResolver<N>>> {
        let local_directory = local_directory.try_into().map_err(|_| anyhow!("Path specified was not valid"))?;
        let resolver = FileSystemResolver::new(&local_directory, Some(*address))?;
        ProgramManager::<N, FileSystemResolver<N>>::new(private_key, private_key_ciphertext, network_config, resolver)
    }

    /// Create a program manager configured with a network resolver which only uses the Aleo network
    /// to resolve programs and records
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

    /// Create a hybrid program manager which has the following behavior
    ///
    /// 1. Programs will first be searched for on the local file system, if a program or its imports
    /// cannot be found within the specified directory, the resolver will attempt to resolve the
    /// missing programs from the Aleo network
    /// 2. The resolver will always attempt to resolve records on the Aleo network (and not within
    /// the local file system)
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

#[cfg(test)]
mod tests {

    use super::*;
    use crate::{Encryptor, RECIPIENT_PRIVATE_KEY};
    use snarkvm_console::network::Testnet3;

    use std::str::FromStr;

    #[test]
    fn test_constructors_fail_with_multiple_keys_or_no_keys() {
        let network_config = NetworkConfig::testnet3();
        let private_key = PrivateKey::<Testnet3>::from_str(RECIPIENT_PRIVATE_KEY).unwrap();
        let address = Address::<Testnet3>::try_from(&private_key).unwrap();
        let private_key_ciphertext =
            Encryptor::<Testnet3>::encrypt_private_key_with_secret(&private_key, "password").unwrap();
        // Create a temp dir without proper programs to test that the hybrid client works even if the local resource directory doesn't exist
        let temp_dir = std::env::temp_dir();

        let file_program_manager =
            ProgramManager::<Testnet3, FileSystemResolver<Testnet3>>::program_manager_with_local_resource_resolution(
                None,
                None,
                &address,
                temp_dir.clone(),
                Some(network_config.clone()),
            );

        assert!(file_program_manager.is_err());

        let hybrid_program_manager =
            ProgramManager::<Testnet3, HybridResolver<Testnet3>>::program_manager_with_hybrid_resolution(
                None,
                None,
                temp_dir.clone(),
                network_config.clone(),
            );

        assert!(hybrid_program_manager.is_err());

        let network_program_manager =
            ProgramManager::<Testnet3, AleoNetworkResolver<Testnet3>>::program_manager_with_network_resolution(
                None,
                None,
                network_config.clone(),
            );

        assert!(network_program_manager.is_err());

        let file_program_manager =
            ProgramManager::<Testnet3, FileSystemResolver<Testnet3>>::program_manager_with_local_resource_resolution(
                Some(private_key.clone()),
                Some(private_key_ciphertext.clone()),
                &address,
                temp_dir.clone(),
                Some(network_config.clone()),
            );

        assert!(file_program_manager.is_err());

        let hybrid_program_manager =
            ProgramManager::<Testnet3, HybridResolver<Testnet3>>::program_manager_with_hybrid_resolution(
                Some(private_key.clone()),
                Some(private_key_ciphertext.clone()),
                temp_dir.clone(),
                network_config.clone(),
            );

        assert!(hybrid_program_manager.is_err());

        let network_program_manager =
            ProgramManager::<Testnet3, AleoNetworkResolver<Testnet3>>::program_manager_with_network_resolution(
                Some(private_key.clone()),
                Some(private_key_ciphertext.clone()),
                network_config.clone(),
            );

        assert!(network_program_manager.is_err());
    }
}
