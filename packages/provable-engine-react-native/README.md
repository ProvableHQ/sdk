# @provablehq/provable-engine-react-native

React Native engine implementation for `@provablehq/provablekit`.

This package dynamically loads `@provablehq/shield-mobile-sdk` and adapts it to the shared engine contract.

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
