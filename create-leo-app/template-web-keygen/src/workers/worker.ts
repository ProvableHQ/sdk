import { expose } from "comlink";
import { createWasmEngine } from "@provablehq/provable-engine-wasm";
import { ProvableKit } from "@provablehq/provablekit";

await ProvableKit.init({
  engine: createWasmEngine(),
  env: { network: "testnet" },
});

function toStringValue(value: any): string {
  if (value?.to_string) return value.to_string();
  if (value?.toString) return value.toString();
  return String(value ?? "");
}

async function generateKeys() {
  const capabilities = ProvableKit.getCapabilities();
  const created = capabilities?.highLevel?.createAccount?.();
  if (!created) {
    throw new Error("WASM engine does not expose highLevel.createAccount");
  }

  // Wasm highLevel.createAccount currently returns a private-key-like object.
  const privateKeyObj =
    typeof created.privateKey === "function" ? created.privateKey() : created;
  const viewKeyObj =
    typeof created.viewKey === "function"
      ? created.viewKey()
      : privateKeyObj?.to_view_key?.();
  const addressObj =
    typeof created.address === "function"
      ? created.address()
      : privateKeyObj?.to_address?.();

  const privateKey = toStringValue(privateKeyObj);
  const viewKey = toStringValue(viewKeyObj);
  const address = toStringValue(addressObj);

  return { address, privateKey, viewKey };
}

expose({ generateKeys });
