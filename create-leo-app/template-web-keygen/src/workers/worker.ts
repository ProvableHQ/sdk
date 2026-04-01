import { expose } from "comlink";
import { createWasmEngine } from "@provablehq/provable-engine-wasm";
import { ProvableKit } from "@provablehq/provablekit";
import { Account } from "@provablehq/provablekit/testnet.js";

await ProvableKit.init({
  engine: createWasmEngine(),
  env: { network: "testnet" },
});

async function generateKeys() {
  const account = new Account();
  const privateKey = account.privateKey().to_string();
  const viewKey = account.privateKey().to_view_key().to_string();
  const address = account.address().to_string();

  return { address, privateKey, viewKey };
}

expose({ generateKeys });
