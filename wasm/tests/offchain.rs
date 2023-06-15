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

use aleo_wasm::{PrivateKey, Program, ProgramManager, ProvingKey, RecordPlaintext, VerifyingKey};
use js_sys::Array;
use wasm_bindgen::JsValue;
use wasm_bindgen_test::*;
wasm_bindgen_test_configure!(run_in_browser);

pub const HELLO_PROGRAM: &str = r#"program hello.aleo;
function main:
    input r0 as u32.public;
    input r1 as u32.private;
    add r0 r1 into r2;
    output r2 as u32.private;
"#;

pub const HELLO_PROGRAM_EDIT: &str = r#"program hello.aleo;
function hello:
    input r0 as u32.public;
    input r1 as u32.private;
    add r0 r1 into r2;
    output r2 as u32.private;
"#;

const SPLIT_PROVER_URL: &str = "https://testnet3.parameters.aleo.org/split.prover.8c585f2";
const SPLIT_VERIFIER_URL: &str = "https://testnet3.parameters.aleo.org/split.verifier.8281688";

const RECORD: &str = "{  owner: aleo184vuwr5u7u0ha5f5k44067dd2uaqewxx6pe5ltha5pv99wvhfqxqv339h4.private,  microcredits: 2000000u64.private,  _nonce: 4106205762862305308495708971985748592380064201230396559307556388725936304984group.public}";

#[wasm_bindgen_test]
async fn test_cache_functionality() {
    // Get the split proving and verifying keys from the official Aleo parameters server
    let split_proving_key_bytes = reqwest::get(SPLIT_PROVER_URL).await.unwrap().bytes().await.unwrap().to_vec();
    let split_verifying_key_bytes = reqwest::get(SPLIT_VERIFIER_URL).await.unwrap().bytes().await.unwrap().to_vec();
    let split_proving_key = ProvingKey::from_bytes(&split_proving_key_bytes).unwrap();
    let split_proving_key_clone = split_proving_key.clone();
    let split_verifying_key = VerifyingKey::from_bytes(&split_verifying_key_bytes).unwrap();
    let split_verifying_key_clone = split_verifying_key.clone();
    let mut program_manager = ProgramManager::new();

    // Ensure the keypair is not in wasm memory if it has not been cached
    assert!(program_manager.get_cached_keypair("credits.aleo", "split").is_err());
    assert!(!program_manager.key_exists("credits.aleo", "split").unwrap());

    // Cache the keypair in wasm memory
    program_manager
        .cache_keypair_in_wasm_memory(
            &Program::get_credits_program().to_string(),
            "split",
            split_proving_key,
            split_verifying_key,
        )
        .unwrap();

    // Ensure the keypair is in wasm memory and can be retrieved
    let mut key_pair = program_manager.get_cached_keypair("credits.aleo", "split").unwrap();
    let retrieved_proving_key = key_pair.proving_key().unwrap();
    let retreived_verifying_key = key_pair.verifying_key().unwrap();
    assert_eq!(split_proving_key_clone, retrieved_proving_key);
    assert_eq!(split_verifying_key_clone, retreived_verifying_key);

    let inputs = Array::new();
    inputs.set(0u32, JsValue::from_str("{  owner: aleo184vuwr5u7u0ha5f5k44067dd2uaqewxx6pe5ltha5pv99wvhfqxqv339h4.private,  microcredits: 2000000u64.private,  _nonce: 4106205762862305308495708971985748592380064201230396559307556388725936304984group.public}"));
    inputs.set(1u32, JsValue::from_str("1000000u64"));

    // Ensure program can be executed using the cache after caching an externally provided keypair
    let result = program_manager
        .execute_local(
            PrivateKey::from_string("APrivateKey1zkp3dQx4WASWYQVWKkq14v3RoQDfY2kbLssUj7iifi1VUQ6").unwrap(),
            Program::get_credits_program().to_string(),
            "split".to_string(),
            inputs,
            true,
            None,
            None,
        )
        .unwrap();

    let record = RecordPlaintext::from_string(&result.get_outputs().get(0u32).as_string().unwrap()).unwrap();
    assert_eq!(record.microcredits(), 1000000u64);

    // Ensure the 'key_exists' function can find the keys
    assert!(program_manager.key_exists("credits.aleo", "split").unwrap());

    // Ensure the keypair can't be overwritten
    assert!(
        program_manager
            .cache_keypair_in_wasm_memory("credits.aleo", "split", split_proving_key_clone, split_verifying_key_clone)
            .is_err()
    );

    // Ensure the cache clears correctly
    program_manager.clear_key_cache();
    assert!(program_manager.get_cached_keypair("credits.aleo", "split").is_err());
    assert!(!program_manager.key_exists("credits.aleo", "split").unwrap());
}

