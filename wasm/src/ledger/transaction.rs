// Copyright (C) 2019-2023 Aleo Systems Inc.
// This file is part of the Aleo SDK library.

// The Aleo SDK library is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// The Aleo SDK library is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with the Aleo SDK library. If not, see <https://www.gnu.org/licenses/>.

use crate::{
    input_to_js_value,
    object,
    output_to_js_value,
    types::native::{FromBytes, ToBytes, TransactionNative, U64Native},
    Field,
    Group,
    RecordCiphertext,
    RecordPlaintext,
    Transition,
    VerifyingKey,
    ViewKey,
};

use js_sys::{Array, Object, Reflect, Uint8Array};
use std::{ops::Deref, str::FromStr};
use wasm_bindgen::{prelude::wasm_bindgen, JsValue};

/// Webassembly Representation of an Aleo transaction
///
/// This object is created when generating an on-chain function deployment or execution and is the
/// object that should be submitted to the Aleo Network in order to deploy or execute a function.
#[wasm_bindgen]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Transaction(TransactionNative);

#[wasm_bindgen]
impl Transaction {
    /// Create a transaction from a string
    ///
    /// @param {string} transaction String representation of a transaction
    /// @returns {Transaction}
    #[wasm_bindgen(js_name = fromString)]
    pub fn from_string(transaction: &str) -> Result<Transaction, String> {
        Transaction::from_str(transaction)
    }

    /// Create a transaction from a Uint8Array of left endian bytes.
    ///
    /// @param {Uint8Array} Uint8Array of left endian bytes encoding a Transaction.
    /// @returns {Transaction}
    #[wasm_bindgen(js_name = fromBytesLe)]
    pub fn from_bytes_le(bytes: Uint8Array) -> Result<Transaction, String> {
        let bytes = bytes.to_vec();
        let transaction = TransactionNative::from_bytes_le(&bytes).map_err(|e| e.to_string())?;
        Ok(Transaction(transaction))
    }

    /// Get the transaction as a string. If you want to submit this transaction to the Aleo Network
    /// this function will create the string that should be submitted in the `POST` data.
    ///
    /// @returns {string} String representation of the transaction
    #[wasm_bindgen(js_name = toString)]
    #[allow(clippy::inherent_to_string)]
    pub fn to_string(&self) -> String {
        self.0.to_string()
    }

    /// Get the transaction as a Uint8Array of left endian bytes.
    ///
    /// @returns {Uint8Array} Uint8Array representation of the transaction
    #[wasm_bindgen(js_name = toBytesLe)]
    pub fn to_bytes_le(&self) -> Result<Uint8Array, String> {
        let bytes = self.0.to_bytes_le().map_err(|e| e.to_string())?;
        Ok(Uint8Array::from(bytes.as_slice()))
    }

    /// Returns true if the transaction contains the given serial number.
    ///
    /// @param {boolean} True if the transaction contains the given serial number.
    #[wasm_bindgen(js_name = constainsSerialNumber)]
    pub fn contains_serial_number(&self, serial_number: &Field) -> bool {
        self.0.contains_serial_number(serial_number)
    }

    /// Returns true if the transaction contains the given commitment.
    ///
    /// @param {boolean} True if the transaction contains the given commitment.
    #[wasm_bindgen(js_name = constainsCommitment)]
    pub fn contains_commitment(&self, commitment: &Field) -> bool {
        self.0.contains_commitment(commitment)
    }

    /// Find a record in the transaction by the record's commitment.
    #[wasm_bindgen(js_name = findRecord)]
    pub fn find_record(&self, commitment: &Field) -> Option<RecordCiphertext> {
        self.0.find_record(commitment).map(|record_ciphertext| RecordCiphertext::from(record_ciphertext))
    }

    /// Returns the transaction's base fee.
    #[wasm_bindgen(js_name = baseFeeAmount)]
    pub fn base_fee_amount(&self) -> u64 {
        self.0.base_fee_amount().map(|fee| *fee).unwrap_or(0)
    }

    /// Returns the transaction's total fee.
    #[wasm_bindgen(js_name = feeAmount)]
    pub fn fee_amount(&self) -> u64 {
        self.0.fee_amount().map(|fee| *fee).unwrap_or(0)
    }

    /// Returns the transaction's priority fee.
    ///
    /// returns {bigint} The transaction's priority fee.
    #[wasm_bindgen(js_name = priorityFeeAmount)]
    pub fn priority_fee_amount(&self) -> u64 {
        self.0.priority_fee_amount().map(|fee| *fee).unwrap_or(0)
    }

    /// Returns true if the transaction is a deployment transaction.
    ///
    /// @returns {boolean} True if the transaction is a deployment transaction
    #[wasm_bindgen(js_name = isDeploy)]
    pub fn is_deploy(&self) -> bool {
        self.0.is_deploy()
    }

    /// Returns true if the transaction is an execution transaction.
    ///
    /// @returns {boolean} True if the transaction is an execution transaction
    #[wasm_bindgen(js_name = isExecute)]
    pub fn is_execute(&self) -> bool {
        self.0.is_execute()
    }

    /// Returns true if the transaction is a fee transaction.
    ///
    /// @returns {boolean} True if the transaction is a fee transaction
    #[wasm_bindgen(js_name = isFee)]
    pub fn is_fee(&self) -> bool {
        self.0.is_fee()
    }

    /// Get the record plaintext present in a transaction owned by a specific view key.
    ///
    /// @param {ViewKey} view_key View key used to decrypt the ciphertext
    ///
    /// @returns {Array<RecordPlaintext>} Array of record plaintext objects
    #[wasm_bindgen(js_name = ownedRecords)]
    pub fn owned_records(&self, view_key: &ViewKey) -> Array {
        self.0
            .records()
            .filter_map(|(_, record_ciphertext)| {
                if let Ok(record_plaintext) = record_ciphertext.decrypt(view_key) {
                    Some(JsValue::from(RecordPlaintext::from(record_plaintext)))
                } else {
                    None
                }
            })
            .collect::<Array>()
    }

    /// Get the records present in a transaction and their commitments.
    ///
    /// @returns {Array<{commitment: Field, record: RecordCiphertext}>} Array of record ciphertext objects
    pub fn records(&self) -> Array {
        self.0
            .records()
            .map(|(commitment, record_ciphertext)| {
                let commitment = Field::from(commitment);
                let record_ciphertext = RecordCiphertext::from(record_ciphertext);
                object! {
                    "commitment" : commitment,
                    "record" : record_ciphertext,
                }
            })
            .collect::<Array>()
    }

    /// Get a summary of the transaction within a javascript object.
    ///
    /// If the transaction is an execution transaction, this function will return a list of the
    /// transitions and their inputs and outputs.
    ///
    /// If the transaction is a deployment transaction, this function will return the program id and
    /// a list of the functions and their verifying keys, constraint, and variable counts.
    ///
    /// @param {boolean} convert_to_js If true the inputs and outputs will be converted to JS objects,
    /// if false the inputs and outputs will be in wasm format.
    ///
    /// @returns {Object} Transaction summary
    pub fn summary(&self, convert_to_js: bool) -> Object {
        // If the transaction is an execution, create an array of transitions.
        let transitions = if self.0.is_execute() {
            let transitions = self.0.transitions().map(|transition| {
                // Collect the inputs and outputs.
                let inputs = transition.inputs().iter().map(|input| {
                    input_to_js_value(input, convert_to_js)
                }).collect::<Array>();
                let outputs = transition.outputs().iter().map(|output| {
                    output_to_js_value(output, convert_to_js)
                }).collect::<Array>();
                object! {
                    "program" : transition.program_id().to_string(),
                    "function" : transition.function_name().to_string(),
                    "id" : transition.id().to_string(),
                    "inputs" : inputs,
                    "outputs" : outputs,
                    "tpk" : if convert_to_js { JsValue::from_str(&transition.tpk().to_string()) } else { JsValue::from(Group::from(transition.tpk())) },
                    "tcm" : if convert_to_js { JsValue::from_str(&transition.tcm().to_string()) } else { JsValue::from(Field::from(transition.tcm())) },
                    "scm" : if convert_to_js { JsValue::from_str(&transition.scm().to_string()) } else { JsValue::from(Field::from(transition.scm())) },
                }
            }).collect::<Array>();
            JsValue::from(transitions)
        } else {
            JsValue::from(Array::new())
        };

        // If the transaction is a deployment, summarize the deployment.
        let deployment = if let Some(deployment) = self.0.deployment() {
            let functions = deployment.verifying_keys().iter().map(|(function_name, (verifying_key, certificate))| {
                // Create the initial function object.
                object! {
                    "name" : function_name.to_string(),
                    "constraints" : verifying_key.circuit_info.num_constraints as u32,
                    "variables" : verifying_key.num_variables() as u32,
                    "verifyingKey": if convert_to_js { JsValue::from_str(&verifying_key.to_string()) } else { JsValue::from(VerifyingKey::from(verifying_key)) },
                    "certificate" : certificate.to_string(),
                }
            }).collect::<Array>();
            // Create the deployment object.
            JsValue::from(object! {
                "edition" : deployment.edition(),
                "program" : deployment.program_id().to_string(),
                "functions" : functions,
            })
        } else {
            JsValue::NULL
        };

        object! {
            "id" : self.id().to_string(),
            "type" : self.transaction_type().to_string(),
            "fee" : *self.0.fee_amount().unwrap_or(U64Native::new(0)),
            "baseFee" : *self.0.base_fee_amount().unwrap_or(U64Native::new(0)),
            "priorityFee" : *self.0.priority_fee_amount().unwrap_or(U64Native::new(0)),
            "transitions" : transitions,
            "deployment" : deployment,
        }
    }

    /// Get the id of the transaction. This is the merkle root of the transaction's inclusion proof.
    ///
    /// This value can be used to query the status of the transaction on the Aleo Network to see
    /// if it was successful. If successful, the transaction will be included in a block and this
    /// value can be used to lookup the transaction data on-chain.
    ///
    /// @returns {string} TransactionId
    pub fn id(&self) -> String {
        self.0.id().to_string()
    }

    /// Get the

    /// Get the type of the transaction (will return "deploy" or "execute")
    ///
    /// @returns {string} Transaction type
    #[wasm_bindgen(js_name = transactionType)]
    pub fn transaction_type(&self) -> String {
        match &self.0 {
            TransactionNative::Deploy(..) => "deploy".to_string(),
            TransactionNative::Execute(..) => "execute".to_string(),
            TransactionNative::Fee(..) => "fee".to_string(),
        }
    }

    /// Get the transitions in a transaction.
    pub fn transitions(&self) -> Array {
        self.0.transitions().map(|transition| JsValue::from(Transition::from(transition))).collect::<Array>()
    }

    /// Get the verifying keys in a transaction.
    pub fn verifying_keys(&self) -> Array {
        self.0
            .deployment()
            .map(|deployment| {
                deployment
                    .verifying_keys()
                    .iter()
                    .map(|(function_name, (verifying_key, certificate))| {
                        object! {
                            "program" : deployment.program_id().to_string(),
                            "function" : function_name.to_string(),
                            "verifyingKey" : verifying_key.to_string(),
                            "certificate" : certificate.to_string(),
                        }
                    })
                    .collect::<Array>()
            })
            .unwrap_or_else(|| Array::new())
    }
}

impl Deref for Transaction {
    type Target = TransactionNative;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl From<TransactionNative> for Transaction {
    fn from(transaction: TransactionNative) -> Self {
        Self(transaction)
    }
}

impl From<Transaction> for TransactionNative {
    fn from(transaction: Transaction) -> Self {
        transaction.0
    }
}

impl From<&TransactionNative> for Transaction {
    fn from(transaction: &TransactionNative) -> Self {
        Self(transaction.clone())
    }
}

impl From<&Transaction> for TransactionNative {
    fn from(transaction: &Transaction) -> Self {
        transaction.0.clone()
    }
}

impl FromStr for Transaction {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        Ok(Self(TransactionNative::from_str(s).map_err(|e| e.to_string())?))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    use crate::PrivateKey;
    use wasm_bindgen_test::*;

