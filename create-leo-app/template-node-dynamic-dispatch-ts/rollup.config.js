import typescript from "rollup-plugin-typescript2";

export default {
    input: {
        index: "./src/index.ts",
    },
    output: {
        dir: `dist`,
        format: "es",
        sourcemap: true,
    },
    external: ["@provablehq/sdk", "fs", "path", "url", "node:fs/promises", "node:perf_hooks"],
    plugins: [
        typescript({
            tsconfig: "tsconfig.json",
            clean: true,
        }),
    ],
};
