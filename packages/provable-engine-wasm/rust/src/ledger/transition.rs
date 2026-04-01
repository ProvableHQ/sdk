// Copyright (C) 2019-2025 Provable Inc.
// This file is part of the Provable SDK library.

// The Provable SDK library is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// The Provable SDK library is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with the Provable SDK library. If not, see <https://www.gnu.org/licenses/>.

use crate::{
    Field,
    Group,
    RecordCiphertext,
    RecordPlaintext,
    ViewKey,
    input_to_js_value,
    object,
    output_to_js_value,
    types::native::{CurrentNetwork, FieldNative, InputNative, OutputNative, TransitionNative, U16Native},
};
use snarkvm_console::{
    prelude::{FromBytes, Network, ToBytes},
    program::compute_function_id,
};

use js_sys::{Array, Uint8Array};
use std::{ops::Deref, str::FromStr};
use wasm_bindgen::{JsValue, prelude::wasm_bindgen};

#[wasm_bindgen]
pub struct Transition(TransitionNative);

#[wasm_bindgen]
impl Transition {
    /// Get the transition ID
    ///
    /// @returns {string} The transition ID
    pub fn id(&self) -> String {
        self.0.id().to_string()
    }

    /// Create a transition from a string
    ///
    /// @param {string} transition String representation of a transition
    /// @returns {Transition}
    #[wasm_bindgen(js_name = fromString)]
    pub fn from_string(transition: &str) -> Result<Transition, String> {
        Transition::from_str(transition)
    }

    /// Create a transition from a Uint8Array of left endian bytes.
    ///
    /// @param {Uint8Array} Uint8Array of left endian bytes encoding a Transition.
    /// @returns {Transition}
    #[wasm_bindgen(js_name = fromBytesLe)]
    pub fn from_bytes_le(bytes: Uint8Array) -> Result<Transition, String> {
        let bytes = bytes.to_vec();
        let transition = TransitionNative::from_bytes_le(&bytes).map_err(|e| e.to_string())?;
        Ok(Transition(transition))
    }

    /// Get the transition as a string. If you want to submit this transition to the Aleo Network
    /// this function will create the string that should be submitted in the `POST` data.
    ///
    /// @returns {string} String representation of the transition
    #[wasm_bindgen(js_name = toString)]
    #[allow(clippy::inherent_to_string)]
    pub fn to_string(&self) -> String {
        self.0.to_string()
    }

    /// Get the transition as a Uint8Array of left endian bytes.
    ///
    /// @returns {Uint8Array} Uint8Array representation of the transition
    #[wasm_bindgen(js_name = toBytesLe)]
    pub fn to_bytes_le(&self) -> Result<Uint8Array, String> {
        let bytes = self.0.to_bytes_le().map_err(|e| e.to_string())?;
        Ok(Uint8Array::from(bytes.as_slice()))
    }

    #[wasm_bindgen(js_name = programId)]
    /// Get the program ID of the transition.
    pub fn program_id(&self) -> String {
        self.0.program_id().to_string()
    }

    #[wasm_bindgen(js_name = functionName)]
    /// Get the function name of the transition.
    pub fn function_name(&self) -> String {
        self.0.function_name().to_string()
    }

    /// Returns true if the transition contains the given commitment.
    ///
    /// @param {boolean} True if the transition contains the given commitment.
    #[wasm_bindgen(js_name = containsCommitment)]
    pub fn contains_commitment(&self, commitment: &Field) -> bool {
        self.0.contains_commitment(commitment)
    }

    /// Check if the transition contains a serial number.
    ///
    /// @param {Field} serial_number The serial number to check for
    ///
    /// @returns {bool} True if the transition contains a serial number, false otherwise
    #[wasm_bindgen(js_name = containsSerialNumber)]
    pub fn contains_serial_number(&self, serial_number: &Field) -> bool {
        self.0.contains_serial_number(serial_number)
    }

    /// Find a record in the transition by the record's commitment.
    #[wasm_bindgen(js_name = findRecord)]
    pub fn find_record(&self, commitment: &Field) -> Option<RecordCiphertext> {
        self.0.find_record(commitment).map(RecordCiphertext::from)
    }

