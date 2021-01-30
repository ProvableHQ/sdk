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

pub mod get_block;
pub mod get_block_count;
pub mod get_block_hash;
pub mod get_transaction_info;

pub enum SnarkOSRpcMethod {
    /// The `getblock` method returns information about a block from a block hash.
    /// https://developer.aleo.org/autogen/testnet/public_endpoints/getblock
    GetBlock,

    /// The `getblockcount` method returns the number of blocks in the best valid chain.
    /// https://developer.aleo.org/autogen/testnet/public_endpoints/getblockcount
    GetBlockCount,

    /// The `getblockhash` method returns the block hash of a block at the given block height in the best valid chain.
    /// https://developer.aleo.org/autogen/testnet/public_endpoints/getblockhash
    GetBlockHash,

    /// The `gettransactioninfo` returns information about a transaction from a transaction id.
    /// https://developer.aleo.org/autogen/testnet/public_endpoints/gettransactioninfo
    GetTransactionInfo,
    // TODO (raychu86): Implement the remaining RPC methods.
}

impl std::fmt::Display for SnarkOSRpcMethod {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::GetBlock => write!(f, "getblock"),
            Self::GetBlockCount => write!(f, "getblockcount"),
            Self::GetBlockHash => write!(f, "getblockhash"),
            Self::GetTransactionInfo => write!(f, "gettransactioninfo"),
        }
    }
}
