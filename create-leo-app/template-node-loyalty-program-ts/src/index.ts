import { ProvableSDK } from "@provablehq/provablekit";
import { createWasmEngine } from "@provablehq/provable-engine-wasm";

await ProvableSDK.init({
  engine: createWasmEngine(),
  env: { network: "testnet" },
});

console.log("Loyalty template initialized with ProvableSDK + WasmEngine");
