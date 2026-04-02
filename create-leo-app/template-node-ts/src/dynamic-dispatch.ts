import { createWasmEngine } from "@provablehq/provable-engine-wasm";
import { ProvableKit } from "@provablehq/provablekit";
import {
    Account,
    DynamicRecord,
    initThreadPool,
    ProgramManager,
    RecordPlaintext,
} from "@provablehq/provable-engine-wasm/testnet.js";


await ProvableKit.init({
  engine: createWasmEngine(),
  env: { network: "testnet" },
});
await initThreadPool();

// --- Programs --- //

const DD_CONSTANTS_PROGRAM = `program dd_constants.aleo;

function get_value:
    output 42u128 as u128.private;

constructor:
    assert.eq true true;
`;

const DD_CALLER_PROGRAM = `program dd_caller.aleo;

function call_and_increment:
    input r0 as field.public;
    input r1 as field.public;
    input r2 as field.public;
    call.dynamic r0 r1 r2 into r3 (as u128.private);
    add r3 1u128 into r4;
    output r4 as u128.public;

constructor:
    assert.eq true true;
`;

// --- Setup --- //

const programManager = new ProgramManager();
const account = new Account();
programManager.setAccount(account);

// --- Test 1: Dynamic dispatch with plain string inputs --- //
// The SDK's prepareInputs() should auto-convert bare strings to field elements
// when the function signature expects `field` type. Users should NOT need to
// call stringToField() manually.

console.log("");
console.log("// --- Dynamic dispatch: plain string inputs (auto-converted by SDK) --- //");

const programInput = "dd_constants";
const networkInput = "aleo";
const functionInput = "get_value";

console.log(`Inputs: program="${programInput}", network="${networkInput}", function="${functionInput}"`);

const start = Date.now();
const executionResponse = await programManager.run(
    DD_CALLER_PROGRAM,
    "call_and_increment",
    [programInput, networkInput, functionInput],
    true,
    { "dd_constants.aleo": DD_CONSTANTS_PROGRAM },
);
const elapsed = Date.now() - start;

const outputs = executionResponse.getOutputs();
console.log(`Execution completed in ${elapsed / 1000}s — outputs: ${outputs}`);

// dd_constants/get_value returns 42u128, caller adds 1 -> expect 43u128
const expected = "43u128";
if (outputs[0] !== expected) {
    throw new Error(`Expected output ${expected}, got ${outputs[0]}`);
}
console.log("PASS: Plain strings auto-converted — users do NOT need stringToField()");

// --- Test 2: Dynamic dispatch with dynamic.record input --- //
// Tests whether a user can pass a RecordPlaintext string as input
// to a program that expects `dynamic.record`.

console.log("");
console.log("// --- Dynamic dispatch: dynamic.record input (plaintext string) --- //");

// A target program that accepts a dynamic.record and returns it.
const DD_RECORD_READER_PROGRAM = `program dd_record_reader.aleo;

function read_owner:
    input r0 as dynamic.record;
    output r0 as dynamic.record;

constructor:
    assert.eq true true;
`;

// A caller that dynamically dispatches to dd_record_reader/read_owner with a dynamic.record.
// The first three field inputs will be auto-converted by prepareInputs().
const DD_RECORD_CALLER_PROGRAM = `program dd_record_caller.aleo;

function call_read_owner:
    input r0 as field.public;
    input r1 as field.public;
    input r2 as field.public;
    input r3 as dynamic.record;
    call.dynamic r0 r1 r2 with r3 (as dynamic.record) into r4 (as dynamic.record);
    output r4 as dynamic.record;

constructor:
    assert.eq true true;
`;

// Construct a credits record plaintext.
const creditsRecord = `{ owner: ${account.address().toString()}.private, microcredits: 1000000u64.private, _nonce: 3634848344765318974603121890869676775499130077229666060613233255327643175219group.public, _version: 1u8.public }`;

// Test 2a: Pass raw RecordPlaintext string with bare string field inputs (auto-converted).
console.log("");
console.log("Test 2a: Raw RecordPlaintext string + bare string field inputs...");
const start2a = Date.now();
const executionResponse2a = await programManager.run(
    DD_RECORD_CALLER_PROGRAM,
    "call_read_owner",
    ["dd_record_reader", "aleo", "read_owner", creditsRecord],
    true,
    { "dd_record_reader.aleo": DD_RECORD_READER_PROGRAM },
);
const elapsed2a = Date.now() - start2a;
const outputs2a = executionResponse2a.getOutputs();
console.log(`Execution completed in ${elapsed2a / 1000}s — outputs: ${outputs2a}`);
// Verify the output is a parseable dynamic record.
const returnedRecord2a = DynamicRecord.fromString(outputs2a[0]);
if (!returnedRecord2a.owner()) {
    throw new Error("Test 2a: returned dynamic record has no owner");
}
console.log("PASS: Raw RecordPlaintext + bare strings accepted");

// Test 2b: Pass DynamicRecord.fromRecord().toString() (explicit conversion still works).
console.log("");
console.log("Test 2b: DynamicRecord.fromRecord().toString() as dynamic.record input...");
const recordPlaintext = RecordPlaintext.fromString(creditsRecord);
const dynamicRecord = DynamicRecord.fromRecord(recordPlaintext);
const dynamicRecordStr = dynamicRecord.toString();
const start2b = Date.now();
const executionResponse2b = await programManager.run(
    DD_RECORD_CALLER_PROGRAM,
    "call_read_owner",
    ["dd_record_reader", "aleo", "read_owner", dynamicRecordStr],
    true,
    { "dd_record_reader.aleo": DD_RECORD_READER_PROGRAM },
);
const elapsed2b = Date.now() - start2b;
const outputs2b = executionResponse2b.getOutputs();
console.log(`Execution completed in ${elapsed2b / 1000}s — outputs: ${outputs2b}`);
// Verify the output is a parseable dynamic record.
const returnedRecord2b = DynamicRecord.fromString(outputs2b[0]);
if (!returnedRecord2b.owner()) {
    throw new Error("Test 2b: returned dynamic record has no owner");
}
console.log("PASS: DynamicRecord plaintext string accepted as input");

console.log("");
console.log("All dynamic dispatch tests passed!");
