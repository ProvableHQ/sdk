import typescript from "rollup-plugin-typescript2";
import replace from "@rollup/plugin-replace";
import { globSync } from "glob";
import $package from "./package.json" with { type: "json" };

const networks = [
    "testnet",
    "mainnet",
];

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
                tsconfig: "tsconfig.test.json",
                clean: true,
            }),
        ],
    };
});
