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

use crate::{
    log,
    types::native::{CurrentNetwork, FieldNative, StatePathNative},
};

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
    log(&format!("Sending request to: {base_url}/{}/statePaths?commitments={query_string}", get_network()));
    get(&format!("{base_url}/{}/statePaths?commitments={query_string}", get_network())).await
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

#[cfg(test)]
mod tests {
    use super::*;

    use crate::test::PROVABLE_API;

    use std::str::FromStr;
    use wasm_bindgen_test::*;

    #[wasm_bindgen_test]
    async fn test_get_stateroot() {
        let state_root = latest_stateroot(PROVABLE_API).await.unwrap();
        console_log!("{:?}", state_root);
    }

    #[wasm_bindgen_test]
    async fn test_get_block_height() {
        let block_height = latest_block_height(PROVABLE_API).await.unwrap();
        assert!(block_height > 10_000_000);
    }

    #[wasm_bindgen_test]
    async fn test_get_statepaths() {
        if get_network() == "testnet" {
            let commitments = vec![
                FieldNative::from_str(
                    "3955342727272311631397274863769364826445372300002295001500327687918144964187field",
                )
                .unwrap(),
                FieldNative::from_str(
                    "360335536692650403149180907504772813391262210443170533323444515646946440826field",
                )
                .unwrap(),
            ];
            let state_paths = get_statepaths_for_commitments("https://api.explorer.provable.com/v1", &commitments).await.unwrap();
            assert_eq!(state_paths.len(), 2);
            assert_eq!(state_paths[0].global_state_root(), state_paths[1].global_state_root());
        }
    }
}
