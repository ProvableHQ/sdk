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

use aleo_account::{Address, PrivateKey, ViewKey};
use aleo_network::Testnet1;
use aleo_record::{EncryptedRecord, Record as RecordInner};

use snarkvm_dpc::{testnet1::payload::Payload, traits::record::RecordScheme};
use snarkvm_utilities::{to_bytes, FromBytes, ToBytes};

use rand::{rngs::StdRng, SeedableRng};
use std::str::FromStr;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Record {
    pub(crate) record: RecordInner<Testnet1>,
}

#[wasm_bindgen]
impl Record {
    #[wasm_bindgen(constructor)]
    pub fn new_dummy() -> Self {
        let rng = &mut StdRng::from_entropy();
        let record = RecordInner::new_dummy(rng).unwrap();

        Self { record }
    }

    #[wasm_bindgen]
    pub fn new(
        owner: &str,
        value: u64,
        payload: &str,
        birth_program_id: &str,
        death_program_id: &str,
        serial_number_nonce: &str,
    ) -> Self {
        let rng = &mut StdRng::from_entropy();
        let record = RecordInner::new()
            .owner(Address::from_str(owner).unwrap())
            .value(value)
            .payload(Payload::read(&hex::decode(payload).unwrap()[..]).unwrap())
            .birth_program_id(hex::decode(birth_program_id).unwrap())
            .death_program_id(hex::decode(death_program_id).unwrap())
            .serial_number_nonce(
                <RecordInner<Testnet1> as RecordScheme>::SerialNumberNonce::read(
                    &hex::decode(serial_number_nonce).unwrap()[..],
                )
                .unwrap(),
            )
            .calculate_commitment_randomness(rng)
            .build()
            .unwrap();

        Self { record }
    }

    #[wasm_bindgen]
    pub fn from_string(record: &str) -> Self {
        let record = RecordInner::from_str(record).unwrap();
        Self { record }
    }

    #[wasm_bindgen]
    pub fn to_string(&self) -> String {
        self.record.to_string()
    }

    #[wasm_bindgen]
    pub fn decrypt(encrypted_record: &str, view_key: &str) -> Self {
        let view_key = ViewKey::from_str(view_key).unwrap();
        let encrypted_record = EncryptedRecord::from_str(encrypted_record).unwrap();
        let record = encrypted_record.decrypt(&view_key).unwrap();

        Self { record }
    }

    #[wasm_bindgen]
    pub fn to_serial_number(&self, private_key: &str) -> String {
        let private_key = PrivateKey::from_str(private_key).unwrap();
        hex::encode(self.record.to_serial_number(&private_key).unwrap())
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
        hex::encode(to_bytes![self.record.payload()].unwrap())
    }

    #[wasm_bindgen]
    pub fn birth_program_id(&self) -> String {
        hex::encode(to_bytes![self.record.birth_program_id()].unwrap())
    }

    #[wasm_bindgen]
    pub fn death_program_id(&self) -> String {
        hex::encode(to_bytes![self.record.death_program_id()].unwrap())
    }

    #[wasm_bindgen]
    pub fn serial_number_nonce(&self) -> String {
        hex::encode(to_bytes![self.record.serial_number_nonce()].unwrap())
    }

    #[wasm_bindgen]
    pub fn commitment(&self) -> String {
        hex::encode(to_bytes![self.record.commitment()].unwrap())
    }

    #[wasm_bindgen]
    pub fn commitment_randomness(&self) -> String {
        hex::encode(to_bytes![self.record.commitment_randomness()].unwrap())
    }

    #[wasm_bindgen]
    pub fn value(&self) -> u64 {
        self.record.value()
    }
}

#[cfg(test)]
mod tests {
    use crate::{Account, Record, ViewKey};

    use snarkvm_algorithms::traits::CRH;
    use snarkvm_dpc::testnet1::{
        instantiated::{Components, ProgramVerificationKeyCRH},
        payload::Payload,
        NoopProgramSNARKParameters,
        SystemParameters,
    };
    use snarkvm_utilities::{to_bytes, ToBytes};

    use wasm_bindgen_test::*;

