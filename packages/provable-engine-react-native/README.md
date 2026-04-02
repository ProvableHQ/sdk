# @provablehq/provable-engine-react-native

React Native engine implementation for `@provablehq/provablekit`.

This package provides a Nitro-backed React Native engine surface for `ProvableKit`.
It uses native classes patterned after `@provablehq/shield-mobile-sdk` for mobile runtimes.

Install:

```bash
npm install @provablehq/provablekit @provablehq/provable-engine-react-native
```

## Usage

```ts
import { ProvableKit } from "@provablehq/provablekit";
import { createReactNativeEngine } from "@provablehq/provable-engine-react-native";

await ProvableKit.init({
  engine: createReactNativeEngine(),
  env: { network: "mainnet" },
});
```
