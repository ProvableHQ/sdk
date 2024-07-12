import * as $fs from "node:fs/promises";
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


async function buildWasm(network) {
    await buildRollup({
        input: {
            "aleo_wasm": "entry",
        },
        plugins: [
            virtual({
                "entry": `export { default } from "./Cargo.toml";`,
            }),

            rust({
                cargoArgs: [
                    // This enables multi-threading
                    "--config", `build.rustflags=["-C", "target-feature=+atomics,+bulk-memory,+mutable-globals", "-C", "link-arg=--max-memory=4294967296"]`,
                    "--no-default-features",
                    "--features", `browser,${network}`,
                    "-Z", "build-std=panic_abort,std",
                ],

                experimental: {
                    typescriptDeclarationDir: `dist/${network}`,
                },
            }),
        ],
    }, {
        dir: `dist/${network}`,
        format: "es",
        sourcemap: true,
        assetFileNames: `[name][extname]`,
    });
}


async function buildJS(network) {
    const js = `import wasm from "./dist/${network}/aleo_wasm.js";

const {
    initThreadPool: wasmInitThreadPool,
    Address,
    Execution,
    ExecutionResponse,
    Field,
    Metadata,
    OfflineQuery,
    Private,
    PrivateKey,
    PrivateKeyCiphertext,
    Program,
    ProvingKey,
    RecordCiphertext,
    RecordPlaintext,
    ProgramManager,
    Signature,
    Transaction,
    ViewKey,
    VerifyingKey,
    verifyFunctionExecution,
} = await wasm({
    importHook: () => {
        return new URL("aleo_wasm.wasm", import.meta.url);
    },
});

async function initThreadPool(threads) {
    if (threads == null) {
        threads = navigator.hardwareConcurrency;
    }

    console.info(\`Spawning \${threads} threads\`);

    await wasmInitThreadPool(new URL("worker.js", import.meta.url), threads);
}

export {
    initThreadPool,
    Address,
    Execution,
    ExecutionResponse,
    Field,
    Metadata,
    OfflineQuery,
    PrivateKey,
    PrivateKeyCiphertext,
    Program,
    ProvingKey,
    RecordCiphertext,
    RecordPlaintext,
    ProgramManager,
    Signature,
    Transaction,
    ViewKey,
    VerifyingKey,
    verifyFunctionExecution,
};`;

    await buildRollup({
        input: {
            "index": "entry",
        },
        plugins: [
            virtual({
                "entry": js,
            }),
        ],
    }, {
        dir: `dist/${network}`,
        format: "es",
        sourcemap: true,
    });
}


async function buildWorker(network) {
    const worker = `import wasm from "./dist/${network}/aleo_wasm.js";

async function initializeWorker(wasm) {
    // Wait for the main thread to send us the Module, Memory, and Rayon thread pointer.
    function wait() {
        return new Promise((resolve) => {
            addEventListener("message", (event) => {
                resolve(event.data);
            }, {
                capture: true,
                once: true,
            });
        });
    }

    const [initWasm, { module, memory, address }] = await Promise.all([
        wasm,
        wait(),
    ]);

    // Runs the Wasm inside of the Worker, but using the main thread's Module and Memory.
    const exports = await initWasm({
        initializeHook: (init, path) => init(module, memory),
    });

    // Tells the main thread that we're finished initializing.
    postMessage(null);

    // This will hang the Worker while running the Rayon thread.
    exports.runRayonThread(address);

    // When the Rayon thread is finished, close the Worker.
    close();
}

await initializeWorker(wasm);`;

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

export {
    Address,
    Execution,
    ExecutionResponse,
    Field,
    Metadata,
    OfflineQuery,
    PrivateKey,
    PrivateKeyCiphertext,
    Program,
    ProvingKey,
    RecordCiphertext,
    RecordPlaintext,
    ProgramManager,
    Signature,
    Transaction,
    ViewKey,
    VerifyingKey,
    verifyFunctionExecution,
} from "./aleo_wasm";`;

    const worker = `export {};`;

    await $fs.mkdir(`dist/${network}`, { recursive: true })

    await Promise.all([
        $fs.writeFile(`dist/${network}/index.d.ts`, js),
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
}


const networks = [
    "testnet",
    "mainnet",
];

await Promise.all(networks.map(build));