    /// Get the record plaintext present in a transition owned by a specific view key.
    ///
    /// @param {ViewKey} view_key The view key of the record owner.
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

    /// Get the records present in a transition and their commitments.
    ///
    /// @returns {Array<{commitment: Field, record: RecordCiphertext}>} Array of record ciphertext objects
    pub fn records(&self) -> Array {
        self.0
            .records()
            .map(|(commitment, record_ciphertext)| {
                object! {
                    "commitment" : Field::from(commitment),
                    "record" : RecordCiphertext::from(record_ciphertext),
                }
            })
            .collect::<Array>()
    }

    /// Get the inputs of the transition.
    ///
    /// @param {bool} convert_to_js If true the inputs will be converted to JS objects, if false
    /// the inputs will be in wasm format.
    ///
    /// @returns {Array} Array of inputs
    pub fn inputs(&self, convert_to_js: bool) -> Array {
        self.0.inputs().iter().map(|input| input_to_js_value(input, convert_to_js)).collect::<Array>()
    }

    /// Get the outputs of the transition.
    ///
    /// @param {bool} convert_to_js If true the outputs will be converted to JS objects, if false
    /// the outputs will be in wasm format.
    ///
    /// @returns {Array} Array of outputs
    pub fn outputs(&self, convert_to_js: bool) -> Array {
        self.0.outputs().iter().map(|output| output_to_js_value(output, convert_to_js)).collect::<Array>()
    }

    /// Get the transition public key of the transition.
    ///
    /// @returns {Group} Transition public key
    pub fn tpk(&self) -> Group {
        Group::from(self.0.tpk())
    }

    /// Get the transition view key of the transition.
    ///
    /// @param {ViewKey} view_key The view key of the transition signer.
    ///
    /// @returns {Field} Transition view key
    pub fn tvk(&self, view_key: &ViewKey) -> Field {
        let tpk = self.tpk();
        tpk.scalar_multiply(&view_key.to_scalar()).to_x_coordinate()
    }

    /// Get the transition commitment of the transition.
    ///
    /// @returns {Field} Transition commitment
    pub fn tcm(&self) -> Field {
        Field::from(self.0.tcm())
    }

    /// Get the transition signer commitment of the transition.
    ///
    /// @returns {Field} Transition signer commitment
    pub fn scm(&self) -> Field {
        Field::from(self.0.scm())
    }

    /// Decrypt the transition using the transition view key.
    ///
    /// @param {Field} tvk The transition view key.
    ///
    /// @returns {Transition} The transition with public values for inputs and outputs.
    #[wasm_bindgen(js_name = decryptTransition)]
    pub fn decrypt_transition(&self, tvk: &Field) -> Result<Self, String> {
        let function_id =
            compute_function_id(&U16Native::new(CurrentNetwork::ID), self.0.program_id(), self.0.function_name())
                .map_err(|e| e.to_string())?;

        // Create a vector that will be populated with decrypted private inputs and
        // non-private inputs.
        let mut decrypted_inputs = Vec::with_capacity(self.0.inputs().len());

        // Iterate over the inputs and decrypt if they are private.  Non-private inputs
        // such as public inputs and records are copied and added to the inputs vector.
        for (index, input) in self.0.inputs().iter().enumerate() {
            decrypted_inputs.push(match input {
                InputNative::Private(input_id, Some(ciphertext)) => {
                    let index_field = FieldNative::from_u16(index as u16);
                    let input_view_key = CurrentNetwork::hash_psd4(&[function_id, **tvk, index_field])
                        .map_err(|_| "Could not create input view key".to_string())?;
                    let plaintext = ciphertext.decrypt_symmetric(input_view_key).map_err(|e| e.to_string())?;
                    InputNative::Public(*input_id, Some(plaintext))
                }
                _ => input.clone(),
            });
        }

        let outputs = self.0.outputs();
        let num_inputs = self.0.inputs().len();

        // Create a vector that will be populated with decrypted private outputs and
        // non-private outputs.
        let mut decrypted_outputs = Vec::with_capacity(outputs.len());

        // Iterate over the outputs and decrypt if they are private.  Non-private outputs
        // are copied and added to the outputs vector.
        for (index, output) in outputs.iter().enumerate() {
            decrypted_outputs.push(match output {
                OutputNative::Private(output_id, Some(ciphertext)) => {
                    let index_field = FieldNative::from_u16((num_inputs + index) as u16);
                    let output_view_key = CurrentNetwork::hash_psd4(&[function_id, **tvk, index_field])
                        .map_err(|_| "Could not create output view key".to_string())?;
                    let plaintext = ciphertext.decrypt_symmetric(output_view_key).map_err(|e| e.to_string())?;
                    OutputNative::Public(*output_id, Some(plaintext))
                }
                _ => output.clone(),
            });
        }

        // The Transition struct is reconstructed with the decrypted inputs and outputs.
        Ok(Self(
            TransitionNative::new(
                *self.0.program_id(),
                *self.0.function_name(),
                decrypted_inputs,
                decrypted_outputs,
                *self.0.tpk(),
                *self.0.tcm(),
                *self.0.scm(),
            )
            .map_err(|_| "failed to construct decrypted transition".to_string())?,
        ))
    }
}

