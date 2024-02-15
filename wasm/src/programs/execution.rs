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

pub use super::*;
use std::{ops::Deref, str::FromStr};
use wasm_bindgen::prelude::wasm_bindgen;

use crate::types::native::{
    CurrentNetwork,
    ExecutionNative,
    IdentifierNative,
    ProcessNative,
    ProgramID,
    ProgramNative,
    VerifyingKeyNative,
};
use js_sys::Object;

/// Execution of an Aleo program.
#[wasm_bindgen]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Execution(ExecutionNative);

#[wasm_bindgen]
impl Execution {
    /// Returns the string representation of the execution.
    #[wasm_bindgen(js_name = "toString")]
    #[allow(clippy::inherent_to_string)]
    pub fn to_string(&self) -> String {
        self.0.to_string()
    }

    /// Creates an execution object from a string representation of an execution.
    #[wasm_bindgen(js_name = "fromString")]
    pub fn from_string(execution: &str) -> Result<Execution, String> {
        Ok(Self(ExecutionNative::from_str(execution).map_err(|e| e.to_string())?))
    }
}

impl From<ExecutionNative> for Execution {
    fn from(native: ExecutionNative) -> Self {
        Self(native)
    }
}

impl From<Execution> for ExecutionNative {
    fn from(execution: Execution) -> Self {
        execution.0
    }
}

impl Deref for Execution {
    type Target = ExecutionNative;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

/// Verify an execution with a single function and a single transition. Executions with multiple
/// transitions or functions will fail to verify. Also, this does not verify that the state root of
/// the execution is included in the Aleo Network ledger.
///
/// @param {Execution} execution The function execution to verify
/// @param {VerifyingKey} verifying_key The verifying key for the function
/// @param {Program} program The program that the function execution belongs to
/// @param {String} function_id The name of the function that was executed
/// @returns {boolean} True if the execution is valid, false otherwise
#[wasm_bindgen(js_name = "verifyFunctionExecution")]
pub fn verify_function_execution(
    execution: &Execution,
    verifying_key: &VerifyingKey,
    program: &Program,
    function_id: &str,
    imports: Option<Object>,
) -> Result<bool, String> {
    let function = IdentifierNative::from_str(function_id).map_err(|e| e.to_string())?;
    let program_id = ProgramID::<CurrentNetwork>::from_str(&program.id()).unwrap();
    let mut process_native = ProcessNative::load_web().map_err(|e| e.to_string())?;
    let process = &mut process_native;
    let program_native = ProgramNative::from_str(program.to_string().as_str()).map_err(|e| e.to_string())?;
    ProgramManager::resolve_imports(process, &program_native, imports)?;
    if &program.id() != "credits.aleo" {
        process.add_program(program).map_err(|e| e.to_string())?;
    }
    process
        .insert_verifying_key(&program_id, &function, VerifyingKeyNative::from(verifying_key))
        .map_err(|e| e.to_string())?;
    process.verify_execution(execution).map_or(Ok(false), |_| Ok(true))
}

#[cfg(test)]
mod tests {
    use super::*;
    use wasm_bindgen_test::*;

