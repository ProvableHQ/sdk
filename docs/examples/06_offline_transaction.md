This example demonstrates how to create an offline transaction for a non-credits Aleo program.
This example presumes that a program called `demo_program.aleo` has been deployed to a testnet (local or production testnet).

Aleo Program
```leo
program demo_program.aleo {
    @noupgrade
    async constructor() {}

    record BasicRecord {
        owner: address,
        sum: u32,
    }

    transition basic_mint(public a: u32, b: u32) -> BasicRecord {
        let c: u32 = a + b;
        return BasicRecord { owner: self.caller, sum: c};
    }
}
```


```typescript
import { Account, AleoKeyProvider, CREDITS_PROGRAM_KEYS, initThreadPool, KeyStorageManager, OfflineKeyProvider, OfflineSearchParams, ProgramManager, ProvingKey, VerifyingKey } from '@provable.sdk';

// Initialize multi-threading to allow WASM execution.
await initThreadPoool();

// Create an account.
const account = new Account();

// Create an Aleo Key Provider to fetch the proving and verifying keys for transfer public and fee public methods.
const keyProvider = new OfflineKeyProvider();

// Load keys from storage using the Offline Key Provider
const basicMintKeyBytes = KeyStorageManager.loadKeysFromDisk("./KEY_DIR/basic_mint.prover", "./KEY_DIR/basic_mint.verifier");

const basicMintKeys = [Prover.fromBytes(basicMintKeyBytes[0]), Verifier.fromBytes(basicMintKeyBytes[1])];

// Store the keys in cache
keyProvider.cacheKeys("demo_program.aleo/basic_mint", basicMintKeys);

// Create an account.
const account = new Account();

// Create program manager using the KeyProvider and NetworkProvider.
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider);
// Set the account as the program caller.
programManager.setAccount(account);

// Create recipient account.
const recipient = new Account();

// Build a transfer_public transaction.
// Publicly send 5 microcredits to the recipient
const transaction = await programManager
  .buildExecutionTransaction(
    progranName: "demo_program.aleo",
    functionName: "basic_mint",
    priorityFee: 0.0,
    privateFee: false,
    inputs: ["5u32", "5u32"],
    keySearchParams: {"cacheKey": "demo_program:basic_mint"},
  );
```