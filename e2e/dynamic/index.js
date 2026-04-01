import { ProvableSDK } from "@provablehq/provablekit";
import { createWasmEngine } from "@provablehq/provable-engine-wasm";

const engine = createWasmEngine();
console.log("dynamic e2e migration guard:", typeof ProvableSDK.init === "function", engine.id);
