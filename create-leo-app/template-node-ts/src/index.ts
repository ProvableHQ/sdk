import {
    Account,
    AleoKeyProvider,
    AleoKeyProviderParams,
    ConfirmedTransactionJSON,
    initThreadPool,
    Program,
    ProgramManager,
    Transaction,
} from "@provablehq/sdk/testnet.js";

// Initialize the thread pool in order to prove faster.
await initThreadPool();

function generateHelloHelloSource(programName: string) {
    const hello_hello_program =`
program ${programName};

function hello:
    input r0 as u32.public;
    input r1 as u32.private;
    add r0 r1 into r2;
    output r2 as u32.private;

constructor:
    assert.eq edition 0u16;
`;
    return hello_hello_program;
}

const programManager = new ProgramManager();

// Create a temporary account for the execution of the program
const account = new Account();
programManager.setAccount(account);

// Create a key provider in order to re-use the same key for each execution
const keyProvider = new AleoKeyProvider();
keyProvider.useCache(true);
programManager.setKeyProvider(keyProvider);

async function localProgramExecution(program: string, programName: string, aleoFunction: string, inputs: string[]) {
    // Pre-synthesize the program keys and then cache them in memory using the key provider.
    try {
        const keyPair = await programManager.synthesizeKeys(program, aleoFunction, inputs);

        programManager.keyProvider.cacheKeys(`${programName}:${aleoFunction}`, keyPair);

    } catch (e) {
        throw new Error(`Failed to synthesize keys: ${e.message}`);
    }

    // Specify parameters for the key provider to use search for program keys. In particular specify the cache key
    // that was used to cache the keys in the previous step.
    const keyProviderParams = new AleoKeyProviderParams({cacheKey: `${programName}:${aleoFunction}`});

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
    if (programManager.verifyExecution(executionResponse, 9_000_000)) {
        console.log("hello_hello/hello execution verified!");
    } else {
        throw("Execution failed verification!");
    }
}

// Run a deployment and both online and offline executions.
async function run(online: boolean = false) {
    // Generate the hello_hello.aleo program source code and inputs.
    let programName = `hello_hello.aleo`;
    let hello_hello_program = generateHelloHelloSource(programName);
    const functionName = "hello";
    const inputs = ["5u32", "5u32"];

    console.log("");
    console.log("// --- STEP 1: Execute the program offline to test it gives the expected results. --- //");
    // Execute the program locally.
    console.log(`Executing ${programName}/hello offline`);
    let start = Date.now();
    const result = await localProgramExecution(hello_hello_program, programName, functionName, inputs);
    console.log(`✅ Local execute finished in ${(Date.now() - start)/1000}s`);

    console.log("");
    console.log("// --- STEP 2: Build the deployment transaction. --- //");
    start = Date.now();
    programName = `hello_hello_${Math.floor(Math.random() * 65536)}.aleo`;
    hello_hello_program = generateHelloHelloSource(programName);
    const deploymentTx: Transaction = await programManager.buildDeploymentTransaction(
        hello_hello_program,
        0,
        false,
    )
    console.log(`✅ Deployment transaction built in ${(Date.now() - start)/1000}s`);

    // If the deployment flag is set to true, deploy the program on testnet (requires aleo credits).
    if (online) {
        const txId: string = await programManager.networkClient.submitTransaction(deploymentTx);
        const confirmedTx: ConfirmedTransactionJSON = await programManager.networkClient.waitForTransactionConfirmation(txId);
        if (txId === confirmedTx.transaction.id) {
            console.log(`Program ${programName} deployed to Aleo Testnet successfully!`);
        }
    } else {
        programName = `hello_hello.aleo`;
        hello_hello_program = generateHelloHelloSource(programName);
    }

    console.log("");
    console.log("// --- STEP 3: Execute the program ONLINE. --- //");

    // If the program was actually deployed, execute it online. Otherwise, execute an equivalent
    // program with the same logic.
    console.log(`Executing ${programName}/hello online on the aleo network`);
    start = Date.now();
    const keySearchParams = new AleoKeyProviderParams({cacheKey: `${programName}:${functionName}`});
    const executionTx: Transaction = await programManager.buildExecutionTransaction(
        {
            programName,
            functionName,
            priorityFee: 0,
            privateFee: false,
            inputs: inputs,
            keySearchParams,
            program: hello_hello_program
        }
    )
    console.log(`✅ Online execution of ${programName} built in ${(Date.now() - start)/1000}s`);

    // If the online option is specified, submit the transaction to the network.
    if (online) {
        const txId: string = await programManager.networkClient.submitTransaction(executionTx);
        const confirmedTx: ConfirmedTransactionJSON = await programManager.networkClient.waitForTransactionConfirmation(txId);
        if (txId === confirmedTx.transaction.id) {
            console.log(`Program ${programName}/hello executed successfully!`);
        }
    }
}

// Run the offline execution, deployment, and online execution of hello_hello.aleo.
await run(false);
