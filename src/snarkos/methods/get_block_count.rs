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

use crate::snarkos::{
    errors::RpcRequestError,
    methods::SnarkOSRpcMethod,
    objects::{RequestBody, RpcRequest},
    rpc::RpcClient,
};

use uuid::Uuid;

pub struct GetBlockCountRequest {
    body: RequestBody,
}

impl GetBlockCountRequest {
    pub fn new(id: Option<Uuid>) -> Self {
        let body = RequestBody::new(id, SnarkOSRpcMethod::GetBlockCount.to_string(), Vec::new());

        GetBlockCountRequest { body }
    }
}

impl RpcRequest for GetBlockCountRequest {
    type Output = u32;

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

pub async fn get_block_count(connection: &RpcClient) -> Result<u32, RpcRequestError> {
    connection.request(&GetBlockCountRequest::new(None)).await
}

#[cfg(test)]
mod tests {
    pub use super::*;
    use crate::snarkos::rpc::RpcAuth;

    use tokio::runtime::Runtime;

    // Example test.

    #[test]
    fn test_get_block_count() {
        let conn = RpcClient::new("http://0.0.0.0:3030".to_string(), RpcAuth::None);

        // Create the runtime
        let rt = Runtime::new().unwrap();

        rt.block_on(async {
            let blockcount = conn
                .request(&GetBlockCountRequest::new(Some(
                    Uuid::parse_str("936898af-68ba-4bc4-89f6-017b5c193094").unwrap(),
                )))
                .await
                .unwrap();

            assert_eq!(100, blockcount);
        });
    }
}
