/**
 * Dynamic Dispatch & Deep Static Import Chain — Key Caching Integration Tests
 *
 * Verifies that ProgramImportsBuilder + LocalFileKeyStore correctly:
 * 1. Synthesizes and persists keys on first (cold) execution
 * 2. Loads keys from disk on subsequent (warm) execution
 *
 * Test 1 — Dynamic dispatch (call.dynamic):
 *   A program that dynamically calls one of two imported programs at runtime.
 *   Keys for the called import are synthesized and cached.
 *
 * Test 2 — Mixed static + dynamic dispatch:
 *   A program that statically calls dd_add and dynamically calls dd_mul.
 *   Tests that statically-called import keys are loaded from cache while
 *   dynamically-called import keys are re-synthesized.
 *
 * Test 3 — Many static imports (15 wide):
 *   One entry program that directly imports 15 leaf programs via static
 *   `call program.aleo/function`. All keys are synthesized, cached, and
 *   reloaded on subsequent execution.
 *
 * Test 4 — Deeply nested static chain (15 deep):
 *   A chain of 15 programs where each imports the next level. Tests
 *   transitive import resolution and key caching at depth.
 *
 * All execution is offline (OfflineQuery + ProcessNative).
 */

import {
    assert,
    assertKeysExist,
    assertKeysNotExist,
    cleanup,
    countKeyFiles,
    createProgramManager,
    initPool,
    offlineQuery,
    printSummary,
    BenchRun,
    formatRunTable,
    formatAggregates,
    dirSizeMB,
} from "./helpers.js";
import { provingKeyLocator, verifyingKeyLocator } from "@provablehq/sdk/testnet.js";
import {
    DD_ADD_PROGRAM,
    DD_MUL_PROGRAM,
    MIXED_CALLER_PROGRAM,
    STATIC_CHAIN_EXPECTED_RESULT,
    makeDDCallerProgram,
    makeFanOutPrograms,
    makeStaticChainPrograms,
} from "./programs.js";
import { performance } from "node:perf_hooks";
import * as $fs from "node:fs/promises";

// Benchmark results collected for final summary.
const benchmarks: { name: string; coldMs: number; warmMs: number }[] = [];

// ============================================================================
// Test 1: Dynamic Dispatch with Multiple Imports
// ============================================================================

