import rust from "@wasm-tool/rollup-plugin-rust";

// This uses 3 separate builds, instead of 1 build.
//
// The reason is because the `worker.js` file needs to be
// fully self-contained, it cannot contain imports to other
// chunks.
//
// But Rollup doesn't support standalone entry points, so we
// hack around it by instead using multiple builds.
//
// But we want to share the Wasm build between the `index.js`
// and `worker.js` builds, so we build the Wasm, and then
// build the `index.js` and `worker.js` separately.
export default [
    {
        input: {
            wasm: "./js/wasm.js",
        },
        output: {
            dir: `dist`,
            format: "es",
            sourcemap: true,
            assetFileNames: "assets/[name][extname]",
        },
        plugins: [
            rust({
                cargoArgs: [
                    // This enables multi-threading
                    "--config", `build.rustflags=["-C", "target-feature=+atomics,+bulk-memory,+mutable-globals", "-C", "link-arg=--max-memory=4294967296"]`,
                    "--no-default-features",
                    "--features", "browser",
                    "-Z", "build-std=panic_abort,std",
                ],

                experimental: {
                    typescriptDeclarationDir: "dist/crates",
                },
            }),
        ],
    },

    {
        input: {
            index: "./js/index.js",
        },
        output: {
            dir: `dist`,
            format: "es",
            sourcemap: true,
        },
    },

    {
        input: {
            worker: "./js/worker.js",
        },
        output: {
            dir: `dist`,
            format: "es",
            sourcemap: true,
        },
    },
];
