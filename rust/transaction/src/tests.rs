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
use crate::Transaction;
use aleo_environment::{Environment, Testnet1};

use snarkos_storage::Ledger;
use snarkvm_algorithms::{MerkleParameters, SignatureScheme, CRH, SNARK};
use snarkvm_dpc::{
    testnet1::{
        instantiated::{CommitmentMerkleParameters, MerkleTreeCRH},
        BaseDPCComponents,
        InnerCircuitVerifierInput,
        OuterCircuitVerifierInput,
        PublicParameters,
        RecordEncryption,
        Transaction as DPCTransaction,
    },
    DPCComponents,
    TransactionScheme,
};
use snarkvm_parameters::{LedgerMerkleTreeParameters, Parameter};
use snarkvm_utilities::{to_bytes, FromBytes, ToBytes};

use rand::SeedableRng;
use rand_chacha::ChaChaRng;
use std::sync::Arc;

type L = Ledger<
    DPCTransaction<<Testnet1 as Environment>::Components>,
    <<Testnet1 as Environment>::Components as BaseDPCComponents>::MerkleParameters,
    <Testnet1 as Environment>::Storage,
>;

#[test]
fn test_build_dummy_transaction() {
    let mut rng = ChaChaRng::seed_from_u64(1231275789u64);
    let network_id = 1;

    // Load ledger parameters from snarkvm-parameters
    let crh_parameters =
        <MerkleTreeCRH as CRH>::Parameters::read(&LedgerMerkleTreeParameters::load_bytes().unwrap()[..]).unwrap();
    let merkle_tree_hash_parameters = <CommitmentMerkleParameters as MerkleParameters>::H::from(crh_parameters);
    let ledger_parameters = Arc::new(From::from(merkle_tree_hash_parameters));

    // Load public parameters
    let parameters = PublicParameters::<<Testnet1 as Environment>::Components>::load(false).unwrap();

    // Create dummy transaction
    let transaction = Transaction::<Testnet1>::new_dummy_transaction(network_id, &mut rng).unwrap();

    // Check transaction signature
    let signature_message: &Vec<u8> = &to_bytes![
        transaction.network_id(),
        transaction.ledger_digest(),
        transaction.old_serial_numbers(),
        transaction.new_commitments(),
        transaction.program_commitment(),
        transaction.local_data_root(),
        transaction.value_balance(),
        transaction.memorandum()
    ]
    .unwrap();

    let account_signature = &parameters.system_parameters.account_signature;
    for (pk, sig) in transaction
        .old_serial_numbers()
        .iter()
        .zip(&transaction.transaction.signatures)
    {
        assert!(
            <<Testnet1 as Environment>::Components as DPCComponents>::AccountSignature::verify(
                account_signature,
                pk,
                signature_message,
                sig
            )
            .unwrap()
        );
    }

    // Construct ciphertext hashes
    let mut new_encrypted_record_hashes = Vec::with_capacity(<Testnet1 as Environment>::Components::NUM_OUTPUT_RECORDS);
    for encrypted_record in transaction.encrypted_records() {
        let encrypted_record_hash =
            RecordEncryption::encrypted_record_hash(&parameters.system_parameters, encrypted_record).unwrap();

        new_encrypted_record_hashes.push(encrypted_record_hash);
    }

    let inner_snark_input = InnerCircuitVerifierInput {
        system_parameters: parameters.system_parameters.clone(),
        ledger_parameters,
        ledger_digest: transaction.ledger_digest().clone(),
        old_serial_numbers: transaction.old_serial_numbers().to_vec(),
        new_commitments: transaction.new_commitments().to_vec(),
        new_encrypted_record_hashes,
        memo: *transaction.memorandum(),
        program_commitment: transaction.program_commitment().clone(),
        local_data_root: transaction.local_data_root().clone(),
        value_balance: transaction.value_balance(),
        network_id: transaction.network_id(),
    };

    let inner_snark_vk: <<<Testnet1 as Environment>::Components as BaseDPCComponents>::InnerSNARK as SNARK>::VerifyingKey =
        parameters.inner_snark_parameters.1.clone().into();

    let inner_circuit_id = <<Testnet1 as Environment>::Components as DPCComponents>::InnerCircuitIDCRH::hash(
        &parameters.system_parameters.inner_circuit_id_crh,
        &to_bytes![inner_snark_vk].unwrap(),
    )
    .unwrap();

    let outer_snark_input = OuterCircuitVerifierInput {
        inner_snark_verifier_input: inner_snark_input,
        inner_circuit_id,
    };

    assert!(
        <<Testnet1 as Environment>::Components as BaseDPCComponents>::OuterSNARK::verify(
            &parameters.outer_snark_parameters.1,
            &outer_snark_input,
            &transaction.transaction.transaction_proof,
        )
        .unwrap()
    );
}
