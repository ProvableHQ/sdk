import * as fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { emitBindings } from "./memory64/bindings.js";
import {
    buildBindgen,
    cache,
    manifestDirectory,
    prepareDependencies,
    prepareManifest,
    run,
    toolchain,
    wasmRoot,
} from "./memory64/dependencies.js";

const sources = await prepareDependencies();
await prepareManifest(sources);
if (process.argv.includes("--prepare-only")) process.exit(0);
const bindgen = await buildBindgen(sources);
const wasmOpt = fileURLToPath(
    import.meta.resolve("binaryen-memory64/bin/wasm-opt"),
);
const target = "wasm64-unknown-unknown";
// The bindings are published separately as @provablehq/wasm64.
const outputRoot = path.join(wasmRoot, "../wasm64/dist");
const debug = process.env.BUILD_DEBUG === "1";
const rustflags = [
    "-C",
    "target-feature=+atomics,+bulk-memory,+mutable-globals",
    "-C",
    "link-arg=--max-memory=8589934592",
    ...[
        "--shared-memory",
        "--import-memory",
        // As in wasm32: current nightlies no longer export it implicitly, and
        // wasm-bindgen needs it to inject the thread id.
        "--export=__heap_base",
        "--export=__wasm_init_tls",
        "--export=__tls_size",
        "--export=__tls_align",
        "--export=__tls_base",
    ].flatMap((argument) => ["-C", `link-arg=${argument}`]),
    ...[
        [process.env.CARGO_HOME ?? path.join(os.homedir(), ".cargo"), "cargo"],
        [
            process.env.RUSTUP_HOME ?? path.join(os.homedir(), ".rustup"),
            "rustup",
        ],
        [path.dirname(wasmRoot), "."],
    ].flatMap(([from, to]) => ["--remap-path-prefix", `${from}=${to}`]),
];
const environment = {
    ...process.env,
    CARGO_ENCODED_RUSTFLAGS: rustflags.join("\x1f"),
    CARGO_TARGET_DIR: path.join(cache, "target"),
    CARGO_INCREMENTAL: "0",
};
delete environment.RUSTFLAGS;

await fs.rm(outputRoot, { recursive: true, force: true });
for (const network of ["testnet", "mainnet"]) {
    run(
        "cargo",
        [
            `+${toolchain}`,
            "build",
            "--locked",
            "--target",
            target,
            "--manifest-path",
            path.join(manifestDirectory, "Cargo.toml"),
            "--no-default-features",
            "--features",
            `browser,${network}`,
            ...(debug ? [] : ["--release"]),
            "--config",
            'profile.release.panic="abort"',
            "--config",
            "profile.release.codegen-units=1",
            "-Zbuild-std=std,panic_abort",
            "-Zbuild-std-features=optimize_for_size",
        ],
        { cwd: wasmRoot, env: environment },
    );

    const output = path.join(outputRoot, network);
    await fs.mkdir(output, { recursive: true });
    run(
        bindgen,
        [
            path.join(
                environment.CARGO_TARGET_DIR,
                target,
                debug ? "debug" : "release",
                "aleo_wasm.wasm",
            ),
            "--target",
            "web",
            "--out-name",
            "aleo_wasm",
            "--out-dir",
            output,
        ],
        {
            // Stripped release modules may omit target_features. Require the
            // multivalue ABI explicitly instead of the legacy return-pointer shim.
            env: { ...process.env, WASM_BINDGEN_MULTI_VALUE: "1" },
        },
    );
    const raw = path.join(output, "aleo_wasm_bg.wasm");
    const wasm = path.join(output, "aleo_wasm.wasm");
    if (debug) {
        await fs.rename(raw, wasm);
    } else {
        run(process.env.WASM_OPT_BIN ?? process.execPath, [
            ...(process.env.WASM_OPT_BIN ? [] : [wasmOpt]),
            raw,
            "-O",
            "--enable-memory64",
            "--enable-threads",
            "--enable-bulk-memory",
            "--enable-nontrapping-float-to-int",
            "-o",
            wasm,
        ]);
        await fs.rm(raw);
    }

    await emitBindings(output);
}