impl Deref for Transition {
    type Target = TransitionNative;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl From<TransitionNative> for Transition {
    fn from(transition: TransitionNative) -> Self {
        Self(transition)
    }
}

impl From<Transition> for TransitionNative {
    fn from(transition: Transition) -> Self {
        transition.0
    }
}

impl From<&TransitionNative> for Transition {
    fn from(transition: &TransitionNative) -> Self {
        Self(transition.clone())
    }
}

impl From<&Transition> for TransitionNative {
    fn from(transition: &Transition) -> Self {
        transition.0.clone()
    }
}

impl FromStr for Transition {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        Ok(Self(TransitionNative::from_str(s).map_err(|e| e.to_string())?))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::PrivateKey;

    use js_sys::{Object, Reflect};
    use wasm_bindgen_test::wasm_bindgen_test;

    pub const INPUT_RECORD_SERIAL_NUMBER: &str =
        "4569194627311410524427044648350523511369013276760031398859310110870190258038field";
    pub const INPUT_RECORD_TAG: &str =
        "4584393733726099907383249165298083023636530416018938077800083356406243497342field";
    pub const OUTPUT_CHECKSUM: &str = "17461704767783030875142836237730678349755524657182224909428747180538982740field";
    pub const OUTPUT_RECORD: &str = "record1qyqspwnlv6gfxx05yj7aw7z2dl44gyh06jrvgf42jux0dep33cy7jlsvqsrxzmt0w4h8ggcqqgqsqwdwr889h9fhnyclazs8yt26t6r5ua4qk7yksj7p40rz9846mzgrpp6x76m9de0kjezrqqpqyq9sj8x3qdmz6nal4j470a0wwcray54lffe3ya5u2zlpeq45lg4up3na8gul0vgrn3eced6dka4ax2ja85xzds4pmqf8csrn8ku5cv3qz8m90p6x2unwv9k97ct4w35x7unf0fshg6t0de0hyet3w45hyetyyvqqyqgq8djhghnte2w86qsdjaumy4zcux2fxszm3ej2956af8cpl2w95g9pqct4w35x7unf0fjkghm4de6xjmprqqpqzqxd6c782j0ny65ed2ckzp3vlx7cv8drslasq8kqpdzmjeyzal38qemw38x0axnz5t53fj6ttavh8l4jlfjdryc6mesd4w6uvpmzfsqqjvtu0xd";
    pub const OUTPUT_RECORD_COMMITMENT: &str =
        "3771264214823666953346974490700157125043441681812666085949968314967709800215field";
    pub const TRANSITION: &str = r#"{"id":"au1naeu56spz0x0zct003sa8qgpzndy6nxj8rrcm7n0fehy9llcl5yscflt0k","program":"token_registry.aleo","function":"burn_private","inputs":[{"type":"record","id":"4569194627311410524427044648350523511369013276760031398859310110870190258038field","tag":"4584393733726099907383249165298083023636530416018938077800083356406243497342field"},{"type":"public","id":"4155661860779318196369465902681808025430867777096367712868886959018716227815field","value":"2853086u128"}],"outputs":[{"type":"record","id":"3771264214823666953346974490700157125043441681812666085949968314967709800215field","checksum":"17461704767783030875142836237730678349755524657182224909428747180538982740field","value":"record1qyqspwnlv6gfxx05yj7aw7z2dl44gyh06jrvgf42jux0dep33cy7jlsvqsrxzmt0w4h8ggcqqgqsqwdwr889h9fhnyclazs8yt26t6r5ua4qk7yksj7p40rz9846mzgrpp6x76m9de0kjezrqqpqyq9sj8x3qdmz6nal4j470a0wwcray54lffe3ya5u2zlpeq45lg4up3na8gul0vgrn3eced6dka4ax2ja85xzds4pmqf8csrn8ku5cv3qz8m90p6x2unwv9k97ct4w35x7unf0fshg6t0de0hyet3w45hyetyyvqqyqgq8djhghnte2w86qsdjaumy4zcux2fxszm3ej2956af8cpl2w95g9pqct4w35x7unf0fjkghm4de6xjmprqqpqzqxd6c782j0ny65ed2ckzp3vlx7cv8drslasq8kqpdzmjeyzal38qemw38x0axnz5t53fj6ttavh8l4jlfjdryc6mesd4w6uvpmzfsqqjvtu0xd"},{"type":"future","id":"2177527202823505610844479366424698260670813913152550670302738921219693374616field","value":"{\n  program_id: token_registry.aleo,\n  function_name: burn_private,\n  arguments: [\n    3443843282313283355522573239085696902919850365217539366784739393210722344986field,\n    2853086u128,\n    aleo1tjkv7vquk6yldxz53ecwsy5csnun43rfaknpkjc97v5223dlnyxsglv7nm,\n    5783861720504029593520331872442756678068735468923730684279741068753131773333field\n  ]\n}"}],"tpk":"8426225807947287980879824833030089440060785195861154519084544916641544071836group","tcm":"3226339871444496417979841037237975848011574524309845233165930705339306709897field","scm":"6845182532650964173356391969005331370591444046632036068754797772530920467754field"}"#;
    pub const TEST_PRIVATE_KEY: &str = "APrivateKey1zkp6rE5FSWGD3jxrsAT64aZutFs3w6xvF8uQzGZKJEKsN8j";
    #[allow(dead_code)]
    pub const TRANSITION_TESTNET: &str = r#"{"id":"au1u62jasyx78x9hktak24awyj38fz73aseq8g9cx98u8egd9pj9uxq3u6s2z","program":"hello_hello.aleo","function":"hello","inputs":[{"type":"public","id":"3748790614260807060977840590007893602934308327222309419419577452790958781330field","value":"1u32"},{"type":"private","id":"5954208307642819953251922459490586292095132973876550778604572231610245257004field","value":"ciphertext1qyq0m5mp0d2gzh2pv9p25z70gz2avhqdt3dp8y8thzwf3aq6g35zcqcuyptz3"}],"outputs":[{"type":"private","id":"1557506318887190915592751299113729867877933642317637206076176689093854281418field","value":"ciphertext1qyqzmhw8ln9r6uuyh0n5jrsqlt25wdggqp3d9yqyttpr3g7g00k2sysdf9rmv"}],"tpk":"7532444547840484531569841377269810017844130178606467837628364672670182422388group","tcm":"7292056195970541935877520517416922164990366931599720071937561392936678536563field","scm":"8283770351301010771186520129040704279224805960417079922462917369178354050332field"}"#;
    #[allow(dead_code)]
    pub const TRANSITION_TESTNET_DECRYPTED: &str = r#"{"id":"au1mhdz6jqm973v5vfkz2pwgv63p340c9tpvydxha2zs8w03746qcpqvx3yye","program":"hello_hello.aleo","function":"hello","inputs":[{"type":"public","id":"3748790614260807060977840590007893602934308327222309419419577452790958781330field","value":"1u32"},{"type":"public","id":"5954208307642819953251922459490586292095132973876550778604572231610245257004field","value":"2u32"}],"outputs":[{"type":"public","id":"1557506318887190915592751299113729867877933642317637206076176689093854281418field","value":"3u32"}],"tpk":"7532444547840484531569841377269810017844130178606467837628364672670182422388group","tcm":"7292056195970541935877520517416922164990366931599720071937561392936678536563field","scm":"8283770351301010771186520129040704279224805960417079922462917369178354050332field"}"#;
    #[allow(dead_code)]
    pub const TRANSITION_MAINNET: &str = r#"{"id":"au1mguuz0dh20f78802m4z0py7n08xhl0pz60llzck63mhl8pc8l5xqxpwgtn","program":"hello_hello.aleo","function":"main","inputs":[{"type":"public","id":"6393584049543470937057043098611271993206122889317039351966319038535020834557field","value": "1u32"},{"type":"private","id":"8207446256045172951742235001162005156507562935942883128759030124682934277495field","value":"ciphertext1qyqqgz9qnupeld9vr4vuwp6yrpmhgtkvmgag5m7mmrruw0r6je666qgqdswk3"}],"outputs":[{"type":"private","id":"127469473292952941321346770257126666363371158501875622169294663492714835110field","value":"ciphertext1qyqyapkjuxm9dcslgyjf7hkr2k3dek500z40gjspnwvll0uawj23vzgggc405"}],"tpk":"7647553513996966044119163122930125808381703910407273818947266861843062002251group","tcm":"4479413938380109857414238205380483440836495997450846894155088299187217672609field","scm":"6461007226176477784737642021400489186736987671609840640950580467598882134642field"}"#;
    #[allow(dead_code)]
    pub const TRANSITION_MAINNET_DECRYPTED: &str = r#"{"id":"au1jl2ur42sj7hwe4r0alv6gnklqxj0fszrvu3q82gjcls5x6q9pyzqdgmu2k","program":"hello_hello.aleo","function":"main","inputs":[{"type":"public","id":"6393584049543470937057043098611271993206122889317039351966319038535020834557field","value":"1u32"},{"type":"public","id":"8207446256045172951742235001162005156507562935942883128759030124682934277495field","value":"2u32"}],"outputs":[{"type":"public","id":"127469473292952941321346770257126666363371158501875622169294663492714835110field","value":"3u32"}],"tpk":"7647553513996966044119163122930125808381703910407273818947266861843062002251group","tcm":"4479413938380109857414238205380483440836495997450846894155088299187217672609field","scm":"6461007226176477784737642021400489186736987671609840640950580467598882134642field"}"#;
    pub const PRIVATE_KEY: &str = "APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH";

