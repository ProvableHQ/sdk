import typescript from "rollup-plugin-typescript2";

export default {
    input: {
        index: "./src/index.ts",
        thread: "./src/thread.ts",
        worker: "./src/worker.ts",
        node: "./src/node.ts",
        "node-polyfill": "./src/node-polyfill.ts",
    },
    output: {
        dir: `dist`,
        format: "es",
        sourcemap: true,
    },
    external: [
        "node:worker_threads",
        "node:os",
        "node:fs",
        "node:crypto",
        "mime/lite.js",
        "sync-request",
        "axios",
        "comlink",
        "@aleohq/wasm",
        "@aleohq/wasm/worker.js",
    ],
    plugins: [
        typescript({
            tsconfig: "tsconfig.json",
            clean: true,
        }),
    ],
};
