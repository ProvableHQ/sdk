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

use crate::snarkos::errors::RpcRequestError;

use serde::{de::DeserializeOwned, Deserialize, Serialize};
use uuid::Uuid;

// TODO (raychu86): Organize objects in separate files.

pub trait RpcRequest {
    type Output: DeserializeOwned;

    fn id(&self) -> Uuid;
    fn body(&self) -> &RequestBody;
    fn auth_required(&self) -> bool;

    /// Parse a response into the specified [Self::Output] type.
    fn parse_response(&self, body: ResponseBody) -> Result<Self::Output, RpcRequestError> {
        match body.result {
            ResponseResult::Ok(value) => serde_json::from_value(value).map_err(RpcRequestError::DeserializationError),
            ResponseResult::Err(error) => Err(RpcRequestError::JsonRPC(error.message)),
        }
    }
}

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct RequestBody {
    #[serde(rename = "jsonrpc")]
    pub jsonrpc_version: String,
    pub id: Uuid,
    pub method: String,
    pub params: Vec<serde_json::Value>,
}

impl RequestBody {
    /// Returns a new request body.
    /// If an id is not provided, a unique id will be generated for the request.
    pub fn new(id: Option<Uuid>, method: String, params: Vec<serde_json::Value>) -> Self {
        Self {
            jsonrpc_version: "2.0".to_string(),
            id: id.unwrap_or_else(Uuid::new_v4),
            method,
            params,
        }
    }
}

#[derive(Deserialize, Debug, Clone)]
pub struct ResponseBody {
    #[serde(rename = "jsonrpc")]
    pub jsonrpc_version: String,
    pub id: Option<Uuid>,
    #[serde(flatten)]
    pub result: ResponseResult,
}

#[derive(Deserialize, Debug, Clone)]
pub enum ResponseResult {
    #[serde(rename = "result")]
    Ok(serde_json::Value),
    #[serde(rename = "error")]
    Err(JsonRpcError),
}

impl std::fmt::Display for ResponseResult {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let string = match self {
            ResponseResult::Ok(value) => {
                serde_json::to_string(value).unwrap_or_else(|_| "Invalid JSON Value".to_string())
            }
            ResponseResult::Err(error) => error.to_string(),
        };

        write!(f, "{}", string)
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct JsonRpcError {
    pub code: i32,
    pub message: String,
    pub data: Option<serde_json::Value>,
    pub request: Option<RequestBody>,
}

impl std::fmt::Display for JsonRpcError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let code = match self.code {
            -32099..=-32000 => format!("Server error ({})", self.code),
            -32600 => "Invalid request. The JSON sent is not a valid Request object.".to_string(),
            -32601 => "Method not found. The method does not exist / is not available.".to_string(),
            -32602 => "Invalid method parameter(s)".to_string(),
            -32603 => "Internal JSON-RPC error".to_string(),
            -32700 => "Parse error. Invalid JSON was received by the server.\
            An error occurred on the server while parsing the JSON text."
                .to_string(),
            error_code => format!("Unknown error code ({})", error_code),
        };
        match &self.request {
            Some(request) => write!(
                f,
                "{}: {}. Request: {:?}",
                code,
                self.message,
                serde_json::to_string(&request)
            ),
            None => write!(f, "{}: {}", code, self.message),
        }
    }
}

/// Returned value for the `getblock` rpc call
#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
pub struct BlockInfo {
    /// Block Hash
    pub hash: String,
    /// Block Height
    pub height: Option<u32>,
    /// Number of confirmations
    pub confirmations: u32,
    /// Block Size
    pub size: usize,
    /// Previous block hash
    pub previous_block_hash: String,
    /// Merkle root representing the transactions in the block
    pub merkle_root: String,
    /// Merkle root of the transactions in the block using a Pedersen hash
    pub pedersen_merkle_root_hash: String,
    /// Proof of Succinct Work
    pub proof: String,
    /// Block time
    pub time: i64,
    /// Block difficulty target
    pub difficulty_target: u64,
    /// Nonce
    pub nonce: u32,
    /// List of transaction ids
    pub transactions: Vec<String>,
}

/// Returned value for the `gettransaction` rpc call
#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
pub struct TransactionInfo {
    /// Transaction id
    pub txid: String,
    /// Transaction size
    pub size: usize,
    /// Transaction inputs
    pub old_serial_numbers: Vec<String>,
    /// Transaction outputs
    pub new_commitments: Vec<String>,
    /// Transaction Memo
    pub memo: String,
    /// Network id of the transaction
    pub network_id: u8,
    /// Merkle tree digest
    pub digest: String,
    /// Transaction (outer snark) proof
    pub transaction_proof: String,
    /// Program verification key commitment
    pub program_commitment: String,
    /// Local data root
    pub local_data_root: String,
    /// Transaction value balance
    pub value_balance: i64,
    /// Transaction signatures (Delegated DPC)
    pub signatures: Vec<String>,
    /// Encrypted records
    pub encrypted_records: Vec<String>,
    /// Block the transaction lives in
    pub transaction_metadata: TransactionMetadata,
}

/// Additional metadata included with a transaction response
#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
pub struct TransactionMetadata {
    /// The block number associated with this transaction
    pub block_number: Option<u32>,
}
