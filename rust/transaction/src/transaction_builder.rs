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

use snarkvm_algorithms::{MerkleParameters, SignatureScheme, CRH, SNARK};
use snarkvm_dpc::{
    testnet1::{
        transaction::Transaction as DPCTransaction,
        BaseDPCComponents,
        InnerCircuitVerifierInput,
        OuterCircuitVerifierInput,
        PublicParameters,
        RecordEncryption,
    },
    DPCComponents,
    Network,
    TransactionScheme,
};
use snarkvm_parameters::{LedgerMerkleTreeParameters, Parameter};
use snarkvm_utilities::{to_bytes, FromBytes, ToBytes};

use once_cell::sync::OnceCell;
use std::sync::Arc;

/// A builder struct for the Transaction data type.
#[derive(Derivative)]
#[derivative(Default(bound = "E: Environment"), Debug(bound = "E: Environment"))]
pub struct TransactionBuilder<E: Environment> {
    pub(crate) network: OnceCell<Network>,
    pub(crate) ledger_digest: OnceCell<<Transaction<E> as TransactionScheme>::Digest>,
    pub(crate) old_serial_numbers: OnceCell<Vec<<Transaction<E> as TransactionScheme>::SerialNumber>>,
    pub(crate) new_commitments: OnceCell<Vec<<Transaction<E> as TransactionScheme>::Commitment>>,
    pub(crate) program_commitment: OnceCell<<Transaction<E> as TransactionScheme>::ProgramCommitment>,
    pub(crate) local_data_root: OnceCell<<Transaction<E> as TransactionScheme>::LocalDataRoot>,
    pub(crate) value_balance: OnceCell<<Transaction<E> as TransactionScheme>::ValueBalance>,
    pub(crate) signatures:
        OnceCell<Vec<<<E::Components as DPCComponents>::AccountSignature as SignatureScheme>::Output>>,
    pub(crate) encrypted_records: OnceCell<Vec<<Transaction<E> as TransactionScheme>::EncryptedRecord>>,
    pub(crate) transaction_proof: OnceCell<<<E::Components as BaseDPCComponents>::OuterSNARK as SNARK>::Proof>,
    pub(crate) memorandum: OnceCell<<Transaction<E> as TransactionScheme>::Memorandum>,
    pub(crate) inner_circuit_id: OnceCell<<Transaction<E> as TransactionScheme>::InnerCircuitID>,

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
        if self.network.set(network).is_err() {
            self.errors.push(TransactionError::DuplicateArgument(format!(
                "network: {}",
                network.to_string()
            )))
        }
        self
    }

    ///
    /// Returns a new transaction builder and sets field `ledger_digest`.
    ///
    pub fn ledger_digest(mut self, ledger_digest: <Transaction<E> as TransactionScheme>::Digest) -> Self {
        if self.ledger_digest.set(ledger_digest).is_err() {
            self.errors.push(TransactionError::DuplicateArgument(format!(
                "ledger_digest: {}",
                ledger_digest.to_string()
            )))
        }
        self
    }

    ///
    /// Returns a new transaction builder and sets field `old_serial_numbers`.
    ///
    pub fn old_serial_numbers(
        mut self,
        old_serial_numbers: Vec<<Transaction<E> as TransactionScheme>::SerialNumber>,
    ) -> Self {
        let old_serial_numbers_string = old_serial_numbers
            .iter()
            .map(|number| hex::encode(to_bytes![number].unwrap()))
            .collect::<Vec<String>>()
            .join(", ");

        if self.old_serial_numbers.set(old_serial_numbers).is_err() {
            self.errors.push(TransactionError::DuplicateArgument(format!(
                "old_serial_numbers: {}",
                old_serial_numbers_string
            )))
        }

        self
    }

    ///
    /// Returns a new transaction builder and sets field `new_commitments`.
    ///
    pub fn new_commitments(mut self, new_commitments: Vec<<Transaction<E> as TransactionScheme>::Commitment>) -> Self {
        let new_commitments_string = new_commitments
            .iter()
            .map(|commitment| hex::encode(to_bytes![commitment].unwrap()))
            .collect::<Vec<String>>()
            .join(", ");

        if self.new_commitments.set(new_commitments).is_err() {
            self.errors.push(TransactionError::DuplicateArgument(format!(
                "new_commitments: {}",
                new_commitments_string
            )))
        }

        self
    }

    ///
    /// Returns a new transaction builder and sets field `program_commitment`.
    ///
    pub fn program_commitment(
        mut self,
        program_commitment: <Transaction<E> as TransactionScheme>::ProgramCommitment,
    ) -> Self {
        let program_commitment_string = hex::encode(to_bytes![program_commitment].unwrap());
        if self.program_commitment.set(program_commitment).is_err() {
            self.errors.push(TransactionError::DuplicateArgument(format!(
                "program_commitment: {}",
                program_commitment_string
            )))
        }
        self
    }

    ///
    /// Returns a new transaction builder and sets field `local_data_root`.
    ///
    pub fn local_data_root(mut self, local_data_root: <Transaction<E> as TransactionScheme>::LocalDataRoot) -> Self {
        if self.local_data_root.set(local_data_root).is_err() {
            self.errors.push(TransactionError::DuplicateArgument(format!(
                "local_data_root: {}",
                local_data_root.to_string()
            )))
        }
        self
    }

    ///
    /// Returns a new transaction builder and sets field `value_balance`.
    ///
    pub fn value_balance(mut self, value_balance: <Transaction<E> as TransactionScheme>::ValueBalance) -> Self {
        if self.value_balance.set(value_balance).is_err() {
            self.errors.push(TransactionError::DuplicateArgument(format!(
                "value_balance: {}",
                value_balance.to_string()
            )))
        }
        self
    }

    ///
    /// Returns a new transaction builder and sets field `signatures`.
    ///
    pub fn signatures(
        mut self,
        signatures: Vec<<<E::Components as DPCComponents>::AccountSignature as SignatureScheme>::Output>,
    ) -> Self {
        let signatures_string = signatures
            .iter()
            .map(|signature| hex::encode(to_bytes![signature].unwrap()))
            .collect::<Vec<String>>()
            .join(", ");

        if self.signatures.set(signatures).is_err() {
            self.errors.push(TransactionError::DuplicateArgument(format!(
                "signatures: {}",
                signatures_string
            )))
        }

        self
    }

    ///
    /// Returns a new transaction builder and sets field `encrypted_records`.
    ///
    pub fn encrypted_records(
        mut self,
        encrypted_records: Vec<<Transaction<E> as TransactionScheme>::EncryptedRecord>,
    ) -> Self {
        let encrypted_records_string = encrypted_records
            .iter()
            .map(|encrypted_record| hex::encode(to_bytes![encrypted_record].unwrap()))
            .collect::<Vec<String>>()
            .join(", ");

        if self.encrypted_records.set(encrypted_records).is_err() {
            self.errors.push(TransactionError::DuplicateArgument(format!(
                "encrypted_records: {}",
                encrypted_records_string
            )))
        }
        self
    }

    ///
    /// Returns a new transaction builder and sets field `memorandum`.
    ///
    pub fn transaction_proof(
        mut self,
        transaction_proof: <<E::Components as BaseDPCComponents>::OuterSNARK as SNARK>::Proof,
    ) -> Self {
        let transaction_proof_string = hex::encode(to_bytes![transaction_proof].unwrap());

        if self.transaction_proof.set(transaction_proof).is_err() {
            self.errors.push(TransactionError::DuplicateArgument(format!(
                "transaction_proof: {}",
                hex::encode(transaction_proof_string)
            )))
        }
        self
    }

    ///
    /// Returns a new transaction builder and sets field `memorandum`.
    ///
    pub fn memorandum(mut self, memorandum: <Transaction<E> as TransactionScheme>::Memorandum) -> Self {
        if self.memorandum.set(memorandum).is_err() {
            self.errors.push(TransactionError::DuplicateArgument(format!(
                "memorandum: {}",
                hex::encode(memorandum)
            )))
        }
        self
    }

    ///
    /// Returns a new transaction builder and sets field `inner_circuit_id`.
    ///
    pub fn inner_circuit_id(mut self, inner_circuit_id: <Transaction<E> as TransactionScheme>::InnerCircuitID) -> Self {
        if self.inner_circuit_id.set(inner_circuit_id).is_err() {
            self.errors.push(TransactionError::DuplicateArgument(format!(
                "inner_circuit_id: {}",
                inner_circuit_id.to_string()
            )))
        }
        self
    }

    ///
    /// Returns a `Transaction` and consumes the transaction builder.
    /// Returns an error if fields are missing or errors are encountered while building.
    ///
    pub fn build(mut self) -> Result<Transaction<E>, TransactionError> {
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
        let network = match self.network.take() {
            Some(value) => value,
            None => return Err(TransactionError::MissingField("network".to_string())),
        };

        // Get ledger_digest
        let ledger_digest = match self.ledger_digest.take() {
            Some(value) => value,
            None => return Err(TransactionError::MissingField("ledger_digest".to_string())),
        };

        // Get old_serial_numbers
        let old_serial_numbers = match self.old_serial_numbers.take() {
            Some(value) => value,
            None => return Err(TransactionError::MissingField("old_serial_numbers".to_string())),
        };

        // Get new_commitments
        let new_commitments = match self.new_commitments.take() {
            Some(value) => value,
            None => return Err(TransactionError::MissingField("new_commitments".to_string())),
        };

        // Get program_commitment
        let program_commitment = match self.program_commitment.take() {
            Some(value) => value,
            None => return Err(TransactionError::MissingField("program_commitment".to_string())),
        };

        // Get local_data_root
        let local_data_root = match self.local_data_root.take() {
            Some(value) => value,
            None => return Err(TransactionError::MissingField("local_data_root".to_string())),
        };

        // Get value_balance
        let value_balance = match self.value_balance.take() {
            Some(value) => value,
            None => return Err(TransactionError::MissingField("value_balance".to_string())),
        };

        // Get signatures
        let signatures = match self.signatures.take() {
            Some(value) => value,
            None => return Err(TransactionError::MissingField("signatures".to_string())),
        };

        // Get encrypted_records
        let encrypted_records = match self.encrypted_records.take() {
            Some(value) => value,
            None => return Err(TransactionError::MissingField("encrypted_records".to_string())),
        };

        // Get transaction_proof
        // todo (collin): generate this field automatically
        let transaction_proof = match self.transaction_proof.take() {
            Some(value) => value,
            None => return Err(TransactionError::MissingField("transaction_proof".to_string())),
        };

        // Get memorandum
        let memorandum = match self.memorandum.take() {
            Some(value) => value,
            None => return Err(TransactionError::MissingField("memorandum".to_string())),
        };

        // Get inner_circuit_id
        let inner_circuit_id = match self.inner_circuit_id.take() {
            Some(value) => value,
            None => return Err(TransactionError::MissingField("inner_circuit_id".to_string())),
        };

        // Create candidate transaction
        let transaction = DPCTransaction::<E::Components>::new(
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

        // Load public parameters
        let parameters = PublicParameters::<<E as Environment>::Components>::load(false).unwrap();

        // Check transaction signature
        verify_transaction_signature::<E>(&parameters, &transaction)?;

        // Check transaction proof
        verify_transaction_proof::<E>(&parameters, &transaction)?;

        Ok(Transaction::<E> { transaction })
    }
}

