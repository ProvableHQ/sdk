import { loadNetwork } from "@provablehq/sdk/dynamic.js";

const mainnet = await loadNetwork("mainnet");

await mainnet.initThreadPool();

const programName = "hello_hello.aleo"

const hello_hello_program =`
program ${programName};

function hello:
    input r0 as u32.public;
    input r1 as u32.private;
    add r0 r1 into r2;
    output r2 as u32.private;`

async function localProgramExecution(program, programName, aleoFunction, inputs) {
    const programManager = new mainnet.ProgramManager();

    // Create a temporary account for the execution of the program
    const account = new mainnet.Account();
    programManager.setAccount(account);

    // Create a key provider in order to re-use the same key for each execution
    const keyProvider = new mainnet.AleoKeyProvider();
    keyProvider.useCache(true);
    programManager.setKeyProvider(keyProvider);

    // Pre-synthesize the program keys and then cache them in memory using key provider
    const keyPair = await programManager.synthesizeKeys(hello_hello_program, aleoFunction, inputs);
    programManager.keyProvider.cacheKeys(`${programName}:${aleoFunction}`, keyPair);

    // Specify parameters for the key provider to use search for program keys. In particular specify the cache key
    // that was used to cache the keys in the previous step.
    const keyProviderParams = new mainnet.AleoKeyProviderParams({cacheKey: `${programName}:${aleoFunction}`});

    // Execute once using the key provider params defined above. This will use the cached proving keys and make
    // execution significantly faster.
    let executionResponse = await programManager.run(
        program,
        aleoFunction,
        inputs,
        true,
        undefined,
        keyProviderParams,
    );
    console.log("hello_hello/hello executed - result:", executionResponse.getOutputs());

    // Verify the execution using the verifying key that was generated earlier.
    const blockHeight = 9_000_000;
    if (programManager.verifyExecution(executionResponse, blockHeight)) {
        console.log("hello_hello/hello execution verified!");
    } else {
        throw("Execution failed verification!");
    }
}

const start = Date.now();
console.log("Starting execute!");
await localProgramExecution(hello_hello_program, programName, "hello", ["5u32", "5u32"]);
console.log("Execute finished!", Date.now() - start);

// Dynamic dispatch execution tests

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

const DD_TEN_PROGRAM = `program dd_ten.aleo;

function get_ten:
    output 10u128 as u128.private;

constructor:
    assert.eq true true;
`;

const DD_MULTI_CALLER_PROGRAM = `program dd_multi_caller.aleo;

function call_two_and_add:
    input r0 as field.public;
    input r1 as field.public;
    input r2 as field.public;
    input r3 as field.public;
    input r4 as field.public;
    call.dynamic r0 r1 r2 into r5 (as u128.private);
    call.dynamic r3 r1 r4 into r6 (as u128.private);
    add r5 r6 into r7;
    output r7 as u128.public;

constructor:
    assert.eq true true;
`;

const DD_CONSTANTS_FIELD = "35731532782568442653824738404field";
const DD_ALEO_FIELD = "1868917857field";
const DD_GET_VALUE_FIELD = "1871582396405622531431field";
const DD_TEN_FIELD = "121382023160932field";
const DD_GET_TEN_FIELD = "31073797930247527field";

async function dynamicDispatchSingleImport() {
    const keyProvider = new mainnet.AleoKeyProvider();
    const programManager = new mainnet.ProgramManager(undefined, keyProvider);
    programManager.setAccount(new mainnet.Account());

    const imports = { "dd_constants.aleo": DD_CONSTANTS_PROGRAM };

    const result = await programManager.run(
        DD_CALLER_PROGRAM,
        "call_and_increment",
        [DD_CONSTANTS_FIELD, DD_ALEO_FIELD, DD_GET_VALUE_FIELD],
        false,
        imports,
    );

    const outputs = result.getOutputs();
    if (outputs.length !== 1 || outputs[0] !== "43u128") {
        throw new Error(`Single-import dynamic dispatch failed: expected ["43u128"], got ${JSON.stringify(outputs)}`);
    }
}

async function dynamicDispatchMultiImport() {
    const keyProvider = new mainnet.AleoKeyProvider();
    const programManager = new mainnet.ProgramManager(undefined, keyProvider);
    programManager.setAccount(new mainnet.Account());

    const imports = {
        "dd_constants.aleo": DD_CONSTANTS_PROGRAM,
        "dd_ten.aleo": DD_TEN_PROGRAM,
    };

    const result = await programManager.run(
        DD_MULTI_CALLER_PROGRAM,
        "call_two_and_add",
        [DD_CONSTANTS_FIELD, DD_ALEO_FIELD, DD_GET_VALUE_FIELD, DD_TEN_FIELD, DD_GET_TEN_FIELD],
        false,
        imports,
    );

    const outputs = result.getOutputs();
    if (outputs.length !== 1 || outputs[0] !== "52u128") {
        throw new Error(`Multi-import dynamic dispatch failed: expected ["52u128"], got ${JSON.stringify(outputs)}`);
    }
}

console.log("Starting dynamic dispatch single-import execution!");
let ddStart = Date.now();
await dynamicDispatchSingleImport();
console.log("Dynamic dispatch single-import execution passed!", Date.now() - ddStart);

console.log("Starting dynamic dispatch multi-import execution!");
ddStart = Date.now();
await dynamicDispatchMultiImport();
console.log("Dynamic dispatch multi-import execution passed!", Date.now() - ddStart);
