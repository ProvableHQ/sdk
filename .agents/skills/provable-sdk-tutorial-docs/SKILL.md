---
name: provable-sdk-tutorial-docs
description:
    Use when writing tutorial documentation or create-leo-app examples for the
    Provable SDK (@provablehq/sdk). Covers how to structure runnable templates,
    write tutorial-style docs, and handle Node.js vs web runtime differences.
---

# Provable SDK Tutorial Docs

## Overview

This skill guides writing two interconnected artifacts for each SDK feature set:

1. A runnable **create-leo-app template** demonstrating the features
2. **Tutorial documentation** that walks readers through the template

The template and tutorial are the same content expressed two ways — step
numbers, section names, and code structure must correspond exactly.

---

## Step 0: Gather Inputs Before Writing Anything

Require the developer to specify:

| Input                | Description                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------ |
| **Feature bucket**   | Explicit list of SDK features to demonstrate (e.g. "key caching, offline execution, deployment") |
| **Target runtimes**  | `node`, `web`, or `both`                                                                         |
| **Highlight areas**  | What concepts readers should leave understanding — not just what the code does, but WHY          |
| **Complexity level** | beginner / intermediate / advanced — determines how much Aleo/ZK background to assume            |

---

## SDK Runtime Context

Tutorials must open with context about why someone would use the SDK in this
environment. Use the framing below as a guide.

### Node.js

The SDK runs natively in Node — no WASM worker setup needed. Common use cases:

- **Backend servers** that execute web3 functions on behalf of users (e.g.
  building and submitting transactions server-side)
- **Hardware wallets** that execute transactions in an offline setting on behalf
  of users
- **Command-line tools** and scripts for account management, transaction
  creation, or record or chain data inspection, or specialized functions such as
  MPC computations run by web3 service providers
- **Local testing and prototyping** local testing of dapps or web3 service
  prototypes

### Web (Browser)

