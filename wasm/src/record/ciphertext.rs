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

use aleo_account::ViewKey;
use aleo_record::{DecryptionKey, RecordCiphertext as CiphertextNative, RecordViewKey};
use std::str::FromStr;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Eq, PartialEq, Debug)]
pub struct Ciphertext {
    pub(crate) ciphertext: CiphertextNative,
}

#[wasm_bindgen]
impl Ciphertext {
    #[wasm_bindgen]
    pub fn from_string(ciphertext: String) -> Ciphertext {
        Self {
            ciphertext: CiphertextNative::from_str(&ciphertext).unwrap(),
        }
    }

    #[wasm_bindgen]
    pub fn is_owner(&self, account_view_key_string: String) -> bool {
        let account_view_key = ViewKey::from_str(&account_view_key_string).unwrap();
        self.ciphertext.is_owner(&account_view_key)
    }

    #[wasm_bindgen]
    pub fn to_plaintext(&self, decryption_key: String) -> Result<String, JsValue> {
        // Attempt to decrypt as account view key string first and record view key second.
        let decryption_key: DecryptionKey = match ViewKey::from_str(&decryption_key) {
            Ok(view_key) => view_key.into(),
            Err(_) => DecryptionKey::from_record_view_key(&RecordViewKey::from_str(&decryption_key).unwrap()),
        };
        match self.ciphertext.to_plaintext(&decryption_key) {
            Ok((record_bytes, _record_view_key)) => Ok(hex::encode(&record_bytes[..])),
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
    use crate::record::{Ciphertext, Record};
    use aleo_account::Address;
    use aleo_record::{AleoAmount, Network, Payload, Testnet2};
    use snarkvm_utilities::FromBytes;
    use std::io::Cursor;
    use wasm_bindgen_test::*;

    pub const TEST_ACCOUNT_VIEW_KEY: &str = "AViewKey1sYw6xvs7q6HHeiKnRceuCo1rHy7wFQGngf6JiLD6UUqE";
    // pub const TEST_PRIVATE_KEY: &str = "APrivateKey1zkpDHHovMFpfRonXDGRSEHCHbCvmXLftUqEmjbrRmB5hAm6";
    // pub const TEST_ADDRESS: &str = "aleo16q7dkt4pf047kv6rsvvu89lnp33wvrksfy0yz5ewf6m5rkr57vpsr6kg8z";

    pub const TEST_RECORD_VIEW_KEY: &str = "rcvk1ud7wnegus6v56d7w7czeh7hn0qjp65m9gpaxfdyew3l77f35luzqszjk8g";
    pub const TEST_CIPHERTEXT: &str = "recd1484ja6rq2k2tpt2lg5rgl3hdl8z4c45yknz0t9unl2f7752gpuxnkusew2tpxm4tf3susgsez6d9xasme7en5gjmegdycvnyh6w95rgtdtvgsw3sfff7z0chn380dyuhj3jnafxczvpy57hezxewk349qec39qmfen5hajjz0zda2yxwumsn8cmku970h342xdm7v0s6kv2qjyygjqdxwgk6s90tjped8l0ca8ktnznw59mggakk7vxuszmkp8s2gqw7u9fd7k6d0m6edfv8janawnajm8etx4f8z3pwk8ekk9ktnczw050cjlmvz85k8thxg08xm5ae69azcsyhy0v06m7va7h34lzkqz5w9ur7ur047xglsxy5yqcqluttchz5p4dwcu6cfkdvy4557k8rqp9k6ycj9tutvckftq93d494cgaklhapkqzh2xgmta90lg65f5npqd893ss";
    pub const TEST_RECORD: &str = r#"{
  "owner": "aleo16q7dkt4pf047kv6rsvvu89lnp33wvrksfy0yz5ewf6m5rkr57vpsr6kg8z",
  "value": 1234,
  "payload": "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "program_id": "ap1lhj3g5uzervu3km7rl0rsd0u5j6pj9ujum6yxrvms4mx8r2qhew88ga849hnjypghswxceh02frszs45qmd",
  "randomizer": "rr1484ja6rq2k2tpt2lg5rgl3hdl8z4c45yknz0t9unl2f7752gpuxsm2avqc",
  "record_view_key": "rcvk1ud7wnegus6v56d7w7czeh7hn0qjp65m9gpaxfdyew3l77f35luzqszjk8g",
  "commitment": "cm1gedwyp35zzlj0tfrevc4fgjhctpmqy02ztyc3859t9zjzl85pgyqn2a639"
}"#;

    #[wasm_bindgen_test]
    fn is_owner_test() {
        let ciphertext = Ciphertext::from_string(TEST_CIPHERTEXT.to_string());

        assert!(ciphertext.is_owner(TEST_ACCOUNT_VIEW_KEY.to_string()))
    }

    #[wasm_bindgen_test]
    fn to_plaintext_test() {
        let expected_record = Record::from_string(TEST_RECORD);
        let record_ciphertext = Ciphertext::from_string(TEST_CIPHERTEXT.to_string());

        let record_plaintext = record_ciphertext
            .to_plaintext(TEST_RECORD_VIEW_KEY.to_string())
            .unwrap();

        let record_plaintext_bytes = hex::decode(record_plaintext).unwrap();
        let mut cursor = Cursor::new(record_plaintext_bytes);
        let candidate_owner = Address::read_le(&mut cursor).unwrap().to_string();
        let candidate_is_dummy = u8::read_le(&mut cursor).unwrap();
        let candidate_value = AleoAmount::read_le(&mut cursor).unwrap();
        let candidate_payload = Payload::read_le(&mut cursor).unwrap().to_string();
        let candidate_program_id = <Testnet2 as Network>::ProgramID::read_le(&mut cursor)
            .unwrap()
            .to_string();

        assert_eq!(expected_record.owner(), candidate_owner);
        assert_eq!(expected_record.is_dummy() as u8, candidate_is_dummy);
        assert_eq!(expected_record.value(), candidate_value.as_i64());
        assert_eq!(expected_record.payload(), candidate_payload);
        assert_eq!(expected_record.program_id(), candidate_program_id);
    }

    #[wasm_bindgen_test]
    fn to_string_test() {
        let record_ciphertext = Ciphertext::from_string(TEST_CIPHERTEXT.to_string());

        assert_eq!(TEST_CIPHERTEXT, record_ciphertext.to_string());
    }
}
