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

use aleo_network::Network;

use snarkvm_dpc::{DPCScheme, StateTransition, Transaction, DPC};
use snarkvm_ledger::{
    ledger::{Ledger, MemDb},
    Block,
    BlockHeader,
    BlockHeaderHash,
    LedgerScheme,
    MerkleRootHash,
    PedersenMerkleRootHash,
    ProofOfSuccinctWork,
    Transactions,
};

use rand::{CryptoRng, Rng};
use std::sync::Arc;

fn create_empty_ledger<N: Network>() -> Ledger<<N as Network>::Parameters, MemDb> {
    // Create a genesis block.
    let genesis_block = Block {
        header: BlockHeader {
            previous_block_hash: BlockHeaderHash([0u8; 32]),
            merkle_root_hash: MerkleRootHash([0u8; 32]),
            pedersen_merkle_root_hash: PedersenMerkleRootHash([0u8; 32]),
            proof: ProofOfSuccinctWork::default(),
            time: 0,
            difficulty_target: 0xFFFF_FFFF_FFFF_FFFF_u64,
            nonce: 0,
        },
        transactions: Transactions::new(),
    };

    Ledger::<N::Parameters, MemDb>::new(None, genesis_block).unwrap()
}

pub fn new_dummy_transaction<N: Network, R: Rng + CryptoRng>(rng: &mut R) -> Transaction<N::Parameters> {
    // Load dpc and noop program.
    let dpc = DPC::<N::Parameters>::load(false).unwrap();
    let noop = Arc::new(dpc.noop_program.clone());

    // Create new noop state transition.
    let state = StateTransition::new_noop(noop, rng).unwrap();

    // Authorize state transition.
    let authorization = dpc.authorize(&vec![], &state, rng).unwrap();

    // Delegate online phase of transaction.
    let ledger = create_empty_ledger::<N>();

    dpc.execute(&vec![], authorization, state.executables(), &ledger, rng)
        .unwrap()
}
