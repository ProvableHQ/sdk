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
use crate::{Record, RecordBuilder, RecordCiphertext};

use snarkvm_dpc::{Account, AccountScheme, Address, AleoAmount, ComputeKey, Network, Payload, PrivateKey};
use snarkvm_utilities::FromBytes;

use rand::thread_rng;
use snarkvm_algorithms::CommitmentScheme;
use snarkvm_dpc::network::testnet2::Testnet2;
use std::str::FromStr;

pub const TEST_NOOP_PROGRAM_ID: &str =
    "65e82032c8fc5e1f0d72352116563e3414e126ea5d6bd5b45dacc069c77fa8545da03f96eeaed603495860a0a89a1e00";
pub const TEST_PRIVATE_KEY: &str = "APrivateKey1zkpGK4YrQyh9eh5PZb3yA5Qqeosg5wb3CoyBtrW31cvTMc5";
pub const TEST_RECORD_OWNER: &str = "aleo1tvs8cfdfes7ktmzca85yqay342l2dhy6w42p0exdz5g6g7h6dv9qspyu68";
pub const TEST_ENCRYPTED_RECORD: &str = "40013daa2e7118c256214fe43b9991ff9e180eae719c3055d1e05a82772e892e160f73ce422217aac220a4a63b3657aeb671fb9564bd92915b74cfbac1fc8074d40215f07f0365bcb751cc9decafcecb2d1d66fd9d58adede8375fa7f884c9a4a406182e3e6c89d0b613329d0951419d79e093ce31f909f9b1970a36ea69f742b70ab491fb9e528615ee265917604404fd174559f9a103292d4b4359d84b54c18403fcb0abe6262b656ef18573bb86beadda6d481027da4ed6cdc738a18adfe1190fee888efca69120b559b16a51fa4a135d8547b3871a3777b4387333c30157db035a32b0c3e0c062ff670db9a8ad44180890cb237ae22de9304ec24c20cade500a42d83c9ec14ce5e4f24064e9c9e54606424d1af08ec80fca4a118bef0901350cceabbf30be907e57c403bf53d9ec3a907435596a84e52bc64d804fd4cf1b4005f2c0927a467790e4faf2f7650f75e18ebbf10a0e954c26a0088a20a7f627b401";
pub const TEST_RECORD: &str = "5b207c25a9cc3d65ec58e9e8407491aabea6dc9a755417e4cd1511a47afa6b0ad204000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000065e82032c8fc5e1f0d72352116563e3414e126ea5d6bd5b45dacc069c77fa8545da03f96eeaed603495860a0a89a1e001d7c00289aaa122fda585f50039736c3d2f2420c7fc7c896a9e2b9c63d9658027d0be67f6fe333fc0f9c449c8b2f0476c475b458de948277d7f2650ad3f39802";
pub const TEST_RECORD_VALUE: u64 = 1234;
pub const TEST_RECORD_PAYLOAD: &str = "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
pub const TEST_RECORD_SERIAL_NUMBER_NONCE: &str = "1d7c00289aaa122fda585f50039736c3d2f2420c7fc7c896a9e2b9c63d965802";
pub const TEST_SERIAL_NUMBER: &str = "3576fc686f3ab2439c14c6008ff90adb30d5bcf0884d0fac2c36bc8609a3b503";
pub const TEST_RECORD_COMMITMENT_RANDOMNESS: &str = "7d0be67f6fe333fc0f9c449c8b2f0476c475b458de948277d7f2650ad3f39802";
pub const TEST_RECORD_COMMITMENT: &str = "0edae0842f26ea03835faa88ff29e2b57c910e02fb7e8d1f702374f0efa8f810";

