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
                    "--no-default-features",
                    "--features", `node,${network}`,
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
    Plaintext,
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
    importHook: async (path) => {
        const { createRequire } = await import('module');
        const require = createRequire(import.meta.url);
        return require.resolve(path);
    },
});

async function initThreadPool(threads) {
    if (threads == null) {
        threads = require('os').cpus().length;
    }

    console.info(\`Spawning \${threads} threads\`);

    const { Worker } = require('worker_threads');
    await wasmInitThreadPool((_, options) => new Worker("./worker.js", options), threads);
}

export {
    initThreadPool,
    Address,
    Execution,
    ExecutionResponse,
    Field,
    Metadata,
    OfflineQuery,
    Plaintext,
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
const { parentPort } = require('worker_threads');

async function initializeWorker(wasm) {
  // Use Node.js worker thread messaging
  parentPort.once('message', async (data) => {
      const initWasm = await wasm;
      const { module, memory, address } = data;

      const exports = await initWasm({
          initializeHook: (init) => init(module, memory),
      });

      parentPort.postMessage(null);
      exports.runRayonThread(address);
  });
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
    Plaintext,
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
