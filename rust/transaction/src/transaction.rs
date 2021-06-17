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

use crate::TransactionBuilder;
use aleo_environment::Environment;

use snarkvm_algorithms::{merkle_tree::MerkleTreeDigest, CommitmentScheme, SignatureScheme, CRH};
use snarkvm_dpc::{
    testnet1::{transaction::AleoAmount, BaseDPCComponents, EncryptedRecord, Transaction as DPCTransaction},
    DPCComponents,
    TransactionError,
    TransactionScheme,
};
use snarkvm_utilities::{FromBytes, ToBytes};

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

    fn transaction_id(&self) -> Result<[u8; 32], TransactionError> {
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
