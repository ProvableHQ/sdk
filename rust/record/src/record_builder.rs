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

use crate::{Commitment, CommitmentRandomness, Payload, Record, RecordError, SerialNumberNonce};
use aleo_account::Address;

use rand::{CryptoRng, Rng};
use snarkvm_algorithms::traits::{CommitmentScheme, CRH};
use snarkvm_dpc::{
    base_dpc::instantiated::{Components, ProgramVerificationKeyCRH},
    DPCComponents,
    NoopProgramSNARKParameters,
    SystemParameters,
};
use snarkvm_utilities::{to_bytes, ToBytes, UniformRand};

/// A builder struct for the Aleo record data type.
#[derive(Default, Debug)]
pub struct RecordBuilder {
    pub(crate) owner: Option<Address>,
    pub(crate) is_dummy: Option<bool>,
    pub(crate) value: Option<u64>,

    pub(crate) payload: Option<Payload>,

    pub(crate) birth_program_id: Option<Vec<u8>>,
    pub(crate) death_program_id: Option<Vec<u8>>,

    pub(crate) serial_number_nonce: Option<SerialNumberNonce>,

    pub(crate) commitment: Option<Commitment>,
    pub(crate) commitment_randomness: Option<CommitmentRandomness>,
    pub(crate) errors: Vec<RecordError>,
}

impl RecordBuilder {
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
    pub fn owner<A: Into<Address>>(mut self, owner: A) -> Self {
        self.owner = Some(owner.into());
        self
    }

    ///
    /// Returns a new record builder and sets field `value: u64`.
    ///
    pub fn value(mut self, value: u64) -> Self {
        self.value = Some(value);
        self
    }

    ///
    /// Returns a new record builder and sets field `payload: RecordPayload`.
    ///
    pub fn payload(mut self, payload: Payload) -> Self {
        self.payload = Some(payload);
        self
    }

    ///
    /// Returns a new record builder and sets field `birth_program_id: Vec<u8>`.
    ///
    pub fn birth_program_id(mut self, birth_program_id: Vec<u8>) -> Self {
        self.birth_program_id = Some(birth_program_id);
        self
    }

    ///
    /// Returns a new record builder and sets field `death_program_id: Vec<u8>`.
    ///
    pub fn death_program_id(mut self, death_program_id: Vec<u8>) -> Self {
        self.death_program_id = Some(death_program_id);
        self
    }

    ///
    /// Returns a new record builder and sets field `serial_number_nonce: SerialNumberNonce`.
    ///
    pub fn serial_number_nonce(mut self, serial_number_nonce: SerialNumberNonce) -> Self {
        self.serial_number_nonce = Some(serial_number_nonce);
        self
    }

    ///
    /// Returns a new record builder and computes the field `serial_number_nonce: SerialNumberNonce`
    /// from the given inputs.
    ///
    pub fn calculate_serial_number_nonce<R: Rng>(
        mut self,
        parameters: SystemParameters<Components>,
        index: u8,
        joint_serial_numbers: Vec<u8>,
        rng: &mut R,
    ) -> Self {
        // Sample randomness sn_randomness for the CRH input.
        let sn_randomness: [u8; 32] = rng.gen();

        let crh_input = to_bytes![index, sn_randomness, joint_serial_numbers].unwrap();
        let sn_nonce =
            <Components as DPCComponents>::SerialNumberNonceCRH::hash(&parameters.serial_number_nonce, &crh_input)
                .unwrap();

        self.serial_number_nonce = Some(sn_nonce);
        self
    }

    ///
    /// Returns a new record builder and sets field `commitment: RecordCommitment`.
    ///
    pub fn commitment(mut self, commitment: Commitment) -> Self {
        self.commitment = Some(commitment);
        self
    }

    ///
    /// Returns a new record builder and sets field `commitment_randomness: CommitmentRandomness`.
    ///
    pub fn commitment_randomness(mut self, commitment_randomness: CommitmentRandomness) -> Self {
        self.commitment_randomness = Some(commitment_randomness);
        self
    }

    ///
    /// Returns a new record builder and calculates a new `commitment_randomness: CommitmentRandomness`.
    ///
    pub fn calculate_commitment_randomness<R: Rng + CryptoRng>(rng: &mut R) -> CommitmentRandomness {
        // Sample new commitment randomness.
        <<Components as DPCComponents>::RecordCommitment as CommitmentScheme>::Randomness::rand(rng)
    }

    ///
    /// Returns a new record builder and calculates the field `commitment: RecordCommitment` from
    /// the given `SystemParameters`.
    ///
    pub fn calculate_commitment<R: Rng + CryptoRng>(mut self, rng: Option<&mut R>) -> Self {
        // Try to compute record commitment.
        if self.can_calculate_commitment() {
            // Check for commitment randomness or derive it.
            let commitment_randomness = match self.commitment_randomness {
                Some(randomness) => randomness,
                None => {
                    // Check for randomness
                    match rng {
                        Some(rng) => Self::calculate_commitment_randomness(rng),
                        None => {
                            // Attempted to calculate commitment without commitment randomness.
                            self.errors.push(RecordError::MissingRandomness);

                            return self;
                        }
                    }
                }
            };

            self.commitment_randomness = Some(commitment_randomness);

            // Compute the commitment.
            let commitment = {
                let system_parameters = SystemParameters::<Components>::load().unwrap();

                // Total = 32 + 1 + 8 + 32 + 48 + 48 + 32 = 201 bytes
                let commitment_input = to_bytes![
                    self.owner.as_ref().unwrap().to_bytes(),    // 256 bits = 32 bytes
                    self.is_dummy.as_ref().unwrap(),            // 1 bit = 1 byte
                    self.value.as_ref().unwrap(),               // 64 bits = 8 bytes
                    self.payload.as_ref().unwrap(),             // 256 bits = 32 bytes
                    self.birth_program_id.as_ref().unwrap(),    // 384 bits = 48 bytes
                    self.death_program_id.as_ref().unwrap(),    // 384 bits = 48 bytes
                    self.serial_number_nonce.as_ref().unwrap()  // 256 bits = 32 bytes
                ]
                .unwrap();

                <Components as DPCComponents>::RecordCommitment::commit(
                    &system_parameters.record_commitment,
                    &commitment_input,
                    &self.commitment_randomness.as_ref().unwrap(),
                )
                .unwrap()
            };
            self.commitment = Some(commitment);
        }

        self
    }