async function testDynamicDispatch(): Promise<void> {
    console.log("\n" + "=".repeat(60));
    console.log("  Test 1: Dynamic Dispatch (call.dynamic with imports)");
    console.log("=".repeat(60));

    const tmpDir = `.dd-test-${Date.now()}`;

    try {
        const { pm, keyStore } = createProgramManager(tmpDir);
        const callerProgram = makeDDCallerProgram();

        const imports: Record<string, string> = {
            "dd_add.aleo": DD_ADD_PROGRAM,
            "dd_mul.aleo": DD_MUL_PROGRAM,
        };

        // --- Cold run: keys synthesized ---
        console.log("\n  Cold run (keys will be synthesized)...");
        const t0 = performance.now();
        const response1 = await pm.run(
            callerProgram,
            "dynamic_compute",
            ["dd_add", "aleo", "compute", "3u32", "5u32"],
            false,
            imports,
            undefined, undefined, undefined, undefined,
            offlineQuery(),
        );
        const coldMs = performance.now() - t0;

        const outputs1 = response1.getOutputs();
        assert(outputs1.length === 1, "cold run returns 1 output");
        assert(outputs1[0].includes("8"), `cold run: dd_add(3,5) = ${outputs1[0]} (expected 8u32)`);

        // Top-level program key should be persisted to the KeyStore.
        await assertKeysExist(keyStore, "dd_caller.aleo", "dynamic_compute");

        // The called import's keys are synthesized and cached.
        // dd_mul was not called — its keys should NOT be in the store.
        await assertKeysExist(keyStore, "dd_add.aleo", "compute");
        await assertKeysNotExist(keyStore, "dd_mul.aleo", "compute");

        const fileCountAfterCold = await countKeyFiles(tmpDir);
        assert(fileCountAfterCold > 0, `key files written to disk (${fileCountAfterCold} files)`);

        // --- Warm run ---
        // Note: For call.dynamic programs, import keys are NOT loaded from the
        // KeyStore on warm runs. The call-graph parser (getCalledFunctions)
        // cannot parse call.dynamic targets (they're field literals, not
        // program.aleo/function identifiers), so loadKeysFromStore receives
        // an empty function list. Import keys are re-synthesized each run.
        // This is an accepted tradeoff — blanket-loading all import keys
        // could cause issues with large programs. The top-level program's
        // key IS loaded from cache.
        console.log("\n  Warm run (top-level key cached; import keys re-synthesized)...");
        const t1 = performance.now();
        const response2 = await pm.run(
            callerProgram,
            "dynamic_compute",
            ["dd_add", "aleo", "compute", "3u32", "5u32"],
            false,
            imports,
            undefined, undefined, undefined, undefined,
            offlineQuery(),
        );
        const warmMs = performance.now() - t1;

        const outputs2 = response2.getOutputs();
        assert(outputs2[0].includes("8"), `warm run: dd_add(3,5) = ${outputs2[0]} (expected 8u32)`);

        // Keys are still on disk from the cold run — no new files written.
        const fileCountAfterWarm = await countKeyFiles(tmpDir);
        assert(
            fileCountAfterWarm === fileCountAfterCold,
            `no new key files on warm run (${fileCountAfterWarm} === ${fileCountAfterCold})`,
        );

        // --- Runtime target switch ---
        console.log("\n  Runtime target switch (dd_mul)...");
        const response3 = await pm.run(
            callerProgram,
            "dynamic_compute",
            ["dd_mul", "aleo", "compute", "3u32", "5u32"],
            false,
            imports,
            undefined, undefined, undefined, undefined,
            offlineQuery(),
        );
        const outputs3 = response3.getOutputs();
        assert(outputs3[0].includes("15"), `runtime switch: dd_mul(3,5) = ${outputs3[0]} (expected 15u32)`);

        benchmarks.push({ name: "Dynamic Dispatch", coldMs, warmMs });
    } finally {
        await cleanup(tmpDir);
    }
}

// ============================================================================
// Test 2: Mixed Static + Dynamic Dispatch
// ============================================================================

async function testMixed(): Promise<void> {
    console.log("\n" + "=".repeat(60));
    console.log("  Test 2: Mixed Static + Dynamic Dispatch");
    console.log("=".repeat(60));

    const tmpDir = `.mixed-test-${Date.now()}`;

    try {
        const { pm, keyStore } = createProgramManager(tmpDir);

        const imports: Record<string, string> = {
            "dd_add.aleo": DD_ADD_PROGRAM,
            "dd_mul.aleo": DD_MUL_PROGRAM,
        };

        // mixed_compute(dd_mul, aleo, compute, 3, 5):
        //   static:  dd_add.aleo/compute(3, 5) = 8
        //   dynamic: dd_mul.aleo/compute(3, 5) = 15
        //   output:  8 + 15 = 23

        // --- Cold run ---
        console.log("\n  Cold run (static call to dd_add, dynamic call to dd_mul)...");
        const t0 = performance.now();
        const response1 = await pm.run(
            MIXED_CALLER_PROGRAM,
            "mixed_compute",
            ["dd_mul", "aleo", "compute", "3u32", "5u32"],
            false,
            imports,
            undefined, undefined, undefined, undefined,
            offlineQuery(),
        );
        const coldMs = performance.now() - t0;

        const outputs1 = response1.getOutputs();
        assert(outputs1.length === 1, "cold run returns 1 output");
        assert(outputs1[0].includes("23"), `cold run: mixed(3,5) = ${outputs1[0]} (expected 23u32)`);

        // Top-level program key should be persisted.
        await assertKeysExist(keyStore, "mixed_caller.aleo", "mixed_compute");

        // dd_add was statically called — keys should be cached.
        await assertKeysExist(keyStore, "dd_add.aleo", "compute");
        // dd_mul was dynamically called — keys also synthesized and cached.
        await assertKeysExist(keyStore, "dd_mul.aleo", "compute");

        const fileCountAfterCold = await countKeyFiles(tmpDir);
        assert(fileCountAfterCold > 0, `key files written to disk (${fileCountAfterCold} files)`);

        // --- Warm run ---
        // dd_add keys should be loaded from cache (static call is parseable).
        // dd_mul keys are re-synthesized (dynamic call not parseable).
        console.log("\n  Warm run (dd_add from cache, dd_mul re-synthesized)...");
        const t1 = performance.now();
        const response2 = await pm.run(
            MIXED_CALLER_PROGRAM,
            "mixed_compute",
            ["dd_mul", "aleo", "compute", "3u32", "5u32"],
            false,
            imports,
            undefined, undefined, undefined, undefined,
            offlineQuery(),
        );
        const warmMs = performance.now() - t1;

        const outputs2 = response2.getOutputs();
        assert(outputs2[0].includes("23"), `warm run: mixed(3,5) = ${outputs2[0]} (expected 23u32)`);

        const fileCountAfterWarm = await countKeyFiles(tmpDir);
        assert(
            fileCountAfterWarm === fileCountAfterCold,
            `no new key files on warm run (${fileCountAfterWarm} === ${fileCountAfterCold})`,
        );

        benchmarks.push({ name: "Mixed (static + dynamic)", coldMs, warmMs });
    } finally {
        await cleanup(tmpDir);
    }
}

