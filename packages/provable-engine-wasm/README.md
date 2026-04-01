# @provablehq/provable-engine-wasm

WASM-backed engine implementation for `@provablehq/provablekit`.

Install:

```bash
npm install @provablehq/provablekit @provablehq/provable-engine-wasm
```

## Usage

```ts
import { ProvableSDK } from "@provablehq/provablekit";
import { createWasmEngine } from "@provablehq/provable-engine-wasm";

await ProvableSDK.init({
  engine: createWasmEngine(),
  env: { network: "mainnet" },
});
```
