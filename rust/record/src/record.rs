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
use aleo_account::{Address, PrivateKey};

use rand::{CryptoRng, Rng};
use snarkvm_algorithms::traits::{CommitmentScheme, CRH};
use snarkvm_dpc::{
    base_dpc::{instantiated::Components, record_payload::RecordPayload},
    DPCComponents,
    PublicParameters,
    SystemParameters,
};
use snarkvm_utilities::{to_bytes, ToBytes, UniformRand};
use std::{fmt, str::FromStr};

pub type SerialNumberNonce = Vec<u8>;
pub type RecordCommitment = Vec<u8>;
pub type CommitmentRandomness = Vec<u8>;

/// The Aleo record data type.
#[derive(Default, Debug, Clone, PartialEq, Eq)]
pub struct Record {
    pub(crate) owner: Address,
    pub(crate) is_dummy: bool,
    pub(crate) value: u64,

    pub(crate) payload: RecordPayload,

    pub(crate) birth_program_id: Vec<u8>,
    pub(crate) death_program_id: Vec<u8>,

    pub(crate) serial_number_nonce: SerialNumberNonce,
    pub(crate) commitment: RecordCommitment,
    pub(crate) commitment_randomness: CommitmentRandomness,
}

/// A builder struct for the Aleo record data type.
#[derive(Default, Debug)]
pub struct RecordBuilder {
    pub(crate) owner: Option<Address>,
    pub(crate) is_dummy: Option<bool>,
    pub(crate) value: Option<u64>,

    pub(crate) payload: Option<RecordPayload>,

    pub(crate) birth_program_id: Option<Vec<u8>>,
    pub(crate) death_program_id: Option<Vec<u8>>,

    pub(crate) serial_number_nonce: Option<SerialNumberNonce>,

    pub(crate) commitment: Option<RecordCommitment>,
    pub(crate) commitment_randomness: Option<CommitmentRandomness>,
    pub(crate) errors: Vec<RecordError>,
}

impl Record {
    pub(crate) const ZERO_VALUE: u64 = 0;

    ///
    /// Returns a new record using the record builder.
    ///
    #[allow(clippy::too_many_arguments)]
    pub fn new(
        owner: Address,
        is_dummy: bool,
        value: u64,
        payload: RecordPayload,
        birth_program_id: Vec<u8>,
        death_program_id: Vec<u8>,
        serial_number_nonce: SerialNumberNonce,
        commitment: RecordCommitment,
        commitment_randomness: CommitmentRandomness,
    ) -> Result<Record, RecordError> {
        RecordBuilder::new()
            .owner(owner)
            .is_dummy(is_dummy) // Return dummy record by default
            .value(value)
            .payload(payload)
            .birth_program_id(birth_program_id)
            .death_program_id(death_program_id)
            .serial_number_nonce(serial_number_nonce)
            .commitment(commitment)
            .commitment_randomness(to_bytes![commitment_randomness].unwrap())
            .build()
    }

    ///
    /// Returns a new record using the record builder.
    /// Uses randomness to compute record commitment.
    ///
    #[allow(clippy::too_many_arguments)]
    pub fn generate_record<R: Rng + CryptoRng>(
        system_parameters: &SystemParameters<Components>,
        owner: Address,
        is_dummy: bool,
        value: u64,
        payload: RecordPayload,
        birth_program_id: Vec<u8>,
        death_program_id: Vec<u8>,
        serial_number_nonce: SerialNumberNonce,
        rng: &mut R,
    ) -> Result<Record, RecordError> {
        // Sample new commitment randomness.
        let commitment_randomness =
            <<Components as DPCComponents>::RecordCommitment as CommitmentScheme>::Randomness::rand(rng);

        // Total = 32 + 1 + 8 + 32 + 48 + 48 + 32 = 201 bytes
        let commitment_input = to_bytes![
            owner.to_bytes(),    // 256 bits = 32 bytes
            is_dummy,            // 1 bit = 1 byte
            value,               // 64 bits = 8 bytes
            payload,             // 256 bits = 32 bytes
            birth_program_id,    // 384 bits = 48 bytes
            death_program_id,    // 384 bits = 48 bytes
            serial_number_nonce  // 256 bits = 32 bytes
        ]
        .unwrap();

        let commitment = to_bytes![
            <Components as DPCComponents>::RecordCommitment::commit(
                &system_parameters.record_commitment,
                &commitment_input,
                &commitment_randomness,
            )
            .unwrap()
        ]
        .unwrap();

        Self::new(
            owner,
            is_dummy,
            value,
            payload,
            birth_program_id,
            death_program_id,
            serial_number_nonce,
            commitment,
            to_bytes![commitment_randomness].unwrap(),
        )
    }

