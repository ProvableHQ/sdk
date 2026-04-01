import test from "node:test";
import assert from "node:assert/strict";
import type { ProvableEngine } from "./contracts.js";
import { ProvableKit } from "./provable-sdk.js";

test("ProvableKit.init stores engine and env", async () => {
  const engine: ProvableEngine = {
    id: "test-engine",
    displayName: "Test Engine",
    init() {
      return {
        account: {
          fromPrivateKey() {
            return { account: true };
          },
        },
        crypto: {
          encryptAuthorization() {
            return "auth";
          },
          encryptProvingRequest() {
            return "proving";
          },
        },
        network: {
          createNetworkClient() {
            return {};
          },
          createRecordScanner() {
            return {};
          },
          createRecordProvider() {
            return {};
          },
        },
      };
    },
  };

  const capabilities = await ProvableKit.init({
    engine,
    env: { network: "testnet", apiHost: "https://api.example.com" },
  });

  assert.equal(ProvableKit.getEngine().id, "test-engine");
  assert.equal(ProvableKit.getEnv().network, "testnet");
  assert.equal(capabilities.crypto.encryptAuthorization("pub", {}), "auth");
});
