// Packed-and-installed CJS smoke test.
//
// The sibling `smoke.cjs` loads the SDK by absolute file path, which is fast
// for dev iteration but bypasses the `exports.require` condition entirely.
// This script closes that coverage gap: it packs both workspace packages
// (`@provablehq/wasm` and `@provablehq/sdk`), installs them into a clean
// CJS fixture, and exercises the public API through
// `require('@provablehq/sdk/testnet.js')` — the exact code path a Kraken-style
// downstream consumer runs. A broken `exports.require` entry, a missing
// tarball file, or a wrong `main` field all fail here.

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync, spawnSync } = require("node:child_process");

const REPO_ROOT = path.resolve(__dirname, "../../..");
const WORKDIR = fs.mkdtempSync(path.join(os.tmpdir(), "provablehq-cjs-pack-"));

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
const sdkTarball = path.join(WORKDIR, "provablehq-sdk.tgz");

console.log("[pack-install] Packing @provablehq/wasm...");
pack(path.join(REPO_ROOT, "wasm"), wasmTarball);

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
const sdk = require("@provablehq/sdk/testnet.js");

assert.equal(typeof sdk.Account, "function", "Account not exported");
assert.equal(typeof sdk.ProgramManager, "function", "ProgramManager not exported");
assert.equal(typeof sdk.encryptProvingRequest, "function", "encryptProvingRequest not exported");
assert.equal(typeof sdk.encryptViewKey, "function", "encryptViewKey not exported");
assert.equal(typeof sdk.initThreadPool, "function", "initThreadPool not exported");
assert.equal(typeof sdk.LocalFileKeyStore, "function", "LocalFileKeyStore (node-only) not exported");

const account = new sdk.Account();
assert.ok(account.address().to_string().startsWith("aleo1"), "Account derivation failed");

const message = new TextEncoder().encode("pack-install smoke");
const signature = account.sign(message);
assert.ok(account.verify(message, signature), "Signature round-trip failed");

// Dynamic variant via the exports map.
const dyn = require("@provablehq/sdk/dynamic.js");
assert.equal(typeof dyn.loadNetwork, "function", "dynamic loadNetwork not exported");

console.log("pack-install smoke passed");
`,
);

console.log("[pack-install] Running assertions through require('@provablehq/sdk/testnet.js')...");
run("node", [assertionsScript], { cwd: fixtureDir });

console.log("\x1b[32m✓ CJS pack-install smoke passed.\x1b[0m");