// Generates test data and prints to the console
#[allow(dead_code)]
fn print_test_record() {
    use snarkvm_utilities::ToBytes;

    let rng = &mut thread_rng();
    let account = snarkvm_dpc::Account::<Testnet2>::new(rng);
    let coinbase_record =
        snarkvm_dpc::Transaction::new_coinbase(account.address(), AleoAmount(TEST_RECORD_VALUE as i64), rng)
            .unwrap()
            .transitions()
            .iter()
            .next()
            .unwrap()
            .ciphertexts()
            .iter()
            .next()
            .unwrap()
            .decrypt(account.view_key())
            .unwrap();
    println!(
        "NOOP PID: {}",
        hex::encode(Testnet2::noop_program_id().to_bytes_le().unwrap())
    );
    println!("Owner: {}", coinbase_record.owner());
    println!("Private Key: {}", account.private_key());
    println!(
        "RecordCiphertext: {}",
        hex::encode(
            RecordCiphertext::encrypt(&coinbase_record, rng)
                .unwrap()
                .to_bytes_le()
                .unwrap()
        )
    );
    println!("Record: {}", coinbase_record);
    println!(
        "Payload: {}",
        hex::encode(coinbase_record.payload().to_bytes_le().unwrap())
    );
    println!(
        "SN Nonce: {}",
        hex::encode(coinbase_record.serial_number_nonce().to_bytes_le().unwrap())
    );
    println!(
        "SN: {}",
        hex::encode(
            coinbase_record
                .to_serial_number(&ComputeKey::<Testnet2>::from_private_key(account.private_key()))
                .unwrap()
                .to_bytes_le()
                .unwrap()
        )
    );
    println!(
        "CM Randomness: {}",
        hex::encode(coinbase_record.commitment_randomness().to_bytes_le().unwrap())
    );
    println!(
        "CM: {}",
        hex::encode(coinbase_record.commitment().to_bytes_le().unwrap())
    );
}

#[test]
fn test_record_from_str() {
    let record = Record::<Testnet2>::from_str(TEST_RECORD);
    assert!(record.is_ok());

    let candidate_record = record.unwrap().to_string();
    assert_eq!(TEST_RECORD, candidate_record);
}

#[test]
fn test_build_record() {
    // Load noop program id.
    let noop_program_id = *Testnet2::noop_program_id();

    let owner = Address::<Testnet2>::from_str(TEST_RECORD_OWNER).unwrap();

    let value = TEST_RECORD_VALUE;

    let payload_bytes = hex::decode(TEST_RECORD_PAYLOAD).unwrap();
    let payload = Payload::read_le(&payload_bytes[..]).unwrap();

    let serial_number_nonce_bytes = hex::decode(TEST_RECORD_SERIAL_NUMBER_NONCE).unwrap();
    let serial_number_nonce = <Testnet2 as Network>::SerialNumber::read_le(&serial_number_nonce_bytes[..]).unwrap();

    let commitment_randomness_bytes = hex::decode(TEST_RECORD_COMMITMENT_RANDOMNESS).unwrap();
    let commitment_randomness = <<Testnet2 as Network>::CommitmentScheme as CommitmentScheme>::Randomness::read_le(
        &commitment_randomness_bytes[..],
    )
    .unwrap();

    let commitment_bytes = hex::decode(TEST_RECORD_COMMITMENT).unwrap();
    let commitment = <Testnet2 as Network>::Commitment::read_le(&commitment_bytes[..]).unwrap();

    // Construct record with builder
    let actual_record = RecordBuilder::<Testnet2>::new()
        .owner(owner.clone())
        .value(value)
        .payload(payload.clone())
        .program_id(noop_program_id)
        .serial_number_nonce(serial_number_nonce.clone())
        .commitment_randomness(commitment_randomness)
        .build()
        .unwrap();

    let expected_record = Record::<Testnet2>::from(
        owner,
        value,
        payload.clone(),
        noop_program_id,
        serial_number_nonce,
        commitment_randomness,
    )
    .unwrap();

    assert_eq!(actual_record.owner(), owner);

    assert_eq!(actual_record.value(), value);

    assert_eq!(*actual_record.payload(), payload);

    assert_eq!(actual_record.program_id(), noop_program_id);

    assert_eq!(actual_record.serial_number_nonce(), serial_number_nonce);

    assert_eq!(actual_record.commitment_randomness(), commitment_randomness);

    assert_eq!(actual_record.commitment(), commitment);

    assert_eq!(actual_record, expected_record);
}

#[test]
fn test_encrypted_record() {
    let private_key = PrivateKey::<Testnet2>::from_str(TEST_PRIVATE_KEY).unwrap();
    let account = Account::<Testnet2>::from(private_key);
    let view_key = account.view_key();

    let record_ciphertext =
        RecordCiphertext::<Testnet2>::from_bytes_le(&hex::decode(TEST_ENCRYPTED_RECORD).unwrap()).unwrap();
    let decrypted_record = record_ciphertext.decrypt(view_key).unwrap();
    let record = Record::<Testnet2>::from_str(TEST_RECORD).unwrap();

    assert_eq!(decrypted_record, record);
}
