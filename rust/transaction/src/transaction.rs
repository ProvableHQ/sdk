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

use crate::{TransactionBuilder, TransactionError};
use aleo_environment::Environment;

use snarkos_storage::Ledger;
use snarkvm_algorithms::{merkle_tree::MerkleTreeDigest, CommitmentScheme, SignatureScheme, CRH};
use snarkvm_dpc::{
    testnet1::{
        transaction::AleoAmount,
        BaseDPCComponents,
        EncryptedRecord,
        NoopProgram,
        PublicParameters,
        Transaction as DPCTransaction,
        TransactionKernel,
        DPC,
    },
    DPCComponents,
    DPCScheme,
    ProgramScheme,
    RecordScheme,
    TransactionError as DPCTransactionError,
    TransactionScheme,
};
use snarkvm_utilities::{to_bytes, FromBytes, ToBytes};

use rand::Rng;
use std::io::{Read, Result as IoResult, Write};

#[derive(Derivative)]
#[derivative(
    Clone(bound = "E: Environment"),
    PartialEq(bound = "E: Environment"),
    Eq(bound = "E: Environment")
)]
pub struct Transaction<E: Environment> {
    pub(crate) transaction: DPCTransaction<E::Components>,
}

impl<E: Environment> Transaction<E> {
    ///
    /// Returns a new transaction builder.
    ///
    #[allow(clippy::new_ret_no_self)]
    pub fn new() -> TransactionBuilder<E> {
        TransactionBuilder { ..Default::default() }
    }

    ///
    /// Delegated execution of program proof generation and transaction online phase.
    ///
    pub fn delegate_transaction<R: Rng>(
        transaction_kernel: TransactionKernel<E::Components>,
        ledger: Ledger<
            DPCTransaction<E::Components>,
            <E::Components as BaseDPCComponents>::MerkleParameters,
            E::Storage,
        >,
        rng: &mut R,
    ) -> Result<Self, TransactionError> {
        let parameters = PublicParameters::<E::Components>::load(false)?;

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

        let noop_program =
            NoopProgram::<_, <E::Components as BaseDPCComponents>::NoopProgramSNARK>::new(noop_program_id);

        let mut old_death_program_proofs = Vec::new();
        for i in 0..E::Components::NUM_INPUT_RECORDS {
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
        for j in 0..E::Components::NUM_OUTPUT_RECORDS {
            let private_input = noop_program.execute(
                &parameters.noop_program_snark_parameters.proving_key,
                &parameters.noop_program_snark_parameters.verification_key,
                &local_data,
                (E::Components::NUM_INPUT_RECORDS + j) as u8,
                rng,
            )?;

            new_birth_program_proofs.push(private_input);
        }

        // Online execution to generate a DPC transaction

        let (_new_records, transaction) = DPC::<E::Components>::execute_online(
            &parameters,
            transaction_kernel,
            old_death_program_proofs,
            new_birth_program_proofs,
            &ledger,
            rng,
        )?;

        Ok(Transaction::<E> { transaction })
    }
}

impl<E: Environment> TransactionScheme for Transaction<E> {
    type Commitment = <<E::Components as DPCComponents>::RecordCommitment as CommitmentScheme>::Output;
    type Digest = MerkleTreeDigest<<E::Components as BaseDPCComponents>::MerkleParameters>;
    type EncryptedRecord = EncryptedRecord<E::Components>;
    type InnerCircuitID = <<E::Components as DPCComponents>::InnerCircuitIDCRH as CRH>::Output;
    type LocalDataRoot = <<E::Components as DPCComponents>::LocalDataCRH as CRH>::Output;
    // todo: make this type part of components in snarkvm_dpc
    type Memorandum = [u8; 32];
    type ProgramCommitment =
        <<E::Components as DPCComponents>::ProgramVerificationKeyCommitment as CommitmentScheme>::Output;
    type SerialNumber = <<E::Components as DPCComponents>::AccountSignature as SignatureScheme>::PublicKey;
    // todo: make this type part of components in snarkvm_dpc
    type ValueBalance = AleoAmount;

    fn transaction_id(&self) -> Result<[u8; 32], DPCTransactionError> {
        self.transaction.transaction_id()
    }

    fn network_id(&self) -> u8 {
        self.transaction.network_id()
    }

    fn ledger_digest(&self) -> &Self::Digest {
        self.transaction.ledger_digest()
    }

    fn inner_circuit_id(&self) -> &Self::InnerCircuitID {
        self.transaction.inner_circuit_id()
    }

    fn old_serial_numbers(&self) -> &[Self::SerialNumber] {
        self.transaction.old_serial_numbers()
    }

    fn new_commitments(&self) -> &[Self::Commitment] {
        self.transaction.new_commitments()
    }

    fn program_commitment(&self) -> &Self::ProgramCommitment {
        self.transaction.program_commitment()
    }

    fn local_data_root(&self) -> &Self::LocalDataRoot {
        self.transaction.local_data_root()
    }

    fn value_balance(&self) -> Self::ValueBalance {
        self.transaction.value_balance()
    }

    fn encrypted_records(&self) -> &[Self::EncryptedRecord] {
        self.transaction.encrypted_records()
    }

    fn memorandum(&self) -> &Self::Memorandum {
        self.transaction.memorandum()
    }

    fn size(&self) -> usize {
        self.transaction.size()
    }
}

impl<E: Environment> ToBytes for Transaction<E> {
    #[inline]
    fn write<W: Write>(&self, mut writer: W) -> IoResult<()> {
        self.transaction.write(&mut writer)
    }
}

impl<E: Environment> FromBytes for Transaction<E> {
    #[inline]
    fn read<R: Read>(mut reader: R) -> IoResult<Self> {
        Ok(Self {
            transaction: FromBytes::read(&mut reader)?,
        })
    }
}
