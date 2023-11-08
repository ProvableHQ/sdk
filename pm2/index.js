import {Account, initThreadPool, ProgramManager, AleoKeyProvider, AleoKeyProviderParams} from "@aleohq/sdk";

await initThreadPool(1);

const hello_hello_program =
    "program hello_hello.aleo;\n" +
    "\n" +
    "function hello:\n" +
    "    input r0 as u32.public;\n" +
    "    input r1 as u32.private;\n" +
    "    add r0 r1 into r2;\n" +
    "    output r2 as u32.private;\n";

const programManager = new ProgramManager("http://54.193.21.173:3033", );

// Create a temporary account for the execution of the program
const account = new Account({privateKey: 'APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH'});
programManager.setAccount(account);

// Create a key provider in order to re-use the same key for each execution
const keyProvider = new AleoKeyProvider();
keyProvider.useCache(true);
programManager.setKeyProvider(keyProvider);

const keyPair = await programManager.synthesizeKeys(hello_hello_program, "hello", ["1u32", "1u32"]);

const keyProviderParams = new AleoKeyProviderParams({cacheKey: "hello_hello.aleo:hello"});

async function localProgramExecution(program, aleoFunction, inputs) {
    // Pre-synthesize the program keys and then cache them in memory using key provider
    programManager.keyProvider.cacheKeys("hello_hello.aleo:hello", keyPair);

    // Specify parameters for the key provider to use search for program keys. In particular specify the cache key
    // that was used to cache the keys in the previous step.

    // Execute once using the key provider params defined above. This will use the cached proving keys and make
    // execution significantly faster.
    let executionResponse = await programManager.execute(
        "hello_hello.aleo",
        "hello",
        0.1,
        false,
        ["5u32", "5u32"],
        undefined,
        keyProviderParams,
    );
    console.log("hello_hello/hello executed - result:", executionResponse);
}

async function loop() {
    const start = Date.now();
    console.log("Starting execute!");
    await localProgramExecution();
    console.log("Execute finished!", Date.now() - start);
    await loop();
}

await loop();