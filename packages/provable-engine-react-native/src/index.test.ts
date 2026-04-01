import test from "node:test";
import assert from "node:assert/strict";
import { ReactNativeEngine, createReactNativeEngine } from "./index.js";

test("ReactNativeEngine factory returns engine metadata", () => {
  const engine = new ReactNativeEngine();
  const factoryEngine = createReactNativeEngine();

  assert.equal(engine.id, "react-native");
  assert.equal(factoryEngine.displayName, "Provable React Native Engine");
});
