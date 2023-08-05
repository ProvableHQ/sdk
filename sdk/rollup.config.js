import alias from "@rollup/plugin-alias";
import typescript from "rollup-plugin-typescript2";
function createConfig(target) {
  return {
    input: "src/index.ts",
    output: {
      file: `dist/bundle.${target}.js`,
      format: target === "browser" ? "esm" : "cjs",
    },
    plugins: [
      alias({
        entries: [
          {
            find: "./node",
            replacement: target === "browser" ? "./browser" : "./node",
          },
        ],
      }),
      typescript(),
    ],
  };
}
export default [createConfig("node"), createConfig("browser")];
