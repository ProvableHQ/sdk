# Provable Core + Dual Engines

This document describes the core/engine package split added to this repository.

## Packages

- `@provablehq/provablekit`
  - Shared contracts and runtime-agnostic utilities.
  - Exposes `ProvableSDK.init({ engine, env })`.
- `@provablehq/provable-engine-wasm`
  - WASM-backed runtime adapter for web/desktop.
- `@provablehq/provable-engine-react-native`
  - React Native runtime adapter that delegates to `@provablehq/shield-mobile-sdk`.

## Initialization

```ts
import { ProvableSDK } from "@provablehq/provablekit";
import { createWasmEngine } from "@provablehq/provable-engine-wasm";

await ProvableSDK.init({
  engine: createWasmEngine(),
  env: { network: "mainnet" },
});
```

## Compatibility

The existing `@provablehq/sdk` package now re-exports:

- `ProvableSDK`
- `WasmEngine` and `createWasmEngine`
- `ReactNativeEngine` and `createReactNativeEngine`

This allows current SDK users to adopt the new init flow without changing package entrypoints.

## Build and Test

From repository root:

- `yarn build:packages` builds `provablekit`, `provable-engine-wasm`, and `provable-engine-react-native`.
- `yarn test:packages` runs package-level tests.

## Suggested Publish Order

The root deploy script publishes in this order:

1. `@provablehq/wasm`
2. `@provablehq/provablekit`
3. `@provablehq/provable-engine-wasm`
4. `@provablehq/provable-engine-react-native`
5. `@provablehq/sdk`
6. `create-leo-app`

## CI Checklist

- Build packages:
  - `yarn build:packages`
  - `yarn build:sdk`
- Test packages:
  - `yarn test:packages`
  - `yarn test:sdk`
- Validate examples/e2e as part of normal release gate.
