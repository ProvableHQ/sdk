// Copyright (C) 2019-2024 Aleo Systems Inc.
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

use aleo_wasm::{PrivateKey, Program, ProgramManager, RecordPlaintext};
use js_sys::{Array, Object, Reflect};
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
    key as u64.public;
    value as u64.public;

function integer_key_mapping_update:
    input r0 as u64.public;
    input r1 as u64.public;
    async integer_key_mapping_update r0 r1 into r2;
    output r2 as finalize_test.aleo/integer_key_mapping_update.future;

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

const RECORD: &str = "{  owner: aleo184vuwr5u7u0ha5f5k44067dd2uaqewxx6pe5ltha5pv99wvhfqxqv339h4.private,  microcredits: 2000000u64.private,  _nonce: 4106205762862305308495708971985748592380064201230396559307556388725936304984group.public}";

#[wasm_bindgen_test]
async fn test_key_synthesis() {
    // Synthesize a keypair for the split program
    let credits = Program::get_credits_program().to_string();
    let inputs = Array::new();
    inputs.set(0u32, JsValue::from_str(RECORD));
    inputs.set(1u32, JsValue::from_str("5u64"));
    let private_key = PrivateKey::from_string("APrivateKey1zkp3dQx4WASWYQVWKkq14v3RoQDfY2kbLssUj7iifi1VUQ6").unwrap();
    let mut key_pair = ProgramManager::synthesize_keypair(&private_key, &credits, "split", inputs, None).await.unwrap();
    let retrieved_proving_key = key_pair.proving_key().unwrap();
    let retreived_verifying_key = key_pair.verifying_key().unwrap();

    // Ensure program can be executed with the synthesized keypair stored in wasm memory
    let inputs = Array::new();
    inputs.set(0u32, JsValue::from_str(RECORD));
    inputs.set(1u32, JsValue::from_str("5u64"));
    let mut result = ProgramManager::execute_function_offline(
        &PrivateKey::from_string("APrivateKey1zkp3dQx4WASWYQVWKkq14v3RoQDfY2kbLssUj7iifi1VUQ6").unwrap(),
        &credits,
        "split",
        inputs,
        false,
        true,
        None,
        Some(retrieved_proving_key.clone()),
        Some(retreived_verifying_key.clone()),
        None,
        None,
    )
    .await
    .unwrap();

    let mut keys = result.get_keys().unwrap();
    let proving_key = keys.proving_key().unwrap();
    let verifying_key = keys.verifying_key().unwrap();
    assert_eq!(proving_key, retrieved_proving_key);
    assert_eq!(verifying_key, retreived_verifying_key);
}

#[wasm_bindgen_test]
async fn test_fee_validation() {
    let inputs = Array::new();
    inputs.set(0u32, JsValue::from_str(RECORD));
    inputs.set(1u32, JsValue::from_str("1000000u64"));

    let private_key = PrivateKey::from_string("APrivateKey1zkp3dQx4WASWYQVWKkq14v3RoQDfY2kbLssUj7iifi1VUQ6").unwrap();
    let fee_record = RecordPlaintext::from_string(RECORD).unwrap();

    // Ensure execution fails when fee amount is greater than the balance available in the record
    let execution = ProgramManager::execute(
        &private_key,
        &Program::get_credits_program().to_string(),
        "split",
        inputs,
        100.0,
        Some(fee_record.clone()),
        Some("https://api.explorer.aleo.org/v1".to_string()),
        None,
        None,
        None,
        None,
        None,
        None,
    )
    .await;
    assert!(execution.is_err());

    // Ensure deployment fails when fee amount is greater than the balance available in the record
    let deployment = ProgramManager::deploy(
        &private_key,
        &Program::get_credits_program().to_string(),
        100.0,
        Some(fee_record.clone()),
        Some("https://api.explorer.aleo.org/v1".to_string()),
        None,
        None,
        None,
        None,
    )
    .await;
    assert!(deployment.is_err());

    // Ensure transfer fails when fee amount or amount is greater than the balance available in the record
    let transfer = ProgramManager::transfer(
        &private_key,
        100.00,
        "aleo184vuwr5u7u0ha5f5k44067dd2uaqewxx6pe5ltha5pv99wvhfqxqv339h4",
        "private",
        Some(fee_record.clone()),
        0.9,
        Some(fee_record.clone()),
        Some("https://api.explorer.aleo.org/v1".to_string()),
        None,
        None,
        None,
        None,
        None,
    )
    .await;
    assert!(transfer.is_err());

    let transfer = ProgramManager::transfer(
        &private_key,
        0.5,
        "aleo184vuwr5u7u0ha5f5k44067dd2uaqewxx6pe5ltha5pv99wvhfqxqv339h4",
        "private",
        Some(fee_record.clone()),
        100.00,
        Some(fee_record.clone()),
        Some("https://api.explorer.aleo.org/v1".to_string()),
        None,
        None,
        None,
        None,
        None,
    )
    .await;
    assert!(transfer.is_err());

    // Ensure join fails when fee amount is greater than the balance available in the record
    let join = ProgramManager::join(
        &private_key,
        fee_record.clone(),
        fee_record.clone(),
        100.00,
        Some(fee_record.clone()),
        Some("https://api.explorer.aleo.org/v1".to_string()),
        None,
        None,
        None,
        None,
        None,
    )
    .await;
    assert!(join.is_err());
}

#[wasm_bindgen_test]
async fn test_fee_estimation() {
    let private_key = PrivateKey::new();

    let inputs = js_sys::Array::new_with_length(2);
    inputs.set(0, wasm_bindgen::JsValue::from_str("15u64"));
    inputs.set(1, wasm_bindgen::JsValue::from_str("15u64"));

    // Ensure the deployment fee is correct and the cache is used
    let deployment_fee = ProgramManager::estimate_deployment_fee(FINALIZE, None).await.unwrap();
    let namespace_fee = ProgramManager::program_name_cost("tencharacters.aleo").unwrap();
    assert_eq!(namespace_fee, 1000000);

    // Ensure the fee is greater a specific amount
    assert!(deployment_fee > 1940000);

    // Ensure the finalize fee is greater than zero for a program with a finalize scope
    let finalize_fee = ProgramManager::estimate_finalize_fee(FINALIZE, "integer_key_mapping_update").unwrap();
    assert!(finalize_fee > 0);

    let execution_fee = ProgramManager::estimate_execution_fee(
        &private_key,
        FINALIZE,
        "integer_key_mapping_update",
        inputs,
        Some("https://api.explorer.aleo.org/v1".to_string()),
        None,
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

    let private_key = PrivateKey::new();
    let inputs = js_sys::Array::new_with_length(1);
    inputs.set(0, JsValue::from_str("5u32"));
    inputs.set(1, JsValue::from_str("10u32"));

    let result = ProgramManager::execute_function_offline(
        &private_key,
        NESTED_IMPORT_PROGRAM,
        "add_and_double",
        inputs,
        false,
        false,
        Some(imports),
        None,
        None,
        None,
        None,
    )
    .await
    .unwrap();

    let outputs = result.get_outputs().to_vec();
    console_log!("outputs: {:?}", outputs);
    assert_eq!(outputs.len(), 1);
    assert_eq!(outputs[0], "30u32");
}
