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
use crate::{EncodedRecord, EncryptedRecord, Record};
use aleo_account::{Address, PrivateKey, ViewKey};
use aleo_network::{Network, Testnet1};

use snarkvm_algorithms::traits::CRH;
use snarkvm_dpc::{
    testnet1::{
        instantiated::ProgramVerificationKeyCRH,
        payload::Payload,
        NoopProgramSNARKParameters,
        SystemParameters,
    },
    DPCComponents,
    RecordScheme,
};
use snarkvm_utilities::{to_bytes, FromBytes, ToBytes};

use rand::{rngs::StdRng, SeedableRng};
use rand_chacha::ChaChaRng;
use std::str::FromStr;

pub const TEST_RECORD: &str = "4f6d042c3bc73e412f4b4740ad27354a1b25bb9df93f29313350356aa88dca050064000000000000000000000000000000000000000000000000000000000000000000000000000000304e7ae3ef9577877ddcef8f8c5d9b5e3bf544c78c50c51213857f35c33c3502df12f0fb72a0d7c56ccd31a87dada92b00304e7ae3ef9577877ddcef8f8c5d9b5e3bf544c78c50c51213857f35c33c3502df12f0fb72a0d7c56ccd31a87dada92b00d3cb77fba8ef681178b0dd54dedae5d8c72ea496acb71a788a9bf3be8cf552082ffd75e3e518853ef2328b72b29cda505241bf26b264e85cb12556e3d4556b03e095bb02db522a7dd926a2dff52838bb541dd9cf6eb07c416deeee6f30e54a02";
pub const TEST_ENCRYPTED_RECORD: &str = "0841ad8eb642c4a2475e2d6c3548f445253db290842531d9b5e25effe74d3eee03c097f5273f56517fe1615100f820577619242101568ddc5da5972b7b7c1c760a6969ddc7ed39cd774a18bc15d5cf38c6d59df1d14e05add65f0e4e6a54b2c901f1580a556f9e9f8e438cdb0d92fa0da1642816eb9318c14387be499d7481950847131dbb8496d3dcc58811dfa96df2bd2ad769cb69438bb1a2657625686b140f1196bfe7a292673f8502acc9cd1ac30f0d16342759105882b3026dafa030320285daefd9fde6dc65dd33541452b43a3bf17e57cf2f147392edc8f8c65af3850020b79c96609743cbfd0b21249265c84344e1c993b480cd042e296d66c17bc7056500";
pub const TEST_RECORD_OWNER: &str = "aleo1faksgtpmculyzt6tgaq26fe4fgdjtwualyljjvfn2q6k42ydegzspfz9uh";
pub const TEST_RECORD_VALUE: u64 = 100;
pub const TEST_RECORD_PAYLOAD: &str = "0000000000000000000000000000000000000000000000000000000000000000";
pub const TEST_RECORD_SERIAL_NUMBER_NONCE: &str = "d3cb77fba8ef681178b0dd54dedae5d8c72ea496acb71a788a9bf3be8cf55208";
pub const TEST_RECORD_COMMITMENT_RANDOMNESS: &str = "e095bb02db522a7dd926a2dff52838bb541dd9cf6eb07c416deeee6f30e54a02";
pub const TEST_RECORD_COMMITMENT: &str = "2ffd75e3e518853ef2328b72b29cda505241bf26b264e85cb12556e3d4556b03";
pub const TEST_SERIAL_NUMBER: &str = "7b5ead0c963658ed7127bcdcb916eb42397824ee82a23c8c3435a60469630410afc2550c22cb9c3b26c5899a4b8150f12b75cfcc032d21dd735b1feb5d87e50e";
pub const TEST_PRIVATE_KEY: &str = "APrivateKey1tvv5YV1dipNiku2My8jMkqpqCyYKvR5Jq4y2mtjw7s77Zpn";

