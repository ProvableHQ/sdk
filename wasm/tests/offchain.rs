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

use aleo_wasm::{
    Metadata,
    OfflineQuery,
    PrivateKey,
    Program,
    ProgramManager,
    ProvingKey,
    RecordPlaintext,
    VerifyingKey,
};
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

pub const PUZZLE_ARCADE_COIN_V001_PROGRAM: &str = r#"
program puzzle_arcade_coin_v001.aleo;

record PuzzleArcadeCoin:
    owner as address.private;
    amount as u64.private;

function mint:
    input r0 as address.public;
    input r1 as u64.public;
    assert.eq self.caller self.signer ;
    assert.eq self.caller aleo184vuwr5u7u0ha5f5k44067dd2uaqewxx6pe5ltha5pv99wvhfqxqv339h4;
    cast r0 r1 into r2 as PuzzleArcadeCoin.record;
    output r2 as PuzzleArcadeCoin.record;

function spend:
    input r0 as PuzzleArcadeCoin.record;
    input r1 as u64.public;
    gte r0.amount r1 into r2;
    assert.eq r2 true ;
    sub r0.amount r1 into r3;
    cast r0.owner r3 into r4 as PuzzleArcadeCoin.record;
    output r4 as PuzzleArcadeCoin.record;
"#;

pub const CREDITS_ALEO_PROGRAM: &str = r#"
program credits.aleo;

mapping committee:
    key as address.public;
    value as committee_state.public;

struct committee_state:
    is_open as boolean;
    commission as u8;

mapping delegated:
    key as address.public;
    value as u64.public;

mapping metadata:
    key as address.public;
    value as u32.public;

mapping bonded:
    key as address.public;
    value as bond_state.public;

struct bond_state:
    validator as address;
    microcredits as u64;

mapping unbonding:
    key as address.public;
    value as unbond_state.public;

struct unbond_state:
    microcredits as u64;
    height as u32;

mapping account:
    key as address.public;
    value as u64.public;

mapping withdraw:
    key as address.public;
    value as address.public;

record credits:
    owner as address.private;
    microcredits as u64.private;

function bond_validator:
    input r0 as address.public;
    input r1 as u64.public;
    input r2 as u8.public;
    assert.neq self.signer r0 ;
    gte r1 1000000u64 into r3;
    assert.eq r3 true ;
    gt r2 100u8 into r4;
    assert.neq r4 true ;
    async bond_validator self.signer r0 r1 r2 into r5;
    output r5 as credits.aleo/bond_validator.future;

finalize bond_validator:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as u64.public;
    input r3 as u8.public;
    get.or_use withdraw[r0] r1 into r4;
    assert.eq r1 r4 ;
    cast true r3 into r5 as committee_state;
    get.or_use committee[r0] r5 into r6;
    assert.eq r3 r6.commission ;
    cast r0 0u64 into r7 as bond_state;
    get.or_use bonded[r0] r7 into r8;
    assert.eq r8.validator r0 ;
    add r8.microcredits r2 into r9;
    cast r0 r9 into r10 as bond_state;
    get.or_use delegated[r0] 0u64 into r11;
    add r2 r11 into r12;
    gte r12 10000000000000u64 into r13;
    assert.eq r13 true ;
    get account[r0] into r14;
    sub r14 r2 into r15;
    contains committee[r0] into r16;
    branch.eq r16 true to validator_in_committee;
    set r4 into withdraw[r0];
    gte r2 100000000u64 into r17;
    assert.eq r17 true ;
    get.or_use metadata[aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc] 0u32 into r18;
    add r18 1u32 into r19;
    set r19 into metadata[aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc];
    contains unbonding[r0] into r20;
    assert.eq r20 false ;
    position validator_in_committee;
    set r6 into committee[r0];
    set r12 into delegated[r0];
    set r10 into bonded[r0];
    set r15 into account[r0];

function bond_public:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as u64.public;
    gte r2 1000000u64 into r3;
    assert.eq r3 true ;
    assert.neq self.caller r0 ;
    async bond_public self.caller r0 r1 r2 into r4;
    output r4 as credits.aleo/bond_public.future;