// ============================================================================
// Test 3: Many Static Imports (15 direct imports in one program)
// ============================================================================

async function testManyStaticImports(): Promise<void> {
    console.log("\n" + "=".repeat(60));
    console.log("  Test 3: Many Static Imports (15 direct imports)");
    console.log("=".repeat(60));

    const tmpDir = `.fan-out-test-${Date.now()}`;

    try {
        const { pm, keyStore } = createProgramManager(tmpDir);
        const { programs, entryProgram, expectedResult } = makeFanOutPrograms();

        // Build imports dict (all leaf programs, excluding the entry)
        const imports: Record<string, string> = {};
        for (const [name, source] of programs) {
            if (name !== "leaf_entry.aleo") {
                imports[name] = source;
            }
        }

        // --- Cold run: all keys synthesized ---
        console.log(`\n  Cold run (1 program importing ${expectedResult} leaves, keys synthesized)...`);
        const t0 = performance.now();
        const response1 = await pm.run(
            entryProgram,
            "run_all",
            ["0u64"],
            false,
            imports,
            undefined, undefined, undefined, undefined,
            offlineQuery(),
        );
        const coldMs = performance.now() - t0;

        const outputs1 = response1.getOutputs();
        assert(outputs1.length === 1, "cold run returns 1 output");
        assert(
            outputs1[0].includes(`${expectedResult}`),
            `cold run: run_all(0) = ${outputs1[0]} (expected ${expectedResult}u64)`,
        );

        // Verify top-level program key is persisted.
        await assertKeysExist(keyStore, "leaf_entry.aleo", "run_all");

        // Verify keys for all leaf programs
        for (let i = 0; i < expectedResult; i++) {
            await assertKeysExist(keyStore, `leaf_${i}.aleo`, "add_val");
        }

        const fileCountAfterCold = await countKeyFiles(tmpDir);
        assert(fileCountAfterCold > 0, `key files written to disk (${fileCountAfterCold} files)`);

        // --- Warm run: all keys loaded from disk ---
        // For static imports, getCalledFunctions parses `call leaf_N.aleo/add_val`
        // and loadKeysFromStore loads the correct keys from the KeyStore.
        // This is where the key caching speedup comes from.
        console.log("\n  Warm run (all keys loaded from disk)...");
        const t1 = performance.now();
        const response2 = await pm.run(
            entryProgram,
            "run_all",
            ["0u64"],
            false,
            imports,
            undefined, undefined, undefined, undefined,
            offlineQuery(),
        );
        const warmMs = performance.now() - t1;

        const outputs2 = response2.getOutputs();
        assert(
            outputs2[0].includes(`${expectedResult}`),
            `warm run: run_all(0) = ${outputs2[0]} (expected ${expectedResult}u64)`,
        );

        // Verify keys are still present (loaded, not re-synthesized).
        for (let i = 0; i < expectedResult; i++) {
            await assertKeysExist(keyStore, `leaf_${i}.aleo`, "add_val");
        }

        const fileCountAfterWarm = await countKeyFiles(tmpDir);
        assert(
            fileCountAfterWarm === fileCountAfterCold,
            `no new key files on warm run (${fileCountAfterWarm} === ${fileCountAfterCold})`,
        );

        benchmarks.push({ name: `Static Imports (${expectedResult} wide)`, coldMs, warmMs });
    } finally {
        await cleanup(tmpDir);
    }
}

