---
name: aleo-cli-app
description: Use when building a Node.js CLI tool or script with the Provable SDK — local proving, key caching, credits operations, and devnode testing.
---

# Aleo SDK — CLI Application

## Minimal Working Example

A complete CLI that transfers credits publicly:

```ts
import {
    Account,
    AleoKeyProvider,
    AleoKeyProviderParams,
    initThreadPool,
    ProgramManager,
} from "@provablehq/sdk/testnet.js";
import { CREDITS_PROGRAM_KEYS } from "@provablehq/sdk/testnet.js";

await initThreadPool();

const account = new Account({ privateKey: process.env.ALEO_PRIVATE_KEY });
const programManager = new ProgramManager("https://api.provable.com/v2");
programManager.setAccount(account);
programManager.networkClient.apiKey = process.env.PROVABLE_API_KEY;
programManager.networkClient.consumerId = process.env.PROVABLE_CONSUMER_ID;

const keyProvider = new AleoKeyProvider();
keyProvider.useCache(true);
programManager.setKeyProvider(keyProvider);

const keyParams = new AleoKeyProviderParams({
    cacheKey: CREDITS_PROGRAM_KEYS.getKey("transfer_public").locator,
});

const tx = await programManager.buildExecutionTransaction({
    programName: "credits.aleo",
    functionName: "transfer_public",
    inputs: [process.argv[2], `${process.argv[3]}u64`],
    priorityFee: 0,
    privateFee: false,
    keySearchParams: keyParams,
    program: programManager.creditsProgram().toString(),
});

const txId = await programManager.networkClient.submitTransaction(tx);
console.log("Submitted:", txId);
```

Run: `node --loader ts-node/esm index.ts aleo1recipient... 1000000`

## Account Loading

```ts
// From environment
const account = new Account({ privateKey: process.env.ALEO_PRIVATE_KEY });

// From encrypted ciphertext (safer for storage)
import { Account } from "@provablehq/sdk/testnet.js";
const account = Account.fromCiphertext(ciphertextString, password);
```

## Key Caching

Proving keys are large. Cache them to avoid re-downloading on each run:

```ts
const keyProvider = new AleoKeyProvider();
keyProvider.useCache(true);
programManager.setKeyProvider(keyProvider);

// For credits.aleo functions, use the built-in locators:
import { CREDITS_PROGRAM_KEYS } from "@provablehq/sdk/testnet.js";
const keyParams = new AleoKeyProviderParams({
    cacheKey: CREDITS_PROGRAM_KEYS.getKey("transfer_public").locator,
});

// For custom programs, synthesize keys once and cache:
const keyPair = await programManager.synthesizeKeys(programSource, "my_function", inputs);
programManager.keyProvider.cacheKeys("my_program.aleo:my_function", keyPair);
```

## Two Proving Paths

### Local Proving — full proof on your machine

Requires `initThreadPool()`. Good for development, privacy-sensitive operations, or offline use.

```ts
const tx = await programManager.buildExecutionTransaction({
    programName: "credits.aleo",
    functionName: "transfer_public",
    inputs: [recipient, `${amount}u64`],
    priorityFee: 0,
    privateFee: false,
    keySearchParams: keyParams,
    program: programManager.creditsProgram().toString(),
});
await programManager.networkClient.submitTransaction(tx);
```

### Delegated Proving — offload proof generation to DPS

Build an `Authorization` locally (fast, no heavy compute) and submit to the API for proving.

```ts
const authorization = await programManager.buildAuthorization({
    programName: "credits.aleo",
    functionName: "transfer_public",
    privateKey: account.privateKey(),
    inputs: [recipient, `${amount}u64`],
});

const executionId = authorization.toExecutionId().toString();
const baseFeeMicrocredits = await programManager.estimateFeeForAuthorization({
    programName: "credits.aleo",
    authorization,
});

const feeAuthorization = await programManager.buildFeeAuthorization({
    deploymentOrExecutionId: executionId,
    baseFeeCredits: Number(baseFeeMicrocredits) / 1000000,
    privateKey: account.privateKey(),
});

const tx = await programManager.buildTransactionFromAuthorization({
    programName: "credits.aleo",
    authorization,
    feeAuthorization,
});
await programManager.networkClient.submitTransaction(tx.toString());
```

## Credits Class Pattern

Wrap `credits.aleo` functions into a reusable class (from `template-node-credits-aleo-functions-ts`):

```ts
class Credits {
    private programManager: ProgramManager;
    private keyProvider: AleoKeyProvider;
    private creditsProgram: string;

    constructor(account: Account, apiUrl = "https://api.provable.com/v2") {
        this.programManager = new ProgramManager(apiUrl);
        this.programManager.setAccount(account);
        this.keyProvider = new AleoKeyProvider();
        this.keyProvider.useCache(true);
        this.programManager.setKeyProvider(this.keyProvider);
        this.creditsProgram = this.programManager.creditsProgram().toString();
    }

    private async execute(functionName: string, inputs: string[]) {
        const keyParams = new AleoKeyProviderParams({
            cacheKey: CREDITS_PROGRAM_KEYS.getKey(functionName).locator,
        });
        return this.programManager.buildExecutionTransaction({
            programName: "credits.aleo",
            functionName,
            inputs,
            priorityFee: 0,
            privateFee: false,
            keySearchParams: keyParams,
            program: this.creditsProgram,
        });
    }

    async transferPublic(recipient: string, amount: number) {
        return this.execute("transfer_public", [recipient, `${amount}u64`]);
    }
    // transferPrivate, transferPublicToPrivate, join, split follow the same pattern
}
```

## Local Development with Devnode

```bash
cargo install leo-lang
leo devnode start --private-key APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH
```

Point at `http://localhost:3030`. No `apiKey`/`consumerId` needed locally.
Use `skipProof: true` for fast iteration:

```ts
const programManager = new ProgramManager("http://localhost:3030");
programManager.setAccount(account);

// Deploy
const deployTx = await programManager.buildDevnodeDeploymentTransaction({
    program: programSource,
    priorityFee: 0,
    privateFee: false,
});
await programManager.networkClient.submitTransaction(deployTx);

// Execute (skip proof for speed)
const execTx = await programManager.buildDevnodeExecutionTransaction({
    privateKey: account.privateKey(),
    programName: "my_program.aleo",
    functionName: "my_function",
    inputs: ["1u32", "2u32"],
    priorityFee: 0,
    privateFee: false,
    skipProof: true,
});
await programManager.networkClient.submitTransaction(execTx);
```

## Transaction Confirmation

```ts
const txId = await programManager.networkClient.submitTransaction(tx);
const confirmed = await programManager.networkClient.waitForTransactionConfirmation(txId);
console.log("Confirmed:", confirmed.transaction.id);
```
