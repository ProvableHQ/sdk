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
use aleo_environment::Environment;

use snarkvm_algorithms::{
    traits::{CommitmentScheme, CRH},
    SignatureScheme,
};
use snarkvm_dpc::{
    testnet1::{
        instantiated::Components,
        parameters::PublicParameters,
        record::{payload::Payload, Record as InnerRecord},
    },
    traits::RecordScheme,
    AccountAddress,
    DPCComponents,
};
use snarkvm_utilities::{to_bytes, FromBytes, ToBytes};

use rand::{rngs::StdRng, CryptoRng, Rng, SeedableRng};
use std::{
    fmt,
    io::{Read, Result as IoResult, Write},
    str::FromStr,
};

pub type SerialNumber = <<Components as DPCComponents>::AccountSignature as SignatureScheme>::PublicKey;
pub type SerialNumberNonce = <<Components as DPCComponents>::SerialNumberNonceCRH as CRH>::Output;
pub type Commitment = <<Components as DPCComponents>::RecordCommitment as CommitmentScheme>::Output;
pub type CommitmentRandomness = <<Components as DPCComponents>::RecordCommitment as CommitmentScheme>::Randomness;

// todo (collin): change record struct to this
// pub struct Record {
//     pub(crate) record: Box<
//         dyn RecordScheme<
//             Owner = Address,
//             Commitment = Commitment,
//             CommitmentRandomness = CommitmentRandomness,
//             Payload = Payload,
//             SerialNumber = SerialNumber,
//             SerialNumberNonce = SerialNumberNonce,
//             Value = u64,
//         >,
//     >, //    = note: the trait cannot be made into an object because it requires `Self: Sized`
//     pub(crate) environment: Environment, // Enum
// }

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Record<E: Environment> {
    pub(crate) record: InnerRecord<E::Components>,
}

impl<E: Environment> Record<E> {
    ///
    /// Returns a new record builder.
    ///
    #[allow(clippy::new_ret_no_self)]
    pub fn new() -> RecordBuilder<E> {
        RecordBuilder { ..Default::default() }
    }

    ///
    /// Returns a new dummy record using a given RNG.
    ///
    pub fn new_dummy<R: Rng + CryptoRng>(rng: &mut R) -> Result<Self, RecordError> {
        // Set the address.
        let private_key = PrivateKey::new(rng)?;
        let owner = Address::from(&private_key)?;

        // Set the value to 0.
        let value = 0u64;

        // Set the payload to the default payload.
        let payload = E::Payload::default();

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
            .calculate_commitment_randomness(rng)
            .build()
    }
}

impl<E: Environment> RecordScheme for Record<E> {
    type Commitment = <<<E as Environment>::Components as DPCComponents>::RecordCommitment as CommitmentScheme>::Output;
    type CommitmentRandomness =
        <<<E as Environment>::Components as DPCComponents>::RecordCommitment as CommitmentScheme>::Randomness;
    type Owner = AccountAddress<E::Components>;
    type Payload = Payload;
    type SerialNumber = E::SerialNumber;
    type SerialNumberNonce = <<<E as Environment>::Components as DPCComponents>::SerialNumberNonceCRH as CRH>::Output;
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

impl<E: Environment> Default for Record<E> {
    fn default() -> Self {
        let rng = &mut StdRng::from_entropy();

        Self::new_dummy(rng).unwrap()
    }
}

impl<E: Environment> ToBytes for Record<E> {
    #[inline]
    fn write<W: Write>(&self, mut writer: W) -> IoResult<()> {
        self.record.write(&mut writer)
    }
}

impl<E: Environment> FromBytes for Record<E> {
    #[inline]
    fn read<R: Read>(mut reader: R) -> IoResult<Self> {
        let record = FromBytes::read(&mut reader)?;

        Ok(Self { record })
    }
}

impl<E: Environment> FromStr for Record<E> {
    type Err = RecordError;

    fn from_str(record: &str) -> Result<Self, Self::Err> {
        let record = hex::decode(record)?;

        Ok(Self::read(&record[..])?)
    }
}

impl<E: Environment> fmt::Display for Record<E> {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(
            f,
            "{}",
            hex::encode(to_bytes![self].expect("serialization to bytes failed"))
        )
    }
}
