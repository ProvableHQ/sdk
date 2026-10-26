#!/usr/bin/env node
// Benchmarks the SDK's wasm hot paths: authorization, fee authorization, proving
// key synthesis, proof generation, proof verification, and a few cheap primitives.
//
// Run against the local build (after `yarn build:all`):
//   yarn bench                                  # mainnet, multi-threaded
//   yarn bench --network testnet --threads 1
//
// Compare two builds (e.g. the local build vs. a published release installed
// elsewhere). Each build runs in its own process, alternating, so the wasm
// instances never share a heap:
//   npm i --prefix /tmp/sdk-baseline @provablehq/sdk@0.12.1
//   yarn bench --compare /tmp/sdk-baseline/node_modules/@provablehq/sdk/dist/mainnet/node.js
//
// Options:
//   --network <mainnet|testnet>  which dist entry to load (default mainnet)
//   --sdk <path>                 explicit entry to benchmark instead of ../dist/<network>/node.js
//   --compare <path>             entry of a second build to benchmark side by side
//   --reps <n>                   proving-pipeline repetitions per process (default 3)
//   --rounds <n>                 process rounds per build in compare mode (default 2)
//   --threads <0|1>              1 = single-threaded, 0 = initThreadPool() (default 0)
//   --json                       print the raw JSON instead of a table
import { performance } from "node:perf_hooks";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import path from "node:path";

const { values: args } = parseArgs({
    options: {
        network: { type: "string", default: "mainnet" },
        sdk: { type: "string" },
        compare: { type: "string" },
        reps: { type: "string", default: "3" },
        rounds: { type: "string", default: "2" },
        threads: { type: "string", default: "0" },
        json: { type: "boolean", default: false },
        child: { type: "boolean", default: false },
    },
});
const here = path.dirname(fileURLToPath(import.meta.url));
const network = args.network;
if (network !== "mainnet" && network !== "testnet")
    throw new Error(`--network must be mainnet or testnet, got ${network}`);
const entry = path.resolve(
    args.sdk ?? path.join(here, "..", "dist", network, "node.js"),
);
const reps = positiveInt("--reps", args.reps);
const rounds = positiveInt("--rounds", args.rounds);
if (args.threads !== "0" && args.threads !== "1")
    throw new Error(`--threads must be 0 or 1, got ${args.threads}`);
const singleThreaded = args.threads === "1";

// u32::MAX - 1 resolves to the newest scheduled consensus version on either
// network, so verification always uses the same Varuna version the prover did.
const VERIFY_HEIGHT = 4_294_967_294;

const HELLO_PROGRAM =
    "program hellothere.aleo;\n\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n";
const HELLO_INPUTS = ["5u32", "5u32"];
const PRIVATE_KEY =
    "APrivateKey1zkpJkyYRGYtkeHDaFfwsKtUJzia7csiWhfBWPXWhXJzy9Ls";
const VIEW_KEY = "AViewKey1ccEt8A2Ryva5rxnKcAbn7wgTaTsb79tzkKHFpeKsm9NX";
const RECORD_CIPHERTEXT =
    "record1qyqsqpe2szk2wwwq56akkwx586hkndl3r8vzdwve32lm7elvphh37rsyqyxx66trwfhkxun9v35hguerqqpqzqrtjzeu6vah9x2me2exkgege824sd8x2379scspmrmtvczs0d93qttl7y92ga0k0rsexu409hu3vlehe3yxjhmey3frh2z5pxm5cmxsv4un97q";

if (args.compare) {
    compare();
} else if (args.child) {
    console.log(JSON.stringify(await benchmark(entry)));
} else {
    const result = await benchmark(entry);
    if (args.json) console.log(JSON.stringify(result, null, 2));
    else printTable([{ label: entry, result }]);
}

