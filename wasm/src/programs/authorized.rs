// Copyright (C) 2019-2023 Aleo Systems Inc.
// This file is part of the Aleo SDK library.

// The Aleo SDK library is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// The Aleo SDK library is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with the Aleo SDK library. If not, see <https://www.gnu.org/licenses/>.

/// The API URL for the network.
pub const API_URL: &str = "https://api.explorer.aleo.org/v1/testnet3/explorer";

use crate::types::{AuthorizationNative, TransactionNative};
use snarkvm_wasm::utilities::serialize::DeserializeExt;

use serde::{de, ser::SerializeStruct, Deserialize, Deserializer, Serialize, Serializer};

pub(crate) struct Authorized {
    /// The authorization for the main function execution.
    function: AuthorizationNative,
    /// The authorization for the fee execution.
    fee: Option<AuthorizationNative>,
    /// Whether to broadcast the transaction.
    broadcast: bool,
}

impl Authorized {
    /// Initializes a new authorization.
    pub const fn new(function: AuthorizationNative, fee: Option<AuthorizationNative>, broadcast: bool) -> Self {
        Self { function, fee, broadcast }
    }

    /// Executes the authorization, returning the resulting transaction.
    pub async fn execute(authorization: &Self) -> Result<TransactionNative, String> {
        // Execute the authorization.
        let response = reqwest::Client::new()
            .post(format!("{API_URL}/execute"))
            .header("Content-Type", "application/json")
            .body(serde_json::to_string(authorization).map_err(|e| e.to_string())?)
            .send()
            .await
            .map_err(|e| e.to_string())?;

        // Ensure the response is successful.
        match response.status().is_success() {
            // Return the transaction.
            true => Ok(response.json().await.map_err(|e| e.to_string())?),
            // Return the error.
            false => Err(response.text().await.map_err(|e| e.to_string())?),
        }
    }
}

impl Serialize for Authorized {
    /// Serializes the authorization into string or bytes.
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        let mut authorization = serializer.serialize_struct("Authorized", 3)?;
        authorization.serialize_field("function", &self.function)?;
        if let Some(fee) = &self.fee {
            authorization.serialize_field("fee", fee)?;
        }
        authorization.serialize_field("broadcast", &self.broadcast)?;
        authorization.end()
    }
}

impl<'de> Deserialize<'de> for Authorized {
    /// Deserializes the authorization from a string or bytes.
    fn deserialize<D: Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        // Parse the authorization from a string into a value.
        let mut authorization = serde_json::Value::deserialize(deserializer)?;
        // Retrieve the function authorization.
        let function: AuthorizationNative = DeserializeExt::take_from_value::<D>(&mut authorization, "function")?;
        // Retrieve the fee authorization, if it exists.
        let fee = serde_json::from_value(authorization.get_mut("fee").unwrap_or(&mut serde_json::Value::Null).take())
            .map_err(de::Error::custom)?;
        // Retrieve the broadcast flag.
        let broadcast = DeserializeExt::take_from_value::<D>(&mut authorization, "broadcast")?;
        // Recover the authorization.
        Ok(Self { function, fee, broadcast })
    }
}
