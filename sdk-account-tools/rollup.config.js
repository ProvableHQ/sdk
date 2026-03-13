import typescript from "rollup-plugin-typescript2";
import replace from "@rollup/plugin-replace";
import $package from "./package.json" with { type: "json" };

export default {
    input: {
        "node-polyfill": "./src/node-polyfill.ts",
        "browser": "./src/browser.ts",
        "node": "./src/node.ts",
    },
    output: {
        dir: "dist",
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
        // Used by the account-tools SDK
        "comlink",
        "core-js/proposals/json-parse-with-source.js",
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