    const DEPLOYMENT_TRANSACTION_STRING: &str = r#"{"type":"deploy","id":"at1x28y9yg4lufd4ag94hejzg43t7rehe0snn4q7nrv222ssga39cxs4v8yhz","owner":{"address":"aleo14ufp2emj0h2hxz5szczmh67sy6jt8wrhujd8q0758lwdl3dxcgzsnych8z","signature":"sign17s2l4wpzgcagaveuvfakcjamwnwjjlz0y3r5l4se9dyuhqtq7uq3mu95u2vhnnlnxywx9qchxrqprg2qqf4z7yte6c66nh5n0sl56pzvky5e8y90ec5kr3jdent5q3syfdfwnawexgtycys67mrpgmyzp9k60z2nksltnt920gfrev550tgh7ds20mkc2vmllml0wc9t2sdq7mludlg"},"deployment":{"edition":0,"program":"import credits.aleo;\nimport token_registry.aleo;\n\nprogram paleo_token.aleo;\n\nstruct TokenMetadata:\n    token_id as field;\n    name as u128;\n    symbol as u128;\n    decimals as u8;\n    supply as u128;\n    max_supply as u128;\n    admin as address;\n    external_authorization_required as boolean;\n    external_authorization_party as address;\n\nstruct TokenOwner:\n    account as address;\n    token_id as field;\n\nfunction register_token:\n    assert.eq self.caller pondo_protocol.aleo ;\n    call token_registry.aleo/register_token 1751493913335802797273486270793650302076377624243810059080883537084141842600field 1631421259099656974472467909989204u128 482131854671u128 6u8 10000000000000000u128 false paleo_token.aleo into r0;\n    call token_registry.aleo/set_role 1751493913335802797273486270793650302076377624243810059080883537084141842600field pondo_protocol.aleo 3u8 into r1;\n    async register_token r0 r1 into r2;\n    output r2 as paleo_token.aleo/register_token.future;\n\nfinalize register_token:\n    input r0 as token_registry.aleo/register_token.future;\n    input r1 as token_registry.aleo/set_role.future;\n    await r0;\n    await r1;\n","verifying_keys":[["register_token",["verifier1qysqqqqqqqqqqqqe2vqqqqqqqqqqy5cqqqqqqqqq6h6qqqqqqqqqq7t0qyqqqqqqqrvkgqqqqqqqqqqvqqqqqqqqqqqplqdkrq7rqctsykx6m5yzh4kgu034caw9jajq94cauzljwdhvpwcnj9kudvw8er7xj84jsgrt36uq6uue30qkpd89y894m62z0dg763u2taze0c29xckj2tpml045ylqxuyjyh6p8j083e4wa8gwvk7ccp7ngs3q6588hk5ynu3r5g0n8c0ef02k72z6gm4uvarff5tmwrjl5aptdjl3y3ass70plcu3fn26lsz755yfm04zrc46pnp3ckas9rldve2cj6z9urugn6v4sdgg4s424tz60xuslman4g0l0njs0xqqlzqylm7cyezsj0nmz0j4ls4cdwcgg6hjdmfdpp3psrq5l7t92lgluf332fmh488hp3lrezsfp08zr9kqdhm04xhlyutsx46spy630v6300hxlcg9pz8t2pk32xsh8mack4aggnj3l0m7ax3k2zy3fxz0ajzvqrras8v77gz2y6tadyhnf4syp29anstwvvm79ycd4hstqwy2fseg4naj9wn2nsgk9u8kyxk6lf24sznvfun7k098v74kr90y0f8fjpxqwve9v4864aga5wxqr7fd97ql7u5xg2jetxvjms5cjdv4na29nqq2llh7w8hcja53kd4q5tpdtezyfass6xmefx4vmyy429j0szvhynz70z5ng2wqpf75qhzwyc07yvqpjzpawq4fawwzyp0k8pd0hj3rg64n9zqqnvu4pqd62kkj2e6x29wd8sgvnnsjeueeump0wm9c29jqh9lxwqf7460tjq85046kufvg09kl6va7nxc538mrgd4nws8hn5wnzmaflz745304af6sjr5mu5w5qg8pmpjfyf08y0tfwwcywwx6rptjayl9wkce73kep648ngw9fftqmcl2p8mpm8hxydh2jm9u63vvqz00n54fkfty09q67l9vxnvtcs5rq3rxt6admrlm3vswpawx7n72u97psqqqqqqqqq73p4nw","certificate1qyqsqqqqqqqqqq9lagxtsmt26sqwagk6lka96cafe2kcfeawf6e9xkealhknj6xjslde558qk5rqheacjrzeqe4udwqsqd39q37"]]]},"fee":{"transition":{"id":"au1drgy55qgqjamcelxxc9tftm2xwxxnatjhk6aw8cv58n73jw2ksyqyxhe52","program":"credits.aleo","function":"fee_public","inputs":[{"type":"public","id":"3944803907000127539789489783248179360350626611673930092095472101536915105648field","value":"3822825u64"},{"type":"public","id":"2428693424792850552098227641411610349637246228480447202193175654244036244011field","value":"0u64"},{"type":"public","id":"6088669359561332069215447154594742594167350891485753011343671798851280749325field","value":"6022467014568450947363808701247325589581740771167845313900833637727383646170field"}],"outputs":[{"type":"future","id":"7281541101405061985719781327556891177957752697069289778753047445573135811106field","value":"{\n  program_id: credits.aleo,\n  function_name: fee_public,\n  arguments: [\n    aleo14ufp2emj0h2hxz5szczmh67sy6jt8wrhujd8q0758lwdl3dxcgzsnych8z,\n    3822825u64\n  ]\n}"}],"tpk":"841909782874651252158458462679654668538213932739793763154595076655809612821group","tcm":"2511511922341152276187100108604836178096154815833554688270549827603573004357field","scm":"1761116878324568047849389341641574331098847236362215143226335873323745774540field"},"global_state_root":"sr1fx6ghuqjnqa9v85fm4q2rjhtz2flfrjkewm9jkul57a25xc5duqsjm47zl","proof":"proof1qyqsqqqqqqqqqqqpqqqqqqqqqqqzsjfv5nq5tuece7q0y3dmv34zshqyrclt2ckar7jvktq6rqm0870spvgc8e80jpe5rskllx07ypgpq9je6gteeqzgwvsnlhysp8sme05cq6htw8ppjpfdndw38zlmvpnw4gmzd484s493a4fq2vfpsljxvq0cmsrarlqazqrf8lf98k7ja3nhackywdvpu7a6nl2zmvespnwfw68hscaaeqezapc096ch4awwvqqfjt4hthzke4q0sq8ve3ltd8nz6rhsf4c6k9pttmss60urxnnxx2fkgr553rvwm2xvxg5a780zs9qqrwyh8925et5yemca5zqnuyjw0ku90q34cgq9lns05v8xkrlfjq7kr58gz6pltxvunpfg8qw08xgszll9wvegqdk853329f2q6gj09ct0nayv423ywjf9kap3nggj7ak3k3hkm2cz6zn0rgd0xup2glaesrke7xfuppaw3v38c6x38ly8jds75r0fnxfm279mxx7tdsu45mnahz6txdw8gtr0zje2ypa29tz87qr62mv9cfd58nkktyetcww3ml40r3kvewl78lekdz0chuefh0rzmgw98amh59harekfe0mnrvnqg5qm32utxrn5mfgnaak4uz5dc0q22ssyu3kdferczwpg94hyp6w3s9t327t5savtkmyguwkzr93z63qpvqnf7xm4serl86qqcm7gypynw03gy75wpf5q8dgtskwsn9t4qggnz3qr72qd7cegfvetgujhs5ry7hr0re4k8z29hgxyd6wxaxjxsz9lxx8z6tx48ce4amnqw08hkpwmr2kf3dwjsq2c7prldaz0l6p6px40qa3rtp0jle3vneqwp6g52ea3rg5w034cfz2uv33lrfrh6xvquzaun7fucydaxuy70mqcs4yqmdjkwy8pgtuj7sph796qgr5aydqpxrjaruf0c8r0rme7pf5xuzyeww4eg547sx4kcf3aqs7pen0rqcymg56ekacfd6xgkaxngxh3zxeafyc0tn3ps45t4rzvu57hqhlfgzcxsn82r34dhxpcflty9ye5cyun05956srd0d8ugtvwupdfltddzqmlvl2t668w3sj94ftqtsnpc7238c4slh5x70slrurl3hha65qs6yng4fdwzenrp58nv4vywv3atsug7k4wwqk7x22ucpxyvr8gmmc9qvqqqqqqqqqqqhq8lmk25myjde80elc7tvljrwyyax9gjyqf8hugmx70fm6s9tlq7c5a3j7h49pa56an4v4uttsusqq9x7p55w0e3uthgs90aukk3mfeg9pn7958453772f77h8u9v6p8kz488h0kzqq6cdj599h04k0wxsqq8gnslzlw9qyqcew4smpyfntstl3lyxqlu3cnx0nwjjgx04suzgsyzxptjz2egl3jpngghtczq27trjsz6ndek07er9u6292gafr3gqj26zdt3lrl3hl9wrmutunenz4qqqqlywd5e"}}"#;
    const PRIVATE_TRANSACTION_STRING: &str = r#"{"type":"execute","id":"at1trtk7ck9mr7qltjevfvk353rheahnptau48t9mpwrf2s0ejlguxqvs388h","execution":{"transitions":[{"id":"au1esljjuudvn5z28md8vql2uw5uqgm708mhhmn8pkzp5klp85p2cxskf8znf","program":"token_registry.aleo","function":"transfer_from_public_to_private","inputs":[{"type":"public","id":"5257496091646921585176921691949707495692269463619709788164537073190724688393field","value":"6088188135219746443092391282916151282477828391085949070550825603498725268775field"},{"type":"public","id":"4734425631175323922041258870676666700379437652792338303297896880149544457574field","value":"aleo1alc5gk6kq090zevzqk2mvj66kmxlm72rcdt37gxcqk6afzw4rcqqnr7n87"},{"type":"private","id":"6909964581445673528079112820536648179251476729247256947256393502684753533654field","value":"ciphertext1qgq9gakqkkrdnm82k3dhq94ag5mzvvpd704xeg5mlj9rja2wpv55qpsuxcc7ljth0x4c8uhee5an73q9j6jnexlwv55mqrrw8xuc96v0pyz3t5zx"},{"type":"public","id":"3570375152982904490791009652653308673719418535809604695156322779370356814931field","value":"5000000u128"},{"type":"public","id":"4220252501020357137999370314354751909031927343850314472238921796917794106258field","value":"false"}],"outputs":[{"type":"record","id":"1519430436199468694236812107601454680865149877653282609596433797310986942355field","checksum":"7825015134490374061718862810754865843379178802562091903621775235753610717739field","value":"record1qyqspvrpwftj2d2646ucuzcx4ydc4w5xvtt9k47hjdfu9delrnqlyhgrqsrxzmt0w4h8ggcqqgqsqp6mfpm0c69lsjtzd9vwqdect95jh940r9tf674vnum550x7npcppp6x76m9de0kjezrqqpqyqrn34czly0f5zrafx4qkc5aqctye6ujlddk2mh879q8luhw8ds4prf8z4e6fdrr9z96kqpaurvc8rxmd2tu908fnyp20gxxm8st5z6qk8m90p6x2unwv9k97ct4w35x7unf0fshg6t0de0hyet3w45hyetyyvqqyqgqlnv9kd6wkkxk4e6amhsx532r7szynvk7nl6pmgtkl06yqp0s7uqpqct4w35x7unf0fjkghm4de6xjmprqqpqzqrt8wga4q0ru3l5p8mqwg6layvvr73sfz3szms6j24eq7gjqnwvqcfavd7c64h7zr0g9ugv9axk6jpmdtq5rznuhkyywy6tpjxfu85q65fjmk5"},{"type":"future","id":"5888722476399755432673980371939601991508048188603596203194157868492229627460field","value":"{\n  program_id: token_registry.aleo,\n  function_name: transfer_from_public_to_private,\n  arguments: [\n    6088188135219746443092391282916151282477828391085949070550825603498725268775field,\n    aleo1alc5gk6kq090zevzqk2mvj66kmxlm72rcdt37gxcqk6afzw4rcqqnr7n87,\n    5000000u128,\n    false,\n    558284137755014491959643167545935948685104025653671767693251866538675454600field,\n    8039771865288381734685706842682167636339090995256749714833527911104585140102field\n  ]\n}"}],"tpk":"2823281032381053715181530341141016504786809652838413641658095730403842269059group","tcm":"770241663179413790033799067431596353899871353858929680711511149246540425118field","scm":"6845182532650964173356391969005331370591444046632036068754797772530920467754field"},{"id":"au1vmxzg87fjz07u2wagrvaqa86krzektj36da5027xeawmhagkgcgq390kt6","program":"token_registry.aleo","function":"transfer_private_to_public","inputs":[{"type":"public","id":"1221713801470698778218888015662741654287360796880536772715222670279443453539field","value":"aleo1t74eg228rmmjuzwckhvh0mhfw2nfeqhtx4pt4jrkxalz8p7nyvzsqcq3cv"},{"type":"public","id":"4299975887359664178972319612512449833990118405312341894917690415190709179642field","value":"5000000u128"},{"type":"record","id":"7297678128506538960017126527848958452314285982243290381077752673459003235168field","tag":"5927494353681584508543437843074074206888565375971943533833607785738878432871field"}],"outputs":[{"type":"record","id":"165342580005569501285175194752279956739356183693343353204155323905099312862field","checksum":"7269551960100024541544171491839410555227293464125024093409752490338412136978field","value":"record1qyqsqt4gantkzlclj0jxnhlnvpzw7w0v0a6s500lhf6a9k7yu7u96aqxqsrxzmt0w4h8ggcqqgqsq5p8gwkjmkhtv2kzesnqc764687nj95ewl7sp7r4zwhdap4hypgwpp6x76m9de0kjezrqqpqyqqxswc7as8qcar73596lzd8jhdjc06wcg4fe9jx0eqhl3v22jzuqspvc2nlgrmzhezzdjxp3t5vwms649ahlvv03a68ayy7dd4g0t33q8m90p6x2unwv9k97ct4w35x7unf0fshg6t0de0hyet3w45hyetyyvqqyqgqdzq73cda2x0cr3k3ymt9rneg7g6za3uh8prhaw7mxvzce7hxgqfpqct4w35x7unf0fjkghm4de6xjmprqqpqzqxpq9wyftx93krwp9jfn2fuxjvq9cc57fulatyvhd5k0wdyhhlrzzd659c97t8t6m3gff8kk433fmtlz90ttzr7gj3kldl7jc8n9xpsy0teqpz"},{"type":"future","id":"4610948791862851969571690062874935021430761927451990539073445200385145062552field","value":"{\n  program_id: token_registry.aleo,\n  function_name: transfer_private_to_public,\n  arguments: [\n    6088188135219746443092391282916151282477828391085949070550825603498725268775field,\n    aleo1t74eg228rmmjuzwckhvh0mhfw2nfeqhtx4pt4jrkxalz8p7nyvzsqcq3cv,\n    5000000u128,\n    4294967295u32,\n    false,\n    4017271997399872127133630661595143306637299890633468624080159721317948532970field\n  ]\n}"}],"tpk":"5173867317529501045268010236754448911464398984112357286741904327201012341731group","tcm":"1624017943571967564887378348677099371441637928393224690069947288933898965429field","scm":"6845182532650964173356391969005331370591444046632036068754797772530920467754field"},{"id":"au19z9fcskusltd32gnq5w2802t6ezxpf0lumpxw89upfa0064epg8q5k9lss","program":"token_registry.aleo","function":"transfer_public_to_private","inputs":[{"type":"public","id":"6717513849143650275369196551983700829207073924289950794227259040745449824252field","value":"3443843282313283355522573239085696902919850365217539366784739393210722344986field"},{"type":"private","id":"5857391272595029228100692007275997851140843788091919010550923844277558961829field","value":"ciphertext1qgq89dksvka54cdacftklfpqc99g6dacsrr3nf0cfteg3qjlyrly5r5k3vneyewshnnxqtzn5vrl0p3a2zk85munjdy5ulq6v22mk5l2qynzppkj"},{"type":"public","id":"5087632154296593337192683985919283783453316430575670787956343107288140880452field","value":"2853086u128"},{"type":"public","id":"1289185716236599101502161341227363235058365841379872066925309522171199764337field","value":"false"}],"outputs":[{"type":"record","id":"1072000623916268103280772981329432193842245274400314778140145588288052397621field","checksum":"700768400250878538158630881292870378273786225766467682556785951469546025212field","value":"record1qyqsqu7mr0qpmupagweansx2zge3d8hactw8egaehn9wn964lv5tz5sqqsrxzmt0w4h8ggcqqgqspvu6fdrs2dmm3qxefw8p4tmzxznl0zx4p6c4a6t4d78g6tg6z6qypp6x76m9de0kjezrqqpqyqy33z3nak7pf9rpsdwq2mmgx70twxsdgkmwaa6pxx0g9xm4gd55qrakw9v6tj4x7vuulrrgda9x2y808mtyf4x09y9jdjtxvvnegp7qj8m90p6x2unwv9k97ct4w35x7unf0fshg6t0de0hyet3w45hyetyyvqqyqgqf29x8dnfhe5xvz67qjg7h4amej0z6szrl2mx84a0n0xcsl05ty9pqct4w35x7unf0fjkghm4de6xjmprqqpqzqpmnum0mtqpwevc7wvg58sdag789ys7ecrhj5emjacfq4msuqekpsnxs086ql6p3knqflvkjyw3fmdjves6kqlr699zrycuuv6dnstssdrg3dv"},{"type":"future","id":"6899035076280936507149943681056812635529151826177536201515110369244119770911field","value":"{\n  program_id: token_registry.aleo,\n  function_name: transfer_public_to_private,\n  arguments: [\n    3443843282313283355522573239085696902919850365217539366784739393210722344986field,\n    2853086u128,\n    aleo1t74eg228rmmjuzwckhvh0mhfw2nfeqhtx4pt4jrkxalz8p7nyvzsqcq3cv,\n    false,\n    6332753889417248324835106105307338377575749284686365609643768815832134328110field\n  ]\n}"}],"tpk":"2568397866999730819330555520162646572298165986253643159856801889107872706126group","tcm":"1959114513825798864963490856770242049972866453444789597296990194209645623700field","scm":"6845182532650964173356391969005331370591444046632036068754797772530920467754field"},{"id":"au17tzncuz7j7cfqldcpqk08pfg0lg5tr6zpfd9lj65g7nxkvnueqxq57wneu","program":"arcn_whitelist.aleo","function":"is_caller_eligible","inputs":[{"type":"public","id":"5181179208135972559791758103335637501540320988735146613844521180989362574812field","value":"aleo1p3lsekdvxt4l5p0v0htjt9a98u9x9ewr4d5u30hc7dfj8e854uxql5arf0"}],"outputs":[{"type":"future","id":"1077301635254070980068118941958438223517676455115248350889302038803204187183field","value":"{\n  program_id: arcn_whitelist.aleo,\n  function_name: is_caller_eligible,\n  arguments: [\n    aleo1p3lsekdvxt4l5p0v0htjt9a98u9x9ewr4d5u30hc7dfj8e854uxql5arf0\n  ]\n}"}],"tpk":"8067940846006892264370281991741027449096260158987162071954721078056517439543group","tcm":"8084419692884566616875572260394463912240202134496378001974985451201721509068field","scm":"6845182532650964173356391969005331370591444046632036068754797772530920467754field"},{"id":"au18ulamac79w7d70ug0xm447evq763vfglyed3mgrl6pazux64t59qaad0mn","program":"arcn_pool_v2_2_2.aleo","function":"swap_amm","inputs":[{"type":"public","id":"2777961394596902188509155291560681680704441197486893146981292502529233774162field","value":"3593632309927409194215146717781580749800998687192184818060433399389998091992field"},{"type":"private","id":"6465569977417299452140687360954655534350334492695463191706216185821860291520field","value":"ciphertext1qgq8glmwnqdzq3equ3jzw8z564t5736pt8kwulrmq7gyc4c9ne4qgq37hfqvtggv2vlsrk3f4vw3lf9erlhftu8sx3eqavk9dkdaamshqy467w3k"},{"type":"external_record","id":"5931056152991011036951802051111922795585953023970537947368058733912784749058field"},{"type":"public","id":"5756764406486781450854627380258781821853956578397735898749689811098265106777field","value":"5000000u128"},{"type":"public","id":"6157675062344047336308378072946757250882950276131155095338445870485714537093field","value":"3443843282313283355522573239085696902919850365217539366784739393210722344986field"},{"type":"public","id":"7655091725413617433419176740012298604866489211563684578783449100635514275521field","value":"2853086u128"},{"type":"public","id":"8096835908153654580326723723600296440151474191298462608172393802139910078798field","value":"895583657field"},{"type":"public","id":"2232244027093170926088733546338956085890755350023587708446349804620708176375field","value":"false"}],"outputs":[{"type":"external_record","id":"7079896241232821532017264682829618177274975668069219169056259193401301228802field"},{"type":"external_record","id":"4361504941726503046877277674704372301939644406331706723501675468632368622293field"},{"type":"record","id":"7442429365225624736219331745717821522636846702126476992668790693173705593430field","checksum":"917833966972388251197929713059534193658750630147294820012288863249448581230field","value":"record1qyqsq3a8c0h65mchpgmh8kx9ze49hdrn89nhqmrj2qs7wxx9qr22n3s9qgy8gmmtv4h976tygvqqyqsqdfcrtqtmsa0tadmxuvlfrj9kmcwt23hy4ntwwc9memk07q0jzczsawa65xhe9y0vt8n79ywk025rfdgdaqnn2326mru8jgmkrgnxwzc8wehh2cmgv4eyxqqzqgq9sw2hzxlv94luk50ucgp4n4jnl6l05zlzaqz6mp73hknye55pzphm7yth7r0pke64ct5c76jwkermrzveegfp06x6v8z8w7zyyhvlpkjnempxn5xdrrcza5j8gr5px47z789wm954ttrlgk829wz0mq83qq2p8u3"},{"type":"future","id":"6681295450743665515488132244713812748330773962603406843845622701107138430663field","value":"{\n  program_id: arcn_pool_v2_2_2.aleo,\n  function_name: swap_amm,\n  arguments: [\n    {\n      program_id: token_registry.aleo,\n      function_name: transfer_private_to_public,\n      arguments: [\n        6088188135219746443092391282916151282477828391085949070550825603498725268775field,\n        aleo1t74eg228rmmjuzwckhvh0mhfw2nfeqhtx4pt4jrkxalz8p7nyvzsqcq3cv,\n        5000000u128,\n        4294967295u32,\n        false,\n        4017271997399872127133630661595143306637299890633468624080159721317948532970field\n      ]\n    },\n    {\n      program_id: token_registry.aleo,\n      function_name: transfer_public_to_private,\n      arguments: [\n        3443843282313283355522573239085696902919850365217539366784739393210722344986field,\n        2853086u128,\n        aleo1t74eg228rmmjuzwckhvh0mhfw2nfeqhtx4pt4jrkxalz8p7nyvzsqcq3cv,\n        false,\n        6332753889417248324835106105307338377575749284686365609643768815832134328110field\n      ]\n    },\n    {\n      program_id: arcn_whitelist.aleo,\n      function_name: is_caller_eligible,\n      arguments: [\n        aleo1p3lsekdvxt4l5p0v0htjt9a98u9x9ewr4d5u30hc7dfj8e854uxql5arf0\n      ]\n    },\n    3593632309927409194215146717781580749800998687192184818060433399389998091992field,\n    6088188135219746443092391282916151282477828391085949070550825603498725268775field,\n    5000000u128,\n    3443843282313283355522573239085696902919850365217539366784739393210722344986field,\n    2853086u128,\n    895583657field\n  ]\n}"}],"tpk":"1342119736376068637752770486850178620847721573574738771979874269596838852188group","tcm":"7874010516397194164427698399670119597220568851817232920852308328898178036575field","scm":"6845182532650964173356391969005331370591444046632036068754797772530920467754field"},{"id":"au1vxdesg2zy55c7vzs93uql45ds9gwk9u2ew3rnpf4v2wtywt80vqqlkda5t","program":"credits.aleo","function":"transfer_public_to_private","inputs":[{"type":"private","id":"1404264754453969095843566414511245821072228370286079104449961334181532763204field","value":"ciphertext1qgqz4e40s0rjetwkh2fzqe2tk42r4nvjvwcezlwk4dc8ea4nvextyzgenesd4s4a20pqrwa6jklf6qjek8m6lcwn96tu334xxhdt2nxczyfs0kxx"},{"type":"public","id":"2196356120234687238105059088531925570047958183568152598201481215987293334864field","value":"2853086u64"}],"outputs":[{"type":"record","id":"5811232554341726313494331634333239887690461708910720499523063115451689421842field","checksum":"7956258471343584270488874709148436054831283095287593313430403758454921097803field","value":"record1qyqsqfkeknuwe57tnxrx4uhm2x0646thk9d760g3n5cylmjcjg3sszg2qyxx66trwfhkxun9v35hguerqqpqzqypa37fp69v5a4lqc5c502f6uum5qzjl73kp2qakfexp9h9zat7p6zltl2vtxt7mc5qkwph394vz0f4jp5zkcx7yeexmetvt46ulcx3zh6v9nl"},{"type":"future","id":"7985325623824541680911876541418407727338546462290030599447321029139555332916field","value":"{\n  program_id: credits.aleo,\n  function_name: transfer_public_to_private,\n  arguments: [\n    aleo1tjkv7vquk6yldxz53ecwsy5csnun43rfaknpkjc97v5223dlnyxsglv7nm,\n    2853086u64\n  ]\n}"}],"tpk":"6376703261165885423612172138507177444166511633125356773492386325292051077414group","tcm":"3200412106697966888051969042079721245803622185231807189592276391981360284400field","scm":"6845182532650964173356391969005331370591444046632036068754797772530920467754field"},{"id":"au1naeu56spz0x0zct003sa8qgpzndy6nxj8rrcm7n0fehy9llcl5yscflt0k","program":"token_registry.aleo","function":"burn_private","inputs":[{"type":"record","id":"4569194627311410524427044648350523511369013276760031398859310110870190258038field","tag":"4584393733726099907383249165298083023636530416018938077800083356406243497342field"},{"type":"public","id":"4155661860779318196369465902681808025430867777096367712868886959018716227815field","value":"2853086u128"}],"outputs":[{"type":"record","id":"3771264214823666953346974490700157125043441681812666085949968314967709800215field","checksum":"17461704767783030875142836237730678349755524657182224909428747180538982740field","value":"record1qyqspwnlv6gfxx05yj7aw7z2dl44gyh06jrvgf42jux0dep33cy7jlsvqsrxzmt0w4h8ggcqqgqsqwdwr889h9fhnyclazs8yt26t6r5ua4qk7yksj7p40rz9846mzgrpp6x76m9de0kjezrqqpqyq9sj8x3qdmz6nal4j470a0wwcray54lffe3ya5u2zlpeq45lg4up3na8gul0vgrn3eced6dka4ax2ja85xzds4pmqf8csrn8ku5cv3qz8m90p6x2unwv9k97ct4w35x7unf0fshg6t0de0hyet3w45hyetyyvqqyqgq8djhghnte2w86qsdjaumy4zcux2fxszm3ej2956af8cpl2w95g9pqct4w35x7unf0fjkghm4de6xjmprqqpqzqxd6c782j0ny65ed2ckzp3vlx7cv8drslasq8kqpdzmjeyzal38qemw38x0axnz5t53fj6ttavh8l4jlfjdryc6mesd4w6uvpmzfsqqjvtu0xd"},{"type":"future","id":"2177527202823505610844479366424698260670813913152550670302738921219693374616field","value":"{\n  program_id: token_registry.aleo,\n  function_name: burn_private,\n  arguments: [\n    3443843282313283355522573239085696902919850365217539366784739393210722344986field,\n    2853086u128,\n    aleo1tjkv7vquk6yldxz53ecwsy5csnun43rfaknpkjc97v5223dlnyxsglv7nm,\n    5783861720504029593520331872442756678068735468923730684279741068753131773333field\n  ]\n}"}],"tpk":"8426225807947287980879824833030089440060785195861154519084544916641544071836group","tcm":"3226339871444496417979841037237975848011574524309845233165930705339306709897field","scm":"6845182532650964173356391969005331370591444046632036068754797772530920467754field"},{"id":"au19ngad45c2a8vltuz0jte8z66e94fdmes3f2q93smkxlzlwr32u9qzdlm0j","program":"wrapped_credits.aleo","function":"withdraw_credits_private","inputs":[{"type":"external_record","id":"3330872860974127053610007925513905905645751404923301909410110148580695905608field"},{"type":"private","id":"5179968582109601510233160680082288606334431774787346608518065273924130319786field","value":"ciphertext1qyqz3z96ya53hfgzcma9vn3j2dggqxeyyt5uuehsd2hmk2qgmqjekrcj46khg"}],"outputs":[{"type":"external_record","id":"2249460016896769128152577907568638560200231346925203034389043093171250882769field"},{"type":"external_record","id":"5326974382593045303299773832413828972554613245919292606640769997783867661561field"},{"type":"future","id":"1620362652569766343265831010240906668146260768016777078073772232696655925621field","value":"{\n  program_id: wrapped_credits.aleo,\n  function_name: withdraw_credits_private,\n  arguments: [\n    {\n      program_id: credits.aleo,\n      function_name: transfer_public_to_private,\n      arguments: [\n        aleo1tjkv7vquk6yldxz53ecwsy5csnun43rfaknpkjc97v5223dlnyxsglv7nm,\n        2853086u64\n      ]\n    },\n    {\n      program_id: token_registry.aleo,\n      function_name: burn_private,\n      arguments: [\n        3443843282313283355522573239085696902919850365217539366784739393210722344986field,\n        2853086u128,\n        aleo1tjkv7vquk6yldxz53ecwsy5csnun43rfaknpkjc97v5223dlnyxsglv7nm,\n        5783861720504029593520331872442756678068735468923730684279741068753131773333field\n      ]\n    }\n  \n  ]\n}"}],"tpk":"7993684643404433918175520510755158186169579065562290617052235730072396743465group","tcm":"6350326829821006319019541790896617483651371996494391104602392230930879088267field","scm":"6845182532650964173356391969005331370591444046632036068754797772530920467754field"},{"id":"au1c74dxw8d8ejsr622s4wdyp9xn77t2qtswcyfnn38gpetclgvt5rskp2kul","program":"credits.aleo","function":"transfer_private_to_public","inputs":[{"type":"record","id":"4533108036368515252569043196443672231666656940822285613880225593219792918441field","tag":"5255716548233261634169748876525503028408318381735617764879448403758795614109field"},{"type":"public","id":"6503755056130744546389910223233473503874319634233060719691429236287383345523field","value":"aleo1alc5gk6kq090zevzqk2mvj66kmxlm72rcdt37gxcqk6afzw4rcqqnr7n87"},{"type":"public","id":"3946915606700863873105873020835488041147502781727162195300220148177490732327field","value":"2853086u64"}],"outputs":[{"type":"record","id":"943976410829260337763479759505976811527362260474560567118516337204512789734field","checksum":"3748980190062340389735760620407740639879890989636334352105570818489553336920field","value":"record1qyqsqtmfwfp5ndvvdt2fu9njan0hm0f7jwv7s6k84xsrwz73nnctlkszqyxx66trwfhkxun9v35hguerqqpqzqyqjms350hqsj77gnhgm65kgdf847rckdl2gmegua2h9vsfukqaqgzfvjg32e8639y04vpaqgj5h8k2vf5qg656k4xwh9876c6etvnq59q6e09"},{"type":"future","id":"4556108762920992818013558662628803202656163652624293677090511263049484993423field","value":"{\n  program_id: credits.aleo,\n  function_name: transfer_private_to_public,\n  arguments: [\n    aleo1alc5gk6kq090zevzqk2mvj66kmxlm72rcdt37gxcqk6afzw4rcqqnr7n87,\n    2853086u64\n  ]\n}"}],"tpk":"2859000946815530984177884272975690109485879517497438980891621997214514049753group","tcm":"2923464641185387423584316228760880307880149612856561918838684742664311818191field","scm":"6845182532650964173356391969005331370591444046632036068754797772530920467754field"},{"id":"au1rljty9qdhp7xagrwm7v62m6f3xv0ypnvd69t0sg5a7msv3xrqg9qnugddp","program":"arcn_pool_v2_2_2.aleo","function":"transfer_voucher","inputs":[{"type":"record","id":"780585721101033968543684654771473636769436273965503504834193318384750303851field","tag":"6619860358918255116072968667678807021045617524626951924399167495404567103844field"},{"type":"private","id":"8044335835948514709149911793405381593848963363064062012718271049210081426299field","value":"ciphertext1qgqflmvyaxtzwreas05uda68wd2c2nmyzyar4x42ud2rv2rs69wfcr4e8xq0867tk3u47lwzrz82xqn8t58pnqmeqfe9me6570pg2fw7quwdcuk4"}],"outputs":[{"type":"record","id":"6318607379128851454006079991387062990564710702905618842350477529868415583041field","checksum":"4799408185063161535156198838932574838041315165930894122035458726205954068903field","value":"record1qyqsqrfc3vy4uxwqfz0w249v4ge4d58642l5g5c4xr2n9w3a6nlpsrszqgy8gmmtv4h976tygvqqyqsqdhep3luxum60zqs2ypg22zvqjmcafxqx72untcl2mxdcj2jmuuytcy7xf06jt220z9jw6jvdw80x2xaw8y2y7tkcedfvkxl33jrusrg8wehh2cmgv4eyxqqzqgq9tmlyadzjqmmwjep34mfrmn29r7dyymxy3ct6gqkxp592rvfn2qynvdg240g7jwyxljvpyxj4895qm3j8wwdec6pqmqpzfvhw4a3qq2elrerh2ssxnr90eldl2xy3m820yrktkl5n5ql2zzvy03vryl2q5c3e2r4"}],"tpk":"2979610848369748866981252243041315469935493029449654284589243814396541190699group","tcm":"831236125621889978395342078696651359862319094489741295573166017482562568115field","scm":"6845182532650964173356391969005331370591444046632036068754797772530920467754field"},{"id":"au163ww03zmr6pm6kk6ywfujj0m98gts924py4pxq7hrh2vngls4ygs6gjeeh","program":"arcn_compliance_v1.aleo","function":"report","inputs":[{"type":"public","id":"1567337096165796298219011129231777483316855849793541736599987415337671846122field","value":"aleo1alc5gk6kq090zevzqk2mvj66kmxlm72rcdt37gxcqk6afzw4rcqqnr7n87"},{"type":"public","id":"1601367144014069842576021726854639332368729861419508268811276508668936465894field","value":"aleo1alc5gk6kq090zevzqk2mvj66kmxlm72rcdt37gxcqk6afzw4rcqqnr7n87"},{"type":"public","id":"3309271983465428237396594951021923649568200827782208037146469455432132867151field","value":"6088188135219746443092391282916151282477828391085949070550825603498725268775field"},{"type":"public","id":"6791964418906879913458854776143044581393208020183919084249673238345112815413field","value":"3443843282313283355522573239085696902919850365217539366784739393210722344986field"},{"type":"public","id":"3004767552726195841464962017743322846057310068084707014099535093603356886582field","value":"5000000u128"},{"type":"public","id":"7344012842121443950512160064821568083316269901336459680599747955624194045014field","value":"2853086u128"}],"outputs":[],"tpk":"288834887394982567447746421515559152342520070618476288036385656650250863262group","tcm":"7925602659865417838927070188611241415472066259703294161023942717693711446131field","scm":"6845182532650964173356391969005331370591444046632036068754797772530920467754field"},{"id":"au1nqp9twz0u0kehp8yjkmmhtq5ru0qkyplumygy48d3myqcfrc8qyqgh7rcc","program":"arcn_puc_out_helper_v2_2_3.aleo","function":"swap_amm_credits_out","inputs":[{"type":"public","id":"6977280926229094172571671077695347282665797700228074405347376539518370306595field","value":"3593632309927409194215146717781580749800998687192184818060433399389998091992field"},{"type":"public","id":"6054234861707385933825909195841644203152338351140166658974824995638504226422field","value":"aleo1alc5gk6kq090zevzqk2mvj66kmxlm72rcdt37gxcqk6afzw4rcqqnr7n87"},{"type":"private","id":"7529845554082496661661199700601687634200114264652102826542523614674511084122field","value":"ciphertext1qgqdnmcz27zuynle7z9jrthm7z7hw9wy2uk2e5xs4dwv0xkzwau57r4q6jfyxau56luzu6mqjc94anxs0zrfgk7hh8f8pshderqfje0zpv2j47ug"},{"type":"public","id":"3795072663781019369507800669220398662446416779373335647821492422301323484007field","value":"false"},{"type":"public","id":"2812045850322505948143863332797061271357892685646411762936997009033523673924field","value":"5000000u128"},{"type":"public","id":"8159175872683457006069017266939085907099920990352643426654507971916408095369field","value":"2853086u128"},{"type":"public","id":"8133822555852974163149251544010810320178294343344212543569867799225922921327field","value":"895583657field"}],"outputs":[{"type":"external_record","id":"8279694039206298571585154456707587785825242704560523399553306768947911717739field"},{"type":"future","id":"5057389386940773621192081980642653818971443823962403420242523447892302637336field","value":"{\n  program_id: arcn_puc_out_helper_v2_2_3.aleo,\n  function_name: swap_amm_credits_out,\n  arguments: [\n    {\n      program_id: token_registry.aleo,\n      function_name: transfer_from_public_to_private,\n      arguments: [\n        6088188135219746443092391282916151282477828391085949070550825603498725268775field,\n        aleo1alc5gk6kq090zevzqk2mvj66kmxlm72rcdt37gxcqk6afzw4rcqqnr7n87,\n        5000000u128,\n        false,\n        558284137755014491959643167545935948685104025653671767693251866538675454600field,\n        8039771865288381734685706842682167636339090995256749714833527911104585140102field\n      ]\n    },\n    {\n      program_id: arcn_pool_v2_2_2.aleo,\n      function_name: swap_amm,\n      arguments: [\n        {\n          program_id: token_registry.aleo,\n          function_name: transfer_private_to_public,\n          arguments: [\n            6088188135219746443092391282916151282477828391085949070550825603498725268775field,\n            aleo1t74eg228rmmjuzwckhvh0mhfw2nfeqhtx4pt4jrkxalz8p7nyvzsqcq3cv,\n            5000000u128,\n            4294967295u32,\n            false,\n            4017271997399872127133630661595143306637299890633468624080159721317948532970field\n          ]\n        },\n        {\n          program_id: token_registry.aleo,\n          function_name: transfer_public_to_private,\n          arguments: [\n            3443843282313283355522573239085696902919850365217539366784739393210722344986field,\n            2853086u128,\n            aleo1t74eg228rmmjuzwckhvh0mhfw2nfeqhtx4pt4jrkxalz8p7nyvzsqcq3cv,\n            false,\n            6332753889417248324835106105307338377575749284686365609643768815832134328110field\n          ]\n        },\n        {\n          program_id: arcn_whitelist.aleo,\n          function_name: is_caller_eligible,\n          arguments: [\n            aleo1p3lsekdvxt4l5p0v0htjt9a98u9x9ewr4d5u30hc7dfj8e854uxql5arf0\n          ]\n        },\n        3593632309927409194215146717781580749800998687192184818060433399389998091992field,\n        6088188135219746443092391282916151282477828391085949070550825603498725268775field,\n        5000000u128,\n        3443843282313283355522573239085696902919850365217539366784739393210722344986field,\n        2853086u128,\n        895583657field\n      ]\n    },\n    {\n      program_id: wrapped_credits.aleo,\n      function_name: withdraw_credits_private,\n      arguments: [\n        {\n          program_id: credits.aleo,\n          function_name: transfer_public_to_private,\n          arguments: [\n            aleo1tjkv7vquk6yldxz53ecwsy5csnun43rfaknpkjc97v5223dlnyxsglv7nm,\n            2853086u64\n          ]\n        },\n        {\n          program_id: token_registry.aleo,\n          function_name: burn_private,\n          arguments: [\n            3443843282313283355522573239085696902919850365217539366784739393210722344986field,\n            2853086u128,\n            aleo1tjkv7vquk6yldxz53ecwsy5csnun43rfaknpkjc97v5223dlnyxsglv7nm,\n            5783861720504029593520331872442756678068735468923730684279741068753131773333field\n          ]\n        }\n      \n      ]\n    },\n    {\n      program_id: credits.aleo,\n      function_name: transfer_private_to_public,\n      arguments: [\n        aleo1alc5gk6kq090zevzqk2mvj66kmxlm72rcdt37gxcqk6afzw4rcqqnr7n87,\n        2853086u64\n      ]\n    }\n  \n  ]\n}"}],"tpk":"7028284932666583343374786742483288970368056345219247088692864064564677070098group","tcm":"3232039063794504189662282393694028262972224088492113650002238623795950405768field","scm":"6845182532650964173356391969005331370591444046632036068754797772530920467754field"}],"global_state_root":"sr1cen7yug2hfywjg2kmkyteahnfau3mqu0u8675knpu7y2k6mx3vqqsx62s5","proof":"proof1qyxsqqqqqqqqqqqpqqqqqqqqqqqqzqqqqqqqqqqqqyqqqqqqqqqqqqgqqqqqqqqqqqqsqqqqqqqqqqqpqqqqqqqqqqqqgqqqqqqqqqqqqyqqqqqqqqqqqqgqqqqqqqqqqqqsqqqqqqqqqqqpqqqqqqqqqqqqzqqqqqqqqqqqqyqqqqqqqqqqqvxw9gtuqy2e47sm90uslq8xjzqcv89qga6jws0k2s6twd9k3gsqm5tjjlet968aqne2p7u4mr8cqrs2ax7vwervrmrakfgc3ycaztkrm32fx03kd978t9q4jnxj4krwv9epffz0ncaa8xuap453r5l63q2q8vxs85un30q7a5c9dhlhltnwrcjt2hwjnmehz9anc78fgmhzdfgucdvytuzp5xl08wee053d85q5gahtgcqr9gfh0zsy5tup3fk8r45jxgacnfmc5c5lpp8ejtkn8j7pnxfemfct4ys3x8qp8wmhtrgp7pwmutq2j0gvz3h7vndsq708vt38zrrlez58q735s9dtvtsa8lqmzsqa8jvssee9dr8gemh52vqspfjrtacntml8k8pmeeyts5usxjaquvapyvcfuvjxvp3q5dstwh5nstj8rzfcurxgete0xep5ltsgsq8cnrrayqqlfy68n5z0hk7ed5rq403j9n5x6w5tfvrczxp0twcx8l6llvk7ht2fmw6kc6f790dekq2jrvfwh6ys4r3q6m3y0tg0lhxvjl4hp4dew3wgyay9rv493ycf3l24lmfup8znea273ajtvkz7tqqe3pyum3x5x689xngp4uyydghy85fzepvdf6kn9t2dtzrgdnpv87tmkpa9v03s98aymqnrfxx650qqxhu4jqzxvgeqttmp3pgu2npwxe0hh20tzenv726jemjmd6x52ln40hds6qufeshskl8gqjlc7zzgpka6pvcu4jz08kjthurmkxkw5wly23t4xn29ady39akpmu0fcr4k74wzh3z76wv2g4nxtg9zpwm9qqwtw9smf09kpwgxvusr3sa9zffyjqdfpwqwgs8ak6jw8wcl5kspl0e7qsdzcmf4yx8s2yp7dahynqxwtvt5a8rl8zc4py8g9tucspxc9x6raehvkn98ys2562m57j4tvkexmhxjxd6nl6lx2w6uq4sg6uqttcsx5g07fk6r8ywtfhm8zah4y3twmzyrazm2qv2g02fwadgl2ht9sjsh3zwlhrxda3uqh6gkwluqygywll5g22ts2wwag5j04vzu9xx8apqy5t72qwywxkwxq6uqlln79vdv5yuuj8rvgzacfr03y6hcp3qrfd8exvtuve4uw6caa0fu3runn9vxvql4sq20zz3kfp23cjxjjqh3vvsufw36jh9qlqsja3jusyqexxkrta5k54tgsma35gs9ama85m9mg7yjk0jku8gvlalh6mww6uphrhyq78p9um0l2wzuyxv09l5q3qu2wpg25rrvcq0qya04zyx9rryyfrxkqwkwl9ae4gyyg0e25d6lsarssw5e6nx5fj6j4eue9krgqh642u24dyp4ys0tjaypcfjqsje6j7j5thmzyvg7qffj0snuxsylc2x3cz68xjfdqefw676h09aysr5r0q6zslp46rz0e3u78cdh0vv8we2rmpykkuyx84y07eymetvpxzq4ux6sv3vahtcrvaaj5wdyzq9ukhp8aejl5at24gmy6le0t2fpeqkp6p9aw99xhc76pkq4f09sg383pacungwmpn34c2fm25kkugq8g4dh50gzq2rxrs7c4ht34pkl674lxdmjnnxe30fs2lpsqhh35dd9lhq3nkfsexfj3tkh9ec8nnuqqsfw5jrlu8hvu2a6tjj69uttmcuxpq7qlmej9lw43r0lu4dv32f42msdap7urwjxw5wlzmntzr4cqcxd6g8zzq283z7urkc8uu5runwegnxfxxzwfjz8c5efq649urnw9jcd3w2gwa6g9fr506s4pae2sq78gne78lruta87mm6pev45v2r2a9frjtr9k2lpshqc9t6ehmfkllhqf5v4cq26ea68xw2djr9rgq0pad6ycckh744m4euj9vjuuptk8hpvasa32yxd88004w8ar3pvunn4afz8ms85sand0jcskhm8auqv96q7kn5maug4xs484v73wyr5grpavelqjq45p8k0dd8wwc8fm9uhpllx0j6x260v7htsl8za695qyz70e69azv25mcppnwg5xdhdxesedte0wyg2pqg272py2j7h5dsf7zlxlj8vks2dzzzaym046q4cqpnxf94uerrsaffrh80gc094etvz7hst2jaaaj50awfyfpzms2pjjw38uyl4a9lhljmwgg7fvhsesr02xugnc4rujdrw7rkj4h6nx665q7qa63q32q06jra200d78hg0cw7nrjecgc3r23g8vh8pczy30qwr2e8cuke68y9arkuwga72x6d7paud999zpawut6jmyezxje0y3rq0duc39374xvww0874nw0m0gqfcpperf7ld8jugm5ljqw3mr8qhlzuzed7rgzux490xpypjxuy6uymcqkg89g0qej9lfvcm86z0fypa7xvzpghp9mmtdcj3j754hq4l0f7zfkfcpxjpnfqfaaxt3ss255kqytugv8vmjrf648p074c5eyqqe30nkjzhf2hky464ljldyt4gwhrkltpd7mwlgqa8xwxjd8yu7z5v2736ykux3a40uuzdsp52qnuqpsv6jp4x2ywdw4jlzmmzwtancknmf2vcrkej7n7lxveumv93w2p4qnwc66fgmlpj8lqp8xtykn6hq07gdpur62uwkup0ap396fhq9g25hfd2sunz7z8pg9l3wep8zd3a680y55v3vg5pmnrms0v950jjjq7casa4yqtt7wrw2r5f7gtw7vqy8mqumhux848lwxgadqlp3axjtahw730pumwfy6525v4c5yksjsqp07u7p47xrkk780502nmfn5f7539he4ns2x5eh093g3e92esxqspqgr7e75dah2h63c2kwk48gqsp4rjnjhk36zv2dxrzp7426dphgq9ae4wkp4ezjsnuzxhs8h3d4j0u48vwuuwj3k5t89tdraskusuqqg52kh5c6jzdt45h43z9k7apvdt24j3pd0ujqjvy4zkvt4tjwzax3g8hdezv423z33nfkhpdffk9qdf4neg0celtg2ytajas43e579aczhym9kl8h2vrxc2wna8727u309rctdlxu4z7kmyywaucs2mf6qv2ctlt6z0q0ma5545j0ucpfzj88m8vrfdgu20pswcrxr34juwu9jwllzp64ng9hpf7sywe7z93ngqay6m6p75h8wuwwq8xkp4xjk980x927hhx43pj7233j3d0dx0rgausctkzm62qhya2hv204n6ayjcraeuaw0vcrv6g2l5lzwvxp5sm738gyh30aec8n8372n3qw3lh7uwmf49lnlypkzj3qzl999yfuzfsra8npt53d82w5v957t6ga6sv2j5sz6a2r8wwqhqs6tj7t5w3ng5v5snu4le54kl2zqsqe4v7ctutqyp6f8uqv0mnhcpynzny6hut8e7h93d7u9a4se3r9959c83ne9mdqu2hnzgxl68nc25l64gn45thzqfrlwwnmh5vv5xusds5hu6hq9vvv52y7yyz9d788mlm8j65tus5g84z8qm57ema530ex76eget28up3nnvahhnemeu5phze20e5z5ce2hnpqwa8935jdmj799umdpxc698n4nszm3de04yuf7dhsmprfjspyyn5ud99ktwmu55v8dukwwxvf89eph2h9ce8pp5pr7wpf78x9v5ztkfxxmffd0wjz80cjdc2u4vs9844aezanu597p8q0dx33s8fn0c8ahd444afjvn3j6hmsnwdhzztuk24t94ztnwr55hhqh964qqeqvez8fw45g05n50mdlmmj68sy8u3kvmprswhx35dfwg00cfmu8fzt39dl9hftch4kntd055azl27wq98253u53f46ws7qzhyyc9alyfk6979w2yxksje8lry7mzqfc4xkj9v68rne5m209kfcwxc4y4k8ypx8f6f6y7luk76ue25vt6ea6xexfsdrt5acff0uzrd4l36wwc4z3gy8gmysj4hzpe47yfn8vzjgqqqkysznfdz22q3dz9pw3vr2axqrsdclm24fzqqcmxcgdwk2xqkax9d7768ww79kqr6ez7erca9zgeq9vr3pufkheq3ss6p5mqpcaw6q45yr3wc77k5rxl6eeuxg95l0ljekd44a409jp9y6zuy2aekq9p8qpsv8h8qpyrkr4swswwphrcptfgye6uwk0g6az3dr9q49phku3mav6y32wa33x3mmqps5jeqvzz8kqr3dpcqqc2qs4tcqgw7mp2yya228qcqx73ypemhx6ykg9d38dkwnj80wtg448mvx5nemhpz5jpd75qnnqpf96jfwk9quvh6zp00ypa68zz3h7s0tr5nuw704w3gwkj4u5xvdw8c43hmjsv9w66mnwp0g5qqz9n5v0fxjxxgxpr0aqzzs4hguyawt080xclz2c0rtz76etulyah2hsakknsyr43v58rkdvm20knsz2asd0v7sjwpj8r2xsh0rvqh2mts7phlsavlxwurxekts50mllju5aheylexmtjqgwq4lglm70lnqq5aer0cezd0afu823qe3xhef379lw46z2rwncwhf5ryvz5zpknqcfe5ey5xy9syl3xvvrla9hfckvwax3e4vw6nzkkp7ygc3lhlhtsuatmdzms2zts4axjw4zhsqd4kjryr7klt453ww4xsx2kv27h3qqfd7t9q7ctktmm5nld2cx79h30lu97ccqx0jfjdfpk088ud77at5xnej0kx0fy42k6nww09cdzvhvqcjfvunpnpx2sn2syqtrrsefayzjq4qm7w5f0kxqxndl3gzgfpq4q76q9hjy7rawvqdzl75fzau3ypkxxd89a55wngwyrp0csdahy4lux5qq7yuk6la8fapygkuh45dcsq7d5jn8lmndnxzr72nmwd3qee23j7x028rxhdqynsmt7e947j9qzd8k8jk733lvx4f3nvpycdxz0t4ctgjs5h7m63skyxvh9ryhqfgzx6lsk24w5l57td0wg3p3k9tx4v6y7gcrqu98t5hw0yawvyd3qgpp2cguas5yk6f0x544dtly32sl98ay36uv8nrxrr90068ngvt7npzlas9nvuax0ct0ht3pjx62nsuy59ghw4q7kw8ggyxytzdhwxcnsmhw5njj8a77hd4zg2v7ycvx9mw7set8h9ayq3u7lzh7qvfjgljgz7v3dqxfwdy0yjtt92fwz6nf48e6xuxwgvage3up27a0vft586g97mgurwnfh9u6fhw30h29lz6m2ymqkp3r6m7ngk4yq2qpkgmf9jzseql6spy6gaf0uajy54246dynpyqh2ju538uw29qer7kt0w4twqm2nwacnx8zs6nj6jc432w4z57a8s39vkcusgjnj2jcp5ntjc9ksfznhfqt7f9krdgrrefv4tvtxwfjdfxra8972a2urkverznapvqgt6qd8fp7cueglse72d0huc06nv3n9rjepuj8azdlcgvuyy96a8gyqe6444gaakd4n3j96z7q4tl2cnx7jx7xcw9rujssqesd2qqk8ypd7s6kczfuxwe63tquxvhtghr7wtrdtnxp320uynxkc6420dd4ppjy5fydmz7n5kgjxyvfgzgm2565uzucnzhmgs5e9hzqlwrwevx2q5t0fch7f39zhtgxu9zwaejm7gfcsufxk09ga53kdwvkv76jtwfqpwkp960xwllnavxafxzhe49nh22am95r9py76qyw8zlc27jda0vg0sdqh0a65ycv5rqmxgntlae6zmj5du2dz7zac8j62hummc857vzw3eljkprvyzmc3nec5qg52s9u3at243h74njxguf5j3u6jeflhqqa9xqh08kjjrtaja8dxslfwy2dmd34h8gyk34egdxr9rg23xqzqk2awxnzl094dphvp6dqxu78qny24pvy78pzly6jle5cd9f6p92cr2w0e8g00spemvmzmj4yacsm3qjpff862pr8s694wf8xc9ed9r583jltg6qnz5catckd7pmlzwsvlmcwjmd370l4ldr84fea7h7qlzzra4377g9sywu5gwhl84yyenat7ufzd6uudz2lcyyygh27hp3xszr4mk6pa26a30ya2gqaqapr5z9gmzvj2qp8ammul3fpxqs8du63su46am3m8h8nvlvx4f2azts93td7rrws5vys4z03r98sfac2fsssznzj3exa30ald3y6xdgzn0yxcxtf4z4pqpr9jwcn6c6gf752a9gxqck6avalef2dcmxadn3xjsdulshd5sw37aqu0qv78z6shd9th5pc3c4z6xp38x6m675r6wruz0y3qsfe5p4pf9q0wu6n7qgyac747qc5uuv4jnzvlx6u74kmssu7kv740cd0gq2jg0ltq33m0skxfqkus4lvt8z2duaaldx9lrs90c7svk7zzhphemfkhqa87rzjcnj5evyc9ff3ssdxckvdapqdr46ah5cue0wdshsgpfdqcz4sp0hvgydd20sgz4m4h8h6euz8ecxn4ead76hygwt05ercnd38u8l37tzy6wh4nspk3etg4k5tw5hzcykwhv3a92n34qzcneemkleljxpakrqvzfqjmpz79zpxyypy8zpgvd67sdtq5602q88l36m44e08ud4mr986h0hzqv3xc6e2y23jx0pgu96h6hnw2fs3r40yphrs0mzta2qfgwjqkrecrchw077tc8mawwngxj63r0e360ux24ls5mz69z8mvxmjjefy32vy9cvku7n2wznrr0gxggfwjqmhjy4jqdzfzcnckvjqnea277saz2q2p04epfxzyfz0nt47am2q6mn37usd48nj25yctrsg2rg8u2g02pfmr04nefm7395cy7cqnc6etr565lphtcpuxzs0gw5dhshhw6mqsx5zr65hzrgyk9ttl8dek3mrzpssxgyauruml4c9tan42qxpheuc23fvlk2em7ckzh2y2uxyhvzt8njnh2lpwfdcf8est83w66l29fgfwkfcmh06twz2dfldywg8tzvegx7eph03lxf8wy8v9gd0q4y9jqzp3d9uqfwl8gfyptyxztsqvw60kvccq30kxjjccfvq35g4ykea5p47qtea0w7hwta5aqaqjzar2zaz3efl5n4thv2aeuj2khvxvxcss0dse58jvgy04ygw4fdezw5k2qxr53uerwyfqrpkd7ajnrjnljjsvxel7jrwtnpnxfphh9cmu2d3txts9zguf9lt3vfj0jlfm75r4zvyfzhesak44svgfnm4ew0mg99kg79npgds0yvxdd3ayz2pgkq68qp37qyh7d6p9ne0lmg4hza9ey0yzspdmr2axd22e6mgncxw36skdqee99u5ajx24k50wlcah3lppng39v55axx4j6ph0a3x65frrn55slegc9hvs0rz0ec8nz83fzy4vh0trqxrlmfz4s2fsq8q9pvlcg2gvl9rfrqaev305p6tyduvegk39tvuagjrp4v0eahrypx8wp5g6eszm4n8h5pmqgww5sccgx2ll23xwt3u0sfu6rgahr2xdecahsavfkqp0c37cmpflv3lqse45t2phej20tzcmsddn344tfpxn8ffcdlvkplqww408z8eg7tsvlkpdwx8yes9s92trgjju672kavu9sh7xaz8quw858a438qa3w64e0qn5dgmrdeymh07rjvrddsmtyghpnv3gfxg06hpjee65vgapnrv7ac4v9lx3vhphcz8s99uexr0xgg4xe4mrmgzz0n44ey3hvds0a4e72pay9dld0pfhnu5cp2w35vp2e7rjhd946qmjgfwajlmga7wygqxqz9t7h7ckzvyfdsrkc23t0v0talja49d7qmv9trfzlknx2fadw0a078slqaw2vxfza6cprzy70t26cc47pcy3rlxf5x5k00sy2g9tkp6cd7p7ksvsqxqu5dttt35ujhq2yl7qymc3jxw7e4vkz9unqueeujfsumlqza8gpzgqmgw4uqskmjssw9fsguy3fwruzcm6pxcpgnan5y5tcar9lavzer2qa9tdj825hj6h9uwwyzf3p4p9ahpxx689elf56t9ekkc7e4lk7hc4aelzxdxs2qcumy90q7msjtnlm9qg86f0nz8turp5kjlk3ldw44wc2zu9k87xsn9p0c0ssqmhfq0m42m0szj4j03kj8feqq8dkamrptxv5kx5z8c5tp2sqec2lhe57mm765j6svh5u8vad2g08yvl83qe3ndl9j2xtg76k8xqcqq0laxqjnfumr22rl9jchmd9gfvgvh6kuckkq67qccz5zjf2hfsjqxvm3xh3zfxk7lzhztxye7hl5qse76m00cxrq47rlau90wux4aqpqwyshh5vpw37mvhq5q2s0wwgcg62rf5jtdvcj9yy6rn4us5jm2sja5yahu6s2j5p2euvnmps62uzd4q6wea2zc60l7fjsl09gu33pstrmg9ejupgg6jqus4x097r4fy3a28l376wplz2gzme3nvxywewqy9a22ywq5je0pd89wlucypmhr2ry4elzghz2g0ajjwk92xmcgmgpwupdgkupn08jc52pz5h886gyn38fmk7gxwdjwzzgew9vq7tfu0q7c4wned3c3vtt7ga3u5ktquzha49yzwatjufsj6a45rpvmc35hpy9kaenwxdae7f6vgqg4wzhpxwe85xft4jxtqkz3vq35j9qux5pqx5798zt42rdarj6cf7ecrn0qzfclvxkle8alcqqqwca2dv56dcupj5qz6y2mwtah0e869jq405gcz62267hc2a2e5pu95sjgtyemkuzckvhpzhfhw3hx7rdwmvudjxyumanm5feucvwr0v84a5xxw3rpeqlzg2t34n4mpa7w3d0d7smlf8t6zgt3dhv8xanmg47atzvq929uq2kpp5rl45e48aclk8tzej0e6u0hfd945sxgfsfs808m8nuj7n9s3sgxmwa46g0qywpfc7ze7k0pze50kpekq774luapvsgjt3ytlvvpuaga8p70xnm76g2vneqnwv4xuqclyk975qn5d0pfy8xnhd7g5craslc77m94c7qq8yeu5llzwfkjvv9z0yds5l25zh26ffd6rv7repsav9mzar2ks0plg9nshesr65ggc5lh2mvtehsxh33eeewxnk5kqml5lrm8hhkydanqpekw25j6hhqawp8r6z0a2hyqsdnc68y533ec8vgd698aeeqj30jsfcvcc8ddwsjwckfzh4wnp3e0xd9rswxgwwgql6rhk5fed3rektrcg3qsete9an97kcqr9qmgylvkpahnyrqf3qp7645d56l49zuhu69d82ytelap7rclzkvq6ygrqteks3awxt8u5q4znv6u9ccl8q00rrrmqycr0qjgjr9f3p84ayjexgaldt5u83pzsxqsy0y40svqvfh9qjrxw0rje336usvl467r7qrgyaxxsa0jnzkqjgqdag486afxxpk2mp9vspuqnzypycz3vfrwswkyzu6yvh74qxc86kx5v03nvl7dutkm3u4r0j6d4mylyvc6uf7x0zuc52cn3fuy4upydf2emguaccafa7y9hmljezrtwrkpymhc7qsv6wpenk6qmwpuaqctegkm5attxv6v6943v3wjh5ky4x4k0tltmwgpu9ldscqdanrpqj2cscyxqz20hwxc2gr9f6ehdmzq79mq67nq2j8xv2hty8786qxqqrplwhqlh5897jsg9a2gqn2gm3t577j0cw45c7h0pgwsk5ew08y9uxwp2rmpa6f23l3vndzgsnxx2pla9mcq5jxya92rl9e2dqtv76p9mwh3h0emjl725ve4uccvs7tq8g62gzukg999h9367a0ygyzssqdr2pu02a9t3q6smgsekegandmflsclnhvgx00veswqwhx4q789qk5mnrg897eela90txue7jr35fcr9pwte07zdmdkc9x4d5anm5psqndx0400tdftsc2se6yccyxhhep490mnz2p89q902lejduhdzpuzsl8aphd2q0enjr0wykpt3crlhejvldl0mn7qz2gtjqwudqaqpkr70ykdg7ttnuqvfjz3u6sxecsn0upj43mfmf6q37s0ld0rf6vdqpfuzrka5zaw05n5cryaky7vfn0dtjy9u0j85mm0kwy3k2ksunt7skg3naj2v6ys4a0hqnqn2j4jhlv04l8cpx57fzrnanq5trf7krxstg084jss57m2t5mnh6v342d8h0zu2n0ym8prenpp5fhvdtzc3pu9lkgaq6jxndu7h6z5nj2wekhdzjgmqjs8sff0th9rwrpr8vemmzzwjpzxr8acc0zy6qtrtm5mxr55994lf3yvvse7fqn5cx4d5e757pr5ef84gqee4zftvz0khd6p5fhycu4dq23anqaf2zqg4r78gsksqrazjv9cu69zy856c2zzxwrhwr0cvpmmw4wwv24k0g2gxgyz7vmgykrky7qr9vdz5846ttzqe8u69x592qge62d829mdctj6n78d69sqqsnmyga5uapeemdafx9eeyvz9dvqnt6wpq05y34j4t98299rawq5l4ntq627j4yfqpehlhptrwz7sp7azv8ccme49f4jsheyrrlrhz92pg05n8jum9vmush4tgjmqfzvlq73zdeqtwq39caymev9fph5q7tnkxzhvamsawf920wpm2j3wjmzj6flmdatsrafv49ecvayqllgw5ewa6q5qmgev0dlqj4q9f9fd5nsk2tdheemfu5q263c6l33hp5qtdqqk2pvv2pgykgfeja9jaras5nn99crgr6ml3txkhupgvdt5wq8m5e6n9nug94s2vk7n94lzvfckx0wwppk4qu0gzsm4qt3k33lcqj5tmnl3q9uqgnalv8khevzj4mc407djg354h83l268ez3srs7msyqcqqqqqqqqqqz8rpjusfgacvxy57fp7gdl0zzq6nx9vngk8gs8agzgwn9unfz3l6qjhlplv2m0cyyerkzqwggj2uqqqsz77227930nz42pqzgy2yswhg8gtm9pmthzgwwvaypldcf8htshdk2hdrc9khg0t3ack7w6mxrccqq0sk8peulmynzmgpgget9nk550my2xghcgvky38yvehvnug0nujqmarmfscxhv7ufe57zmmd0hltgjutvxul6h9w4vrc7xdwzacf4vuk9lnpel8f2zzzehtpcjrfe2j4qgq6dxp86"},"fee":{"transition":{"id":"au1fqj82g5jv634u7n26sfhaxt8l3mu3xtfr5ckjzalcxjea59spyrsjtv4df","program":"credits.aleo","function":"fee_public","inputs":[{"type":"public","id":"4464335723639983441508729868989074437397473095394397238558544450545281469850field","value":"630000u64"},{"type":"public","id":"4593098581816100095921963904460596032165258641926577757516335497101534850645field","value":"0u64"},{"type":"public","id":"3473614208316204867432743642227376934225333813328654920904132357393672145691field","value":"2913580353651766435747004463510781266027122158876771638694423253450141410345field"}],"outputs":[{"type":"future","id":"7731180983503047088842782163132996133548019697287311888665366470282090534473field","value":"{\n  program_id: credits.aleo,\n  function_name: fee_public,\n  arguments: [\n    aleo1alc5gk6kq090zevzqk2mvj66kmxlm72rcdt37gxcqk6afzw4rcqqnr7n87,\n    630000u64\n  ]\n}"}],"tpk":"5911825129217894734636893098660770604351304282209536867767279006937031101483group","tcm":"5077527259798729371944169448009662571818476272156975078700118785935049050050field","scm":"434518673554076974960205781720600548275349469360652864545249003120707365890field"},"global_state_root":"sr132vxmzlu2j0tg20k0qj9f6ty2ey5hd26kstuh6s0tn37t0eq9cfq5hht86","proof":"proof1qyqsqqqqqqqqqqqpqqqqqqqqqqqv4cterplnl05lr9qvkfl69p996n8qk8vq4y906whraf0tx3rwvgtxr4tpdxsypmtv2ru4uqzzw3upqym4u095ez2r6zg7ncp266jv670gcfdy4y5qzfz9z6nytz39auaq89qe7fzujwvpwnqnrqwqd4cykqwwsj0d9m9mzapsaauj76seyetlp9ufc96la8uaa0afzhsxh4wsu7q5v2xfawd88h7js0v9g30apqq54585yecu5w4zpysk5veup8nnfnkhphs9e4unlesnumsndda93kdc5d0erdvqdkmryhzpp9vv6pqq2npmsfl4nrs3kxpu6af8z844w9dn7v2juwhdhts2g72ta34htdznuyqau542eh0jd4ltdghmjk0cz49vka96nu6zyrx95whwrv74j4grtzz5xwgfvkcndt43077z28777pkpaedh5nuk3x3gzj97pgttqxlm69nu0xjy2jts9mejx4adjyzgy79gcq9zu3jhtv6xwyxngmszz5xv925a25v3gjg044nxqsdw4q8c0c6mqajwy8zm7y7gqhz2fvx5hq7nlk6uvnxn786hztecq9up5mjjuhpt3m39hwzm5rv0q6lv42qskjm76wvtf2rh6sscfhvxcv39myctta85tm3thxndflalaja5svmgw5083l4tlufqv7ynpyxe6vgqf0s6kusaw8lhxv64vc25f4hyrwsh6ttettxwyvual6jsn8r7nvrnapfrnvywesuz4h7a85tj27xvv5vc5mpcwwfy59grsj2ur5w6yq9yggj0tw9k9p354sdhf2qjt2ykcenfy8xaacu7yuvu9p3ppetxzzh0m2s9y6rz7a04txqgwumcuzuhmfqzm7ttrckuk0ypwsryy0gqpcry47wntc6qe5u7nx8wa8plaevlqrfhemy9274cj4n5pzdh5kssdxl5r47jwa66q3mxms5ney206em43nqjax6uvf2vghup7lrm95q90p2awhssx0ng6vl4cv0ydg6xa2r3x87s87swduj5plra6e07xptt9wapgujg3sp067p88w2kgsr40e4w6jrh4444k4zt923grxf7pecaqzpnn43ky07glcws4qs2lxp72767p696hm4ywmvrquze8fhqne5xc6e98vsenu0ce60kqf2c5mzxra64dj2cypeh2s0nxs7a3wcxqvqqqqqqqqqqqad07yaa82dyd7pw9r88832l95xpgapp05mkmgt4kj5fnxa5t9na73dttv8d542dyk99uzqt9e03qqqzewq7u6yz5kmxp8ap4jvwqh0cndpy7un7u2ktse0ypqcrf6ltlrdapc8d70sf5e22gly69ly6a9sqqxuajfw26r92ejn92njz834frv8zz09k7raw4wajxuy52t9qlersxmnwvnup5afv3zl0lnljf2xxvuwsjaaypm0k0um9s6fk4s8n4kfn5l0wqus7whmav6k9tt6cgv68syqq5kf8zr"}}"#;
    const TRANSACTION_ID: &str = "at16gn574xqj5svyzeqxv25g93phr6rn7exzt75lxz94702rup23gfqu3sjsc";
    const TRANSACTION_STRING: &str = r#"{"type":"execute","id":"at16gn574xqj5svyzeqxv25g93phr6rn7exzt75lxz94702rup23gfqu3sjsc","execution":{"transitions":[{"id":"au1xkthsz95cfzf5dpm35j8rfmqh7d55n5qaj32h04zuk94hgs9ysqqwd5y0t","program":"credits.aleo","function":"transfer_public","inputs":[{"type":"public","id":"4751135245718319934677221244600857477393936843410399077399851644790898074286field","value":"aleo1nde82xqshcyjq2r3qjel7pphk3zfs928w5dqhuc6g2ywquef7srsmrpjgr"},{"type":"public","id":"1879683531456735826402444579986765299787803396630464445477045553705002014280field","value":"925201u64"}],"outputs":[{"type":"future","id":"2994313978289013878278992580863624909125270283430786031571774165789697880797field","value":"{\n  program_id: credits.aleo,\n  function_name: transfer_public,\n  arguments: [\n    aleo12zlythl7htjdtjjjz3ahdj4vl6wk3zuzm37s80l86qpx8fyx95fqnxcn2f,\n    aleo1nde82xqshcyjq2r3qjel7pphk3zfs928w5dqhuc6g2ywquef7srsmrpjgr,\n    925201u64\n  ]\n}"}],"tpk":"8419054782389922523785643599671399767271074354181851447409278470077027626643group","tcm":"6974764911181620995275580693649999038426099390529716278259719011415424425408field","scm":"5706857385070162410502976527403449803156980745820557401650769519800215382444field"}],"global_state_root":"sr1cxx6uf72kla7hzu65m394fljpup39h3efe97xsn2wm2gl9apjgyqdr94ud","proof":"proof1qyqsqqqqqqqqqqqpqqqqqqqqqqqvs2nmr0pnyufteq8wtf080x3vwfh5yk08d6pjmedl8j7gx6a42das2ul7rm9x6wn5tvars43nudvqq9gshva80utleuytjesa4vmkq4cv6kfcm6axn2pwf7klzk402gf9qn5t0ssz3mut0ycjcjwss4e76qrh46q8r8calfmrwmpmwj2j063rsgtvq4v85v8gzlyyy233f90pztncnx9pr65l28vuqwx86n0p2xqws3lw0a2qs4smanr5eq78rgn2t2vtvnfu07589676v86kjxdfc6nqdvmghjvc25zzh7qwj2jxmk5qtu5ecxd8mpx00mjs4q2sen68w57zk6c3e7xnm7jeelrqhuexaae9n8v9ddagrl27wwn8zg8vwv9srrar48d0aqslsmzt6lqnxq2mwn0y89zxtrsfs8uzphrc3geu9y5pn2m90k45s5cqt4ypw8rqea53qprslzcs0xpuhc6gc59lfxk0fz49wj70pxe4wczpnxcendf6f7ep49svrsamw2nn39y02dt3l85ztqr09hcxd6h9382cq2s3j890g6ezu2lktszy278dxhuxj47qmmjs2m2p78ud9s3m7pkrusrqwj65f6qv4h0spx0jsrs0vcyapz868egt4g6jf9zwmdkfn5d4966234td44gzcvzwghl2tcxxpl0vt70366upqd7se7pf8vmlvujalgwglgzu2tnrp474nmuvewflrd6eg8j6usg5c6l5vydrkjav4lqx8n4d83nre9qex57ut3nunlyccedx3npxuqzu4fk6293yxxd0sd05jrtxkjpckqrvaaxnng22j9dxnlrvxm24ql5880tdnd8mwsmhz9hf4tnwlrl65xu2x9tuqz5c4nsha95hqlksj3mapzmc5672md4hckakxfpt28znt0st8p3xwt05a3usl3remvc9e5ng8quakjgax4aquczfqvdxzwstm8et5tgdptkt84wnklwn5c8cy93ezx7rh4jve5dn2t8zcn32vph0d8sx583j6uqz6sg8mjs6upgdsf47d6ageygydpve89p3tsshx5vt98jzet9hnkfacky5hpxgqlgnm0dvchgylg3prq05gq7kzdu8narls66gg7nxml0hzqsrh0lqez38m40dzt9zzg985frap8m43ehfk5z9lpsazc7jx0fyp2qcrncdqvqqqqqqqqqqqkfq8j9ez9zl7gycv3wzsjez8amk3lkrptn62v0xp805dmckhl38k3hn0vc5v54wre6m0n8mcvz3qyq2fchjxd29juplmjywlrfz83zkq2ev6mxryx5dz43tcwneamnpa5m6ezycmqed4dsfrm342e3693qqq8gj3sheypdtugcnxfuvw5pqn5glpxc8hy8efn8z366lm6l46luqpfn0c6cv8jnfkqg8x0djhm97ex4w43ljp2q3p48puy5qg7plrl3082j669dptpvp62h8wrmvl4ggsyqqxqxmd4"},"fee":{"transition":{"id":"au16g35t6kzca6xuussmuzgj66lauha7zhelnzwffjn7yu6drxjeypsn4krsj","program":"credits.aleo","function":"fee_public","inputs":[{"type":"public","id":"3177838991993329157371463969436206958196792727562912766690990977845094638574field","value":"51060u64"},{"type":"public","id":"2627337663134718050564293263748856215620738953487067677249260721057439613985field","value":"0u64"},{"type":"public","id":"134393209519715768094240338334285854725427616329679089213660428639338330639field","value":"4485998228444633245424449325268791226620568930423610568011053349827561756688field"}],"outputs":[{"type":"future","id":"5836606895323199242961194308370430847063995678474974835973924196936593737068field","value":"{\n  program_id: credits.aleo,\n  function_name: fee_public,\n  arguments: [\n    aleo12zlythl7htjdtjjjz3ahdj4vl6wk3zuzm37s80l86qpx8fyx95fqnxcn2f,\n    51060u64\n  ]\n}"}],"tpk":"5133974047416696841315369281389544483681028470433387841583387079449986330429group","tcm":"795609109724429421407275371955802534344227027480936262614604311690962025301field","scm":"3903849113674739385296398736730232388289952783409244858026975082444581569623field"},"global_state_root":"sr1cxx6uf72kla7hzu65m394fljpup39h3efe97xsn2wm2gl9apjgyqdr94ud","proof":"proof1qyqsqqqqqqqqqqqpqqqqqqqqqqqzlgwysc4ejcm695fnp8sc8akg23s5vkkqx80mp75q5trcc3rhasdnutvds5q5c9hpz8fy9k4z78upq9t8de7kznvtlfyzskqj3llaulq3t8ftglvrum67997m0su5gxe2cuxeqq7hfhfz00g223faxdzsgqwluw3czl4uyd5rt8505zm7c66tepzl97aytt968cwp0uhdlre6zhzz9kvp90d65r060n5h0n9nfsqs8tzc2nku5rtlz06vzze2e5rv2csj8l54jv8j54llan7gk84r9ar2azddr83hutd23yqz6u0wxlcpkrl6lppnca383fzgcwf532qnzsm4h7f5qvs2yv8gw07gtflfexmwhpg35prpfus0v9ajx50dwhnqqqn5k3cvx404ad8r35g97tps7z63rfdw8m6xynerct3t6nrc9l2kt4nc0eg3lw5vf4nxagygauk7qrt4gztxfuxgc5v5a3y6x3r22nzdwhx3p6y6my5w09r77ay3yv7lgxuvjh9zlv3ept5def0yu3z6eqv7ve3pr52xnhs5zrzdnnkagdhd6eljfpwvpqauupn4qqydswnfz0k4ktjng0xacpvp8jqv0rsyqjqfxfyn6fask9v8ax5dsr2a3az927aq5xmdg6p7xdjlen56gvaq07ne6gga2tsn6p9mzz2s72t5qlqpmrj2ntzqqv3psxs9f9k56vrt6qqxga72zzxanzaer04ncd0rnyxp9d5tt7nucf0284ssrdpdasade92u90u48mg6cxsetmf989xkvppv5aw5xecha00eegnz5u2jllyvps90vxf6dmjy6aftt4837up7qsccahs0gaeal3smnweqv29v82e9tss4evw46m3hccltmy2c24fq8dlgah06x4e8apewle5wtqvjrrvq30m8qsdhg2w6zwjktg2m22crru2wkukwy3rvgjmvyhz25y2v2l2ughz8v6w0vujvz8qu99wl0ugy9hgac8h9mz9j0nkt9t9sswa8ejucjvpe2t8v8psa3sg0wqnaxz4qmmqa00a97muulvgc8943nfmae2n5hlajgknuclm9rxvtrnutq7xtvu3pkkpuexdq907gndl3w5hy06puj6k4j4df63csswpwdlrq2dsut769f92v2qenkjwt6smwjxxzytvddz6vq3f7xnd47nsdgcc0qvqqqqqqqqqqphm8uwgdxz4vk0w5zpk646czf7jel0mq58d7kurvzuevwqk9uzzn3z8nd4mdf2hud65246my9j9asqq0q3a5qz6h0nyp9pcj6nfm0jx09k3jkcdtgsrryxpjldmyac9esg3fu33k72hu3n3l9ya7cg55clyqqy04gnxsq467zzf8s33k223jmefvsxxlangscwk29w9fanatgfksvzcr537fq7yvs3cgyq9gcrrw9jtwuk0dkwmqwprgvzplrfaf468x9l3u5l8m7hgmuyu5a987wkkhqqqqm4vu8k"}}"#;

