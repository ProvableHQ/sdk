#!/usr/bin/env node
// Benchmarks the SDK on the production Shield Swap and bridge programs, and
// reports the peak WebAssembly linear memory each step needs, so a wasm32
// build (4 GiB cap) can be compared with a wasm64 build and any out-of-memory
// failure is reported as a result rather than a crash.
//
// Each (build, case, repetition) runs in its own child process: wasm linear
// memory never shrinks, so the memory size after a step is the peak so far,
// and a build that dies from exhausted memory takes only its own process down.
//
// Steps per case:
//   authorize    run the function and sign the request (no circuit)
//   synthesize   execute the circuit and synthesize the proving key
//   prove        generate the execution proof with the synthesized key
// Functions that consume a record need a ledger state path for the inclusion
// proof, which an offline run cannot supply, so those cases stop after
// `synthesize` and say so.
//
// Program sources are fetched from the explorer API once and cached on disk
// (see --cache); nothing else touches the network, and proving uses an
// OfflineQuery with a fixed state root, so timings exclude I/O.
//
// Run against the local build (after `yarn build:all`):
//   node benchmarks/programs.mjs
//   node benchmarks/programs.mjs --case claim_swap_output,transfer_remote --reps 2
// Compare two builds, e.g. wasm32 against the Memory64 variant:
//   node benchmarks/programs.mjs --sdk dist/mainnet/node.js --compare dist/wasm64/mainnet/node.js
//
// Options:
//   --sdk <path>        entry to benchmark (default ../dist/mainnet/node.js)
//   --compare <path>    second entry to run side by side
//   --case <a,b,...>    subset of cases (default: all; --list prints them)
//   --reps <n>          repetitions per (build, case), min of them reported (default 1)
//   --threads <0|1>     1 = single-threaded, 0 = initThreadPool() (default 0)
//   --timeout <min>     per-process limit; a hung run is reported, not waited on (default 30)
//   --cache <dir>       program source cache (default <tmpdir>/provablehq-sdk-bench-programs)
//   --api <url>         explorer API base used to fetch programs
//   --json              print the raw JSON instead of a table
//   --out <file>        also write the raw JSON to a file
import { performance } from "node:perf_hooks";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const { values: args } = parseArgs({
    options: {
        sdk: { type: "string" },
        compare: { type: "string" },
        case: { type: "string" },
        reps: { type: "string", default: "1" },
        threads: { type: "string", default: "0" },
        timeout: { type: "string", default: "30" },
        cache: { type: "string" },
        api: {
            type: "string",
            default: "https://api.explorer.provable.com/v1/mainnet",
        },
        json: { type: "boolean", default: false },
        out: { type: "string" },
        list: { type: "boolean", default: false },
        child: { type: "boolean", default: false },
    },
});
const here = path.dirname(fileURLToPath(import.meta.url));
const entry = path.resolve(
    args.sdk ?? path.join(here, "..", "dist", "mainnet", "node.js"),
);
const reps = positiveInt("--reps", args.reps);
const timeoutMs = positiveInt("--timeout", args.timeout) * 60_000;
if (args.threads !== "0" && args.threads !== "1")
    throw new Error(`--threads must be 0 or 1, got ${args.threads}`);
const singleThreaded = args.threads === "1";
const cacheDir =
    args.cache ?? path.join(os.tmpdir(), "provablehq-sdk-bench-programs");

// ---------------------------------------------------------------------------
// Fixtures. All programs are the mainnet deployments; sources are fetched.
// ---------------------------------------------------------------------------

const PRIVATE_KEY =
    "APrivateKey1zkpJkyYRGYtkeHDaFfwsKtUJzia7csiWhfBWPXWhXJzy9Ls";
// Any well-formed state root works for an offline proof; the inclusion
// circuit is not checked against the live ledger here.
const STATE_ROOT =
    "sr1x7rz2jnh3hutsvndz7ezml6zextccc6fqfvx7htrd2zj847htg8qt5sn86";
const BLOCK_HEIGHT = 23_040_114;

const SHIELD_SWAP = "shield_swap.aleo";
// Shield Swap token ids are the AMM token program's name encoded as a field.
const TOKEN_ETH = "1926848598207449231969field"; // arc20_eth.aleo
const TOKEN_USDCX =
    "212707628815602939926313406778312270053663804591730917421274098438979020915field"; // shield_swap_arc20_wrapped_usdcx.aleo
