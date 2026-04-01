```typescript
import { Account, ProgramManager, initThreadPool } from '@provablehq/provablekit';

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
const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, recordProvider);
// Set the account as the program caller.
programManager.setAccount(account);

// Declare program source code using Aleo Instructions
const program = `
program addition_demo.aleo;

function addition:
    input r0 as u32.public;
    input r1 as u32.public;
    add r0 r1 into r2;
    output r2 as u32.public;
`;

// Create a deployment transaction using the declared source code.
const transaction = await programManager.buildDeploymentTransaction(program, 0.0, false);
// Broadcast the transaction to the Aleo network.
const result = await programManager.networkClient.submitTransaction(transaction);
```