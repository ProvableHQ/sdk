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
use crate::{verify_transaction_proof, verify_transaction_signature, Transaction};
use aleo_environment::{Environment, Testnet1};

use snarkos_storage::Ledger;
use snarkvm_dpc::testnet1::{BaseDPCComponents, PublicParameters, Transaction as DPCTransaction};

use rand::SeedableRng;
use rand_chacha::ChaChaRng;

type L = Ledger<
    DPCTransaction<<Testnet1 as Environment>::Components>,
    <<Testnet1 as Environment>::Components as BaseDPCComponents>::MerkleParameters,
    <Testnet1 as Environment>::Storage,
>;

#[test]
fn test_build_dummy_transaction() {
    let mut rng = ChaChaRng::seed_from_u64(1231275789u64);
    let network_id = 1;

    // Load public parameters
    let parameters = PublicParameters::<<Testnet1 as Environment>::Components>::load(false).unwrap();

    // Create dummy transaction
    let transaction = Transaction::<Testnet1>::new_dummy_transaction(network_id, &mut rng).unwrap();

    // Check transaction signature
    assert!(verify_transaction_signature::<Testnet1>(&parameters, &transaction.transaction).is_ok());

    // Check transaction proof
    assert!(verify_transaction_proof::<Testnet1>(&parameters, &transaction.transaction).is_ok());
}
