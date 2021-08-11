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
use aleo_network::Testnet2;

use snarkvm_dpc::{
    testnet2::Testnet2Parameters,
    Address,
    NoopProgram,
    Payload,
    PrivateKey,
    ProgramScheme,
    RecordScheme,
};
use snarkvm_utilities::FromBytes;

use rand::SeedableRng;
use rand_chacha::ChaChaRng;
use std::str::FromStr;

pub const TEST_RECORD: &str = "5b194fdaf269948cf110a0947766b46b109a676572af2d87286cfdafabf93c0266742fb673162a59f6b00bb6534a210085ee08d28b2742bc665aa2ec376732a3977f3808a5f00446e93f6148146b1902010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000012321cf1b25c73a71bd13fe03a7f4d692eb835cdcf3368ce62986f3e2829540d96344b224303e2e610b9746fd946590d85f7b99bf02c416f4e10ba88f9bbdc01b678c2b064285571d6f14d2fdde5906b8488ed4da0f3e1eaa6ef06d466670a00";
pub const TEST_ENCRYPTED_RECORD: &str = "0841ad8eb642c4a2475e2d6c3548f445253db290842531d9b5e25effe74d3eee03c097f5273f56517fe1615100f820577619242101568ddc5da5972b7b7c1c760a6969ddc7ed39cd774a18bc15d5cf38c6d59df1d14e05add65f0e4e6a54b2c901f1580a556f9e9f8e438cdb0d92fa0da1642816eb9318c14387be499d7481950847131dbb8496d3dcc58811dfa96df2bd2ad769cb69438bb1a2657625686b140f1196bfe7a292673f8502acc9cd1ac30f0d16342759105882b3026dafa030320285daefd9fde6dc65dd33541452b43a3bf17e57cf2f147392edc8f8c65af3850020b79c96609743cbfd0b21249265c84344e1c993b480cd042e296d66c17bc7056500";
pub const TEST_RECORD_OWNER: &str = "aleo1faksgtpmculyzt6tgaq26fe4fgdjtwualyljjvfn2q6k42ydegzspfz9uh";
pub const TEST_RECORD_VALUE: u64 = 100;
pub const TEST_RECORD_PAYLOAD: &str = "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
pub const TEST_RECORD_SERIAL_NUMBER_NONCE: &str = "d3cb77fba8ef681178b0dd54dedae5d8c72ea496acb71a788a9bf3be8cf55208";
pub const TEST_RECORD_COMMITMENT_RANDOMNESS: &str = "e095bb02db522a7dd926a2dff52838bb541dd9cf6eb07c416deeee6f30e54a02";
pub const TEST_RECORD_COMMITMENT: &str = "539c6c38300f4a9a76fec4d1dfcfca14a397de3baace7c1599365140e3e22c12";
pub const TEST_SERIAL_NUMBER: &str = "383bb5598e831bb9a885e81b1cf0e9464499bef66f6929704eacbc6e2c48b70d091d4a3ddb3abb022543a3c3554eb19f4bfce9d9757e59dc70d9cf179ad30a02";
pub const TEST_PRIVATE_KEY: &str = "APrivateKey1tvv5YV1dipNiku2My8jMkqpqCyYKvR5Jq4y2mtjw7s77Zpn";
pub const TEST_NOOP_PROGRAM_ID: &str =
    "5b194fdaf269948cf110a0947766b46b109a676572af2d87286cfdafabf93c0266742fb673162a59f6b00bb6534a2100";

#[test]
fn test_record_from_str() {
    let record = Record::<Testnet2>::from_str(TEST_RECORD);
    assert!(record.is_ok());

    let candidate_record = record.unwrap().to_string();
    assert_eq!(TEST_RECORD, candidate_record);
}

#[test]
pub fn test_serial_number_derivation() {
    let record = Record::<Testnet2>::from_str(TEST_RECORD).unwrap();
    let private_key = PrivateKey::<Testnet2Parameters>::from_str(TEST_PRIVATE_KEY).unwrap();

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

    // Load noop program.
    let noop_program = NoopProgram::<Testnet2Parameters>::load().unwrap();

    // Generate new dummy record from randomness
    let dummy_record = Record::<Testnet2>::new_dummy(rng).unwrap();

    // Check is_dummy: true
    assert!(dummy_record.is_dummy());

    // Check value: 0u64
    assert_eq!(dummy_record.value(), 0u64);

    // Check payload: 0
    assert_eq!(dummy_record.payload(), &Payload::default());

    // Check program_id: noop_program_id
    assert_eq!(dummy_record.program_id(), noop_program.program_id());
}