#[test]
fn test_record_from_str() {
    let record = Record::<Testnet1>::from_str(TEST_RECORD);
    assert!(record.is_ok());

    let candidate_record = record.unwrap().to_string();
    assert_eq!(TEST_RECORD, candidate_record);
}

#[test]
pub fn test_serial_number_derivation() {
    let record = Record::<Testnet1>::from_str(TEST_RECORD).unwrap();
    let private_key = PrivateKey::from_str(TEST_PRIVATE_KEY).unwrap();

    let serial_number = record.to_serial_number(&private_key);
    assert!(serial_number.is_ok());

    let candidate_serial_number = hex::encode(serial_number.unwrap());

    println!("{} == {}", TEST_SERIAL_NUMBER, candidate_serial_number);
    assert_eq!(TEST_SERIAL_NUMBER, candidate_serial_number);
}

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

#[test]
fn test_encoded_record() {
    let rng = &mut ChaChaRng::seed_from_u64(1231275789u64);

    // Load system parameters for the ledger, commitment schemes, CRH, and the noop program.
    let system_parameters = SystemParameters::<<Testnet1 as Network>::Components>::load().unwrap();
    let program_snark_pp = NoopProgramSNARKParameters::<<Testnet1 as Network>::Components>::load().unwrap();

    let program_snark_vk_bytes = to_bytes![
        ProgramVerificationKeyCRH::hash(
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

    let given_record = Record::<Testnet1>::new()
        .owner(owner.clone())
        .value(value)
        .payload(payload)
        .birth_program_id(program_snark_vk_bytes.clone())
        .death_program_id(program_snark_vk_bytes)
        .serial_number_nonce(serial_number_nonce)
        .calculate_commitment_randomness(rng)
        .build()
        .unwrap();

    let encoded_record = EncodedRecord::from(&given_record).unwrap();
    let decoded_record = encoded_record.decode::<Testnet1>(owner).unwrap();

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

#[test]
fn test_encrypted_record() {
    let mut rng = &mut StdRng::from_entropy();

    // Load system parameters for the ledger, commitment schemes, CRH, and the
    // "always-accept" program.
    let system_parameters = SystemParameters::<<Testnet1 as Network>::Components>::load().unwrap();
    let program_snark_pp = NoopProgramSNARKParameters::<<Testnet1 as Network>::Components>::load().unwrap();

    let program_snark_vk_bytes = to_bytes![
        ProgramVerificationKeyCRH::hash(
            &system_parameters.program_verification_key_crh,
            &to_bytes![program_snark_pp.verification_key].unwrap()
        )
        .unwrap()
    ]
    .unwrap();

    let private_key = PrivateKey::from_str(TEST_PRIVATE_KEY).unwrap();
    let owner = Address::from(&private_key).unwrap();
    let view_key = ViewKey::from(&private_key).unwrap();
    let value = TEST_RECORD_VALUE;

    let payload_bytes = hex::decode(TEST_RECORD_PAYLOAD).unwrap();
    let payload = Payload::read(&payload_bytes[..]).unwrap();

    let serial_number_nonce_bytes = hex::decode(TEST_RECORD_SERIAL_NUMBER_NONCE).unwrap();
    let serial_number_nonce =
        <Record<Testnet1> as RecordScheme>::SerialNumberNonce::read(&serial_number_nonce_bytes[..]).unwrap();

    let given_record = Record::<Testnet1>::new()
        .owner(owner)
        .value(value)
        .payload(payload)
        .birth_program_id(program_snark_vk_bytes.clone())
        .death_program_id(program_snark_vk_bytes)
        .serial_number_nonce(serial_number_nonce)
        .calculate_commitment_randomness(rng)
        .build()
        .unwrap();

    // Encrypt the record
    let (_, encrypted_record) = EncryptedRecord::from(&given_record, &mut rng).unwrap();

    // Decrypt the record
    let decrypted_record = encrypted_record.decrypt::<Testnet1>(&view_key).unwrap();

    assert_eq!(given_record.to_string(), decrypted_record.to_string());
}
