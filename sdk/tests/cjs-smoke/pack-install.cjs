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
//
// Flags:
//   --wasm64              also pack `@provablehq/wasm64` and exercise
//                         the `wasm64/` entry points (ESM and CJS).
//   --expect-unsupported  with `--wasm64`, on a runtime without wasm64
//                         shared memory (Node.js < 24): assert that the
//                         wasm64 entry points throw the documented error and
//                         that the wasm32 entry from the same installation
//                         still works. The CI runtime matrix uses this for
//                         the "No" cells of the README's runtime table.

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const REPO_ROOT = path.resolve(__dirname, "../../..");
const WORKDIR = fs.mkdtempSync(path.join(os.tmpdir(), "provablehq-cjs-pack-"));
const variant = process.argv.includes("--wasm64") ? "wasm64/" : "";
const expectUnsupported = process.argv.includes("--expect-unsupported");
if (expectUnsupported && !variant) {
    throw new Error("--expect-unsupported requires --wasm64");
}

// Substring of the error thrown by `@provablehq/wasm64` when the
// runtime lacks 64-bit shared WebAssembly memory (wasm/build/wasm64/bindings.js).
const UNSUPPORTED_MESSAGE = "requires wasm64 shared-memory support";

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
const wasm64Tarball = path.join(WORKDIR, "provablehq-wasm64.tgz");
const sdkTarball = path.join(WORKDIR, "provablehq-sdk.tgz");

console.log("[pack-install] Packing @provablehq/wasm...");
pack(path.join(REPO_ROOT, "wasm"), wasmTarball);

if (variant) {
    console.log("[pack-install] Packing @provablehq/wasm64...");
    pack(path.join(REPO_ROOT, "wasm64"), wasm64Tarball);
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
                ...(variant && { "@provablehq/wasm64": `file:${wasm64Tarball}` }),
                "@provablehq/sdk": `file:${sdkTarball}`,
            },
        },
        null,
        2,
    ),
);

console.log("[pack-install] Installing tarballs into fixture...");
run("npm", ["install", "--no-audit", "--no-fund", "--loglevel=error"], { cwd: fixtureDir });

if (expectUnsupported) {
    // The wasm64 entry points must fail with the documented error, not with a
    // module-resolution or WebAssembly compile error, and the wasm32 entry
    // installed next to them must be unaffected. The static entries throw at
    // load time. The dynamic entry loads on any runtime and fails from
    // `loadNetwork`: synchronously in the CJS bundle, which `require`s the
    // network lazily, and as a rejection in the ESM bundle. Wrapping the call
    // in a resolved promise accepts both.
    const cjsScript = path.join(fixtureDir, "expect-unsupported.cjs");
    fs.writeFileSync(
        cjsScript,
        `
const assert = require("node:assert/strict");
const expected = { message: /${UNSUPPORTED_MESSAGE}/ };

for (const entry of ["@provablehq/sdk/wasm64/testnet.js", "@provablehq/wasm64/testnet.js"]) {
    assert.throws(() => require(entry), expected, entry + " should throw the wasm64 error");
}

const sdk = require("@provablehq/sdk/testnet.js");
const account = new sdk.Account();
const message = new TextEncoder().encode("expect-unsupported smoke");
assert.ok(account.verify(message, account.sign(message)), "wasm32 signature round-trip failed");

(async () => {
    const dyn = require("@provablehq/sdk/wasm64/dynamic.js");
    await assert.rejects(
        Promise.resolve().then(() => dyn.loadNetwork("mainnet")),
        expected,
        "wasm64 loadNetwork should fail with the wasm64 error",
    );

    // The default dynamic entry selects a build. Here the probe fails, so
    // "auto" must settle on wasm32 and an explicit wasm64 must surface the
    // documented error.
    const base = require("@provablehq/sdk/dynamic.js");
    assert.equal(base.supportsWasm64(), false, "supportsWasm64 should be false on this runtime");
    const auto = await base.loadNetwork("testnet", { variant: "auto" });
    assert.equal(auto.Account, sdk.Account, "auto should select wasm32 on this runtime");
    await assert.rejects(base.loadNetwork("testnet", { variant: "wasm64" }), expected, "explicit wasm64 should fail with the wasm64 error");

    await sdk.initThreadPool(2);
    console.log("wasm64 entry points rejected as expected on " + process.version);
    process.exit(0);
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
`,
    );
    console.log("[pack-install] Asserting the wasm64 entry points throw on this runtime (CJS)...");
    run("node", [cjsScript], { cwd: fixtureDir });

    const esmScript = path.join(fixtureDir, "expect-unsupported.mjs");
    fs.writeFileSync(
        esmScript,
        `
import assert from "node:assert/strict";
const expected = { message: /${UNSUPPORTED_MESSAGE}/ };
await assert.rejects(import("@provablehq/sdk/wasm64/testnet.js"), expected, "wasm64 ESM entry should throw");
const dyn = await import("@provablehq/sdk/wasm64/dynamic.js");
await assert.rejects(
    Promise.resolve().then(() => dyn.loadNetwork("testnet")),
    expected,
    "wasm64 ESM loadNetwork should fail with the wasm64 error",
);
const { Account } = await import("@provablehq/sdk/testnet.js");
const message = new TextEncoder().encode("expect-unsupported ESM smoke");
const account = new Account();
assert.ok(account.verify(message, account.sign(message)), "wasm32 ESM signature round-trip failed");
const base = await import("@provablehq/sdk/dynamic.js");
assert.equal(base.supportsWasm64(), false, "supportsWasm64 should be false on this runtime");
const auto = await base.loadNetwork("testnet", { variant: "auto" });
assert.equal(auto.Account, Account, "auto should select wasm32 on this runtime");
await assert.rejects(base.loadNetwork("testnet", { variant: "wasm64" }), expected, "explicit wasm64 should fail with the Memory64 error");
console.log("wasm64 ESM entry points rejected as expected on " + process.version);
process.exit(0);
`,
    );
    console.log("[pack-install] Asserting the wasm64 entry points throw on this runtime (ESM)...");
    run("node", [esmScript], { cwd: fixtureDir });

    console.log(`\x1b[32m✓ wasm64 entry points unsupported on ${process.version} as expected; wasm32 works.\x1b[0m`);
    process.exit(0);
}

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

