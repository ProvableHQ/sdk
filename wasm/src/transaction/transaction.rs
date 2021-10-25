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
    pub fn to_decrypted_records(&self, view_key_string: String) -> Vec<JsValue> {
        let view_key = ViewKey::from_str(&view_key_string).unwrap();
        self.transaction
            .to_decrypted_records(&view_key)
            .iter()
            .map(|r| JsValue::from_str(&r.to_string()))
            .collect::<Vec<JsValue>>()
    }

    #[wasm_bindgen]
    pub fn to_string(&self) -> String {
        serde_json::to_string(&self.transaction).unwrap()
    }

    #[wasm_bindgen]
    pub fn transitions(&self) -> String {
        serde_json::to_string(self.transaction.transitions()).unwrap()
    }

    #[wasm_bindgen]
    pub fn transaction_id(&self) -> String {
        self.transaction.transaction_id().to_string()
    }

    #[wasm_bindgen]
    pub fn network_id(&self) -> String {
        self.transaction.network_id().to_string()
    }
}

#[cfg(test)]
mod tests {
    use crate::transaction::Transaction;
    use wasm_bindgen_test::*;

    pub const TEST_TRANSACTION: &str = r#"{"events":[],"inner_circuit_id":"174815948661508651093622170321878458241406238656297917532206094502838222273778688353367655906085316929849585225743","network_id":2,"transaction_id":"2901347312022812635254137538000288925748637174660460945724107570651458053226","transitions":["{\"block_hash\":\"6871365235506734614704765172480270606455907494556738176436956869296342603958\",\"ciphertext_ids\":[\"8213353025296036749309673056775292575882626082749173561201602883611271490054\",\"1951133322817439100794581930614500158833559477587361610314564716542113764451\"],\"ciphertexts\":[\"4f663b3d6cdc3db28bcf6ff811e18fc649fefb90ac9d8062c721c9efcb98a408613f0cc7c1f20b5292d06a29f95a5cf9b39c806f2946262b5f878ad5aee21512a332556e217a5701125e7cb3cdfad12888da80aa482c5f7fb10ff1d592772204bcf355d986e58fd18b04360a39792ca764fa8ce28dae7970a8da16c458956b09e57ea778b440094868e4ef491f0e8569abc9cac22a401214b87d1c2c1f8e220d4e2a71c5944174647fe16fd71cb954b4e4cb97e692f7f6f0716b68358d76470b334e1b9a782562928db3efdbf0bf315b3debd5b3e2de1364a02b8e1de572c20d8619cf25d0413dbe1facec18ce32d835f478cbada41b1c856172f0b32ed3da00c4eb58d5084976a61b291d0f8124071530209439bc06d0454ecc942e3930100b52ea4444f35d6d288d1021c5418168533ea3566ce15aa96f602f5b1990702404\",\"99b069ae5a629595ec62d740f3e3caed4f9cc4082219eac1437642f340ba0c047b5c49b95e2b6e5664e9946586f46b45ead7d6fdc54062a537664a69a1a305114eb8f436f539c2e21ba40ea9fb4b875b602a39535573c5fdf61b03ea8ed99d0ff846fc48ad20e54f3368b73ea4d39dcd620f0b24928f743216319c314b4be60999f634425205661a6d80f869aae152e6dc8f89202058caa59e1faf1fa6b63a12505f300545079e7b0439904ab49b70a8bd913242bb0931aea7c3cb7dac74ff0a1aba3bfcc41eeafc82203a9f9dd815363b14a400b8bcbc7da87f914ca0d5750794cd0df689a5f27efa25215777095cc48a7a13e58d4641e82177de42c8a3d60e34996fdba4b37217c62dcf8f8ab5a119d388fee3e9327309b967bfdedf7d240e991064a5bc2b4b31d09bb8d9d7466527bb5623823f8f008f6da538616c76ac0e\"],\"commitments\":[\"5501965521538377093633738792467108340362197667479212805959181171259190854509\",\"5068697570447116731001647279927489685730160753924771826575888352537412681953\"],\"local_commitments_root\":\"0\",\"proof\":\"fabf194edbfc1db7aee41ce5dfb09809c967924bb5f5546dc94840ba78d0b51ec906502489131ae9802d4c6ee5e5bf1a6dc123db1cb85040fc74f872da3d27ba2bd8e4ddbbea4d6c1467b9565deee118634a9777f80252ed20a37ee96dd50180e315d614f57855f39f0be0ceedf368e6e866b5376d1bd17a2168295d33bddb62cbf56e3f3a12cbbe7e8e359754ba90a3344d131d64ade8013b7a770c0d33fb7dbc27215752d98597a6bb7e6fcad12723c2a11586a5c6ff0203129b4dd36e21005287f6b64ad310241dab71d97b23acbfc3e7f1dd566c80f80e7120f5c3bd9a0d3d662853d46c54cab4fbadb580c258c0e5ecd81386b1abdca01cdc118041eef7ea0453887da64b248d5e645e5a132e1ff546f5ffb3741162a89d9892ad71110101\",\"serial_numbers\":[\"2607389049589950061202649315334075301908129689706722810591777981271488234258\",\"1965824338009066553936895403772987744666844494174822298617998389679356858696\"],\"transition_id\":\"5184005510976217492661938913031979891054217636270243651404536441626519364853\",\"value_balance\":-1234}"]}"#;
    pub const TEST_TRANSACTION_ID: &str =
        "2901347312022812635254137538000288925748637174660460945724107570651458053226";
    // pub const TEST_PRIVATE_KEY: &str = "APrivateKey1zkpDHHovMFpfRonXDGRSEHCHbCvmXLftUqEmjbrRmB5hAm6";
    pub const TEST_VIEW_KEY: &str = "AViewKey1sYw6xvs7q6HHeiKnRceuCo1rHy7wFQGngf6JiLD6UUqE";
    // pub const TEST_ADDRESS: &str = "aleo16q7dkt4pf047kv6rsvvu89lnp33wvrksfy0yz5ewf6m5rkr57vpskxxyzq";
    pub const TEST_DECRYPTED_RECORD: &str = r#"{"commitment":"5501965521538377093633738792467108340362197667479212805959181171259190854509","commitment_randomness":"467800052659115204200029916047701235485189226128623883996804476331468861797","owner":"aleo16q7dkt4pf047kv6rsvvu89lnp33wvrksfy0yz5ewf6m5rkr57vpskxxyzq","payload":"0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000","program_id":"18400029571753438738614626927281925709440276250495863570971928333622240058519790728469309546311970535240187832421","serial_number_nonce":"2607389049589950061202649315334075301908129689706722810591777981271488234258","value":1234}"#;

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
}
