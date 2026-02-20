import typescript from "rollup-plugin-typescript2";
import { globSync } from "glob";

function inputs() {
    // node-polyfill must be a separate output chunk so its globalThis.fetch
    // patch executes (as a sibling import) before @provablehq/wasm-address
    // runs its top-level WASM init. Inlined code would run too late.
    const files = {
        "node-polyfill": "./src/node-polyfill.ts",
    };

    globSync("./tests/**/*.ts").forEach((x) => {
        files[x.replace(/\.[^\.]+$/, "")] = x;
    });

    return files;
}

export default {
    input: inputs(),
    output: {
        dir: "tmp",
        chunkFileNames: "[name].js",
        format: "es",
        sourcemap: true,
    },
    external: [
        "node:fs",
        "@provablehq/wasm-address",
        "chai",
    ],
    plugins: [
        typescript({
            tsconfig: "tsconfig.test.json",
            clean: true,
        }),
    ],
};
