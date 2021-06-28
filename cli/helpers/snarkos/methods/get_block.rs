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
    objects::{BlockInfo, RequestBody, RpcRequest},
    rpc::RpcClient,
};

use uuid::Uuid;

pub struct GetBlockRequest {
    body: RequestBody,
}

impl GetBlockRequest {
    pub fn new(id: Option<Uuid>, block_hash: String) -> Self {
        let body = RequestBody::new(id, SnarkOSRpcMethod::GetBlock.to_string(), vec![
            serde_json::Value::String(block_hash),
        ]);

        GetBlockRequest { body }
    }
}

impl RpcRequest for GetBlockRequest {
    type Output = BlockInfo;

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

pub async fn get_block(connection: &RpcClient, block_hash: String) -> Result<BlockInfo, RpcRequestError> {
    connection.request(&GetBlockRequest::new(None, block_hash)).await
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
    fn test_get_block() {
        // Create the runtime
        let rt = Runtime::new().unwrap();

        rt.block_on(async {
            // Setup mock server
            let mock_server = MockServer::start().await;

            // Create mock request
            let response_body: serde_json::Value = serde_json::from_str(r#"{
                "jsonrpc": "2.0",
                "result": {
                    "confirmations": 150000,
                    "difficulty_target": 576460752303423487,
                    "hash": "d1cd52113e16e83cc19468533f4a721debf9dbd2e029774efda09c25947af319",
                    "height": 0,
                    "merkle_root": "0000000000000000000000000000000000000000000000000000000000000000",
                    "nonce": 0,
                    "pedersen_merkle_root_hash": "0000000000000000000000000000000000000000000000000000000000000000",
                    "previous_block_hash": "0000000000000000000000000000000000000000000000000000000000000000",
                    "proof": "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
                    "size": 2627,
                    "time": 1597518825,
                    "transactions": [
                        "cb9f08d50a8876ac6523928932b4a4341a2f315ea768df37b54495fbc38b1d1e"
                    ]
                },
                "id": "655c462d-717b-4f08-8b07-23fcb2d3ed8a"
            }"#).unwrap();


            Mock::given(method("POST"))
                .and(path("/".to_string()))
                .respond_with(ResponseTemplate::new(200).set_body_json(response_body))
                .mount(&mock_server)
                .await;

            // Set up connection to mock server
            let snarkos_connection = RpcClient::new(mock_server.uri(), RpcAuth::None);

            // Make a request to the mock server
            let block_info = snarkos_connection
                .request(&GetBlockRequest::new(Some(
                    Uuid::parse_str("655c462d-717b-4f08-8b07-23fcb2d3ed8a").unwrap(),
                ), "d1cd52113e16e83cc19468533f4a721debf9dbd2e029774efda09c25947af319".to_string()))
                .await
                .unwrap();

            assert_eq!("d1cd52113e16e83cc19468533f4a721debf9dbd2e029774efda09c25947af319", &block_info.hash);
            assert_eq!(Some(0), block_info.height);
            assert_eq!(1597518825, block_info.time);
            assert_eq!(["cb9f08d50a8876ac6523928932b4a4341a2f315ea768df37b54495fbc38b1d1e"].to_vec(), block_info.transactions);
        });
    }
}
