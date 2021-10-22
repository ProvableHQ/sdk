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

    pub const TEST_RECORD_VIEW_KEY: &str = "AViewKey1eUcCcmwtfgQSFnJLWht2oAtsX7hUwidF3NxbBRmtGCVQ";
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
