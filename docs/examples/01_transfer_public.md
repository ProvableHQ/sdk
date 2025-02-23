```typescript
import { Account, ProgramManager, initThreadPool } from '@provable.sdk';

// Initialize multi-threading to allow WASM execution.
await initThreadPoool();

// Create an account.
const account = new Account();

// Create a new NetworkClient, KeyProvider, and RecordProvider using official Aleo record, key, and network providers
const networkClient = new AleoNetworkClient("https://api.explorer.provable.com/v1");
const keyProvider = new AleoKeyProvider();
keyProvider.useCache = true;
const recordProvider = new NetworkRecordProvider(account, networkClient);

// Create program manager using the KeyProvider and NetworkProvider.
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);
// Set the account as the program caller.
programManager.setAccount(account);

// Create recipient account.
const recipient = new Account();

// Execute `transfer_public` function in `credits.aleo`
// Publicly send 5 microcredits to the recipient
const transaction2 = await programManager.buildExecutionTransaction({
  programName: "credits.aleo",
  functionName: "transfer_public",
  fee: 0.020,
  privateFee: false,
  inputs: [recipient.address(), "5u32"],
  keySearchParams: { "cacheKey": "credits:transfer_public" }
});

// Broadcast the transaction to the Aleo network.
const result2 = await programManager.networkClient.submitTransaction(transaction2);
```