finalize bond_public:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as address.public;
    input r3 as u64.public;
    get.or_use withdraw[r0] r2 into r4;
    assert.eq r2 r4 ;
    contains bonded[r0] into r5;
    branch.eq r5 true to continue_bond_delegator;
    set r2 into withdraw[r0];
    cast true 0u8 into r6 as committee_state;
    get.or_use committee[r1] r6 into r7;
    assert.eq r7.is_open true ;
    get.or_use metadata[aleo1qgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqanmpl0] 0u32 into r8;
    add r8 1u32 into r9;
    lte r9 100000u32 into r10;
    assert.eq r10 true ;
    set r9 into metadata[aleo1qgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqanmpl0];
    position continue_bond_delegator;
    cast r1 0u64 into r11 as bond_state;
    get.or_use bonded[r0] r11 into r12;
    assert.eq r12.validator r1 ;
    add r12.microcredits r3 into r13;
    gte r13 10000000000u64 into r14;
    assert.eq r14 true ;
    cast r1 r13 into r15 as bond_state;
    get account[r0] into r16;
    sub r16 r3 into r17;
    get.or_use delegated[r1] 0u64 into r18;
    add r3 r18 into r19;
    contains unbonding[r1] into r20;
    assert.eq r20 false ;
    set r15 into bonded[r0];
    set r17 into account[r0];
    set r19 into delegated[r1];

function unbond_public:
    input r0 as address.public;
    input r1 as u64.public;
    async unbond_public self.caller r0 r1 into r2;
    output r2 as credits.aleo/unbond_public.future;

finalize unbond_public:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as u64.public;
    add block.height 360u32 into r3;
    cast 0u64 r3 into r4 as unbond_state;
    get bonded[r1] into r5;
    get withdraw[r1] into r6;
    is.eq r0 r6 into r7;
    contains withdraw[r5.validator] into r8;
    get.or_use withdraw[r5.validator] aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc into r9;
    is.eq r0 r9 into r10;
    and r8 r10 into r11;
    or r7 r11 into r12;
    assert.eq r12 true ;
    is.eq r5.validator r1 into r13;
    branch.eq r13 true to unbond_validator;
    get.or_use unbonding[r1] r4 into r14;
    get delegated[r5.validator] into r15;
    sub r5.microcredits r2 into r16;
    lt r16 10000000000u64 into r17;
    or r11 r17 into r18;
    ternary r18 r5.microcredits r2 into r19;
    add r14.microcredits r19 into r20;
    cast r20 r3 into r21 as unbond_state;
    set r21 into unbonding[r1];
    sub r15 r19 into r22;
    set r22 into delegated[r5.validator];
    branch.eq r18 true to remove_delegator;
    cast r5.validator r16 into r23 as bond_state;
    set r23 into bonded[r1];
    branch.eq true true to end_unbond_delegator;
    position remove_delegator;
    remove bonded[r1];
    get metadata[aleo1qgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqanmpl0] into r24;
    sub r24 1u32 into r25;
    set r25 into metadata[aleo1qgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqanmpl0];
    position end_unbond_delegator;
    gte r22 10000000000000u64 into r26;
    branch.eq r26 true to end;
    position unbond_validator;
    contains committee[r5.validator] into r27;
    nor r13 r27 into r28;
    branch.eq r28 true to end;
    get committee[r5.validator] into r29;
    get bonded[r5.validator] into r30;
    get delegated[r5.validator] into r31;
    lt r31 10000000000000u64 into r32;
    branch.eq r32 true to remove_validator;
    sub r31 r2 into r33;
    sub r30.microcredits r2 into r34;
    gte r34 100000000u64 into r35;
    gte r33 10000000000000u64 into r36;
    and r35 r36 into r37;
    branch.eq r37 false to remove_validator;
    get.or_use unbonding[r5.validator] r4 into r38;
    add r38.microcredits r2 into r39;
    cast r39 r3 into r40 as unbond_state;
    set r40 into unbonding[r5.validator];
    set r33 into delegated[r5.validator];
    cast r5.validator r34 into r41 as bond_state;
    set r41 into bonded[r5.validator];
    branch.eq true true to end;
    position remove_validator;
    remove committee[r5.validator];
    get metadata[aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc] into r42;
    sub r42 1u32 into r43;
    set r43 into metadata[aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc];
    sub r31 r30.microcredits into r44;
    set r44 into delegated[r5.validator];
    remove bonded[r5.validator];
    get.or_use unbonding[r5.validator] r4 into r45;
    add r30.microcredits r45.microcredits into r46;
    cast r46 r3 into r47 as unbond_state;
    set r47 into unbonding[r5.validator];
    position end;

