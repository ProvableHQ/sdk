import test from "node:test";
import assert from "node:assert/strict";
import type { ProvableEngine } from "./contracts.js";
import { ProvableSDK } from "./provable-sdk.js";

test("ProvableSDK.init stores engine and env", async () => {
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

  const capabilities = await ProvableSDK.init({
    engine,
    env: { network: "testnet", apiHost: "https://api.example.com" },
  });

  assert.equal(ProvableSDK.getEngine().id, "test-engine");
  assert.equal(ProvableSDK.getEnv().network, "testnet");
  assert.equal(capabilities.crypto.encryptAuthorization("pub", {}), "auth");
});
