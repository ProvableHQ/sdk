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

use aleo_account::*;
use aleo_record::*;

use rand::{rngs::StdRng, Rng, SeedableRng};
use snarkvm_algorithms::{CommitmentScheme, CRH};
use snarkvm_dpc::{
    base_dpc::instantiated::{Components, ProgramVerificationKeyCRH, SerialNumberNonce as SerialNumberNonceCRH},
    DPCComponents,
    NoopProgramSNARKParameters,
    PublicParameters,
    SystemParameters,
};
use snarkvm_utilities::{to_bytes, ToBytes, UniformRand};

pub(crate) const ITERATIONS: usize = 5;

#[test]
fn test_derive_is_dummy() {
    let rng = &mut StdRng::from_entropy();

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

    let dummy_private_key = PrivateKey::new(rng).unwrap();
    let owner = Address::from(&dummy_private_key).unwrap();

    let value = 0u64;
    let payload = Payload::default();

    let serial_number_nonce_input: [u8; 32] = rng.gen();
    let serial_number_nonce =
        SerialNumberNonceCRH::hash(&system_parameters.serial_number_nonce, &serial_number_nonce_input).unwrap();

    // Build record with non-zero `value`, payload == 0,
    // This should automatically derive `is_dummy: false`
    let given_record = Record::new()
        .owner(owner)
        .value(value)
        .payload(payload)
        .birth_program_id(program_snark_vk_bytes.clone())
        .death_program_id(program_snark_vk_bytes.clone())
        .serial_number_nonce(serial_number_nonce)
        .build()
        .unwrap();

    // assert!(given_record.is_ok());
}

#[test]
fn test_derive_is_dummy_fail() {
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

            let value = 0u64;
            let payload: [u8; 32] = rng.gen();

            let serial_number_nonce_input: [u8; 32] = rng.gen();
            let serial_number_nonce =
                SerialNumberNonceCRH::hash(&system_parameters.serial_number_nonce, &serial_number_nonce_input).unwrap();

            // Build record with zero `value: 0u64`
            // This record should fail because we do not know if the the record is a dummy.
            let given_record = Record::new()
                .owner(owner)
                .payload(Payload::from_bytes(&payload))
                .birth_program_id(program_snark_vk_bytes.clone())
                .death_program_id(program_snark_vk_bytes.clone())
                .serial_number_nonce(serial_number_nonce)
                .calculate_commitment(Some(rng))
                .build();

            assert!(given_record.is_err());
        }
    }
}

#[test]
fn test_calculate_commitment() {
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
                SerialNumberNonceCRH::hash(&system_parameters.serial_number_nonce, &serial_number_nonce_input).unwrap();

            let given_record = Record::new()
                .owner(owner)
                .value(value)
                .payload(Payload::from_bytes(&payload))
                .birth_program_id(program_snark_vk_bytes.clone())
                .death_program_id(program_snark_vk_bytes.clone())
                .serial_number_nonce(serial_number_nonce)
                .calculate_commitment(Some(rng))
                .build();

            assert!(given_record.is_ok());
        }
    }
}

#[test]
fn test_calculate_commitment_fail() {
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
                SerialNumberNonceCRH::hash(&system_parameters.serial_number_nonce, &serial_number_nonce_input).unwrap();

            // Try to calculate commitment before serial number nonce is known.
            let given_record = Record::new()
                .owner(owner)
                .value(value)
                .payload(Payload::from_bytes(&payload))
                .birth_program_id(program_snark_vk_bytes.clone())
                .death_program_id(program_snark_vk_bytes.clone())
                .calculate_commitment(Some(rng))
                .serial_number_nonce(serial_number_nonce)
                .build();

            assert!(given_record.is_err());
        }
    }
}

#[test]
fn test_calculate_commitment_randomness() {
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
                SerialNumberNonceCRH::hash(&system_parameters.serial_number_nonce, &serial_number_nonce_input).unwrap();

            let commitment_randomness = RecordBuilder::calculate_commitment_randomness(rng);

            let given_record = Record::new()
                .owner(owner)
                .value(value)
                .payload(Payload::from_bytes(&payload))
                .birth_program_id(program_snark_vk_bytes.clone())
                .death_program_id(program_snark_vk_bytes.clone())
                .serial_number_nonce(serial_number_nonce)
                .commitment_randomness(commitment_randomness)
                .calculate_commitment::<StdRng>(None)
                .build();

            assert!(given_record.is_ok());
        }
    }
}

#[test]
fn test_calculate_commitment_randomness_fail() {
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
                SerialNumberNonceCRH::hash(&system_parameters.serial_number_nonce, &serial_number_nonce_input).unwrap();

            // Try to calculate record commitment randomness without rng.
            let given_record = Record::new()
                .owner(owner)
                .value(value)
                .payload(Payload::from_bytes(&payload))
                .birth_program_id(program_snark_vk_bytes.clone())
                .death_program_id(program_snark_vk_bytes.clone())
                .serial_number_nonce(serial_number_nonce)
                .calculate_commitment::<StdRng>(None)
                .build();

            assert!(given_record.is_err());
        }
    }
}
