import typescript from "rollup-plugin-typescript2";
import replace from "@rollup/plugin-replace";
import $package from "./package.json" with { type: "json" };

const networks = [
    "testnet",
    "mainnet",
];

export default networks.map((network) => {
    return {
        input: {
            "node-polyfill": "./src/node-polyfill.ts",
            "browser": "./src/browser.ts",
            "worker": "./src/worker.ts",
            "node": "./src/node.ts",
        },
        output: {
            dir: `dist/${network}`,
            format: "es",
            sourcemap: true,
        },
        external: [
            // Used by node-polyfill
            "node:worker_threads",
            "node:os",
            "node:fs",
            "node:crypto",
            "mime/lite.js",
            "sync-request",

            // Used by the SDK
            "comlink",
            `@provablehq/wasm/${network}.js`,
        ],
        plugins: [
            replace({
                preventAssignment: true,
                delimiters: ['', ''],
                values: {
                    '%%VERSION%%': $package.version,
                    '%%NETWORK%%': network,
                },
            }),
            typescript({
                tsconfig: "tsconfig.json",
                clean: true,
            }),
        ],
    };
});