function claim_unbond_public:
    input r0 as address.public;
    async claim_unbond_public r0 into r1;
    output r1 as credits.aleo/claim_unbond_public.future;

finalize claim_unbond_public:
    input r0 as address.public;
    get unbonding[r0] into r1;
    gte block.height r1.height into r2;
    assert.eq r2 true ;
    get withdraw[r0] into r3;
    get.or_use account[r3] 0u64 into r4;
    add r1.microcredits r4 into r5;
    set r5 into account[r3];
    remove unbonding[r0];
    contains bonded[r0] into r6;
    branch.eq r6 true to end;
    remove withdraw[r0];
    position end;

function set_validator_state:
    input r0 as boolean.public;
    async set_validator_state self.caller r0 into r1;
    output r1 as credits.aleo/set_validator_state.future;

finalize set_validator_state:
    input r0 as address.public;
    input r1 as boolean.public;
    get committee[r0] into r2;
    cast r1 r2.commission into r3 as committee_state;
    set r3 into committee[r0];

function transfer_public:
    input r0 as address.public;
    input r1 as u64.public;
    async transfer_public self.caller r0 r1 into r2;
    output r2 as credits.aleo/transfer_public.future;

finalize transfer_public:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as u64.public;
    get account[r0] into r3;
    sub r3 r2 into r4;
    set r4 into account[r0];
    get.or_use account[r1] 0u64 into r5;
    add r5 r2 into r6;
    set r6 into account[r1];

function transfer_public_as_signer:
    input r0 as address.public;
    input r1 as u64.public;
    async transfer_public_as_signer self.signer r0 r1 into r2;
    output r2 as credits.aleo/transfer_public_as_signer.future;

finalize transfer_public_as_signer:
    input r0 as address.public;
    input r1 as address.public;
    input r2 as u64.public;
    get account[r0] into r3;
    sub r3 r2 into r4;
    set r4 into account[r0];
    get.or_use account[r1] 0u64 into r5;
    add r5 r2 into r6;
    set r6 into account[r1];

function transfer_private:
    input r0 as credits.record;
    input r1 as address.private;
    input r2 as u64.private;
    sub r0.microcredits r2 into r3;
    cast r1 r2 into r4 as credits.record;
    cast r0.owner r3 into r5 as credits.record;
    output r4 as credits.record;
    output r5 as credits.record;

function transfer_private_to_public:
    input r0 as credits.record;
    input r1 as address.public;
    input r2 as u64.public;
    sub r0.microcredits r2 into r3;
    cast r0.owner r3 into r4 as credits.record;
    async transfer_private_to_public r1 r2 into r5;
    output r4 as credits.record;
    output r5 as credits.aleo/transfer_private_to_public.future;

finalize transfer_private_to_public:
    input r0 as address.public;
    input r1 as u64.public;
    get.or_use account[r0] 0u64 into r2;
    add r1 r2 into r3;
    set r3 into account[r0];

function transfer_public_to_private:
    input r0 as address.private;
    input r1 as u64.public;
    cast r0 r1 into r2 as credits.record;
    async transfer_public_to_private self.caller r1 into r3;
    output r2 as credits.record;
    output r3 as credits.aleo/transfer_public_to_private.future;

finalize transfer_public_to_private:
    input r0 as address.public;
    input r1 as u64.public;
    get account[r0] into r2;
    sub r2 r1 into r3;
    set r3 into account[r0];

function join:
    input r0 as credits.record;
    input r1 as credits.record;
    add r0.microcredits r1.microcredits into r2;
    cast r0.owner r2 into r3 as credits.record;
    output r3 as credits.record;

function split:
    input r0 as credits.record;
    input r1 as u64.private;
    sub r0.microcredits r1 into r2;
    sub r2 10000u64 into r3;
    cast r0.owner r1 into r4 as credits.record;
    cast r0.owner r3 into r5 as credits.record;
    output r4 as credits.record;
    output r5 as credits.record;

function fee_private:
    input r0 as credits.record;
    input r1 as u64.public;
    input r2 as u64.public;
    input r3 as field.public;
    assert.neq r1 0u64 ;
    assert.neq r3 0field ;
    add r1 r2 into r4;
    sub r0.microcredits r4 into r5;
    cast r0.owner r5 into r6 as credits.record;
    output r6 as credits.record;

