import test from "node:test";
import assert from "node:assert/strict";
import { WasmEngine } from "./index.js";

test("WasmEngine initializes and exposes capabilities", async () => {
  const engine = new WasmEngine();

  assert.equal(engine.id, "wasm");
  assert.equal(engine.displayName, "Provable WASM Engine");
});