    ///
    /// Returns `true` if the record builder has enough information to compute the record commitment.
    ///
    pub fn can_calculate_commitment(&self) -> bool {
        self.owner.is_some()
            && self.is_dummy.is_some()
            && self.value.is_some()
            && self.payload.is_some()
            && self.birth_program_id.is_some()
            && self.death_program_id.is_some()
            && self.serial_number_nonce.is_some()
    }

    ///
    /// Returns `true` if the record builder can check that a commitment is correct.
    ///
    pub fn can_check_commitment(&self) -> bool {
        self.can_calculate_commitment() && self.commitment_randomness.is_some()
    }

    ///
    /// Returns a `Record` and consumes the record builder.
    /// Returns an error if fields are missing or error are encountered while building.
    ///
    pub fn build(self) -> Result<Record, RecordError> {
        // Return error.
        if !self.errors.is_empty() {
            // Print out all error

            for err in self.errors {
                println!("BuilderError: {:?}", err);
            }

            // Return builder fail.
            return Err(RecordError::BuilderError);
        }

        let value = match self.value {
            Some(value) => value,
            None => return Err(RecordError::MissingField("value".to_string())),
        };

        let payload = match self.payload {
            Some(payload) => payload,
            None => return Err(RecordError::MissingField("payload".to_string())),
        };

        let birth_program_id = match self.birth_program_id {
            Some(birth_program_id) => birth_program_id,
            None => return Err(RecordError::MissingField("birth_program_id".to_string())),
        };

        let death_program_id = match self.death_program_id {
            Some(death_program_id) => death_program_id,
            None => return Err(RecordError::MissingField("death_program_id".to_string())),
        };

        // Canonically derive noop_program_id.
        let system_parameters = SystemParameters::<Components>::load()?;
        let program_snark_pp = NoopProgramSNARKParameters::<Components>::load()?;

        let noop_program_id = to_bytes![
            ProgramVerificationKeyCRH::hash(
                &system_parameters.program_verification_key_crh,
                &to_bytes![program_snark_pp.verification_key].unwrap()
            )
            .unwrap()
        ]
        .unwrap();

        // Derive is_dummy.
        let is_dummy = (value == 0)
            && (payload == Payload::default())
            && (birth_program_id == noop_program_id)
            && (death_program_id == noop_program_id);

        let commitment_randomness = match self.commitment_randomness {
            Some(commitment_randomness) => commitment_randomness,
            None => return Err(RecordError::MissingRandomness),
        };

        // Derive commitment
        let can_check_commitment = self.can_check_commitment();
        let commitment: Commitment = match self.commitment {
            Some(commitment) => {
                // Check record commitment
                // Log an error if the commitment is invalid
                if can_check_commitment {
                    let expected = self.calculate_commitment_helper();

                    if expected == commitment {
                        commitment
                    } else {
                        return Err(RecordError::InvalidCommitment);
                    }
                } else {
                    return Err(RecordError::CannotVerifyCommitment);
                }
            }
            None => {
                // Compute record commitment
                self.calculate_commitment_helper()
            }
        };

        // TODO: 1. Derive is_dummy. 2. Check that the commitment is valid.
        // // Set record value to 0 for dummy records.
        // if is_dummy {
        //     match self.value {
        //         Some(value) => {
        //             if value == 0 {
        //                 // Value is already 0, do nothing
        //             } else {
        //                 // Value is non-zero, return an error
        //                 self.errors.push(RecordError::NonZeroValue);
        //             }
        //         }
        //         None => return self.value(Record::ZERO_VALUE),
        //     }
        // }
        //
        // // Try to check record commitment.
        // // Log an error if we cannot check the commitment.
        // if self.can_check_commitment() {
        //     let expected = self.calculate_commitment_helper();
        //
        //     if expected == commitment {
        //         self.commitment = Some(commitment);
        //     } else {
        //         self.errors.push(RecordError::InvalidCommitment);
        //     }
        // } else {
        //     self.errors.push(RecordError::CannotVerifyCommitment);
        // }

        // Build record.
        Ok(Record {
            owner: self
                .owner
                .ok_or_else(|| RecordError::MissingField("owner".to_string()))?,
            is_dummy,
            value,
            payload,
            birth_program_id,
            death_program_id,
            serial_number_nonce: self
                .serial_number_nonce
                .ok_or_else(|| RecordError::MissingField("serial_number_nonce".to_string()))?,
            commitment,
            commitment_randomness,
        })
    }
}
