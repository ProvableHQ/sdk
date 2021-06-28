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

use crate::helpers::transaction::delegate_transaction;
use aleo_account::{Address, PrivateKey};
use aleo_network::Network;
use aleo_record::Record;
use aleo_transaction::{Transaction, TransactionKernel};

use snarkos_storage::{mem::MemDb, Ledger};
use snarkvm_algorithms::traits::CRH;
use snarkvm_dpc::{
    account::{AccountAddress as DPCAddress, AccountPrivateKey as DPCPrivateKey},
    testnet1::{
        parameters::PublicParameters,
        payload::Payload,
        BaseDPCComponents,
        NoopProgram,
        Transaction as DPCTransaction,
        DPC,
    },
    traits::{DPCComponents, RecordScheme},
    ProgramScheme,
};
use snarkvm_utilities::{to_bytes, ToBytes};

use rand::{CryptoRng, Rng};
use std::str::FromStr;

pub type MerkleTreeLedger<N> = Ledger<
    DPCTransaction<<N as Network>::Components>,
    <<N as Network>::Components as BaseDPCComponents>::MerkleParameters,
    MemDb,
>;

/// Returns a transaction constructed with dummy records.
pub fn new_dummy_transaction<R: Rng + CryptoRng, N: Network>(rng: &mut R) -> anyhow::Result<Transaction<N>> {
    // Load public parameters
    let parameters = PublicParameters::<N::Components>::load(false)?;

    // Create dummy spender
    let dpc_spender = DPCPrivateKey::<N::Components>::new(
        &parameters.system_parameters.account_signature,
        &parameters.system_parameters.account_commitment,
        rng,
    )?;

    let spender = PrivateKey::from_str(&dpc_spender.to_string())?;

    // Create dummy input record

    let sn_randomness: [u8; 32] = rng.gen();
    let old_sn_nonce = parameters.system_parameters.serial_number_nonce.hash(&sn_randomness)?;

    let dpc_address = DPCAddress::<N::Components>::from_private_key(
        parameters.account_signature_parameters(),
        parameters.account_commitment_parameters(),
        parameters.account_encryption_parameters(),
        &dpc_spender,
    )?;

    let noop_program_id = to_bytes![
        parameters
            .system_parameters
            .program_verification_key_crh
            .hash(&to_bytes![parameters.noop_program_snark_parameters.verification_key]?)?
    ]?;

    let dummy_record = DPC::<N::Components>::generate_record(
        &parameters.system_parameters,
        old_sn_nonce,
        dpc_address,
        true,
        0,
        Payload::default(),
        noop_program_id.clone(),
        noop_program_id.clone(),
        rng,
    )?;
    let record = Record::<N> { record: dummy_record };

    // Create dummy recipient
    let new_recipient_private_key = PrivateKey::new(rng)?;
    let new_recipient = Address::from(&new_recipient_private_key)?;

    // Create dummy amount
    let amount = 0;

    // Create payload: 0
    let payload = Payload::default();

    // Build transaction_kernel
    let transaction_kernel = TransactionKernel::new()
        .add_input(spender, record)
        .add_output(new_recipient, amount, payload, noop_program_id.clone(), noop_program_id)
        .build(rng)?;

    // Delegate online phase of transaction generation
    let random_path: u16 = rng.gen();

    let mut path = std::env::current_dir()?;
    path.push(format!("storage_db_{}", random_path));

    let local_data = transaction_kernel.into_local_data();

    // Enforce that the record programs are the noop program DUMMY ONLY.

    let noop_program_id = to_bytes![
        parameters
            .system_parameters
            .program_verification_key_crh
            .hash(&to_bytes![parameters.noop_program_snark_parameters.verification_key]?)?
    ]?;

    for old_record in &local_data.old_records {
        assert_eq!(old_record.death_program_id().to_vec(), noop_program_id);
    }

    for new_record in &local_data.new_records {
        assert_eq!(new_record.birth_program_id().to_vec(), noop_program_id);
    }

    // Generate the program proofs

    let noop_program = NoopProgram::<_, <N::Components as BaseDPCComponents>::NoopProgramSNARK>::new(noop_program_id);

    let mut old_death_program_proofs = Vec::new();
    for i in 0..<N::Components as DPCComponents>::NUM_INPUT_RECORDS {
        let private_input = noop_program.execute(
            &parameters.noop_program_snark_parameters.proving_key,
            &parameters.noop_program_snark_parameters.verification_key,
            &local_data,
            i as u8,
            rng,
        )?;

        old_death_program_proofs.push(private_input);
    }

    let mut new_birth_program_proofs = Vec::new();
    for j in 0..<N::Components as DPCComponents>::NUM_OUTPUT_RECORDS {
        let private_input = noop_program.execute(
            &parameters.noop_program_snark_parameters.proving_key,
            &parameters.noop_program_snark_parameters.verification_key,
            &local_data,
            (<N::Components as DPCComponents>::NUM_INPUT_RECORDS + j) as u8,
            rng,
        )?;

        new_birth_program_proofs.push(private_input);
    }

    // Use ledger to generate transaction kernel.
    let random_path: u16 = rng.gen();

    let mut path = std::env::current_dir()?;
    path.push(format!("storage_db_{}", random_path));

    let ledger = MerkleTreeLedger::<N>::open_at_path(&path)?;

    let transaction = delegate_transaction(
        transaction_kernel,
        &ledger,
        old_death_program_proofs,
        new_birth_program_proofs,
        rng,
    )?;

    drop(ledger);

    Ok(transaction)
}
