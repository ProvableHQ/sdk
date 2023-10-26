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

use crate::{Execution, KeyPair, Program, ProvingKey, VerifyingKey,
            types::{CurrentNetwork, ExecutionNative, IdentifierNative, ProcessNative, ProgramIDNative, ProgramNative, ProvingKeyNative, ResponseNative, VerifyingKeyNative}};
use snarkvm_ledger_block::Transition;

use serde::{Deserialize, Serialize};
use wasm_bindgen::{prelude::wasm_bindgen, JsValue};

use core::{fmt::{Debug, Display, Formatter}, str::{FromStr}};

/// Webassembly Representation of an Aleo function execution response
///
/// This object is returned by the execution of an Aleo function off-chain. It provides methods for
/// retrieving the outputs of the function execution.
#[derive(Serialize, Deserialize)]
#[wasm_bindgen]
pub struct ExecutionResponse {
    execution: Option<ExecutionNative>,
    function_id: IdentifierNative,
    #[serde(skip)]
    response: Option<ResponseNative>,
    program: ProgramNative,
    #[serde(skip)]
    proving_key: Option<ProvingKeyNative>,
    verifying_key: VerifyingKeyNative,
}

#[wasm_bindgen]
impl ExecutionResponse {
    pub(crate) fn new(
        execution: Option<ExecutionNative>,
        function_id: &str,
        response: Option<ResponseNative>,
        process: &ProcessNative,
        program: &str,
    ) -> Result<Self, String> {
        let program = ProgramNative::from_str(program).map_err(|e| e.to_string())?;
        let verifying_key = process
            .get_verifying_key(program.id(), function_id)
            .map_err(|_| format!("Could not find verifying key for {:?}/{:?}", program.id(), function_id))?;

        Ok(Self {
            execution,
            response,
            function_id: IdentifierNative::from_str(function_id).map_err(|e| e.to_string())?,
            program,
            proving_key: None,
            verifying_key,
        })
    }

    pub(crate) fn add_proving_key(
        &mut self,
        process: &ProcessNative,
        function_id: &str,
        program_id: &ProgramIDNative,
    ) -> Result<(), String> {
        let proving_key = process
            .get_proving_key(program_id, function_id)
            .map_err(|_| format!("Could not find proving key for {:?}/{:?}", program_id, function_id))?;
        self.proving_key = Some(proving_key);
        Ok(())
    }

    /// Get the outputs of the executed function
    ///
    /// @returns {Array} Array of strings representing the outputs of the function
    #[wasm_bindgen(js_name = "getOutputs")]
    pub fn get_outputs(&self) -> js_sys::Array {
        let array = js_sys::Array::new_with_length(0u32);
        if let Some(response) = &self.response {
            response.outputs().iter().enumerate().for_each(|(i, output)| {
                array.set(i as u32, JsValue::from_str(&output.to_string()));
            });
        } else if let Some(execution) = &self.execution {
            let transition: &Transition<CurrentNetwork> = execution.transitions().last().unwrap();
            transition.outputs().iter().enumerate().for_each(|(i, output)| {
                array.set(i as u32, JsValue::from_str(&output.to_string()));
            });
        };
        array
    }

    /// Returns the execution object if present, null if otherwise.
    ///
    /// @returns {Execution | undefined} The execution object if present, null if otherwise
    #[wasm_bindgen(js_name = "getExecution")]
    pub fn get_execution(&self) -> Option<Execution> {
        self.execution.clone().map(Execution::from)
    }

    /// Returns the program keys if present
    #[wasm_bindgen(js_name = "getKeys")]
    pub fn get_keys(&mut self) -> Result<KeyPair, String> {
        if let Some(proving_key) = self.proving_key.take() {
            Ok(KeyPair::new(ProvingKey::from(proving_key), VerifyingKey::from(self.verifying_key.clone())))
        } else {
            Err("No proving key found".to_string())
        }
    }

    /// Returns the proving_key if the proving key was cached in the Execution response.
    /// Note the proving key is removed from the response object after the first call to this
    /// function. Subsequent calls will return null.
    ///
    /// @returns {ProvingKey | undefined} The proving key
    #[wasm_bindgen(js_name = "getProvingKey")]
    pub fn get_proving_key(&mut self) -> Option<ProvingKey> {
        self.proving_key.take().map(ProvingKey::from)
    }

