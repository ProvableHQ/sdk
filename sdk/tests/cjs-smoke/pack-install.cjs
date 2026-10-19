// Packed-and-installed CJS smoke test.
//
// The sibling `smoke.cjs` loads the SDK by absolute file path, which is fast
// for dev iteration but bypasses the `exports.require` condition entirely.
// This script closes that coverage gap: it packs both workspace packages
// (`@provablehq/wasm` and `@provablehq/sdk`), installs them into a clean
// CJS fixture, and exercises the public API through
// `require('@provablehq/sdk/testnet.js')` — the exact code path a downstream
// CJS consumer runs. A broken `exports.require` entry, a missing tarball
// file, or a wrong `main` field all fail here.

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const REPO_ROOT = path.resolve(__dirname, "../../..");
const WORKDIR = fs.mkdtempSync(path.join(os.tmpdir(), "provablehq-cjs-pack-"));
const variant = process.argv.includes("--wasm64") ? "wasm64/" : "";

function run(cmd, args, opts = {}) {
    const result = spawnSync(cmd, args, { stdio: "inherit", ...opts });
    if (result.status !== 0) {
        throw new Error(`${cmd} ${args.join(" ")} exited with status ${result.status}`);
    }
}

function pack(pkgDir, outPath) {
    run("yarn", ["pack", "--filename", outPath], { cwd: pkgDir });
}

function cleanup() {
    try {
        fs.rmSync(WORKDIR, { recursive: true, force: true });
    } catch {}
}

process.on("exit", cleanup);
process.on("SIGINT", () => { cleanup(); process.exit(130); });

console.log(`[pack-install] Workspace: ${WORKDIR}`);

const wasmTarball = path.join(WORKDIR, "provablehq-wasm.tgz");
const memory64Tarball = path.join(WORKDIR, "provablehq-wasm-memory64.tgz");
const sdkTarball = path.join(WORKDIR, "provablehq-sdk.tgz");

console.log("[pack-install] Packing @provablehq/wasm...");
pack(path.join(REPO_ROOT, "wasm"), wasmTarball);

if (variant) {
    console.log("[pack-install] Packing @provablehq/wasm-memory64...");
    pack(path.join(REPO_ROOT, "wasm-memory64"), memory64Tarball);
}

console.log("[pack-install] Packing @provablehq/sdk...");
pack(path.join(REPO_ROOT, "sdk"), sdkTarball);

// Fixture is pure CJS — no `"type": "module"` — so `require()` resolution
// exercises the `require` condition of the SDK's `exports` map. The
// `@provablehq/wasm` dep must be pinned to the same file tarball explicitly;
// otherwise npm would try to fetch it from the registry by version range.
const fixtureDir = path.join(WORKDIR, "fixture");
fs.mkdirSync(fixtureDir, { recursive: true });
fs.writeFileSync(
    path.join(fixtureDir, "package.json"),
    JSON.stringify(
        {
            name: "provablehq-sdk-cjs-fixture",
            version: "0.0.0",
            private: true,
            dependencies: {
                "@provablehq/wasm": `file:${wasmTarball}`,
                ...(variant && { "@provablehq/wasm-memory64": `file:${memory64Tarball}` }),
                "@provablehq/sdk": `file:${sdkTarball}`,
            },
        },
        null,
        2,
    ),
);

console.log("[pack-install] Installing tarballs into fixture...");
run("npm", ["install", "--no-audit", "--no-fund", "--loglevel=error"], { cwd: fixtureDir });

