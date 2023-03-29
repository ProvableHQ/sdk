// Copyright (C) 2019-2023 Aleo Systems Inc.
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

use crate::{
    types::{BlockNative, RecordCiphertextNative},
    Field,
    PrivateKey,
    RecordCiphertext,
    RecordPlaintext,
    ViewKey,
};
use std::str::FromStr;

use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Clone, Debug, Eq, PartialEq, Deserialize, Serialize)]
pub struct Block(BlockNative);

#[wasm_bindgen]
#[derive(Clone, Debug, Eq, PartialEq, Deserialize, Serialize)]
pub struct RecordCiphertextData {
    record_ciphertext: RecordCiphertext,
    commitment: Field,
}

#[wasm_bindgen]
impl RecordCiphertextData {
    #[wasm_bindgen(constructor)]
    pub fn new(record_ciphertext: RecordCiphertext, commitment: Field) -> Self {
        Self { record_ciphertext, commitment }
    }

    #[wasm_bindgen(getter = recordCiphertext)]
    pub fn record_ciphertext(&self) -> RecordCiphertext {
        self.record_ciphertext.clone()
    }

    #[wasm_bindgen(setter = recordCiphertext)]
    pub fn set_record_ciphertext(&mut self, record_ciphertext: RecordCiphertext) {
        self.record_ciphertext = record_ciphertext;
    }

    #[wasm_bindgen(getter)]
    pub fn commitment(&self) -> Field {
        self.commitment.clone()
    }

    #[wasm_bindgen(setter)]
    pub fn set_commitment(&mut self, commitment: Field) {
        self.commitment = commitment;
    }
}

#[wasm_bindgen]
#[derive(Clone, Debug, Eq, PartialEq, Deserialize, Serialize)]
pub struct RecordData {
    record: RecordPlaintext,
    serial_number: Field,
}

#[wasm_bindgen]
impl RecordData {
    #[wasm_bindgen(constructor)]
    pub fn new(record: RecordPlaintext, serial_number: Field) -> Self {
        Self { record, serial_number }
    }

    #[wasm_bindgen(getter)]
    pub fn record(&self) -> RecordPlaintext {
        self.record.clone()
    }

    #[wasm_bindgen(setter)]
    pub fn set_record(&mut self, record: RecordPlaintext) {
        self.record = record;
    }

    #[wasm_bindgen(getter = serialNumber)]
    pub fn serial_number(&self) -> Field {
        self.serial_number.clone()
    }

    #[wasm_bindgen(setter = serialNumber)]
    pub fn set_serial_number(&mut self, serial_number: Field) {
        self.serial_number = serial_number;
    }
}

#[wasm_bindgen]
impl Block {
    /// Return create a block by deserializing a json string
    #[wasm_bindgen(js_name = fromString)]
    pub fn from_string(block: &str) -> Result<Block, String> {
        Self::from_str(block).map_err(|error| format!("The provided block json string was invalid - error: {error:?}"))
    }

    /// Return the block as a json string
    #[allow(clippy::inherent_to_string)]
    #[wasm_bindgen(js_name = toString)]
    pub fn to_string(&self) -> String {
        self.0.to_string()
    }

    /// Return ciphertext records owned by the view key and the commitment needed to decrypt them
    #[wasm_bindgen(js_name = intoOwnedCiphertextRecords)]
    pub fn into_owned_ciphertext_records(self, view_key: &ViewKey) -> js_sys::Array {
        let js_ciphertexts = js_sys::Array::new();
        self.0.into_records().for_each(|(field, record)| {
            if record.is_owner(&view_key) {
                let record = RecordCiphertextData::new(RecordCiphertext::from(record), Field::from(field));
                js_ciphertexts.push(&serde_wasm_bindgen::to_value(&record).unwrap());
            }
        });
        js_ciphertexts
    }

    /// Return owned plaintext records and serial numbers needed to determine if the records were owned
    #[wasm_bindgen(js_name = intoOwnedRecords)]
    pub fn into_owned_records(self, private_key: PrivateKey) -> js_sys::Array {
        let view_key = private_key.to_view_key();
        let js_records = js_sys::Array::new();
        self.0.into_records().for_each(|(field, record)| {
            if record.is_owner(&view_key) {
                let sn = RecordCiphertextNative::serial_number(*private_key, field);
                sn.ok().map(|sn| {
                    let record = record.decrypt(&view_key).unwrap();
                    let record_data = RecordData::new(RecordPlaintext::from(record), Field::from(sn));
                    js_records.push(&serde_wasm_bindgen::to_value(&record_data).unwrap());
                });
            }
        });
        js_records
    }
}

impl FromStr for Block {
    type Err = anyhow::Error;

