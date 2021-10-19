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
use snarkvm_utilities::{FromBytes, ToBytes};
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
            ciphertext: AleoRecordCiphertext::from_bytes_le(&hex::decode(ciphertext).unwrap()).unwrap(),
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
        hex::encode(self.ciphertext.to_bytes_le().unwrap())
    }
}

#[cfg(test)]
mod tests {
    use crate::record::{Record, RecordCiphertext};
    use wasm_bindgen_test::*;

    pub const TEST_RECORD_VIEW_KEY: &str = "AViewKey1oaPk8XVBHr9BG36NT9M4y9GWCjTbMuoj5wJoywwrenRf";
    pub const TEST_ENCRYPTED_RECORD: &str = "40013daa2e7118c256214fe43b9991ff9e180eae719c3055d1e05a82772e892e160f73ce422217aac220a4a63b3657aeb671fb9564bd92915b74cfbac1fc8074d40215f07f0365bcb751cc9decafcecb2d1d66fd9d58adede8375fa7f884c9a4a406182e3e6c89d0b613329d0951419d79e093ce31f909f9b1970a36ea69f742b70ab491fb9e528615ee265917604404fd174559f9a103292d4b4359d84b54c18403fcb0abe6262b656ef18573bb86beadda6d481027da4ed6cdc738a18adfe1190fee888efca69120b559b16a51fa4a135d8547b3871a3777b4387333c30157db035a32b0c3e0c062ff670db9a8ad44180890cb237ae22de9304ec24c20cade500a42d83c9ec14ce5e4f24064e9c9e54606424d1af08ec80fca4a118bef0901350cceabbf30be907e57c403bf53d9ec3a907435596a84e52bc64d804fd4cf1b4005f2c0927a467790e4faf2f7650f75e18ebbf10a0e954c26a0088a20a7f627b401";
    pub const TEST_RECORD: &str = "5b207c25a9cc3d65ec58e9e8407491aabea6dc9a755417e4cd1511a47afa6b0ad204000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000065e82032c8fc5e1f0d72352116563e3414e126ea5d6bd5b45dacc069c77fa8545da03f96eeaed603495860a0a89a1e001d7c00289aaa122fda585f50039736c3d2f2420c7fc7c896a9e2b9c63d9658027d0be67f6fe333fc0f9c449c8b2f0476c475b458de948277d7f2650ad3f39802";

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
