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

use crate::{deprecated::Payload, RecordBuilder, RecordError};
use aleo_account::{Address, PrivateKey};

use rand::{CryptoRng, Rng};
use snarkvm_algorithms::{
    traits::{CommitmentScheme, CRH},
    SignatureScheme,
};
use snarkvm_dpc::{
    base_dpc::instantiated::Components,
    DPCComponents,
    DPCRecord,
    PublicParameters,
    Record as RecordInterface,
};
use snarkvm_utilities::{read_variable_length_integer, to_bytes, variable_length_integer, FromBytes, ToBytes};
use std::{
    fmt,
    io::{Read, Result as IoResult, Write},
};

pub type SerialNumber = <<Components as DPCComponents>::AccountSignature as SignatureScheme>::PublicKey;
pub type SerialNumberNonce = <<Components as DPCComponents>::SerialNumberNonceCRH as CRH>::Output;
pub type Commitment = <<Components as DPCComponents>::RecordCommitment as CommitmentScheme>::Output;
pub type CommitmentRandomness = <<Components as DPCComponents>::RecordCommitment as CommitmentScheme>::Randomness;

/// The Aleo record data type.
#[derive(Default, Debug, Clone, PartialEq, Eq)]
pub struct Record {
    pub(crate) owner: Address,
    pub(crate) is_dummy: bool,
    pub(crate) value: u64,
    pub(crate) payload: Payload,

    pub(crate) birth_program_id: Vec<u8>,
    pub(crate) death_program_id: Vec<u8>,

    pub(crate) serial_number_nonce: SerialNumberNonce,
    pub(crate) commitment: Commitment,
    pub(crate) commitment_randomness: CommitmentRandomness,
}

impl Record {
    pub(crate) const ZERO_VALUE: u64 = 0;

    ///
    /// Returns a new record builder.
    ///
    #[allow(clippy::new_ret_no_self)]
    pub fn new() -> RecordBuilder {
        RecordBuilder { ..Default::default() }
    }

    ///
    /// Returns a new dummy record using a given RNG.
    ///
    pub fn dummy<R: Rng + CryptoRng>(rng: &mut R) -> Result<Self, RecordError> {
        // Set the address.
        let private_key = PrivateKey::new(rng)?;
        let owner = Address::from(&private_key)?;

        // Set the value to 0.
        let value = 0u64;

        // Set the payload to the default payload.
        let payload = Payload::default();

        // Set birth program ID and death program ID to the noop program ID.
        let parameters = PublicParameters::<Components>::load(true)?;
        let noop_program_id = to_bytes![
            parameters
                .system_parameters
                .program_verification_key_crh
                .hash(&to_bytes![parameters.noop_program_snark_parameters.verification_key]?)?
        ]?;

        let birth_program_id = noop_program_id.clone();
        let death_program_id = noop_program_id;

        // Set the serial number nonce for a dummy record.
        let sn_randomness: [u8; 32] = rng.gen();
        let serial_number_nonce = parameters.system_parameters.serial_number_nonce.hash(&sn_randomness)?;

        Record::new()
            .owner(owner)
            .value(value)
            .payload(payload)
            .birth_program_id(birth_program_id)
            .death_program_id(death_program_id)
            .serial_number_nonce(serial_number_nonce)
            .calculate_commitment(Some(rng))
            .build()
    }

    pub fn to_bytes(&self) -> Vec<u8> {
        let mut output = vec![];
        self.write(&mut output).expect("serialization to bytes failed");
        output
    }

    pub fn to_native(&self) -> Result<DPCRecord<Components>, RecordError> {
        Ok(FromBytes::read(&self.to_bytes()[..])?)
    }
}

impl RecordInterface for Record {
    type Commitment = Commitment;
    type CommitmentRandomness = CommitmentRandomness;
    type Owner = Address;
    type Payload = Payload;
    type SerialNumber = SerialNumber;
    type SerialNumberNonce = SerialNumberNonce;
    type Value = u64;

