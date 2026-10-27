// Tests the variant selection in the generated `dynamic` entry.
//
// `sdk/build/dynamic-entry.js` emits the source of `dist/dynamic/*.{js,cjs}`.
// Each scenario writes that source next to stub network leaves in a fresh
// directory, so the module cache never carries state between scenarios, and
// the wasm64 leaves can be present, missing, or throwing on evaluation. The
// real packages are exercised by `tests/cjs-smoke/pack-install.cjs` in the CI
// runtime matrix.
//
// Run with `yarn test:dynamic` (node --test).

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { dynamicEntry } from "../../build/dynamic-entry.js";

const networks = ["testnet", "mainnet"];
const UNSUPPORTED = "This SDK build requires wasm64 shared-memory support.";

// Scenarios alternate builds in one process, which the entry reports through
// console.warn. Collect those warnings instead of printing them; one scenario
// asserts the message.
const warnings = [];
console.warn = (message) => warnings.push(String(message));

// Writes the dynamic entry and stub leaves for one scenario.
// `wasm64` is "ok", "missing" (no wasm64 leaves) or "throw" (leaves throw the
// documented error when evaluated, as the real bindings do).
function layout(format, { wasm64 = "ok" } = {}) {
    const root = mkdtempSync(path.join(tmpdir(), "sdk-dynamic-"));
    const ext = format === "esm" ? "js" : "cjs";
    const leaf = (variant, network) =>
        format === "esm"
            ? `export const variant = ${JSON.stringify(variant)};\nexport const network = ${JSON.stringify(network)};\n`
            : `module.exports = { variant: ${JSON.stringify(variant)}, network: ${JSON.stringify(network)} };\n`;
    const record = (network) =>
        format === "esm"
            ? `import { writeFileSync } from "node:fs";\nwriteFileSync(${JSON.stringify(path.join(root, `loaded-${network}`))}, "");\n`
            : `require("node:fs").writeFileSync(${JSON.stringify(path.join(root, `loaded-${network}`))}, "");\n`;

    for (const network of networks) {
        mkdirSync(path.join(root, network));
        writeFileSync(
            path.join(root, network, `node.${ext}`),
            leaf("wasm32", network),
        );
        if (wasm64 === "missing") continue;
        mkdirSync(path.join(root, "wasm64", network), { recursive: true });
        const body =
            wasm64 === "throw"
                ? `throw new Error(${JSON.stringify(UNSUPPORTED)});\n`
                : leaf("wasm64", network);
        writeFileSync(
            path.join(root, "wasm64", network, `node.${ext}`),
            record(network) + body,
        );
    }

    mkdirSync(path.join(root, "dynamic"));
    const entry = path.join(root, "dynamic", `node.${ext}`);
    writeFileSync(entry, dynamicEntry({ runtime: "node", format, networks }));

    const load =
        format === "esm"
            ? () => import(pathToFileURL(entry).href)
            : async () => createRequire(import.meta.url)(entry);
    return {
        load,
        wasm64Loaded: (network) =>
            existsSync(path.join(root, `loaded-${network}`)),
    };
}

// Makes `supportsWasm64()` return false for the duration of `fn`.
async function withoutWasm64(fn) {
    const Memory = WebAssembly.Memory;
    WebAssembly.Memory = function (descriptor) {
        if (descriptor.address === "i64")
            throw new TypeError("Memory64 is not supported");
        return new Memory(descriptor);
    };
    try {
        return await fn();
    } finally {
        WebAssembly.Memory = Memory;
    }
}

async function withEnv(value, fn) {
    const previous = process.env.PROVABLE_SDK_VARIANT;
    if (value === undefined) delete process.env.PROVABLE_SDK_VARIANT;
    else process.env.PROVABLE_SDK_VARIANT = value;
    try {
        return await fn();
    } finally {
        if (previous === undefined) delete process.env.PROVABLE_SDK_VARIANT;
        else process.env.PROVABLE_SDK_VARIANT = previous;
    }
}

