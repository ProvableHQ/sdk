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
    base_dpc::instantiated::{Components, ProgramVerificationKeyCRH, SerialNumberNonce as SerialNumberNonceCRH},
    NoopProgramSNARKParameters,
    SystemParameters,
};
use snarkvm_utilities::{bytes::ToBytes, to_bytes};

pub(crate) const ITERATIONS: usize = 5;

#[test]
fn test_record_encryption() {
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

            // Encrypt the record
            let (_, encryped_record) = given_record.encrypt(&mut rng).unwrap();
            let view_key = ViewKey::from(&dummy_private_key).unwrap();

            // Decrypt the record
            let decrypted_record = Record::decrypt(&view_key, &encryped_record).unwrap();

            assert_eq!(given_record, decrypted_record);
        }
    }
}