#[wasm_bindgen_test]
async fn test_key_synthesis() {
    // Synthesize a keypair for the split program
    let mut program_manager = ProgramManager::new();
    let credits = Program::get_credits_program();
    let mut key_pair = program_manager.synthesize_keypair(&credits.to_string(), "split").unwrap();
    let retrieved_proving_key = key_pair.proving_key().unwrap();
    let retreived_verifying_key = key_pair.verifying_key().unwrap();

    // Cache the keypair for the split program in wasm memory
    program_manager
        .cache_keypair_in_wasm_memory(&credits.to_string(), "split", retrieved_proving_key, retreived_verifying_key)
        .unwrap();

    // Ensure program can be executed with the synthesized keypair stored in wasm memory
    let inputs = Array::new();
    inputs.set(0u32, JsValue::from_str(RECORD));
    inputs.set(1u32, JsValue::from_str("1000000u64"));

    let result = program_manager
        .execute_local(
            PrivateKey::from_string("APrivateKey1zkp3dQx4WASWYQVWKkq14v3RoQDfY2kbLssUj7iifi1VUQ6").unwrap(),
            credits.to_string(),
            "split".to_string(),
            inputs,
            true,
            None,
            None,
        )
        .unwrap();

    // Ensure the output is correct
    let record = RecordPlaintext::from_string(&result.get_outputs().get(0u32).as_string().unwrap()).unwrap();
    assert_eq!(record.microcredits(), 1000000u64);
}

#[wasm_bindgen_test]
async fn test_fee_validation() {
    let mut program_manager = ProgramManager::new();
    let inputs = Array::new();
    inputs.set(0u32, JsValue::from_str(RECORD));
    inputs.set(1u32, JsValue::from_str("1000000u64"));

    let private_key = PrivateKey::from_string("APrivateKey1zkp3dQx4WASWYQVWKkq14v3RoQDfY2kbLssUj7iifi1VUQ6").unwrap();
    let fee_record = RecordPlaintext::from_string(RECORD).unwrap();

    // Ensure execution fails when fee amount is greater than the balance available in the record
    let execution = program_manager
        .execute(
            private_key.clone(),
            Program::get_credits_program().to_string(),
            "split".to_string(),
            inputs,
            100.0,
            fee_record.clone(),
            "https://vm.aleo.org/api".to_string(),
            false,
            None,
            None,
            None,
            None,
        )
        .await;
    assert!(execution.is_err());

    // Ensure deployment fails when fee amount is greater than the balance available in the record
    let deployment = program_manager
        .deploy(
            private_key.clone(),
            Program::get_credits_program().to_string(),
            None,
            100.0,
            fee_record.clone(),
            "https://vm.aleo.org/api".to_string(),
            false,
            None,
            None,
        )
        .await;
    assert!(deployment.is_err());

    // Ensure transfer fails when fee amount or amount is greater than the balance available in the record
    let transfer = program_manager
        .transfer(
            private_key.clone(),
            100.00,
            "aleo184vuwr5u7u0ha5f5k44067dd2uaqewxx6pe5ltha5pv99wvhfqxqv339h4".to_string(),
            "private".to_string(),
            Some(fee_record.clone()),
            0.9,
            fee_record.clone(),
            "https://vm.aleo.org/api".to_string(),
            false,
            None,
            None,
            None,
            None,
        )
        .await;
    assert!(transfer.is_err());

    let transfer = program_manager
        .transfer(
            private_key.clone(),
            0.5,
            "aleo184vuwr5u7u0ha5f5k44067dd2uaqewxx6pe5ltha5pv99wvhfqxqv339h4".to_string(),
            "private".to_string(),
            Some(fee_record.clone()),
            100.00,
            fee_record.clone(),
            "https://vm.aleo.org/api".to_string(),
            false,
            None,
            None,
            None,
            None,
        )
        .await;
    assert!(transfer.is_err());

    // Ensure join fails when fee amount is greater than the balance available in the record
    let join = program_manager
        .join(
            private_key.clone(),
            fee_record.clone(),
            fee_record.clone(),
            100.00,
            fee_record.clone(),
            "https://vm.aleo.org/api".to_string(),
            false,
            None,
            None,
            None,
            None,
        )
        .await;
    assert!(join.is_err());
}