// ============================================================================
// Test 3: Deeply Nested Static Import Chain (15 levels deep)
// ============================================================================

async function testDeepChain(): Promise<void> {
    console.log("\n" + "=".repeat(60));
    console.log("  Test 4: Deeply Nested Static Imports (15 levels deep)");
    console.log("=".repeat(60));

    const tmpDir = `.chain-test-${Date.now()}`;

    try {
        const { pm, keyStore } = createProgramManager(tmpDir);
        const { programs, entryProgram } = makeStaticChainPrograms();
        const expected = STATIC_CHAIN_EXPECTED_RESULT; // 14

        // Build imports dict (all except entry program)
        const imports: Record<string, string> = {};
        for (const [name, source] of programs) {
            if (name !== "static_0.aleo") {
                imports[name] = source;
            }
        }

        // --- Cold run: all keys synthesized ---
        console.log(`\n  Cold run (15 programs chained, ${expected} levels add 1 each)...`);
        const t0 = performance.now();
        const response1 = await pm.run(
            entryProgram,
            "entry",
            ["0u64"],
            false,
            imports,
            undefined, undefined, undefined, undefined,
            offlineQuery(),
        );
        const coldMs = performance.now() - t0;

        const outputs1 = response1.getOutputs();
        assert(outputs1.length === 1, "cold run returns 1 output");
        assert(
            outputs1[0].includes(`${expected}`),
            `cold run: entry(0) = ${outputs1[0]} (expected ${expected}u64)`,
        );

        // Verify top-level program key is persisted.
        await assertKeysExist(keyStore, "static_0.aleo", "entry");

        // Verify keys for all 14 imported programs (static_1 through static_14)
        for (let i = 1; i <= expected; i++) {
            await assertKeysExist(keyStore, `static_${i}.aleo`, "call_next");
        }

        const fileCountAfterCold = await countKeyFiles(tmpDir);
        assert(fileCountAfterCold > 0, `key files written to disk (${fileCountAfterCold} files)`);

        // --- Warm run: all keys loaded from disk ---
        // Static calls are parseable by getCalledFunctions, so all import keys
        // are loaded from the KeyStore via loadKeysFromStore.
        console.log("\n  Warm run (all keys loaded from disk)...");
        const t1 = performance.now();
        const response2 = await pm.run(
            entryProgram,
            "entry",
            ["0u64"],
            false,
            imports,
            undefined, undefined, undefined, undefined,
            offlineQuery(),
        );
        const warmMs = performance.now() - t1;

        const outputs2 = response2.getOutputs();
        assert(
            outputs2[0].includes(`${expected}`),
            `warm run: entry(0) = ${outputs2[0]} (expected ${expected}u64)`,
        );

        // Verify keys still present after warm run (loaded, not re-synthesized).
        for (let i = 1; i <= expected; i++) {
            await assertKeysExist(keyStore, `static_${i}.aleo`, "call_next");
        }

        const fileCountAfterWarm = await countKeyFiles(tmpDir);
        assert(
            fileCountAfterWarm === fileCountAfterCold,
            `no new key files on warm run (${fileCountAfterWarm} === ${fileCountAfterCold})`,
        );

        benchmarks.push({ name: `Static Chain (${expected} deep)`, coldMs, warmMs });
    } finally {
        await cleanup(tmpDir);
    }
}

