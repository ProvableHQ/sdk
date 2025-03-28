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

// Build a transfer_public transaction.
// Publicly send 5 microcredits to the recipient
const transaction = await programManager
  .buildTransferPublicTransaction(
    5,              // The amount to be transferred in credits (not microcredits)
    recipient       // The address of the recipient.
      .address()
      .to_string(),
    0.0             // The priority fee amount.
  );

// Broadcast the transaction to the Aleo network.
const result = await programManager.networkClient.submitTransaction(transaction);
```