const TOKEN_ALEO =
    "724721105858008932013114020280511843613117371369744086165619field"; // shield_swap_arc20_credits.aleo
const POOL_ETH_USDCX =
    "2232891570746089763193425987110538662326395514514201438030838477905900370491field";
const POOL_ALEO_USDCX =
    "5056946937678039811306358517195250788351308978545629628803178093446441865124field";
const SQRT_PRICE_MIN = "{ hi: 0u128, lo: 4295128740u128 }";
const SQRT_PRICE_MAX =
    "{ hi: 4294805859u128, lo: 340282366920938463463374607431768211455u128 }";
const NO_DEADLINE = "4294967295u32";
// The legacy all-zero freezelist non-inclusion witness the AMM accepts.
const EMPTY_MERKLE_PROOF = `{ siblings: [${Array(16).fill("0field").join(", ")}], leaf_index: 1u32 }`;
const EMPTY_MERKLE_PROOFS = `[${EMPTY_MERKLE_PROOF}, ${EMPTY_MERKLE_PROOF}]`;
const ZERO_BYTES_32 = `[${Array(32).fill("0u8").join(", ")}]`;

// Domain separators of the AMM's blinded-identity scheme (see
// shield_swap.aleo `verify_blinded_address`).
const BLINDING_FACTOR_DOMAIN =
    "42815354924796718559205719970686750292466968495484257field";
const CLAIM_OR_SWAP_DOMAIN =
    "11835072102227764468342786961086432175093421716844963782363567713633field";

// hyp_warp_token_eth_v2.aleo/transfer_remote_as_signer inputs, as the Veil
// bridge SDK builds them for route hyperlane:aleo/eth->ethereum/eth in signer
// mode with a 250000 microcredit hook payment (registry reviewed 2026-09-28).
const HYPERLANE_ETH_INPUTS = [
    "{ token_type: 1u8, token_owner: aleo1wq6f6qdqya44avznygz5hae40u3mjg64w0r93a4qfu4utpf8cg9q566f4r, ism: aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc, hook: aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc, token_id: 133188123661477349522757068766864658505569365361420630212878794317749195359field, local_decimals: 18u8, remote_decimals: 18u8 }",
    "{ default_hook: aleo194tz0jmyq8rd9htvnqppqw4jqerk2p2zd8plzn3sxl06wcgsm5pq9fka74, required_hook: aleo1yxevh9qgxehej46j7vueplwjcpfdfml2dje3ey4ukzknx7wzasgqnxgq82 }",
    "{ domain: 1u32, recipient: [0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 56u8, 212u8, 71u8, 105u8, 79u8, 92u8, 31u8, 119u8, 58u8, 227u8, 19u8, 44u8, 249u8, 59u8, 243u8, 11u8, 126u8, 193u8, 250u8, 90u8], gas: 44000u128 }",
    "1u32",
    "[0u128, 1329227995784915872903807060280344576u128]",
    "1000000000000000000u128",
    "[{ spender: aleo194tz0jmyq8rd9htvnqppqw4jqerk2p2zd8plzn3sxl06wcgsm5pq9fka74, amount: 250000u64 }, { spender: aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc, amount: 0u64 }, { spender: aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc, amount: 0u64 }, { spender: aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc, amount: 0u64 }]",
];

