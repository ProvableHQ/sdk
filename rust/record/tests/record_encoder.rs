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
use snarkvm_algorithms::traits::CRH;
use snarkvm_dpc::{
    base_dpc::instantiated::{InstantiatedDPC, ProgramVerificationKeyCRH, SerialNumberNonce as SerialNumberNonceCRH},
    Record as RecordInterface,
    RecordSerializerScheme,
};
use snarkvm_utilities::{bytes::ToBytes, to_bytes};

pub(crate) const ITERATIONS: usize = 5;

#[test]
fn test_record_encoding() {
    let mut rng = &mut StdRng::from_entropy();

    for _ in 0..ITERATIONS {
        // Generate parameters for the ledger, commitment schemes, CRH, and the
        // "always-accept" program.
        let system_parameters = InstantiatedDPC::generate_system_parameters(&mut rng).unwrap();
        let noop_program_snark_pp =
            InstantiatedDPC::generate_noop_program_snark_parameters(&system_parameters, &mut rng).unwrap();

        let program_snark_vk_bytes = to_bytes![
            ProgramVerificationKeyCRH::hash(
                &system_parameters.program_verification_key_crh,
                &to_bytes![noop_program_snark_pp.verification_key].unwrap()
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

            let given_record = Record::generate_record(
                &system_parameters,
                owner,
                false,
                value,
                RecordPayload::from_bytes(&payload),
                program_snark_vk_bytes.clone(),
                program_snark_vk_bytes.clone(),
                serial_number_nonce,
                &mut rng,
            )
            .unwrap();

            let (encoded_record, final_sign_high) = RecordEncoder::serialize(&given_record).unwrap();
            let decoded_record = RecordEncoder::deserialize(encoded_record, final_sign_high).unwrap();

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
