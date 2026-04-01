# @provablehq/provable-engine-wasm

WASM-backed engine implementation for `@provablehq/provablekit`.

This package includes the WASM runtime/export surface for both `mainnet` and `testnet`.

Install:

```bash
npm install @provablehq/provablekit @provablehq/provable-engine-wasm
```

## Usage

```ts
import { ProvableKit } from "@provablehq/provablekit";
import { createWasmEngine } from "@provablehq/provable-engine-wasm";

await ProvableKit.init({
  engine: createWasmEngine(),
  env: { network: "mainnet" },
});
```