// `build(ctx)` returns { program, fn, inputs, extraImports }; `extraImports`
// are dynamic-dispatch targets the program does not import statically.
// `provable: false` marks functions with a record input (see header).
const CASES = {
    swap: {
        title: "shield_swap.aleo/swap (ETH -> USDCx)",
        provable: false,
        build: (c) => ({
            program: SHIELD_SWAP,
            fn: "swap",
            extraImports: [
                "arc20_eth.aleo",
                "shield_swap_arc20_wrapped_usdcx.aleo",
            ],
            inputs: [
                c.tokenRecord("2000000000000000000"),
                c.blindingFactor,
                c.blindedAddress,
                POOL_ETH_USDCX,
                "true",
                "1000000000000000000u128",
                "1u128",
                SQRT_PRICE_MIN,
                "1u64",
                NO_DEADLINE,
                TOKEN_ETH,
                TOKEN_USDCX,
            ],
        }),
    },
    swap_multi_hop: {
        title: "shield_swap.aleo/swap_multi_hop (ETH -> USDCx -> ALEO)",
        provable: false,
        build: (c) => ({
            program: SHIELD_SWAP,
            fn: "swap_multi_hop",
            extraImports: [
                "arc20_eth.aleo",
                "shield_swap_arc20_wrapped_usdcx.aleo",
                "shield_swap_arc20_credits.aleo",
            ],
            inputs: [
                c.blindingFactor,
                c.blindedAddress,
                c.tokenRecord("2000000000000000000"),
                TOKEN_ETH,
                TOKEN_ALEO,
                "1000000000000000000u128",
                "1u128",
                `{ pool: ${POOL_ETH_USDCX}, zero_for_one: true, sqrt_price_limit: ${SQRT_PRICE_MIN} }`,
                `{ pool: ${POOL_ALEO_USDCX}, zero_for_one: false, sqrt_price_limit: ${SQRT_PRICE_MAX} }`,
                "{ pool: 0field, zero_for_one: false, sqrt_price_limit: { hi: 0u128, lo: 0u128 } }",
                "2u8",
                "1u64",
                NO_DEADLINE,
            ],
        }),
    },
    swap_from_wrapped: {
        title: "shield_swap_router.aleo/swap_from_wrapped (USDCx -> ETH)",
        provable: false,
        build: (c) => ({
            program: "shield_swap_router.aleo",
            fn: "swap_from_wrapped",
            extraImports: [
                "usdcx_stablecoin.aleo",
                "shield_swap_arc20_wrapped_usdcx.aleo",
                "arc20_eth.aleo",
            ],
            inputs: [
                c.tokenRecord("2000000"),
                EMPTY_MERKLE_PROOFS,
                c.blindingFactor,
                c.blindedAddress,
                POOL_ETH_USDCX,
                "false",
                "1000000u128",
                "1u128",
                SQRT_PRICE_MAX,
                "1u64",
                NO_DEADLINE,
                TOKEN_ETH,
                TOKEN_USDCX,
            ],
        }),
    },
    claim_swap_output: {
        title: "shield_swap.aleo/claim_swap_output (ETH -> USDCx)",
        provable: true,
        build: (c) => ({
            program: SHIELD_SWAP,
            fn: "claim_swap_output",
            extraImports: [
                "arc20_eth.aleo",
                "shield_swap_arc20_wrapped_usdcx.aleo",
            ],
            inputs: [
                c.blindingFactor,
                c.blindedAddress,
                "1field",
                TOKEN_ETH,
                TOKEN_USDCX,
                "1000000u128",
                "1u128",
                EMPTY_MERKLE_PROOFS,
            ],
        }),
    },
    burn_public_as_signer: {
        title: "usdcx_bridge_v2.aleo/burn_public_as_signer (USDCx -> Ethereum)",
        provable: true,
        build: () => ({
            program: "usdcx_bridge_v2.aleo",
            fn: "burn_public_as_signer",
            extraImports: [],
            inputs: ["1000000u128", "0u32", ZERO_BYTES_32],
        }),
    },
    private_burn: {
        title: "shielded_usdcx_wrapper.aleo/private_burn (private USDCx -> Ethereum)",
        provable: false,
        build: (c) => ({
            program: "shielded_usdcx_wrapper.aleo",
            fn: "private_burn",
            extraImports: [],
            inputs: [
                c.tokenRecord("2000000"),
                "1000000u128",
                "0u32",
                ZERO_BYTES_32,
                EMPTY_MERKLE_PROOFS,
            ],
        }),
    },
    transfer_remote: {
        title: "hyp_warp_token_eth_v2.aleo/transfer_remote_as_signer (ETH -> Ethereum)",
        provable: true,
        build: () => ({
            program: "hyp_warp_token_eth_v2.aleo",
            fn: "transfer_remote_as_signer",
            extraImports: [],
            inputs: HYPERLANE_ETH_INPUTS,
        }),
    },
};

if (args.list) {
    for (const [name, c] of Object.entries(CASES))
        console.log(
            `${name.padEnd(24)} ${c.title}${c.provable ? "" : "  [synthesize only: record input]"}`,
        );
    process.exit(0);
}
const caseNames = args.case
    ? args.case.split(",").map((s) => s.trim())
    : Object.keys(CASES);
