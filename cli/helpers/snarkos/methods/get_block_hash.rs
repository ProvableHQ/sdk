// Copyright (C) 2019-2021 Aleo Systems Inc.
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

use crate::helpers::snarkos::{
    errors::RpcRequestError,
    methods::SnarkOSRpcMethod,
    objects::{RequestBody, RpcRequest},
    rpc::RpcClient,
};

use serde_json::{Number, Value};
use uuid::Uuid;

pub struct GetBlockHashRequest {
    body: RequestBody,
}

impl GetBlockHashRequest {
    pub fn new(id: Option<Uuid>, block_height: u32) -> Self {
        let body = RequestBody::new(id, SnarkOSRpcMethod::GetBlockHash.to_string(), vec![Value::Number(
            Number::from(block_height),
        )]);

        GetBlockHashRequest { body }
    }
}

impl RpcRequest for GetBlockHashRequest {
    type Output = String;

    fn id(&self) -> Uuid {
        self.body.id
    }

    fn body(&self) -> &RequestBody {
        &self.body
    }

    fn auth_required(&self) -> bool {
        false
    }
}

pub async fn get_block_hash(connection: &RpcClient, block_height: u32) -> Result<String, RpcRequestError> {
    connection.request(&GetBlockHashRequest::new(None, block_height)).await
}

#[cfg(test)]
mod tests {
    pub use super::*;
    use crate::helpers::snarkos::rpc::RpcAuth;

    use tokio::runtime::Runtime;
    use wiremock::{
        matchers::{method, path},
        Mock,
        MockServer,
        ResponseTemplate,
    };

    #[test]
    fn test_get_block_hash() {
        // Create the runtime
        let rt = Runtime::new().unwrap();

        rt.block_on(async {
            // Setup mock server
            let mock_server = MockServer::start().await;

            // Create mock request
            let response_body: serde_json::Value = serde_json::from_str(
                r#"{
                "jsonrpc": "2.0",
                "result": "d1cd52113e16e83cc19468533f4a721debf9dbd2e029774efda09c25947af319",
                "id": "655c462d-717b-4f08-8b07-23fcb2d3ed8a"
            }"#,
            )
            .unwrap();

            Mock::given(method("POST"))
                .and(path("/".to_string()))
                .respond_with(ResponseTemplate::new(200).set_body_json(response_body))
                .mount(&mock_server)
                .await;

            // Set up connection to mock server
            let snarkos_connection = RpcClient::new(mock_server.uri(), RpcAuth::None);

            // Make a request to the mock server
            let block_hash = snarkos_connection
                .request(&GetBlockHashRequest::new(
                    Some(Uuid::parse_str("655c462d-717b-4f08-8b07-23fcb2d3ed8a").unwrap()),
                    0,
                ))
                .await
                .unwrap();

            assert_eq!(
                "d1cd52113e16e83cc19468533f4a721debf9dbd2e029774efda09c25947af319",
                &block_hash
            );
        });
    }
}