    ///
    /// Returns a new dummy record using the record builder. (this method should not fail)
    ///
    pub fn dummy<R: Rng + CryptoRng>(rng: &mut R) -> Record {
        // Set address
        let private_key = PrivateKey::new(rng).unwrap();
        let owner = Address::from(&private_key).unwrap();

        // Set is_dummy.
        let is_dummy = true;

        // Set value.
        let value = 0u64;

        // Set payload.
        let payload = RecordPayload::default();

        let parameters = PublicParameters::<Components>::load(true).unwrap();

        // Set birth_program_id and death_program_id.
        let noop_program_id = to_bytes![
            parameters
                .system_parameters
                .program_verification_key_crh
                .hash(&to_bytes![parameters.noop_program_snark_parameters.verification_key].unwrap())
                .unwrap()
        ]
        .unwrap();

        let birth_program_id = noop_program_id.clone();
        let death_program_id = noop_program_id;

        // Set serial_number_nonce.
        let sn_randomness: [u8; 32] = rng.gen();
        let old_sn_nonce = parameters
            .system_parameters
            .serial_number_nonce
            .hash(&sn_randomness)
            .unwrap();

        let serial_number_nonce = to_bytes![old_sn_nonce].unwrap();

        Record::generate_record(
            &parameters.system_parameters,
            owner,
            is_dummy,
            value,
            payload,
            birth_program_id,
            death_program_id,
            serial_number_nonce,
            rng,
        )
        .expect("Default record should not fail")
    }
}

impl fmt::Display for Record {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        writeln!(f, "Record {{")?;
        writeln!(f, "\t owner: {}", self.owner.to_string())?;
        writeln!(f, "\t is_dummy: {:?}", self.is_dummy)?;
        writeln!(f, "\t value: {:?}", self.value)?;
        writeln!(f, "\t payload: {:?}", self.payload)?;
        writeln!(f, "\t birth_program_id: {:?}", self.birth_program_id)?;
        writeln!(f, "\t death_program_id: {:?}", self.death_program_id)?;
        writeln!(f, "\t serial_number_nonce: {:?}", self.serial_number_nonce)?;
        writeln!(f, "\t commitment: {:?}", self.commitment)?;
        writeln!(f, "\t commitment_randomness: {:?}", self.commitment_randomness)?;
        write!(f, "}}")
    }
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
    pub fn owner(mut self, owner: Address) -> Self {
        self.owner = Some(owner);

        self
    }

    ///
    /// Returns a new record builder and sets field `owner: Address` from the given string.
    ///
    pub fn owner_string(mut self, owner: &str) -> Self {
        let owner = Address::from_str(owner);

        if owner.is_ok() {
            self.owner = Some(owner.expect("checked unwrap owner"));
        } else {
            let err = owner.err().expect("checked unwrap owner error");

            self.errors.push(RecordError::AddressError(err));
        }

        self
    }

    ///
    /// Returns a new record builder and sets field `is_dummy: bool`.
    ///
    pub fn is_dummy(mut self, is_dummy: bool) -> Self {
        self.is_dummy = Some(is_dummy);

        // Set record value to 0 for dummy records.
        if is_dummy {
            match self.value {
                Some(value) => {
                    if value == 0 {
                        // Value is already 0, do nothing
                    } else {
                        // Value is non-zero, return an error
                        self.errors.push(RecordError::NonZeroValue);
                    }
                }
                None => return self.value_zero(),
            }
        }

        self
    }

    ///
    /// Returns a new record builder and sets field `value: u64`.
    ///
    pub fn value(mut self, value: u64) -> Self {
        self.value = Some(value);

        // Set is_dummy to false for records with non-zero value.
        if value != Record::ZERO_VALUE {
            match self.is_dummy {
                Some(is_dummy) => {
                    if is_dummy {
                        // Dummy records must have a zero value, return an error
                        self.errors.push(RecordError::DummyMustBeZero(value));
                    }
                }
                None => return self.is_dummy(false),
            }
        }

        self
    }

    ///
    /// Returns a new record builder and sets field `value: 0u64`.
    ///
    pub fn value_zero(self) -> Self {
        self.value(Record::ZERO_VALUE)
    }

    ///
    /// Returns a new record builder and sets field `payload: RecordPayload`.
    ///
    pub fn payload(mut self, payload: RecordPayload) -> Self {
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
    /// Returns a new record builder and sets field `commitment: RecordCommitment`.
    ///
    pub fn commitment(mut self, commitment: RecordCommitment) -> Self {
        self.commitment = Some(commitment);

        self
    }

    ///
    /// Returns a new record builder and sets field `commitment_randomness: SerialNumberNonce`.
    ///
    pub fn commitment_randomness(mut self, commitment_randomness: CommitmentRandomness) -> Self {
        self.commitment_randomness = Some(commitment_randomness);

        self
    }

    ///
    /// Returns a `Record` and consumes the record builder.
    /// Returns an error if fields are missing or errors are encountered while building.
    ///
    pub fn build(self) -> Result<Record, RecordError> {
        // Return errors.
        if !self.errors.is_empty() {
            // Print out all errors

            for err in self.errors {
                println!("Builder Error: {:?}", err);
            }

            // Return builder fail.
            return Err(RecordError::BuilderError);
        }

        // Build record.
        Ok(Record {
            owner: self
                .owner
                .ok_or_else(|| RecordError::MissingField("owner".to_string()))?,
            is_dummy: self
                .is_dummy
                .ok_or_else(|| RecordError::MissingField("is_dummy".to_string()))?,
            value: self
                .value
                .ok_or_else(|| RecordError::MissingField("value".to_string()))?,
            payload: self
                .payload
                .ok_or_else(|| RecordError::MissingField("payload".to_string()))?,
            birth_program_id: self
                .birth_program_id
                .ok_or_else(|| RecordError::MissingField("birth_program_id".to_string()))?,
            death_program_id: self
                .death_program_id
                .ok_or_else(|| RecordError::MissingField("death_program_id".to_string()))?,
            serial_number_nonce: self
                .serial_number_nonce
                .ok_or_else(|| RecordError::MissingField("serial_number_nonce".to_string()))?,
            commitment: self
                .commitment
                .ok_or_else(|| RecordError::MissingField("commitment".to_string()))?,
            commitment_randomness: self
                .commitment_randomness
                .ok_or_else(|| RecordError::MissingField("commitment_randomness".to_string()))?,
        })
    }
}

