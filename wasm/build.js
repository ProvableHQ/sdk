import * as $fs from "node:fs/promises";
import * as $path from "node:path";
import { rollup } from "rollup";
import virtual from "@rollup/plugin-virtual";
import rust from "@wasm-tool/rollup-plugin-rust";


async function buildRollup(input, output) {
    const bundle = await rollup(input);

    try {
        await bundle.write(output);

    } finally {
        await bundle.close();
    }
}

const isDebugBuild = process.env.BUILD_DEBUG === "1";

async function buildWasm(network) {
    await buildRollup({
        input: {
            "aleo_wasm": "./Cargo.toml",
            "aleo_wasm_custom": "./Cargo.toml?custom",
        },
        plugins: [
            rust({
                extraArgs: {
                    cargo: [
                        "--no-default-features",
                        "--features", `browser,${network}`,
                    ],
                    rustc: [
                        "-C", "link-arg=--max-memory=4294967296",
                    ],
                    wasmOpt: ["-O", "--enable-threads", "--enable-bulk-memory", "--enable-bulk-memory-opt", "--enable-nontrapping-float-to-int"],
                },
                optimize: isDebugBuild ? { release: false, wasmOpt: false, rustc: false } : undefined,

                experimental: {
                    atomics: true,
                    typescriptDeclarationDir: `dist/${network}`,
                },
            }),
        ],
    }, {
        dir: `dist/${network}/tmp`,
        format: "es",
        sourcemap: true,
        assetFileNames: `[name][extname]`,
        chunkFileNames: `[name].js`,
        entryFileNames: `[name].js`,
    });
}


async function buildJS(network) {
    // ESM entry: wasm-bindgen's generated aleo_wasm.js uses top-level `await`
    // to async-fetch and compile the .wasm binary. This is fine for ESM.
    const esmEntry = `export * from "./dist/${network}/tmp/aleo_wasm.js";

import { initThreadPool as wasmInitThreadPool } from "./dist/${network}/tmp/aleo_wasm.js";

export async function initThreadPool(threads) {
    if (threads == null) {
        threads = navigator.hardwareConcurrency;
    }

    console.info(\`Spawning \${threads} threads\`);

    await wasmInitThreadPool(new URL("worker.js", import.meta.url), threads);
}`;

    const bundleEsm = await rollup({
        input: { "index": "entry" },
        plugins: [virtual({ "entry": esmEntry })],
    });

    try {
        await bundleEsm.write({
            dir: `dist/${network}`,
            format: "es",
            sourcemap: true,
        });
    } finally {
        await bundleEsm.close();
    }

    // CJS entry: top-level `await` is illegal in CommonJS, so we cannot go
    // through `aleo_wasm.js`. We instead import the underlying glue module
    // (`tmp/index.js`, which has no TLA), synchronously load the .wasm from
    // disk via `fs.readFileSync`, and call `initSync` before re-exporting.
    //
    // The re-export alias list is derived at build time from the ESM entry
    // that wasm-bindgen produces, so the CJS surface stays in sync with the
    // ESM surface without hand-maintenance.
    const aleoWasmEsm = await $fs.readFile(
        `dist/${network}/tmp/aleo_wasm.js`,
        "utf8",
    );
    const reexportAliases = extractReexportAliases(aleoWasmEsm);

    const threadPoolAlias = extractAliasFor(aleoWasmEsm, "initThreadPool");
    const initSyncAlias = extractAliasFor(aleoWasmEsm, "initSync");
    const wbgInitAlias = extractAliasFor(aleoWasmEsm, "__wbg_init");

    const cjsEntry = `import {
    ${wbgInitAlias} as __wbg_init,
    ${initSyncAlias} as __initSync,
    ${threadPoolAlias} as wasmInitThreadPool,
} from "./dist/${network}/tmp/index.js";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Rollup's CJS output transforms \`import.meta.url\` into
// \`pathToFileURL(__filename).href\`, so this resolves to the emitted
// \`index.cjs\` sibling — from which \`aleo_wasm.wasm\` lives next to.
const __here = dirname(fileURLToPath(import.meta.url));
const __wasmBytes = readFileSync(join(__here, "aleo_wasm.wasm"));
__initSync({ module: __wasmBytes });

export { ${reexportAliases} } from "./dist/${network}/tmp/index.js";

export async function initThreadPool(threads) {
    if (threads == null) {
        threads = navigator.hardwareConcurrency;
    }

    console.info(\`Spawning \${threads} threads\`);

    await wasmInitThreadPool(new URL("worker.js", import.meta.url), threads);
}`;

    const bundleCjs = await rollup({
        input: { "index": "entry-cjs" },
        plugins: [virtual({ "entry-cjs": cjsEntry })],
    });

    try {
        await bundleCjs.write({
            dir: `dist/${network}`,
            format: "cjs",
            entryFileNames: "[name].cjs",
            chunkFileNames: "[name].cjs",
            sourcemap: true,
        });
    } finally {
        await bundleCjs.close();
    }
}

