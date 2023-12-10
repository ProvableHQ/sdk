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

async function localProgramExecution() {
    const programManager = new ProgramManager(undefined, undefined, undefined);

    // Create a temporary account for the execution of the program
    const account = new Account();
    programManager.setAccount(account);

    // Create a key provider in order to re-use the same key for each execution
    const keyProvider = new AleoKeyProvider();
    keyProvider.useCache(true);
    programManager.setKeyProvider(keyProvider);

    // Pre-synthesize the program keys and then cache them in memory using key provider
    const keyPair = await programManager.synthesizeKeys(hello_hello_program, "hello", ["1u32", "1u32"]);

    if (keyPair instanceof Error) {
        throw new Error(`Failed to synthesize keys: ${keyPair.message}`);
    } else {
        programManager.keyProvider.cacheKeys("hello_hello.aleo:hello", keyPair);
    }

    programManager.keyProvider.cacheKeys("hello_hello.aleo:hello", keyPair);

    // Specify parameters for the key provider to use search for program keys. In particular specify the cache key
    // that was used to cache the keys in the previous step.
    const keyProviderParams = new AleoKeyProviderParams({cacheKey: "hello_hello.aleo:hello"});

    // Execute once using the key provider params defined above. This will use the cached proving keys and make
    // execution significantly faster.
    let executionResponse = await programManager.run(
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

const start = Date.now();
console.log("Starting execute!");
await localProgramExecution();
console.log("Execute finished!", Date.now() - start);
