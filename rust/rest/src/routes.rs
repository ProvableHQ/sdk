// Copyright (C) 2019-2023 Aleo Systems Inc.
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

use super::*;

/// The `get_blocks` query object.
#[derive(Deserialize, Serialize)]
struct BlockRange {
    /// The starting block height (inclusive).
    start: u32,
    /// The ending block height (exclusive).
    end: u32,
}

impl<N: Network> Rest<N> {
    /// Initializes the routes, given the ledger and ledger sender.
    pub fn routes(&self) -> impl Filter<Extract = (impl Reply,), Error = Rejection> + Clone {
        // GET /deploy
        let deploy = warp::get()
            .and(warp::path!("testnet3" / "deploy"))
            .and(with(self.ledger.clone()))
            .and_then(Self::latest_height);

        // GET /testnet3/latest/hash
        let latest_hash = warp::get()
            .and(warp::path!("testnet3" / "latest" / "hash"))
            .and(with(self.ledger.clone()))
            .and_then(Self::latest_hash);

        // GET /testnet3/latest/block
        let latest_block = warp::get()
            .and(warp::path!("testnet3" / "latest" / "block"))
            .and(with(self.ledger.clone()))
            .and_then(Self::latest_block);

        // GET /testnet3/latest/stateRoot
        let latest_state_root = warp::get()
            .and(warp::path!("testnet3" / "latest" / "stateRoot"))
            .and(with(self.ledger.clone()))
            .and_then(Self::latest_state_root);

        // GET /testnet3/block/{height}
        let get_block = warp::get()
            .and(warp::path!("testnet3" / "block" / u32))
            .and(with(self.ledger.clone()))
            .and_then(Self::get_block);

        // GET /testnet3/blocks?start={start_height}&end={end_height}
        let get_blocks = warp::get()
            .and(warp::path!("testnet3" / "blocks"))
            .and(warp::query::<BlockRange>())
            .and(with(self.ledger.clone()))
            .and_then(Self::get_blocks);

        // GET /testnet3/block/{blockHash}
        let get_block_by_hash = warp::get()
            .and(warp::path!("testnet3" / "block" / ..))
            .and(warp::path::param::<N::BlockHash>())
            .and(with(self.ledger.clone()))
            .and_then(Self::get_block_by_hash);

        // GET /testnet3/height/{blockHash}
        let get_block_height_by_hash = warp::get()
            .and(warp::path!("testnet3" / "height" / ..))
            .and(warp::path::param::<N::BlockHash>())
            .and(with(self.ledger.clone()))
            .and_then(Self::get_block_height_by_hash);

        // GET /testnet3/block/{height}/transactions
        let get_block_transactions = warp::get()
            .and(warp::path!("testnet3" / "block" / u32 / "transactions"))
            .and(with(self.ledger.clone()))
            .and_then(Self::get_block_transactions);

        // GET /testnet3/transaction/{transactionID}
        let get_transaction = warp::get()
            .and(warp::path!("testnet3" / "transaction" / ..))
            .and(warp::path::param::<N::TransactionID>())
            .and(warp::path::end())
            .and(with(self.ledger.clone()))
            .and_then(Self::get_transaction);

        // GET /testnet3/memoryPool/transactions
        let get_memory_pool_transactions = warp::get()
            .and(warp::path!("testnet3" / "memoryPool" / "transactions"))
            .and(with(self.consensus.clone()))
            .and_then(Self::get_memory_pool_transactions);

        // GET /testnet3/program/{programID}
        let get_program = warp::get()
            .and(warp::path!("testnet3" / "program" / ..))
            .and(warp::path::param::<ProgramID<N>>())
            .and(warp::path::end())
            .and(with(self.ledger.clone()))
            .and_then(Self::get_program);

        // GET /testnet3/statePath/{commitment}
        let get_state_path_for_commitment = warp::get()
            .and(warp::path!("testnet3" / "statePath" / ..))
            .and(warp::path::param::<Field<N>>())
            .and(warp::path::end())
            .and(with(self.ledger.clone()))
            .and_then(Self::get_state_path_for_commitment);

        // GET /testnet3/beacons
        let get_beacons = warp::get()
            .and(warp::path!("testnet3" / "beacons"))
            .and(with(self.consensus.clone()))
            .and_then(Self::get_beacons);

        // GET /testnet3/peers/count
        let get_peers_count = warp::get()
            .and(warp::path!("testnet3" / "peers" / "count"))
            .and(with(self.routing.router().clone()))
            .and_then(Self::get_peers_count);

        // GET /testnet3/peers/all
        let get_peers_all = warp::get()
            .and(warp::path!("testnet3" / "peers" / "all"))
            .and(with(self.routing.router().clone()))
            .and_then(Self::get_peers_all);

        // GET /testnet3/peers/all/metrics
        let get_peers_all_metrics = warp::get()
            .and(warp::path!("testnet3" / "peers" / "all" / "metrics"))
            .and(with(self.routing.router().clone()))
            .and_then(Self::get_peers_all_metrics);

        // GET /testnet3/node/address
        let get_node_address = warp::get()
            .and(warp::path!("testnet3" / "node" / "address"))
            .and(with(self.routing.router().address()))
            .and_then(|address: Address<N>| async move { Ok::<_, Rejection>(reply::json(&address.to_string())) });

        // GET /testnet3/find/blockHash/{transactionID}
        let find_block_hash = warp::get()
            .and(warp::path!("testnet3" / "find" / "blockHash" / ..))
            .and(warp::path::param::<N::TransactionID>())
            .and(warp::path::end())
            .and(with(self.ledger.clone()))
            .and_then(Self::find_block_hash);

        // GET /testnet3/find/transactionID/deployment/{programID}
        let find_transaction_id_from_program_id = warp::get()
            .and(warp::path!("testnet3" / "find" / "transactionID" / "deployment" / ..))
            .and(warp::path::param::<ProgramID<N>>())
            .and(warp::path::end())
            .and(with(self.ledger.clone()))
            .and_then(Self::find_transaction_id_from_program_id);

        // GET /testnet3/find/transactionID/{transitionID}
        let find_transaction_id_from_transition_id = warp::get()
            .and(warp::path!("testnet3" / "find" / "transactionID" / ..))
            .and(warp::path::param::<N::TransitionID>())
            .and(warp::path::end())
            .and(with(self.ledger.clone()))
            .and_then(Self::find_transaction_id_from_transition_id);

        // GET /testnet3/find/transitionID/{inputOrOutputID}
        let find_transition_id = warp::get()
            .and(warp::path!("testnet3" / "find" / "transitionID" / ..))
            .and(warp::path::param::<Field<N>>())
            .and(warp::path::end())
            .and(with(self.ledger.clone()))
            .and_then(Self::find_transition_id);

        // POST /testnet3/transaction/broadcast
        let transaction_broadcast = warp::post()
            .and(warp::path!("testnet3" / "transaction" / "broadcast"))
            .and(warp::body::content_length_limit(16 * 1024 * 1024))
            .and(warp::body::json())
            .and(with(self.consensus.clone()))
            .and(with(self.routing.clone()))
            .and_then(Self::transaction_broadcast);

        // Return the list of routes.
        latest_height
            .or(latest_hash)
            .or(latest_block)
            .or(latest_state_root)
            .or(get_block)
            .or(get_blocks)
            .or(get_block_by_hash)
            .or(get_block_height_by_hash)
            .or(get_block_transactions)
            .or(get_transaction)
            .or(get_memory_pool_transactions)
            .or(get_program)
            .or(get_state_path_for_commitment)
            .or(get_beacons)
            .or(get_peers_count)
            .or(get_peers_all)
            .or(get_peers_all_metrics)
            .or(get_node_address)
            .or(find_block_hash)
            .or(find_transaction_id_from_program_id)
            .or(find_transaction_id_from_transition_id)
            .or(find_transition_id)
            .or(transaction_broadcast)
    }
}

