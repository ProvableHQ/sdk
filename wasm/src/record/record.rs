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

use aleo_record::Record as RecordNative;

use snarkvm_utilities::ToBytes;
use std::str::FromStr;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Eq, PartialEq, Debug)]
pub struct Record {
    pub(crate) record: RecordNative,
}

#[wasm_bindgen]
impl Record {
    #[wasm_bindgen]
    pub fn from_string(record: &str) -> Self {
        Self {
            record: RecordNative::from_str(record).unwrap(),
        }
    }

    #[wasm_bindgen]
    pub fn is_dummy(&self) -> bool {
        self.record.is_dummy()
    }

    #[wasm_bindgen]
    pub fn owner(&self) -> String {
        self.record.owner().to_string()
    }

    #[wasm_bindgen]
    pub fn value(&self) -> i64 {
        self.record.value().as_i64()
    }

    #[wasm_bindgen]
    pub fn payload(&self) -> String {
        self.record.payload().to_string()
    }

    #[wasm_bindgen]
    pub fn program_id(&self) -> String {
        self.record.program_id().to_string()
    }

    #[wasm_bindgen]
    pub fn randomizer(&self) -> String {
        self.record.randomizer().to_string()
    }

    #[wasm_bindgen]
    pub fn record_view_key(&self) -> String {
        self.record.record_view_key().to_string()
    }

    #[wasm_bindgen]
    pub fn commitment(&self) -> String {
        self.record.commitment().to_string()
    }

    #[wasm_bindgen]
    pub fn ciphertext(&self) -> String {
        hex::encode(self.record.ciphertext().to_bytes_le().unwrap())
    }

    #[wasm_bindgen]
    #[allow(clippy::inherent_to_string)]
    pub fn to_string(&self) -> String {
        self.record.to_string()
    }
}

// todo @collinc97: update testnet2 record test data
// #[cfg(test)]
// mod tests {
//     use crate::record::Record;
//     use wasm_bindgen_test::*;
//
//     // pub const TEST_ENCRYPTED_RECORD: &str = "fe9da41a69bb6c123c5efb6eddb631f30d15afc13a16f5b0dd0e84fdc69b7d0e9716f6c7c6b408ae86f003ebbde81351c25f7d1aa2dced557a98ed0d04cefb059ba863e82aaec5038b0e93dd731ed2f4829b73867621a2e8d7398e8266269812b8e4f147f0237c46d97b447d6ef43cda46c8eeb7bd21665b44068daf6b75390397f78140b1714af29d35b33b673dc5f34368878865ad5de762142fd314fd161042418e7be64a5a10c2ab7a02f7209b90f9a9fe209eb1b6dcb5e0ac9dfd799211094d4a11d0460002c2cc7f89c1bfc927b8b25132bc7741ef920bd7e750103b0a83452b530f6fa021f10010b332d2db9b8f28bd7aa776d628a7e2872b04fd520c10016cca0ac481f7e54be1d0a0777f03acee6b5526882bb51812dbefe3df510031dd6dd4fd9d4ac9ecf37dab27471d1b52e304cefbc21872394cf0ab12734d0f";
//     // pub const TEST_PRIVATE_KEY: &str = "APrivateKey1zkpJBBaC1KFHUYvkjJr5BAEmCMWhmr64PSUrf2NUbN834pF,";
//     // pub const TEST_VIEW_KEY: &str = "AViewKey1eUcCcmwtfgQSFnJLWht2oAtsX7hUwidF3NxbBRmtGCVQ";
//
//     pub const TEST_RECORD_OWNER: &str = "aleo1d5hg2z3ma00382pngntdp68e74zv54jdxy249qhaujhks9c72yrs33ddah";
//     pub const TEST_RECORD: &str = r#"{
//   "commitment": "cm15s5gmwnkzv2c93astu74qvu2n2kcv2p6zc9dufy24hpcw5vf6uqq6y8eqj",
//   "record_view_key": "cr1n9u2c2farxq8xsczqqqcd4rm2c9y4jcm860letr3pzwdwrl3rczqv02sdt",
//   "owner": "aleo1d5hg2z3ma00382pngntdp68e74zv54jdxy249qhaujhks9c72yrs33ddah",
//   "payload": "f9de633637e392e55b8bf2cc886ac5d1d7e439c035e353669a3a78c795e586c28de17cf544e6c5afb3c57f53cfb755a4e6180e5be6d5a41ef340b884c6782ce4ca2140162f4d11013925206f4fd4f275004820aa31f0915f6cfc6710a93b312056876a2540d8078623dd14bfd92eea9a582b2f86660ef98abc7d5e393e7cb7dd",
//   "program_id": "ap1vyxdja243p7ft8mmgfewaq02h6uvkua02n9echr83qhlr6mz32xqk4n8ut2tvyhmvxp27kjeeedqzhcpj3j",
//   "randomizer": "sn16w32pks5xrf5c5dv9jjt748at25wpme9xuhzhpthzjwuqh08euqsxdrl8z",
//   "value": 1234
// }"#;
//     pub const TEST_RECORD_COMMITMENT: &str = "cm15s5gmwnkzv2c93astu74qvu2n2kcv2p6zc9dufy24hpcw5vf6uqq6y8eqj";
//     pub const TEST_RECORD_COMMITMENT_RANDOMNESS: &str = "cr1n9u2c2farxq8xsczqqqcd4rm2c9y4jcm860letr3pzwdwrl3rczqv02sdt";
//     pub const TEST_RECORD_PAYLOAD: &str = "f9de633637e392e55b8bf2cc886ac5d1d7e439c035e353669a3a78c795e586c28de17cf544e6c5afb3c57f53cfb755a4e6180e5be6d5a41ef340b884c6782ce4ca2140162f4d11013925206f4fd4f275004820aa31f0915f6cfc6710a93b312056876a2540d8078623dd14bfd92eea9a582b2f86660ef98abc7d5e393e7cb7dd";
//     pub const TEST_NOOP_PROGRAM_ID: &str =
//         "ap1vyxdja243p7ft8mmgfewaq02h6uvkua02n9echr83qhlr6mz32xqk4n8ut2tvyhmvxp27kjeeedqzhcpj3j";
//     pub const TEST_RECORD_SERIAL_NUMBER_NONCE: &str = "sn16w32pks5xrf5c5dv9jjt748at25wpme9xuhzhpthzjwuqh08euqsxdrl8z";
//     pub const TEST_RECORD_VALUE: i64 = 1234;
//
//     #[wasm_bindgen_test]
//     fn test_from_string() {
//         let record_from_string = Record::from_string(TEST_RECORD);
//
//         assert_eq!(record_from_string.owner(), TEST_RECORD_OWNER);
//         assert_eq!(record_from_string.value(), TEST_RECORD_VALUE);
//         assert_eq!(
//             record_from_string.randomizer(),
//             TEST_RECORD_SERIAL_NUMBER_NONCE
//         );
//         assert_eq!(record_from_string.program_id(), TEST_NOOP_PROGRAM_ID);
//         assert_eq!(record_from_string.payload(), TEST_RECORD_PAYLOAD);
//         assert_eq!(
//             record_from_string.record_view_key(),
//             TEST_RECORD_COMMITMENT_RANDOMNESS
//         );
//         assert_eq!(record_from_string.commitment(), TEST_RECORD_COMMITMENT);
//         assert!(!record_from_string.is_dummy());
//     }
// }
