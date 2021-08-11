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
use aleo_network::Network;

use snarkvm_algorithms::{merkle_tree::MerkleTreeDigest, CommitmentScheme};
use snarkvm_dpc::{
    record::{Payload, Record as AleoRecord},
    Address,
    NoopProgram,
    Parameters,
    PrivateKey,
    ProgramScheme,
    RecordScheme,
};
use snarkvm_utilities::{to_bytes_le, FromBytes, ToBytes};

use rand::{CryptoRng, Rng};
use std::{
    convert::TryFrom,
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
    pub record: AleoRecord<N::Parameters>,
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
        let noop_program = NoopProgram::<N::Parameters>::load()?;

        Record::new()
            .program_id(*noop_program.program_id()) // Set program ID to the noop program ID.
            .owner(Address::try_from(&PrivateKey::<N::Parameters>::new(rng))?) // Generate a burner address.
            .value(0u64) // Set the value to 0.
            .payload(<Self as RecordScheme>::Payload::default()) // Set the payload to the default payload.
            .calculate_serial_number_nonce(rng) // Generate a burner nonce.
            .calculate_commitment_randomness(rng)
            .build()
    }

    ///
    /// Returns the serial number that corresponds to the record.
    ///
    pub fn to_serial_number(&self, private_key: &PrivateKey<N::Parameters>) -> Result<Vec<u8>, RecordError> {
        let (serial_number, _randomizer) = self.record.to_serial_number(private_key)?;

        Ok(to_bytes_le![serial_number]?)
    }

    pub fn to_bytes_le(&self) -> Vec<u8> {
        let mut output = vec![];
        self.record
            .write_le(&mut output)
            .expect("serialization to bytes failed");
        output
    }
}

impl<N: Network> RecordScheme for Record<N> {
    type Commitment = <<N as Network>::Parameters as Parameters>::RecordCommitment;
    type CommitmentRandomness =
        <<<N as Network>::Parameters as Parameters>::RecordCommitmentScheme as CommitmentScheme>::Randomness;
    type Owner = Address<N::Parameters>;
    type Payload = Payload;
    type ProgramID = MerkleTreeDigest<<<N as Network>::Parameters as Parameters>::ProgramCircuitTreeParameters>;
    type SerialNumber = <<N as Network>::Parameters as Parameters>::AccountSignaturePublicKey;
    type SerialNumberNonce = <<N as Network>::Parameters as Parameters>::SerialNumberNonce;

    fn owner(&self) -> Self::Owner {
        self.record.owner()
    }

    fn is_dummy(&self) -> bool {
        self.record.is_dummy()
    }

    fn value(&self) -> u64 {
        self.record.value()
    }

    fn payload(&self) -> &Self::Payload {
        self.record.payload()
    }

    fn serial_number_nonce(&self) -> &Self::SerialNumberNonce {
        self.record.serial_number_nonce()
    }

    fn program_id(&self) -> &Self::ProgramID {
        self.record.program_id()
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
    fn write_le<W: Write>(&self, mut writer: W) -> IoResult<()> {
        self.record.write_le(&mut writer)
    }
}

impl<N: Network> FromBytes for Record<N> {
    #[inline]
    fn read_le<R: Read>(mut reader: R) -> IoResult<Self> {
        Ok(Self {
            record: FromBytes::read_le(&mut reader)?,
        })
    }
}

impl<N: Network> FromStr for Record<N> {
    type Err = RecordError;

    fn from_str(record: &str) -> Result<Self, Self::Err> {
        let record = hex::decode(record)?;

        Ok(Self::read_le(&record[..])?)
    }
}

impl<N: Network> fmt::Display for Record<N> {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(
            f,
            "{}",
            hex::encode(to_bytes_le![self].expect("serialization to bytes failed"))
        )
    }
}