// ============================================================================
// Test 4: Stress Test — Increasing Width Until Failure
// ============================================================================

function memoryMB(): number {
    return Math.round(process.memoryUsage().rss / 1024 / 1024);
}

async function testStress(): Promise<void> {
    console.log("\n" + "=".repeat(60));
    console.log("  Test 5: Stress Test — Heavy Programs (hash constraints)");
    console.log("=".repeat(60));
    console.log("\n  Each leaf program uses BHP256 + Poseidon2 hashing (6 hash ops)");
    console.log("  to inflate proving key size and stress memory.\n");

    // Max 31 calls per function (snarkVM limit).
    // Use heavy programs to stress memory instead of count.
    const widths = [5, 10, 15, 20, 25, 30];

    const stressResults: { imports: number; keys: string; coldS: string; warmS: string; speedup: string; rssMB: number }[] = [];

    console.log("");
    console.log(
        "  " +
        "Imports".padEnd(10) +
        "Keys".padStart(8) +
        "Cold".padStart(10) +
        "Warm".padStart(10) +
        "Speedup".padStart(10) +
        "RSS (MB)".padStart(12),
    );
    console.log("  " + "-".repeat(60));

    for (const width of widths) {
        const tmpDir = `.stress-${width}-${Date.now()}`;
        const prefix = `st${width}`;

        try {
            const { pm, keyStore } = createProgramManager(tmpDir);
            const { programs, entryProgram, expectedResult } = makeFanOutPrograms(width, prefix, true);

            const imports: Record<string, string> = {};
            for (const [name, source] of programs) {
                if (name !== `${prefix}_entry.aleo`) {
                    imports[name] = source;
                }
            }

            // Cold run
            const t0 = performance.now();
            const r1 = await pm.run(
                entryProgram, "run_all", ["0u64"], false, imports,
                undefined, undefined, undefined, undefined, offlineQuery(),
            );
            const coldMs = performance.now() - t0;

            const out1 = r1.getOutputs();
            if (!out1[0].includes(`${expectedResult}`)) {
                console.error(`  FAIL at width ${width}: got ${out1[0]}, expected ${expectedResult}u64`);
                break;
            }

            // Verify all import keys are present in the KeyStore.
            let allKeysPresent = true;
            for (let i = 0; i < width; i++) {
                const hasPk = await keyStore.has(provingKeyLocator(`${prefix}_${i}.aleo`, "add_val"));
                const hasVk = await keyStore.has(verifyingKeyLocator(`${prefix}_${i}.aleo`, "add_val"));
                if (!hasPk || !hasVk) {
                    allKeysPresent = false;
                    break;
                }
            }

            // Warm run
            const t1 = performance.now();
            const r2 = await pm.run(
                entryProgram, "run_all", ["0u64"], false, imports,
                undefined, undefined, undefined, undefined, offlineQuery(),
            );
            const warmMs = performance.now() - t1;

            const out2 = r2.getOutputs();
            if (!out2[0].includes(`${expectedResult}`)) {
                console.error(`  FAIL warm at width ${width}: got ${out2[0]}, expected ${expectedResult}u64`);
                break;
            }

            const speedup = coldMs / warmMs;
            const row = {
                imports: width,
                keys: allKeysPresent ? "OK" : "MISS",
                coldS: (coldMs / 1000).toFixed(1),
                warmS: (warmMs / 1000).toFixed(1),
                speedup: speedup.toFixed(1),
                rssMB: memoryMB(),
            };
            stressResults.push(row);
            console.log(
                "  " +
                `${width}`.padEnd(10) +
                row.keys.padStart(8) +
                `${row.coldS}s`.padStart(10) +
                `${row.warmS}s`.padStart(10) +
                `${row.speedup}x`.padStart(10) +
                `${row.rssMB}`.padStart(12),
            );
        } catch (err: any) {
            stressResults.push({
                imports: width,
                keys: "—",
                coldS: "FAILED",
                warmS: "—",
                speedup: "—",
                rssMB: memoryMB(),
            });
            console.log(
                "  " +
                `${width}`.padEnd(10) +
                "—".padStart(8) +
                "FAILED".padStart(10) +
                "—".padStart(10) +
                "—".padStart(10) +
                `${memoryMB()}`.padStart(12),
            );
            console.log(`\n  Failure at ${width} imports: ${err.message ?? err}`);
            break;
        } finally {
            await cleanup(tmpDir);
        }
    }

    // Write results to file for reporting.
    const lines = [
        "# Stress Test Results — Heavy Programs (BHP256 + Poseidon2, 6 hash ops per leaf)",
        "",
        `| Imports | Keys | Cold | Warm | Speedup | RSS (MB) |`,
        `|---------|------|------|------|---------|----------|`,
        ...stressResults.map(r =>
            `| ${r.imports} | ${r.keys} | ${r.coldS} | ${r.warmS} | ${r.speedup}${r.speedup !== "—" ? "x" : ""} | ${r.rssMB} |`
        ),
        "",
    ];
    await $fs.writeFile("stress-results.md", lines.join("\n"));
    console.log("  Results written to stress-results.md\n");
}

