# Records

## Record Scanning (RSS)

The Record Scanning Service discovers records owned by an account without
revealing which records belong to whom.

```ts
import { RecordScanner } from "@provablehq/sdk/testnet.js";

const scanner = new RecordScanner({
    url: "https://api.provable.com/v2",
    apiKey: process.env.PROVABLE_API_KEY,
    consumerId: process.env.PROVABLE_CONSUMER_ID,
    decryptEnabled: true,   // Required for findCreditsRecord()
    autoReRegister: true,   // Auto re-register on 422 errors
});

// Step 1: Register view key with the scanner
const viewKey = account.viewKey();
await scanner.register(viewKey, 0);  // 0 = scan from genesis

// Step 2: Find a credit record with sufficient balance
const record = await scanner.findCreditsRecord(
    1_000_000,  // minimum microcredits needed
    true,       // unspent only
    [],         // nonces to exclude (already used)
    {},         // additional filters
);

console.log("Found record:", record.toString());
```

## Record Discovery via NetworkRecordProvider

```ts
import { NetworkRecordProvider } from "@provablehq/sdk/testnet.js";

const recordProvider = new NetworkRecordProvider(account, pm.networkClient);

// Find a single credit record
const record = await recordProvider.findCreditsRecord(1_000_000, true, []);

// Find multiple records (e.g., for input + fee)
const records = await recordProvider.findCreditsRecords(
    [500_000, 1_000_000],  // amounts needed
    true,                   // unspent only
    [],                     // nonces to exclude
);
```

## Nonce Management

Track used nonces to avoid double-spending across multi-step operations:

```ts
const usedNonces: string[] = [];

// First operation: find and use a record
const record1 = await scanner.findCreditsRecord(amount1, true, usedNonces);
usedNonces.push(record1.nonce());

// Second operation: find another record, excluding the first
const record2 = await scanner.findCreditsRecord(amount2, true, usedNonces);
usedNonces.push(record2.nonce());
```

**Critical:** After finding a record for transaction inputs, exclude its nonce
when searching for the fee record:

```ts
const inputRecord = await scanner.findCreditsRecord(amount, true, []);
const feeRecord = await scanner.findCreditsRecord(fee, true, [inputRecord.nonce()]);
```

## Decrypt Records

```ts
// Decrypt a record ciphertext from a transaction output
const decrypted = account.decryptRecord(recordCiphertext);
console.log("Owner:", decrypted.owner().to_string());
console.log("Microcredits:", decrypted.microcredits().toString());

// Access custom fields
const customField = decrypted.getMember("my_field");
```

## Inspect Execution Outputs

```ts
const tx = await pm.networkClient.getTransaction(txId);

const execution = tx.execution;
if (execution) {
    for (const transition of execution.transitions) {
        console.log("Program:", transition.program);
        console.log("Function:", transition.function);

        for (const output of transition.outputs) {
            if (output.type === "record") {
                const decrypted = account.decryptRecord(output.value);
                console.log("Decrypted:", decrypted.toString());
            } else if (output.type === "future") {
                console.log("Future:", output.value);
            }
        }
    }
}
```
