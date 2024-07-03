import typescript from "rollup-plugin-typescript2";
import replace from "@rollup/plugin-replace";
import $package from "./package.json" assert { type: "json" };

export default {
    input: {
        index: "./src/index.ts",
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
        "comlink",
        "@provablehq/wasm",
    ],
    plugins: [
        replace({
            preventAssignment: true,
            delimiters: ['', ''],
            values: {
                '%%VERSION%%': $package.version,
            },
        }),
        typescript({
            tsconfig: "tsconfig.json",
            clean: true,
        }),
    ],
};
