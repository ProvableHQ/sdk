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
use aleo_network::{Network, Testnet1};

use snarkvm_algorithms::traits::CRH;
use snarkvm_dpc::{
    testnet1::{payload::Payload, NoopProgramSNARKParameters, SystemParameters},
    DPCComponents,
    RecordScheme,
};
use snarkvm_utilities::{to_bytes, FromBytes, ToBytes};

use rand::SeedableRng;
use rand_chacha::ChaChaRng;
use std::str::FromStr;

pub const TEST_RECORD_OWNER: &str = "aleo1faksgtpmculyzt6tgaq26fe4fgdjtwualyljjvfn2q6k42ydegzspfz9uh";
pub const TEST_RECORD_VALUE: u64 = 100;
pub const TEST_RECORD_PAYLOAD: &str = "e456ab4252bd295128ee51efeb4835a9f6f29f818d13021802df91079599ab3a";
pub const TEST_RECORD_SERIAL_NUMBER_NONCE: &str = "89357d5fedcb36fa5662bd902689739eafc10e30e84c86648d6a5ec0be52cc00";
pub const TEST_RECORD_COMMITMENT_RANDOMNESS: &str = "aa83a5428e0827c262d2ccad4be75fc1d01ebd0f9a5c0cc2d7a6557cb8664101";
pub const TEST_RECORD_COMMITMENT: &str = "9cb6e5813f7008058906868de82c27764cb058aa361d0224f76877898127a304";

#[test]
fn test_build_dummy_record() {
    // Deterministically derive randomness
    let rng = &mut ChaChaRng::seed_from_u64(1231275789u64);

    // Load system parameters for the ledger, commitment schemes, CRH, and the
    // "always-accept" program.
    let system_parameters = SystemParameters::<<Testnet1 as Network>::Components>::load().unwrap();
    let program_snark_pp = NoopProgramSNARKParameters::<<Testnet1 as Network>::Components>::load().unwrap();

    let noop_program_id = to_bytes![
        <<Testnet1 as Network>::Components as DPCComponents>::ProgramVerificationKeyCRH::hash(
            &system_parameters.program_verification_key_crh,
            &to_bytes![program_snark_pp.verification_key].unwrap()
        )
        .unwrap()
    ]
    .unwrap();

    // Generate new dummy record from randomness
    let dummy_record = Record::<Testnet1>::new_dummy(rng).unwrap();

    // Check is_dummy: true
    assert!(dummy_record.is_dummy());

    // Check value: 0u64
    assert_eq!(dummy_record.value(), 0u64);

    // Check payload: 0
    assert_eq!(dummy_record.payload(), &Payload::default());

    // Check birth_program_id: noop_program_id
    assert_eq!(dummy_record.birth_program_id(), noop_program_id);

    // Check death_program_id: noop_program_id
    assert_eq!(dummy_record.death_program_id(), noop_program_id);
}

#[test]
fn test_build_record() {
    // Load system parameters for the ledger, commitment schemes, CRH, and the
    // "always-accept" program.
    let system_parameters = SystemParameters::<<Testnet1 as Network>::Components>::load().unwrap();
    let program_snark_pp = NoopProgramSNARKParameters::<<Testnet1 as Network>::Components>::load().unwrap();

    let program_snark_vk_bytes = to_bytes![
        <<Testnet1 as Network>::Components as DPCComponents>::ProgramVerificationKeyCRH::hash(
            &system_parameters.program_verification_key_crh,
            &to_bytes![program_snark_pp.verification_key].unwrap()
        )
        .unwrap()
    ]
    .unwrap();

    let owner = Address::from_str(TEST_RECORD_OWNER).unwrap();

    let value = TEST_RECORD_VALUE;

    let payload_bytes = hex::decode(TEST_RECORD_PAYLOAD).unwrap();
    let payload = Payload::read(&payload_bytes[..]).unwrap();

    let serial_number_nonce_bytes = hex::decode(TEST_RECORD_SERIAL_NUMBER_NONCE).unwrap();
    let serial_number_nonce =
        <Record<Testnet1> as RecordScheme>::SerialNumberNonce::read(&serial_number_nonce_bytes[..]).unwrap();

    let commitment_randomness_bytes = hex::decode(TEST_RECORD_COMMITMENT_RANDOMNESS).unwrap();
    let commitment_randomness =
        <Record<Testnet1> as RecordScheme>::CommitmentRandomness::read(&commitment_randomness_bytes[..]).unwrap();

    let commitment_bytes = hex::decode(TEST_RECORD_COMMITMENT).unwrap();
    let commitment = <Record<Testnet1> as RecordScheme>::Commitment::read(&commitment_bytes[..]).unwrap();

    // Generate new record from randomness
    let given_record = Record::<Testnet1>::new()
        .owner(owner.clone())
        .value(value)
        .payload(payload.clone())
        .birth_program_id(program_snark_vk_bytes.clone())
        .death_program_id(program_snark_vk_bytes.clone())
        .serial_number_nonce(serial_number_nonce)
        .commitment_randomness(commitment_randomness)
        .build()
        .unwrap();

    assert_eq!(given_record.owner(), &owner.address);

    assert_eq!(given_record.value(), value);

    assert_eq!(given_record.payload(), &payload);

    assert_eq!(given_record.birth_program_id(), program_snark_vk_bytes);

    assert_eq!(given_record.death_program_id(), program_snark_vk_bytes);

    assert_eq!(given_record.serial_number_nonce(), &serial_number_nonce);

    assert_eq!(given_record.commitment_randomness(), commitment_randomness);

    assert_eq!(given_record.commitment(), commitment);
}
