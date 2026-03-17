---
name: aleo-sdk-builder
description: Build applications with the Provable SDK on Aleo. Use when building
  wallets, CLI tools, web apps, agents, or any application that interacts with the
  Aleo blockchain. Covers transfers, program execution, deployment, key management,
  record scanning, delegated proving, swaps, and local development.
---

# Aleo SDK Builder

Before writing any code, read the canonical SDK guide at `docs/sdk-guide/README.md`.
It contains universal rules, the quick start pattern, and a verification checklist
that apply to all SDK code regardless of target platform.

## Detailed Guides

For capability-specific patterns and working code examples, see:

- [Transfers](../../../docs/sdk-guide/transfers.md) — public, private, shield, unshield
- [Delegated Proving](../../../docs/sdk-guide/delegated-proving.md) — DPS flow (recommended)
- [Local Proving](../../../docs/sdk-guide/local-proving.md) — on-device ZK proofs
- [Records](../../../docs/sdk-guide/records.md) — scanning, nonce management, decryption
- [Deployment](../../../docs/sdk-guide/deployment.md) — deploy programs and devnode workflows
- [Swaps](../../../docs/sdk-guide/swaps.md) — DEX interaction and dynamic dispatch
- [Keys & Crypto](../../../docs/sdk-guide/keys-and-crypto.md) — key caching, storage, encryption

## Verification

After generating code, run the verification scripts:
```bash
npx ts-node ${CLAUDE_SKILL_DIR}/scripts/verify-transfer.ts <output-file>
npx ts-node ${CLAUDE_SKILL_DIR}/scripts/verify-execution.ts <output-file>
npx ts-node ${CLAUDE_SKILL_DIR}/scripts/verify-address.ts <output-file>
```