    #[wasm_bindgen_test]
    fn test_transaction_string_constructor_and_accessor_methods() {
        let transaction = Transaction::from_string(TRANSACTION_STRING).unwrap();
        let transaction_id = transaction.id();
        let transaction_type = transaction.transaction_type();
        let recovered_string = transaction.to_string();
        assert_eq!(transaction_id, TRANSACTION_ID);
        assert_eq!(transaction_type, "execute");
        assert_eq!(recovered_string, TRANSACTION_STRING);

        // Test to and from round trip
        let transaction_native = TransactionNative::from_str(TRANSACTION_STRING).unwrap();
        let transaction_deconstruction = TransactionNative::from(transaction.clone());
        assert_eq!(transaction_native, transaction_deconstruction);
        let transaction_from_native = Transaction::from(transaction_native);
        assert_eq!(transaction, transaction_from_native);
    }

    #[wasm_bindgen_test]
    fn test_byte_serialization_roundtrip() {
        let transaction = Transaction::from_string(TRANSACTION_STRING).unwrap();
        let bytes = transaction.to_bytes_le().unwrap();
        let recovered_transaction = Transaction::from_bytes_le(bytes).unwrap();
        assert_eq!(transaction, recovered_transaction);
    }

    #[wasm_bindgen_test]
    fn test_informational_method_correctness() {
        let deployment_transaction = Transaction::from_string(DEPLOYMENT_TRANSACTION_STRING).unwrap();
        let execution_transaction = Transaction::from_string(TRANSACTION_STRING).unwrap();

        // Ensure transaction types are correctly identified.
        assert_eq!(deployment_transaction.transaction_type(), "deploy");
        assert!(deployment_transaction.is_deploy());
        assert!(!(deployment_transaction.is_execute() || deployment_transaction.is_fee()));

        assert_eq!(execution_transaction.transaction_type(), "execute");
        assert!(execution_transaction.is_execute());
        assert!(!(execution_transaction.is_deploy() || execution_transaction.is_fee()));
    }