// impl Default for RecordBuilder {
//     ///
//     /// Returns an empty RecordBuilder.
//     ///
//     fn default() -> Self {
//         RecordBuilder {
//             owner: None,
//             is_dummy: None,
//             value: None,
//             payload: None,
//             birth_program_id: None,
//             death_program_id: None,
//             serial_number_nonce: None,
//             commitment: None,
//             commitment_randomness: None,
//             errors: Vec::new(),
//         }
//     }
// }

#[cfg(test)]
mod tests {
    use super::*;

    use rand::{rngs::StdRng, SeedableRng};

    #[test]
    fn test_build_record() {
        let rng = &mut StdRng::from_entropy();
        let r = Record::dummy(rng);

        println!("{}", r);
    }

    #[test]
    fn test_owner_string() {
        let rng = &mut StdRng::from_entropy();
        let private_key = PrivateKey::new(rng).unwrap();
        let owner = Address::from(&private_key).unwrap();

        // Set is_dummy.
        let is_dummy = true;

        // Set value.
        let value = 0u64;

        // Set payload.
        let payload = RecordPayload::default();

        let parameters = PublicParameters::<Components>::load(true).unwrap();

        // Set birth_program_id and death_program_id.
        let noop_program_id = to_bytes![
            parameters
                .system_parameters
                .program_verification_key_crh
                .hash(&to_bytes![parameters.noop_program_snark_parameters.verification_key].unwrap())
                .unwrap()
        ]
        .unwrap();

        let birth_program_id = noop_program_id.clone();
        let death_program_id = noop_program_id;

        // Set serial_number_nonce.
        let sn_randomness: [u8; 32] = rng.gen();
        let old_sn_nonce = parameters
            .system_parameters
            .serial_number_nonce
            .hash(&sn_randomness)
            .unwrap();

        let serial_number_nonce = to_bytes![old_sn_nonce].unwrap();

        // Sample new commitment randomness.
        let commitment_randomness =
            <<Components as DPCComponents>::RecordCommitment as CommitmentScheme>::Randomness::rand(rng);

        // Total = 32 + 1 + 8 + 32 + 48 + 48 + 32 = 201 bytes
        let commitment_input = to_bytes![
            owner.to_bytes(),    // 256 bits = 32 bytes
            is_dummy,            // 1 bit = 1 byte
            value,               // 64 bits = 8 bytes
            payload,             // 256 bits = 32 bytes
            birth_program_id,    // 384 bits = 48 bytes
            death_program_id,    // 384 bits = 48 bytes
            serial_number_nonce  // 256 bits = 32 bytes
        ]
        .unwrap();

        let commitment = to_bytes![
            <Components as DPCComponents>::RecordCommitment::commit(
                &parameters.system_parameters.record_commitment,
                &commitment_input,
                &commitment_randomness,
            )
            .unwrap()
        ]
        .unwrap();

        let r = RecordBuilder::new()
            .owner_string(&owner.to_string())
            .is_dummy(is_dummy) // Return dummy record by default
            .value(value)
            .payload(payload)
            .birth_program_id(birth_program_id)
            .death_program_id(death_program_id)
            .serial_number_nonce(serial_number_nonce)
            .commitment(commitment)
            .commitment_randomness(to_bytes![commitment_randomness].unwrap())
            .build().expect("Default record should not fail");

        println!("{}", r);
    }
}

