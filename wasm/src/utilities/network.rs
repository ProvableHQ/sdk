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

use crate::types::native::CurrentNetwork;

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

/// Get the latest block height.
pub async fn latest_block_height(base_url: &str) -> Result<u32, String> {
    let url = format!("{base_url}/{}/block/height/latest", get_network());
    let res = get(&url).await?;
    Ok(res)
}

/// Make a GET request to the service.
pub async fn get<T>(url: &str) -> Result<T, String>
where
    T: serde::de::DeserializeOwned,
{
    let client = reqwest::Client::new();
    let res = client.get(url).send().await.map_err(|e| e.to_string())?.json().await.map_err(|e| e.to_string())?;
    Ok(res)
}
