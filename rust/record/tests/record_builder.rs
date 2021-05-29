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
use aleo_record::{deprecated::Payload, *};

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

#[test]
fn test_derive_dummy_record() {
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

    // Build a dummy record:
    //
    // Record {
    //      value: 0,
    //      payload: 0,
    //      birth_program_id: noop_program_id,
    //      death_program_id: noop_program_id,
    //      ...
    // }
    //
    // This should automatically derive `is_dummy: false`
    let given_record = Record::new()
        .owner(owner)
        .value(value)
        .payload(payload)
        .birth_program_id(program_snark_vk_bytes.clone())
        .death_program_id(program_snark_vk_bytes.clone())
        .serial_number_nonce(serial_number_nonce)
        .calculate_commitment_randomness(rng)
        .build();

    assert!(given_record.is_ok());
}