//
// fn default_program_id<C: CRH>() -> Vec<u8> {
//     to_bytes![C::Output::default()].unwrap()
// }
//
// impl<C: BaseDPCComponents> Record for AleoRecord<C> {
//     type Commitment = <C::RecordCommitment as CommitmentScheme>::Output;
//     type CommitmentRandomness = <C::RecordCommitment as CommitmentScheme>::Randomness;
//     type Owner = AccountAddress<C>;
//     type Payload = RecordPayload;
//     type SerialNumber = <C::AccountSignature as SignatureScheme>::PublicKey;
//     type SerialNumberNonce = <C::SerialNumberNonceCRH as CRH>::Output;
//     type Value = u64;
//
//     fn owner(&self) -> &Self::Owner {
//         &self.owner
//     }
//
//     fn is_dummy(&self) -> bool {
//         self.is_dummy
//     }
//
//     fn payload(&self) -> &Self::Payload {
//         &self.payload
//     }
//
//     fn birth_program_id(&self) -> &[u8] {
//         &self.birth_program_id
//     }
//
//     fn death_program_id(&self) -> &[u8] {
//         &self.death_program_id
//     }
//
//     fn serial_number_nonce(&self) -> &Self::SerialNumberNonce {
//         &self.serial_number_nonce
//     }
//
//     fn commitment(&self) -> Self::Commitment {
//         self.commitment.clone()
//     }
//
//     fn commitment_randomness(&self) -> Self::CommitmentRandomness {
//         self.commitment_randomness.clone()
//     }
//
//     fn value(&self) -> Self::Value {
//         self.value
//     }
// }
//
// impl<C: BaseDPCComponents> ToBytes for AleoRecord<C> {
//     #[inline]
//     fn write<W: Write>(&self, mut writer: W) -> IoResult<()> {
//         self.owner.write(&mut writer)?;
//
//         self.is_dummy.write(&mut writer)?;
//         self.value.write(&mut writer)?;
//         self.payload.write(&mut writer)?;
//
//         variable_length_integer(self.birth_program_id.len() as u64).write(&mut writer)?;
//         self.birth_program_id.write(&mut writer)?;
//
//         variable_length_integer(self.death_program_id.len() as u64).write(&mut writer)?;
//         self.death_program_id.write(&mut writer)?;
//
//         self.serial_number_nonce.write(&mut writer)?;
//         self.commitment.write(&mut writer)?;
//         self.commitment_randomness.write(&mut writer)
//     }
// }
//
// impl<C: BaseDPCComponents> FromBytes for AleoRecord<C> {
//     #[inline]
//     fn read<R: Read>(mut reader: R) -> IoResult<Self> {
//         let owner: AccountAddress<C> = FromBytes::read(&mut reader)?;
//         let is_dummy: bool = FromBytes::read(&mut reader)?;
//         let value: u64 = FromBytes::read(&mut reader)?;
//         let payload: RecordPayload = FromBytes::read(&mut reader)?;
//
//         let birth_program_id_size: usize = read_variable_length_integer(&mut reader)?;
//
//         let mut birth_program_id = Vec::with_capacity(birth_program_id_size);
//         for _ in 0..birth_program_id_size {
//             let byte: u8 = FromBytes::read(&mut reader)?;
//             birth_program_id.push(byte);
//         }
//
//         let death_program_id_size: usize = read_variable_length_integer(&mut reader)?;
//
//         let mut death_program_id = Vec::with_capacity(death_program_id_size);
//         for _ in 0..death_program_id_size {
//             let byte: u8 = FromBytes::read(&mut reader)?;
//             death_program_id.push(byte);
//         }
//
//         let serial_number_nonce: <C::SerialNumberNonceCRH as CRH>::Output = FromBytes::read(&mut reader)?;
//
//         let commitment: <C::RecordCommitment as CommitmentScheme>::Output = FromBytes::read(&mut reader)?;
//         let commitment_randomness: <C::RecordCommitment as CommitmentScheme>::Randomness =
//             FromBytes::read(&mut reader)?;
//
//         Ok(Self {
//             owner,
//             is_dummy,
//             value,
//             payload,
//             birth_program_id,
//             death_program_id,
//             serial_number_nonce,
//             commitment,
//             commitment_randomness,
//             _components: PhantomData,
//         })
//     }
// }