for (const name of caseNames)
    if (!CASES[name])
        throw new Error(`unknown case ${name}; --list prints the cases`);

if (args.child) {
    console.log(JSON.stringify(await runCase(entry, caseNames[0])));
    process.exit(0);
}
const builds = [entry, ...(args.compare ? [path.resolve(args.compare)] : [])];
const results = await orchestrate(builds, caseNames);
if (args.out) fs.writeFileSync(args.out, JSON.stringify(results, null, 2));
if (args.json) console.log(JSON.stringify(results, null, 2));
else printReport(results);

// ---------------------------------------------------------------------------
// Child: one (build, case) run.
// ---------------------------------------------------------------------------

async function fetchProgram(id) {
    const file = path.join(cacheDir, id);
    if (fs.existsSync(file)) return fs.readFileSync(file, "utf8");
    const res = await fetch(`${args.api}/program/${id}`);
    if (!res.ok) throw new Error(`fetching ${id}: HTTP ${res.status}`);
    const source = await res.json();
    if (typeof source !== "string")
        throw new Error(`fetching ${id}: unexpected body`);
    fs.mkdirSync(cacheDir, { recursive: true });
    fs.writeFileSync(file, source);
    return source;
}

// Program id -> source for `ids` and every program they import, transitively.
async function importClosure(ids, acc = {}) {
    for (const id of ids) {
        if (acc[id]) continue;
        acc[id] = await fetchProgram(id);
        await importClosure(
            [...acc[id].matchAll(/^import ([\w.]+);/gm)].map((m) => m[1]),
            acc,
        );
    }
    return acc;
}

// The wasm linear memory, through the same ESM module instance the SDK entry
// imported (wasm-bindgen's initSync() returns the live exports once loaded).
async function wasmMemory(sdkEntry) {
    try {
        const pkg = sdkEntry.includes("wasm64")
            ? "@provablehq/wasm-memory64"
            : "@provablehq/wasm";
        const network = sdkEntry.includes("testnet") ? "testnet" : "mainnet";
        const require = createRequire(sdkEntry);
        const esm = require
            .resolve(`${pkg}/${network}.js`)
            .replace(/\.cjs$/, ".js");
        const mod = await import(pathToFileURL(esm));
        const memory = mod.initSync?.()?.memory;
        return memory instanceof WebAssembly.Memory ? memory : undefined;
    } catch {
        return undefined;
    }
}

function memoryIs64(memory) {
    try {
        return typeof memory.grow(0n) === "bigint";
    } catch {
        return false;
    }
}