    #[test]
    fn transition_to_and_from_serialization() {
        let transition = Transition::from_string(TRANSITION).unwrap();
        assert_eq!(transition.to_string(), TRANSITION);

        let bytes = transition.to_bytes_le().unwrap();
        assert!(Transition::from_bytes_le(bytes).is_ok());
    }

    #[wasm_bindgen_test]
    fn test_transition_helpers() {
        // Create a view key from the test private key.
        let private_key = PrivateKey::from_str(TEST_PRIVATE_KEY).unwrap();
        let view_key = ViewKey::from_private_key(&private_key);

        let transition = Transition::from_string(TRANSITION).unwrap();
        assert_eq!(transition.program_id(), "token_registry.aleo");
        assert_eq!(transition.function_name(), "burn_private");
        assert_eq!(
            transition.tpk(),
            Group::from_string("8426225807947287980879824833030089440060785195861154519084544916641544071836group")
                .unwrap()
        );
        assert_eq!(
            transition.tcm(),
            Field::from_string("3226339871444496417979841037237975848011574524309845233165930705339306709897field")
                .unwrap()
        );
        assert_eq!(
            transition.scm(),
            Field::from_string("6845182532650964173356391969005331370591444046632036068754797772530920467754field")
                .unwrap()
        );
        assert_eq!(
            transition.tvk(&view_key),
            Field::from_string("4386935145534748320784836619728244316439880324135120862336274251207085504468field")
                .unwrap()
        )
    }

