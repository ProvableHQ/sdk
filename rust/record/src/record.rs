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

use crate::{RecordBuilder, RecordError};
use aleo_account::{Address, PrivateKey};
use aleo_network::Network;

use snarkvm_algorithms::prelude::*;
use snarkvm_dpc::{
    prelude::*,
    testnet1::{
        parameters::PublicParameters,
        record::{payload::Payload, Record as DPCRecord},
        SystemParameters,
        DPC,
    },
};
use snarkvm_utilities::{to_bytes, FromBytes, ToBytes};

use rand::{CryptoRng, Rng};
use std::{
    fmt,
    io::{Read, Result as IoResult, Write},
    str::FromStr,
};

#[derive(Derivative)]
#[derivative(
    Default(bound = "N: Network"),
    Debug(bound = "N: Network"),
    Clone(bound = "N: Network"),
    PartialEq(bound = "N: Network"),
    Eq(bound = "N: Network")
)]
pub struct Record<N: Network> {
    pub record: DPCRecord<N::Components>,
}

impl<N: Network> Record<N> {
    ///
    /// Returns a new record builder.
    ///
    #[allow(clippy::new_ret_no_self)]
    pub fn new() -> RecordBuilder<N> {
        RecordBuilder { ..Default::default() }
    }

    ///
    /// Returns a new dummy record using a given RNG.
    ///
    pub fn new_dummy<R: Rng + CryptoRng>(rng: &mut R) -> Result<Self, RecordError> {
        // Fetch the noop program ID.
        let parameters = PublicParameters::<N::Components>::load(true)?;
        let noop_program_id = to_bytes![
            parameters
                .system_parameters
                .program_verification_key_crh
                .hash(&to_bytes![parameters.noop_program_snark_parameters.verification_key]?)?
        ]?;

        Record::new()
            .owner(Address::from(&PrivateKey::new(rng)?)?) // Generate a burner address.
            .value(0u64) // Set the value to 0.
            .payload(<Self as RecordScheme>::Payload::default()) // Set the payload to the default payload.
            .birth_program_id(noop_program_id.clone()) // Set birth program ID to the noop program ID.
            .death_program_id(noop_program_id) // Set death program ID to the noop program ID.
            .serial_number_nonce(parameters.system_parameters.serial_number_nonce.hash(&rng.gen::<[u8; 32]>())?) // Generate a burner nonce.
            .calculate_commitment_randomness(rng)
            .build()
    }

    ///
    /// Returns the serial number that corresponds to the record.
    ///
    pub fn to_serial_number(&self, private_key: &PrivateKey) -> Result<Vec<u8>, RecordError> {
        let address = Address::from(&private_key)?;

        // Check that the private_key corresponds with the owner of the record
        if self.record.owner().to_string() != address.address.to_string() {
            return Err(RecordError::InvalidPrivateKey);
        }

        let parameters = SystemParameters::<N::Components>::load()?;
        let private_key = AccountPrivateKey::<N::Components>::from_str(&private_key.to_string())?;
        let (serial_number, _randomizer) = DPC::<N::Components>::generate_sn(&parameters, &self.record, &private_key)?;

        Ok(to_bytes![serial_number]?)
    }

    pub fn to_bytes(&self) -> Vec<u8> {
        let mut output = vec![];
        self.record.write(&mut output).expect("serialization to bytes failed");
        output
    }
}

impl<N: Network> RecordScheme for Record<N> {
    type Commitment = <<<N as Network>::Components as DPCComponents>::RecordCommitment as CommitmentScheme>::Output;
    type CommitmentRandomness =
        <<<N as Network>::Components as DPCComponents>::RecordCommitment as CommitmentScheme>::Randomness;
    type Owner = AccountAddress<N::Components>;
    // todo: make this type part of components in snarkvm_dpc
    type Payload = Payload;
    type SerialNumber = <<<N as Network>::Components as DPCComponents>::AccountSignature as SignatureScheme>::PublicKey;
    type SerialNumberNonce = <<<N as Network>::Components as DPCComponents>::SerialNumberNonceCRH as CRH>::Output;
    type Value = u64;

    fn owner(&self) -> &Self::Owner {
        self.record.owner()
    }

    fn is_dummy(&self) -> bool {
        self.record.is_dummy()
    }

    fn value(&self) -> Self::Value {
        self.record.value()
    }

    fn payload(&self) -> &Self::Payload {
        self.record.payload()
    }

    fn birth_program_id(&self) -> &[u8] {
        self.record.birth_program_id()
    }

    fn death_program_id(&self) -> &[u8] {
        self.record.death_program_id()
    }

    fn serial_number_nonce(&self) -> &Self::SerialNumberNonce {
        self.record.serial_number_nonce()
    }

    fn commitment(&self) -> Self::Commitment {
        self.record.commitment()
    }

    fn commitment_randomness(&self) -> Self::CommitmentRandomness {
        self.record.commitment_randomness()
    }
}

impl<N: Network> ToBytes for Record<N> {
    #[inline]
    fn write<W: Write>(&self, mut writer: W) -> IoResult<()> {
        self.record.write(&mut writer)
    }
}

impl<N: Network> FromBytes for Record<N> {
    #[inline]
    fn read<R: Read>(mut reader: R) -> IoResult<Self> {
        Ok(Self {
            record: FromBytes::read(&mut reader)?,
        })
    }
}

impl<N: Network> FromStr for Record<N> {
    type Err = RecordError;

    fn from_str(record: &str) -> Result<Self, Self::Err> {
        let record = hex::decode(record)?;

        Ok(Self::read(&record[..])?)
    }
}

impl<N: Network> fmt::Display for Record<N> {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(
            f,
            "{}",
            hex::encode(to_bytes![self].expect("serialization to bytes failed"))
        )
    }
}
