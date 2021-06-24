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
use crate::{verify_transaction_proof, verify_transaction_signature, EmptyLedger, Transaction, TransactionKernel};
use aleo_account::{Address, PrivateKey};
use aleo_network::{Network, Testnet1};
use aleo_record::Record;

use snarkvm_algorithms::{MerkleParameters, CRH};
use snarkvm_dpc::{
    testnet1::{
        record::payload::Payload,
        BaseDPCComponents,
        NoopProgram,
        PublicParameters,
        Transaction as DPCTransaction,
        DPC,
    },
    AccountAddress as DPCAddress,
    AccountPrivateKey as DPCPrivateKey,
    DPCComponents,
    LedgerScheme,
    ProgramScheme,
    RecordScheme,
};
use snarkvm_parameters::{testnet1::GenesisBlock, Genesis, LedgerMerkleTreeParameters, Parameter};
use snarkvm_utilities::{to_bytes, FromBytes, ToBytes};

use rand::{Rng, SeedableRng};
use rand_chacha::ChaChaRng;
use std::{str::FromStr, sync::Arc};

type L = EmptyLedger<
    DPCTransaction<<Testnet1 as Network>::Components>,
    <<Testnet1 as Network>::Components as BaseDPCComponents>::MerkleParameters,
>;

#[test]
fn test_delegate_transaction() {
    let mut rng = ChaChaRng::seed_from_u64(1231275789u64);
    let network_id = 1;

    // Load public parameters
    let parameters = PublicParameters::<<Testnet1 as Network>::Components>::load(false).unwrap();

    // Create dummy transaction
    // let transaction = Transaction::<Testnet1>::new_dummy(network_id, &mut rng).unwrap();

    // Create dummy spender
    let dpc_spender = DPCPrivateKey::<<Testnet1 as Network>::Components>::new(
        &parameters.system_parameters.account_signature,
        &parameters.system_parameters.account_commitment,
        &mut rng,
    )
    .unwrap();

    let spender = PrivateKey::from_str(&dpc_spender.to_string()).unwrap();

    // Create dummy input record

    let sn_randomness: [u8; 32] = rng.gen();
    let old_sn_nonce = parameters
        .system_parameters
        .serial_number_nonce
        .hash(&sn_randomness)
        .unwrap();

    let dpc_address = DPCAddress::<<Testnet1 as Network>::Components>::from_private_key(
        parameters.account_signature_parameters(),
        parameters.account_commitment_parameters(),
        parameters.account_encryption_parameters(),
        &dpc_spender,
    )
    .unwrap();

    let noop_program_id = to_bytes![
        parameters
            .system_parameters
            .program_verification_key_crh
            .hash(&to_bytes![parameters.noop_program_snark_parameters.verification_key].unwrap())
            .unwrap()
    ]
    .unwrap();

    let dummy_record = DPC::<<Testnet1 as Network>::Components>::generate_record(
        &parameters.system_parameters,
        old_sn_nonce,
        dpc_address,
        true,
        0,
        Payload::default(),
        noop_program_id.clone(),
        noop_program_id.clone(),
        &mut rng,
    )
    .unwrap();
    let record = Record::<Testnet1> { record: dummy_record };

    // Create dummy recipient
    let new_recipient_private_key = PrivateKey::new(&mut rng).unwrap();
    let new_recipient = Address::from(&new_recipient_private_key).unwrap();

    // Create dummy amount
    let amount = 0;

    // Create payload: 0
    let payload = Payload::default();

    // Build transaction_kernel
    let transaction_kernel = TransactionKernel::new()
        .add_input(spender, record)
        .add_output(
            new_recipient,
            amount,
            payload,
            noop_program_id.clone(),
            noop_program_id.clone(),
        )
        .network_id(network_id)
        .build(&mut rng)
        .unwrap();

    // Delegate online phase of transaction generation
    let random_path: u16 = rng.gen();

    let mut path = std::env::current_dir().unwrap();
    path.push(format!("storage_db_{}", random_path));

    let local_data = transaction_kernel.into_local_data();

    // Enforce that the record programs are the noop program DUMMY ONLY.

    let noop_program_id = to_bytes![
        parameters
            .system_parameters
            .program_verification_key_crh
            .hash(&to_bytes![parameters.noop_program_snark_parameters.verification_key].unwrap())
            .unwrap()
    ]
    .unwrap();

    for old_record in &local_data.old_records {
        assert_eq!(old_record.death_program_id().to_vec(), noop_program_id);
    }

    for new_record in &local_data.new_records {
        assert_eq!(new_record.birth_program_id().to_vec(), noop_program_id);
    }

    // Generate the program proofs

    let noop_program =
        NoopProgram::<_, <<Testnet1 as Network>::Components as BaseDPCComponents>::NoopProgramSNARK>::new(
            noop_program_id,
        );

    let mut old_death_program_proofs = Vec::new();
    for i in 0..<<Testnet1 as Network>::Components as DPCComponents>::NUM_INPUT_RECORDS {
        let private_input = noop_program
            .execute(
                &parameters.noop_program_snark_parameters.proving_key,
                &parameters.noop_program_snark_parameters.verification_key,
                &local_data,
                i as u8,
                &mut rng,
            )
            .unwrap();

        old_death_program_proofs.push(private_input);
    }

    let mut new_birth_program_proofs = Vec::new();
    for j in 0..<<Testnet1 as Network>::Components as DPCComponents>::NUM_OUTPUT_RECORDS {
        let private_input = noop_program
            .execute(
                &parameters.noop_program_snark_parameters.proving_key,
                &parameters.noop_program_snark_parameters.verification_key,
                &local_data,
                (<<Testnet1 as Network>::Components as DPCComponents>::NUM_INPUT_RECORDS + j) as u8,
                &mut rng,
            )
            .unwrap();

        new_birth_program_proofs.push(private_input);
    }

    // Load ledger parameters from snarkvm-parameters
    let crh_parameters =
        <<<<Testnet1 as Network>::Components as BaseDPCComponents>::MerkleParameters as MerkleParameters>::H as CRH>::Parameters::read(&LedgerMerkleTreeParameters::load_bytes().unwrap()[..]).unwrap();
    let merkle_tree_hash_parameters =
        <<<Testnet1 as Network>::Components as BaseDPCComponents>::MerkleParameters as MerkleParameters>::H::from(
            crh_parameters,
        );
    let ledger_parameters = Arc::new(From::from(merkle_tree_hash_parameters));

    // Load genesis block
    let genesis_block = FromBytes::read(GenesisBlock::load_bytes().as_slice()).unwrap();

    // Use empty ledger to generate transaction kernel DUMMY ONLY.
    let ledger = L::new(Some(&path), ledger_parameters, genesis_block).unwrap();

    let transaction = Transaction::<Testnet1>::delegate_transaction(
        transaction_kernel.transaction_kernel,
        old_death_program_proofs,
        new_birth_program_proofs,
        &ledger,
        &mut rng,
    )
    .unwrap();

    drop(ledger);

    // Check transaction signature
    assert!(verify_transaction_signature::<Testnet1>(&parameters, &transaction.transaction).is_ok());

    // Check transaction proof
    assert!(verify_transaction_proof::<Testnet1>(&parameters, &transaction.transaction).is_ok());
}