async function benchmark(sdkEntry) {
    const sdk = await import(sdkEntry);
    const {
        ProgramManagerBase,
        PrivateKey,
        ViewKey,
        Program,
        VerifyingKey,
        RecordCiphertext,
        verifyFunctionExecution,
        initThreadPool,
    } = sdk;
    if (!singleThreaded && typeof initThreadPool === "function")
        await initThreadPool();

    const privateKey = PrivateKey.from_string(PRIVATE_KEY);
    const viewKey = ViewKey.from_string(VIEW_KEY);
    const message = new TextEncoder().encode("hello world");
    const samples = {};
    const timed = async (name, fn) => {
        const start = performance.now();
        const value = await fn();
        (samples[name] ??= []).push(performance.now() - start);
        return value;
    };

    // Cheap primitives, batched so the numbers are measurable.
    await timed("keygen + address x500", () => {
        for (let i = 0; i < 500; i++) new PrivateKey().to_address();
    });
    await timed("sign + verify x300", () => {
        const address = privateKey.to_address();
        for (let i = 0; i < 300; i++) {
            if (!address.verify(message, privateKey.sign(message)))
                throw new Error("signature did not verify");
        }
    });
    await timed("record decrypt x300", () => {
        for (let i = 0; i < 300; i++)
            RecordCiphertext.fromString(RECORD_CIPHERTEXT).decrypt(viewKey);
    });

    for (let i = 0; i < reps; i++) {
        // Authorization: runs the function (no proof) and signs the request.
        const authorization = await timed("authorize", () =>
            ProgramManagerBase.authorize(
                privateKey,
                HELLO_PROGRAM,
                "hello",
                HELLO_INPUTS,
            ),
        );
        const executionId = authorization.toExecutionId().toString();
        await timed("authorize public fee", () =>
            ProgramManagerBase.authorizeFee(
                privateKey,
                executionId,
                0.001,
                0,
                undefined,
            ),
        );

        // Proving pipeline: synthesize keys, prove, verify.
        const keyPair = await timed("synthesize keys", () =>
            ProgramManagerBase.synthesizeKeyPair(
                privateKey,
                HELLO_PROGRAM,
                "hello",
                HELLO_INPUTS,
            ),
        );
        const provingKey = keyPair.provingKey();
        const verifyingKey = keyPair.verifyingKey();
        const verifyingKeyString = verifyingKey.toString();
        const response = await timed("execute + prove", () =>
            ProgramManagerBase.executeFunctionOffline(
                privateKey,
                HELLO_PROGRAM,
                "hello",
                HELLO_INPUTS,
                true,
                false,
                undefined,
                provingKey,
                verifyingKey,
            ),
        );
        if (response.getOutputs()[0] !== "10u32")
            throw new Error(`unexpected output ${response.getOutputs()}`);
        const execution = response.getExecution();
        const verified = await timed("verify execution", () =>
            verifyFunctionExecution(
                execution,
                VerifyingKey.fromString(verifyingKeyString),
                Program.fromString(HELLO_PROGRAM),
                "hello",
                undefined,
                undefined,
                VERIFY_HEIGHT,
            ),
        );
        if (verified !== true) throw new Error("execution did not verify");
    }

    return Object.fromEntries(
        Object.entries(samples).map(([name, values]) => [
            name,
            {
                min: round(Math.min(...values)),
                median: round(median(values)),
                n: values.length,
            },
        ]),
    );
}

function compare() {
    const builds = [
        { label: "A: " + entry, entry },
        {
            label: "B: " + path.resolve(args.compare),
            entry: path.resolve(args.compare),
        },
    ];
    const collected = builds.map(() => ({}));
    for (let round = 0; round < rounds; round++) {
        builds.forEach((build, i) => {
            process.stderr.write(
                `round ${round + 1}/${rounds}: ${build.label}\n`,
            );
            const child = spawnSync(
                process.execPath,
                [
                    fileURLToPath(import.meta.url),
                    "--child",
                    "--sdk",
                    build.entry,
                    "--network",
                    network,
                    "--reps",
                    String(reps),
                    "--threads",
                    singleThreaded ? "1" : "0",
                ],
                { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] },
            );
            if (child.status !== 0)
                throw new Error(`benchmark of ${build.entry} failed`);
            const lines = child.stdout.trim().split("\n");
            const result = JSON.parse(lines[lines.length - 1]);
            for (const [name, stat] of Object.entries(result)) {
                const acc = (collected[i][name] ??= {
                    mins: [],
                    medians: [],
                    n: 0,
                });
                acc.mins.push(stat.min);
                acc.medians.push(stat.median);
                acc.n += stat.n;
            }
        });
    }
    const results = builds.map((build, i) => ({
        label: build.label,
        result: Object.fromEntries(
            Object.entries(collected[i]).map(([name, acc]) => [
                name,
                {
                    min: round(Math.min(...acc.mins)),
                    median: round(median(acc.medians)),
                    n: acc.n,
                },
            ]),
        ),
    }));
    if (args.json) console.log(JSON.stringify(results, null, 2));
    else printTable(results);
}

function printTable(results) {
    results.forEach((r) => console.log(r.label));
    const names = Object.keys(results[0].result);
    const header = [
        "operation",
        ...results.map((_, i) => `${String.fromCharCode(65 + i)} min ms`),
        ...results.map((_, i) => `${String.fromCharCode(65 + i)} median ms`),
    ];
    if (results.length === 2) header.push("B/A (min)");
    const rows = names.map((name) => {
        const row = [
            name,
            ...results.map((r) => fmt(r.result[name]?.min)),
            ...results.map((r) => fmt(r.result[name]?.median)),
        ];
        if (results.length === 2) {
            const a = results[0].result[name]?.min,
                b = results[1].result[name]?.min;
            row.push(a && b ? (b / a).toFixed(2) + "x" : "n/a");
        }
        return row;
    });
    const widths = header.map((h, c) =>
        Math.max(h.length, ...rows.map((r) => r[c].length)),
    );
    const line = (cells) =>
        cells
            .map((c, i) =>
                i === 0 ? c.padEnd(widths[i]) : c.padStart(widths[i]),
            )
            .join("  ");
    console.log(line(header));
    console.log(widths.map((w) => "-".repeat(w)).join("  "));
    rows.forEach((r) => console.log(line(r)));
}

function positiveInt(flag, value) {
    const n = Number(value);
    if (!Number.isInteger(n) || n < 1)
        throw new Error(`${flag} must be a positive integer, got ${value}`);
    return n;
}

function median(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2;
}

function round(ms) {
    return Math.round(ms * 10) / 10;
}
function fmt(ms) {
    return ms === undefined ? "n/a" : ms.toFixed(1);
}
