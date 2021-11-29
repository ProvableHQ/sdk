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
    pub fn transitions(&self) -> Vec<JsValue> {
        self.transaction
            .transitions()
            .iter()
            .map(|transition| JsValue::from_str(&transition.to_string()))
            .collect::<Vec<JsValue>>()
    }

    // #[wasm_bindgen]
    // pub fn events(&self) -> Vec<JsValue> {
    //     self.transaction
    //         .events()
    //         .iter()
    //         .map(|event| JsValue::from_str(&event.to_string()))
    //         .collect()
    // }

    #[wasm_bindgen]
    pub fn to_decrypted_records(&self, view_key_string: String) -> Vec<JsValue> {
        let view_key = ViewKey::from_str(&view_key_string).unwrap();
        self.transaction
            .to_decrypted_records(&view_key)
            .iter()
            .map(|r| JsValue::from_str(&r.to_string()))
            .collect::<Vec<JsValue>>()
    }

    // #[wasm_bindgen]
    // pub fn to_local_proof(&self, record_commitment: String) -> String {}

    // #[wasm_bindgen]
    // pub fn compute_transaction_id(&self, transitions: Vec<String>) -> String {}
}

// todo @collinc97: update testnet2 transaction test data
// #[cfg(test)]
// mod tests {
//     use super::*;
//     use wasm_bindgen_test::*;
//
//     pub const TEST_VIEW_KEY: &str = "AViewKey1sYw6xvs7q6HHeiKnRceuCo1rHy7wFQGngf6JiLD6UUqE";
//     // pub const TEST_PRIVATE_KEY: &str = "APrivateKey1zkpDHHovMFpfRonXDGRSEHCHbCvmXLftUqEmjbrRmB5hAm6";
//     // pub const TEST_ADDRESS: &str = "aleo16q7dkt4pf047kv6rsvvu89lnp33wvrksfy0yz5ewf6m5rkr57vpsr6kg8z";
//
//     pub const TEST_TRANSACTION: &str = r#"{"transaction_id":"at14qlg8y2ce37cddax8l42tju3ck0ty8p066phslwqnelv93lmqyqssj642y","inner_circuit_id":"ic14z3rtzc25jgjxs6tzat3wtsrf5gees5zel8tggsslzrfyzhxw4xsgdfe4qk6997427zsfl9tqqesq5fzw5q","ledger_root":"al1enk2kwh9nuzcj2q9kdutekavlf8ayjqcuszgezsfax8qxn9k0yxqfr9fr2","transitions":[{"transition_id":"as1ygytn778gqs2ttkdyttmdgmkdpqr6akggm6jg5m8wh66num47szs3286gh","serial_numbers":["sn1k6hn4zhfn7jax5zzu6u7wtze86yl68e6dj7uts5zauflnhrtu59qqkmync","sn1tjy0ea839tt2qypurtq7xgrnfpe6qdmzjyfz98k4c6qnyqe44yqqtcycr6"],"commitments":["cm1ns5vj65nn764hk5ghgx66qdc0g2jcnh56s0f3scp3nh580atyvrqqw8a05","cm16349fd0m9ag5a8cu9qu92uz488rxcvqe4g48q3ayj3muqwnxguxslmgwhz"],"ciphertext_ids":["ar1srw0tvywnygrqatt735wp5g66pse4wsz99ng9zennfjp4zklhszshhzspy","ar1dqvr3fj9hrfcafgu8tnfhxskz40vuepdydjcgpymxevvp6u43vqs0jwmzy"],"ciphertexts":["6c99ae29aa4a25a127592aff6f46e24fb91e842ed5924f20a371b3e1d63c320a3604ab052573a04367fb0214a5274c57768962a124c10ff9f8fcd763936c0d02462468f15a7f609ca32925d6620ab9fc08604c04edebce96fcc8391279d88f0db2f1ec156c3ab36eb07300dc6cd80843a2b7dab524ff5fdeaace004d3d85a41113ffe51c74b1311ca26250ba36f5aedeee95f0a9356933f44a7da27adbc725112f108d2f5307dca927ad3b2f62dd772a24b9af151cdffbf2bd3dbfbcb2c4470e5d5f9454ade784f19315a5d0c123ba6293fac1e26474b12d4deccdf413e513030050f4b0d1c773bc9fa8d3b7e618742a367873d9957b4d84ef9902e001540402167976e78cbe5dc0474d68a47dfd266f505a95ca49610b310067a9b41cf8de03379234d2ca0900241fb867679d81f8a9a3a11bb9f1ca2979de74e21fb363990a","4daf5e933fedd547f4b3ddfcf7d05faa6b6105ccba143b57712b719a04c7330f9ec90c9277478ba5dc07c83dc0d5053533290868ff49baffd3a603c64f35500ac58d7c61137d958c5c957debfc3069cfe93da7cb5571aa7b543ad7ddbe525b0b440d0c1b37865bc2378fe0142d1968a8a43b8f7eb8a0113f53b83c6dd7707000fbf80f27924523ae35519b7554699ea66cd310d45dda45430a9cb2e2312b2e0669bcc4573fb7e082c943ac89e6878166766f8eccb471f2b06efd7cb09cfbe711bf8ab136b360db0ba5293829809b286d7ceec05d0b4e25840736f26ae8140812998e6cdfcc2bcda827e0b123ce6787970fb72f9f7192c9374858eab0ecabaa0e2dd5001738db1b83f67290e854c755f481415dfa4ff3f7e5fec1471fd186cd058467b3f46a79d3deb1007afbebded319198cff626dca6e7882697dd609164c08"],"value_balance":-1234,"proof":"ozkp1hw8pjqwxkzre4jq5sy5pwlm24km4v767fdyryzqhfwltrwm4c0x0xekzfkw08p5p806q68fpqej26yc9h6v436lekxuweewr88hpp6gg8quj9jjzmhq36vltcf0zkr56y0whpzsc30kk62zk9tjtxuraqzjagcvteta5nezly06zu780h6jxwxpd770pyqkep3r22ghkar8pawm8vcz37ykj56s3wltelvr6ujpft02nf48fu74l4w0uyu2aq7juddrx4tac3dy7m8pfgwh3cxnkk2zkgclcevl8dcukf2w5zszpmcqt0p6w4dhffunkthln8egvr50wdhlgfjfv6dg0z9c23k8hsp7wvwr9q3865jlq8w9ecy5wnqfnsvqgqxgatckdc6972d4ansn3rycv7kqywxe5k6l8xwjycef8anlxkgv3w5wz86ppm7kcxkplu30scgnsqqg2q84y5"}],"events":[]}"#;
//     pub const TEST_TRANSACTION_ID: &str = "at14qlg8y2ce37cddax8l42tju3ck0ty8p066phslwqnelv93lmqyqssj642y";
//     pub const TEST_INNER_CIRCUIT_ID: &str =
//         "ic14z3rtzc25jgjxs6tzat3wtsrf5gees5zel8tggsslzrfyzhxw4xsgdfe4qk6997427zsfl9tqqesq5fzw5q";
//     pub const TEST_LEDGER_ROOT: &str = "al1enk2kwh9nuzcj2q9kdutekavlf8ayjqcuszgezsfax8qxn9k0yxqfr9fr2";
//     pub const TEST_TRANSITION: &str = r#"{"transition_id":"as1ygytn778gqs2ttkdyttmdgmkdpqr6akggm6jg5m8wh66num47szs3286gh","serial_numbers":["sn1k6hn4zhfn7jax5zzu6u7wtze86yl68e6dj7uts5zauflnhrtu59qqkmync","sn1tjy0ea839tt2qypurtq7xgrnfpe6qdmzjyfz98k4c6qnyqe44yqqtcycr6"],"commitments":["cm1ns5vj65nn764hk5ghgx66qdc0g2jcnh56s0f3scp3nh580atyvrqqw8a05","cm16349fd0m9ag5a8cu9qu92uz488rxcvqe4g48q3ayj3muqwnxguxslmgwhz"],"ciphertext_ids":["ar1srw0tvywnygrqatt735wp5g66pse4wsz99ng9zennfjp4zklhszshhzspy","ar1dqvr3fj9hrfcafgu8tnfhxskz40vuepdydjcgpymxevvp6u43vqs0jwmzy"],"ciphertexts":["6c99ae29aa4a25a127592aff6f46e24fb91e842ed5924f20a371b3e1d63c320a3604ab052573a04367fb0214a5274c57768962a124c10ff9f8fcd763936c0d02462468f15a7f609ca32925d6620ab9fc08604c04edebce96fcc8391279d88f0db2f1ec156c3ab36eb07300dc6cd80843a2b7dab524ff5fdeaace004d3d85a41113ffe51c74b1311ca26250ba36f5aedeee95f0a9356933f44a7da27adbc725112f108d2f5307dca927ad3b2f62dd772a24b9af151cdffbf2bd3dbfbcb2c4470e5d5f9454ade784f19315a5d0c123ba6293fac1e26474b12d4deccdf413e513030050f4b0d1c773bc9fa8d3b7e618742a367873d9957b4d84ef9902e001540402167976e78cbe5dc0474d68a47dfd266f505a95ca49610b310067a9b41cf8de03379234d2ca0900241fb867679d81f8a9a3a11bb9f1ca2979de74e21fb363990a","4daf5e933fedd547f4b3ddfcf7d05faa6b6105ccba143b57712b719a04c7330f9ec90c9277478ba5dc07c83dc0d5053533290868ff49baffd3a603c64f35500ac58d7c61137d958c5c957debfc3069cfe93da7cb5571aa7b543ad7ddbe525b0b440d0c1b37865bc2378fe0142d1968a8a43b8f7eb8a0113f53b83c6dd7707000fbf80f27924523ae35519b7554699ea66cd310d45dda45430a9cb2e2312b2e0669bcc4573fb7e082c943ac89e6878166766f8eccb471f2b06efd7cb09cfbe711bf8ab136b360db0ba5293829809b286d7ceec05d0b4e25840736f26ae8140812998e6cdfcc2bcda827e0b123ce6787970fb72f9f7192c9374858eab0ecabaa0e2dd5001738db1b83f67290e854c755f481415dfa4ff3f7e5fec1471fd186cd058467b3f46a79d3deb1007afbebded319198cff626dca6e7882697dd609164c08"],"value_balance":-1234,"proof":"ozkp1hw8pjqwxkzre4jq5sy5pwlm24km4v767fdyryzqhfwltrwm4c0x0xekzfkw08p5p806q68fpqej26yc9h6v436lekxuweewr88hpp6gg8quj9jjzmhq36vltcf0zkr56y0whpzsc30kk62zk9tjtxuraqzjagcvteta5nezly06zu780h6jxwxpd770pyqkep3r22ghkar8pawm8vcz37ykj56s3wltelvr6ujpft02nf48fu74l4w0uyu2aq7juddrx4tac3dy7m8pfgwh3cxnkk2zkgclcevl8dcukf2w5zszpmcqt0p6w4dhffunkthln8egvr50wdhlgfjfv6dg0z9c23k8hsp7wvwr9q3865jlq8w9ecy5wnqfnsvqgqxgatckdc6972d4ansn3rycv7kqywxe5k6l8xwjycef8anlxkgv3w5wz86ppm7kcxkplu30scgnsqqg2q84y5"}"#;
//     pub const TEST_TRANSITION_ID: &str = "as1ygytn778gqs2ttkdyttmdgmkdpqr6akggm6jg5m8wh66num47szs3286gh";
//     pub const TEST_INCORRECT_TRANSITION_ID: &str = "as1aa6dlcxpe3l7tdt9vgpxf5hfnanjusxnhchhnpkr4k6w7mvrguqqylt8t2";
//     pub const TEST_SERIAL_NUMBER: &str = "sn1k6hn4zhfn7jax5zzu6u7wtze86yl68e6dj7uts5zauflnhrtu59qqkmync";
//     pub const TEST_INCORRECT_SERIAL_NUMBER: &str = "sn1qh7d0lc3tqps7q4ugynkvqrwugnhj0jujqy6ch9m0qzfqvue55rq8q0tqf";
//     pub const TEST_COMMITMENT: &str = "cm1ns5vj65nn764hk5ghgx66qdc0g2jcnh56s0f3scp3nh580atyvrqqw8a05";
//     pub const TEST_INCORRECT_COMMITMENT: &str = "cm17zevnsqg744lkzwcduxh33tnj5pnuth0fk86ny4wh7utq7eauyzsqrf3rm";
//     pub const TEST_CIPHERTEXT: &str = "6c99ae29aa4a25a127592aff6f46e24fb91e842ed5924f20a371b3e1d63c320a3604ab052573a04367fb0214a5274c57768962a124c10ff9f8fcd763936c0d02462468f15a7f609ca32925d6620ab9fc08604c04edebce96fcc8391279d88f0db2f1ec156c3ab36eb07300dc6cd80843a2b7dab524ff5fdeaace004d3d85a41113ffe51c74b1311ca26250ba36f5aedeee95f0a9356933f44a7da27adbc725112f108d2f5307dca927ad3b2f62dd772a24b9af151cdffbf2bd3dbfbcb2c4470e5d5f9454ade784f19315a5d0c123ba6293fac1e26474b12d4deccdf413e513030050f4b0d1c773bc9fa8d3b7e618742a367873d9957b4d84ef9902e001540402167976e78cbe5dc0474d68a47dfd266f505a95ca49610b310067a9b41cf8de03379234d2ca0900241fb867679d81f8a9a3a11bb9f1ca2979de74e21fb363990a";
//     pub const TEST_CIPHERTEXT_ID: &str = "ar1srw0tvywnygrqatt735wp5g66pse4wsz99ng9zennfjp4zklhszshhzspy";
//     pub const TEST_VALUE_BALANCE: &str = "-1234";
//     pub const TEST_DECRYPTED_RECORD: &str = r#"{"owner":"aleo16q7dkt4pf047kv6rsvvu89lnp33wvrksfy0yz5ewf6m5rkr57vpsr6kg8z","value":1234,"payload":"0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000","program_id":"ap108dg24pwmezwu7hd9gt0dhrp759stge4sq4jecsg066usnclepfnhwn9a0xl5zv5spt7vvgwfqfsqt3dlw4","serial_number_nonce":"sn1k6hn4zhfn7jax5zzu6u7wtze86yl68e6dj7uts5zauflnhrtu59qqkmync","commitment_randomness":"cr1ngk3836h00qj6u9uefkgg3j5gq7uzkv5hdmzjkvhqelvqanps5qs7sacdp","commitment":"cm1ns5vj65nn764hk5ghgx66qdc0g2jcnh56s0f3scp3nh580atyvrqqw8a05"}"#;
//
//     #[wasm_bindgen_test]
//     fn test_from_string() {
//         let tx = Transaction::from_string(TEST_TRANSACTION.to_string());
//
//         assert_eq!(TEST_TRANSACTION_ID, tx.transaction_id());
//         assert_eq!(TEST_INNER_CIRCUIT_ID, tx.inner_circuit_id());
//         assert_eq!(TEST_LEDGER_ROOT, tx.ledger_root());
//         assert_eq!(
//             TEST_TRANSITION_ID,
//             tx.transition_ids().first().unwrap().as_string().unwrap()
//         );
//         assert_eq!(
//             TEST_SERIAL_NUMBER,
//             tx.serial_numbers().first().unwrap().as_string().unwrap()
//         );
//         assert_eq!(TEST_COMMITMENT, tx.commitments().first().unwrap().as_string().unwrap());
//         assert_eq!(TEST_CIPHERTEXT, tx.ciphertexts().first().unwrap().as_string().unwrap());
//         assert_eq!(
//             TEST_CIPHERTEXT_ID,
//             tx.to_ciphertext_ids().first().unwrap().as_string().unwrap()
//         );
//         assert_eq!(TEST_VALUE_BALANCE, tx.value_balance());
//         assert_eq!(TEST_TRANSITION, tx.transitions().first().unwrap().as_string().unwrap());
//     }
//
//     #[wasm_bindgen_test]
//     fn test_from_string_to_string() {
//         let tx = Transaction::from_string(TEST_TRANSACTION.to_string());
//         let tx_copy = Transaction::from_string(tx.to_string());
//         assert_eq!(tx.transaction, tx_copy.transaction);
//     }
//
//     #[wasm_bindgen_test]
//     fn test_is_valid() {
//         let tx = Transaction::from_string(TEST_TRANSACTION.to_string());
//
//         assert!(tx.is_valid());
//     }
//
//     #[wasm_bindgen_test]
//     fn test_contains_transition_id() {
//         let tx = Transaction::from_string(TEST_TRANSACTION.to_string());
//
//         assert!(tx.contains_transition_id(TEST_TRANSITION_ID.to_string()));
//
//         assert!(!tx.contains_transition_id(TEST_INCORRECT_TRANSITION_ID.to_string()));
//     }
//
//     #[wasm_bindgen_test]
//     fn test_contains_serial_number() {
//         let tx = Transaction::from_string(TEST_TRANSACTION.to_string());
//
//         assert!(tx.contains_serial_number(TEST_SERIAL_NUMBER.to_string()));
//
//         assert!(!tx.contains_serial_number(TEST_INCORRECT_SERIAL_NUMBER.to_string()));
//     }
//
//     #[wasm_bindgen_test]
//     fn test_contains_commitment() {
//         let tx = Transaction::from_string(TEST_TRANSACTION.to_string());
//
//         assert!(tx.contains_commitment(TEST_COMMITMENT.to_string()));
//
//         assert!(!tx.contains_commitment(TEST_INCORRECT_COMMITMENT.to_string()));
//     }
//
//     #[wasm_bindgen_test]
//     fn test_decrypt_records() {
//         let tx = Transaction::from_string(TEST_TRANSACTION.to_string());
//         let decrypted_records = tx.to_decrypted_records(TEST_VIEW_KEY.to_string());
//         let first_decrypted_record = decrypted_records.first().unwrap().as_string().unwrap();
//
//         assert_eq!(TEST_DECRYPTED_RECORD, first_decrypted_record);
//     }
// }
