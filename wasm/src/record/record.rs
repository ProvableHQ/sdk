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

use crate::record::Ciphertext;
use aleo_account::ViewKey;
use aleo_record::{Record as RecordNative, RecordCiphertext as CiphertextNative, RecordViewKey};

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
        console_error_panic_hook::set_once();

        Self {
            record: RecordNative::from_str(record).unwrap(),
        }
    }

    #[wasm_bindgen]
    pub fn from_account_view_key(
        account_view_key: String, // todo: use wasm ViewKey
        ciphertext: String,       // todo: use wasm Ciphertext
    ) -> Self {
        let account_view_key = ViewKey::from_str(&account_view_key).unwrap();
        let ciphertext = CiphertextNative::from_str(&ciphertext).unwrap();
        Self {
            record: RecordNative::from_account_view_key(&account_view_key, &ciphertext).unwrap(),
        }
    }

    #[wasm_bindgen]
    pub fn from_record_view_key(
        record_view_key: String, // todo: use wasm RecordViewKey
        ciphertext: String,      // todo: use wasm Ciphertext
    ) -> Self {
        let record_view_key = RecordViewKey::from_str(&record_view_key).unwrap();
        let ciphertext = CiphertextNative::from_str(&ciphertext).unwrap();
        Self {
            record: RecordNative::from_record_view_key(record_view_key, &ciphertext).unwrap(),
        }
    }

    #[wasm_bindgen]
    pub fn is_dummy(&self) -> bool {
        self.record.is_dummy()
    }

    #[wasm_bindgen]
    pub fn owner(&self) -> String {
        // todo: return wasm Address
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
        // todo: return wasm RecordViewKey
        self.record.record_view_key().to_string()
    }

    #[wasm_bindgen]
    pub fn commitment(&self) -> String {
        self.record.commitment().to_string()
    }

    #[wasm_bindgen]
    pub fn ciphertext(&self) -> String {
        // todo: return wasm Ciphertext
        self.record.ciphertext().to_string()
    }

    #[wasm_bindgen]
    #[allow(clippy::inherent_to_string)]
    pub fn to_string(&self) -> String {
        self.record.to_string()
    }
}

#[cfg(test)]
mod tests {
    use crate::record::Record;
    use wasm_bindgen_test::*;

    // pub const TEST_VIEW_KEY: &str = "AViewKey1sYw6xvs7q6HHeiKnRceuCo1rHy7wFQGngf6JiLD6UUqE";
    // pub const TEST_PRIVATE_KEY: &str = "APrivateKey1zkpDHHovMFpfRonXDGRSEHCHbCvmXLftUqEmjbrRmB5hAm6";
    // pub const TEST_ADDRESS: &str = "aleo16q7dkt4pf047kv6rsvvu89lnp33wvrksfy0yz5ewf6m5rkr57vpsr6kg8z";

    pub const TEST_DECRYPTED_RECORD: &str = r#"{
    "owner":"aleo16q7dkt4pf047kv6rsvvu89lnp33wvrksfy0yz5ewf6m5rkr57vpsr6kg8z",
    "value":1234,
    "payload":"0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    "program_id":"ap1lhj3g5uzervu3km7rl0rsd0u5j6pj9ujum6yxrvms4mx8r2qhew88ga849hnjypghswxceh02frszs45qmd",
    "randomizer":"rr1484ja6rq2k2tpt2lg5rgl3hdl8z4c45yknz0t9unl2f7752gpuxsm2avqc",
    "record_view_key":"rcvk1ud7wnegus6v56d7w7czeh7hn0qjp65m9gpaxfdyew3l77f35luzqszjk8g",
    "commitment":"cm1gedwyp35zzlj0tfrevc4fgjhctpmqy02ztyc3859t9zjzl85pgyqn2a639"
    }"#;

    pub const TEST_RECORD_OWNER: &str = "aleo16q7dkt4pf047kv6rsvvu89lnp33wvrksfy0yz5ewf6m5rkr57vpsr6kg8z";
    pub const TEST_RECORD_VALUE: i64 = 1234;
    pub const TEST_RECORD_PAYLOAD: &str = "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
    pub const TEST_NOOP_PROGRAM_ID: &str =
        "ap1lhj3g5uzervu3km7rl0rsd0u5j6pj9ujum6yxrvms4mx8r2qhew88ga849hnjypghswxceh02frszs45qmd";
    pub const TEST_RECORD_RANDOMIZER: &str = "rr1484ja6rq2k2tpt2lg5rgl3hdl8z4c45yknz0t9unl2f7752gpuxsm2avqc";
    pub const TEST_RECORD_VIEW_KEY: &str = "rcvk1ud7wnegus6v56d7w7czeh7hn0qjp65m9gpaxfdyew3l77f35luzqszjk8g";
    pub const TEST_RECORD_COMMITMENT: &str = "cm1gedwyp35zzlj0tfrevc4fgjhctpmqy02ztyc3859t9zjzl85pgyqn2a639";

    #[wasm_bindgen_test]
    fn test_from_string() {
        let record_from_string = Record::from_string(TEST_DECRYPTED_RECORD);

        assert_eq!(record_from_string.owner(), TEST_RECORD_OWNER);
        assert_eq!(record_from_string.value(), TEST_RECORD_VALUE);
        assert_eq!(record_from_string.randomizer(), TEST_RECORD_RANDOMIZER);
        assert_eq!(record_from_string.program_id(), TEST_NOOP_PROGRAM_ID);
        assert_eq!(record_from_string.payload(), TEST_RECORD_PAYLOAD);
        assert_eq!(record_from_string.record_view_key(), TEST_RECORD_VIEW_KEY);
        assert_eq!(record_from_string.commitment(), TEST_RECORD_COMMITMENT);
        assert!(!record_from_string.is_dummy());
    }
}