#[test]
fn test_build_record() {
    // Load noop program.
    let noop_program = NoopProgram::<Testnet2Parameters>::load().unwrap();

    let owner = Address::<Testnet2Parameters>::from_str(TEST_RECORD_OWNER).unwrap();

    let value = TEST_RECORD_VALUE;

    let payload_bytes = hex::decode(TEST_RECORD_PAYLOAD).unwrap();
    let payload = Payload::read_le(&payload_bytes[..]).unwrap();

    let serial_number_nonce_bytes = hex::decode(TEST_RECORD_SERIAL_NUMBER_NONCE).unwrap();
    let serial_number_nonce =
        <Record<Testnet2> as RecordScheme>::SerialNumberNonce::read_le(&serial_number_nonce_bytes[..]).unwrap();

    let commitment_randomness_bytes = hex::decode(TEST_RECORD_COMMITMENT_RANDOMNESS).unwrap();
    let commitment_randomness =
        <Record<Testnet2> as RecordScheme>::CommitmentRandomness::read_le(&commitment_randomness_bytes[..]).unwrap();

    let commitment_bytes = hex::decode(TEST_RECORD_COMMITMENT).unwrap();
    let commitment = <Record<Testnet2> as RecordScheme>::Commitment::read_le(&commitment_bytes[..]).unwrap();

    // Generate new record from randomness
    let given_record = Record::<Testnet2>::new()
        .owner(owner.clone())
        .value(value)
        .payload(payload.clone())
        .program_id(noop_program.program_id().clone())
        .serial_number_nonce(serial_number_nonce)
        .commitment_randomness(commitment_randomness)
        .build()
        .unwrap();

    assert_eq!(given_record.owner(), owner);

    assert_eq!(given_record.value(), value);

    assert_eq!(given_record.payload(), &payload);

    assert_eq!(given_record.program_id(), noop_program.program_id());

    assert_eq!(given_record.serial_number_nonce(), &serial_number_nonce);

    assert_eq!(given_record.commitment_randomness(), commitment_randomness);

    // println!("{}", hex::encode(to_bytes_le![given_record.commitment()].unwrap()));
    assert_eq!(given_record.commitment(), commitment);
}

// #[test]
// fn test_encrypted_record() {
//     let mut rng = &mut StdRng::from_entropy();
//
//     // Load system parameters for the ledger, commitment schemes, CRH, and the
//     // "always-accept" program.
//     let system_parameters = SystemParameters::<<Testnet1 as Network>::Components>::load().unwrap();
//     let program_snark_pp = NoopProgramSNARKParameters::<<Testnet1 as Network>::Components>::load().unwrap();
//
//     let program_snark_vk_bytes = to_bytes![
//         ProgramVerificationKeyCRH::hash(
//             &system_parameters.program_verification_key_crh,
//             &to_bytes![program_snark_pp.verification_key].unwrap()
//         )
//         .unwrap()
//     ]
//         .unwrap();
//
//     let private_key = PrivateKey::from_str(TEST_PRIVATE_KEY).unwrap();
//     let owner = Address::from(&private_key).unwrap();
//     let view_key = ViewKey::from(&private_key).unwrap();
//     let value = TEST_RECORD_VALUE;
//
//     let payload_bytes = hex::decode(TEST_RECORD_PAYLOAD).unwrap();
//     let payload = Payload::read(&payload_bytes[..]).unwrap();
//
//     let serial_number_nonce_bytes = hex::decode(TEST_RECORD_SERIAL_NUMBER_NONCE).unwrap();
//     let serial_number_nonce =
//         <Record<Testnet1> as RecordScheme>::SerialNumberNonce::read(&serial_number_nonce_bytes[..]).unwrap();
//
//     let given_record = Record::<Testnet1>::new()
//         .owner(owner)
//         .value(value)
//         .payload(payload)
//         .program_id(program_snark_vk_bytes.clone())
//         .death_program_id(program_snark_vk_bytes)
//         .serial_number_nonce(serial_number_nonce)
//         .calculate_commitment_randomness(rng)
//         .build()
//         .unwrap();
//
//     // Encrypt the record
//     let (_, encrypted_record) = EncryptedRecord::from(&given_record, &mut rng).unwrap();
//
//     // Decrypt the record
//     let decrypted_record = encrypted_record.decrypt::<Testnet1>(&view_key).unwrap();
//
//     assert_eq!(given_record.to_string(), decrypted_record.to_string());
// }