    #[wasm_bindgen_test]
    fn test_record_methods() {
        // Create a random private key and view key.
        let private_key = PrivateKey::new();
        let view_key = ViewKey::from_private_key(&private_key);

        // Get a transaction with records.
        let transition = Transition::from_string(TRANSITION).unwrap();

        // Get both all records, and attempt to get owned records with a random view key.
        let owned_records = transition.owned_records(&view_key);
        let records = transition.records();
        // Ensure the correct amount of records were found and no owned records are found.
        assert_eq!(owned_records.length(), 0);
        assert_eq!(records.length(), 1);

        // Attempt to find a non-existent commitments and serial numbers.
        let random = Field::random();
        let record = transition.find_record(&random);
        let contains_commitment = transition.contains_commitment(&random);
        let contains_serial_number = transition.contains_serial_number(&random);
        assert!(record.is_none());
        assert!(!contains_commitment);
        assert!(!contains_serial_number);

        // Attempt to find an existing commitment and serial number.
        let commitment =
            Field::from_str("3771264214823666953346974490700157125043441681812666085949968314967709800215field")
                .unwrap();
        let serial_number =
            Field::from_str("4569194627311410524427044648350523511369013276760031398859310110870190258038field")
                .unwrap();
        let record = transition.find_record(&commitment);
        let contains_commitment = transition.contains_commitment(&commitment);
        let contains_serial_number = transition.contains_serial_number(&serial_number);
        assert!(record.is_some());
        assert!(contains_commitment);
        assert!(contains_serial_number);
    }

