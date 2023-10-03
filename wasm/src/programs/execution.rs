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

use crate::types::{CurrentNetwork, ExecutionNative, IdentifierNative, ProcessNative, ProgramID, VerifyingKeyNative};

/// A program that can be executed on the Aleo blockchain.
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
    function_id: String,
) -> Result<bool, String> {
    let function = IdentifierNative::from_str(&function_id).map_err(|e| e.to_string())?;
    let program_id = ProgramID::<CurrentNetwork>::from_str(&program.id()).unwrap();
    let mut process = ProcessNative::load_web().map_err(|e| e.to_string())?;
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

    const EXECUTION: &str = r#"{"transitions":[{"id":"as1gvakz34j86meg8m9qty8wvd6q5g0kq4yjann9rxhrdclnudgsgzsun7fqg","program":"credits.aleo","function":"transfer_public_to_private","inputs":[{"type":"private","id":"3559404182723855987648325562772737043873359890923745236730615477378882626975field","value":"ciphertext1qgqzl88kmsf8jqk4cy2sqvm39vty9ewr67vwpxhlzmc3ajktk5a9gq9yq7aqswatm5pzh0a8cxr0quc2nfkdsttrrwt9t5kzq0a3pklvpqc92jxy"},{"type":"public","id":"8025374784680103421213924561521377858956249097395704706773833540838625702105field","value":"100000000u64"}],"outputs":[{"type":"record","id":"3277244183946285525543523584633273639940105079643779437822225084020101728660field","checksum":"8274780032857121049950687901286913283302745423768457384536132105227065290006field","value":"record1qyqsphr5jyxc0pp4w3805p04gmjgnxwg9vy3tsgfegq57v82qz3qafg0qyxx66trwfhkxun9v35hguerqqpqzqqluf6uucn2gewf2k3p6z0pper9fcg60g8nsc82lsh2fq3lhqqdqq6jan76l4jtmvdjfeync9qwkf4ql6hnqp5gpp0eu4wqj3f5ag2s657ekl3"},{"type":"future","id":"1892803943572610344093204513122467255144277953861191406986017276042122058500field","value":"{\n  program_id: credits.aleo,\n  function_name: transfer_public_to_private,\n  arguments: [\n    aleo1dreuxnmg9cny8ee9v2u0wr4v4affnwm09u2pytfwz0f2en2shgqsdsfjn6,\n    100000000u64\n  ]\n}"}],"tpk":"2476663388883037700295634254861333867987742331829418410904500131258030567772group","tcm":"7477891320807015200552190699459917336363441387680200590247086896037845762610field"}],"global_state_root":"ar1ekees06ce437zyrpy3xryal7wpfsw2zlsvwrr0rrfv3ywc8ehcrsg0tlrf","proof":"proof1qyqsqqqqqqqqqqqpqqqqqqqqqqq2dazvpa4wlcwvu4ygfjuqd26aj2tp59ueuvx3zk4xkk423la6jnr34wcmv6gmdwfgpfxp4ftjpzgpqx72njl8q2fk08ava8ytd7vdk3rnf70043dxa8dp5pqhgf48qarevw0p29268477963vn3dswz5nyqx35h0juczarc8sdfwlrn5zr7r3ralstfqa35fv6tj6wwmgrfhfyjswwwlhzdnz96a9zf86c4cz2gq9smwk5xscarjsxtuur0hajrwq336qq60pwh4q0r9exlnhw53lgnna0ksuesa66yjxh8j9khkxdevquhumm4w3lwmelthm0f3c74gwsrrwzdqjcrxpjzh4xevc59npgf4dq25m9k9u8m4p04tz5ymhy2dsrpttw4w40uuucexmu3nr8sa8ej3ymre30hkmvsw5faqkrqfnqtzdp8snqx0cftkj48v0jr2nqfkqsprd58zg4x0ypsxu74l39g6nkq65qr2khqlvy68xztnyucppzzv4a650j8f2ry705072juvynhkptqqdvn9kssrseedcrhkxxscvusl6tzrevlmd7lph5ctxyx7jlyy097ddjy0qu0qrfktwtlqxvm4sq7quhngect0czy7hnclrk3809z7kzt478h5jew3l7sqxml946qft887sg4m04udh8dwyyn56nza6slyq7uq4fmh9ze0a2wjrymp27fu426mq9axxp3gj44m2jmgv4al6ru9h75dgjjkxr8wc49t20q2x7wk0q7yh52fe5y0ma0z22735zvxczyzvjhs7xv6x2gzlxeqa0l86s8penm4kz6jrs0t44085drzvxalvpwrlmyr8mms25dy9ac7jwlr6r7um9amt55njfc3327j3ymtjg6uqdpy9rk0vhqhqy2ya2668840at8uzs4wyyyfs207qjzpkljcwcfcgh9cjmh88nme4vad0grpjaj6p6dxum9vgrrgsj950e78j7fuvcuzrn9gwnz54d7r05lgpw0x5s7mprekqysg3u54z2szwrpazfkvq2p7flajf8k0nmdxt0vw8vspw4tpkgylp38g4wt3kayrjfuyrfmwaqhdflx2lcufqd4fx02vus345pdfwl8kavh2etxxpupmvsj79g2rsls4hej4ws929rlsu24v5z8hucvhp69mavgjwksp56p5yh5nd2fq8qvqqqqqqqqqqpl5xpfl7c4x0h623asnfaj2nz4xtdwmpcup55zwjc74jn2ll40y25thhv8td7x650fwa78weeazuqqqg4ty2vuj7ewyt004l6yrzh3efus0ngm9w849syrgdjsldautacllw8auyv9wyj5w3z4gfl6nq5zqpqx5d22ctjzmmhp00w25f72lg80y6j3jvpmeer8dlnnzhz3wfwqcsy8pv2wulg77rdghefg85gkcfqzng57gsuhruz89qe92yg72e5eljljm2j68tlh4pye9qr8lmrnymqyqqya5uv8"}"#;

    #[wasm_bindgen_test]
    fn test_execution_verification() {
        let execution = Execution::from_string(EXECUTION).unwrap();
        let verifying_key_bytes = snarkvm_parameters::testnet3::TransferPublicToPrivateVerifier::load_bytes().unwrap();
        let verifying_key = VerifyingKey::from_bytes(&verifying_key_bytes).unwrap();
        assert!(
            verify_function_execution(
                &execution,
                &verifying_key,
                &Program::get_credits_program(),
                "transfer_public_to_private".to_string()
            )
            .unwrap()
        );
    }
}
