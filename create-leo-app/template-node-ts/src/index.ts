import {
    Account,
    AleoKeyProvider,
    ConfirmedTransactionJSON,
    initThreadPool,
    LocalFileKeyStore,
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

// Create a key provider with in-memory caching for the current session
const keyProvider = new AleoKeyProvider();
keyProvider.useCache(true);
programManager.setKeyProvider(keyProvider);

// Set up a persistent KeyStore to cache proving and verifying keys on disk.
// Keys are stored in the .aleo/ directory and survive across sessions.
const keyStore = new LocalFileKeyStore();
programManager.setKeyStore(keyStore);

// Run offline execution, deployment, and online execution of hello_hello.aleo.
async function run(online: boolean = false) {
    const programName = "hello_hello.aleo";
    const hello_hello_program = generateHelloHelloSource(programName);
    const functionName = "hello";
    const inputs = ["5u32", "5u32"];

    // --- STEP 1: Execute offline (cold — keys are synthesized and auto-persisted) ---
    console.log("");
    console.log("// --- STEP 1: Execute offline (cold run — keys synthesized and auto-persisted). --- //");
    let start = Date.now();

    // The first run() synthesizes keys inside WASM and automatically persists them
    // to the KeyStore. No explicit synthesizeKeys() call is needed.
    let executionResponse = await programManager.run(
        hello_hello_program,
        functionName,
        inputs,
        true,
    );
    const coldTime = Date.now() - start;
    console.log(`Cold execution completed in ${coldTime / 1000}s — result: ${executionResponse.getOutputs()}`);

    // Verify the execution.
    if (programManager.verifyExecution(executionResponse, 9_000_000)) {
        console.log("Execution verified!");
    } else {
        throw new Error("Execution failed verification!");
    }

    // Confirm keys were auto-persisted to the KeyStore.
    const proverStored = await keyStore.has(`${programName}.${functionName}.prover`);
    const verifierStored = await keyStore.has(`${programName}.${functionName}.verifier`);
    console.log(`Keys auto-persisted to KeyStore: prover=${proverStored}, verifier=${verifierStored}`);

    // --- STEP 2: Execute again offline (warm — keys are loaded from KeyStore, no synthesis) ---
    console.log("");
    console.log("// --- STEP 2: Execute offline again (warm run — keys loaded from KeyStore). --- //");
    start = Date.now();

    // No synthesizeKeys call needed — the ProgramManager automatically checks the KeyStore
    // for cached proving and verifying keys before execution.
    executionResponse = await programManager.run(
        hello_hello_program,
        functionName,
        inputs,
        true,
    );
    const warmTime = Date.now() - start;
    console.log(`Warm execution completed in ${warmTime / 1000}s — result: ${executionResponse.getOutputs()}`);

    if (programManager.verifyExecution(executionResponse, 9_000_000)) {
        console.log("Execution verified!");
    } else {
        throw new Error("Execution failed verification!");
    }

    if (warmTime < coldTime) {
        console.log(`KeyStore speedup: ${(coldTime / warmTime).toFixed(1)}x faster on warm run`);
    }

    // --- STEP 3: Build a deployment transaction. ---
    console.log("");
    console.log("// --- STEP 3: Build the deployment transaction. --- //");
    start = Date.now();
    const deployProgramName = `hello_hello_${Math.floor(Math.random() * 65536)}.aleo`;
    const deployProgram = generateHelloHelloSource(deployProgramName);
    const deploymentTx: Transaction = await programManager.buildDeploymentTransaction(
        deployProgram,
        0,
        false,
    );
    console.log(`Deployment transaction built in ${(Date.now() - start) / 1000}s`);

    // If the deployment flag is set to true, deploy the program on testnet (requires aleo credits).
    if (online) {
        const txId: string = await programManager.networkClient.submitTransaction(deploymentTx);
        const confirmedTx: ConfirmedTransactionJSON = await programManager.networkClient.waitForTransactionConfirmation(txId);
        if (txId === confirmedTx.transaction.id) {
            console.log(`Program ${deployProgramName} deployed to Aleo Testnet successfully!`);
        }
    }

    // --- STEP 4: Build an online execution transaction. ---
    // Keys from Step 1 are automatically loaded from KeyStore — no re-synthesis.
    console.log("");
    console.log("// --- STEP 4: Build an online execution transaction (keys from KeyStore). --- //");
    start = Date.now();
    const executionTx: Transaction = await programManager.buildExecutionTransaction(
        {
            programName,
            functionName,
            priorityFee: 0,
            privateFee: false,
            inputs,
            program: hello_hello_program,
        },
    );
    console.log(`Online execution transaction built in ${(Date.now() - start) / 1000}s`);

    // If the online option is specified, submit the transaction to the network.
    if (online) {
        const txId: string = await programManager.networkClient.submitTransaction(executionTx);
        const confirmedTx: ConfirmedTransactionJSON = await programManager.networkClient.waitForTransactionConfirmation(txId);
        if (txId === confirmedTx.transaction.id) {
            console.log(`Program ${programName}/hello executed successfully!`);
        }
    }

    // Clean up persisted keys
    await keyStore.clear();
}

await run(false);