    /// Returns the verifying_key associated with the program
    ///
    /// @returns {VerifyingKey} The verifying key
    #[wasm_bindgen(js_name = "getVerifyingKey")]
    pub fn get_verifying_key(&self) -> VerifyingKey {
        VerifyingKey::from(self.verifying_key.clone())
    }

    /// Returns the function identifier
    #[wasm_bindgen(js_name = "getFunctionId")]
    pub fn get_function_id(&self) -> String {
        format!("{:?}", self.function_id)
    }

    /// Returns the program
    #[wasm_bindgen(js_name = "getProgram")]
    pub fn get_program(&self) -> Program {
        Program::from(self.program.clone())
    }

    /// Creates an execution response object from a string representation
    #[wasm_bindgen(js_name = "fromString")]
    pub fn from_string(string: &str) -> Result<ExecutionResponse, String> {
        ExecutionResponse::from_str(string).map_err(|e| e.to_string())
    }

    /// Gets a string representation of the execution response
    #[wasm_bindgen(js_name = "toString")]
    pub fn to_string(&self) -> String {
        serde_json::to_string(self).unwrap()
    }
}

impl FromStr for ExecutionResponse {
    type Err = String;

    fn from_str(string: &str) -> Result<Self, Self::Err> {
        serde_json::from_str(string).map_err(|e| e.to_string())
    }
}

impl Debug for ExecutionResponse {
    fn fmt(&self, f: &mut Formatter<'_>) -> core::fmt::Result {
        Display::fmt(self, f)
    }
}

