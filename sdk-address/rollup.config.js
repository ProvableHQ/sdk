import typescript from "rollup-plugin-typescript2";

const external = ["@provablehq/account-tools-wasm"];

function tsPlugin() {
    return typescript({
        tsconfig: "tsconfig.json",
        clean: true,
    });
}

const browser = {
    input: { "address": "./src/address.ts" },
    output: { dir: "dist/browser", format: "es", sourcemap: true },
    external,
    plugins: [tsPlugin()],
};

const node = {
    input: { "address": "./src/node.ts" },
    output: { dir: "dist/node", format: "es", sourcemap: true },
    external: [...external, "node:fs"],
    plugins: [tsPlugin()],
};

export default [browser, node];