    #[wasm_bindgen_test]
    fn test_input_correctness() {
        let transition = Transition::from_str(TRANSITION).unwrap();
        let inputs = transition.inputs(true);
        let input_1 = Object::from(inputs.get(0));
        let input_2 = inputs.get(1);

        // Ensure the inputs are correct.
        assert_eq!(inputs.length(), 2);
        assert_eq!(Reflect::get(&input_1, &JsValue::from_str("type")).unwrap().as_string().unwrap(), "record");
        assert_eq!(
            Reflect::get(&input_1, &JsValue::from_str("id")).unwrap().as_string().unwrap(),
            INPUT_RECORD_SERIAL_NUMBER
        );
        assert_eq!(Reflect::get(&input_1, &JsValue::from_str("tag")).unwrap().as_string().unwrap(), INPUT_RECORD_TAG);
        assert_eq!(
            Reflect::get(&input_2, &JsValue::from_str("id")).unwrap().as_string().unwrap(),
            "4155661860779318196369465902681808025430867777096367712868886959018716227815field"
        );
        assert_eq!(Reflect::get(&input_2, &JsValue::from_str("type")).unwrap().as_string().unwrap(), "public");
        assert!(Reflect::get(&input_2, &JsValue::from_str("value")).unwrap().is_bigint());
    }