// todo (collin) move this method to snarkvm
pub(crate) fn verify_transaction_signature<E: Environment>(
    parameters: &PublicParameters<E::Components>,
    transaction: &DPCTransaction<E::Components>,
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
        if !<<E as Environment>::Components as DPCComponents>::AccountSignature::verify(
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

pub(crate) fn verify_transaction_proof<E: Environment>(
    parameters: &PublicParameters<E::Components>,
    transaction: &DPCTransaction<E::Components>,
) -> Result<(), TransactionError> {
    // Load ledger parameters from snarkvm-parameters
    let crh_parameters =
        <<<<E as Environment>::Components as BaseDPCComponents>::MerkleParameters as MerkleParameters>::H as CRH>::Parameters::read(&LedgerMerkleTreeParameters::load_bytes().unwrap()[..]).unwrap();
    let merkle_tree_hash_parameters =
        <<E::Components as BaseDPCComponents>::MerkleParameters as MerkleParameters>::H::from(crh_parameters);
    let ledger_parameters = Arc::new(From::from(merkle_tree_hash_parameters));

    // Construct the ciphertext hashes
    let mut new_encrypted_record_hashes = Vec::with_capacity(E::Components::NUM_OUTPUT_RECORDS);
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

    let inner_snark_vk: <<E::Components as BaseDPCComponents>::InnerSNARK as SNARK>::VerifyingKey =
        parameters.inner_snark_parameters.1.clone().into();

    let inner_circuit_id = <<E as Environment>::Components as DPCComponents>::InnerCircuitIDCRH::hash(
        &parameters.system_parameters.inner_circuit_id_crh,
        &to_bytes![inner_snark_vk]?,
    )?;

    let outer_snark_input = OuterCircuitVerifierInput {
        inner_snark_verifier_input: inner_snark_input,
        inner_circuit_id,
    };

    if !<<E as Environment>::Components as BaseDPCComponents>::OuterSNARK::verify(
        &parameters.outer_snark_parameters.1,
        &outer_snark_input,
        &transaction.transaction_proof,
    )? {
        return Err(TransactionError::InvalidProof);
    }

    Ok(())
}
