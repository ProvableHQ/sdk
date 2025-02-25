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

// Create a record for the sender using the transfer_public_to_private function.
const transaction = await programManager
    .buildTransferTransaction(
        5,                 // The amount to be transferred in credits (not microcredits)
        account            // The address of the recipient (In this case, your own address).
            .address()
            .to_string(),
        "publicToPrivate", // The transfer type.
        0.1,               // The fee amount.
        false,             // Indicates whether or not the fee will be private. 
    );
// Broadcast the transaction to the Aleo network.
let result = await programManager.networkClient.submitTransaction(transaction);

let transactionObj;
let transactionFound = false;
// Loop until the transaction has been Accepted
while (!transactionFound) {
    try {
        transactionObj = await programManager.networkClient.getTransactionObject(result);
        transactionFound = true;
    } catch (e) {
        console.error(e);
    }
}

// Get the list of owned records attached to the transaction.
let transactionRecords = transactionObj.ownedRecords(account.viewKey());
// This transaction only contains one record so it is the first and only one.
let record = transactionRecords[0];

// This new account will stand in as the recipient in this transfer.
const recipient = new Account();

// Execute `transfer_private` function in `credits.aleo`
// Privately send 5 microcredits to the recipient from the sender's record
const transaction2 = await programManager
    .buildTransferTransaction(
        5,                 // The amount to be transferred in credits (not microcredits)
        recipient          // The address of the recipient.
            .address()
            .to_string(),
        "private",         // The transfer type.
        0.1,               // The fee amount.
        false,             // Indicates whether or not the fee will be private.
    );
// Broadcast the transaction to the Aleo network.
const result2 = await programManager.networkClient.submitTransaction(transaction2);
//
```