    #[wasm_bindgen_test]
    fn test_transaction_summary_provides_expected_values() {
        let transaction = Transaction::from_string(TRANSACTION_STRING).unwrap();
        let summary = transaction.summary(true);
        let transaction_id = Reflect::get(&summary, &JsValue::from_str("id")).unwrap().as_string().unwrap();
        assert_eq!(transaction_id, TRANSACTION_ID);
        let transaction_type = Reflect::get(&summary, &JsValue::from_str("type")).unwrap().as_string().unwrap();
        assert_eq!(transaction_type, "execute");
        assert!(Reflect::get(&summary, &JsValue::from_str("baseFee")).unwrap().is_bigint());
        assert!(Reflect::get(&summary, &JsValue::from_str("fee")).unwrap().is_bigint());
        assert!(Reflect::get(&summary, &JsValue::from_str("priorityFee")).unwrap().is_bigint());

        // Get the transitions.
        let transitions = Array::from(&Reflect::get(&summary, &JsValue::from_str("transitions")).unwrap()).to_vec();
        assert_eq!(transitions.len(), 2);

        // Check the transfer_public transition.
        let transition = Object::from(transitions[0].clone());
        assert_eq!(
            Reflect::get(&transition, &JsValue::from_str("program")).unwrap().as_string().unwrap(),
            "credits.aleo"
        );
        assert_eq!(
            Reflect::get(&transition, &JsValue::from_str("function")).unwrap().as_string().unwrap(),
            "transfer_public"
        );
        assert_eq!(
            Reflect::get(&transition, &JsValue::from_str("tpk")).unwrap().as_string().unwrap(),
            "8419054782389922523785643599671399767271074354181851447409278470077027626643group"
        );
        assert_eq!(
            Reflect::get(&transition, &JsValue::from_str("tcm")).unwrap().as_string().unwrap(),
            "6974764911181620995275580693649999038426099390529716278259719011415424425408field"
        );
        assert_eq!(
            Reflect::get(&transition, &JsValue::from_str("scm")).unwrap().as_string().unwrap(),
            "5706857385070162410502976527403449803156980745820557401650769519800215382444field"
        );

        // Check inputs.
        let inputs = Array::from(&Reflect::get(&transition, &JsValue::from_str("inputs")).unwrap()).to_vec();
        assert_eq!(inputs.len(), 2);
        assert_eq!(Reflect::get(&inputs[0], &JsValue::from_str("type")).unwrap().as_string().unwrap(), "public");
        assert_eq!(
            Reflect::get(&inputs[0], &JsValue::from_str("id")).unwrap().as_string().unwrap(),
            "4751135245718319934677221244600857477393936843410399077399851644790898074286field"
        );
        assert_eq!(
            Reflect::get(&inputs[0], &JsValue::from_str("value")).unwrap().as_string().unwrap(),
            "aleo1nde82xqshcyjq2r3qjel7pphk3zfs928w5dqhuc6g2ywquef7srsmrpjgr"
        );
        assert_eq!(Reflect::get(&inputs[1], &JsValue::from_str("type")).unwrap().as_string().unwrap(), "public");
        assert_eq!(
            Reflect::get(&inputs[1], &JsValue::from_str("id")).unwrap().as_string().unwrap(),
            "1879683531456735826402444579986765299787803396630464445477045553705002014280field"
        );
        assert!(Reflect::get(&inputs[1], &JsValue::from_str("value")).unwrap().is_bigint());

        // Check outputs and future arguments.
        let outputs = Array::from(&Reflect::get(&transition, &JsValue::from_str("outputs")).unwrap()).to_vec();
        let output = Object::from(outputs[0].clone());

        // Check transfer_public output.
        assert_eq!(outputs.len(), 1);
        assert_eq!(Reflect::get(&output, &JsValue::from_str("type")).unwrap().as_string().unwrap(), "future");
        assert_eq!(
            Reflect::get(&output, &JsValue::from_str("program")).unwrap().as_string().unwrap(),
            "credits.aleo"
        );
        assert_eq!(
            Reflect::get(&output, &JsValue::from_str("function")).unwrap().as_string().unwrap(),
            "transfer_public"
        );

        // Check the future arguments.
        let future_arguments = Array::from(&Reflect::get(&output, &JsValue::from_str("arguments")).unwrap()).to_vec();
        assert_eq!(future_arguments.len(), 3);
        assert_eq!(
            future_arguments[0].as_string().unwrap(),
            "aleo12zlythl7htjdtjjjz3ahdj4vl6wk3zuzm37s80l86qpx8fyx95fqnxcn2f"
        );
        assert_eq!(
            future_arguments[1].as_string().unwrap(),
            "aleo1nde82xqshcyjq2r3qjel7pphk3zfs928w5dqhuc6g2ywquef7srsmrpjgr"
        );
        assert!(future_arguments[2].is_bigint());

        // Check fee_public transition.
        let transition = Object::from(transitions[1].clone());
        assert_eq!(
            Reflect::get(&transition, &JsValue::from_str("program")).unwrap().as_string().unwrap(),
            "credits.aleo"
        );
        assert_eq!(
            Reflect::get(&transition, &JsValue::from_str("function")).unwrap().as_string().unwrap(),
            "fee_public"
        );
        assert_eq!(
            Reflect::get(&transition, &JsValue::from_str("tpk")).unwrap().as_string().unwrap(),
            "5133974047416696841315369281389544483681028470433387841583387079449986330429group"
        );
        assert_eq!(
            Reflect::get(&transition, &JsValue::from_str("tcm")).unwrap().as_string().unwrap(),
            "795609109724429421407275371955802534344227027480936262614604311690962025301field"
        );
        assert_eq!(
            Reflect::get(&transition, &JsValue::from_str("scm")).unwrap().as_string().unwrap(),
            "3903849113674739385296398736730232388289952783409244858026975082444581569623field"
        );

        // Check inputs.
        let inputs = Array::from(&Reflect::get(&transition, &JsValue::from_str("inputs")).unwrap()).to_vec();
        assert_eq!(inputs.len(), 3);
        assert!(Reflect::get(&inputs[0], &JsValue::from_str("value")).unwrap().is_bigint());
        assert!(Reflect::get(&inputs[1], &JsValue::from_str("value")).unwrap().is_bigint());
        assert_eq!(
            Reflect::get(&inputs[2], &JsValue::from_str("value")).unwrap().as_string().unwrap(),
            "4485998228444633245424449325268791226620568930423610568011053349827561756688field"
        );

        // Check outputs and future arguments.
        let outputs = Array::from(&Reflect::get(&transition, &JsValue::from_str("outputs")).unwrap()).to_vec();
        let output = Object::from(outputs[0].clone());

        // Check fee_public output.
        assert_eq!(outputs.len(), 1);
        assert_eq!(Reflect::get(&output, &JsValue::from_str("type")).unwrap().as_string().unwrap(), "future");
        assert_eq!(
            Reflect::get(&output, &JsValue::from_str("program")).unwrap().as_string().unwrap(),
            "credits.aleo"
        );
        assert_eq!(
            Reflect::get(&output, &JsValue::from_str("function")).unwrap().as_string().unwrap(),
            "fee_public"
        );

        // Check the future arguments.
        let future_arguments = Array::from(&Reflect::get(&output, &JsValue::from_str("arguments")).unwrap()).to_vec();
        assert_eq!(future_arguments.len(), 2);
        assert_eq!(
            future_arguments[0].as_string().unwrap(),
            "aleo12zlythl7htjdtjjjz3ahdj4vl6wk3zuzm37s80l86qpx8fyx95fqnxcn2f"
        );
        assert!(future_arguments[1].is_bigint());
    }

