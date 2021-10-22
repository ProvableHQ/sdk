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
    pub fn owner(&self) -> String {
        self.record.owner().to_string()
    }

    #[wasm_bindgen]
    pub fn is_dummy(&self) -> bool {
        self.record.is_dummy()
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
    pub fn serial_number_nonce(&self) -> String {
        self.record.serial_number_nonce().to_string()
    }

    #[wasm_bindgen]
    pub fn commitment(&self) -> String {
        self.record.commitment().to_string()
    }

    #[wasm_bindgen]
    pub fn commitment_randomness(&self) -> String {
        self.record.commitment_randomness().to_string()
    }

    #[wasm_bindgen]
    pub fn value(&self) -> u64 {
        self.record.value()
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

    // pub const TEST_ENCRYPTED_RECORD: &str = "fe9da41a69bb6c123c5efb6eddb631f30d15afc13a16f5b0dd0e84fdc69b7d0e9716f6c7c6b408ae86f003ebbde81351c25f7d1aa2dced557a98ed0d04cefb059ba863e82aaec5038b0e93dd731ed2f4829b73867621a2e8d7398e8266269812b8e4f147f0237c46d97b447d6ef43cda46c8eeb7bd21665b44068daf6b75390397f78140b1714af29d35b33b673dc5f34368878865ad5de762142fd314fd161042418e7be64a5a10c2ab7a02f7209b90f9a9fe209eb1b6dcb5e0ac9dfd799211094d4a11d0460002c2cc7f89c1bfc927b8b25132bc7741ef920bd7e750103b0a83452b530f6fa021f10010b332d2db9b8f28bd7aa776d628a7e2872b04fd520c10016cca0ac481f7e54be1d0a0777f03acee6b5526882bb51812dbefe3df510031dd6dd4fd9d4ac9ecf37dab27471d1b52e304cefbc21872394cf0ab12734d0f";
    // pub const TEST_PRIVATE_KEY: &str = "APrivateKey1zkpJBBaC1KFHUYvkjJr5BAEmCMWhmr64PSUrf2NUbN834pF,";
    // pub const TEST_VIEW_KEY: &str = "AViewKey1eUcCcmwtfgQSFnJLWht2oAtsX7hUwidF3NxbBRmtGCVQ";

    pub const TEST_RECORD_OWNER: &str = "aleo1evf0f0nvl3yllpj0j22j6lkewkc3c6wecfl8vy9wksdww5z4j5xst5s66p";
    pub const TEST_RECORD: &str = r#"{
  "commitment": "4218024304985908499884486807040779889086035135067775071962256837276694183387",
  "commitment_randomness": "1521902152034036495150866564746129551572531637726507920867282482838392298647",
  "owner": "aleo1evf0f0nvl3yllpj0j22j6lkewkc3c6wecfl8vy9wksdww5z4j5xst5s66p",
  "payload": "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "program_id": "18400029571753438738614626927281925709440276250495863570971928333622240058519790728469309546311970535240187832421",
  "serial_number_nonce": "5455867346689625386208179041362643697790949181082665867416444278481408419120",
  "value": 1234
}"#;
    pub const TEST_RECORD_VALUE: u64 = 1234;
    pub const TEST_RECORD_PAYLOAD: &str = "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
    pub const TEST_RECORD_SERIAL_NUMBER_NONCE: &str =
        "5455867346689625386208179041362643697790949181082665867416444278481408419120";
    pub const TEST_RECORD_COMMITMENT_RANDOMNESS: &str =
        "1521902152034036495150866564746129551572531637726507920867282482838392298647";
    pub const TEST_RECORD_COMMITMENT: &str =
        "4218024304985908499884486807040779889086035135067775071962256837276694183387";
    pub const TEST_NOOP_PROGRAM_ID: &str = "18400029571753438738614626927281925709440276250495863570971928333622240058519790728469309546311970535240187832421";

    #[wasm_bindgen_test]
    fn test_from_string() {
        let record_from_string = Record::from_string(TEST_RECORD);

        assert_eq!(record_from_string.owner(), TEST_RECORD_OWNER);
        assert_eq!(record_from_string.value(), TEST_RECORD_VALUE);
        assert_eq!(
            record_from_string.serial_number_nonce(),
            TEST_RECORD_SERIAL_NUMBER_NONCE
        );
        assert_eq!(record_from_string.program_id(), TEST_NOOP_PROGRAM_ID);
        assert_eq!(record_from_string.payload(), TEST_RECORD_PAYLOAD);
        assert_eq!(
            record_from_string.commitment_randomness(),
            TEST_RECORD_COMMITMENT_RANDOMNESS
        );
        assert_eq!(record_from_string.commitment(), TEST_RECORD_COMMITMENT);
        assert!(!record_from_string.is_dummy());
    }
}
