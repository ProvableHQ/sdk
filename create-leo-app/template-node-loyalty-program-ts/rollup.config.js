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
    external: ["@aleo-viem/core", "@aleo-viem/provable", "dotenv/config", "fs", "path", "url"],
    plugins: [
        typescript({
            tsconfig: "tsconfig.json",
            clean: true,
        }),
    ],
};