In browser contexts, the SDK is most commonly used to **supplement features that
wallet adapters don't yet provide**. The
[aleo-wallet-adapter](https://github.com/ProvableHQ/aleo-dev-toolkit/tree/master/packages/aleo-wallet-adaptor)
handles account management and basic transaction signing — developers reach for
the SDK directly when they need:

- Cryptographic hashing (BHP, Pedersen, Poseidon) and mathematics (cryptographic
  math using the Aleo finite field and groups)
- Program and program data introspection (parsing program source, inspecting
  program functions, records and mappings)
- Arbitrary encryption, decryption and signature operations not exposed by the
  wallet.

**Web tutorials must recommend using `aleo-wallet-adapter` alongside the SDK**
for account/signing concerns, transaction execution and should show how the two
integrate where relevant. Do not suggest the SDK replaces the wallet adapter on
the web.

WASM runs in a Web Worker in browsers, this is optional but highly recommend.
Every web template should at least suggestion the worker pattern.

---

## Template Structure Conventions

### Node templates (`template-node-*-ts`)

```
src/index.ts        # Main entry point
src/**              # Any other files that make sense to box different required functionality.
package.json        # yarn start runs src/index.ts
.env.example        # Any required secrets or endpoints
```

- Use top-level `await`, initialize thread pool at the top:
  `await initThreadPool();`
- Organize into named async functions, one per feature.
- Use section headers matching tutorial step numbers:

- ```ts
  // --- STEP 1: Initialize key provider and cache keys. --- //
  ```
- `yarn start` must run successfully without modification (offline features) or
  with only `.env` filled in (network features)

### Web templates (`template-react-*-ts`)

The wallet adapter has this API here:

- https://github.com/ProvableHQ/aleo-dev-toolkit/blob/master/packages/aleo-wallet-adaptor/core/src/adapter.ts
- https://github.com/ProvableHQ/aleo-dev-toolkit/blob/master/packages/aleo-wallet-adaptor/core/src/account.ts

and for web examples, this should be used to do the following.

1. Executing transactions (via the `executeTransaction` method)
2. Creating new accounts (via the `createAccount` method)
3. Polling transaction status (via the `transactionStatus` method)
4. Decrypting ciphertexts from transition inputs and outputs (via the `decrypt`
   method). Note this does not do arbitrary encryption and decryption schemes,
   only decryption of transition inputs and outputs.
5. Record scans via the (via the `requestRecords` method)
6. Executing deployments (via the `executeDeployment` method)

React environments should look here for context on how to invoke wallets via
react:
https://github.com/ProvableHQ/aleo-dev-toolkit/blob/master/packages/aleo-wallet-adaptor/react/src/WalletProvider.tsx

For most create leo app examples (for now) there should be the ability to
execute any of the above functions optionally via the wallet AND via native SDK
methods (where the wallet is preferred).

```
src/
  App.tsx                   # UI — calls worker, manages state
  **                        # Any other files that make sense to organize functionality and features.
  workers/AleoWorker.ts     # All SDK calls go here, exposed via Comlink
vite.config.ts
.env.example
```

- All `@provablehq/sdk` imports and calls live in `AleoWorker.ts` — never in
  `App.tsx`
- Expose worker methods via Comlink; `App.tsx` or any other file calls them like
  async functions
- `initThreadPool()` runs inside the worker, not in the main thread
- Show loading/progress state in the UI for any proving operation (these take
  time)
- Use `aleo-wallet-adapter` for account connection; the SDK worker handles the
  supplemental operations

### Both runtimes

- Imports are always network-specific: `@provablehq/sdk/testnet.js` or
  `/mainnet.js` — never the bare package
- Each feature in the bucket gets its own clearly named function — no
  interleaved logic
- Error handling must be explicit; ZK errors are opaque, surface them with
  context:
    ```ts
    } catch (e) {
      throw new KeySynthesisError(`Failed to synthesize keys: ${e}`);
    }
    ```

---

## Feature Coverage Rules

For each feature in the bucket:

1. Show the **minimal working example** first, then advanced usage
2. Cover **both node and web** unless the feature is inherently
   platform-specific
3. State the **expected output** — what does `yarn start` print? What does the
   UI show?
4. Explain **why** non-obvious SDK calls exist (see Code-Doc Correspondence
   below)

---

## Tutorial Documentation Structure

Every tutorial follows this shape:

### 1. Overview (1 paragraph)

What the reader will build. Which features from the bucket are covered. Link to
the template.

### 2. Runtime context (1–2 sentences)

Why a developer would use the SDK in this runtime for this use case. Reference
the framing from the Runtime Context section above. For web tutorials, mention
`aleo-wallet-adapter` and its relationship to the SDK.

### 3. Prerequisites

- Node version
- Aleo credits (if network calls are involved)
- Required `.env` values and where to get them
- For web: note that `aleo-wallet-adapter` is needed for account connection

### 4. Concepts

Plain-English explanation of each feature before showing code. This is where
Highlight Areas from the developer's inputs go. Assume only the complexity level
specified — don't assume ZK/cryptography knowledge for beginner tutorials.

### 5. Step-by-step walkthrough

One section per step, numbered to match the template's section headers. For each
step:

- What the code does
- **Why** it does it (not just what)
- The relevant code snippet

### 6. Running it

Exact commands. Expected output copied from an actual run.

### 7. Next steps

Links to related templates, the wallet adapter docs (web only), and relevant SDK
API docs.

### Tone

Third person replacing "you" with appropriate 3rd party nouns, tutorial style:
"callers should notice...", "this tells the SDK to...", "here the keys are
cached because...". Not API reference style. Not first person.

---

## Code-Doc Correspondence Rules

- Step numbers in template comments **must match** step numbers in the tutorial
  — they are the same document expressed two ways
- Every non-obvious SDK call in the template requires a "why" explanation in the
  tutorial. Examples of calls that always need a "why":
    - `initThreadPool()` — why it exists, what happens without it
    - `keyProvider.cacheKeys(...)` — why caching matters (proving key synthesis
      is slow)
    - `OfflineQuery` — what it replaces and when to use it
    - `buildDeploymentTransaction` vs `deploy` — the distinction between
      building and submitting
- **No unexplained magic**: if a call is in the template, it is explained in the
  tutorial

---

## Quality Checklist

Before the tutorial is done:

- [ ] Template runs with `yarn start` without modification (or only `.env`
      needed)
- [ ] Every feature in the bucket is implemented in each target runtime
- [ ] Step numbers align between template comments and tutorial sections
- [ ] Expected output is shown in the tutorial (copied from a real run)
- [ ] Every non-obvious SDK call has a "why" in the tutorial
- [ ] `.env.example` provided for any secrets or endpoints
- [ ] Web tutorials mention `aleo-wallet-adapter` and its role
- [ ] Web templates keep all SDK calls inside the worker
- [ ] Runtime context section explains why a developer would use the SDK here