    pub const TEST_RECORD: &str = "4f6d042c3bc73e412f4b4740ad27354a1b25bb9df93f29313350356aa88dca050064000000000000000000000000000000000000000000000000000000000000000000000000000000304e7ae3ef9577877ddcef8f8c5d9b5e3bf544c78c50c51213857f35c33c3502df12f0fb72a0d7c56ccd31a87dada92b00304e7ae3ef9577877ddcef8f8c5d9b5e3bf544c78c50c51213857f35c33c3502df12f0fb72a0d7c56ccd31a87dada92b00d3cb77fba8ef681178b0dd54dedae5d8c72ea496acb71a788a9bf3be8cf552082ffd75e3e518853ef2328b72b29cda505241bf26b264e85cb12556e3d4556b03e095bb02db522a7dd926a2dff52838bb541dd9cf6eb07c416deeee6f30e54a02";
    pub const TEST_ENCRYPTED_RECORD: &str = "0841ad8eb642c4a2475e2d6c3548f445253db290842531d9b5e25effe74d3eee03c097f5273f56517fe1615100f820577619242101568ddc5da5972b7b7c1c760a6969ddc7ed39cd774a18bc15d5cf38c6d59df1d14e05add65f0e4e6a54b2c901f1580a556f9e9f8e438cdb0d92fa0da1642816eb9318c14387be499d7481950847131dbb8496d3dcc58811dfa96df2bd2ad769cb69438bb1a2657625686b140f1196bfe7a292673f8502acc9cd1ac30f0d16342759105882b3026dafa030320285daefd9fde6dc65dd33541452b43a3bf17e57cf2f147392edc8f8c65af3850020b79c96609743cbfd0b21249265c84344e1c993b480cd042e296d66c17bc7056500";
    pub const TEST_RECORD_OWNER: &str = "aleo1faksgtpmculyzt6tgaq26fe4fgdjtwualyljjvfn2q6k42ydegzspfz9uh";
    pub const TEST_RECORD_IS_DUMMY: bool = false;
    pub const TEST_RECORD_VALUE: u64 = 100;
    pub const TEST_RECORD_PAYLOAD: &str = "0000000000000000000000000000000000000000000000000000000000000000";
    pub const TEST_RECORD_BIRTH_PROGRAM_ID: &str =
        "4e7ae3ef9577877ddcef8f8c5d9b5e3bf544c78c50c51213857f35c33c3502df12f0fb72a0d7c56ccd31a87dada92b00";
    pub const TEST_RECORD_DEATH_PROGRAM_ID: &str =
        "4e7ae3ef9577877ddcef8f8c5d9b5e3bf544c78c50c51213857f35c33c3502df12f0fb72a0d7c56ccd31a87dada92b00";
    pub const TEST_RECORD_SERIAL_NUMBER_NONCE: &str =
        "d3cb77fba8ef681178b0dd54dedae5d8c72ea496acb71a788a9bf3be8cf55208";
    pub const TEST_RECORD_COMMITMENT_RANDOMNESS: &str =
        "e095bb02db522a7dd926a2dff52838bb541dd9cf6eb07c416deeee6f30e54a02";
    pub const TEST_RECORD_COMMITMENT: &str = "2ffd75e3e518853ef2328b72b29cda505241bf26b264e85cb12556e3d4556b03";
    pub const TEST_SERIAL_NUMBER: &str = "7b5ead0c963658ed7127bcdcb916eb42397824ee82a23c8c3435a60469630410afc2550c22cb9c3b26c5899a4b8150f12b75cfcc032d21dd735b1feb5d87e50e";
    pub const TEST_PRIVATE_KEY: &str = "APrivateKey1tvv5YV1dipNiku2My8jMkqpqCyYKvR5Jq4y2mtjw7s77Zpn";

    #[wasm_bindgen_test]
    pub fn new_dummy_test() {
        let dummy_record = Record::new_dummy();

        // Load system parameters for the ledger, commitment schemes, CRH, and the
        // "always-accept" program.
        let system_parameters = SystemParameters::<Components>::load().unwrap();
        let program_snark_pp = NoopProgramSNARKParameters::<Components>::load().unwrap();

        let noop_program_id = to_bytes![
            ProgramVerificationKeyCRH::hash(
                &system_parameters.program_verification_key_crh,
                &to_bytes![program_snark_pp.verification_key].unwrap()
            )
            .unwrap()
        ]
        .unwrap();

        // Check is_dummy: true
        assert!(dummy_record.is_dummy());

        // Check value: 0u64
        assert_eq!(dummy_record.value(), 0u64);

        // Check payload: 0
        assert_eq!(
            dummy_record.payload(),
            hex::encode(to_bytes![Payload::default()].unwrap())
        );

        // Check birth_program_id: noop_program_id
        assert_eq!(
            dummy_record.birth_program_id(),
            hex::encode(to_bytes![noop_program_id].unwrap())
        );

        // Check death_program_id: noop_program_id
        assert_eq!(
            dummy_record.death_program_id(),
            hex::encode(to_bytes![noop_program_id].unwrap())
        );
    }

