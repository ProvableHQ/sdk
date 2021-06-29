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

use crate::{Transaction, TransactionError, TransactionKernel};
use aleo_network::Network;

use snarkvm_algorithms::{
    merkle_tree::{MerklePath, MerkleTreeDigest},
    CommitmentScheme,
    SignatureScheme,
};
use snarkvm_dpc::{
    testnet1::{
        transaction::Transaction as DPCTransaction,
        BaseDPCComponents,
        PrivateProgramInput,
        PublicParameters,
        DPC,
    },
    DPCComponents,
    DPCScheme,
    LedgerScheme,
};

use once_cell::sync::OnceCell;
use rand::Rng;

/// A builder struct for the Transaction data type.
#[derive(Derivative)]
#[derivative(Default(bound = "N: Network"))]
pub struct TransactionBuilder<N: Network> {
    pub(crate) transaction_kernel: OnceCell<TransactionKernel<N>>,
    pub(crate) old_death_program_proofs: Vec<PrivateProgramInput>,
    pub(crate) new_birth_program_proofs: Vec<PrivateProgramInput>,

    pub(crate) errors: Vec<TransactionError>,
}

impl<N: Network> TransactionBuilder<N> {
    ///
    /// Returns a new transaction builder.
    /// To return a transaction and consume the transaction builder, call the `.build()` method.
    ///
    pub fn new() -> Self {
        Self { ..Default::default() }
    }

    ///
    /// Returns a new transaction builder and sets field `transaction_kernel: TransactionKernel`.
    /// Otherwise, logs a `TransactionError`.
    ///
    pub fn transaction_kernel(mut self, kernel: TransactionKernel<N>) -> Self {
        if let Err(kernel) = self.transaction_kernel.set(kernel) {
            self.errors
                .push(TransactionError::DuplicateArgument(kernel.to_string()).into());
        }
        self
    }

    ///
    /// Returns a new transaction builder with the added vector of old_death_program_proofs
    /// Otherwise, logs a `TransactionError`.
    ///
    pub fn add_old_death_program_proofs(self, old_death_program_proofs: Vec<PrivateProgramInput>) -> Self {
        let mut result = self;
        for old_death_program_proof in old_death_program_proofs {
            result = result.add_old_death_program_proof(old_death_program_proof)
        }
        result
    }

    ///
    /// Returns a new transaction builder with the added old_death_program_proof
    /// Otherwise, logs a `TransactionError`.
    ///
    pub fn add_old_death_program_proof(mut self, old_death_program_proof: PrivateProgramInput) -> Self {
        // Check that the transaction is limited to `N::Components::NUM_INPUT_RECORDS` inputs.
        if self.old_death_program_proofs.len() > N::Components::NUM_INPUT_RECORDS {
            self.errors.push(TransactionError::InvalidNumberOfInputProofs(
                self.old_death_program_proofs.len() + 1,
                N::Components::NUM_INPUT_RECORDS,
            ));
        } else {
            // Push the private program input.
            self.old_death_program_proofs.push(old_death_program_proof);
        }

        self
    }

    ///
    /// Returns a new transaction builder with the added vector of new_birth_program_proofs
    /// Otherwise, logs a `TransactionError`.
    ///
    pub fn add_new_birth_program_proofs(self, new_birth_program_proofs: Vec<PrivateProgramInput>) -> Self {
        let mut new = self;
        for new_birth_program_proof in new_birth_program_proofs {
            let temp = new.add_new_birth_program_proof(new_birth_program_proof);
            new = temp;
        }
        new
    }

    ///
    /// Returns a new transaction builder with the added new_birth_program_proof
    /// Otherwise, logs a `TransactionError`.
    ///
    pub fn add_new_birth_program_proof(mut self, new_birth_program_proof: PrivateProgramInput) -> Self {
        // Check that the transaction is limited to `N::Components::NUM_INPUT_RECORDS` outputs.
        if self.new_birth_program_proofs.len() > N::Components::NUM_OUTPUT_RECORDS {
            self.errors.push(TransactionError::InvalidNumberOfOutputProofs(
                self.new_birth_program_proofs.len() + 1,
                N::Components::NUM_OUTPUT_RECORDS,
            ));
        } else {
            // Push the private program input.
            self.new_birth_program_proofs.push(new_birth_program_proof);
        }

        self
    }

    ///
    /// Returns a `Transaction` and consumes the transaction builder.
    /// Returns an error if fields are missing or errors are encountered while building.
    ///
    pub fn build<R: Rng, L: LedgerScheme>(&self, ledger: &L, rng: &mut R) -> Result<Transaction<N>, TransactionError>
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
        // Return error.
        if !self.errors.is_empty() {
            // Print out all errors

            for err in &self.errors {
                println!("BuilderError: {:?}", err);
            }

            // Return builder fail.
            return Err(TransactionError::BuilderError);
        }

        // Get transaction kernel.
        let transaction_kernel = match self.transaction_kernel.get() {
            Some(value) => value,
            None => return Err(TransactionError::MissingField("transaction_kernel".to_string())),
        };

        // Check that the transaction is limited to `Components::NUM_INPUT_RECORDS` old_death_program_proofs.
        match self.old_death_program_proofs.len() {
            1 | 2 => {}
            num_inputs => {
                return Err(TransactionError::InvalidNumberOfInputProofs(
                    num_inputs,
                    N::Components::NUM_INPUT_RECORDS,
                ));
            }
        }

        // Check that the transaction has at least one output and is limited to `Components::NUM_OUTPUT_RECORDS` new_birth_program_proofs.
        match self.new_birth_program_proofs.len() {
            0 => return Err(TransactionError::MissingOutputs),
            1 | 2 => {}
            num_inputs => {
                return Err(TransactionError::InvalidNumberOfOutputProofs(
                    num_inputs,
                    N::Components::NUM_INPUT_RECORDS,
                ));
            }
        }

        // Get input proofs.
        let old_death_program_proofs = self.old_death_program_proofs.clone();

        // Get output proofs.
        let new_birth_program_proofs = self.new_birth_program_proofs.clone();

        // Load public parameters.
        let parameters = PublicParameters::<N::Components>::load(false)?;

        // Online execution to generate a DPC transaction
        let (_new_records, transaction) = DPC::<N::Components>::execute_online(
            &parameters,
            transaction_kernel.0.clone(),
            old_death_program_proofs,
            new_birth_program_proofs,
            ledger,
            rng,
        )?;

        Ok(Transaction::<N>(transaction))
    }
}
