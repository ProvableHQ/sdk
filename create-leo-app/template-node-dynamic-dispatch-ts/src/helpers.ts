import {
    Account,
    AleoKeyProvider,
    AleoNetworkClient,
    initThreadPool,
    LocalFileKeyStore,
    OfflineQuery,
    ProgramManager,
    provingKeyLocator,
    verifyingKeyLocator,
} from "@provablehq/sdk/testnet.js";
import * as fs from "node:fs/promises";

// ============================================================================
// ProgramManager Factory
// ============================================================================

/**
 * Create a ProgramManager backed by a LocalFileKeyStore in the given directory.
 * Network methods are stubbed for offline execution.
 */
export function createProgramManager(keyStoreDir: string): {
    pm: ProgramManager;
    keyStore: LocalFileKeyStore;
} {
    const keyStore = new LocalFileKeyStore(keyStoreDir);
    const keyProvider = new AleoKeyProvider();
    const networkClient = new AleoNetworkClient("https://api.provable.com/v2");

    // Stub network methods — we run entirely offline.
    networkClient.getProgramImports = async () => ({});
    networkClient.getProgram = async () => "";
    networkClient.getLatestProgramEdition = async (_name: string) => 1;
    networkClient.getProgramAmendmentCount = async (name: string, edition: number) => ({
        program_id: name,
        edition,
        amendment_count: 0,
    });

    const pm = new ProgramManager(
        "https://api.provable.com/v2",
        keyProvider,
    );
    pm.setAccount(new Account());
    (pm as any).setKeyStore(keyStore);
    (pm as any).networkClient = networkClient;

    return { pm, keyStore };
}

/** Create a fresh OfflineQuery (WASM consumes ownership, so each call needs a new instance). */
export function offlineQuery() {
    return new OfflineQuery(
        0,
        "sr1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gk0xu",
    );
}

// ============================================================================
// Assertions
// ============================================================================

let passed = 0;
let failed = 0;

export function assert(condition: boolean, message: string): void {
    if (!condition) {
        console.error(`  FAIL: ${message}`);
        failed++;
    } else {
        console.log(`  PASS: ${message}`);
        passed++;
    }
}

export async function assertKeysExist(
    keyStore: LocalFileKeyStore,
    programName: string,
    functionName: string,
): Promise<void> {
    const pkLoc = provingKeyLocator(programName, functionName);
    const vkLoc = verifyingKeyLocator(programName, functionName);
    const hasPk = await keyStore.has(pkLoc);
    const hasVk = await keyStore.has(vkLoc);
    assert(hasPk, `${programName}/${functionName} proving key cached`);
    assert(hasVk, `${programName}/${functionName} verifying key cached`);
}

export async function assertKeysNotExist(
    keyStore: LocalFileKeyStore,
    programName: string,
    functionName: string,
): Promise<void> {
    const pkLoc = provingKeyLocator(programName, functionName);
    const vkLoc = verifyingKeyLocator(programName, functionName);
    const hasPk = await keyStore.has(pkLoc);
    const hasVk = await keyStore.has(vkLoc);
    assert(!hasPk, `${programName}/${functionName} proving key NOT cached`);
    assert(!hasVk, `${programName}/${functionName} verifying key NOT cached`);
}

export async function countKeyFiles(dir: string): Promise<number> {
    try {
        const entries = await fs.readdir(dir + "/.aleo");
        return entries.length;
    } catch {
        return 0;
    }
}

export function printSummary(): void {
    console.log(`\n${"=".repeat(50)}`);
    console.log(`Results: ${passed} passed, ${failed} failed`);
    console.log("=".repeat(50));
    if (failed > 0) {
        process.exit(1);
    }
}

// ============================================================================
// Cleanup
// ============================================================================

export async function cleanup(dir: string): Promise<void> {
    await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
}

// ============================================================================
// Thread Pool
// ============================================================================

export async function initPool(): Promise<void> {
    await initThreadPool();
}

// ============================================================================
// Bench Helpers
// ============================================================================

export interface BenchRun {
    run: number;
    coldMs: number;
    warmMs: number;
    keys: number;
    sizeMB: number;
}

export function computeStats(values: number[]): {
    mean: number; median: number; stddev: number; min: number; max: number;
} {
    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const median = n % 2 === 0
        ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
        : sorted[Math.floor(n / 2)];
    const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / n;
    const stddev = Math.sqrt(variance);
    return { mean, median, stddev, min: sorted[0], max: sorted[n - 1] };
}

export function formatRunTable(label: string, runs: BenchRun[]): string {
    const lines: string[] = [];
    lines.push(`=== ${label} ===`);
    lines.push("");
    lines.push(
        " run | cold (s) | warm (s) | saved (s) | speedup | keys | size (MB)"
    );
    lines.push(
        "-----+----------+----------+-----------+---------+------+-----------"
    );
    for (const r of runs) {
        const cold = (r.coldMs / 1000).toFixed(2);
        const warm = (r.warmMs / 1000).toFixed(2);
        const saved = ((r.coldMs - r.warmMs) / 1000).toFixed(2);
        const speedup = (r.coldMs / r.warmMs).toFixed(2);
        lines.push(
            ` ${String(r.run).padStart(3)} |` +
            ` ${cold.padStart(8)} |` +
            ` ${warm.padStart(8)} |` +
            ` ${saved.padStart(9)} |` +
            ` ${(speedup + "x").padStart(7)} |` +
            ` ${String(r.keys).padStart(4)} |` +
            ` ${r.sizeMB.toFixed(1).padStart(9)}`
        );
    }
    return lines.join("\n");
}

export function formatAggregates(runs: BenchRun[]): string {
    const cold = computeStats(runs.map(r => r.coldMs / 1000));
    const warm = computeStats(runs.map(r => r.warmMs / 1000));
    const saved = computeStats(runs.map(r => (r.coldMs - r.warmMs) / 1000));
    const speedup = computeStats(runs.map(r => r.coldMs / r.warmMs));

    const lines: string[] = [];
    lines.push("");
    lines.push("=== Aggregates ===");
    lines.push("");
    lines.push(
        "  metric     |    mean |  median | stddev |     min |     max"
    );
    lines.push(
        "-------------+---------+---------+--------+---------+---------"
    );

    const fmt = (v: number, suffix = "", w = 7) => (v.toFixed(2) + suffix).padStart(w);
    const row = (label: string, s: ReturnType<typeof computeStats>, suffix = "") =>
        `  ${label.padEnd(11)} | ${fmt(s.mean, suffix)} | ${fmt(s.median, suffix)} | ${fmt(s.stddev, "", 6)} | ${fmt(s.min, suffix)} | ${fmt(s.max, suffix)}`;

    lines.push(row("cold (s)", cold));
    lines.push(row("warm (s)", warm));
    lines.push(row("saved (s)", saved));
    lines.push(row("speedup", speedup, "x"));

    return lines.join("\n");
}

export async function dirSizeMB(dir: string): Promise<number> {
    try {
        const entries = await fs.readdir(dir + "/.aleo");
        let total = 0;
        for (const entry of entries) {
            const stat = await fs.stat(dir + "/.aleo/" + entry);
            total += stat.size;
        }
        return total / (1024 * 1024);
    } catch {
        return 0;
    }
}
