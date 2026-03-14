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
        "node:fs"
    ],
    plugins: [
        typescript({
            tsconfig: "tsconfig.json",
            clean: true,
        }),
    ],
};