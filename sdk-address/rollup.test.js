import typescript from "rollup-plugin-typescript2";
import { globSync } from "glob";

function inputs() {
    const files = {};

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
