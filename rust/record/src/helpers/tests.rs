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

use crate::{
    helpers::{decode::Decode, decrypt::Decrypt, encode::Encode, encrypt::Encrypt},
    Record,
};
use aleo_account::*;
use aleo_network::Testnet1;

use snarkvm_algorithms::traits::CRH;
use snarkvm_dpc::{
    testnet1::{
        instantiated::{Components, ProgramVerificationKeyCRH, SerialNumberNonce as SerialNumberNonceCRH},
        parameters::{NoopProgramSNARKParameters, SystemParameters},
        record::payload::Payload,
    },
    RecordScheme,
};
use snarkvm_utilities::{to_bytes, ToBytes};

use rand::{rngs::StdRng, Rng, SeedableRng};

pub(crate) const ITERATIONS: usize = 5;

#[test]
fn test_encode_and_decode() {
    let rng = &mut StdRng::from_entropy();

    for _ in 0..ITERATIONS {
        // Load system parameters for the ledger, commitment schemes, CRH, and the noop program.
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
            let private_key = PrivateKey::new(rng).unwrap();
            let owner = Address::from(&private_key).unwrap();

            let value = rng.gen();
            let payload: [u8; 32] = rng.gen();

            let serial_number_nonce_input: [u8; 32] = rng.gen();
            let serial_number_nonce =
                SerialNumberNonceCRH::hash(&system_parameters.serial_number_nonce, &serial_number_nonce_input).unwrap();

            let given_record = Record::<Testnet1>::new()
                .owner(owner.clone())
                .value(value)
                .payload(Payload::from_bytes(&payload))
                .birth_program_id(program_snark_vk_bytes.clone())
                .death_program_id(program_snark_vk_bytes.clone())
                .serial_number_nonce(serial_number_nonce)
                .calculate_commitment_randomness(rng)
                .build()
                .unwrap();

            let (encoded_record, final_sign_high) = Encode::encode(&given_record).unwrap();
            let decoded_record = Decode::decode::<Testnet1>(owner, encoded_record, final_sign_high).unwrap();

            assert_eq!(given_record.owner(), decoded_record.owner());
            assert_eq!(given_record.is_dummy(), decoded_record.is_dummy());
            assert_eq!(given_record.value(), decoded_record.value());
            assert_eq!(given_record.payload(), decoded_record.payload());
            assert_eq!(given_record.birth_program_id(), decoded_record.birth_program_id());
            assert_eq!(given_record.death_program_id(), decoded_record.death_program_id());
            assert_eq!(given_record.serial_number_nonce(), decoded_record.serial_number_nonce());
            assert_eq!(given_record.commitment(), decoded_record.commitment());
            assert_eq!(
                given_record.commitment_randomness(),
                decoded_record.commitment_randomness()
            );
        }
    }
}

#[test]
fn test_encrypt_and_decrypt() {
    let mut rng = &mut StdRng::from_entropy();

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

            let given_record = Record::<Testnet1>::new()
                .owner(owner)
                .value(value)
                .payload(Payload::from_bytes(&payload))
                .birth_program_id(program_snark_vk_bytes.clone())
                .death_program_id(program_snark_vk_bytes.clone())
                .serial_number_nonce(serial_number_nonce)
                .calculate_commitment_randomness(rng)
                .build()
                .unwrap();

            // Encrypt the record
            let (_, encrypted_record) = Encrypt::encrypt(&given_record, &mut rng).unwrap();
            let view_key = ViewKey::from(&dummy_private_key).unwrap();

            // Decrypt the record
            let decrypted_record = Decrypt::decrypt::<Testnet1>(&view_key, &encrypted_record).unwrap();

            assert_eq!(given_record.to_string(), decrypted_record.to_string());
        }
    }
}