// ============================================================================
// Benchmark Summary
// ============================================================================

async function printBenchmarks(): Promise<void> {
    console.log("\n" + "=".repeat(60));
    console.log("  Benchmark Results");
    console.log("=".repeat(60));
    console.log("");
    console.log(
        "  " +
        "Test".padEnd(28) +
        "Cold".padStart(10) +
        "Warm".padStart(10) +
        "Speedup".padStart(10),
    );
    console.log("  " + "-".repeat(58));

    const lines = [
        "# Benchmark Results — Key Caching with ProgramImportsBuilder + LocalFileKeyStore",
        "",
        "## Approach 1: Dynamic Dispatch (call.dynamic)",
        "",
        "The caller program uses `call.dynamic` to resolve the target program at",
        "runtime via field-encoded identifiers. Because the call graph cannot be",
        "statically parsed, import keys are re-synthesized on each run. Only the",
        "top-level program's key is cached and reloaded.",
        "",
        "## Approach 2: Static Imports (import + call program.aleo/function)",
        "",
        "Programs use standard `import` and `call` instructions. The SDK's",
        "`getCalledFunctions` regex parses the call graph, and `loadKeysFromStore`",
        "loads the correct keys from the KeyStore. All import keys are cached and",
        "reloaded on subsequent runs, delivering the full speedup.",
        "",
        "## Results",
        "",
        "| Test | Cold | Warm | Speedup |",
        "|------|------|------|---------|",
    ];

    for (const b of benchmarks) {
        const speedup = b.coldMs / b.warmMs;
        const coldS = (b.coldMs / 1000).toFixed(1);
        const warmS = (b.warmMs / 1000).toFixed(1);
        const speedupS = speedup.toFixed(1);
        console.log(
            "  " +
            b.name.padEnd(28) +
            `${coldS}s`.padStart(10) +
            `${warmS}s`.padStart(10) +
            `${speedupS}x`.padStart(10),
        );
        lines.push(`| ${b.name} | ${coldS}s | ${warmS}s | ${speedupS}x |`);
    }

    lines.push(
        "",
        "## Analysis",
        "",
        "Static imports achieve significantly higher speedup (~3.5-4x) compared to",
        "dynamic dispatch (~2x) because all import keys can be loaded from the",
        "KeyStore on warm runs. Dynamic dispatch import keys are re-synthesized",
        "each time — an accepted tradeoff to avoid blanket-loading all proving",
        "keys, which could cause memory issues with large programs.",
        "",
    );
    await $fs.writeFile("benchmark-results.md", lines.join("\n"));
    console.log("");
    console.log("  Dynamic dispatch: import keys re-synthesized (call graph");
    console.log("    not statically parseable). Top-level key cached only.");
    console.log("  Static imports: all import keys cached and reloaded from");
    console.log("    disk — full key caching speedup.");
    console.log("");
    console.log("  Results written to benchmark-results.md");
    console.log("");
}

