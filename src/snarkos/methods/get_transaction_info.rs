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
    objects::{RequestBody, RpcRequest, TransactionInfo},
    rpc::RpcClient,
};

use uuid::Uuid;

pub struct GetTransactionInfoRequest {
    body: RequestBody,
}

impl GetTransactionInfoRequest {
    pub fn new(id: Option<Uuid>, transaction_id: String) -> Self {
        let body = RequestBody::new(id, SnarkOSRpcMethod::GetTransactionInfo.to_string(), vec![
            serde_json::Value::String(transaction_id),
        ]);

        GetTransactionInfoRequest { body }
    }
}

impl RpcRequest for GetTransactionInfoRequest {
    type Output = TransactionInfo;

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

pub async fn get_block_hash(
    connection: &RpcClient,
    transaction_id: String,
) -> Result<TransactionInfo, RpcRequestError> {
    connection
        .request(&GetTransactionInfoRequest::new(None, transaction_id))
        .await
}
