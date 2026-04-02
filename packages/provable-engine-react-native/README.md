# @provablehq/provable-engine-react-native

React Native engine implementation for `@provablehq/provablekit`.

This package provides a React Native engine surface for `ProvableKit` without relying on
`@provablehq/shield-mobile-sdk`.

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