// The default dynamic entry selects a variant at load time.
const base = require("@provablehq/sdk/dynamic.js");
assert.equal(typeof base.supportsWasm64(), "boolean", "supportsWasm64 not exported");
assert.equal(base.supportsThreads(), true, "supportsThreads should be true in Node.js");

// Worker / thread pool through the installed tarball. Exercises the
// import.meta.url → pathToFileURL(__filename) transform against a real
// node_modules-resolved path, and confirms all worker-related files
// (node-polyfill, worker.js, aleo_wasm.wasm) made it into the tarball.
(async () => {
    ${variant ? `
    const wasm = require("@provablehq/wasm64/testnet.js");
    const binary = require("node:fs").readFileSync(require("node:path").join(
        require("node:path").dirname(require.resolve("@provablehq/wasm64/testnet/worker.js")),
        "aleo_wasm.wasm",
    ));
    const instance = wasm.initSync({ module: binary });
    assert.equal(typeof instance.memory.grow(0n), "bigint", "Expected wasm64 linear memory");
    assert.ok(instance.memory.buffer instanceof SharedArrayBuffer, "Expected shared memory");
    ` : ""}
    await sdk.initThreadPool(2);

    // "auto" resolves to the same module instance as the matching static
    // entry: wasm64 when this Node.js supports it and the package is
    // installed, otherwise wasm32. The wasm32 cell has no @provablehq/wasm64,
    // so "auto" falls back and an explicit wasm64 fails to resolve the peer.
    const auto = await base.loadNetwork("testnet", { variant: "auto" });
    ${variant ? `
    assert.equal(auto.Account, sdk.Account, "auto should select wasm64 on this runtime");
    assert.equal(base.supportsWasm64(), true, "supportsWasm64 should be true on this runtime");
    ` : `
    assert.equal(auto.Account, sdk.Account, "auto should settle on wasm32 without @provablehq/wasm64");
    await assert.rejects(base.loadNetwork("testnet", { variant: "wasm64" }), /Cannot find (module|package)/,
        "explicit wasm64 should fail to resolve the missing peer");
    `}
    ${variant ? `
    const response = await wasm.ProgramManager.executeFunctionOffline(
        account.privateKey(),
        "program wasm64_smoke.aleo;\\nfunction sum:\\n    input r0 as u32.public;\\n    input r1 as u32.private;\\n    add r0 r1 into r2;\\n    output r2 as u32.private;\\n",
        "sum", ["5u32", "5u32"], false, false,
    );
    assert.deepEqual(response.getOutputs(), ["10u32"], "wasm64 execution failed");
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
import { loadNetwork as loadSelected, supportsWasm64 } from "@provablehq/sdk/dynamic.js";
const message = new TextEncoder().encode("wasm64 ESM smoke");
const account = new Account();
assert.ok(account.verify(message, account.sign(message)));
assert.equal(supportsWasm64(), true, "supportsWasm64 should be true on this runtime");
const auto = await loadSelected("testnet", { variant: "auto" });
assert.equal(auto.Account, Account, "auto should select wasm64 on this runtime (ESM)");
await initThreadPool(2);
const mainnet = await loadNetwork("mainnet");
const mainnetAccount = new mainnet.Account();
assert.ok(mainnetAccount.verify(message, mainnetAccount.sign(message)));
await mainnet.initThreadPool(2);
console.log("wasm64 ESM pack-install smoke passed");
process.exit(0);
`);
    run("node", [esmScript], { cwd: fixtureDir });
}

console.log(`\x1b[32m✓ ${variant ? "wasm64 ESM + CJS" : "CJS"} pack-install smoke passed.\x1b[0m`);
