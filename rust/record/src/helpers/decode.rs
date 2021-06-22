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

use crate::Record;
use aleo_account::Address;
use aleo_network::Network;

use snarkvm_algorithms::traits::{CommitmentScheme, CRH};
use snarkvm_curves::edwards_bls12::{EdwardsParameters, EdwardsProjective as EdwardsBls};
use snarkvm_dpc::{
    testnet1::{
        instantiated::Components,
        parameters::{PublicParameters, SystemParameters},
        record::payload::Payload,
        record_encoding::RecordEncoding,
    },
    DPCComponents,
    DPCError,
    RecordEncodingScheme,
};
use snarkvm_utilities::{to_bytes, variable_length_integer::variable_length_integer, FromBytes, ToBytes};

pub(crate) struct Decode;

impl Decode {
    pub(crate) fn decode<N: Network>(
        owner: Address,
        serialized_record: Vec<EdwardsBls>,
        final_sign_high: bool,
    ) -> Result<Record<N>, DPCError> {
        let record =
            RecordEncoding::<Components, EdwardsParameters, EdwardsBls>::decode(serialized_record, final_sign_high)?;

        // Determine if the record is a dummy record.
        let is_dummy = {
            // Derive the noop program ID to check the birth program ID and death program ID.
            let parameters = PublicParameters::<Components>::load(true)?;
            let noop_program_id = to_bytes![
                parameters
                    .system_parameters
                    .program_verification_key_crh
                    .hash(&to_bytes![parameters.noop_program_snark_parameters.verification_key]?)?
            ]?;

            record.value == 0
                && record.payload == Payload::default()
                && record.birth_program_id == noop_program_id
                && record.death_program_id == noop_program_id
        };

        // Compute the commitment.
        let commitment = {
            let system_parameters = SystemParameters::<Components>::load().unwrap();

            // Total = 32 + 1 + 8 + 32 + 48 + 48 + 32 = 201 bytes
            let commitment_input = to_bytes![
                owner.to_bytes(),           // 256 bits = 32 bytes
                is_dummy,                   // 1 bit = 1 byte
                record.value,               // 64 bits = 8 bytes
                record.payload,             // 256 bits = 32 bytes
                record.birth_program_id,    // 384 bits = 48 bytes
                record.death_program_id,    // 384 bits = 48 bytes
                record.serial_number_nonce  // 256 bits = 32 bytes
            ]
            .unwrap();

            <Components as DPCComponents>::RecordCommitment::commit(
                &system_parameters.record_commitment,
                &commitment_input,
                &record.commitment_randomness,
            )
            .unwrap()
        };

        // Serialize record
        let mut record_bytes = Vec::new();
        owner.write(&mut record_bytes)?;

        is_dummy.write(&mut record_bytes)?;
        record.value.write(&mut record_bytes)?;
        record.payload.write(&mut record_bytes)?;

        variable_length_integer(record.birth_program_id.len() as u64).write(&mut record_bytes)?;
        record.birth_program_id.write(&mut record_bytes)?;

        variable_length_integer(record.death_program_id.len() as u64).write(&mut record_bytes)?;
        record.death_program_id.write(&mut record_bytes)?;

        record.serial_number_nonce.write(&mut record_bytes)?;
        commitment.write(&mut record_bytes)?;
        record.commitment_randomness.write(&mut record_bytes)?;

        // Build record.
        Ok(Record {
            record: FromBytes::read(&to_bytes![record_bytes]?[..])?,
        })
    }
}
