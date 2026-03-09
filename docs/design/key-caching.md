---
id: key-caching
title: "Design: Execution Key Caching & Persistence"
---

# Execution Key Caching & Persistence

## Problem

SnarkVM assumes proving and verifying keys persist in a long-running process. In practice, SDK users run ephemeral
processes (serverless functions, CLI tools, web workers) where the VM is created, used, and destroyed. When a process
exits, all synthesized keys are lost.

Key synthesis is the most expensive part of program execution -- often 30+ seconds for complex functions. Without key
persistence, every execution pays this cost, even for the same program and function.

Users faced three problems:
1. No way to retrieve keys from execution methods for custom storage
2. No automatic persistence -- keys were discarded after each execution
3. Manual key management required understanding synthesis, caching, and locator conventions

## Design Goals

- **Zero-config improvement**: Users who add `cacheKeys: true` get automatic key persistence with no other changes
- **Backward compatible**: All existing code works identically; `cacheKeys` defaults to `false`
- **Layered access**: Users can use automatic persistence, manual key extraction, or both
- **No new dependencies**: Built on the existing `KeyStore` interface (PR #1207) and `AleoKeyProvider`

## Architecture

```
                        buildExecutionTransaction({ cacheKeys: true })
                                        |
                                        v
                    +-------------------------------------------+
                    |           TypeScript SDK Layer             |
                    |  ProgramManager.buildExecutionTransaction  |
                    +-------------------------------------------+
                            |                       |
                            v                       v
            +------------------------+    +-------------------+
            |      WASM Layer        |    |  persistKeysToStore()
            | buildExecutionTx-      |    |  (auto-persist to  |
            |   WithKeys()           |    |   KeyStore)        |
            +------------------------+    +-------------------+
                            |                       |
                            v                       v
            +------------------------+    +-------------------+
            | ExecutionTransaction-   |    |    KeyStore       |
            |   Response             |    | (LocalFileKeyStore |
            | { tx, pk?, vk? }       |    |  or custom impl)  |
            +------------------------+    +-------------------+

            Subsequent executions:
            AleoKeyProvider.functionKeys()
                1. Memory cache  -->  hit? return
                2. KeyStore      -->  hit? cache in memory, return
                3. Network/synth -->  fallback
```

## API Surface

### New option: `cacheKeys`

Added to `ExecuteOptions`, used by `buildExecutionTransaction()`, `execute()`, and `run()`.

```typescript
const result = await programManager.buildExecutionTransaction({
    programName: "my_program.aleo",
    functionName: "my_function",
    inputs: ["1u32", "2u32"],
    priorityFee: 0.0,
    privateFee: false,
    cacheKeys: true,  // opt-in to key return + auto-persistence
});

result.transaction;    // Transaction (always present)
result.provingKey;     // ProvingKey | undefined
result.verifyingKey;   // VerifyingKey | undefined
```

When `cacheKeys` is `false` (default), `buildExecutionTransaction` returns `Transaction` directly -- identical to
existing behavior.

TypeScript function overloads enforce this at the type level:

```typescript
// cacheKeys: true  --> returns ExecutionTransactionResult
// cacheKeys: false --> returns Transaction
```

### Auto-persistence

When a `KeyStore` is configured on the `AleoKeyProvider`, keys are automatically persisted after execution:

```typescript
import { AleoKeyProvider, LocalFileKeyStore } from "@provablehq/sdk";

const keyStore = new LocalFileKeyStore("/path/to/keys");
const keyProvider = new AleoKeyProvider(keyStore);
keyProvider.useCache(true);

const programManager = new ProgramManager(networkClient, keyProvider);
programManager.setAccount(account);

// First execution: synthesizes keys, persists to disk
await programManager.execute({
    programName: "my_program.aleo",
    functionName: "my_function",
    inputs: ["1u32", "2u32"],
    cacheKeys: true,
    keySearchParams: { cacheKey: "my_program.aleo:my_function" },
});

// Second execution: loads keys from KeyStore automatically -- no re-synthesis
await programManager.execute({
    programName: "my_program.aleo",
    functionName: "my_function",
    inputs: ["3u32", "4u32"],
    keySearchParams: { cacheKey: "my_program.aleo:my_function" },
});
```

### Key lookup chain

`AleoKeyProvider.functionKeys()` resolves keys in this order:

1. **In-memory cache** -- fastest, populated by `cacheKeys()` or prior lookups
2. **KeyStore** -- persistent storage (file system, database, etc.)
3. **Network fetch / synthesis** -- slowest, used as last resort

Results from the KeyStore are automatically cached in memory for subsequent calls within the same process.

## WASM Layer

A new method `buildExecutionTransactionWithKeys` was added alongside the existing `buildExecutionTransaction` to avoid
breaking the `@provablehq/wasm` public API.

```rust
// Returns ExecutionTransactionResponse { transaction, proving_key?, verifying_key? }
pub async fn execute_with_keys(
    // ... same parameters as execute() ...
    cache: bool,  // controls whether keys are extracted
) -> Result<ExecutionTransactionResponse, String>
```

Key extraction happens after the `execute_program!` macro completes but before the `ProcessNative` goes out of scope.
This is the only window where keys are accessible -- once the process drops, synthesized keys are lost.

### ExecutionTransactionResponse

```rust
pub struct ExecutionTransactionResponse {
    transaction: TransactionNative,
    proving_key: Option<ProvingKeyNative>,
    verifying_key: Option<VerifyingKeyNative>,
}
```

Key accessors use `.take()` semantics (consuming the value). This prevents accidental double-reads and matches the
existing `ExecutionResponse` pattern.

## Locator Convention

Keys are persisted using dot-separated locators:

```
{programName}.{functionName}.prover
{programName}.{functionName}.verifier
```

Example: `my_program.aleo.my_function.prover`

`LocalFileKeyStore.validateLocator()` rejects path separators (`/`, `\`), so dots are used instead of slashes.

## Design Decisions

### Why a new WASM method instead of modifying `execute()`?

The `@provablehq/wasm` package has its own release cycle and public API. Adding a parameter to the existing method would
be a breaking change for any consumer that calls `execute()` positionally. A new method is additive and safe.

### Why `.take()` semantics on key accessors?

Proving keys can be 100+ MB. The `.take()` pattern (returning the value and setting the field to `None`) avoids cloning
large keys. It also makes ownership explicit -- once you've taken a key, you own it and the response no longer holds it.

### Why auto-persist in the SDK layer, not WASM?

The WASM layer has no concept of storage backends. Persistence logic belongs in the TypeScript SDK where `KeyStore`
implementations (file system, IndexedDB, custom) are available. The WASM layer's job is to make keys *available*; the
SDK layer decides what to do with them.

### Why is `cacheKeys` opt-in (`false` by default)?

Key extraction clones the keys from the process, temporarily doubling memory usage for that key. For users who don't
need keys returned, this cost should not be imposed. The default behavior is unchanged from before this feature.

## Considerations

### Memory overhead

When `cacheKeys: true`, proving keys are cloned from the WASM process for return. For large programs, this can
temporarily double memory usage for that key (100+ MB). This matches the existing `executeFunctionOffline(cache=true)`
behavior and is expected.

### Concurrent execution

If multiple executions for the same program/function run concurrently, they may both persist keys simultaneously.
`LocalFileKeyStore` uses atomic writes (temp file + rename), so the last write wins safely. No data corruption occurs.

### Persistence failures are non-blocking

`persistKeysToStore()` catches and logs errors rather than propagating them. A failure to persist keys should not
prevent a successful execution from completing. Keys are still returned in the result object.
