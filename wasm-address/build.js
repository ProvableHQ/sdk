import * as $fs from "node:fs/promises";
import { rollup } from "rollup";
import rust from "@wasm-tool/rollup-plugin-rust";


async function buildRollup(input, output) {
    const bundle = await rollup(input);

    try {
        await bundle.write(output);

    } finally {
        await bundle.close();
    }
}


// Single network-agnostic build: Console environment works for both mainnet and testnet.
async function build() {
    await buildRollup({
        input: {
            "aleo_wasm_address": "./Cargo.toml",
        },
        plugins: [
            rust({
                extraArgs: {
                    cargo: [
                        "--no-default-features",
                        "--features", "serial",
                    ],
                    wasmOpt: ["-O"],
                },

                experimental: {
                    typescriptDeclarationDir: "dist",
                },
            }),
        ],
    }, {
        dir: "dist",
        format: "es",
        sourcemap: true,
        assetFileNames: "[name][extname]",
        entryFileNames: "[name].js",
    });

    await $fs.writeFile("dist/index.d.ts", `export * from "./account_tools";\n`);

}

console.time("Building wasm-account-tools");
await build();
console.timeEnd("Building-account-tools");
