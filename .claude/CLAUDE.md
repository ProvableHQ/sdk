# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Yarn monorepo for the **Provable SDK** — a TypeScript/Rust SDK for building zero-knowledge applications on the Aleo 
blockchain. The SDK re-exports core protocol objects from SnarkVM to allow users to perform operations related to their
accounts and execute Aleo programs. Main published packages: `@provablehq/sdk` and `@provablehq/wasm` (both v0.10.0).

**Workspaces:** `sdk`, `wasm`, `create-leo-app`

## Key Build Commands

```bash
# Build this command anytime changes are made to the rust/wasm code.
yarn build:all

# Build this command anytime changes are made to the SDK code without making changes to the rust/wasm code.
yarn build:sdk            # Bundles TypeScript SDK with Rollup

# Code style
yarn pretty               # Auto-format with Prettier
yarn lint                 # Check formatting only
```

`wasm` must be built before `sdk` — the SDK depends on the compiled WASM output.

## Test Commands

```bash
# All tests
yarn test

# Per-package
yarn test:wasm            # cd wasm && node test.js
yarn test:sdk             # cd sdk && yarn test

# What sdk test does internally:
# 1. rimraf tmp
# 2. rollup -c rollup.test.js  (bundles tests into sdk/tmp/)
# 3. mocha tmp/**/*.test.js --timeout 60000
# 4. RUN_SKIPPED=true mocha tmp/**/wasm.test.js --timeout 60000 --grep Consensus

# Run a single test file (must bundle first):
cd sdk && rimraf tmp && rollup -c rollup.test.js && mocha tmp/account.test.js --timeout 60000
```

**Test framework:** Mocha + Chai + Sinon. Tests in `sdk/tests/` are bundled by `rollup.test.js` into `sdk/tmp/` before Mocha runs them. Network integration tests (`.integration.ts` files) are skipped by default. Test data lives in `sdk/tests/data/`.

## Architecture

### Package: `@provablehq/wasm` (`/wasm`)

Rust crate compiled to WebAssembly via `wasm-bindgen`. Wraps [snarkvm](https://github.com/AleoHQ/snarkvm) to expose Aleo cryptographic primitives to JavaScript. Built by `node build.js` (Rollup + `@wasm-tool/rollup-plugin-rust`). Outputs `dist/testnet/` and `dist/mainnet/`.

Key Rust modules in `wasm/src/`:
- `account/` — Account objects PrivateKey, ViewKey, ComputeKey, Address, Signature, Encryptor
- `programs/manager/` — builds execution proofs, authorizations, proving requests and new aleo program deployments
- `programs/` — Program, execution, keypair, offline_query
- `synthesizer/` — Authorization, ProvingRequest
- `types/` — Aleo scalar types (Field, Group, Scalar, I8–I128, U8–U128, Boolean) + type re-exports from SnarkVM
- `algorithms/` — BHP256/512/768/1024, Pedersen64/128, Poseidon2/4/8
- `record/` — RecordPlaintext, RecordCiphertext
- `ledger/` — Transaction, Transition

### Package: `@provablehq/sdk` (`/sdk`)

TypeScript SDK wrapping `@provablehq/wasm`. Bundled with Rollup into three network variants (`testnet`, `mainnet`, `dynamic`), each with `browser.js` and `node.js` exports.

Key source files in `sdk/src/`:
- `wasm.ts` — Re-exports all WASM types; the bridge between Rust types and TS. Uses `%%NETWORK%%` in the import path.
- `account.ts` — `Account` class: key derivation, signing, ciphertext import/export
- `network-client.ts` — `AleoNetworkClient`: REST calls to Aleo nodes + DPS integration (JWT auth, encrypted proving)
- `program-manager.ts` — Orchestrates deploy, execute, transfer; wraps `WasmProgramManager`
- `record-provider.ts` — `NetworkRecordProvider`: fetching and decrypting user records
- `record-scanner.ts` — Record scanning service integration (registration, revocation, filtering)
- `security.ts` — libsodium-based encryption for DPS and RSS (`crypto_box_seal` for Authorization, ProvingRequest, ViewKey)
- `constants.ts` — Credit program keys, transfer types, timing constants
- `utils.ts` — `retryWithBackoff`, HTTP helpers, environment detection
- `browser.ts` / `node.ts` — Runtime entry points (set up polyfills, re-export)

**Key subdirectories in `sdk/src/`:**
- `keys/provider/` — `FunctionKeyProvider` interface, `AleoKeyProvider` (memory/network), `OfflineKeyProvider`
- `keys/keystore/` — Key storage interface and file-based implementation
- `keys/verifier/` — Verifying key interface and memory implementation
- `models/` — TypeScript types for transactions, deployments, executions, records, DPS, record scanner, plaintext
- `models/record-scanner/` — Registration, filtering, and result types for the record scanner service
- `integrations/sealance/` — Sealance Merkle tree integration

### Network Variants & Build System

`rollup.config.js` builds `testnet` and `mainnet` separately via `@rollup/plugin-replace`, substituting:
- `%%NETWORK%%` → `testnet` or `mainnet` (used in `wasm.ts` import and test files)
- `%%VERSION%%` → package version

The `dynamic` variant is **auto-generated** by `buildRuntimes()` in `rollup.config.js` — it writes `dist/dynamic/browser.js` and `dist/dynamic/node.js` that dynamically import either network at runtime via `loadNetwork(name)`. This generation runs before the Rollup export.

### Delegated Proving Service (DPS)

Programs can offload expensive proof generation to a remote prover instead of running locally:
1. `ProgramManager` builds an `Authorization` or `ProvingRequest` locally
2. `security.ts` encrypts proving requests and record scanner registration requests with each respective service's X25519 public key (libsodium `crypto_box_seal`)
3. `AleoNetworkClient` submits via `DelegatedProvingParams` with optional API key + JWT auth
4. Response contains the completed transaction

Configure by passing `proverUri` (and optionally `recordScannerUri`) to `AleoNetworkClientOptions`.

### Package: `create-leo-app` (`/create-leo-app`)

Interactive CLI scaffolding (`npm create leo-app`). Templates in `create-leo-app/template-*/`. Built with `unbuild`.

### Package: `website` (`/website`)

Demo app at provable.tools. React 19 + Vite + Ant Design + CodeMirror. Not published to npm.

## Key Conventions

- **ESM-only** throughout (`"type": "module"` in all package.json files)
- All WASM types consumed by the SDK flow through `sdk/src/wasm.ts`
- The Rust toolchain version is pinned in `rust-toolchain.toml`
- Tests must be Rollup-bundled to `sdk/tmp/` before Mocha can run them
