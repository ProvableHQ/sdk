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

mod authorize;
mod deploy;
mod execute;
mod join;
mod proving_request;
mod split;
mod transfer;

pub const DEFAULT_URL: &str = "https://api.explorer.provable.com/v1";
pub const LOCAL_URL: &str = "http://localhost:3030";

const DEVNODE_VERIFIER_KEY: &str = "verifier1qygqqqqqqqqqqqyvxgqqqqqqqqq87vsqqqqqqqqqhe7sqqqqqqqqqma4qqqqqqqqqq65yqqqqqqqqqqvqqqqqqqqqqqgtlaj49fmrk2d8slmselaj9tpucgxv6awu6yu4pfcn5xa0yy0tpxpc8wemasjvvxr9248vt3509vpk3u60ejyfd9xtvjmudpp7ljq2csk4yqz70ug3x8xp3xn3ul0yrrw0mvd2g8ju7rts50u3smue03gp99j88f0ky8h6fjlpvh58rmxv53mldmgrxa3fq6spsh8gt5whvsyu2rk4a2wmeyrgvvdf29pwp02srktxnvht3k6ff094usjtllggva2ym75xc4lzuqu9xx8ylfkm3qc7lf7ktk9uu9du5raukh828dzgq26hrarq5ajjl7pz7zk924kekjrp92r6jh9dpp05mxtuffwlmvew84dvnqrkre7lw29mkdzgdxwe7q8z0vnkv2vwwdraekw2va3plu7rkxhtnkuxvce0qkgxcxn5mtg9q2c3vxdf2r7jjse2g68dgvyh85q4mzfnvn07lletrpty3vypus00gfu9m47rzay4mh5w9f03z9zgzgzhkv0mupdqsk8naljqm9tc2qqzhf6yp3mnv2ey89xk7sw9pslzzlkndfd2upzmew4e4vnrkr556kexs9qrykkuhsr260mnrgh7uv0sp2meky0keeukaxgjdsnmy77kl48g3swcvqdjm50ejzr7x04vy7hn7anhd0xeetclxunnl7pd6e52qxdlr3nmutz4zr8f2xqa57a2zkl59a28w842cj4783zpy9hxw03k6vz4a3uu7sm072uqknpxjk8fyq4vxtqd08kd93c2mt40lj9ag35nm4rwcfjayejk57m9qqu83qnkrj3sz90pw808srmf705n2yu6gvqazpvu2mwm8x6mgtlsntxfhr0qas43rqxnccft36z4ygty86390t7vrt08derz8368z8ekn3yywxgp4uq24gm6e58tpp0lcvtpsm3nkwpnmzztx4qvkaf6vk38wg787h8mfpqqqqqqqqqqt49m8x";
const DEVNODE_CERTIFICATE: &str =
    "certificate1qyqsqqqqqqqqqqxvwszp09v860w62s2l4g6eqf0kzppyax5we36957ywqm2dplzwvvlqg0kwlnmhzfatnax7uaqt7yqqqw0sc4u";

use crate::{
    KeyPair,
    PrivateKey,
    ProvingKey,
    RecordPlaintext,
    VerifyingKey,
    log,
    types::native::{
        CurrentNetwork,
        IdentifierNative,
        ProcessNative,
        ProgramIDNative,
        ProgramNative,
        ProvingKeyNative,
        VerifyingKeyNative,
    },
};
use snarkvm_console::{network::Network, prelude::ToBytes};
use snarkvm_synthesizer::process::{cost_in_microcredits_v2, deployment_cost};
use snarkvm_synthesizer_program::StackTrait;
use std::panic::{AssertUnwindSafe, catch_unwind};

use js_sys::{Object, Reflect};
use std::str::FromStr;
use wasm_bindgen::prelude::wasm_bindgen;

#[wasm_bindgen]
#[derive(Clone)]
pub struct ProgramManager;

#[wasm_bindgen]
impl ProgramManager {
    /// Synthesize proving and verifying keys for a program
    ///
    /// @param {string} program The program source code of the program to synthesize keys for
    /// @param {string} function_id The function to synthesize keys for
    /// @param {Array} inputs The inputs to the function
    /// @param {Object | undefined} imports The imports for the program
    #[wasm_bindgen(js_name = "synthesizeKeyPair")]
    pub async fn synthesize_keypair(
        private_key: &PrivateKey,
        program: &str,
        function_id: &str,
        inputs: js_sys::Array,
        imports: Option<Object>,
        edition: Option<u16>,
    ) -> Result<KeyPair, String> {
        ProgramManager::execute_function_offline(
            private_key,
            program,
            function_id,
            inputs,
            false,
            true,
            imports,
            None,
            None,
            None,
            None,
            edition,
        )
        .await?
        .get_keys()
    }

    #[wasm_bindgen(js_name = "loadInclusionProver")]
    pub fn load_inclusion_prover(proving_key: ProvingKey) {
        let result = catch_unwind(AssertUnwindSafe(|| {
            let bytes = ProvingKeyNative::from(proving_key).to_bytes_le().expect("failed to convert to bytes");
            <CurrentNetwork as Network>::inclusion_proving_key(Some(bytes));
        }));

        if let Err(err) = result {
            let msg = if let Some(s) = err.downcast_ref::<&str>() {
                format!("loadInclusionProver panicked: {}", s)
            } else if let Some(s) = err.downcast_ref::<String>() {
                format!("loadInclusionProver panicked: {}", s)
            } else {
                "loadInclusionProver panicked with unknown payload".to_string()
            };
            log(msg.as_str());
        }
    }