impl Display for ExecutionResponse {
    fn fmt(&self, f: &mut Formatter<'_>) -> core::fmt::Result {
        write!(f, "{}", serde_json::to_string(self).unwrap())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use wasm_bindgen_test::*;
    const EXECUTION_RESPONSE_STRING: &str = r#"{"execution":{"transitions":[{"id":"au1dfrkzg88p0pcgy56du90y9xugmuclu90kqd7ptgwark9t5qxfcrqw52hv7","program":"hello_hello.aleo","function":"hello","inputs":[{"type":"public","id":"4945992393802635475563268868099292760643816190063237189685350751189981170816field","value":"5u32"},{"type":"private","id":"4164103417332231618737989065641386688266929073430922423679012291923769848499field","value":"ciphertext1qyqwhn4l6n3r3vuxll4nknsjjm85ymf9xfp0xrgvffhw9vyvd6ax7qsgpxvjj"}],"outputs":[{"type":"private","id":"5698382242539043620442411567938920404298421896333837450816037367993133498453field","value":"ciphertext1qyq2seq9t7nwfrsyvwxdat85zgsrumfkfpcy4s9p0ek7fuejvwzj2qc6rfj60"}],"tpk":"1486634957944190724396679076295465074325176108987233340308498709130933996149group","tcm":"7676439751717049208763075205278935619467292973248433417291209210873565684393field"}],"global_state_root":"sr1mt27mfdealt4nfwv4fv56nv53zk42xpk7s2e7emklx8fze60dvqqsmyqyp","proof":"proof1qyqsqqqqqqqqqqqpqqqqqqqqqqqfsrvj33m0zeyzu0xvsmrh9mhpue5nnn5r48auwr3lkdtr56jkmpkjqy56y7uzmtmxsg9l9lqsqmvqq87fyhw6nl3nu470mehj8elnu2k5nkqvdycapmqdx4revnemljv7cy54fedtg8pz06jxmxzqgp7kvqt2gf5n0u3962zchpc3hhmvurlyraxz64qrd05whadfq20atmlf4dvz2mtwxw3dcq4efuztf3wk9gq95fj38e2fghvthexhke0e5sjek3g9a8rlqjk7xk25eywkk6zra0prwtfs7m8zzw0e4ntascva7scp3k846j4vgxl0txs74w8rz584jfm0yvg96f0272kmlws8lgcl0q9ym6ak55l4d7qvf5tqk7kmeyucp9fkq5kk6ya62tecws255nay67vmqaljn6hhcc6wetjxu2pad8zxszy62hlwj8ansfnt3j4wrme5qpadk4karx7fvzzlpx0meadg38eyuj2793tppl749se9fradadf0zprvwltlc2w57ftekyejg9laeq9uug9auxj2mmxugs6zc8sx3lw73a6wgw8kemm6q7yae65lt94sazzj3u249plu89kdedn400l8jwq69r76hh56ffa88m35dc8mlar7v5ftaft836dmxn3xgzzvs97v4gujcmtt5rzcrav53k4eemczkwcqps77tlg2qknlarv54qcra2vkswsqwr0a2qj09uncv48luzkdny9selq52nqyndnfyr82l9crpkgxd7pmvw8axt59ea3ry0n9pghqgzlrcrvgr5mvh4qjmpt99c6psgae857e8xwdlw5vqt7683877md7py5979lyk96e7rc0f0qnn58gghcw8lhxpu9fs48fux7yyyamal5qmjxfqqzulmugwg90mtyvsrgg0mawawkmhtrqn3ft85k97mw7atqrmtduzm6awmkhzlqsywazs05yx00nqga8m3nse6qq6gnvrs998v8y4k92yx4ca3fv9x2p05slt6hkgs5ev78z3cxrshkwcv890t7dwyry3cqgpx5g3fh8vzlprnwy6k0gwmxry2jzdvg75gxtyfaargq9q3p2ay5u7hysehpawe9hdqv0pzj4zeh3zpzskmcd65fnd7senwdq762tea3lxkg5c4wx8uspa3g4a8s050nlf4hsgw0g87af605nccspqvqqqqqqqqqqqa9vd7ws94vxswct8y8yc0hqx8axxq2smawwns3zlt7hn0h9rshd2r2axfzq7q95ccg6z63vegq9syqqn375qy2en9wry7pxs34ycxxt4s9qwulfwl8kygrfkzmaj9rh6fvr3dwxcjd33tggndd4agg5sn5pqy43eu72lcj5e7stnlkw2f8huvctx45csaea7q4gsen7tx002rkq759y86c06rem3hvywm925dulyg9vvzg6hs7xxqkprgmdh84jfw4hu75342xw8aqnr84uq02etkc3sqqqvdhysh"},"function_id":"hello","program":"program hello_hello.aleo;\n\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n","verifying_key":"verifier1qygqqqqqqqqqqqrexyqqqqqqqqqxuvgqqqqqqqqqm4usqqqqqqqqpj9wqqqqqqqqqqj5zqqqqqqqqqqvqqqqqqqqqqqdc2dqsuva0q6lxnhp03h2tpdy9ga2kecvk68uc320nhthal2lndrm8qp9463cwa2tu2x928nd7rcq7df7ptdvnzxckqelxmvd2pd6w57auf7ej5tvq3wfn25celv46zy425cphqgj5jyug06fzcemyfhsrdvqptvynulc88zaq8ak3ezszyzvqzj7s4f6ewkqr63kr2y06c7g3napl6un62zfcrjgrumnwmzhs96zr27slulnvxcvtu884dvfffr7sfv3ves2645v6sr79frqt50z90exdpmjnep5q9mncdsx9gg6cq99wjqeavg2xryhsk2m0e8nnevjcz4rv5evx3l88lzjezaqrc3mdm0n5u66kvtlc7y6558gyfy82jqvh690eyxplnulckn3kdmk29x9jgmm5vuk2f90ct6u60hsly0uhwxz27mqzk5t6u5psr0pcnpwlrsqfc5rqx2rghgmaxpxx9fr0a6m4xh3x9hjakgtuqumntnwkf56xfxch5aavnkx0ylgesj976g5g4nqpvjn3rc3sd7mcpzcwgprzmgdt7lfp5lkaydznyu537u6la7khc5f4dfkmqp8uyxl6s3et78mxr5sqxjcdpf7tea6qucvyylu46t84n682zlunhzq9hqs8wfnnqcwwkxkw08926fudhuqvp3c0rt2w8dryqt0anx5w2844skt3xqs6c02gjvr4hcxkxfkpmd68rt94t9y2vauxwlceymvmazwlr0vjeuq7atlwsq33zms3vmz2uplna0jurtw9zfpvl2mtll80r33hc26mcuggcy9fh98t9aap6psgjlmh0mynrfyhgqq9zpmh5uqtsjh8tfgeqfxrzhyvuxum7h3tpu4gleslk8utascqaeqnfkngcd32lpglqh5rqdy6wkszpfk0e6dpx87c3d84zquguf6n3f5mr8hjffq9c5da73dm04r0wf6dsegtk"}"#;

    #[wasm_bindgen_test]
    fn test_execution_response_string_roundtrip() {
        let execution_response = ExecutionResponse::from_string(EXECUTION_RESPONSE_STRING).unwrap();
        assert_eq!(execution_response.to_string(), EXECUTION_RESPONSE_STRING);
    }
}