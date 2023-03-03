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

#[cfg(not(feature = "async"))]
pub mod blocking;
#[cfg(not(feature = "async"))]
pub use blocking::*;

#[cfg(feature = "async")]
pub mod asynchronous;

pub mod config;
pub use config::*;

#[cfg(feature = "async")]
pub use asynchronous::*;

use snarkvm_console::{network::Testnet3, program::Network};

use std::marker::PhantomData;

/// Aleo API client for interacting with the Aleo Beacon API
#[derive(Clone, Debug)]
pub struct AleoAPIClient<N: Network> {
    #[cfg(feature = "async")]
    client: reqwest::Client,
    #[cfg(not(feature = "async"))]
    client: ureq::Agent,
    base_url: String,
    network_id: String,
    _network: PhantomData<N>,
}

impl<N: Network> AleoAPIClient<N> {
    pub fn new(base_url: &str, chain: &str) -> Self {
        #[cfg(feature = "async")]
        let client = reqwest::Client::new();
        #[cfg(not(feature = "async"))]
        let client = ureq::Agent::new();
        AleoAPIClient { client, base_url: base_url.to_string(), network_id: chain.to_string(), _network: PhantomData }
    }

    /// Get base URL
    pub fn base_url(&self) -> &str {
        &self.base_url
    }

    /// Get network ID being interacted with
    pub fn network_id(&self) -> &str {
        &self.network_id
    }

    /// Get a network config object representing the API client's configuration
    pub fn network_config(&self) -> NetworkConfig {
        NetworkConfig::new(self.base_url.to_string(), self.network_id.to_string())
    }
}

impl Default for AleoAPIClient<Testnet3> {
    fn default() -> Self {
        AleoAPIClient::new("https://vm.aleo.org/api/", "testnet3")
    }
}

impl<N: Network> From<&NetworkConfig> for AleoAPIClient<N> {
    fn from(config: &NetworkConfig) -> Self {
        AleoAPIClient::new(config.node_uri(), config.network_id())
    }
}

impl<N: Network> From<NetworkConfig> for AleoAPIClient<N> {
    fn from(config: NetworkConfig) -> Self {
        AleoAPIClient::new(config.node_uri(), config.network_id())
    }
}

pub fn testnet3(base_url: &str) -> AleoAPIClient<Testnet3> {
    AleoAPIClient::new(base_url, "testnet3")
}
