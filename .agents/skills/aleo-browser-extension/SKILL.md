---
name: aleo-browser-extension
description: Use when building a Chrome browser extension with the Provable SDK — offscreen document setup, local vs delegated proving, key storage, and record scanning.
---

# Aleo SDK — Browser Extension

## Core Setup

The SDK cannot run in a service worker (no `SharedArrayBuffer`, no top-level `await`).
The working pattern: service worker creates an offscreen document, which spawns a Web Worker
where the SDK actually runs.

**manifest.json:**
```json
{
  "manifest_version": 3,
  "background": {
    "service_worker": "./js/service_worker.js",
    "type": "module"
  },
  "permissions": ["offscreen"],
  "content_security_policy": {
    "extension_pages": "default-src 'self' 'wasm-unsafe-eval'; connect-src https://api.provable.com"
  }
}
```

**service_worker.js** — creates the offscreen document, does no SDK work itself:
```js
async function createOffscreen(path) {
    const offscreenUrl = chrome.runtime.getURL(path);
    const existingContexts = await chrome.runtime.getContexts({
        contextTypes: ["OFFSCREEN_DOCUMENT"],
        documentUrls: [offscreenUrl]
    });
    if (existingContexts.length > 0) return;
    await chrome.offscreen.createDocument({
        url: offscreenUrl,
        reasons: ["WORKERS"],
        justification: "Top-level await and Workers cannot be used in service workers, but they are necessary to use the Provable SDK.",
    });
}
createOffscreen("offscreen.html");
```

**offscreen.js** — bridges to the worker:
```js
new Worker(new URL("worker.js", import.meta.url), { type: "module" });
```

**worker.js** — all SDK code lives here:
```js
import { Account, initThreadPool, ProgramManager } from "@provablehq/sdk/testnet.js";

await initThreadPool(); // only needed for local proving — see below
```

## Two Proving Paths

### Delegated Proving — no threading required

Build an `Authorization` locally (light compute — no thread pool needed) and submit
to the Provable API. The API does the proof generation.

```js
// worker.js
import { ProgramManager, AleoKeyProvider } from "@provablehq/sdk/testnet.js";
// Note: no initThreadPool() needed for this path

const programManager = new ProgramManager("https://api.provable.com/v2");
programManager.networkClient.apiKey = await getStoredApiKey();
programManager.networkClient.consumerId = await getStoredConsumerId();

// Build authorization (fast, no proving)
const authorization = await programManager.buildAuthorization({
    programName: "credits.aleo",
    functionName: "transfer_public",
    privateKey,
    inputs: [recipient, `${amount}u64`],
});

// Estimate fee
const executionId = authorization.toExecutionId().toString();
const baseFeeMicrocredits = await programManager.estimateFeeForAuthorization({
    programName: "credits.aleo",
    authorization,
});
const baseFeeCredits = Number(baseFeeMicrocredits) / 1000000;

// Build fee authorization and assemble transaction
const feeAuthorization = await programManager.buildFeeAuthorization({
    deploymentOrExecutionId: executionId,
    baseFeeCredits,
    privateKey,
});
const tx = await programManager.buildTransactionFromAuthorization({
    programName: "credits.aleo",
    authorization,
    feeAuthorization,
});

await programManager.networkClient.submitTransaction(tx.toString());
```

### Local Proving — threading required

`initThreadPool()` must run in the worker before any proving call.
This is why the SDK must live in the offscreen worker, not the service worker.

```js
// worker.js
import { Account, initThreadPool, ProgramManager, AleoKeyProvider,
         AleoKeyProviderParams } from "@provablehq/sdk/testnet.js";

await initThreadPool();

const programManager = new ProgramManager();
programManager.setAccount(new Account());

const keyProvider = new AleoKeyProvider();
keyProvider.useCache(true);
programManager.setKeyProvider(keyProvider);

const tx = await programManager.buildExecutionTransaction({
    programName: "credits.aleo",
    functionName: "transfer_public",
    priorityFee: 0,
    privateFee: false,
    inputs: [recipient, `${amount}u64`],
    program: programManager.creditsProgram().toString(),
});
await programManager.networkClient.submitTransaction(tx);
```

## Offering Both Paths (SHIELD Pattern)

Store user preference and route accordingly in the worker:

```js
const mode = (await chrome.storage.sync.get("provingMode")).provingMode ?? "delegated";

if (mode === "local") {
    await initThreadPool();
    // local proving path
} else {
    // delegated proving path — no thread pool
}
```

## Key Storage

Never store plaintext keys. Encrypt before writing to `chrome.storage.local`:

```js
import { PrivateKeyCiphertext } from "@provablehq/sdk/testnet.js";

// Store
const encrypted = PrivateKeyCiphertext.encryptPrivateKey(privateKey, password);
await chrome.storage.local.set({ encryptedKey: encrypted.toString() });

// Load
const { encryptedKey } = await chrome.storage.local.get("encryptedKey");
const privateKey = PrivateKeyCiphertext.fromString(encryptedKey)
    .decryptToPrivateKey(password);
```

## Record Scanning

```js
import { RecordScanner } from "@provablehq/sdk/testnet.js";

const scanner = new RecordScanner({
    url: "https://api.provable.com/v2",
    apiKey: await getStoredApiKey(),
    consumerId: await getStoredConsumerId(),
    decryptEnabled: true,
    autoReRegister: true,
});
await scanner.register(viewKey, lastScannedBlock);
const feeRecord = await scanner.findCreditsRecord(feeAmount, true, [], {});
```

## Local Development

```bash
leo devnode start --private-key <FUNDED_KEY>
```
Point `ProgramManager` at `http://localhost:3030`. No `apiKey`/`consumerId` needed locally.