    const EXECUTION: &str = r#"{ "transitions": [ { "id": "au1xe07pjnw6970k9lh0rfvpdnudcz0gcyy5qmv2efp3qrdxkkaj5rseklkfk", "program": "credits.aleo", "function": "transfer_public", "inputs": [ { "type": "public", "id": "6830040130268084683056203786650856838291629627526850542328121029117462649106field", "value": "aleo1q6qstg8q8shwqf5m6q5fcenuwsdqsvp4hhsgfnx5chzjm3secyzqt9mxm8" }, { "type": "public", "id": "3522622156280992546879723962866054193411134839313162974822034464277507937156field", "value": "1u64" } ], "outputs": [ { "type": "future", "id": "6287946476679554718269040652777030908815963134664267470652690289159774741065field", "value": "{\n  program_id: credits.aleo,\n  function_name: transfer_public,\n  arguments: [\n    aleo1q6qstg8q8shwqf5m6q5fcenuwsdqsvp4hhsgfnx5chzjm3secyzqt9mxm8,\n    aleo1q6qstg8q8shwqf5m6q5fcenuwsdqsvp4hhsgfnx5chzjm3secyzqt9mxm8,\n    1u64\n  ]\n}" } ], "tpk": "1124897318163588088766079717854473596955076479615330099205126740598806373414group", "tcm": "5379517959399780344431681060960827894902462418861353186658003065156167347920field" } ], "global_state_root": "sr1tml46c266j4gzv9qpk0adkt6tkl4mjq7s7supuy8dmv9lq09j5zsd5eqsz", "proof": "proof1qyqsqqqqqqqqqqqpqqqqqqqqqqq9eqfncmzufz24n5xvfk2yy2lm7k0jh2y23yj5ssekln7h2nmlc62mnjwe794rn5dxwwf7unaamfyqqxzhaqnm3xws740w8gwt3dt22r5l43xa9rhn6yc0vpuu46mal3a86n3qmc8yegeh8afyetmz7rs8mq8766v6rryrnhnhl8xudl3tr7rk50f0lrz36cjwp0vpg46fzq4wv9n3eglkn9ztx4kzhh9d0wmqgcqvv2e6lrnaqp9cafaxjh88pzfjn26vyq3y50hazf9c9ysc84x33mn4wculvu67z2utduq5qyy933qqtn7u5rtsztmtakuu2japhf7qcvrc663vkuk9s0twufhh42d2kk3ukf00290jxqe9qnfwr3txz05spv7tp88e7dduldq5wwulae6wm3nztzmzdjrypfz08awuvkzuale9h96hy8nyjt2znntu20c4xemlsyqpfn6ce0sv5nn5shxx2up8kw9xtyle3pcyaum9hsw29ctqcjqmn53j7dxy6ep37cfvnflxqctpuqqgtgss9tp5rzg4vp46fw8nsjztdum9xm2xp0d8hglr2v8fuyh38afsw0kymhn2lznaag7cwud0guqtpdn2l2zgn4sjg7n0gdd0ueg5ujeydmqkxx8dp9a4g456q4jvukjt2cycuvef5slqt3hwnuh6ez5qys785f6xw8xsc5ns6ee3la7rf3p24mkpeakd5ay73q30m3qezux2xzqv35zy8jclv7lxpvcnej8tkstf00fzh9l44q382hpt8eejyp3vs3pq2n3n2e0eq30zatqyrvqsqs4cllynrcytc6v9seuqgtdnzy5rr3vcwwhlrxzm2h66e9q4z94r7zpnkm6xt4yermvys6twaw6sncwt5x64qjdnatddjpeh97uszkvamu6kmltu2unnq2mq4kverfsg8ncpvkhvre77yjhgmw5nevw2az0s2dwr6navrchn7pdwkmmjcu9dedn40jacflfeld7agznzjw3cpwewyhhufu49l5ttjpqrcpl3yzn2m3h3mgq5ea4xedf8370lmmr4ansr60x5d0qwrx08n6r8qe6vq2jlk5t8fey0mcgteef0hxe84vm5khehwjr9vu7p839jpysctaz3z88zcum9nw6z04gqvj3dqvldndldatwknwu4plnlpsqxhg5x8qc0qvqqqqqqqqqqqf57wtv2gucqnx8n0ejkhtywfmxrvewes27sr0ng67f7900w4kga6ztwnzhvtpd4rv0qqhjfmkwssqqvzr0sf8p6hsda4wgak42gtdcxfkf8xfywmdpgecqhxcptdrtvluv9adsn8vc5vwds4kd54thnaggqqxz3799lcez0f8v2xencv2z76fwvgp52wrnh5qyjtteckn2nhlhq8e60eq358pw2lezf74flec2wp4e8gvk5xtrwwy36j36axmy9pmh9kwa9cnsykxzwx38kdtqhnqytsyqqefuv9d" }"#;

    #[wasm_bindgen_test]
    fn test_execution_verification() {
        let execution = Execution::from_string(EXECUTION).unwrap();
        let verifying_key_bytes = snarkvm_parameters::testnet3::TransferPublicVerifier::load_bytes().unwrap();
        let verifying_key = VerifyingKey::from_bytes(&verifying_key_bytes).unwrap();
        assert!(
            verify_function_execution(
                &execution,
                &verifying_key,
                &Program::get_credits_program(),
                "transfer_public",
                None
            )
            .unwrap()
        );
    }
}
