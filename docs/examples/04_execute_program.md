In this example we will be executing the program that was deployed in
[the previous example](03_deploy_program.md)

```typescript
import { Account, ProgramManager, initThreadPool } from "@provablehq/sdk";

// Initialize multi-threading to allow WASM execution.
await initThreadPoool();

// Create an account.
const account = new Account();

// Create a new NetworkClient, KeyProvider, and RecordProvider using official Aleo record, key, and network providers
const networkClient = new AleoNetworkClient("https://api.provable.com/v2");
const keyProvider = new AleoKeyProvider();
keyProvider.useCache(true);
const recordProvider = new NetworkRecordProvider(account, networkClient);

// Create program manager using the KeyProvider and NetworkProvider.
const programManager = new ProgramManager(
    "https://api.provable.com/v2",
    keyProvider,
    recordProvider,
);
// Set the account as the program caller.
programManager.setAccount(account);

// Create the program inputs
const input1 = 14;
const input2 = 28;

// Create the program execution transaction.
const transaction = await programManager.buildExecutionTransaction({
    programName: "addition_demo.aleo",
    functionName: "addition",
    priorityFee: 0.0,
    privateFee: false,
    inputs: [`${input1}u32`, `${input2}u32`],
    keySearchParams: { cacheKey: "addition_demo:addition" },
});

// Broadcast the transaction to the Aleo network.
const result = programManager.networkClient.submitTransaction(transaction);

let transactionObj;
let transactionFound = false;
// Loop until the transaction has been Accepted
while (!transactionFound) {
    try {
        transactionObj =
            await programManager.networkClient.getTransactionObject(result);
        transactionFound = true;
    } catch (e) {
        console.error(e);
    }
}
// Get the transition from the transaction.
let transition = <Transition>transactionObj.transitions()[0];
// Get the output from the execution transition, which should be `42u32`
let output = transition.outputs(true)[0];
```
