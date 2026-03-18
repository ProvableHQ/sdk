# Delegated Proving (DPS)

Build a `ProvingRequest` locally (fast, lightweight — no thread pool needed), then submit
to the Provable API for remote proof generation. The API returns a completed transaction.

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

// Step 1: Build a ProvingRequest (lightweight — packages the execution intent)
const provingRequest = await pm.provingRequest({
    programName: "credits.aleo",
    functionName: "transfer_public",
    inputs: ["aleo1recipient...", "1000000u64"],
    priorityFee: 0,
    privateFee: false,
    broadcast: true,  // Have the DPS broadcast the transaction after proving
});

// Step 2: Submit the ProvingRequest to the DPS for remote proof generation
const response = await pm.networkClient.submitProvingRequest({
    provingRequest,
});

// response contains the proven transaction (and broadcast result if broadcast: true)
console.log("Proving response:", response);
```

## ProvingRequest Options

```ts
const provingRequest = await pm.provingRequest({
    programName: "credits.aleo",
    functionName: "transfer_public",
    inputs: ["aleo1recipient...", "1000000u64"],
    priorityFee: 0,
    privateFee: false,
    broadcast: false,       // false = get the proven tx back without broadcasting
    unchecked: false,       // true = skip input validation (advanced)
    baseFee: 0,             // override base fee (optional, estimated if omitted)
    useFeeMaster: false,    // use DPS fee master account (optional)
});
```

## Safe Submission (No Throw)

Use `submitProvingRequestSafe` for structured error handling:

```ts
const result = await pm.networkClient.submitProvingRequestSafe({
    provingRequest,
});

if (result.ok) {
    console.log("Success:", result.data);
} else {
    console.error("Failed:", result.error.message);
    console.error("Status:", result.status);
}
```

## Authorization Flow (Local Proving from Authorization)

If you need to build an authorization first (e.g., for fee estimation or inspection)
and then prove locally, use `buildTransactionFromAuthorization`:

```ts
// Step 1: Build authorization
const authorization = await pm.buildAuthorization({
    programName: "credits.aleo",
    functionName: "transfer_public",
    inputs: ["aleo1recipient...", "1000000u64"],
});

// Step 2: Estimate fee
const executionId = authorization.toExecutionId().toString();
const baseFeeMicrocredits = await pm.estimateFeeForAuthorization({
    programName: "credits.aleo",
    authorization,
});

// Step 3: Build fee authorization
const feeAuthorization = await pm.buildFeeAuthorization({
    deploymentOrExecutionId: executionId,
    baseFeeCredits: Number(baseFeeMicrocredits) / 1_000_000,
    priorityFeeCredits: 0,
});

// Step 4: Execute locally (this does LOCAL proving, not DPS)
const tx = await pm.buildTransactionFromAuthorization({
    programName: "credits.aleo",
    authorization,
    feeAuthorization,
});

const txId = await pm.networkClient.submitTransaction(tx);
```

> **Note:** `buildTransactionFromAuthorization` performs **local proving** via
> `WasmProgramManager.executeAuthorization`. It does NOT submit to DPS.
> For true delegated proving, use `pm.provingRequest()` +
> `pm.networkClient.submitProvingRequest()` as shown in the Full Flow above.

## When to Use DPS

- Web applications (no heavy compute in the browser)
- CLI tools that need fast execution
- Agent frameworks (lightweight orchestration)
- Any case where proof generation time matters

## When NOT to Use DPS

- Privacy-sensitive operations where you don't trust a third-party prover
- Offline or air-gapped environments
- See [local-proving.md](local-proving.md) for the alternative
