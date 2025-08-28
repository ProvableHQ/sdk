// Copyright (C) 2019-2025 Provable Inc.
// This file is part of the Provable SDK library.

// The Provable SDK library is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// The Provable SDK library is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with the Provable SDK library. If not, see <https://www.gnu.org/licenses/>.

use crate::types::native::{CurrentNetwork, FieldNative, StatePathNative};

use anyhow::Result;
use snarkvm_console::network::Network;

/// Get the current network name.
pub fn get_network() -> &'static str {
    match CurrentNetwork::ID {
        snarkvm_console::network::MainnetV0::ID => "mainnet",
        snarkvm_console::network::TestnetV0::ID => "testnet",
        snarkvm_console::network::CanaryV0::ID => "canary",
        _ => panic!("Invalid network"),
    }
}

/// Get statepaths from stateroot.
pub async fn get_statepaths_for_commitments(
    base_url: &str,
    commitments: &[FieldNative],
) -> Result<Vec<StatePathNative>> {
    let query_string = commitments.iter().map(|x| x.to_string()).collect::<Vec<String>>().join(",");
    get(&format!("{base_url}/{}/statePaths?={query_string}", get_network())).await
}

/// Get the latest block height.
pub async fn latest_block_height(base_url: &str) -> Result<u32> {
    get(&format!("{base_url}/{}/block/height/latest", get_network())).await
}

/// Get the latest block height.
pub async fn latest_stateroot(base_url: &str) -> Result<<CurrentNetwork as Network>::StateRoot> {
    get(&format!("{base_url}/{}/stateRoot/latest", get_network())).await
}

/// Make a GET request to the service.
pub async fn get<T>(url: &str) -> Result<T>
where
    T: serde::de::DeserializeOwned,
{
    let client = reqwest::Client::new();
    let res = client.get(url).send().await?.json().await?;
    Ok(res)
}
