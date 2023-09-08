import typescript from "rollup-plugin-typescript2";

const nodeConfig = {
    input: {
        index: "./src/index.ts",
    },
    output: {
        dir: `dist`,
        format: "cjs",
        sourcemap: true,
    },
    plugins: [
        typescript({
            tsconfig: "tsconfig.json",
            clean: true,
        }),
    ],
};


export default [nodeConfig];