#[wasm_bindgen_test]
async fn test_program_execution_with_cache_and_external_keys() {
    // Run program locally with cache enabled
    let mut program_manager = ProgramManager::new();
    let private_key = PrivateKey::new();
    let inputs = js_sys::Array::new_with_length(2);
    inputs.set(0, wasm_bindgen::JsValue::from_str("5u32"));
    inputs.set(1, wasm_bindgen::JsValue::from_str("5u32"));
    let result = program_manager
        .execute_local(private_key.clone(), HELLO_PROGRAM.to_string(), "main".to_string(), inputs, true, None, None)
        .unwrap();
    let outputs = result.get_outputs().to_vec();
    console_log!("outputs: {:?}", outputs);
    assert_eq!(outputs.len(), 1);
    assert_eq!(outputs[0], "10u32");

    // Ensure the keys were synthesized in the program run and are in the cache
    let mut keypair = program_manager.get_cached_keypair("hello.aleo", "main").unwrap();

    // Assert cached keys are used in future program executions
    let inputs = js_sys::Array::new_with_length(2);
    inputs.set(0, wasm_bindgen::JsValue::from_str("15u32"));
    inputs.set(1, wasm_bindgen::JsValue::from_str("5u32"));
    let result = program_manager
        .execute_local(private_key.clone(), HELLO_PROGRAM.to_string(), "main".to_string(), inputs, true, None, None)
        .unwrap();

    // Ensure the output using cached keys is correct
    let outputs = result.get_outputs().to_vec();
    console_log!("outputs: {:?}", outputs);
    assert_eq!(outputs.len(), 1);
    assert_eq!(outputs[0], "20u32");

    // Assert cached keys are used in future transactions
    let inputs = js_sys::Array::new_with_length(2);
    inputs.set(0, wasm_bindgen::JsValue::from_str("15u32"));
    inputs.set(1, wasm_bindgen::JsValue::from_str("15u32"));

    // Ensure a function execution can be completed via passing external keys to the execute
    // function
    let retrieved_proving_key = keypair.proving_key().unwrap();
    let retrieved_verifying_key = keypair.verifying_key().unwrap();

    // Create a new program manager to ensure the key generated is portable
    let mut program_manager = ProgramManager::new();

    let result = program_manager
        .execute_local(
            private_key.clone(),
            HELLO_PROGRAM.to_string(),
            "main".to_string(),
            inputs,
            false,
            Some(retrieved_proving_key),
            Some(retrieved_verifying_key),
        )
        .unwrap();

    // Ensure the output is correct
    let outputs = result.get_outputs().to_vec();
    console_log!("outputs: {:?}", outputs);
    assert_eq!(outputs.len(), 1);
    assert_eq!(outputs[0], "30u32");

    // Check if we're NOT using the internal cache, that we can execute a program with the same
    // name but different source code

    // Assert cached keys are used in future transactions
    let inputs = js_sys::Array::new_with_length(2);
    inputs.set(0, wasm_bindgen::JsValue::from_str("20u32"));
    inputs.set(1, wasm_bindgen::JsValue::from_str("20u32"));
    let result = program_manager
        .execute_local(private_key, HELLO_PROGRAM_EDIT.to_string(), "hello".to_string(), inputs, false, None, None)
        .unwrap();

    let outputs = result.get_outputs().to_vec();
    console_log!("outputs: {:?}", outputs);
    assert_eq!(outputs.len(), 1);
    assert_eq!(outputs[0], "40u32");
}
