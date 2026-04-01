import { ProvableKit } from "@provablehq/provablekit";
import { createWasmEngine } from "@provablehq/provable-engine-wasm";

const engine = createWasmEngine();
console.log("dynamic e2e migration guard:", typeof ProvableKit.init === "function", engine.id);
