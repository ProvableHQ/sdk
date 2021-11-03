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

    // #[wasm_bindgen]
    // pub fn contains_transition_id(&self, transition_id: String) -> bool {}

    // #[wasm_bindgen]
    // pub fn contains_serial_number(&self, serial_number: String) -> bool {}

    // #[wasm_bindgen]
    // pub fn contains_commitment(&self, commitment: String) -> bool {}

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
            .iter()
            .map(|transition_id| JsValue::from_str(&transition_id.to_string()))
            .collect::<Vec<JsValue>>()
    }

    #[wasm_bindgen]
    pub fn serial_numbers(&self) -> Vec<JsValue> {
        self.transaction
            .serial_numbers()
            .iter()
            .map(|serial_number| JsValue::from_str(&serial_number.to_string()))
            .collect::<Vec<JsValue>>()
    }

    #[wasm_bindgen]
    pub fn commitments(&self) -> Vec<JsValue> {
        self.transaction
            .commitments()
            .iter()
            .map(|commitment| JsValue::from_str(&commitment.to_string()))
            .collect::<Vec<JsValue>>()
    }

    #[wasm_bindgen]
    pub fn ciphertexts(&self) -> Vec<JsValue> {
        self.transaction
            .ciphertexts()
            .iter()
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

    // #[wasm_bindgen]
    // pub fn to_ciphertext_ids(&self) -> Vec<JsValue> {
    //     self.transaction
    //         .to_ciphertext_ids()
    //         .iter()
    //         .map(|id| JsValue::from_str(&id.to_string()))
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

#[cfg(test)]
mod tests {
    use crate::transaction::Transaction;
    use wasm_bindgen_test::*;

    pub const TEST_TRANSACTION: &str = r#"{"transaction_id":"at16qf3ts624xhm8e0qzzn4mzlz3en7e36cejje6sjddnwmnd9x4u8sed2vjy","inner_circuit_id":"ic1rmppyewe0a0nsqgsvjnp3sg9769rajwlfeduasp9e7lrms4cmfc3m8axzsw3s56a5lnkcwfc297sqkcyaes","ledger_root":"al1enk2kwh9nuzcj2q9kdutekavlf8ayjqcuszgezsfax8qxn9k0yxqfr9fr2","transitions":["{\"ciphertext_ids\":[\"ar1rkdw6q3mnmflsx495e93k8cmlsfchzt5wlalehlyylmyhgptlgqqguwgyt\",\"ar1nhu2e009qg6dqjzqchnuhcqpprshyx95xlx74265ms9295wkyvrs9kg05p\"],\"ciphertexts\":[\"2960c7f5ec2e47a340095581a2c8b45dc6a2f5d409184741360bc86fab6be60a444c1ae19c6d95d9fce03d4ff5269acd0a7ae9a19cadd2f6fe32047234fea803a8d0ebc13f9e94357c7d44f2fb65aa6899678772557b505703400d42b16cfb01b18e0c66bdbbdfb2e84941fff0aed46c595a3da42a40338079d54fc67b57e40c43323d7f9a0e7c7d7eb6af37940c4cff922b25c00eaf8d1a2342f45acd2cdb07d8d0b6d35e8e3bd125252d8ec77436d3d4909a42f72bd883df44bd725628240522061e695c171458593c16408700908f3e8689ccd06c64c28a4dd913db5d580a10df55469f0500bacff37f5960ffdfed70e27bf4f53ad8129281ed6f4f88b5076ab07627677a3bf2688bc03cadf7d1cfd47c242c443cb852385266f049423e0da5a722028afe0becca8a3192976c3777cc784da3ad5d84ae3b943a29b5af1101\",\"7dad440a5b5b8d8184bbb3e4d4c02df3b36f2f882e4577376bcd9a5a3947ec0da09cca87c1eff47451b347d8cd2746b2655b2d9c3cfe05bcd128175be4bf0110fef6e640c9951d08256e27163e4244516208daa7ca1290233758e0ced6706904d0019d13fd2d37fcfe38c1c469ba0e7c551287a96f4e834be22c730a31336f0239b02d3c321558f3b06ea7bc51f92e3f573c2a92b593cc0cef86c5536949df02cd84bbd455472596c95c3feaa16d568f41f79a2618b6ab6036294bf7b3c35b0b0d87ec994762a8511e59cb8444b518e49b2980c3af6b4285e40400996c984110558841e6efa6186f07e70114a0d31c34b2e5d6f8a46d1353db89cc26d34483038487e171471880d0cb4230c12382389d01aaf44b6e181365d19a1c14ec66cc04dd0a39f598702dbec7cc7fe4e456174266f6424703c8441daed49c7702b91202\"],\"commitments\":[\"cm1kc92nxd38vr0y4y3qxj80gr8tnhma6qj6n0vp8rt38uhzp4x9yzsa5rsf8\",\"cm1fgljcgmaxh6p3vwv4ejppj4y6lznnt53v5h23uwy50q8xvzufs8q9t8f8y\"],\"proof\":\"ozkp12ua77mckm5sxnp2q4c0cywjz3g59na7006qeachq4q9hwy56y8y4nkvt0nlk7djx23qphm0ara04zcqaj3gv29av0npnggrq3g5f97vphc2e7jameqgd0gttgejqn7uqtudxa2zy0v24df3mgh6pvqs2srm86fnq4guverzfc8y2a55kmy6gdwhr9vdc0pmttgckv94dq4vp8kemtxhgftvpfnxhdcy8ukjcvdgxl72vpe8rxyjr6hy2kjvuvnzeayvy536mlyjkfl9a2zm6c9xtgtd3f2kvx4264wn9tnpa4gctesq9n8v0v8d62ne8cxxvaevd035pyd4kvtl0a0w8a7n39tkgp7r7gmt744xuft8t3pl3r7359jgay5vd58yep5fvxlswpfajsm5h3vqpp3uwr3e5wyejj5zhvj6nl3qc0awzsz2v4k0vdk7ezptjpg2wd9zcqqgv5lua4\",\"serial_numbers\":[\"sn1kpvt63p04q65ukjx2jxzhw5fmaka66e89xrvj0xp96jeq7jqluqqrn6q6j\",\"sn1ytl8qhqelajwk6ly86228yfv0rzu6cvl80jfu3lf72nfc6wazcxqzf5f4k\"],\"transition_id\":\"as10gylyhmeq2cttg5lrz57m08cew3ss5mp98gyr7deyy0sxqxt7yqsd406xu\",\"value_balance\":-1234}"],"events":[]}"#;
    pub const TEST_TRANSACTION_ID: &str = "at16qf3ts624xhm8e0qzzn4mzlz3en7e36cejje6sjddnwmnd9x4u8sed2vjy";
    // pub const TEST_PRIVATE_KEY: &str = "APrivateKey1zkpDHHovMFpfRonXDGRSEHCHbCvmXLftUqEmjbrRmB5hAm6";
    pub const TEST_VIEW_KEY: &str = "AViewKey1iAf6a7fv6ELA4ECwAth1hDNUJJNNoWNThmREjpybqder";
    // pub const TEST_ADDRESS: &str = "aleo16q7dkt4pf047kv6rsvvu89lnp33wvrksfy0yz5ewf6m5rkr57vpskxxyzq";
    pub const TEST_DECRYPTED_RECORD: &str = r#"{"commitment":"cm1kc92nxd38vr0y4y3qxj80gr8tnhma6qj6n0vp8rt38uhzp4x9yzsa5rsf8","commitment_randomness":"cr10hnw9346yd2a5jzg8ky835vaa8qz8drs9m7w34j509tchglm95psdvhsdn","owner":"aleo1d5hg2z3ma00382pngntdp68e74zv54jdxy249qhaujhks9c72yrs33ddah","payload":"0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000","program_id":"ap1vyxdja243p7ft8mmgfewaq02h6uvkua02n9echr83qhlr6mz32xqk4n8ut2tvyhmvxp27kjeeedqzhcpj3j","serial_number_nonce":"sn1kpvt63p04q65ukjx2jxzhw5fmaka66e89xrvj0xp96jeq7jqluqqrn6q6j","value":1234}"#;

    #[wasm_bindgen_test]
    fn test_from_string() {
        let tx = Transaction::from_string(TEST_TRANSACTION.to_string());
        assert_eq!(TEST_TRANSACTION_ID, tx.transaction_id());
    }

    #[wasm_bindgen_test]
    fn test_decrypt_records() {
        let tx = Transaction::from_string(TEST_TRANSACTION.to_string());
        let decrypted_records = tx.to_decrypted_records(TEST_VIEW_KEY.to_string());
        let first_decrypted_record = decrypted_records.first().unwrap().as_string().unwrap();

        assert_eq!(TEST_DECRYPTED_RECORD, first_decrypted_record);
    }

    #[wasm_bindgen_test]
    fn test_from_string_to_string() {
        let tx = Transaction::from_string(TEST_TRANSACTION.to_string());
        let tx_copy = Transaction::from_string(tx.to_string());
        assert_eq!(tx.transaction, tx_copy.transaction);
    }
}