    #[wasm_bindgen_test]
    pub fn record_to_string_test() {
        let record = Record::from_string(TEST_RECORD);

        println!("{} == {}", TEST_RECORD, record.record.to_string());
        assert_eq!(TEST_RECORD, record.record.to_string());
    }

    #[wasm_bindgen_test]
    pub fn serial_number_derivation_test() {
        let account = Account::from_private_key(TEST_PRIVATE_KEY);
        let private_key = account.private_key.to_string();

        let record = Record::from_string(TEST_RECORD);
        let serial_number = record.to_serial_number(&private_key);

        println!("{} == {}", TEST_SERIAL_NUMBER, serial_number);
        assert_eq!(TEST_SERIAL_NUMBER, serial_number);
    }

    #[wasm_bindgen_test]
    pub fn record_decryption_test() {
        let view_key = ViewKey::from_private_key(TEST_PRIVATE_KEY).view_key.to_string();

        let record = Record::decrypt(TEST_ENCRYPTED_RECORD, &view_key);
        let candidate_record = record.to_string();

        println!("{} == {}", TEST_RECORD, candidate_record);
        assert_eq!(TEST_RECORD, candidate_record);
    }

    // Record getter tests

    #[wasm_bindgen_test]
    pub fn record_owner_test() {
        let record = Record::from_string(TEST_RECORD);
        let owner = record.owner();

        println!("{} == {}", TEST_RECORD_OWNER, owner);
        assert_eq!(TEST_RECORD_OWNER, owner);
    }

    #[wasm_bindgen_test]
    pub fn record_is_dummy_test() {
        let record = Record::from_string(TEST_RECORD);
        let is_dummy = record.is_dummy();

        println!("{} == {}", TEST_RECORD_IS_DUMMY, is_dummy);
        assert_eq!(TEST_RECORD_IS_DUMMY, is_dummy);
    }

    #[wasm_bindgen_test]
    pub fn record_payload_test() {
        let record = Record::from_string(TEST_RECORD);
        let payload = record.payload();

        println!("{} == {}", TEST_RECORD_PAYLOAD, payload);
        assert_eq!(TEST_RECORD_PAYLOAD, payload);
    }

    #[wasm_bindgen_test]
    pub fn record_birth_program_id_test() {
        let record = Record::from_string(TEST_RECORD);
        let birth_program_id = record.birth_program_id();

        println!("{} == {}", TEST_RECORD_BIRTH_PROGRAM_ID, birth_program_id);
        assert_eq!(TEST_RECORD_BIRTH_PROGRAM_ID, birth_program_id);
    }

    #[wasm_bindgen_test]
    pub fn record_death_program_id_test() {
        let record = Record::from_string(TEST_RECORD);
        let death_program_id = record.death_program_id();

        println!("{} == {}", TEST_RECORD_DEATH_PROGRAM_ID, death_program_id);
        assert_eq!(TEST_RECORD_DEATH_PROGRAM_ID, death_program_id);
    }

    #[wasm_bindgen_test]
    pub fn record_serial_number_nonce_test() {
        let record = Record::from_string(TEST_RECORD);
        let serial_number_nonce = record.serial_number_nonce();

        println!("{} == {}", TEST_RECORD_SERIAL_NUMBER_NONCE, serial_number_nonce);
        assert_eq!(TEST_RECORD_SERIAL_NUMBER_NONCE, serial_number_nonce);
    }

    #[wasm_bindgen_test]
    pub fn record_commitment_test() {
        let record = Record::from_string(TEST_RECORD);
        let commitment = record.commitment();

        println!("{} == {}", TEST_RECORD_COMMITMENT, commitment);
        assert_eq!(TEST_RECORD_COMMITMENT, commitment);
    }

    #[wasm_bindgen_test]
    pub fn record_commitment_randomness_test() {
        let record = Record::from_string(TEST_RECORD);
        let commitment_randomness = record.commitment_randomness();

        println!("{} == {}", TEST_RECORD_COMMITMENT_RANDOMNESS, commitment_randomness);
        assert_eq!(TEST_RECORD_COMMITMENT_RANDOMNESS, commitment_randomness);
    }

    #[wasm_bindgen_test]
    pub fn record_value_test() {
        let record = Record::from_string(TEST_RECORD);
        let value = record.value();

        println!("{} == {}", TEST_RECORD_VALUE, value);
        assert_eq!(TEST_RECORD_VALUE, value);
    }
}
