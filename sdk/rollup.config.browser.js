import typescript from "rollup-plugin-typescript2";

const browserConfig = {
    input: {
        index: "./src/index.ts",
        worker: "./src/worker.ts",
    },
    output: {
        dir: `dist`,
        format: "es",
        sourcemap: true,
    },
    plugins: [
        typescript({
            tsconfig: "tsconfig.json",
            clean: true,
        }),
    ],
};

export default [browserConfig];
