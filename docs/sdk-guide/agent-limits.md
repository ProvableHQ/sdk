# Agent Limits & Bounds

How spending limits, record verification, and execution validation compose into a
pre-flight/post-flight pipeline for agent transactions.

## Transaction Pipeline

### Pre-flight (before building the transaction)

1. **PolicyGuard.checkTransfer(amount, fee)** — reject if amount exceeds per-tx or cumulative limit
2. **PolicyGuard.checkExecution(program, function, fee)** — reject if program not in allowlist or fee exceeds limit
3. **ProgramManager.checkFee(address, feeAmount)** — reject if public balance is insufficient
4. **ProgramManager.checkFeeWithRecords(feeAmount, nonces)** — reject if no private record (when privateFee)
5. **RecordScanner.verifyRecordUnspent(record)** — reject if input record already spent

### Execution

6. Transaction built and submitted (SDK or DPS)

### Post-flight (after successful submission)

7. **PolicyGuard.recordSpend(amount)** — update cumulative tracking
8. **verifyExecutionDiagnostic(response, blockHeight)** — confirm proof validity (returns `VerificationResult`)
9. **checkExecutionOutputs(outputs, checks)** — confirm outputs match expectations

## Bounds Memory

- `PolicyGuard.spent` tracks cumulative spending per session (in-memory)
- `NonceTracker` tracks used record nonces per session (in-memory)
- Both reset when the agent session ends
- MCP server can persist both across sessions via its own storage if needed

### Introspection

```typescript
// Check remaining budget before attempting a transaction
guard.remainingBudget(); // number (Infinity if no limit set)

// Get audit-friendly snapshot
guard.toJSON();
// { spent: 5000000, limit: 100000000, remaining: 95000000 }

// Check tracked nonces
tracker.toExcludeList(); // ["nonce1", "nonce2"]
tracker.size;            // 2
```

## Error Types

| Error | Code | Retryable | When |
|-------|------|-----------|------|
| `InsufficientBalanceError` | `INSUFFICIENT_BALANCE` | No | Public balance < fee |
| `FeeRecordNotFoundError` | `RECORD_NOT_FOUND` | No | No private record with enough balance |
| `PolicyViolationError` | `POLICY_VIOLATION` | No | Amount or program exceeds configured limit |
| `AccountNotSetError` | `ACCOUNT_NOT_SET` | No | No private key configured |
| `ProgramAlreadyExistsError` | `PROGRAM_ALREADY_EXISTS` | No | Deploy of existing program |
| `NetworkError` | `NETWORK_ERROR` | Yes | Network request failed |
| `RateLimitedError` | `RATE_LIMITED` | Yes | API rate limit hit |
| `ExecutionVerificationError` | `VERIFICATION_FAILED` | No | Proof verification failed |
| `KeyVerificationError` | `KEY_VERIFICATION_FAILED` | No | Key integrity check failed |

All errors extend `SDKError` which provides `code`, `retryable`, and optional `retryAfterMs`.
