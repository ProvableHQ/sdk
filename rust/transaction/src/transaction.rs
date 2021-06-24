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
use aleo_network::Network;

use snarkvm_algorithms::{merkle_tree::MerkleTreeDigest, CommitmentScheme, SignatureScheme, CRH};
use snarkvm_dpc::{
    testnet1::{
        transaction::AleoAmount,
        BaseDPCComponents,
        EncryptedRecord,
        PublicParameters,
        Transaction as DPCTransaction,
        TransactionKernel as DPCTransactionKernel,
        DPC,
    },
    DPCComponents,
    DPCScheme,
    LedgerScheme,
    TransactionError as DPCTransactionError,
    TransactionScheme,
};
use snarkvm_utilities::{to_bytes, FromBytes, ToBytes};

use rand::Rng;
use snarkvm_algorithms::merkle_tree::MerklePath;
use snarkvm_dpc::testnet1::PrivateProgramInput;
use std::{
    fmt,
    io::{Read, Result as IoResult, Write},
    str::FromStr,
};

/// Stores transaction data that is computed online - with on-chain data.
/// To compute a transaction offline, see `TransactionKernel`.
#[derive(Derivative)]
#[derivative(
    Clone(bound = "N: Network"),
    PartialEq(bound = "N: Network"),
    Eq(bound = "N: Network")
)]
pub struct Transaction<N: Network> {
    pub(crate) transaction: DPCTransaction<N::Components>,
}

impl<N: Network> Transaction<N> {
    ///
    /// Returns a new transaction builder.
    ///
    #[allow(clippy::new_ret_no_self)]
    pub fn new() -> TransactionBuilder<N> {
        TransactionBuilder { ..Default::default() }
    }

    ///
    /// Delegated execution of program proof generation and transaction online phase.
    ///
    pub fn delegate_transaction<R: Rng, L: LedgerScheme>(
        transaction_kernel: DPCTransactionKernel<N::Components>,
        old_death_program_proofs: Vec<PrivateProgramInput>,
        new_birth_program_proofs: Vec<PrivateProgramInput>,
        ledger: &L,
        rng: &mut R,
    ) -> Result<Self, TransactionError>
        where
            L: LedgerScheme<
                Commitment = <<<N as Network>::Components as DPCComponents>::RecordCommitment as CommitmentScheme>::Output,
                MerkleParameters = <<N as Network>::Components as BaseDPCComponents>::MerkleParameters,
                MerklePath = MerklePath<<<N as Network>::Components as BaseDPCComponents>::MerkleParameters>,
                MerkleTreeDigest = MerkleTreeDigest<<<N as Network>::Components as BaseDPCComponents>::MerkleParameters>,
                SerialNumber = <<<N as Network>::Components as DPCComponents>::AccountSignature as SignatureScheme>::PublicKey,
                Transaction = DPCTransaction<<N as Network>::Components>,
            >,
    {
        // Load public parameters if they are not provided
        let parameters = PublicParameters::<N::Components>::load(false)?;

        // Online execution to generate a DPC transaction

        let (_new_records, transaction) = DPC::<N::Components>::execute_online(
            &parameters,
            transaction_kernel,
            old_death_program_proofs,
            new_birth_program_proofs,
            ledger,
            rng,
        )?;

        Transaction::new()
            .network(transaction.network)
            .ledger_digest(transaction.ledger_digest)
            .old_serial_numbers(transaction.old_serial_numbers)
            .new_commitments(transaction.new_commitments)
            .program_commitment(transaction.program_commitment)
            .local_data_root(transaction.local_data_root)
            .value_balance(transaction.value_balance)
            .signatures(transaction.signatures)
            .encrypted_records(transaction.encrypted_records)
            .transaction_proof(transaction.transaction_proof)
            .memorandum(transaction.memorandum)
            .inner_circuit_id(transaction.inner_circuit_id)
            .build()
    }

    pub fn to_bytes(&self) -> Vec<u8> {
        let mut output = vec![];
        self.transaction
            .write(&mut output)
            .expect("serialization to bytes failed");
        output
    }
}

impl<N: Network> TransactionScheme for Transaction<N> {
    type Commitment = <<N::Components as DPCComponents>::RecordCommitment as CommitmentScheme>::Output;
    type Digest = MerkleTreeDigest<<N::Components as BaseDPCComponents>::MerkleParameters>;
    type EncryptedRecord = EncryptedRecord<N::Components>;
    type InnerCircuitID = <<N::Components as DPCComponents>::InnerCircuitIDCRH as CRH>::Output;
    type LocalDataRoot = <<N::Components as DPCComponents>::LocalDataCRH as CRH>::Output;
    // todo: make this type part of components in snarkvm_dpc
    type Memorandum = [u8; 32];
    type ProgramCommitment =
        <<N::Components as DPCComponents>::ProgramVerificationKeyCommitment as CommitmentScheme>::Output;
    type SerialNumber = <<N::Components as DPCComponents>::AccountSignature as SignatureScheme>::PublicKey;
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

impl<N: Network> ToBytes for Transaction<N> {
    #[inline]
    fn write<W: Write>(&self, mut writer: W) -> IoResult<()> {
        self.transaction.write(&mut writer)
    }
}

impl<N: Network> FromBytes for Transaction<N> {
    #[inline]
    fn read<R: Read>(mut reader: R) -> IoResult<Self> {
        Ok(Self {
            transaction: FromBytes::read(&mut reader)?,
        })
    }
}

impl<N: Network> FromStr for Transaction<N> {
    type Err = TransactionError;

    fn from_str(transaction: &str) -> Result<Self, Self::Err> {
        Ok(Self {
            transaction: DPCTransaction::<N::Components>::read(&hex::decode(transaction)?[..])?,
        })
    }
}

impl<N: Network> fmt::Display for Transaction<N> {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(
            f,
            "{}",
            hex::encode(to_bytes![self.transaction].expect("couldn't serialize to bytes"))
        )
    }
}
