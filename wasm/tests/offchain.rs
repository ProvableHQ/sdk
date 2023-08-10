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
use js_sys::{Array, Object, Reflect};
use std::str::FromStr;
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

pub const FINALIZE: &str = r#"program finalize_test.aleo;

mapping integer_key_mapping:
    key integer_key as u64.public;
    value integer_value as u64.public;

function integer_key_mapping_update:
    input r0 as u64.public;
    input r1 as u64.public;
    finalize r0 r1;

finalize integer_key_mapping_update:
    input r0 as u64.public;
    input r1 as u64.public;
    set r1 into integer_key_mapping[r0];
"#;

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
        .execute_function_offline(
            PrivateKey::from_string("APrivateKey1zkp3dQx4WASWYQVWKkq14v3RoQDfY2kbLssUj7iifi1VUQ6").unwrap(),
            Program::get_credits_program().to_string(),
            "split".to_string(),
            inputs,
            true,
            None,
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
        .execute_function_offline(
            PrivateKey::from_string("APrivateKey1zkp3dQx4WASWYQVWKkq14v3RoQDfY2kbLssUj7iifi1VUQ6").unwrap(),
            credits.to_string(),
            "split".to_string(),
            inputs,
            true,
            None,
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
            None,
        )
        .await;
    assert!(execution.is_err());

    // Ensure deployment fails when fee amount is greater than the balance available in the record
    let deployment = program_manager
        .deploy(
            private_key.clone(),
            Program::get_credits_program().to_string(),
            100.0,
            fee_record.clone(),
            "https://vm.aleo.org/api".to_string(),
            false,
            None,
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
        .execute_function_offline(
            private_key.clone(),
            HELLO_PROGRAM.to_string(),
            "main".to_string(),
            inputs,
            true,
            None,
            None,
            None,
        )
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
        .execute_function_offline(
            private_key.clone(),
            HELLO_PROGRAM.to_string(),
            "main".to_string(),
            inputs,
            true,
            None,
            None,
            None,
        )
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
        .execute_function_offline(
            private_key.clone(),
            HELLO_PROGRAM.to_string(),
            "main".to_string(),
            inputs.clone(),
            false,
            None,
            Some(retrieved_proving_key.clone()),
            Some(retrieved_verifying_key.clone()),
        )
        .unwrap();

    // Ensure the finalize fee is zero for a program without a finalize scope
    let finalize_fee = program_manager.estimate_finalize_fee(HELLO_PROGRAM.to_string(), "main".to_string()).unwrap();
    assert_eq!(finalize_fee, 0);

    // Check the fee can be estimated without a finalize scope
    let fee = program_manager
        .estimate_execution_fee(
            private_key.clone(),
            HELLO_PROGRAM.to_string(),
            "main".to_string(),
            inputs,
            "https://vm.aleo.org/api".to_string(),
            false,
            None,
            Some(retrieved_proving_key),
            Some(retrieved_verifying_key),
        )
        .await
        .unwrap();

    // Ensure the fee is greater a specific amount
    assert!(fee > 1200);

    // Ensure the output is correct
    let outputs = result.get_outputs().to_vec();
    console_log!("outputs: {:?}", outputs);
    assert_eq!(outputs.len(), 1);
    assert_eq!(outputs[0], "30u32");

    // Assert cached keys aren't used in future transactions
    let inputs = js_sys::Array::new_with_length(2);
    inputs.set(0, wasm_bindgen::JsValue::from_str("20u32"));
    inputs.set(1, wasm_bindgen::JsValue::from_str("20u32"));
    let result = program_manager
        .execute_function_offline(
            private_key,
            HELLO_PROGRAM_EDIT.to_string(),
            "hello".to_string(),
            inputs,
            false,
            None,
            None,
            None,
        )
        .unwrap();

    let outputs = result.get_outputs().to_vec();
    console_log!("outputs: {:?}", outputs);
    assert_eq!(outputs.len(), 1);
    assert_eq!(outputs[0], "40u32");
}

#[wasm_bindgen_test]
async fn test_fee_estimation() {
    let mut program_manager = ProgramManager::new();
    let private_key = PrivateKey::new();

    let inputs = js_sys::Array::new_with_length(2);
    inputs.set(0, wasm_bindgen::JsValue::from_str("15u64"));
    inputs.set(1, wasm_bindgen::JsValue::from_str("15u64"));

    // Ensure the deployment fee is correct and the cache is used
    let deployment_fee = program_manager.estimate_deployment_fee(FINALIZE.to_string(), true, None).await.unwrap();
    let namespace_fee = program_manager.program_name_cost("tencharacters.aleo").unwrap();
    assert_eq!(namespace_fee, 1000000);

    // Ensure the fee is greater a specific amount
    assert!(deployment_fee > 1940000);

    // Ensure the finalize fee is greater than zero for a program with a finalize scope
    let finalize_fee =
        program_manager.estimate_finalize_fee(FINALIZE.to_string(), "integer_key_mapping_update".to_string()).unwrap();
    assert!(finalize_fee > 0);

    let execution_fee = program_manager
        .estimate_execution_fee(
            private_key.clone(),
            FINALIZE.to_string(),
            "integer_key_mapping_update".to_string(),
            inputs,
            "https://vm.aleo.org/api".to_string(),
            true,
            None,
            None,
            None,
        )
        .await
        .unwrap();

    // Ensure the fee is greater a specific amount
    console_log!("execute fee for finalize: {:?}", execution_fee);
    assert!(execution_fee > 1001000);

    // Ensure the total fee is greater than the finalize fee
    assert!(execution_fee > finalize_fee);
}

#[wasm_bindgen_test]
async fn test_import_resolution() {
    let imports = Object::new();
    Reflect::set(&imports, &JsValue::from_str("multiply_test.aleo"), &JsValue::from_str(MULTIPLY_PROGRAM)).unwrap();
    Reflect::set(&imports, &JsValue::from_str("addition_test.aleo"), &JsValue::from_str(ADDITION_PROGRAM)).unwrap();
    Reflect::set(&imports, &JsValue::from_str("double_test.aleo"), &JsValue::from_str(MULTIPLY_IMPORT_PROGRAM))
        .unwrap();

    let mut program_manager = ProgramManager::new();
    let private_key = PrivateKey::new();
    let inputs = js_sys::Array::new_with_length(1);
    inputs.set(0, JsValue::from_str("5u32"));
    inputs.set(1, JsValue::from_str("10u32"));

    let result = program_manager
        .execute_function_offline(
            private_key,
            NESTED_IMPORT_PROGRAM.to_string(),
            "add_and_double".to_string(),
            inputs,
            true,
            Some(imports),
            None,
            None,
        )
        .unwrap();

    let outputs = result.get_outputs().to_vec();
    console_log!("outputs: {:?}", outputs);
    assert_eq!(outputs.len(), 1);
    assert_eq!(outputs[0], "30u32");
}
