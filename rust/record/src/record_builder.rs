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

use crate::RecordError;

use snarkvm_algorithms::CommitmentScheme;
use snarkvm_dpc::{address::Address, Network, Payload, Record};
use snarkvm_utilities::{to_bytes_le, ToBytes, UniformRand};

use once_cell::sync::OnceCell;
use rand::{CryptoRng, Rng};

/// A builder struct for the record data type.
#[derive(Derivative)]
#[derivative(Default(bound = "N: Network"), Debug(bound = "N: Network"))]
pub struct RecordBuilder<N: Network> {
    pub(crate) owner: OnceCell<Address<N>>,
    pub(crate) value: OnceCell<u64>,
    pub(crate) payload: OnceCell<Payload>,
    pub(crate) program_id: OnceCell<N::ProgramID>,
    pub(crate) serial_number_nonce: OnceCell<N::SerialNumber>,
    pub(crate) commitment_randomness: OnceCell<<N::CommitmentScheme as CommitmentScheme>::Randomness>,
    pub(crate) commitment: OnceCell<N::Commitment>,

    pub(crate) errors: Vec<RecordError>,
}

impl<N: Network> RecordBuilder<N> {
    ///
    /// Returns a new record builder.
    /// To return a record and consume the record builder, call the `.build()` method.
    ///
    pub fn new() -> Self {
        Self { ..Default::default() }
    }

    ///
    /// Returns a new record builder and sets field `owner: Address`.
    ///
    pub fn owner<A: Into<Address<N>>>(mut self, owner: A) -> Self {
        if let Err(owner) = self.owner.set(owner.into()) {
            self.errors
                .push(RecordError::DuplicateArgument(format!("owner: {}", owner)));
        }
        self
    }

    ///
    /// Returns a new record builder and sets field `value: u64`.
    ///
    pub fn value(mut self, value: u64) -> Self {
        if let Err(value) = self.value.set(value) {
            self.errors
                .push(RecordError::DuplicateArgument(format!("value: {}", value)))
        }
        self
    }

    ///
    /// Returns a new record builder and sets field `payload: Payload`.
    ///
    pub fn payload(mut self, payload: Payload) -> Self {
        if let Err(_) = self.payload.set(payload) {
            self.errors.push(RecordError::DuplicateArgument(format!(
                "payload: {}",
                hex::encode(&to_bytes_le![payload].unwrap()[..])
            )))
        }
        self
    }

    ///
    /// Returns a new record builder and sets field `program_id: N::ProgramID`.
    ///
    pub fn program_id(mut self, program_id: N::ProgramID) -> Self {
        if let Err(_) = self.program_id.set(program_id) {
            self.errors.push(RecordError::DuplicateArgument(format!(
                "program_id: {}",
                hex::encode(&to_bytes_le![program_id].unwrap()[..])
            )))
        }
        self
    }

    ///
    /// Returns a new record builder and sets field `serial_number_nonce: N::SerialNumber`.
    ///
    pub fn serial_number_nonce(mut self, serial_number_nonce: N::SerialNumber) -> Self {
        if let Err(_) = self.serial_number_nonce.set(serial_number_nonce) {
            self.errors.push(RecordError::DuplicateArgument(format!(
                "serial_number_nonce: {}",
                hex::encode(&to_bytes_le![serial_number_nonce].unwrap()[..])
            )))
        }
        self
    }

    ///
    /// Returns a new record builder and sets field `commitment: RecordCommitment`.
    ///
    pub fn commitment(mut self, commitment: N::Commitment) -> Self {
        if let Err(_) = self.commitment.set(commitment) {
            self.errors.push(RecordError::DuplicateArgument(format!(
                "commitment: {}",
                hex::encode(&to_bytes_le![commitment].unwrap()[..])
            )))
        }
        self
    }

    ///
    /// Returns a new record builder and sets field `commitment_randomness: CommitmentRandomness`.
    ///
    pub fn commitment_randomness(
        mut self,
        commitment_randomness: <N::CommitmentScheme as CommitmentScheme>::Randomness,
    ) -> Self {
        if let Err(_) = self.commitment_randomness.set(commitment_randomness) {
            self.errors.push(RecordError::DuplicateArgument(format!(
                "commitment_randomness: {}",
                hex::encode(&to_bytes_le![commitment_randomness].unwrap()[..])
            )))
        }
        self
    }

    ///
    /// Returns a new record builder and calculates a new `commitment_randomness: CommitmentRandomness`.
    ///
    pub fn calculate_commitment_randomness<R: Rng + CryptoRng>(self, rng: &mut R) -> Self {
        // Sample new commitment randomness.
        let commitment_randomness = <N::CommitmentScheme as CommitmentScheme>::Randomness::rand(rng);

        self.commitment_randomness(commitment_randomness)
    }

    ///
    /// Returns a `Record` and consumes the record builder.
    /// Returns an error if fields are missing or errors are encountered while building.
    ///
    pub fn build(mut self) -> Result<Record<N>, RecordError> {
        // Return error.
        if !self.errors.is_empty() {
            // Print out all errors

            for err in self.errors {
                println!("BuilderError: {:?}", err);
            }

            // Return builder fail.
            return Err(RecordError::BuilderError);
        }

        // Get program_id
        let program_id = match self.program_id.take() {
            Some(program_id) => program_id,
            None => return Err(RecordError::MissingField("program_id".to_string())),
        };

        // Get owner
        let owner = match self.owner.take() {
            Some(value) => value,
            None => return Err(RecordError::MissingField("owner".to_string())),
        };

        // Get value
        let value = match self.value.take() {
            Some(value) => value,
            None => return Err(RecordError::MissingField("value".to_string())),
        };

        // Get payload
        let payload = match self.payload.take() {
            Some(payload) => payload,
            None => return Err(RecordError::MissingField("payload".to_string())),
        };

        // Get serial_number_nonce
        let serial_number_nonce = match self.serial_number_nonce.take() {
            Some(serial_number_nonce) => serial_number_nonce,
            None => return Err(RecordError::MissingField("serial_number_nonce".to_string())),
        };

        // Get commitment_randomness
        let commitment_randomness = match self.commitment_randomness.take() {
            Some(commitment_randomness) => commitment_randomness,
            None => return Err(RecordError::MissingRandomness),
        };

        // Build record.
        Ok(Record::from(
            owner,
            value,
            payload,
            program_id,
            serial_number_nonce,
            commitment_randomness,
        )?)
    }
}