function fee_public:
    input r0 as u64.public;
    input r1 as u64.public;
    input r2 as field.public;
    assert.neq r0 0u64 ;
    assert.neq r2 0field ;
    add r0 r1 into r3;
    async fee_public self.signer r3 into r4;
    output r4 as credits.aleo/fee_public.future;

finalize fee_public:
    input r0 as address.public;
    input r1 as u64.public;
    get account[r0] into r2;
    sub r2 r1 into r3;
    set r3 into account[r0];
"#;

const RECORD: &str = "{  owner: aleo184vuwr5u7u0ha5f5k44067dd2uaqewxx6pe5ltha5pv99wvhfqxqv339h4.private,  microcredits: 2000000u64.private,  _nonce: 4106205762862305308495708971985748592380064201230396559307556388725936304984group.public}";
const OFFLINE_QUERY_V1: &str = r#"{"block_height": 456789, "state_paths": {}, "state_root": "sr1flkr8ppfujdrfx7zlcz8v8p8u67ehf4q9m2jum09pkq4rkepluxquyfvcu"}"#;
const OFFLINE_QUERY_V2: &str = r#"{"block_height": 6398077, "state_paths": {}, "state_root": "sr1lzvsx4jshyz9h42erfs0w6a4c8xy6s6hjs4lgfmyzzlju837lvxqcz7fft"}"#;

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
        Some("https://api.explorer.provable.com/v1".to_string()),
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
        Some("https://api.explorer.provable.com/v1".to_string()),
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
        Some("https://api.explorer.provable.com/v1".to_string()),
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
        Some("https://api.explorer.provable.com/v1".to_string()),
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
        Some("https://api.explorer.provable.com/v1".to_string()),
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
        Some("https://api.explorer.provable.com/v1".to_string()),
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

#[wasm_bindgen_test]
async fn test_fee_calculation_v1() {
    // Transaction id: at1fy95sxgr267e6vghzzg6effs83cm07lkgufzentkvx9f0pqldsxs67zhrk
    // Block number: 456,789 on testnet
    let private_key = PrivateKey::from_string("APrivateKey1zkp3dQx4WASWYQVWKkq14v3RoQDfY2kbLssUj7iifi1VUQ6").unwrap();
    let expected_microcredits = 1_449_u64; // value from the block explorer
    let input_1 = "aleo18clqv2ycpdmz07mzsuevp6yqwcz6ym303pra9hly523rpjuw0y9q5anej2";
    let input_2 = "1000000u64";
    let inputs = Array::new();
    inputs.set(0u32, JsValue::from_str(input_1));
    inputs.set(1u32, JsValue::from_str(input_2));

    let offline_query = OfflineQuery::from_string(OFFLINE_QUERY_V1).unwrap();

    let transaction = ProgramManager::execute(
        &private_key,
        PUZZLE_ARCADE_COIN_V001_PROGRAM,
        "mint",
        inputs,
        0.0,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        Some(offline_query),
    )
    .await;

    let transaction_fee = transaction.unwrap().fee_amount();
    assert_eq!(transaction_fee, expected_microcredits);
}

#[wasm_bindgen_test]
async fn test_fee_calculation_v2() {
    // Trasaction ID:  at1av6d606xj04w4fmqlp088z0m0jnwqxr00mz2qkcap2xyxeu6ngxs7f3gx7
    // Block number: 6,398,077 on testnet
    let private_key = PrivateKey::from_string("APrivateKey1zkp3dQx4WASWYQVWKkq14v3RoQDfY2kbLssUj7iifi1VUQ6").unwrap();
    let expected_microcredits = 17_939_u64;
    let input_1 = "aleo1lly6xyqmg9y2xgug9wd8s5suvgpp0wp27zjtyfgk9p0w996v3yxsg90zk5";
    let input_2 = "14973561u64";
    let inputs = Array::new();
    inputs.set(0u32, JsValue::from_str(input_1));
    inputs.set(1u32, JsValue::from_str(input_2));

    let offline_query = OfflineQuery::from_string(OFFLINE_QUERY_V2).unwrap();

    let transaction = ProgramManager::execute(
        &private_key,
        CREDITS_ALEO_PROGRAM,
        "transfer_public_to_private",
        inputs,
        0.0,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        Some(offline_query),
    )
    .await;

    let transaction_fee = transaction.unwrap().fee_amount();
    assert_eq!(transaction_fee, expected_microcredits);
}
