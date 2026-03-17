# Delegated Proving (DPS)

Build an Authorization locally (fast, lightweight — no thread pool needed), then submit
to the Provable API for proof generation. The API returns a ready-to-broadcast transaction.

## Full Flow

```ts
import { Account, AleoKeyProvider, ProgramManager } from "@provablehq/sdk/testnet.js";
// Note: no initThreadPool() needed for delegated proving

const account = new Account({ privateKey: process.env.ALEO_PRIVATE_KEY });
const pm = new ProgramManager("https://api.provable.com/v2");
pm.setAccount(account);
pm.networkClient.apiKey = process.env.PROVABLE_API_KEY;
pm.networkClient.consumerId = process.env.PROVABLE_CONSUMER_ID;

const keyProvider = new AleoKeyProvider();
keyProvider.useCache(true);
pm.setKeyProvider(keyProvider);

// Step 1: Build authorization (fast — signs the execution intent)
const authorization = await pm.buildAuthorization({
    programName: "credits.aleo",
    functionName: "transfer_public",
    inputs: ["aleo1recipient...", "1000000u64"],
});

// Step 2: Get the execution ID and estimate the fee
const executionId = authorization.toExecutionId().toString();
const baseFeeMicrocredits = await pm.estimateFeeForAuthorization({
    programName: "credits.aleo",
    authorization,
});
const baseFeeCredits = Number(baseFeeMicrocredits) / 1_000_000;

// Step 3: Build fee authorization
const feeAuthorization = await pm.buildFeeAuthorization({
    deploymentOrExecutionId: executionId,
    baseFeeCredits,
    priorityFeeCredits: 0,
});

// Step 4: Build the full transaction (submitted to DPS for proving)
const tx = await pm.buildTransactionFromAuthorization({
    programName: "credits.aleo",
    authorization,
    feeAuthorization,
});

// Step 5: Submit to the network
const txId = await pm.networkClient.submitTransaction(tx.toString());
console.log("Submitted:", txId);
```

## When to Use DPS

- Web applications (no heavy compute in the browser)
- CLI tools that need fast execution
- Agent frameworks (lightweight orchestration)
- Any case where proof generation time matters

## When NOT to Use DPS

- Privacy-sensitive operations where you don't trust a third-party prover
- Offline or air-gapped environments
- See [local-proving.md](local-proving.md) for the alternative