async function runCase(sdkEntry, caseName) {
    const spec = CASES[caseName];
    const sdk = await import(pathToFileURL(sdkEntry));
    const {
        PrivateKey,
        Address,
        Field,
        Scalar,
        U32,
        Poseidon8,
        ProgramManagerBase,
        OfflineQuery,
        QueryOption,
        initThreadPool,
    } = sdk;
    const memory = await wasmMemory(sdkEntry);
    const memoryBytes = () => memory?.buffer.byteLength ?? null;
    // A Memory64 memory takes bigint page counts; a wasm32 memory rejects
    // them. The caps are the ones the builds link with (wasm/build.js sets
    // --max-memory=4 GiB for wasm32; the Memory64 build uses 8 GiB).
    const variant = memory
        ? memoryIs64(memory)
            ? "wasm64"
            : "wasm32"
        : "unknown";
    const memoryMax = { wasm32: 2 ** 32, wasm64: 2 ** 33 }[variant] ?? null;
    if (!singleThreaded) await initThreadPool();

    const privateKey = PrivateKey.from_string(PRIVATE_KEY);
    const address = privateKey.to_address().to_string();
    const ctx = {
        ...blindedIdentity(
            { Address, Field, Scalar, U32, Poseidon8 },
            privateKey,
            address,
        ),
        tokenRecord: (amount) =>
            `{ owner: ${address}.private, amount: ${amount}u128.private, _nonce: 0group.public }`,
    };
    const { program, fn, inputs, extraImports } = spec.build(ctx);

    const sources = await importClosure([program, ...extraImports]);
    const programSource = sources[program];
    const imports = Object.fromEntries(
        Object.entries(sources).filter(([id]) => id !== program),
    );

    const result = {
        case: caseName,
        build: sdkEntry,
        variant,
        memoryMax,
        program,
        fn,
        steps: [],
    };
    const step = async (name, run) => {
        progress(name, memoryBytes());
        const start = performance.now();
        try {
            const value = await run();
            result.steps.push({
                name,
                status: "ok",
                ms: performance.now() - start,
                memory: memoryBytes(),
                rss: process.memoryUsage().rss,
            });
            return value;
        } catch (error) {
            const message = String(error?.message ?? error);
            result.steps.push({
                name,
                status: isOutOfMemory(message, memoryBytes(), memoryMax)
                    ? "oom"
                    : "error",
                ms: performance.now() - start,
                memory: memoryBytes(),
                rss: process.memoryUsage().rss,
                error: message.slice(0, 500),
            });
            return undefined;
        }
    };

    const authorization = await step("authorize", () =>
        ProgramManagerBase.authorize(
            privateKey,
            programSource,
            fn,
            inputs,
            imports,
        ),
    );
    if (!authorization) return result;
    const response = await step("synthesize", () =>
        ProgramManagerBase.executeFunctionOffline(
            privateKey,
            programSource,
            fn,
            inputs,
            false,
            true,
            imports,
        ),
    );
    if (!response) return result;
    if (!spec.provable) {
        result.steps.push({
            name: "prove",
            status: "skipped",
            reason: "record input needs a ledger state path",
        });
        return result;
    }
    // KeyPair.provingKey()/verifyingKey() move the keys out: call each once.
    const keys = response.getKeys();
    const provingKey = keys.provingKey();
    const verifyingKey = keys.verifyingKey();
    const query = QueryOption.offlineQuery(
        new OfflineQuery(BLOCK_HEIGHT, STATE_ROOT),
    );
    await step("prove", () =>
        ProgramManagerBase.executeFunctionOffline(
            privateKey,
            programSource,
            fn,
            inputs,
            true,
            false,
            imports,
            provingKey,
            verifyingKey,
            null,
            query,
        ),
    );
    return result;
}

// Port of the Veil SDK's derivation (counter 0): the program recomputes the
// blinded address from the signer and the private blinding factor.
function blindedIdentity(
    { Address, Field, Scalar, U32, Poseidon8 },
    privateKey,
    address,
) {
    // Poseidon8.hash() takes ownership of its inputs, so every Field is
    // created for a single use.
    const contract = () =>
        Address.fromProgramId(SHIELD_SWAP).toGroup().toXCoordinate();
    const viewKey = Scalar.fromString(
        privateKey.to_view_key().to_scalar().toString(),
    ).toField();
    const counter = U32.fromString("0u32").toScalar().toField();
    const blindingFactor = new Poseidon8()
        .hash([
            contract(),
            Field.fromString(BLINDING_FACTOR_DOMAIN),
            viewKey,
            counter,
        ])
        .toString();
    const signer = Address.from_string(address).toGroup().toXCoordinate();
    const bits = [
        contract(),
        Field.fromString(CLAIM_OR_SWAP_DOMAIN),
        signer,
        Field.fromString(blindingFactor),
    ].flatMap((f) => f.toBitsLe());
    const fields = [];
    for (let i = 0; i < bits.length; i += 252)
        fields.push(Field.fromBitsLe(bits.slice(i, i + 252)));
    const blindedAddress = Address.fromGroup(
        new Poseidon8().hashToGroup(fields).clone(),
    ).toString();
    return { blindingFactor, blindedAddress };
}

function isOutOfMemory(message, memory, memoryMax) {
    if (
        /memory allocation of \d+ bytes failed|Maximum memory size exceeded|out of memory|Out of bounds memory access|unreachable/i.test(
            message,
        )
    )
        return true;
    return memory !== null && memoryMax !== null && memory >= memoryMax * 0.97;
}

function progress(step, memory) {
    process.stdout.write(`@@${JSON.stringify({ step, memory })}\n`);
}

// ---------------------------------------------------------------------------
// Parent: orchestration and report.
// ---------------------------------------------------------------------------

