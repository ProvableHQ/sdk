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

use crate::{CommitmentRandomness, Payload, Record, SerialNumberNonce};

use snarkvm_curves::edwards_bls12::{EdwardsParameters, EdwardsProjective as EdwardsBls};
use snarkvm_dpc::{
    base_dpc::instantiated::Components,
    DPCComponents,
    DPCError,
    DPCRecord,
    RecordSerializer,
    RecordSerializerScheme,
};
use snarkvm_utilities::FromBytes;

/// The decoded format of the Aleo record datatype.
/// Excludes the owner, commitment, and commitment_randomness from encoding.
pub(super) struct DecodedRecord {
    pub(super) value: u64,
    pub(super) payload: Payload,

    pub(super) birth_program_id: Vec<u8>,
    pub(super) death_program_id: Vec<u8>,

    pub(super) serial_number_nonce: SerialNumberNonce,
    pub(super) commitment_randomness: CommitmentRandomness,
}

impl From<Record> for DecodedRecord {
    fn from(record: Record) -> Self {
        Self {
            value: record.value,
            payload: record.payload,
            birth_program_id: record.birth_program_id,
            death_program_id: record.death_program_id,
            serial_number_nonce: record.serial_number_nonce,
            commitment_randomness: record.commitment_randomness,
        }
    }
}

pub(super) struct Encoder;

impl RecordSerializerScheme for Encoder {
    type DeserializedRecord = DecodedRecord;
    type Group = EdwardsBls;
    type InnerField = <Components as DPCComponents>::InnerField;
    type OuterField = <Components as DPCComponents>::OuterField;
    type Parameters = EdwardsParameters;
    type Record = Record;

    fn serialize(record: &Self::Record) -> Result<(Vec<Self::Group>, bool), DPCError> {
        let record_bytes = record.to_bytes();

        let given_record: DPCRecord<Components> = FromBytes::read(&record_bytes[..])?;

        RecordSerializer::<Components, EdwardsParameters, EdwardsBls>::serialize(&given_record)
    }

    fn deserialize(
        serialized_record: Vec<Self::Group>,
        final_sign_high: bool,
    ) -> Result<Self::DeserializedRecord, DPCError> {
        let deserialized_native = RecordSerializer::<Components, EdwardsParameters, EdwardsBls>::deserialize(
            serialized_record,
            final_sign_high,
        )?;

        Ok(DecodedRecord {
            value: deserialized_native.value,
            payload: Payload::from_bytes(deserialized_native.payload.to_bytes()),
            birth_program_id: deserialized_native.birth_program_id,
            death_program_id: deserialized_native.death_program_id,
            serial_number_nonce: deserialized_native.serial_number_nonce,
            commitment_randomness: deserialized_native.commitment_randomness,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use aleo_account::*;

    use rand::{rngs::StdRng, Rng, SeedableRng};
    use snarkvm_algorithms::traits::CRH;
    use snarkvm_dpc::{
        base_dpc::instantiated::{Components, ProgramVerificationKeyCRH, SerialNumberNonce as SerialNumberNonceCRH},
        NoopProgramSNARKParameters,
        Record as RecordInterface,
        RecordSerializerScheme,
        SystemParameters,
    };
    use snarkvm_utilities::{bytes::ToBytes, to_bytes};

    pub(crate) const ITERATIONS: usize = 5;

    #[test]
    fn test_encoder() {
        let rng = &mut StdRng::from_entropy();

        for _ in 0..ITERATIONS {
            // Load system parameters for the ledger, commitment schemes, CRH, and the
            // "always-accept" program.
            let system_parameters = SystemParameters::<Components>::load().unwrap();
            let program_snark_pp = NoopProgramSNARKParameters::<Components>::load().unwrap();

            let program_snark_vk_bytes = to_bytes![
                ProgramVerificationKeyCRH::hash(
                    &system_parameters.program_verification_key_crh,
                    &to_bytes![program_snark_pp.verification_key].unwrap()
                )
                .unwrap()
            ]
            .unwrap();

            for _ in 0..ITERATIONS {
                let dummy_private_key = PrivateKey::new(rng).unwrap();
                let owner = Address::from(&dummy_private_key).unwrap();

                let value = rng.gen();
                let payload: [u8; 32] = rng.gen();

                let serial_number_nonce_input: [u8; 32] = rng.gen();
                let serial_number_nonce =
                    SerialNumberNonceCRH::hash(&system_parameters.serial_number_nonce, &serial_number_nonce_input)
                        .unwrap();

                let given_record = Record::new()
                    .owner(owner)
                    .value(value)
                    .payload(Payload::from_bytes(&payload))
                    .birth_program_id(program_snark_vk_bytes.clone())
                    .death_program_id(program_snark_vk_bytes.clone())
                    .serial_number_nonce(serial_number_nonce)
                    .calculate_commitment(Some(rng))
                    .build()
                    .unwrap();

                let (encoded_record, final_sign_high) = Encoder::serialize(&given_record).unwrap();
                let decoded_record = Encoder::deserialize(encoded_record, final_sign_high).unwrap();

                assert_eq!(given_record.serial_number_nonce(), &decoded_record.serial_number_nonce);
                assert_eq!(
                    given_record.commitment_randomness(),
                    decoded_record.commitment_randomness
                );
                assert_eq!(given_record.birth_program_id(), decoded_record.birth_program_id);
                assert_eq!(given_record.death_program_id(), decoded_record.death_program_id);
                assert_eq!(given_record.value(), decoded_record.value);
                assert_eq!(given_record.payload(), &decoded_record.payload);
            }
        }
    }
}
