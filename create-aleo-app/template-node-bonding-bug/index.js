import {Account, initThreadPool, ProgramManager, AleoKeyProvider, AleoKeyProviderParams} from "@aleohq/sdk";

await initThreadPool();

const hello_hello_program =
    "program hello_hello.aleo;\n" +
    "\n" +
    "function hello:\n" +
    "    input r0 as u32.public;\n" +
    "    input r1 as u32.private;\n" +
    "    add r0 r1 into r2;\n" +
    "    output r2 as u32.private;\n";

const defaultHost = "http://52.53.215.86:3033";

async function localProgramExecution(program, aleoFunction, inputs) {
    const programManager = new ProgramManager(defaultHost);

    // Create a temporary account for the execution of the program
    const account = new Account();
    programManager.setAccount(account);

    // Create a key provider in order to re-use the same key for each execution
    const keyProvider = new AleoKeyProvider();
    keyProvider.useCache(true);
    programManager.setKeyProvider(keyProvider);

    // Pre-synthesize the program keys and then cache them in memory using key provider
    const keyPair = await programManager.synthesizeKeys(hello_hello_program, "hello", ["1u32", "1u32"]);
    programManager.keyProvider.cacheKeys("hello_hello.aleo:hello", keyPair);

    // Specify parameters for the key provider to use search for program keys. In particular specify the cache key
    // that was used to cache the keys in the previous step.
    const keyProviderParams = new AleoKeyProviderParams({cacheKey: "hello_hello.aleo:hello"});

    // Execute once using the key provider params defined above. This will use the cached proving keys and make
    // execution significantly faster.
    let executionResponse = await programManager.executeOffline(
        hello_hello_program,
        "hello",
        ["5u32", "5u32"],
        true,
        undefined,
        keyProviderParams,
    );
    console.log("hello_hello/hello executed - result:", executionResponse.getOutputs());

    // Verify the execution using the verifying key that was generated earlier.
    if (programManager.verifyExecution(executionResponse)) {
        console.log("hello_hello/hello execution verified!");
    } else {
        throw("Execution failed verification!");
    }
}

async function bondPublicStep1() {
    const programManager = new ProgramManager(defaultHost);

    // Create a temporary account for the execution of the program
    const account = new Account({privateKey: "APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH"});
    programManager.setAccount(account);

    // Create a key provider in order to re-use the same key for each execution
    const keyProvider = new AleoKeyProvider();
    keyProvider.useCache(true);
    programManager.setKeyProvider(keyProvider);

    let bondPublicTransaction = await programManager.bondPublic("aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", 5000000);
    console.log("bondPublicTransaction:", bondPublicTransaction);
}

async function unbondPublicStep3() {
    const programManager = new ProgramManager(defaultHost);

    // Create a temporary account for the execution of the program
    const account = new Account({privateKey: "APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH"});
    programManager.setAccount(account);

    // Create a key provider in order to re-use the same key for each execution
    const keyProvider = new AleoKeyProvider();
    keyProvider.useCache(true);
    programManager.setKeyProvider(keyProvider);

    let bondPublicTransaction = await programManager.unbondPublic( 5000000);
    console.log("bondPublicTransaction:", bondPublicTransaction);
}

async function bondPublicStateFalseStep2(bool) {
    const programManager = new ProgramManager(defaultHost);

    // Create a temporary account for the execution of the program
    const account = new Account({privateKey: "APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH"});
    programManager.setAccount(account);

    // Create a key provider in order to re-use the same key for each execution
    const keyProvider = new AleoKeyProvider();
    keyProvider.useCache(true);
    programManager.setKeyProvider(keyProvider);

    let bondPublicStateFalseStep2Transaction = await programManager.setValidatorState(bool);
    console.log("bondPublicStateFalseStep2Transaction:", bondPublicStateFalseStep2Transaction);
}



// async function rebondStep3() {
//     const programManager = new ProgramManager(defaultHost);
//
//     // Create a temporary account for the execution of the program
//     const account = new Account({privateKey: "APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH"});
//     programManager.setAccount(account);
//
//     // Create a key provider in order to re-use the same key for each execution
//     const keyProvider = new AleoKeyProvider();
//     keyProvider.useCache(true);
//     programManager.setKeyProvider(keyProvider);
//
//     let rebondStep3Transaction = await programManager.unbondDelegatorAsValidator("aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px");
//     console.log("rebondStep3Transaction:", rebondStep3Transaction);
// }

const start = Date.now();
console.log("Starting execute!");
// await bondPublicStep1();
// await bondPublicStateFalseStep2();
// await unbondPublicStep3();

// await bondPublicStep1();
// bondPublicStateFalseStep2(true)
await bondPublicStep1();
console.log("Execute finished!", Date.now() - start);
