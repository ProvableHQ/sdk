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

use crate::{Transaction, TransactionError};
use aleo_environment::Environment;

use snarkvm_algorithms::{merkle_tree::MerkleTreeDigest, SNARK};
use snarkvm_dpc::{
    testnet1::{transaction::Transaction as DPCTransaction, BaseDPCComponents},
    DPCComponents,
    Network,
    TransactionScheme,
};

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

    pub(crate) errors: Vec<TransactionError>,
}

impl<E: Environment> TransactionBuilder<E> {
    ///
    /// Returns a new transaction builder.
    /// To return a transaction and consume the transaction builder, call the `.build()` method.
    ///
    pub fn new() -> Self {
        Self { ..Default::default() }
    }

    ///
    /// Returns a new transaction builder and sets field `network: Network`.
    ///
    pub fn network(mut self, network: Network) -> Self {
        self.network = Some(network);
        self
    }

    ///
    /// Returns a new transaction builder and sets field `ledger_digest`.
    ///
    pub fn ledger_digest(mut self, ledger_digest: <Transaction<E> as TransactionScheme>::Digest) -> Self {
        self.ledger_digest = Some(ledger_digest);
        self
    }

    ///
    /// Returns a new transaction builder and sets field `old_serial_numbers`.
    ///
    pub fn old_serial_numbers(
        mut self,
        old_serial_numbers: Vec<<Transaction<E> as TransactionScheme>::SerialNumber>,
    ) -> Self {
        self.old_serial_numbers = old_serial_numbers;
        self
    }

    ///
    /// Returns a new transaction builder and sets field `new_commitments`.
    ///
    pub fn new_commitments(mut self, new_commitments: Vec<<Transaction<E> as TransactionScheme>::Commitment>) -> Self {
        self.new_commitments = new_commitments;
        self
    }

    ///
    /// Returns a new transaction builder and sets field `program_commitment`.
    ///
    pub fn program_commitment(
        mut self,
        program_commitment: <Transaction<E> as TransactionScheme>::ProgramCommitment,
    ) -> Self {
        self.program_commitment = Some(program_commitment);
        self
    }

    ///
    /// Returns a new transaction builder and sets field `local_data_root`.
    ///
    pub fn local_data_root(mut self, local_data_root: <Transaction<E> as TransactionScheme>::LocalDataRoot) -> Self {
        self.local_data_root = Some(local_data_root);
        self
    }

    ///
    /// Returns a new transaction builder and sets field `value_balance`.
    ///
    pub fn value_balance(mut self, value_balance: <Transaction<E> as TransactionScheme>::ValueBalance) -> Self {
        self.value_balance = Some(value_balance);
        self
    }

    ///
    /// Returns a new transaction builder and sets field `signatures`.
    ///
    pub fn signatures(mut self, signatures: Vec<<Transaction<E> as TransactionScheme>::SerialNumber>) -> Self {
        self.signatures = signatures;
        self
    }

    ///
    /// Returns a new transaction builder and sets field `encrypted_records`.
    ///
    pub fn encrypted_records(
        mut self,
        encrypted_records: Vec<<Transaction<E> as TransactionScheme>::EncryptedRecord>,
    ) -> Self {
        self.encrypted_records = encrypted_records;
        self
    }

    ///
    /// Returns a new transaction builder and sets field `memorandum`.
    ///
    pub fn memorandum(mut self, memorandum: <Transaction<E> as TransactionScheme>::Memorandum) -> Self {
        self.memorandum = Some(memorandum);
        self
    }

    ///
    /// Returns a new transaction builder and sets field `inner_circuit_id`.
    ///
    pub fn inner_circuit_id(mut self, inner_circuit_id: <Transaction<E> as TransactionScheme>::InnerCircuitID) -> Self {
        self.inner_circuit_id = Some(inner_circuit_id);
        self
    }

    ///
    /// Returns a `Transaction` and consumes the transaction builder.
    /// Returns an error if fields are missing or errors are encountered while building.
    ///
    pub fn build(self) -> Result<Transaction<E>, TransactionError> {
        // Return error.
        if !self.errors.is_empty() {
            // Print out all errors

            for err in self.errors {
                println!("BuilderError: {:?}", err);
            }

            // Return builder fail.
            return Err(TransactionError::BuilderError);
        }

        // Get network
        let network = match self.network {
            Some(value) => value,
            None => return Err(TranscationError::MissingField("network".to_string())),
        };

        // Get ledger_digest
        let ledger_digest = match self.ledger_digest {
            Some(value) => value,
            None => return Err(TransactionError::MissingField("ledger_digest".to_string())),
        };

        // Get old_serial_numbers
        let old_serial_numbers = if self.old_serial_numbers.is_empty() {
            return Err(TransactionError::MissingField("old_serial_numbers".to_string()));
        } else {
            self.old_serial_numbers
        };

        // Get new_commitments
        let new_commitments = if self.new_commitments.is_empty() {
            return Err(TransactionError::MissingField("new_commitments".to_string()));
        } else {
            self.new_commitments
        };

        // Get program_commitment
        let program_commitment = match self.program_commitment {
            Some(value) => value,
            None => return Err(TransactionError::MissingField("program_commitment".to_string())),
        };

        // Get local_data_root
        let local_data_root = match self.local_data_root {
            Some(value) => value,
            None => return Err(TransactionError::MissingField("local_data_root".to_string())),
        };

        // Get value_balance
        let value_balance = match self.value_balance {
            Some(value) => value,
            None => return Err(TransactionError::MissingField("value_balance".to_string())),
        };

        // Get signatures
        let signatures = if self.signatures.is_empty() {
            return Err(TransactionError::MissingField("signatures".to_string()));
        } else {
            self.signatures
        };

        // Get encrypted_records
        let encrypted_records = if self.encrypted_records.is_empty() {
            return Err(TransactionError::MissingField("encrypted_records".to_string()));
        } else {
            self.encrypted_records
        };

        // Get transaction_proof
        let transaction_proof = match self.transaction_proof {
            Some(value) => value,
            None => return Err(TransactionError::MissingField("transaction_proof".to_string())),
        };

        // Get memorandum
        let memorandum = match self.memorandum {
            Some(value) => value,
            None => return Err(TransactionError::MissingField("memorandum".to_string())),
        };

        // Get inner_circuit_id
        let inner_circuit_id = match self.inner_circuit_id {
            Some(value) => value,
            None => return Err(TransactionError::MissingField("inner_circuit_id".to_string())),
        };

        let transaction = DPCTransaction::<E>::new(
            old_serial_numbers,
            new_commitments,
            memorandum,
            ledger_digest,
            inner_circuit_id,
            transaction_proof,
            program_commitment,
            local_data_root,
            value_balance,
            network,
            signatures,
            encrypted_records,
        );

        Ok(Transaction::<E> { transaction })
    }
}
