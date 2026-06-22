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
    const esmEntry = `export * from "./dist/${network}/tmp/aleo_wasm.js";

import { initThreadPool as wasmInitThreadPool } from "./dist/${network}/tmp/aleo_wasm.js";

export async function initThreadPool(threads) {
    if (threads == null) {
        threads = navigator.hardwareConcurrency;
    }

    console.info(\`Spawning \${threads} threads\`);

    await wasmInitThreadPool(new URL("worker.js", import.meta.url), threads);
}`;

    await buildRollup({
        input: { "index": "entry" },
        plugins: [virtual({ "entry": esmEntry })],
    }, {
        dir: `dist/${network}`,
        format: "es",
        sourcemap: true,
    });
}


// Builds a .cjs version which initializes the Wasm synchronously so the
// module can be loaded with `require`. Uses initSync from the custom entry
// and a shallow copy of the wasm exports to override initThreadPool.
async function buildCommonJS(network) {
    const js = `import { module as url, initSync } from "./dist/${network}/tmp/aleo_wasm_custom.js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const wasm = initSync({
    module: readFileSync(fileURLToPath(url)),
});

// We have to make a shallow copy because ES6 exports are frozen.
const exports = { ...wasm };

const wasmInitThreadPool = wasm.initThreadPool;

exports.initThreadPool = async function initThreadPool(threads) {
    if (threads == null) {
        threads = navigator.hardwareConcurrency;
    }

    console.info(\`Spawning \${threads} threads\`);

    await wasmInitThreadPool(new URL("worker.js", import.meta.url), threads);
};

module.exports = exports;`;

    await buildRollup({
        input: { "index": "entry" },
        plugins: [virtual({ "entry": js })],
    }, {
        dir: `dist/${network}`,
        format: "cjs",
        external: ["node:fs", "node:url"],
        entryFileNames: "[name].cjs",
        chunkFileNames: "[name].cjs",
        sourcemap: true,
    });
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
        buildCommonJS(network),
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
];

await Promise.all(networks.map(build));

console.timeEnd("Building wasm");
