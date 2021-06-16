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
use aleo_environment::Environment;

use snarkvm_algorithms::{merkle_tree::MerkleTreeDigest, SNARK};
use snarkvm_dpc::{DPCComponents, Network, TransactionScheme};

/// A builder struct for the Transaction data type.
#[derive(Debug)]
pub struct TransactionBuilder<E: Environment> {
    pub(crate) network: Option<Network>,
    pub(crate) ledger_digest: Option<<Transaction<E> as TransactionScheme>::Digest>,
    pub(crate) old_serial_numbers: Vec<<Transaction<E> as TransactionScheme>::SerialNumber>,
    pub(crate) new_commitments: Vec<<Transaction<E> as TransactionScheme>::Commitment>,
    pub(crate) program_commitment: Option<<Transaction<E> as TransactionScheme>::ProgramCommitment>,
    pub(crate) local_data_root: Option<<Transaction<E> as TransactionScheme>::LocalDataRoot>,
    pub(crate) value_balance: Option<<Transaction<E> as TransactionScheme>::ValueBalance>,
    pub(crate) signatures: Vec<<Transaction<E> as TransactionScheme>::SerialNumber>,
    pub(crate) encrypted_records: Vec<<Transaction<E> as TransactionScheme>::EncryptedRecord>,
    pub(crate) transaction_proof: Option<<<E::Components as DPCComponents>::OuterSNARK as SNARK>::Proof>,
    pub(crate) memorandum: Option<<Transaction<E> as TransactionScheme>::Memorandum>,
    pub(crate) inner_circuit_id: Option<<Transaction<E> as TransactionScheme>::InnerCircuitID>,
}
