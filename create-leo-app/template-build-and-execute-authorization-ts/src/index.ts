/// Import the of the sdk.
import { AleoKeyProvider, PrivateKey, initThreadPool, ProgramManager } from "@provablehq/sdk";

await initThreadPool();

// Create a new KeyProvider.
const keyProvider = new AleoKeyProvider();
keyProvider.useCache(true);

// Initialize a program manager with the key provider to automatically fetch keys for executions.
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider);

// Build the `Authorization`.
const privateKey = new PrivateKey(); // Change this to a private key that has an aleo credit balance.
const authorization = await programManager.buildAuthorization({
    programName: "credits.aleo",
    functionName: "transfer_public",
    privateKey,
    inputs: [
        "aleo1vwls2ete8dk8uu2kmkmzumd7q38fvshrht8hlc0a5362uq8ftgyqnm3w08",
        "10000000u64",
    ],
});

console.log("Getting execution id");

// Derive the execution ID and base fee.
const executionId = authorization.toExecutionId().toString();

console.log("Estimating fee");

// Get the base fee in microcredits.
const baseFeeMicrocredits = await programManager.estimateFeeForAuthorization(authorization, "credits.aleo");
const baseFeeCredits = Number(baseFeeMicrocredits)/1000000;

console.log("Building fee authorization");

// Build a credits.aleo/fee_public `Authorization`.
const feeAuthorization = await programManager.buildFeeAuthorization({
    deploymentOrExecutionId: executionId,
    baseFeeCredits,
    privateKey
});

console.log("Executing authorizations");

// Build and execute the transaction.
const tx = await programManager.buildTransactionFromAuthorization({
    programName: "credits.aleo",
    authorization,
    feeAuthorization,
});

// Submit the transaction to the network.
await programManager.networkClient.submitTransaction(tx.toString());

// Verify the transaction was successful.
setTimeout(async () => {
    const transaction = await programManager.networkClient.getTransaction(tx.id());
    console.log(transaction);
}, 10000);