const assertionsScript = path.join(fixtureDir, "run-smoke.cjs");
fs.writeFileSync(
    assertionsScript,
    `
const assert = require("node:assert");
const sdk = require("@provablehq/sdk/${variant}testnet.js");

assert.equal(typeof sdk.Account, "function", "Account not exported");
assert.equal(typeof sdk.ProgramManager, "function", "ProgramManager not exported");
assert.equal(typeof sdk.encryptProvingRequest, "function", "encryptProvingRequest not exported");
assert.equal(typeof sdk.encryptViewKey, "function", "encryptViewKey not exported");
assert.equal(typeof sdk.initThreadPool, "function", "initThreadPool not exported");
assert.equal(typeof sdk.LocalFileKeyStore, "function", "LocalFileKeyStore (node-only) not exported");
assert.equal(new sdk.AleoNetworkClient("https://example.invalid").host,
    "https://example.invalid/testnet", "Build variant leaked into the network URL");

const account = new sdk.Account();
assert.ok(account.address().to_string().startsWith("aleo1"), "Account derivation failed");

const message = new TextEncoder().encode("pack-install smoke");
const signature = account.sign(message);
assert.ok(account.verify(message, signature), "Signature round-trip failed");

// Dynamic variant via the exports map.
const dyn = require("@provablehq/sdk/${variant}dynamic.js");
assert.equal(typeof dyn.loadNetwork, "function", "dynamic loadNetwork not exported");

// Worker / thread pool through the installed tarball. Exercises the
// import.meta.url → pathToFileURL(__filename) transform against a real
// node_modules-resolved path, and confirms all worker-related files
// (node-polyfill, worker.js, aleo_wasm.wasm) made it into the tarball.
(async () => {
    ${variant ? `
    const wasm = require("@provablehq/wasm-memory64/testnet.js");
    const binary = require("node:fs").readFileSync(require("node:path").join(
        require("node:path").dirname(require.resolve("@provablehq/wasm-memory64/testnet/worker.js")),
        "aleo_wasm.wasm",
    ));
    const instance = wasm.initSync({ module: binary });
    assert.equal(typeof instance.memory.grow(0n), "bigint", "Expected Memory64 linear memory");
    assert.ok(instance.memory.buffer instanceof SharedArrayBuffer, "Expected shared memory");
    ` : ""}
    await sdk.initThreadPool(2);
    ${variant ? `
    const response = await wasm.ProgramManager.executeFunctionOffline(
        account.privateKey(),
        "program memory64_smoke.aleo;\\nfunction sum:\\n    input r0 as u32.public;\\n    input r1 as u32.private;\\n    add r0 r1 into r2;\\n    output r2 as u32.private;\\n",
        "sum", ["5u32", "5u32"], false, false,
    );
    assert.deepEqual(response.getOutputs(), ["10u32"], "Memory64 execution failed");
    ` : ""}
    const mainnet = await dyn.loadNetwork("mainnet");
    assert.equal(new mainnet.AleoNetworkClient("https://example.invalid").host,
        "https://example.invalid/mainnet");
    const mainnetAccount = new mainnet.Account();
    const mainnetSignature = mainnetAccount.sign(message);
    assert.ok(mainnetAccount.verify(message, mainnetSignature), "Mainnet signature failed");
    await mainnet.initThreadPool(2);
    console.log("pack-install smoke passed");
    process.exit(0);
})().catch((err) => {
    console.error("initThreadPool failed under installed tarball:", err);
    process.exit(1);
});
`,
);

console.log(`[pack-install] Running assertions through require('@provablehq/sdk/${variant}testnet.js')...`);
run("node", [assertionsScript], { cwd: fixtureDir });

if (variant) {
    const esmScript = path.join(fixtureDir, "run-smoke.mjs");
    fs.writeFileSync(esmScript, `
import assert from "node:assert/strict";
import { Account, initThreadPool } from "@provablehq/sdk/wasm64/testnet.js";
import { loadNetwork } from "@provablehq/sdk/wasm64/dynamic.js";
const message = new TextEncoder().encode("Memory64 ESM smoke");
const account = new Account();
assert.ok(account.verify(message, account.sign(message)));
await initThreadPool(2);
const mainnet = await loadNetwork("mainnet");
const mainnetAccount = new mainnet.Account();
assert.ok(mainnetAccount.verify(message, mainnetAccount.sign(message)));
await mainnet.initThreadPool(2);
console.log("Memory64 ESM pack-install smoke passed");
process.exit(0);
`);
    run("node", [esmScript], { cwd: fixtureDir });
}

console.log(`\x1b[32m✓ ${variant ? "Memory64 ESM + CJS" : "CJS"} pack-install smoke passed.\x1b[0m`);
