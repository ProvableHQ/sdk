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
use crate::{Record, RecordCiphertext};

use snarkvm_dpc::{AccountScheme, AleoAmount, Network};

use aleo_account::ViewKey;
use rand::thread_rng;
use snarkvm_dpc::network::testnet2::Testnet2;
use std::str::FromStr;

pub const TEST_VIEW_KEY: &str = "AViewKey1eUcCcmwtfgQSFnJLWht2oAtsX7hUwidF3NxbBRmtGCVQ";
pub const TEST_ENCRYPTED_RECORD: &str = "fe9da41a69bb6c123c5efb6eddb631f30d15afc13a16f5b0dd0e84fdc69b7d0e9716f6c7c6b408ae86f003ebbde81351c25f7d1aa2dced557a98ed0d04cefb059ba863e82aaec5038b0e93dd731ed2f4829b73867621a2e8d7398e8266269812b8e4f147f0237c46d97b447d6ef43cda46c8eeb7bd21665b44068daf6b75390397f78140b1714af29d35b33b673dc5f34368878865ad5de762142fd314fd161042418e7be64a5a10c2ab7a02f7209b90f9a9fe209eb1b6dcb5e0ac9dfd799211094d4a11d0460002c2cc7f89c1bfc927b8b25132bc7741ef920bd7e750103b0a83452b530f6fa021f10010b332d2db9b8f28bd7aa776d628a7e2872b04fd520c10016cca0ac481f7e54be1d0a0777f03acee6b5526882bb51812dbefe3df510031dd6dd4fd9d4ac9ecf37dab27471d1b52e304cefbc21872394cf0ab12734d0f";
pub const TEST_RECORD: &str = r#"{
  "commitment": "4218024304985908499884486807040779889086035135067775071962256837276694183387",
  "commitment_randomness": "1521902152034036495150866564746129551572531637726507920867282482838392298647",
  "owner": "aleo1evf0f0nvl3yllpj0j22j6lkewkc3c6wecfl8vy9wksdww5z4j5xst5s66p",
  "payload": "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "program_id": "18400029571753438738614626927281925709440276250495863570971928333622240058519790728469309546311970535240187832421",
  "serial_number_nonce": "5455867346689625386208179041362643697790949181082665867416444278481408419120",
  "value": 1234
}"#;

// Generates test data and prints to the console
#[allow(dead_code)]
fn print_test_record() {
    let rng = &mut thread_rng();
    let account = snarkvm_dpc::Account::<Testnet2>::new(rng);
    let transaction = snarkvm_dpc::Transaction::new_coinbase(account.address(), AleoAmount(1234), rng).unwrap();
    let record_ciphertext = transaction
        .transitions()
        .iter()
        .next()
        .unwrap()
        .ciphertexts()
        .iter()
        .next()
        .unwrap();
    let coinbase_record = record_ciphertext.decrypt(account.view_key()).unwrap();
    println!("NOOP PID: {}", Testnet2::noop_program_id().to_string());
    println!("RecordCiphertext: {}", record_ciphertext);
    println!("Record: {}", coinbase_record);
    println!("Account: {}", account);
}

#[test]
fn record_decryption_test() {
    let view_key = ViewKey::from_str(TEST_VIEW_KEY).unwrap();

    let record_ciphertext = RecordCiphertext::from_str(TEST_ENCRYPTED_RECORD).unwrap();
    let decrypted_record = record_ciphertext.decrypt(&view_key).unwrap();
    let record = Record::from_str(TEST_RECORD).unwrap();

    assert_eq!(decrypted_record, record);
}