function runChild(build, caseName) {
    return new Promise((resolve) => {
        const child = spawn(
            process.execPath,
            [
                fileURLToPath(import.meta.url),
                "--child",
                "--sdk",
                build,
                "--case",
                caseName,
                "--threads",
                singleThreaded ? "1" : "0",
                "--cache",
                cacheDir,
                "--api",
                args.api,
            ],
            { stdio: ["ignore", "pipe", "pipe"] },
        );
        let stdout = "";
        let stderr = "";
        let last = null;
        child.stdout.on("data", (d) => {
            stdout += d;
            for (const m of String(d).matchAll(/^@@(.*)$/gm)) {
                try {
                    last = JSON.parse(m[1]);
                } catch {}
            }
        });
        child.stderr.on("data", (d) => {
            stderr += d;
        });
        const timer = setTimeout(() => child.kill("SIGKILL"), timeoutMs);
        child.on("close", (code, signal) => {
            clearTimeout(timer);
            const line = stdout
                .split("\n")
                .filter((l) => l.startsWith("{"))
                .pop();
            if (line) {
                try {
                    return resolve(JSON.parse(line));
                } catch {}
            }
            // No result: the process died (allocation failure aborts the wasm
            // instance, a worker thread can take the process with it) or hung.
            // Prefer the thrown error's own line over the stack trace.
            const errorLine =
                stderr
                    .split("\n")
                    .filter((l) => /^\s*(\w*Error|panicked at)/.test(l))
                    .pop() ?? stderr.trim().split("\n").pop();
            const message =
                signal === "SIGKILL" && !code
                    ? `no result after ${timeoutMs / 60_000} min`
                    : `process exited with ${signal ?? code}: ${(errorLine ?? "").trim().slice(0, 400)}`;
            const status =
                /memory allocation of|Maximum memory size|out of memory|unreachable/i.test(
                    stderr,
                )
                    ? "oom"
                    : signal === "SIGKILL" && !code
                      ? "timeout"
                      : "error";
            resolve({
                case: caseName,
                build,
                variant: "unknown",
                memoryMax: null,
                steps: [
                    {
                        name: last?.step ?? "load",
                        status,
                        ms: null,
                        memory: last?.memory ?? null,
                        error: message,
                    },
                ],
            });
        });
    });
}

async function orchestrate(builds, caseNames) {
    const runs = [];
    for (const caseName of caseNames) {
        for (let rep = 0; rep < reps; rep++) {
            for (const build of builds) {
                process.stderr.write(
                    `${caseName} rep ${rep + 1}/${reps}: ${build}\n`,
                );
                const r = await runChild(build, caseName);
                r.rep = rep;
                runs.push(r);
                process.stderr.write(
                    `  ${r.steps.map((s) => `${s.name} ${s.status}${s.ms ? ` ${(s.ms / 1000).toFixed(1)}s` : ""}${s.memory ? ` ${mib(s.memory)} MiB` : ""}`).join("; ")}\n`,
                );
            }
        }
    }
    return {
        builds: builds.map((b) => summarizeBuild(runs, b)),
        cases: caseNames,
        reps,
        threads: singleThreaded ? 1 : "pool",
        runs,
    };
}

function summarizeBuild(runs, build) {
    const mine = runs.filter((r) => r.build === build);
    const variant =
        mine.find((r) => r.variant !== "unknown")?.variant ?? "unknown";
    const memoryMax = mine.find((r) => r.memoryMax)?.memoryMax ?? null;
    const cases = {};
    for (const r of mine) {
        const c = (cases[r.case] ??= { steps: {} });
        for (const s of r.steps) {
            const agg = (c.steps[s.name] ??= {
                status: s.status,
                minMs: null,
                peakMemory: null,
                error: s.error,
            });
            // The worst status wins across repetitions; times are the min.
            if (rank(s.status) > rank(agg.status)) {
                agg.status = s.status;
                agg.error = s.error;
            }
            if (s.ms !== null && s.ms !== undefined)
                agg.minMs =
                    agg.minMs === null ? s.ms : Math.min(agg.minMs, s.ms);
            if (s.memory)
                agg.peakMemory = Math.max(agg.peakMemory ?? 0, s.memory);
        }
    }
    const peakMemory = Math.max(
        0,
        ...Object.values(cases).flatMap((c) =>
            Object.values(c.steps).map((s) => s.peakMemory ?? 0),
        ),
    );
    const oom = Object.entries(cases)
        .filter(([, c]) =>
            Object.values(c.steps).some((s) => s.status === "oom"),
        )
        .map(([n]) => n);
    const failed = Object.entries(cases)
        .filter(([, c]) =>
            Object.values(c.steps).some(
                (s) => s.status === "error" || s.status === "timeout",
            ),
        )
        .map(([n]) => n);
    return { build, variant, memoryMax, peakMemory, oom, failed, cases };
}