    #[wasm_bindgen_test]
    fn test_record_methods() {
        // Create a random private key and view key.
        let private_key = PrivateKey::new();
        let view_key = ViewKey::from_private_key(&private_key);

        // Get a transaction with records.
        let transaction = Transaction::from_string(PRIVATE_TRANSACTION_STRING).unwrap();

        // Get both all records, and attempt to get owned records with a random view key.
        let records = transaction.records();
        let owned_records = transaction.owned_records(&view_key);
        // Ensure the correct amount of records were found and no owned records are found.
        assert_eq!(owned_records.length(), 0);
        assert_eq!(records.length(), 8);

        // Attempt to find a non-existent commitments and serial numbers.
        let random = Field::random();
        let record = transaction.find_record(&random);
        let contains_commitment = transaction.contains_commitment(&random);
        let contains_serial_number = transaction.contains_serial_number(&random);
        assert!(record.is_none());
        assert!(!contains_commitment);
        assert!(!contains_serial_number);

        // Attempt to find an existing commitment and serial number.
        let commitment =
            Field::from_str("3771264214823666953346974490700157125043441681812666085949968314967709800215field")
                .unwrap();
        let serial_number =
            Field::from_str("780585721101033968543684654771473636769436273965503504834193318384750303851field")
                .unwrap();
        let record = transaction.find_record(&commitment);
        let contains_commitment = transaction.contains_commitment(&commitment);
        let contains_serial_number = transaction.contains_serial_number(&serial_number);
        assert!(record.is_some());
        assert!(contains_commitment);
        assert!(contains_serial_number);
    }
}