    fn owner(&self) -> &Self::Owner {
        &self.owner
    }

    fn is_dummy(&self) -> bool {
        self.is_dummy
    }

    fn value(&self) -> Self::Value {
        self.value
    }

    fn payload(&self) -> &Self::Payload {
        &self.payload
    }

    fn birth_program_id(&self) -> &[u8] {
        &self.birth_program_id
    }

    fn death_program_id(&self) -> &[u8] {
        &self.death_program_id
    }

    fn serial_number_nonce(&self) -> &Self::SerialNumberNonce {
        &self.serial_number_nonce
    }

    fn commitment(&self) -> Self::Commitment {
        self.commitment
    }

    fn commitment_randomness(&self) -> Self::CommitmentRandomness {
        self.commitment_randomness
    }
}

impl ToBytes for Record {
    #[inline]
    fn write<W: Write>(&self, mut writer: W) -> IoResult<()> {
        self.owner.write(&mut writer)?;
        self.is_dummy.write(&mut writer)?;
        self.value.write(&mut writer)?;
        self.payload.write(&mut writer)?;

        variable_length_integer(self.birth_program_id.len() as u64).write(&mut writer)?;
        self.birth_program_id.write(&mut writer)?;

        variable_length_integer(self.death_program_id.len() as u64).write(&mut writer)?;
        self.death_program_id.write(&mut writer)?;

        self.serial_number_nonce.write(&mut writer)?;
        self.commitment.write(&mut writer)?;
        self.commitment_randomness.write(&mut writer)
    }
}

impl FromBytes for Record {
    #[inline]
    fn read<R: Read>(mut reader: R) -> IoResult<Self> {
        let owner: Address = FromBytes::read(&mut reader)?;
        let is_dummy: bool = FromBytes::read(&mut reader)?;
        let value: u64 = FromBytes::read(&mut reader)?;
        let payload: Payload = FromBytes::read(&mut reader)?;

        let birth_program_id_size: usize = read_variable_length_integer(&mut reader)?;

        let mut birth_program_id = Vec::with_capacity(birth_program_id_size);
        for _ in 0..birth_program_id_size {
            let byte: u8 = FromBytes::read(&mut reader)?;
            birth_program_id.push(byte);
        }

        let death_program_id_size: usize = read_variable_length_integer(&mut reader)?;

        let mut death_program_id = Vec::with_capacity(death_program_id_size);
        for _ in 0..death_program_id_size {
            let byte: u8 = FromBytes::read(&mut reader)?;
            death_program_id.push(byte);
        }

        let serial_number_nonce: SerialNumberNonce = FromBytes::read(&mut reader)?;

        let commitment: Commitment = FromBytes::read(&mut reader)?;
        let commitment_randomness: CommitmentRandomness = FromBytes::read(&mut reader)?;

        Ok(Self {
            owner,
            is_dummy,
            value,
            payload,
            birth_program_id,
            death_program_id,
            serial_number_nonce,
            commitment,
            commitment_randomness,
        })
    }
}

// todo (collin): Come up with better UX for displaying records.
impl fmt::Display for Record {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        writeln!(f, "Record {{")?;
        writeln!(f, "\t owner: {}", self.owner.to_string())?;
        writeln!(f, "\t is_dummy: {:?}", self.is_dummy)?;
        writeln!(f, "\t value: {:?}", self.value)?;
        writeln!(f, "\t payload: {:?}", hex::encode(self.payload.to_bytes()))?;
        writeln!(f, "\t birth_program_id: {:?}", hex::encode(&self.birth_program_id))?;
        writeln!(f, "\t death_program_id: {:?}", hex::encode(&self.death_program_id))?;
        writeln!(f, "\t serial_number_nonce: {:?}", self.serial_number_nonce)?;
        writeln!(f, "\t commitment: {:?}", self.commitment)?;
        writeln!(f, "\t commitment_randomness: {:?}", self.commitment_randomness)?;
        write!(f, "}}")
    }
}