function rank(status) {
    return { ok: 0, skipped: 0, error: 1, timeout: 2, oom: 3 }[status] ?? 1;
}

function printReport(results) {
    const { builds } = results;
    builds.forEach((b, i) =>
        console.log(
            `${label(i)}: ${b.build} [${b.variant}${b.memoryMax ? `, memory max ${mib(b.memoryMax)} MiB` : ""}]`,
        ),
    );
    console.log(
        `threads: ${results.threads}; reps: ${results.reps}; min time and peak wasm memory over reps\n`,
    );
    const header = ["case", "step", ...builds.map((_, i) => `${label(i)} s`)];
    if (builds.length === 2) header.push("B/A");
    header.push(
        ...builds.map((_, i) => `${label(i)} peak MiB`),
        ...builds.map((_, i) => `${label(i)} status`),
    );
    const rows = [];
    for (const caseName of results.cases) {
        for (const stepName of ["authorize", "synthesize", "prove"]) {
            const cells = builds.map((b) => b.cases[caseName]?.steps[stepName]);
            if (cells.every((c) => !c)) continue;
            const row = [
                caseName,
                stepName,
                ...cells.map((c) =>
                    c?.minMs != null ? (c.minMs / 1000).toFixed(1) : "-",
                ),
            ];
            if (builds.length === 2) {
                const [a, b] = cells;
                row.push(
                    a?.minMs && b?.minMs
                        ? (b.minMs / a.minMs).toFixed(2) + "x"
                        : "-",
                );
            }
            row.push(
                ...cells.map((c) => (c?.peakMemory ? mib(c.peakMemory) : "-")),
            );
            row.push(
                ...cells.map((c) =>
                    c
                        ? c.status === "skipped"
                            ? "skipped"
                            : c.status.toUpperCase() === "OK"
                              ? "ok"
                              : c.status.toUpperCase()
                        : "-",
                ),
            );
            rows.push(row);
        }
    }
    table(header, rows);
    console.log();
    for (const [i, b] of builds.entries()) {
        const cap = b.memoryMax
            ? ` of the ${mib(b.memoryMax)} MiB cap (${((b.peakMemory / b.memoryMax) * 100).toFixed(0)}%)`
            : "";
        console.log(
            `${label(i)} (${b.variant}): peak wasm memory ${mib(b.peakMemory)} MiB${cap}.`,
        );
        if (b.oom.length)
            console.log(`  OUT OF MEMORY in ${b.variant}: ${b.oom.join(", ")}`);
        else console.log(`  No case ran out of memory in ${b.variant}.`);
        if (b.failed.length)
            console.log(`  Failed or timed out: ${b.failed.join(", ")}`);
        for (const [name, c] of Object.entries(b.cases))
            for (const [stepName, s] of Object.entries(c.steps))
                if (s.error) console.log(`  ${name}/${stepName}: ${s.error}`);
    }
    const skipped = results.cases.filter((n) => !CASES[n].provable);
    if (skipped.length)
        console.log(
            `\nSynthesize only (record input needs a ledger state path for the inclusion proof): ${skipped.join(", ")}.`,
        );
}

function table(header, rows) {
    const widths = header.map((h, c) =>
        Math.max(h.length, ...rows.map((r) => String(r[c]).length)),
    );
    const line = (cells) =>
        cells
            .map((c, i) =>
                i < 2
                    ? String(c).padEnd(widths[i])
                    : String(c).padStart(widths[i]),
            )
            .join("  ");
    console.log(line(header));
    console.log(widths.map((w) => "-".repeat(w)).join("  "));
    rows.forEach((r) => console.log(line(r)));
}

function label(i) {
    return String.fromCharCode(65 + i);
}
function mib(bytes) {
    return Math.round(bytes / 2 ** 20);
}
function positiveInt(flag, value) {
    const n = Number(value);
    if (!Number.isInteger(n) || n < 1)
        throw new Error(`${flag} must be a positive integer, got ${value}`);
    return n;
}