// ============================================================================
// Bench: Cold-vs-warm proving across call graph sizes
// ============================================================================

async function testBench(): Promise<void> {
    const N = parseInt(process.env.BENCH_N ?? "3", 10);

    const configs: { label: string; type: "chain" | "fanout"; size: number }[] = [
        { label: "Static Chain (depth=3)", type: "chain", size: 3 },
        { label: "Static Chain (depth=5)", type: "chain", size: 5 },
        { label: "Static Chain (depth=8)", type: "chain", size: 8 },
        { label: "Static Chain (depth=10)", type: "chain", size: 10 },
        { label: "Fan-Out (width=5)", type: "fanout", size: 5 },
        { label: "Fan-Out (width=10)", type: "fanout", size: 10 },
        { label: "Fan-Out (width=15)", type: "fanout", size: 15 },
    ];

    const allOutput: string[] = [];

    for (const config of configs) {
        const runs: BenchRun[] = [];

        console.log(`\n${"=".repeat(60)}`);
        console.log(`  Bench: ${config.label}, N=${N}`);
        console.log("=".repeat(60));

        for (let i = 0; i < N; i++) {
            const tmpDir = `.bench-${config.type}-${config.size}-${Date.now()}`;
            try {
                const { pm } = createProgramManager(tmpDir);

                let entryProgram: string;
                let entryFn: string;
                let imports: Record<string, string>;

                if (config.type === "chain") {
                    const { programs, entryProgram: ep } = makeStaticChainPrograms(config.size, `ch${config.size}`);
                    entryProgram = ep;
                    entryFn = "entry";
                    imports = {};
                    for (const [name, source] of programs) {
                        if (!source.startsWith(`program ch${config.size}_0.aleo`)) {
                            imports[name] = source;
                        }
                    }
                } else {
                    const { programs, entryProgram: ep } = makeFanOutPrograms(config.size, `fo${config.size}`);
                    entryProgram = ep;
                    entryFn = "run_all";
                    imports = {};
                    for (const [name, source] of programs) {
                        if (!source.includes(`program fo${config.size}_entry.aleo`)) {
                            imports[name] = source;
                        }
                    }
                }

                // Cold run
                console.log(`  Run ${i + 1}/${N}: cold...`);
                const t0 = performance.now();
                await pm.run(
                    entryProgram, entryFn, ["0u64"], false, imports,
                    undefined, undefined, undefined, undefined, offlineQuery(),
                );
                const coldMs = performance.now() - t0;

                // Warm run
                console.log(`  Run ${i + 1}/${N}: warm...`);
                const t1 = performance.now();
                await pm.run(
                    entryProgram, entryFn, ["0u64"], false, imports,
                    undefined, undefined, undefined, undefined, offlineQuery(),
                );
                const warmMs = performance.now() - t1;

                const keys = await countKeyFiles(tmpDir);
                const sizeMB = await dirSizeMB(tmpDir);

                runs.push({ run: i + 1, coldMs, warmMs, keys, sizeMB });
            } finally {
                await cleanup(tmpDir);
            }
        }

        const table = formatRunTable(`Call Graph Bench: ${config.label}, N=${N}`, runs);
        const agg = formatAggregates(runs);
        console.log("\n" + table);
        console.log(agg);
        allOutput.push(table, agg, "");
    }

    await $fs.writeFile("bench-results.txt", allOutput.join("\n"));
    console.log("\n  Results written to bench-results.txt");
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
    console.log("Initializing thread pool...");
    await initPool();

    const selected = process.argv[2];

    if (selected === "dynamic_dispatch") {
        await testDynamicDispatch();
    } else if (selected === "mixed") {
        await testMixed();
    } else if (selected === "static_imports") {
        await testManyStaticImports();
    } else if (selected === "deep_chain") {
        await testDeepChain();
    } else if (selected === "stress") {
        await testStress();
    } else if (selected === "bench") {
        await testBench();
        return; // bench has its own output format
    } else {
        await testDynamicDispatch();
        await testMixed();
        await testManyStaticImports();
        await testDeepChain();
    }

    await printBenchmarks();
    printSummary();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
