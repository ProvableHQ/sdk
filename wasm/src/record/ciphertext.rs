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

use crate::record::Record;
use aleo_account::ViewKey;
use aleo_record::RecordCiphertext as AleoRecordCiphertext;
use rand::{rngs::StdRng, SeedableRng};
use std::str::FromStr;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Eq, PartialEq, Debug)]
pub struct RecordCiphertext {
    pub(crate) ciphertext: AleoRecordCiphertext,
}

#[wasm_bindgen]
impl RecordCiphertext {
    #[wasm_bindgen]
    pub fn new(ciphertext: String) -> RecordCiphertext {
        Self {
            ciphertext: AleoRecordCiphertext::from_str(&ciphertext).unwrap(),
        }
    }

    #[wasm_bindgen]
    pub fn encrypt(record: Record) -> Result<RecordCiphertext, JsValue> {
        let rng = &mut StdRng::from_entropy();
        match AleoRecordCiphertext::encrypt(&record.record, rng) {
            Ok((ciphertext, _)) => Ok(Self { ciphertext }),
            Err(e) => Err(JsValue::from(e.to_string())),
        }
    }

    #[wasm_bindgen]
    pub fn decrypt(&self, view_key_string: String) -> Result<Record, JsValue> {
        let view_key = ViewKey::from_str(&view_key_string).unwrap();
        match self.ciphertext.decrypt(&view_key) {
            Ok(record) => Ok(Record { record }),
            Err(e) => Err(JsValue::from(e.to_string())),
        }
    }

    #[wasm_bindgen]
    pub fn to_string(&self) -> String {
        self.ciphertext.to_string()
    }
}

#[cfg(test)]
mod tests {
    use crate::record::{Record, RecordCiphertext};
    use wasm_bindgen_test::*;

    pub const TEST_RECORD_VIEW_KEY: &str = "AViewKey1iAf6a7fv6ELA4ECwAth1hDNUJJNNoWNThmREjpybqder";
    pub const TEST_ENCRYPTED_RECORD: &str = "e539affcd108a54c892d86d75e107ca2d281b63ac916041e36ea269a99ac5a0dcbe71a714bd64b50547bc9e7fbe499f1eb88d0b89287fa496f9e87bf53e1c604b0a25c97bb8769b361ba6864e4e03422f6edd4e68201a03255dd3d2d68d0120bf6a62edf17ae1b2af8a3b34f86a334de223a390dd374ef6aeff5233bc12c5e060f4cfdd8255124b86e9ccd6a518d4627cd34cc7503716a553ee7d42159451c022b923299e9b6114e02b4145e094f9572d5aa3cb20a07e969dfcf974801d8c60abacb46d373615a98d30c760734e93fe8143567b4a0f51be8d749ce123fb77e0492ac4a566e8537d4e8c7931a2b93dad0a77dfaa401b0677a99e8bb08ed8e460c02133f0cddd24bdc9abf7c5a382cd82ef1324c3633d11f79a409ac4702e93b0c9cfb4ae36875c2c533697c7ba184de131cd2ed354772d64cbc1fb595165ab204";
    pub const TEST_RECORD: &str = r#"{
  "commitment": "cm15s5gmwnkzv2c93astu74qvu2n2kcv2p6zc9dufy24hpcw5vf6uqq6y8eqj",
  "commitment_randomness": "cr1n9u2c2farxq8xsczqqqcd4rm2c9y4jcm860letr3pzwdwrl3rczqv02sdt",
  "owner": "aleo1d5hg2z3ma00382pngntdp68e74zv54jdxy249qhaujhks9c72yrs33ddah",
  "payload": "f9de633637e392e55b8bf2cc886ac5d1d7e439c035e353669a3a78c795e586c28de17cf544e6c5afb3c57f53cfb755a4e6180e5be6d5a41ef340b884c6782ce4ca2140162f4d11013925206f4fd4f275004820aa31f0915f6cfc6710a93b312056876a2540d8078623dd14bfd92eea9a582b2f86660ef98abc7d5e393e7cb7dd",
  "program_id": "ap1vyxdja243p7ft8mmgfewaq02h6uvkua02n9echr83qhlr6mz32xqk4n8ut2tvyhmvxp27kjeeedqzhcpj3j",
  "serial_number_nonce": "sn16w32pks5xrf5c5dv9jjt748at25wpme9xuhzhpthzjwuqh08euqsxdrl8z",
  "value": 1234
}"#;

    pub const TEST_WRONG_VIEW_KEY: &str = "AViewKey1g32w2Dd8FjsKRCrYvfQKXnM5577N6hfkvHNcbUiAcHBN";

    #[wasm_bindgen_test]
    fn decrypt_record_test() {
        let record = Record::from_string(TEST_RECORD);
        let record_ciphertext = RecordCiphertext::new(TEST_ENCRYPTED_RECORD.to_string());

        let decrypted_record = record_ciphertext.decrypt(TEST_RECORD_VIEW_KEY.to_string()).unwrap();
        assert_eq!(record, decrypted_record);
    }

    #[wasm_bindgen_test]
    fn decrypt_record_wrong_view_key_test() {
        let record_ciphertext = RecordCiphertext::new(TEST_ENCRYPTED_RECORD.to_string());
        let decrypted_record = record_ciphertext.decrypt(TEST_WRONG_VIEW_KEY.to_string());
        assert!(decrypted_record.is_err());
    }

    #[wasm_bindgen_test]
    fn encrypt_record_test() {
        let record = Record::from_string(TEST_RECORD);

        let expected_record = RecordCiphertext::new(TEST_ENCRYPTED_RECORD.to_string())
            .decrypt(TEST_RECORD_VIEW_KEY.to_string())
            .unwrap();
        assert_eq!(expected_record, record)
    }

    #[wasm_bindgen_test]
    fn to_string_test() {
        let record_ciphertext = RecordCiphertext::new(TEST_ENCRYPTED_RECORD.to_string());

        assert_eq!(TEST_ENCRYPTED_RECORD, record_ciphertext.to_string());
    }
}
