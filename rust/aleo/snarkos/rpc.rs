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
    objects::{RequestBody, ResponseBody, RpcRequest},
};

#[derive(Debug, Clone)]
pub struct RpcEndpoint {
    pub client: reqwest::Client,
    /// The URI of the RPC endpoint.
    pub uri: String,
}

impl RpcEndpoint {
    /// Send an RPC request with the given request body and authorization header.
    /// Returns the response body for the request.
    pub async fn request(&self, request: &RequestBody, auth: &RpcAuth) -> Result<ResponseBody, RpcRequestError> {
        let mut req = self.client.post(&self.uri).json(request);

        // Add the authorization header to the request.
        if let RpcAuth::Basic { username, password } = auth {
            req = req.basic_auth(username, Some(password));
        }

        // Send the request to the RPC endpoint.
        match req.send().await {
            Ok(response) => Ok(response.json::<ResponseBody>().await.unwrap()),
            Err(error) => Err(RpcRequestError::from(error)),
        }
    }
}

#[derive(Debug, Clone)]
pub enum RpcAuth {
    Basic {
        // TODO (raychu86): Protect these values with `secrecy`.
        username: String,
        password: String,
    },
    None,
}

#[derive(Debug)]
pub struct RpcClient {
    endpoint: RpcEndpoint,
    auth: RpcAuth,
}

impl RpcClient {
    /// Create a new RPC client connection.
    pub fn new(uri: String, auth: RpcAuth) -> Self {
        Self {
            endpoint: RpcEndpoint {
                client: reqwest::Client::new(),
                uri,
            },
            auth,
        }
    }

    /// Make a request to the RPC endpoint.
    pub async fn request<R: RpcRequest>(&self, request: &R) -> Result<R::Output, RpcRequestError> {
        let request_body = request.body();

        // Send the rpc request to the endpoint.
        let response_body: ResponseBody = self.endpoint.request(&request_body, &self.auth).await?;

        // Check if the request and response ids are the same.
        if let Some(response_id) = response_body.id {
            if request_body.id != response_id {
                return Err(RpcRequestError::RequestIdMismatch(request_body.id.clone(), response_id));
            }
        }

        request.parse_response(response_body)
    }
}
