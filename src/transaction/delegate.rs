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

use snarkvm_dpc::base_dpc::{
    instantiated::{CommitmentMerkleParameters, Components, InstantiatedDPC, Tx},
    parameters::PublicParameters,
    program::NoopProgram,
    record::DPCRecord,
    BaseDPCComponents,
    TransactionKernel,
};
use snarkvm_models::{
    algorithms::CRH,
    dpc::{DPCComponents, DPCScheme, Program, Record},
};
use snarkvm_storage::Ledger;
use snarkvm_utilities::{to_bytes, ToBytes};

use rand::Rng;

pub type MerkleTreeLedger = Ledger<Tx, CommitmentMerkleParameters>;

/// Delegated execution of program proof generation and transaction online phase.
pub fn delegate_transaction<R: Rng>(
    transaction_kernel: TransactionKernel<Components>,
    ledger: &MerkleTreeLedger,
    rng: &mut R,
) -> anyhow::Result<(Tx, Vec<DPCRecord<Components>>)> {
    let parameters = PublicParameters::<Components>::load(false)?;

    let local_data = transaction_kernel.into_local_data();

    // Enforce that the record programs are the noop program
    // TODO (add support for arbitrary programs)

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

    let noop_program = NoopProgram::<_, <Components as BaseDPCComponents>::NoopProgramSNARK>::new(noop_program_id);

    let mut old_death_program_proofs = vec![];
    for i in 0..Components::NUM_INPUT_RECORDS {
        let private_input = noop_program.execute(
            &parameters.noop_program_snark_parameters.proving_key,
            &parameters.noop_program_snark_parameters.verification_key,
            &local_data,
            i as u8,
            rng,
        )?;

        old_death_program_proofs.push(private_input);
    }

    let mut new_birth_program_proofs = vec![];
    for j in 0..Components::NUM_OUTPUT_RECORDS {
        let private_input = noop_program.execute(
            &parameters.noop_program_snark_parameters.proving_key,
            &parameters.noop_program_snark_parameters.verification_key,
            &local_data,
            (Components::NUM_INPUT_RECORDS + j) as u8,
            rng,
        )?;

        new_birth_program_proofs.push(private_input);
    }

    // Online execution to generate a DPC transaction

    let (new_records, transaction) = <InstantiatedDPC as DPCScheme<MerkleTreeLedger>>::execute_online(
        &parameters,
        transaction_kernel,
        old_death_program_proofs,
        new_birth_program_proofs,
        &ledger,
        rng,
    )?;

    Ok((transaction, new_records))
}
