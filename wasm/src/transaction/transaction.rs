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
use aleo_record::{Network, Testnet2};
use aleo_transaction::Transaction as TransactionNative;
use std::str::FromStr;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Transaction {
    transaction: TransactionNative,
}

#[wasm_bindgen]
impl Transaction {
    #[wasm_bindgen]
    pub fn from_string(transaction: String) -> Self {
        console_error_panic_hook::set_once();

        Self {
            transaction: serde_json::from_str(&transaction).unwrap(),
        }
    }

    #[wasm_bindgen]
    pub fn to_string(&self) -> String {
        serde_json::to_string(&self.transaction).unwrap()
    }

    #[wasm_bindgen]
    pub fn is_valid(&self) -> bool {
        self.transaction.is_valid()
    }

    #[wasm_bindgen]
    pub fn contains_transition_id(&self, transition_id: String) -> bool {
        let transition_id: <Testnet2 as Network>::TransitionID = FromStr::from_str(&transition_id).unwrap();
        self.transaction.contains_transition_id(&transition_id)
    }

    #[wasm_bindgen]
    pub fn contains_serial_number(&self, serial_number: String) -> bool {
        let serial_number: <Testnet2 as Network>::SerialNumber = FromStr::from_str(&serial_number).unwrap();
        self.transaction.contains_serial_number(&serial_number)
    }

    #[wasm_bindgen]
    pub fn contains_commitment(&self, commitment: String) -> bool {
        let commitment: <Testnet2 as Network>::Commitment = FromStr::from_str(&commitment).unwrap();
        self.transaction.contains_commitment(&commitment)
    }

    #[wasm_bindgen]
    pub fn transaction_id(&self) -> String {
        self.transaction.transaction_id().to_string()
    }

    #[wasm_bindgen]
    pub fn inner_circuit_id(&self) -> String {
        self.transaction.inner_circuit_id().to_string()
    }

    #[wasm_bindgen]
    pub fn ledger_root(&self) -> String {
        self.transaction.ledger_root().to_string()
    }

    #[wasm_bindgen]
    pub fn transition_ids(&self) -> Vec<JsValue> {
        self.transaction
            .transition_ids()
            .map(|transition_id| JsValue::from_str(&transition_id.to_string()))
            .collect::<Vec<JsValue>>()
    }

    #[wasm_bindgen]
    pub fn serial_numbers(&self) -> Vec<JsValue> {
        self.transaction
            .serial_numbers()
            .map(|serial_number| JsValue::from_str(&serial_number.to_string()))
            .collect::<Vec<JsValue>>()
    }

    #[wasm_bindgen]
    pub fn commitments(&self) -> Vec<JsValue> {
        self.transaction
            .commitments()
            .map(|commitment| JsValue::from_str(&commitment.to_string()))
            .collect::<Vec<JsValue>>()
    }

    #[wasm_bindgen]
    pub fn ciphertexts(&self) -> Vec<JsValue> {
        self.transaction
            .ciphertexts()
            .map(|ciphertext| JsValue::from_str(&ciphertext.to_string()))
            .collect::<Vec<JsValue>>()
    }

    #[wasm_bindgen]
    pub fn value_balance(&self) -> String {
        self.transaction.value_balance().to_string()
    }

    #[wasm_bindgen]
    pub fn events(&self) -> Vec<JsValue> {
        self.transaction
            .events()
            .map(|event| JsValue::from_str(&event.to_string()))
            .collect::<Vec<JsValue>>()
    }

    #[wasm_bindgen]
    pub fn transitions(&self) -> Vec<JsValue> {
        self.transaction
            .transitions()
            .iter()
            .map(|transition| JsValue::from_str(&transition.to_string()))
            .collect::<Vec<JsValue>>()
    }

    #[wasm_bindgen]
    pub fn to_decrypted_records(&self, view_key_string: String) -> Vec<JsValue> {
        let view_key = ViewKey::from_str(&view_key_string).unwrap();
        self.transaction
            .to_decrypted_records(&view_key.into())
            .map(|r| JsValue::from_str(&r.to_string()))
            .collect::<Vec<JsValue>>()
    }

    #[wasm_bindgen]
    pub fn to_records(&self) -> Vec<JsValue> {
        self.transaction
            .to_records()
            .map(|r| JsValue::from_str(&r.to_string()))
            .collect::<Vec<JsValue>>()
    }