for (const format of ["esm", "cjs"]) {
    test(`${format}: exports the probes and loadNetwork`, async () => {
        const { load } = layout(format);
        const entry = await load();
        assert.equal(typeof entry.loadNetwork, "function");
        assert.equal(typeof entry.supportsWasm64(), "boolean");
        assert.equal(
            entry.supportsThreads(),
            true,
            "Node.js has SharedArrayBuffer and worker_threads",
        );
    });

    test(`${format}: defaults to wasm32 without touching the wasm64 leaf`, async () => {
        const { load, wasm64Loaded } = layout(format);
        const { loadNetwork } = await load();
        const sdk = await loadNetwork("testnet");
        assert.equal(sdk.variant, "wasm32");
        assert.equal(sdk.network, "testnet");
        assert.equal(wasm64Loaded("testnet"), false);
    });

    test(`${format}: an explicit variant is honored`, async () => {
        const { load } = layout(format);
        const { loadNetwork } = await load();
        assert.equal(
            (await loadNetwork("mainnet", { variant: "wasm32" })).variant,
            "wasm32",
        );
        assert.equal(
            (await loadNetwork("mainnet", { variant: "wasm64" })).variant,
            "wasm64",
        );
    });

    test(`${format}: an explicit wasm64 rejects when the package is missing`, async () => {
        const { load } = layout(format, { wasm64: "missing" });
        const { loadNetwork } = await load();
        await assert.rejects(
            loadNetwork("testnet", { variant: "wasm64" }),
            /Cannot find (module|package)/,
        );
    });

    test(`${format}: an explicit wasm64 propagates the runtime error`, async () => {
        const { load } = layout(format, { wasm64: "throw" });
        const { loadNetwork } = await load();
        await assert.rejects(loadNetwork("testnet", { variant: "wasm64" }), {
            message: UNSUPPORTED,
        });
    });

    test(`${format}: auto selects wasm64 when the runtime supports it`, async (t) => {
        const { load } = layout(format);
        const { loadNetwork, supportsWasm64 } = await load();
        if (!supportsWasm64())
            return t.skip("this Node.js has no Memory64 shared memory");
        assert.equal(
            (await loadNetwork("testnet", { variant: "auto" })).variant,
            "wasm64",
        );
    });

    test(`${format}: auto falls back to wasm32 when the package is missing`, async (t) => {
        const { load } = layout(format, { wasm64: "missing" });
        const { loadNetwork, supportsWasm64 } = await load();
        if (!supportsWasm64())
            return t.skip("this Node.js has no Memory64 shared memory");
        assert.equal(
            (await loadNetwork("testnet", { variant: "auto" })).variant,
            "wasm32",
        );
    });

    test(`${format}: auto falls back to wasm32 when wasm64 fails to initialize`, async (t) => {
        const { load, wasm64Loaded } = layout(format, { wasm64: "throw" });
        const { loadNetwork, supportsWasm64 } = await load();
        if (!supportsWasm64())
            return t.skip("this Node.js has no Memory64 shared memory");
        assert.equal(
            (await loadNetwork("testnet", { variant: "auto" })).variant,
            "wasm32",
        );
        assert.equal(
            wasm64Loaded("testnet"),
            true,
            "the wasm64 leaf was tried first",
        );
    });

    test(`${format}: auto skips wasm64 when the probe fails`, async () => {
        const { load, wasm64Loaded } = layout(format);
        const { loadNetwork, supportsWasm64 } = await load();
        await withoutWasm64(async () => {
            assert.equal(supportsWasm64(), false);
            assert.equal(
                (await loadNetwork("testnet", { variant: "auto" })).variant,
                "wasm32",
            );
        });
        assert.equal(
            wasm64Loaded("testnet"),
            false,
            "an unsupported runtime never loads the wasm64 leaf",
        );
    });

    test(`${format}: PROVABLE_SDK_VARIANT applies when the caller leaves the choice open`, async () => {
        const { load } = layout(format);
        const { loadNetwork } = await load();
        await withEnv("wasm64", async () => {
            assert.equal(
                (await loadNetwork("testnet")).variant,
                "wasm64",
                "no option: env wins",
            );
            assert.equal(
                (await loadNetwork("testnet", { variant: "auto" })).variant,
                "wasm64",
                "auto: env wins",
            );
            assert.equal(
                (await loadNetwork("testnet", { variant: "wasm32" })).variant,
                "wasm32",
                "explicit: code wins",
            );
        });
        await withEnv("wasm32", async () => {
            assert.equal(
                (await loadNetwork("mainnet", { variant: "auto" })).variant,
                "wasm32",
            );
            assert.equal(
                (await loadNetwork("mainnet", { variant: "wasm64" })).variant,
                "wasm64",
            );
        });
    });

    test(`${format}: warns when the other build is loaded in the same realm`, async () => {
        const { load } = layout(format);
        const { loadNetwork } = await load();
        await loadNetwork("testnet", { variant: "wasm32" });
        warnings.length = 0;
        await loadNetwork("testnet", { variant: "wasm32" });
        assert.equal(warnings.length, 0, "the same build again is silent");
        await loadNetwork("testnet", { variant: "wasm64" });
        assert.equal(warnings.length, 1);
        assert.match(
            warnings[0],
            /loaded the wasm64 build after the wasm32 build/,
        );
    });

    test(`${format}: rejects an unknown variant or network`, async () => {
        const { load } = layout(format);
        const { loadNetwork } = await load();
        await assert.rejects(
            loadNetwork("testnet", { variant: "wasm128" }),
            TypeError,
        );
        await assert.rejects(loadNetwork("devnet"), TypeError);
        await withEnv("wasm128", () =>
            assert.rejects(loadNetwork("testnet"), TypeError),
        );
    });
}
