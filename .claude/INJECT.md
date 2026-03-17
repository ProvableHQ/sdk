# Aleo SDK — Universal Rules

These rules apply to ALL code generated using the Provable SDK. Read and follow them
regardless of which skill, template, or context you are working in.

## Imports

Always use network-specific imports — never the bare package:
```ts
import { ... } from "@provablehq/sdk/testnet.js";  // correct
import { ... } from "@provablehq/sdk";              // incorrect
```

## Production API

Use `https://api.provable.com/v2` as the host. `AleoNetworkClient` appends the network
automatically — pass the base URL only:
```ts
const client = new AleoNetworkClient("https://api.provable.com/v2");
// resolves to https://api.provable.com/v2/testnet or /mainnet automatically
```
If constructing URLs manually: `https://api.provable.com/v2/testnet` or `.../mainnet`.

API docs: https://docs.provable.com/docs/api/v2/intro

## API Authentication

Register once to get an `apiKey` and `consumerId`. Use SDK methods — not raw HTTP:
```ts
// Registration — returns { consumer: { id }, key, id, created_at }
// POST https://api.provable.com/consumers  { username: "..." }

// Set credentials on the client — JWT is refreshed automatically when needed
client.apiKey = process.env.PROVABLE_API_KEY;
client.consumerId = process.env.PROVABLE_CONSUMER_ID;
// client.jwtData is populated automatically on first authenticated call
```

`RecordScanner` follows the same pattern: set `apiKey` and `consumerId` via constructor
options or `setApiKey()` / `setConsumerId()`. JWT refresh is handled internally.

## Services

- **DPS (delegated proving):** `AleoNetworkClient.submitProvingRequest()` / `submitProvingRequestSafe()`.
  Set `client.proverUri` or pass per-call. Defaults to host if not set.
- **Record scanning:** `RecordScanner` class. Register a view key with `register()` or
  `registerEncrypted()` before scanning.

## Input Processing

When using programs that employ dynamic dispatch (calling other programs), string
literals in field-typed positions must be converted to field elements. Use
`synthesizeKeys` or the appropriate input conversion utilities available on
`ProgramManager`. Check the current branch for the latest API — this area is
under active development on `feat/dynamic-dispatch`.

## Key Hygiene

- Construct `PrivateKey` objects immediately — never route raw key strings through logic
- Use `ViewKey` for all read-only operations; never use the private key when a view key suffices
- Never log, serialize, or transmit private key material
- Always call `account.destroy()` or use `using` statement for deterministic cleanup
- Include key cleanup in `finally` blocks to prevent memory leaks on errors

## WASM Initialization

Call `await initThreadPool()` before cryptographic operations that require local proving.
Multi-threading is not required for all contexts:
- **Delegated proving (DPS):** No `initThreadPool()` needed — authorizations are lightweight
- **Local proving:** `initThreadPool()` required before any proving call
- **Browser extensions:** Must be called inside a Web Worker (not service worker)

## Fee Management

- NEVER hardcode fee amounts — always use `estimateExecutionFee()` or `estimateDeploymentFee()`
  or `estimateFeeForAuthorization()` to get the base fee
- Always include a `priorityFee` parameter (even if 0)
- Handle insufficient balance errors before attempting transactions:
  ```ts
  const balance = await client.getPublicBalance(account.address().to_string());
  if (balance < requiredAmount) {
      throw new Error(`Insufficient balance: have ${balance}, need ${requiredAmount}`);
  }
  ```

## Record Management

- Track used nonces to avoid double-spending records
- After finding an input record, exclude its nonce when finding the fee record:
  ```ts
  const inputRecord = await recordProvider.findCreditsRecord(amount, { unspent: true, nonces: [] });
  const feeRecord = await recordProvider.findCreditsRecord(fee, { unspent: true, nonces: [inputRecord.nonce()] });
  ```
- Handle `RecordNotFoundError` by checking balance first
- Use `RecordScanner.findCreditsRecord()` with `unspent: true` for production use

## Transaction Confirmation

- Never assume a transaction is confirmed after `submitTransaction()` returns
- Always poll for confirmation with a timeout:
  ```ts
  const txId = await client.submitTransaction(tx);
  // Poll for confirmation
  let confirmed = false;
  for (let i = 0; i < 60; i++) {
      try {
          const result = await client.getTransaction(txId);
          if (result) { confirmed = true; break; }
      } catch { /* not confirmed yet */ }
      await new Promise(r => setTimeout(r, 2000));
  }
  ```
- Handle the timeout case — the transaction may still confirm later

## Privacy Considerations

- Default to private operations when the user doesn't specify a preference
- Warn when generating code that uses public operations (balances and transfers visible on-chain)
- Never expose view keys unnecessarily — use the minimum permission level required
- Prefer `transfer_private` over `transfer_public` unless public balances are explicitly needed

## Network Awareness

- Always specify network explicitly (`testnet` or `mainnet`) in imports and configuration
- Default to `testnet` for examples and development unless the user explicitly requests `mainnet`
- Mainnet operations involve real funds — confirm with the user before proceeding
- Use `http://localhost:3030` for local devnode development (no API key needed)

## Local Development Node

```bash
cargo install leo-lang
leo devnode start --private-key <FUNDED_KEY>
```
Point `AleoNetworkClient` at `http://localhost:3030`. No `apiKey`/`consumerId` needed locally.