    #[wasm_bindgen_test]
    fn test_output_correctness() {
        let transition = Transition::from_string(TRANSITION).unwrap();
        let outputs = transition.outputs(true);
        let output_1 = Object::from(outputs.get(0));
        let output_2 = Object::from(outputs.get(1));

        // Ensure the outputs are correct.
        assert_eq!(outputs.length(), 2);

        // Ensure the record output is correct.
        assert_eq!(Reflect::get(&output_1, &JsValue::from_str("type")).unwrap().as_string().unwrap(), "record");
        assert_eq!(
            Reflect::get(&output_1, &JsValue::from_str("id")).unwrap().as_string().unwrap(),
            OUTPUT_RECORD_COMMITMENT
        );
        assert_eq!(
            Reflect::get(&output_1, &JsValue::from_str("checksum")).unwrap().as_string().unwrap(),
            OUTPUT_CHECKSUM
        );
        assert_eq!(Reflect::get(&output_1, &JsValue::from_str("value")).unwrap().as_string().unwrap(), OUTPUT_RECORD);

        // Ensure the future output is correct.
        let arguments = Array::from(&Reflect::get(&output_2, &JsValue::from_str("arguments")).unwrap());

        assert_eq!(Reflect::get(&output_2, &JsValue::from_str("type")).unwrap().as_string().unwrap(), "future");
        assert_eq!(
            Reflect::get(&output_2, &JsValue::from_str("program")).unwrap().as_string().unwrap(),
            "token_registry.aleo"
        );
        assert_eq!(
            Reflect::get(&output_2, &JsValue::from_str("function")).unwrap().as_string().unwrap(),
            "burn_private"
        );

        // Check the future arguments.
        assert_eq!(arguments.length(), 4);
        assert_eq!(
            arguments.get(0).as_string().unwrap(),
            "3443843282313283355522573239085696902919850365217539366784739393210722344986field"
        );
        assert!(arguments.get(1).is_bigint());
        assert_eq!(
            arguments.get(2).as_string().unwrap(),
            "aleo1tjkv7vquk6yldxz53ecwsy5csnun43rfaknpkjc97v5223dlnyxsglv7nm"
        );
        assert_eq!(
            arguments.get(3).as_string().unwrap(),
            "5783861720504029593520331872442756678068735468923730684279741068753131773333field"
        );
    }

    #[wasm_bindgen_test]
    #[cfg(feature = "testnet")]
    fn test_transition_decryption() {
        // Create a view key from the test private key.
        let private_key = PrivateKey::from_str(PRIVATE_KEY).unwrap();
        let view_key = ViewKey::from_private_key(&private_key);

        // Get a transition with records.
        let transition = Transition::from_string(TRANSITION_TESTNET).unwrap();

        // Get the transition view key.
        let tvk = transition.tvk(&view_key);

        // Decrypt the transition using the transition view key.
        let decrypted_transition = transition.decrypt_transition(&tvk).unwrap();

        assert_eq!(decrypted_transition.to_string(), TRANSITION_TESTNET_DECRYPTED);
    }

    #[wasm_bindgen_test]
    #[cfg(feature = "mainnet")]
    fn test_transition_decryption_mainnet() {
        // Create a view key from the test private key.
        let private_key = PrivateKey::from_str(PRIVATE_KEY).unwrap();
        let view_key = ViewKey::from_private_key(&private_key);

        // Get a transition with records.
        let transition = Transition::from_string(TRANSITION_MAINNET).unwrap();

        // Get the transition view key.
        let tvk = transition.tvk(&view_key);

        // Decrypt the transition using the transition view key.
        let decrypted_transition = transition.decrypt_transition(&tvk).unwrap();

        assert_eq!(decrypted_transition.to_string(), TRANSITION_MAINNET_DECRYPTED);
    }

    #[wasm_bindgen_test]
    #[cfg(feature = "testnet")]
    fn test_transition_decrypt_testnet_invalid_vk() {
        // Create a view key from the test private key.
        let private_key = PrivateKey::from_str(TEST_PRIVATE_KEY).unwrap();
        let view_key = ViewKey::from_private_key(&private_key);

        // Get a transition with records.
        let transition = Transition::from_string(TRANSITION_TESTNET).unwrap();

        // Create an invalid transition view key.
        let invalid_tvk = transition.tvk(&view_key);

        // Attempt to decrypt the transition using the invalid transition view key.
        let result = transition.decrypt_transition(&invalid_tvk);
        assert!(result.is_err());
    }

    #[wasm_bindgen_test]
    #[cfg(feature = "mainnet")]
    fn test_transition_decrypt_testnet_invalid_vk() {
        // Create a view key from the test private key.
        let private_key = PrivateKey::from_str(TEST_PRIVATE_KEY).unwrap();
        let view_key = ViewKey::from_private_key(&private_key);

        // Get a transition with records.
        let transition = Transition::from_string(TRANSITION_MAINNET).unwrap();

        // Create an invalid transition view key.
        let invalid_tvk = transition.tvk(&view_key);

        // Attempt to decrypt the transition using the invalid transition view key.
        let result = transition.decrypt_transition(&invalid_tvk);
        assert!(result.is_err());
    }
}
