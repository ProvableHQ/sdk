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
    external: ['@aleohq/sdk'],
    plugins: [
        typescript({
            tsconfig: "tsconfig.json",
            clean: true,
        }),
    ],
};
