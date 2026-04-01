import { ProvableSDK } from "@provablehq/provablekit";
import { createWasmEngine } from "@provablehq/provable-engine-wasm";

await ProvableSDK.init({
  engine: createWasmEngine(),
  env: {
    network: "mainnet",
  },
});

self.postMessage({
  type: "ALEO_WORKER_READY",
});

self.addEventListener("message", (ev) => {
  self.postMessage({
    type: "UNSUPPORTED_OPERATION",
    originalType: ev.data?.type,
    message: "This worker now uses the ProvableKit + engine architecture and legacy ProgramManager flows were removed.",
  });
});
