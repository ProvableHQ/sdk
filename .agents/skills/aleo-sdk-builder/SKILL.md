---
name: aleo-sdk-builder
description: Build applications with the Provable SDK on Aleo. Use when building
  wallets, CLI tools, web apps, agents, or any application that interacts with the
  Aleo blockchain. Covers transfers, program execution, deployment, key management,
  record scanning, delegated proving, swaps, and local development.
---

# Aleo SDK Builder

## Universal Rules

!`cat ${CLAUDE_SKILL_DIR}/../../.claude/INJECT.md`

If the above did not render, read and follow `.claude/INJECT.md` at the repository root before writing any code.

---

## Quick Start

Every SDK application follows this pattern:

```ts
import { Account, ProgramManager, AleoKeyProvider } from "@provablehq/sdk/testnet.js";

const account = new Account({ privateKey: process.env.ALEO_PRIVATE_KEY });
const pm = new ProgramManager("https://api.provable.com/v2");
pm.setAccount(account);

const keyProvider = new AleoKeyProvider();
keyProvider.useCache(true);
pm.setKeyProvider(keyProvider);
```

**Choose your proving path:**
- **Delegated (recommended):** Build authorization locally, submit to API for proof. No `initThreadPool()`. See [delegated-proving.md](reference/delegated-proving.md).
- **Local:** Generate ZK proof on-device. Requires `initThreadPool()`. See [local-proving.md](reference/local-proving.md).

---

## Capabilities

### 1. Transfers

Four transfer types via `credits.aleo`:

| Function | Direction | Use When |
|----------|-----------|----------|
| `transfer_public` | Public → Public | Default, simple transfers |
| `transfer_private` | Private → Private | Full privacy |
| `transfer_public_to_private` | Public → Private | Shielding funds |
| `transfer_private_to_public` | Private → Public | Unshielding funds |

**Simplest transfer:**
```ts
const txId = await pm.transfer(1.0, "aleo1recipient...", "public", 0, false);
```

For full patterns including the reusable `Credits` class wrapper and `buildExecutionTransaction`, see [transfers.md](reference/transfers.md).

### 2. Execute Arbitrary Programs

```ts
const tx = await pm.buildExecutionTransaction({
    programName: "my_program.aleo",
    functionName: "my_function",
    inputs: ["5u32", "10u32"],
    priorityFee: 0,
    privateFee: false,
});
const txId = await pm.networkClient.submitTransaction(tx);
```

For dynamic dispatch (programs calling other programs), see [swaps.md](reference/swaps.md).

### 3. API Registration

```ts
const response = await fetch("https://api.provable.com/consumers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "my-app-name" }),
});
const { consumer, key } = await response.json();

pm.networkClient.apiKey = key;
pm.networkClient.consumerId = consumer.id;
```

Store `PROVABLE_API_KEY` and `PROVABLE_CONSUMER_ID` in environment variables. JWT refresh is automatic.

### 4. Delegated Proving (DPS)

Build a ProvingRequest locally (fast, no thread pool), submit to API for remote proof generation:

```ts
const provingRequest = await pm.provingRequest({
    programName: "credits.aleo",
    functionName: "transfer_public",
    inputs: ["aleo1recipient...", "1000000u64"],
    priorityFee: 0, privateFee: false, broadcast: true,
});
const response = await pm.networkClient.submitProvingRequest({ provingRequest });
```

Full DPS flow with error handling: [delegated-proving.md](reference/delegated-proving.md).

### 5. Record Scanning (RSS)

```ts
import { RecordScanner } from "@provablehq/sdk/testnet.js";

const scanner = new RecordScanner({ url: "https://api.provable.com/v2", apiKey, consumerId, decryptEnabled: true, autoReRegister: true });
await scanner.register(account.viewKey(), 0);
const record = await scanner.findCreditsRecord(1_000_000, { unspent: true, nonces: [] });
```

Nonce management and multi-record patterns: [records.md](reference/records.md).

### 6. Swaps (DEX Programs)

DEX programs are standard deployed programs. Interact via `buildExecutionTransaction`. For universal AMMs using dynamic dispatch, see [swaps.md](reference/swaps.md).

### 7. Transaction Confirmation

Never assume a submitted transaction is confirmed. Always poll:

```ts
const txId = await pm.networkClient.submitTransaction(tx);
for (let i = 0; i < 60; i++) {
    try {
        const result = await pm.networkClient.getTransaction(txId);
        if (result) { console.log("Confirmed:", result.block_height); break; }
    } catch { /* not yet */ }
    await new Promise(r => setTimeout(r, 2000));
}
```

Inspecting execution outputs and decrypting records: [records.md](reference/records.md).

### 8. Deployment

```ts
const tx = await pm.buildDeploymentTransaction(programSource, 0, false);
const txId = await pm.networkClient.submitTransaction(tx);
```

Local devnode with skip-proof for fast iteration: [deployment.md](reference/deployment.md).

### 9. Key Storage & Encryption

Proving key caching, `PrivateKeyCiphertext` for secure key storage, and libsodium encryption: [keys-and-crypto.md](reference/keys-and-crypto.md).

---

## Verification

After generating code, copy this checklist and check off items:

```
- [ ] Imports use network-specific paths (`@provablehq/sdk/testnet.js` or `/mainnet.js`)
- [ ] Fee estimation uses SDK methods, never hardcoded values
- [ ] Private keys loaded from environment variables, never hardcoded
- [ ] Account cleanup via `account.destroy()` or `using` statement
- [ ] Transaction confirmation includes polling with timeout
- [ ] Record nonces tracked to prevent double-spending
- [ ] `initThreadPool()` only called for local proving (not DPS)
- [ ] Program names end with `.aleo`
```

Run verification scripts:
```bash
npx ts-node ${CLAUDE_SKILL_DIR}/scripts/verify-transfer.ts <output-file>
npx ts-node ${CLAUDE_SKILL_DIR}/scripts/verify-execution.ts <output-file>
npx ts-node ${CLAUDE_SKILL_DIR}/scripts/verify-address.ts <output-file>
```