// Extract the named-export alias list from wasm-bindgen's generated
// `aleo_wasm.js`, skipping items we handle explicitly in the CJS entry.
function extractReexportAliases(source) {
    const exportMatch = source.match(/export \{([^}]+)\} from/);
    if (!exportMatch) {
        throw new Error("Could not locate re-export block in aleo_wasm.js");
    }
    return exportMatch[1]
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s && !/\bas (?:initSync|__wbg_init|initThreadPool)$/.test(s))
        .join(", ");
}

// Resolve the wasm-bindgen short-name alias (e.g. "a0") for a given long
// name (e.g. "initSync"), so the CJS entry can import from `tmp/index.js`
// (which only exposes short names) rather than through `aleo_wasm.js`
// (which has a top-level await we cannot emit as CJS).
//
// Both `import {…}` and `export {…}` blocks in `aleo_wasm.js` may hold the
// alias (e.g. `__wbg_init` is only in the import block), so we scan both.
function extractAliasFor(source, longName) {
    const blocks = [
        ...source.matchAll(/(?:import|export) \{([^}]+)\} from/g),
    ].map((m) => m[1]);
    for (const block of blocks) {
        const entry = block
            .split(",")
            .map((s) => s.trim())
            .find((s) => new RegExp(`\\bas ${longName}$`).test(s));
        if (entry) {
            return entry.split(/\s+as\s+/)[0];
        }
    }
    throw new Error(`Could not find alias for ${longName} in aleo_wasm.js`);
}


async function buildWorker(network) {
    const worker = `import { init } from "./dist/${network}/tmp/aleo_wasm_custom.js";

async function initializeWorker() {
    // Wait for the main thread to send us the Module, Memory, and Rayon thread pointer.
    function waitForEvent() {
        return new Promise((resolve) => {
            addEventListener("message", (event) => {
                resolve(event.data);
            }, {
                capture: true,
                once: true,
            });
        });
    }

    const { module, memory, address } = await waitForEvent();

    // Runs the Wasm inside of the Worker, but using the main thread's Module and Memory.
    const exports = await init({ module, memory });

    // Tells the main thread that we're finished initializing.
    postMessage(null);

    // This will hang the Worker while running the Rayon thread.
    exports.runRayonThread(address);

    // When the Rayon thread is finished, close the Worker.
    close();
}

await initializeWorker();`;

    await buildRollup({
        input: {
            "worker": "entry",
        },
        plugins: [
            virtual({
                "entry": worker,
            }),
        ],
    }, {
        dir: `dist/${network}`,
        format: "es",
        sourcemap: true,
    });
}


async function buildTypes(network) {
    const js = `/**
 * Initializes a thread pool of Workers. This enables multi-threading, which significantly improves performance.
 *
 * @param {number | undefined} threads  Number of threads to spawn. If not specified, uses the number of available cores.
 */
export function initThreadPool(threads?: number): Promise<void>;

export * from "./aleo_wasm.js";`;

    const worker = `export {};`;

    await $fs.mkdir(`dist/${network}`, { recursive: true })

    await Promise.all([
        // ESM consumers resolve through the `import` condition → `index.d.ts`.
        $fs.writeFile(`dist/${network}/index.d.ts`, js),
        // CJS consumers resolve through the `require` condition → `index.d.cts`.
        // Same declarations; distinct filename satisfies TypeScript's node16
        // module-resolution check and silences `arethetypeswrong`'s
        // "Masquerading as ESM" warning.
        $fs.writeFile(`dist/${network}/index.d.cts`, js),
        $fs.writeFile(`dist/${network}/worker.d.ts`, worker),
    ]);
}


// This uses multiple Rollup builds, instead of 1 build.
//
// The reason is because the `worker.js` file needs to be
// fully self-contained, it cannot contain imports to other
// chunks.
//
// But Rollup doesn't support standalone entry points, so we
// hack around it by instead using multiple builds.
//
// But we want to share the Wasm build between the `index.js`
// and `worker.js` builds, so we build the Wasm, and then
// build the `index.js` and `worker.js` separately.
async function build(network) {
    await Promise.all([
        buildTypes(network),
        buildWasm(network),
    ]);

    await Promise.all([
        buildJS(network),
        buildWorker(network),
    ]);

    await $fs.rename(
        $path.join("dist", network, "tmp", "aleo_wasm.wasm"),
        $path.join("dist", network, "aleo_wasm.wasm"),
    );

    await Promise.all([
        $fs.rm($path.join("dist", network, "tmp"), { recursive: true }),
        $fs.rm($path.join("dist", network, "aleo_wasm_custom.d.ts")),
    ]);
}


console.time("Building wasm");

const networks = [
    "testnet",
    "mainnet",
];

await Promise.all(networks.map(build));

console.timeEnd("Building wasm");
