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

use snarkvm_utilities::bytes::ToBytes;
use std::str::FromStr;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Record {
    pub(crate) record: RecordNative,
}
// TODO(amousa11) use native serialization/deserialization functions once implemented in snarkVM
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
        hex::encode(self.record.payload().to_bytes_le().unwrap())
    }

    #[wasm_bindgen]
    pub fn program_id(&self) -> String {
        hex::encode(self.record.program_id().to_bytes_le().unwrap())
    }

    #[wasm_bindgen]
    pub fn serial_number_nonce(&self) -> String {
        hex::encode(self.record.serial_number_nonce().to_bytes_le().unwrap())
    }

    #[wasm_bindgen]
    pub fn commitment(&self) -> String {
        hex::encode(self.record.commitment().to_bytes_le().unwrap())
    }

    #[wasm_bindgen]
    pub fn commitment_randomness(&self) -> String {
        hex::encode(self.record.commitment_randomness().to_bytes_le().unwrap())
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

    pub const TEST_NOOP_PROGRAM_ID: &str =
        "65e82032c8fc5e1f0d72352116563e3414e126ea5d6bd5b45dacc069c77fa8545da03f96eeaed603495860a0a89a1e00";
    // pub const TEST_PRIVATE_KEY: &str = "APrivateKey1zkpGK4YrQyh9eh5PZb3yA5Qqeosg5wb3CoyBtrW31cvTMc5";
    pub const TEST_RECORD_OWNER: &str = "aleo1tvs8cfdfes7ktmzca85yqay342l2dhy6w42p0exdz5g6g7h6dv9qspyu68";
    // pub const TEST_ENCRYPTED_RECORD: &str = "40013daa2e7118c256214fe43b9991ff9e180eae719c3055d1e05a82772e892e160f73ce422217aac220a4a63b3657aeb671fb9564bd92915b74cfbac1fc8074d40215f07f0365bcb751cc9decafcecb2d1d66fd9d58adede8375fa7f884c9a4a406182e3e6c89d0b613329d0951419d79e093ce31f909f9b1970a36ea69f742b70ab491fb9e528615ee265917604404fd174559f9a103292d4b4359d84b54c18403fcb0abe6262b656ef18573bb86beadda6d481027da4ed6cdc738a18adfe1190fee888efca69120b559b16a51fa4a135d8547b3871a3777b4387333c30157db035a32b0c3e0c062ff670db9a8ad44180890cb237ae22de9304ec24c20cade500a42d83c9ec14ce5e4f24064e9c9e54606424d1af08ec80fca4a118bef0901350cceabbf30be907e57c403bf53d9ec3a907435596a84e52bc64d804fd4cf1b4005f2c0927a467790e4faf2f7650f75e18ebbf10a0e954c26a0088a20a7f627b401";
    pub const TEST_RECORD: &str = "5b207c25a9cc3d65ec58e9e8407491aabea6dc9a755417e4cd1511a47afa6b0ad204000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000065e82032c8fc5e1f0d72352116563e3414e126ea5d6bd5b45dacc069c77fa8545da03f96eeaed603495860a0a89a1e001d7c00289aaa122fda585f50039736c3d2f2420c7fc7c896a9e2b9c63d9658027d0be67f6fe333fc0f9c449c8b2f0476c475b458de948277d7f2650ad3f39802";
    pub const TEST_RECORD_VALUE: u64 = 1234;
    pub const TEST_RECORD_PAYLOAD: &str = "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
    pub const TEST_RECORD_SERIAL_NUMBER_NONCE: &str =
        "1d7c00289aaa122fda585f50039736c3d2f2420c7fc7c896a9e2b9c63d965802";
    // pub const TEST_SERIAL_NUMBER: &str = "3576fc686f3ab2439c14c6008ff90adb30d5bcf0884d0fac2c36bc8609a3b503";
    pub const TEST_RECORD_COMMITMENT_RANDOMNESS: &str =
        "7d0be67f6fe333fc0f9c449c8b2f0476c475b458de948277d7f2650ad3f39802";
    pub const TEST_RECORD_COMMITMENT: &str = "0edae0842f26ea03835faa88ff29e2b57c910e02fb7e8d1f702374f0efa8f810";

    #[test]
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
