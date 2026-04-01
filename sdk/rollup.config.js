import typescript from "rollup-plugin-typescript2";

const entries = {
  browser: "./src/browser.ts",
  node: "./src/node.ts",
};

export default {
  input: entries,
  output: {
    dir: "dist",
    format: "es",
    sourcemap: true,
  },
  external: [
    "@provablehq/provablekit",
    "@provablehq/provable-engine-wasm",
    "@provablehq/provable-engine-react-native",
  ],
  plugins: [
    typescript({
      tsconfig: "tsconfig.json",
      clean: true,
      tsconfigOverride: {
        compilerOptions: {
          declaration: true,
          rootDir: "./src",
        },
      },
    }),
  ],
  onwarn(warning, warn) {
    if (warning.code === "THIS_IS_UNDEFINED") return;
    warn(warning);
  },
};
