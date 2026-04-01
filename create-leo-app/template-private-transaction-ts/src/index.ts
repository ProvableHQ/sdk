import { ProvableSDK } from "@provablehq/provablekit";
import { createWasmEngine } from "@provablehq/provable-engine-wasm";

await ProvableSDK.init({
  engine: createWasmEngine(),
  env: { network: "testnet" },
});

console.log("Private transaction template initialized with ProvableSDK + WasmEngine");
