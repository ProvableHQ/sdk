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
    MerkleParameters,
    SignatureScheme,
    CRH,
    SNARK,
};
use snarkvm_dpc::{
    testnet1::{
        transaction::Transaction as DPCTransaction,
        BaseDPCComponents,
        InnerCircuitVerifierInput,
        OuterCircuitVerifierInput,
        PrivateProgramInput,
        PublicParameters,
        RecordEncryption,
        DPC,
    },
    DPCComponents,
    DPCScheme,
    LedgerScheme,
    TransactionScheme,
};
use snarkvm_parameters::{LedgerMerkleTreeParameters, Parameter};
use snarkvm_utilities::{to_bytes, FromBytes, ToBytes};

use once_cell::sync::OnceCell;
use rand::Rng;
use std::sync::Arc;

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
    /// Returns a new transaction builder and sets field `network: Network`.
    /// Otherwise, logs a `TransactionError`.
    ///
    pub fn transaction_kernel(mut self, transaction_kernel: TransactionKernel<N>) -> Self {
        let transaction_kernel_string = format!("transaction_kernel: {}", transaction_kernel.to_string());
        if self.transaction_kernel.set(transaction_kernel).is_err() {
            self.errors
                .push(TransactionError::DuplicateArgument(transaction_kernel_string));
        }
        self
    }

    ///
    /// Returns a new transaction builder with the added vector of old_death_program_proofs
    /// Otherwise, logs a `TransactionError`.
    ///
    pub fn add_old_death_program_proofs(self, old_death_program_proofs: Vec<PrivateProgramInput>) -> Self {
        let mut new = self;
        for old_death_program_proof in old_death_program_proofs {
            let temp = new.add_old_death_program_proof(old_death_program_proof);
            new = temp;
        }
        new
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
    pub fn build<R: Rng, L: LedgerScheme>(mut self, ledger: &L, rng: &mut R) -> Result<Transaction<N>, TransactionError>
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

            for err in self.errors {
                println!("BuilderError: {:?}", err);
            }

            // Return builder fail.
            return Err(TransactionError::BuilderError);
        }

        // Get transaction kernel.
        let transaction_kernel = match self.transaction_kernel.take() {
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
            transaction_kernel.transaction_kernel,
            old_death_program_proofs,
            new_birth_program_proofs,
            ledger,
            rng,
        )?;

        // Check transaction signature
        verify_transaction_signature::<N>(&parameters, &transaction)?;

        // Check transaction proof
        verify_transaction_proof::<N>(&parameters, &transaction)?;

        Ok(Transaction::<N> { transaction })
    }
}

// todo: should these methods be moved to snarkvm?
pub(crate) fn verify_transaction_signature<N: Network>(
    parameters: &PublicParameters<N::Components>,
    transaction: &DPCTransaction<N::Components>,
) -> Result<(), TransactionError> {
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
    for (pk, sig) in transaction.old_serial_numbers().iter().zip(&transaction.signatures) {
        if !<<N as Network>::Components as DPCComponents>::AccountSignature::verify(
            account_signature,
            pk,
            signature_message,
            sig,
        )? {
            return Err(TransactionError::InvalidSignature);
        }
    }

    Ok(())
}

pub(crate) fn verify_transaction_proof<N: Network>(
    parameters: &PublicParameters<N::Components>,
    transaction: &DPCTransaction<N::Components>,
) -> Result<(), TransactionError> {
    // Load ledger parameters from snarkvm-parameters
    let crh_parameters =
        <<<<N as Network>::Components as BaseDPCComponents>::MerkleParameters as MerkleParameters>::H as CRH>::Parameters::read(&LedgerMerkleTreeParameters::load_bytes().unwrap()[..]).unwrap();
    let merkle_tree_hash_parameters =
        <<N::Components as BaseDPCComponents>::MerkleParameters as MerkleParameters>::H::from(crh_parameters);
    let ledger_parameters = Arc::new(From::from(merkle_tree_hash_parameters));

    // Construct the ciphertext hashes
    let mut new_encrypted_record_hashes = Vec::with_capacity(N::Components::NUM_OUTPUT_RECORDS);
    for encrypted_record in &transaction.encrypted_records {
        let encrypted_record_hash =
            RecordEncryption::encrypted_record_hash(&parameters.system_parameters, encrypted_record)?;

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

    let inner_snark_vk: <<N::Components as BaseDPCComponents>::InnerSNARK as SNARK>::VerifyingKey =
        parameters.inner_snark_parameters.1.clone().into();

    let inner_circuit_id = <<N as Network>::Components as DPCComponents>::InnerCircuitIDCRH::hash(
        &parameters.system_parameters.inner_circuit_id_crh,
        &to_bytes![inner_snark_vk]?,
    )?;

    let outer_snark_input = OuterCircuitVerifierInput {
        inner_snark_verifier_input: inner_snark_input,
        inner_circuit_id,
    };

    if !<<N as Network>::Components as BaseDPCComponents>::OuterSNARK::verify(
        &parameters.outer_snark_parameters.1,
        &outer_snark_input,
        &transaction.transaction_proof,
    )? {
        return Err(TransactionError::InvalidProof);
    }

    Ok(())
}