    /// Check if a process contains a keypair for a specific function
    pub(crate) fn contains_key(
        process: &ProcessNative,
        program_id: &ProgramIDNative,
        function_id: &IdentifierNative,
    ) -> bool {
        process.get_stack(program_id).map_or_else(
            |_| false,
            |stack| stack.contains_proving_key(function_id) && stack.contains_verifying_key(function_id),
        )
    }

    /// Resolve imports for a program in depth first search order
    pub(crate) fn resolve_imports(
        process: &mut ProcessNative,
        program: &ProgramNative,
        imports: Option<Object>,
    ) -> Result<(), String> {
        if let Some(imports) = imports {
            program.imports().keys().try_for_each(|program_id| {
                // Get the program string
                let program_id = program_id.to_string();
                if let Some(import_string) = Reflect::get(&imports, &program_id.as_str().into())
                    .map_err(|_| "Program import not found in imports provided".to_string())?
                    .as_string()
                {
                    if &program_id != "credits.aleo" {
                        log(&format!("Importing program: {program_id}"));
                        let import = ProgramNative::from_str(&import_string).map_err(|err| err.to_string())?;
                        // If the program has imports, add them.
                        Self::resolve_imports(process, &import, Some(imports.clone()))?;
                        // If the process does not already contain the program, add it.
                        if !process.contains_program(import.id()) {
                            log(&format!("Adding {program_id} to the process"));
                            process.add_program_with_edition(&import, 1).map_err(|err| err.to_string())?;
                        }
                    }
                }
                Ok::<(), String>(())
            })
        } else {
            Ok(())
        }
    }

    pub(crate) fn validate_fee_record(
        fee_record: &Option<RecordPlaintext>,
        minimum_execution_cost: u64,
        priority_fee_microcredits: u64,
    ) -> Result<(), String> {
        let total_fee = priority_fee_microcredits.saturating_add(minimum_execution_cost);
        if let Some(fee_record) = fee_record {
            log("Validating the fee record");
            if fee_record.microcredits() < total_fee {
                return Err(format!(
                    "Fee record does not have enough credits to pay for a fee of {} credits. (base fee: {} credits - priority fee: {} credits)",
                    total_fee as f64 / 1_000_000.0,
                    minimum_execution_cost as f64 / 1_000_000.0,
                    priority_fee_microcredits as f64 / 1_000_000.0,
                ));
            }
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    use crate::Metadata;
    use js_sys::{Object, Reflect};
    use wasm_bindgen::JsValue;
    use wasm_bindgen_test::*;

    pub const MULTIPLY_PROGRAM: &str = r#"// The 'multiply_test.aleo' program which is imported by the 'double_test.aleo' program.
program multiply_test.aleo;

function multiply:
    input r0 as u32.public;
    input r1 as u32.private;
    mul r0 r1 into r2;
    output r2 as u32.private;
"#;

    pub const MULTIPLY_IMPORT_PROGRAM: &str = r#"// The 'double_test.aleo' program that uses a single import from another program to perform doubling.
import multiply_test.aleo;

program double_test.aleo;

function double_it:
    input r0 as u32.private;
    call multiply_test.aleo/multiply 2u32 r0 into r1;
    output r1 as u32.private;
"#;

    pub const ADDITION_PROGRAM: &str = r#"// The 'addition_test.aleo' program is imported by the 'double_test.aleo' program.
program addition_test.aleo;

function binary_add:
    input r0 as u32.public;
    input r1 as u32.private;
    add r0 r1 into r2;
    output r2 as u32.private;
"#;

    pub const NESTED_IMPORT_PROGRAM: &str = r#"// The 'imported_add_mul.aleo' program uses a nested series of imports. It imports the 'double_test.aleo' program
// which then imports the 'multiply_test.aleo' program and implicitly uses that to perform the doubling.
import double_test.aleo;
import addition_test.aleo;

program imported_add_mul.aleo;

function add_and_double:
    input r0 as u32.public;
    input r1 as u32.private;
    call addition_test.aleo/binary_add r0 r1 into r2;
    call double_test.aleo/double_it r2 into r3;
    output r3 as u32.private;
"#;

    #[wasm_bindgen_test]
    fn test_import_resolution() {
        let imports = Object::new();
        Reflect::set(&imports, &JsValue::from_str("multiply_test.aleo"), &JsValue::from_str(MULTIPLY_PROGRAM)).unwrap();
        Reflect::set(&imports, &JsValue::from_str("addition_test.aleo"), &JsValue::from_str(ADDITION_PROGRAM)).unwrap();
        Reflect::set(&imports, &JsValue::from_str("double_test.aleo"), &JsValue::from_str(MULTIPLY_IMPORT_PROGRAM))
            .unwrap();

        let mut process = ProcessNative::load_web().unwrap();
        let program = ProgramNative::from_str(NESTED_IMPORT_PROGRAM).unwrap();
        let add_program = ProgramNative::from_str(ADDITION_PROGRAM).unwrap();
        let multiply_program = ProgramNative::from_str(MULTIPLY_PROGRAM).unwrap();
        let double_program = ProgramNative::from_str(MULTIPLY_IMPORT_PROGRAM).unwrap();

        ProgramManager::resolve_imports(&mut process, &program, Some(imports)).unwrap();

        assert!(process.contains_program(add_program.id()));
        assert!(process.contains_program(multiply_program.id()));
        assert!(process.contains_program(double_program.id()));
    }

    #[wasm_bindgen_test]
    async fn test_load_inclusion_prover() {
        let inclusion_prover_url = Metadata::inclusion().prover;
        console_log!("inclusion prover url: {}", inclusion_prover_url);

        let bytes = reqwest::get(inclusion_prover_url).await.unwrap().bytes().await.unwrap().to_vec();
        let key = ProvingKey::from_bytes(&bytes).unwrap();
        ProgramManager::load_inclusion_prover(key);
    }
}