    fn from_str(block: &str) -> Result<Self, Self::Err> {
        Ok(Self(BlockNative::from_str(block)?))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::RecordPlaintextNative;
    use wasm_bindgen_test::*;

    const BLOCK_STRING: &str = r#"{"block_hash":"ab1mevclvzwkyhhxulpytyqa7kesgqs33j8yj0v56rzj69ux5m8v5pq03wey4","previous_hash":"ab1dh3hrhpz72uff4pyyranlcglfkxw4fzgasz50wk5k7defl8y4srq6swcsj","header":{"previous_state_root":"3930194330063627412495504744086830399304683273715358282078120603916657672049field","transactions_root":"5295335892556872661482944961903822064287072000024012891607407400732120023295field","coinbase_accumulator_point":"0field","metadata":{"network":3,"round":192,"height":192,"coinbase_target":17256,"proof_target":135,"last_coinbase_target":16794,"last_coinbase_timestamp":1667967757,"timestamp":1667967772}},"transactions":[{"type":"execute","id":"at1p4e0u59mfxypc5f7je8f37gg6tsrjp35duwyn6shntfpzr5w9q9qs4twy7","execution":{"transitions":[{"id":"as1e22ugux84ulsngqh0n4vxy5fv9atfxqcc3lxf6p975q9awcrwgrspe3rml","program":"credits.aleo","function":"transfer","inputs":[{"type":"record","id":"790102253837927997769308629707084115458404806192417464379769127020073117959field","tag":"934315525054261003410262140368505758098597538824529526774320192283020250712field"},{"type":"private","id":"7910732374154571107025101791251934421325518424357283744629374143522382056658field","value":"ciphertext1qgqqej0kz9vl4nfh7z4gyjt87x9sfcvnj0qc2uzg8kwekwl39t0kqqzmcclfk9pcpayzfm86rc7ka7h99q5qt4s549h2hwmtt7ddmu9zpyf9d4qd"},{"type":"private","id":"2679715091195662987723845968155134707978248199559959130784760137364460568824field","value":"ciphertext1qyqzx66gec287cj3h7wkqswaqfc5hpdq2n60zrzdn7f6ujyr206r2ystmates"}],"outputs":[{"type":"record","id":"4046242342804977190458704940601298842330496130957114888604788350680319974719field","checksum":"5161616956877842607557662366492359771370906369297459893583595234317533750681field","value":"record1qyqspc7xwk6l0rvwtvwwnwplpwvhf70ur4utv229vdccgdzwcjgzyts8qyqspztauv2s80cy33zjytjvfqzn30u5552hd3j4qgrzsuq58mnerrsjqr5ar37tcjahz0pgnyeu0arfqnr0lghyphs298x30w5mu67qkvzq5k0kh3v"},{"type":"record","id":"8255256966456859094068658299719704821103803881071851451082818057761278750183field","checksum":"1319273812727685461644485030982371878355517120807563425099980547776620506959field","value":"record1qyqspr9s82fsryvur9pvf0m04hlnmv9emey3klupfz7zmwhve6sjxasvqyqsqyhhlzzwujtxqfydk6gec47aq2yttdkvzjjcf0slh3jz2j8sf3c9qzaha5ttdwjm6nwnt8awywclft6xr2pt9c7gljv4lneev04e2unqyw0ytuw"}],"proof":"proof1qqqqzqqqqqqqqqqqpty8zk8fvqlnp4lmffxfcgqqng5mqwfpuquggc0xnxjw7hjvm0ymxnkaqqvx6zrjujc7ha9h4k5czhs5tvxngl6tex585cvfkfkmcwkt3e6luw97x6csz8ut2syjvc4vkv4m3qlam4h0w6dspzt9wfq7q9m3qkuwu6jlg34p86tujt5p02jqyxs2e3wgqxmmg3xz9kd9eu6r8ugu8ed6rh2n0we89ya27d96rqgpwa7596l3c07zl4xmxa8cnqlrs8gskecmp826dfvjj85q22265e7u26kdw8pka9qwvmmwmpz774tspy4vld4fp5jw5kmu5y2ylmde3jaegknp7d5wqal6m4ad4vccdl5hrm4tnr4dzs353ja9rlna9jsksr3q4g2fecpglxj3gxkwpmzkmdn39unzu7m3pnnd4s5f9r7kzr4wkdp497r8eae8rn46xxlpysq6wqvr2kj50rlfyscfc408q6gk7x3e482j4tkznj4ayuw6jr5xsdf403e5y2masxhdj8g0e0ugczgh4xqer4pp205us2ak2j39m2dhjlrlzs4rarhrj86q4x50l02jyeuzw27a0jp0lxchaep32lyyzj437zupa7xdfq3u3juhpfwana5pkagmjavma9tma44vrt92mnayxn8sfhsdp998ekfkxvgdpnp4htpz2akqrkjcy6lq2wjw2xd9qk4zwxglhp3yk39mlj4ktpkac6vd4rqzg3dhkx3arpdd6jt6v2u97tc98tz3q9rprxxqj83qdp5srlzq9luxgf9qg0am2jevrjwgfm2putjh9ttqdxhzjvlcusv76r7fcrkxauvwejql2vvt0zm3t4arjkte4h27aucqvtqaluhwfhc5q26e02gswru4qpgurjt0z8gsp923r46v2rn6puf8503hg3ep5ae3hp646v6kjhw3hdenxk504hgrda3nvx88hy3jqzk4h4jj9gv40aty2nt86eju75l2cwjxkja096k6n8r3zflsk30gpa4eylex762m943chspc9u8ylw82z4qpnuzdgrxs6t7xaul5fuxqz75wdrvw7p9ysm44uw9a080404fysrjwjsacku69024sfnr0jcctylu2xj828a905ysuve3rjkj2dlq0jnp7ffxvdmu7s67canelpqgsyqqqqqqqqqqq7m2nlkc3a96tnhm03ml5tr97w5e9vlj7vdvu8p3tmdmfcye9mdfevwv35tx7zllwpmkhgq85tfkcqqwgmdfys4p7769etzmyw7x6s5zhtqadfj3zgnmrfu8khy4fnx23pslczdyurfugeq6kdes839kp6ajj70ua4p98fm554kuv4379y295rnv6kylyy40q53kavfcv69ta5qqqqquujftc","tpk":"3327479019423797451329131492110480602473376001212391076300660897209503331000group","tcm":"442892253528485877912210467933720468590561598681534797122120260396231762971field","fee":0}],"global_state_root":"ar1wxleufdmjj0k85nrk55kmhr204vsx3pyzlh55m7dcc0dxstfkqyqmpetfr","inclusion":"proof1qqqqzqqqqqqqqqqqn8u69z77aq7e7r87cklf8w3j8zu96znkweapqgpu24t90wvytwzsflhxnkqjn3f8v3gk4ahkdexcr9z4hrg9qugudzaj8krpcazgwtmkp6f30luy70a0qvk8m6nagv24hz7v40uc0hdts3xncekzeuuzqxs9gqepetldmfhn2yfquc0gm4z0a7yekkrrjghrsv777j6ungd65t4ewj3yy4d0jztr5apcc5yq7qgp7e5nfguzd65f3n5hy7qp7g9z4y80wythsf8zey2fk2yxrh6gnzu9trs0ty79lk0anzqhnk28gqlsrqrp4zdyqn7j63zzddx8lqy59pe4duvwgghqynvp6g2nc3lpelrcc8nu37n7n575qa43xvwf5sa8qre6skpctutsfupt78ew4rspuqcjtqg7x9mwxm39rx5vzrk57pw3tfsufvmgp94z8j8mpdycm0wr5qtjsm2sr9epd8qjg30623jwa7nh5a5lznpwjcaheuzmk0qjz8u30x0dnnfelucezd4hwlp02x5xkgqtxqs5579pkm43x69agew8gysqvhe8j4m9n75m3eccq4pmg8008pyl42fy5tqsfmxete0pnsw8x3yps56hkh649fcnvhard66p0nh7n9ytnl2k753lpt4q66exdc3ftj30yw03y86gzxzk4uj627dgzh2sphpv9wfu54n33tqa0wd0thqxczzcyld05rhd45tvuu3u6tmftghk336cm0fdgz0p04t6lsezcd53qyrnlnjmsk3w2c8qz5fpn6wxaazd2pxc7lpty454lw3xdlfm0s3392erwrlyngluzrkz6qxzd9ptklwwxus8xsgsx4w74s5p72m37dcswcxtcfj5ams0d7vg5m895kg8rlpuqh3jyxjvwzy0aa57lvc74sqfslzayngp54qfdc2ytk655m6ac3jldyuyfmxn42npend3yztqqzg9qqdc36pydzn9mmvc49jkh4qdkvju4vdnt4qtdcuz0unt27cpph3m85f55pawhp4gy4z8sny89zatkxxl6s5dj4t9nj4esqqcs45qdlgxg30qv92xhu245qtwmq2zuf2c322hhg7trw7wwdx79hjp8qgvy0l2ec5z60f2f37agg845437n0hlql2ku6flmcr870yk3564qs9qyqqqqqqqqqqqp5c7xuxvfvswnpt7xmt5kq3rdjsman6fxd8uvngqczj6juwzqpm7h8ulxeaqafwrup0hfmlle4xczqfx7m36gz6w47hnkuc7dxnqqlxv8m4c5dg75jdkxajse0pyk4agps68zv4r5emphd3g8m7evwm8s3c58j3g6dehy6leuz6sudtf7p8s5ufn6lutj7rxmxg29mkr48cxzqgqqqpgkdhe"}}],"signature":"sign1042my7n7pawtz8c83n366c9hn2p7wsl603h94r2fnea6cgyueuq5m7wemkm0m6jxtfgrnrcjp9nelkq95d2vl2chhhnzez0st99mvqm7rawvssddfv078wthdpqynfu3jh5qeruups7t7vyls3jxccnypxa5z55an3zwd9em29wrjxmpyymwflclchtzhr62hwthyumkge2qgrteay6"}"#;

    #[test]
    fn test_block_from_string_regular() {
        let block = BlockNative::from_str(BLOCK_STRING).unwrap();
        assert_eq!(block.to_string(), BLOCK_STRING);
    }
}
