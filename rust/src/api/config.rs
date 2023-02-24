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

use std::ops::Add;

/// Network config for connecting to the Aleo network
#[derive(Clone, Debug)]
pub struct NetworkConfig {
    network_id: String,
    node_uri: String,
}

impl NetworkConfig {
    pub fn new(network_id: String, node_uri: String) -> Self {
        Self { network_id, node_uri }
    }

    /// Create a new testnet network config
    pub fn testnet3() -> Self {
        Self { network_id: "testnet3".to_string(), node_uri: "https://vm.aleo.org/api".to_string() }
    }

    /// Create a new local testnet3 network config with a specified port
    pub fn local_testnet3(port: &str) -> Self {
        Self { network_id: "testnet3".to_string(), node_uri: "http://localhost:".to_string().add(port).add("/api") }
    }

    /// Get network ID
    pub fn network_id(&self) -> &str {
        &self.network_id
    }

    /// Get network uri
    pub fn node_uri(&self) -> &str {
        &self.node_uri
    }
}
