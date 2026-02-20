import typescript from "rollup-plugin-typescript2";

export default {
    input: {
        "address": "./src/address.ts",
    },
    output: {
        dir: "dist",
        format: "es",
        sourcemap: true,
    },
    external: [
        "@provablehq/wasm-address",
    ],
    plugins: [
        typescript({
            tsconfig: "tsconfig.json",
            clean: true,
        }),
    ],
};
