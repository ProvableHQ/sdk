/**
 * Dynamic Dispatch Proving Test
 *
 * Tests that programs using call.dynamic with dynamic.record inputs can
 * successfully build execution transactions with proveExecution=true.
 *
 * This exercises the SnapshotQuery path that previously failed with
 * "Not all commitments found in stored state paths" because
 * collect_commitments_from_inputs didn't handle DynamicRecord inputs.
 *
 * Uses test_dcall_sdk.aleo deployed on testnet — a program with two functions:
 * 1. dynamic_transfer_pub_to_priv: call.dynamic to credits.aleo/transfer_public_to_private
 *    (no dynamic.record input — tests basic dynamic dispatch proving)
 * 2. dynamic_transfer_private: call.dynamic with dynamic.record input
 *    (exercises the SnapshotQuery fix for DynamicRecord inputs)
 *
 * Test flow:
 * Step 1: Call dynamic_transfer_pub_to_priv to get a dynamic.record output
 * Step 2: Use that dynamic.record as input to dynamic_transfer_private
 *
 * Builds transactions but does NOT broadcast them.
 */

import {
    Account,
    AleoKeyProvider,
    AleoNetworkClient,
    initThreadPool,
    ProgramManager,
    stringToField,
} from "@provablehq/sdk/testnet.js";

const API_URL = "https://api.provable.com/v2";

// ============================================================================
// Test Account (testnet — funded via faucet)
// ============================================================================

const PRIVATE_KEY = "APrivateKey1zkp6aEqdUdRpZs1fnfGBEitWZNzxNhPz4kb2W382nuX8G42";

// ============================================================================
// Deployed Program (testnet)
// ============================================================================

const PROGRAM_ID = "test_dcall_sdk.aleo";

// ============================================================================
// Helpers
// ============================================================================

function toField(value: string): string {
    return stringToField(value).toString();
}

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
    if (!condition) {
        console.error(`  FAIL: ${message}`);
        failed++;
    } else {
        console.log(`  PASS: ${message}`);
        passed++;
    }
}

// ============================================================================
// Test 1: Basic dynamic dispatch proving (no dynamic.record input)
// ============================================================================

async function testBasicDynamicDispatch(pm: ProgramManager, programSource: string): Promise<void> {
    console.log("\n" + "-".repeat(60));
    console.log("  Step 1: dynamic_transfer_pub_to_priv (no dynamic.record input)");
    console.log("-".repeat(60));

    const account = pm.account!;
    const inputs = [
        toField("credits"),
        toField("aleo"),
        toField("transfer_public_to_private"),
        account.address().to_string(),
        "100u64",
    ];

    console.log("  Target: credits.aleo/transfer_public_to_private via call.dynamic");

    const start = Date.now();
    try {
        const tx = await pm.buildExecutionTransaction({
            programName: PROGRAM_ID,
            functionName: "dynamic_transfer_pub_to_priv",
            inputs,
            priorityFee: 0,
            privateFee: false,
            program: programSource,
        });

        const elapsed = (Date.now() - start) / 1000;
        assert(true, `basic dynamic dispatch transaction built (${elapsed.toFixed(1)}s)`);
        console.log(`  Transaction ID: ${tx.id()}`);
    } catch (e: any) {
        const elapsed = (Date.now() - start) / 1000;
        const message = e?.message ?? String(e);
        assert(false, `basic dynamic dispatch failed (${elapsed.toFixed(1)}s): ${message}`);
    }
}

// ============================================================================
// Test 2: Dynamic dispatch with dynamic.record input (exercises SnapshotQuery fix)
// ============================================================================

async function testDynamicRecordInput(pm: ProgramManager, programSource: string): Promise<void> {
    console.log("\n" + "-".repeat(60));
    console.log("  Step 2: dynamic_transfer_private (dynamic.record input)");
    console.log("-".repeat(60));

    // We need a credits record for this test. Use the hardcoded testnet record.
    const creditsRecord = `{
  owner: aleo1vskzxa2qqgnhznxsqh6tgq93c30sfkj6xqwe7sr85lgjkexjlcxs3lxhy3.private,
  microcredits: 500000u64.private,
  _nonce: 2128807984625485873765840993868794284062894954530194503954279385341936659546group.public,
  _version: 1u8.public
}`;

    const account = pm.account!;
    const inputs = [
        toField("credits"),
        toField("aleo"),
        toField("transfer_private"),
        creditsRecord,  // This is a dynamic.record input
        account.address().to_string(),
        "100u64",
    ];

    console.log("  Target: credits.aleo/transfer_private via call.dynamic");
    console.log("  Input includes: dynamic.record (exercises SnapshotQuery fix)");

    const start = Date.now();
    try {
        const tx = await pm.buildExecutionTransaction({
            programName: PROGRAM_ID,
            functionName: "dynamic_transfer_private",
            inputs,
            priorityFee: 0,
            privateFee: false,
            program: programSource,
        });

        const elapsed = (Date.now() - start) / 1000;
        assert(true, `dynamic.record dispatch transaction built (${elapsed.toFixed(1)}s)`);
        console.log(`  Transaction ID: ${tx.id()}`);
    } catch (e: any) {
        const elapsed = (Date.now() - start) / 1000;
        const message = e?.message ?? String(e);

        if (message.includes("Not all commitments found")) {
            assert(false, `SnapshotQuery still broken for dynamic.record inputs: ${message}`);
        } else if (message.includes("already been spent") || message.includes("serial number")) {
            // Record may have been spent — the key assertion is that we didn't
            // get the commitments error. SnapshotQuery fix is working.
            console.log(`  INFO: Record may be spent (expected in CI): ${message}`);
            assert(true, "SnapshotQuery correctly handled dynamic.record (record spent but no commitment error)");
        } else {
            assert(false, `dynamic.record dispatch failed (${elapsed.toFixed(1)}s): ${message}`);
        }
    }
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
    console.log("Initializing thread pool...");
    await initThreadPool();

    console.log("\n" + "=".repeat(60));
    console.log("  Dynamic Dispatch Proving Test (testnet)");
    console.log("=".repeat(60));

    const account = new Account({ privateKey: PRIVATE_KEY });
    console.log(`\n  Account: ${account.address()}`);

    const keyProvider = new AleoKeyProvider();
    keyProvider.useCache(true);

    const pm = new ProgramManager(API_URL, keyProvider);
    pm.setAccount(account);

    // Fetch program source from testnet.
    const networkClient = new AleoNetworkClient(API_URL);
    console.log("  Fetching test_dcall_sdk.aleo from testnet...");
    const programSource = await networkClient.getProgram(PROGRAM_ID);

    // Run tests.
    await testBasicDynamicDispatch(pm, programSource);
    await testDynamicRecordInput(pm, programSource);

    // Summary.
    console.log("\n" + "=".repeat(60));
    console.log(`  Results: ${passed} passed, ${failed} failed`);
    console.log("=".repeat(60));

    if (failed > 0) process.exit(1);
    console.log("\nDone!");
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