    // #[wasm_bindgen]
    // pub fn to_local_proof(&self, record_commitment: String) -> String {}

    // #[wasm_bindgen]
    // pub fn compute_transaction_id(&self, transitions: Vec<String>) -> String {}
}

#[cfg(test)]
mod tests {
    use super::*;
    use wasm_bindgen_test::*;

    pub const TEST_VIEW_KEY: &str = "AViewKey1sYw6xvs7q6HHeiKnRceuCo1rHy7wFQGngf6JiLD6UUqE";
    // pub const TEST_PRIVATE_KEY: &str = "APrivateKey1zkpDHHovMFpfRonXDGRSEHCHbCvmXLftUqEmjbrRmB5hAm6";
    // pub const TEST_ADDRESS: &str = "aleo16q7dkt4pf047kv6rsvvu89lnp33wvrksfy0yz5ewf6m5rkr57vpsr6kg8z";

    pub const TEST_TRANSACTION: &str = r#"{
                    "inner_circuit_id": "ic13cstkmt5j4qqzfu5am8jx2rhxm0hqplyzcgzyueefz7n32xl4h53n4xmxvhjyzaq2c0f7l70a4xszau2ryc",
                    "ledger_root": "al1enk2kwh9nuzcj2q9kdutekavlf8ayjqcuszgezsfax8qxn9k0yxqfr9fr2",
                    "transaction_id": "at14jtma26mvj5hwvga4dx0mkmyv42d9pljsxm649tmpxm8wfhfxspstjketu",
                    "transitions": [
                        {
                            "ciphertexts": [
                                "recd1484ja6rq2k2tpt2lg5rgl3hdl8z4c45yknz0t9unl2f7752gpuxnkusew2tpxm4tf3susgsez6d9xasme7en5gjmegdycvnyh6w95rgtdtvgsw3sfff7z0chn380dyuhj3jnafxczvpy57hezxewk349qec39qmfen5hajjz0zda2yxwumsn8cmku970h342xdm7v0s6kv2qjyygjqdxwgk6s90tjped8l0ca8ktnznw59mggakk7vxuszmkp8s2gqw7u9fd7k6d0m6edfv8janawnajm8etx4f8z3pwk8ekk9ktnczw050cjlmvz85k8thxg08xm5ae69azcsyhy0v06m7va7h34lzkqz5w9ur7ur047xglsxy5yqcqluttchz5p4dwcu6cfkdvy4557k8rqp9k6ycj9tutvckftq93d494cgaklhapkqzh2xgmta90lg65f5npqd893ss",
                                "recd1ju5w75f9rlk742p8trnm6xgp5y8gjyemfwq2gy867m5r532amspz3ywyxsykekm02zn5seeljpeqmcyzy9d8s3njufarq46yqaruypyjseku79cc2r6ml73k07tlcm0jtlyyp0gdq70wsnfgusse7667qz8cusme8d7gju9xszt608nx2v7v69vlcrmhezds0r04sdq29mzqlxa2035p6szulv2u4dv2ervvmpsm6p2gangh0sn8ancgqexs4lggh7738l0k9wgv7wzavvtptujgf75a4pp424kfhhx9jkr4rez3wuz2qqfp4g5qza5ck3u3ah70809su90dkyyqywhs339q22he4kdxvp997nt2zahdrzqd583pqfga3q0d0jx3z44q3vek5cklafnnqd4cqm7tmmva7qxys6z80augrzhjczg0hue3qrqs750et2f0eqxhl3lqkehdk3t"
                            ],
                            "commitments": [
                                "cm1gedwyp35zzlj0tfrevc4fgjhctpmqy02ztyc3859t9zjzl85pgyqn2a639",
                                "cm167zl85syqfdxu7y46mn2va776727l9c3mf437hr6rq4myaqyryzqxn5eas"
                            ],
                            "events": [
                                {
                                    "id": 1,
                                    "index": 0,
                                    "record_view_key": "rcvk1ud7wnegus6v56d7w7czeh7hn0qjp65m9gpaxfdyew3l77f35luzqszjk8g"
                                },
                                {
                                    "id": 1,
                                    "index": 1,
                                    "record_view_key": "rcvk146xzca2fptheqt5zhyljx4a4lcur4vcrq3n9gdg7zflvt9aavyrswt04dc"
                                }
                            ],
                            "proof": "ozkp1wj9qhpyht0wjcfh85v536gmv3qp7umramp4ef6kf3rh9rjwrnv4tv0tqgqfuvmm5954mldzyaacjhpc0lcjzwdwdjfy9pmc687as089h7080kzqk72q39fl6av4q4agdctywflyeqdvxz0c6nx55s0casqnf32n0pvlswv9ut7q9jatw3xyek3pzkdr25cx07zk6e28ukfrc5mw74eewafrltp5qp8uqsxqw9gj0gxptvglsal8c0t0wu6vxykryagejmv0yxy67wupd8h92qukmux6jazz4yx9yu85ll0ggvdawrsqcs4rrrusd408877ye6pt3c7mdtlctq26h32g7zhw5ha5c6ssfa7xn5nrw89myyd6f8kgm4z0cfppefx9mvjryx8u7xndlaaudcufgyzhv25hz9lnk3jtm852z227qfn83uqrga4y9jfe269u0ctpvwjrcqqgs6f3zr",
                            "serial_numbers": [
                                "sn1867eqssjqv7ku5xyx80sr7pcj60nlgp4urq69wcuvt5hxr95wy8qjmef0d",
                                "sn16kvxvnyduwtz44mrh44502rrha9n9fcn4z4j0625llq8ugwyuc9s7em3x7"
                            ],
                            "transition_id": "as1tgn5wtx433f5rzrprp6x87wl8y5qr0rj6pq0gf6g4dr2g6t38u8slp9erp",
                            "value_balance": -1234
                        }
                    ]
                }"#;
    pub const TEST_TRANSACTION_ID: &str = "at14jtma26mvj5hwvga4dx0mkmyv42d9pljsxm649tmpxm8wfhfxspstjketu";
    pub const TEST_INNER_CIRCUIT_ID: &str =
        "ic13cstkmt5j4qqzfu5am8jx2rhxm0hqplyzcgzyueefz7n32xl4h53n4xmxvhjyzaq2c0f7l70a4xszau2ryc";
    pub const TEST_LEDGER_ROOT: &str = "al1enk2kwh9nuzcj2q9kdutekavlf8ayjqcuszgezsfax8qxn9k0yxqfr9fr2";
    pub const TEST_TRANSITION: &str = r#"{"transition_id":"as1tgn5wtx433f5rzrprp6x87wl8y5qr0rj6pq0gf6g4dr2g6t38u8slp9erp","serial_numbers":["sn1867eqssjqv7ku5xyx80sr7pcj60nlgp4urq69wcuvt5hxr95wy8qjmef0d","sn16kvxvnyduwtz44mrh44502rrha9n9fcn4z4j0625llq8ugwyuc9s7em3x7"],"commitments":["cm1gedwyp35zzlj0tfrevc4fgjhctpmqy02ztyc3859t9zjzl85pgyqn2a639","cm167zl85syqfdxu7y46mn2va776727l9c3mf437hr6rq4myaqyryzqxn5eas"],"ciphertexts":["recd1484ja6rq2k2tpt2lg5rgl3hdl8z4c45yknz0t9unl2f7752gpuxnkusew2tpxm4tf3susgsez6d9xasme7en5gjmegdycvnyh6w95rgtdtvgsw3sfff7z0chn380dyuhj3jnafxczvpy57hezxewk349qec39qmfen5hajjz0zda2yxwumsn8cmku970h342xdm7v0s6kv2qjyygjqdxwgk6s90tjped8l0ca8ktnznw59mggakk7vxuszmkp8s2gqw7u9fd7k6d0m6edfv8janawnajm8etx4f8z3pwk8ekk9ktnczw050cjlmvz85k8thxg08xm5ae69azcsyhy0v06m7va7h34lzkqz5w9ur7ur047xglsxy5yqcqluttchz5p4dwcu6cfkdvy4557k8rqp9k6ycj9tutvckftq93d494cgaklhapkqzh2xgmta90lg65f5npqd893ss","recd1ju5w75f9rlk742p8trnm6xgp5y8gjyemfwq2gy867m5r532amspz3ywyxsykekm02zn5seeljpeqmcyzy9d8s3njufarq46yqaruypyjseku79cc2r6ml73k07tlcm0jtlyyp0gdq70wsnfgusse7667qz8cusme8d7gju9xszt608nx2v7v69vlcrmhezds0r04sdq29mzqlxa2035p6szulv2u4dv2ervvmpsm6p2gangh0sn8ancgqexs4lggh7738l0k9wgv7wzavvtptujgf75a4pp424kfhhx9jkr4rez3wuz2qqfp4g5qza5ck3u3ah70809su90dkyyqywhs339q22he4kdxvp997nt2zahdrzqd583pqfga3q0d0jx3z44q3vek5cklafnnqd4cqm7tmmva7qxys6z80augrzhjczg0hue3qrqs750et2f0eqxhl3lqkehdk3t"],"value_balance":-1234,"events":[{"id":1,"index":0,"record_view_key":"rcvk1ud7wnegus6v56d7w7czeh7hn0qjp65m9gpaxfdyew3l77f35luzqszjk8g"},{"id":1,"index":1,"record_view_key":"rcvk146xzca2fptheqt5zhyljx4a4lcur4vcrq3n9gdg7zflvt9aavyrswt04dc"}],"proof":"ozkp1wj9qhpyht0wjcfh85v536gmv3qp7umramp4ef6kf3rh9rjwrnv4tv0tqgqfuvmm5954mldzyaacjhpc0lcjzwdwdjfy9pmc687as089h7080kzqk72q39fl6av4q4agdctywflyeqdvxz0c6nx55s0casqnf32n0pvlswv9ut7q9jatw3xyek3pzkdr25cx07zk6e28ukfrc5mw74eewafrltp5qp8uqsxqw9gj0gxptvglsal8c0t0wu6vxykryagejmv0yxy67wupd8h92qukmux6jazz4yx9yu85ll0ggvdawrsqcs4rrrusd408877ye6pt3c7mdtlctq26h32g7zhw5ha5c6ssfa7xn5nrw89myyd6f8kgm4z0cfppefx9mvjryx8u7xndlaaudcufgyzhv25hz9lnk3jtm852z227qfn83uqrga4y9jfe269u0ctpvwjrcqqgs6f3zr"}"#;
    pub const TEST_TRANSITION_ID: &str = "as1tgn5wtx433f5rzrprp6x87wl8y5qr0rj6pq0gf6g4dr2g6t38u8slp9erp";
    pub const TEST_INCORRECT_TRANSITION_ID: &str = "as1aa6dlcxpe3l7tdt9vgpxf5hfnanjusxnhchhnpkr4k6w7mvrguqqylt8t2";
    pub const TEST_SERIAL_NUMBER: &str = "sn1867eqssjqv7ku5xyx80sr7pcj60nlgp4urq69wcuvt5hxr95wy8qjmef0d";
    pub const TEST_INCORRECT_SERIAL_NUMBER: &str = "sn1qh7d0lc3tqps7q4ugynkvqrwugnhj0jujqy6ch9m0qzfqvue55rq8q0tqf";
    pub const TEST_CIPHERTEXT: &str = "recd1484ja6rq2k2tpt2lg5rgl3hdl8z4c45yknz0t9unl2f7752gpuxnkusew2tpxm4tf3susgsez6d9xasme7en5gjmegdycvnyh6w95rgtdtvgsw3sfff7z0chn380dyuhj3jnafxczvpy57hezxewk349qec39qmfen5hajjz0zda2yxwumsn8cmku970h342xdm7v0s6kv2qjyygjqdxwgk6s90tjped8l0ca8ktnznw59mggakk7vxuszmkp8s2gqw7u9fd7k6d0m6edfv8janawnajm8etx4f8z3pwk8ekk9ktnczw050cjlmvz85k8thxg08xm5ae69azcsyhy0v06m7va7h34lzkqz5w9ur7ur047xglsxy5yqcqluttchz5p4dwcu6cfkdvy4557k8rqp9k6ycj9tutvckftq93d494cgaklhapkqzh2xgmta90lg65f5npqd893ss";
    pub const TEST_COMMITMENT: &str = "cm1gedwyp35zzlj0tfrevc4fgjhctpmqy02ztyc3859t9zjzl85pgyqn2a639";
    pub const TEST_INCORRECT_COMMITMENT: &str = "cm1xck4eyf3a3qnz69yyrr3jf698mqzwpjgkqu0j359p0sdr5wyjyqsn0604p";
    pub const TEST_VALUE_BALANCE: &str = "-1234";
    pub const TEST_EVENT: &str =
        r#"{"id":1,"index":0,"record_view_key":"rcvk1ud7wnegus6v56d7w7czeh7hn0qjp65m9gpaxfdyew3l77f35luzqszjk8g"}"#;
    pub const TEST_DECRYPTED_RECORD: &str = r#"{"owner":"aleo16q7dkt4pf047kv6rsvvu89lnp33wvrksfy0yz5ewf6m5rkr57vpsr6kg8z","value":1234,"payload":"0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000","program_id":"ap1lhj3g5uzervu3km7rl0rsd0u5j6pj9ujum6yxrvms4mx8r2qhew88ga849hnjypghswxceh02frszs45qmd","randomizer":"rr1484ja6rq2k2tpt2lg5rgl3hdl8z4c45yknz0t9unl2f7752gpuxsm2avqc","record_view_key":"rcvk1ud7wnegus6v56d7w7czeh7hn0qjp65m9gpaxfdyew3l77f35luzqszjk8g","commitment":"cm1gedwyp35zzlj0tfrevc4fgjhctpmqy02ztyc3859t9zjzl85pgyqn2a639"}"#;

    #[wasm_bindgen_test]
    fn test_from_string() {
        let tx = Transaction::from_string(TEST_TRANSACTION.to_string());

        assert_eq!(TEST_TRANSACTION_ID, tx.transaction_id());
        assert_eq!(TEST_INNER_CIRCUIT_ID, tx.inner_circuit_id());
        assert_eq!(TEST_LEDGER_ROOT, tx.ledger_root());
        assert_eq!(
            TEST_TRANSITION_ID,
            tx.transition_ids().first().unwrap().as_string().unwrap()
        );
        assert_eq!(
            TEST_SERIAL_NUMBER,
            tx.serial_numbers().first().unwrap().as_string().unwrap()
        );
        assert_eq!(TEST_CIPHERTEXT, tx.ciphertexts().first().unwrap().as_string().unwrap());
        assert_eq!(TEST_EVENT, tx.events().first().unwrap().as_string().unwrap());
        assert_eq!(TEST_VALUE_BALANCE, tx.value_balance());
        assert_eq!(TEST_TRANSITION, tx.transitions().first().unwrap().as_string().unwrap());
    }

    #[wasm_bindgen_test]
    fn test_from_string_to_string() {
        let tx = Transaction::from_string(TEST_TRANSACTION.to_string());
        let tx_copy = Transaction::from_string(tx.to_string());
        assert_eq!(tx.transaction, tx_copy.transaction);
    }

    #[wasm_bindgen_test]
    fn test_is_valid() {
        let tx = Transaction::from_string(TEST_TRANSACTION.to_string());

        assert!(tx.is_valid());
    }

    #[wasm_bindgen_test]
    fn test_contains_transition_id() {
        let tx = Transaction::from_string(TEST_TRANSACTION.to_string());

        assert!(tx.contains_transition_id(TEST_TRANSITION_ID.to_string()));

        assert!(!tx.contains_transition_id(TEST_INCORRECT_TRANSITION_ID.to_string()));
    }

    #[wasm_bindgen_test]
    fn test_contains_serial_number() {
        let tx = Transaction::from_string(TEST_TRANSACTION.to_string());

        assert!(tx.contains_serial_number(TEST_SERIAL_NUMBER.to_string()));

        assert!(!tx.contains_serial_number(TEST_INCORRECT_SERIAL_NUMBER.to_string()));
    }

    #[wasm_bindgen_test]
    fn test_contains_commitment() {
        let tx = Transaction::from_string(TEST_TRANSACTION.to_string());

        assert!(tx.contains_commitment(TEST_COMMITMENT.to_string()));

        assert!(!tx.contains_commitment(TEST_INCORRECT_COMMITMENT.to_string()));
    }

    #[wasm_bindgen_test]
    fn test_decrypt_records() {
        let tx = Transaction::from_string(TEST_TRANSACTION.to_string());
        let decrypted_records = tx.to_decrypted_records(TEST_VIEW_KEY.to_string());
        let first_decrypted_record = decrypted_records.first().unwrap().as_string().unwrap();

        assert_eq!(TEST_DECRYPTED_RECORD, first_decrypted_record);
    }
}
