# Provable Core + Dual Engines

This document describes the core/engine package split added to this repository.

## Packages

- `@provablehq/provablekit`
  - Shared contracts and runtime-agnostic utilities.
  - Exposes `ProvableKit.init({ engine, env })`.
- `@provablehq/provable-engine-wasm`
  - WASM-backed runtime adapter for web/desktop.
- `@provablehq/provable-engine-react-native`
  - React Native runtime adapter aligned to the shared engine contract.

## Initialization

```ts
import { ProvableKit } from "@provablehq/provablekit";
import { createWasmEngine } from "@provablehq/provable-engine-wasm";

await ProvableKit.init({
  engine: createWasmEngine(),
  env: { network: "mainnet" },
});
```

## Compatibility

There is no legacy SDK facade package in this repo. Consumers should import directly from:

- `@provablehq/provablekit`
- `@provablehq/provable-engine-wasm`
- `@provablehq/provable-engine-react-native`

## Build and Test

From repository root:

- `yarn build:packages` builds `provablekit`, `provable-engine-wasm`, and `provable-engine-react-native`.
- `yarn test:packages` runs package-level tests.

## Suggested Publish Order

The root deploy script publishes in this order:

1. `@provablehq/provablekit`
2. `@provablehq/provable-engine-wasm`
3. `@provablehq/provable-engine-react-native`
4. `create-leo-app`

## CI Checklist

- Build packages:
  - `yarn build:packages`
- Test packages:
  - `yarn test:packages`
- Validate examples/e2e as part of normal release gate.
