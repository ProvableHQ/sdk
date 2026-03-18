# Agent Security & Verification

Security rules and verification patterns for AI agents interacting with the Aleo blockchain
through the Provable SDK. These apply to MCP servers, AgentKit integrations, and any autonomous
agent that manages keys or submits transactions.

## Private Key Security

- Never pass private keys through LLM context — use the MCP keystore (name-only references).
- Always call `account.destroy()` or use the `using` statement for deterministic cleanup.
- Include key cleanup in `finally` blocks when handling keys manually.
- Prefer DPS (delegated proving) over local proving to minimize key exposure time.
- Never log, print, or embed private keys in generated code.

## Execution Verification

After executing a program, verify the proof is valid:

```typescript
import { verifyExecutionDiagnostic } from "@provablehq/sdk/mainnet.js";

const result = verifyExecutionDiagnostic(executionResponse, blockHeight, imports, importedVerifyingKeys);
if (!result.valid) {
    console.error(`Verification failed: ${result.error}`);
}
```

- `verifyExecutionDiagnostic()` returns a `VerificationResult` with diagnostic error messages.
- After local proving, verification is called automatically during transaction construction.
- For offline-built transactions, call `verifyExecutionDiagnostic()` before submitting.

### Output Validation

Use `checkExecutionOutputs()` to confirm outputs match expected structure:

```typescript
import { checkExecutionOutputs } from "@provablehq/sdk/mainnet.js";

const result = checkExecutionOutputs(outputs, [
    { transitionIndex: 0, outputIndex: 0, expectedType: "record" },
    { transitionIndex: 0, outputIndex: 1, expectedType: "public", expectedValue: "1000u64" },
]);
if (!result.passed) {
    console.error("Output check failures:", result.failures);
}
```

## Key Verification

Initialize `AleoKeyProvider` with a `KeyVerifier` for integrity checks:

```typescript
import { AleoKeyProvider, MemKeyVerifier } from "@provablehq/sdk/mainnet.js";

const keyProvider = new AleoKeyProvider({
    keyVerifier: new MemKeyVerifier(),
    cacheTtlMs: 30 * 60 * 1000, // 30 minute cache TTL
});
keyProvider.useCache(true);
```

- Cached keys are fingerprinted on first access and verified against stored fingerprints on subsequent access.
- TTL cache expiration triggers refetch + re-verification.
- Use `ProgramManager.setKeyStore(keyStore)` to enable persistent, integrity-verified storage.

## Record Verification

Verify records are unspent before building transactions:

```typescript
const scanner = new RecordScanner(options);

// Ensure registration (idempotent — safe to call every time)
const uuid = await scanner.ensureRegistered(viewKey);

// Verify a specific record is still unspent
const { unspent, tag, checkedAt } = await scanner.verifyRecordUnspent(record);
if (!unspent) {
    console.error(`Record ${tag} has been spent`);
}
```

Use `NonceTracker` to prevent double-spending across multi-step operations:

```typescript
import { NonceTracker } from "@provablehq/sdk/mainnet.js";

const tracker = new NonceTracker();

// Find input record, mark nonce as used
const inputRecord = await recordProvider.findCreditsRecord(amount, {
    nonces: tracker.toExcludeList(),
});
tracker.use(inputRecord.nonce);

// Find fee record — input record's nonce is excluded
const feeRecord = await recordProvider.findCreditsRecord(feeAmount, {
    nonces: tracker.toExcludeList(),
});
tracker.use(feeRecord.nonce);
```

Use `checkFeeWithRecords()` for private fee pre-checks:

```typescript
// Verify a private fee record exists before building the transaction
await programManager.checkFeeWithRecords(feeAmount, tracker.toExcludeList());
```

## Spending Limits

Initialize `PolicyGuard` with spending limits before agent workflows:

```typescript
import { PolicyGuard } from "@provablehq/sdk/mainnet.js";

const guard = new PolicyGuard({
    maxTransferPerTx: 10_000_000,     // 10 credits per transfer
    maxCumulativeSpend: 100_000_000,  // 100 credits total per session
    allowedPrograms: ["credits.aleo"],
    maxPriorityFee: 1_000_000,
});

// Pre-flight check
guard.checkTransfer(amount, priorityFee);

// After successful submission
guard.recordSpend(amount + priorityFee);

// Check remaining budget
console.log(guard.toJSON());
// { spent: 5100000, limit: 100000000, remaining: 94900000 }
```

## Error Handling

All agent-relevant errors extend `SDKError` with machine-readable codes:

```typescript
import {
    SDKError,
    InsufficientBalanceError,
    FeeRecordNotFoundError,
    PolicyViolationError,
} from "@provablehq/sdk/mainnet.js";

try {
    await programManager.transfer(params);
} catch (e) {
    if (e instanceof PolicyViolationError) {
        // Policy limit exceeded — do not retry
        console.log(e.code, e.retryable); // "POLICY_VIOLATION", false
    } else if (e instanceof InsufficientBalanceError) {
        // Not enough balance — check available vs required
        console.log(`Need ${e.required}, have ${e.available}`);
    } else if (e instanceof SDKError && e.retryable) {
        // Transient error — safe to retry after e.retryAfterMs
    }
}
```
