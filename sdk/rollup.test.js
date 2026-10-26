import typescript from "rollup-plugin-typescript2";
import replace from "@rollup/plugin-replace";
import { globSync } from "glob";
import $package from "./package.json" with { type: "json" };

const networks = [
    "testnet",
    "mainnet",
];

// `SDK_TEST_VARIANT=wasm64` runs the same tests against the Memory64 build.
const wasm64 = process.env.SDK_TEST_VARIANT === "wasm64";

// Points each SDK and WASM import of the tests and sources at the matching
// Memory64 entry, so that no wasm32 instance is loaded.
function memory64Imports() {
    return {
        name: "memory64-imports",
        resolveId(source) {
            const sdk = /^@provablehq\/sdk(?:\/(testnet|mainnet)\.js)?$/.exec(source);
            if (sdk) {
                return { id: `@provablehq/sdk/wasm64/${sdk[1] ?? "testnet"}.js`, external: true };
            }
            const wasm = /^@provablehq\/wasm(?:\/(testnet|mainnet)\.js)?$/.exec(source);
            if (wasm) {
                return { id: `@provablehq/wasm64/${wasm[1] ?? "testnet"}.js`, external: true };
            }
            if (/^@provablehq\/(sdk|wasm)(\/|$)/.test(source) && !source.startsWith("@provablehq/sdk/wasm64/")) {
                this.error(`No Memory64 mapping for ${source}`);
            }
            return null;
        },
    };
}

function inputs() {
    const files = {};

    globSync("./tests/**/*.ts").forEach((x) => {
        files[x.replace(/\.[^\.]+$/, "")] = x;
    });

    return files;
}

export default networks.map((network) => {
    return {
        input: inputs(),
        output: {
            dir: `tmp/${network}`,
            chunkFileNames: "[name].js",
            format: "es",
            sourcemap: true,
        },
        external: [
            // Used by node-polyfill
            "node:worker_threads",
            "node:os",
            "node:fs",
            "node:crypto",
            "mime/lite",
            "sync-request",
            "xmlhttprequest-ssl",

            // Used by the SDK
            "comlink",
            // Memory64 imports are resolved by memory64Imports().
            ...(wasm64 ? [] : [`@provablehq/wasm/${network}.js`]),
            "core-js/proposals/json-parse-with-source.js",

            // Used by tests
            "chai",
            "sinon",
        ],
        plugins: [
            ...(wasm64 ? [memory64Imports()] : []),
            replace({
                preventAssignment: true,
                delimiters: ['', ''],
                values: {
                    '%%VERSION%%': $package.version,
                    '%%NETWORK%%': network,
                },
            }),
            typescript({
                tsconfig: "tsconfig.test.json",
                clean: true,
            }),
        ],
    };
});