impl<N: Network> Rest<N> {
    async fn deploy_program(
        program: Program<N>,
        private_key: Option<PrivateKey<N>>,
        password: Option<Ciphertext<N>>,
    ) -> Result<impl Reply, Rejection> {
        let transaction = Transaction::new(program, consensus.network_id());
        let transaction_id = transaction.id();
        let transaction = Arc::new(transaction);

        // Broadcast the transaction.
        routing.broadcast_transaction(transaction.clone()).await;

        // Return the transaction ID.
        Ok(reply::json(&transaction_id))
    }

    /// Returns the latest block height.
    async fn latest_height(ledger: Ledger<N, C>) -> Result<impl Reply, Rejection> {
        Ok(reply::json(&ledger.latest_height()))
    }

    /// Returns the latest block hash.
    async fn latest_hash(ledger: Ledger<N, C>) -> Result<impl Reply, Rejection> {
        Ok(reply::json(&ledger.latest_hash()))
    }

    /// Returns the latest block.
    async fn latest_block(ledger: Ledger<N, C>) -> Result<impl Reply, Rejection> {
        Ok(reply::json(&ledger.latest_block()))
    }

    /// Returns the latest state root.
    async fn latest_state_root(ledger: Ledger<N, C>) -> Result<impl Reply, Rejection> {
        Ok(reply::json(&ledger.latest_state_root()))
    }

    /// Returns the block for the given block height.
    async fn get_block(height: u32, ledger: Ledger<N, C>) -> Result<impl Reply, Rejection> {
        Ok(reply::json(&ledger.get_block(height).or_reject()?))
    }
}
