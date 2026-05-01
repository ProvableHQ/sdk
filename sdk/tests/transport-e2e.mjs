#!/usr/bin/env node
// End-to-end transport verification: proves that buildExecutionTransaction
// routes all network calls through the configured transport via QueryOption.
// ProgramManager wraps a CallbackQuery in QueryOption and passes it to WASM.
// All state fetching (state root, block height, state paths) goes through
// the JS transport layer — including programs with DynamicRecord inputs.
//
// Global fetch is replaced with a function that throws, simulating an mTLS
// environment. If WASM makes any direct network call, this test fails.
//
// Test 2 uses a synthetic record (not on-chain) to verify that state path
// fetching is routed through transport. The record parses and produces valid
// commitments locally, triggering the getStatePaths transport call. The API
// returns "not found" which is caught as a non-transport error — proving the
// transport was used without requiring a funded account or block scanning.
//
// Run: node tests/transport-e2e.mjs

import { Account, ProgramManager, AleoKeyProvider, AleoNetworkClient, RecordPlaintext, stringToField, initThreadPool } from "../dist/testnet/node.js";

function log(label, ok, detail = "") {
    const prefix = ok ? "\x1b[32m✓\x1b[0m" : "\x1b[31m✗\x1b[0m";
    console.log(`${prefix} ${label}${detail ? `  (${detail})` : ""}`);
    if (!ok) process.exit(1);
}

await initThreadPool(2);

const transportCalls = [];
const originalFetch = globalThis.fetch;

// Block global fetch — simulates mTLS environment
globalThis.fetch = async (...args) => {
    throw new Error(`BLOCKED: global fetch for ${String(args[0]).slice(0, 80)}`);
};

const mtlsTransport = async (...args) => {
    transportCalls.push(String(args[0]));
    return originalFetch(...args);
};

const privateKey = "APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH";
const account = new Account({ privateKey });
const address = account.address().to_string();

const pm = new ProgramManager("https://api.provable.com/v2", undefined, undefined, {
    transport: mtlsTransport,
});
const kp = new AleoKeyProvider({ transport: mtlsTransport });
kp.useCache(true);
pm.setAccount(account);
pm.setKeyProvider(kp);

console.log("=== Transport E2E: blocked global fetch ===\n");

// --- Test 1: Public transfer (no record inputs) ---
console.log("Test 1: transfer_public (no record inputs)");
transportCalls.length = 0;
try {
    const tx = await pm.buildExecutionTransaction({
        programName: "credits.aleo",
        functionName: "transfer_public",
        inputs: [address, "1u64"],
        priorityFee: 0,
        privateFee: false,
    });
    log("transfer_public built with blocked global fetch", true);
} catch (e) {
    log("transfer_public", false, e.message?.slice(0, 200));
}

const t1StateRoot = transportCalls.filter(u => u.includes("stateRoot")).length;
const t1Height = transportCalls.filter(u => u.includes("height/latest")).length;
log("State root fetched via transport", t1StateRoot > 0);
log("Block height fetched via transport", t1Height > 0);

// --- Test 2: Private transfer (synthetic record — needs state path) ---
console.log("\nTest 2: transfer_private (synthetic record input)");

// Construct a synthetic record owned by the test account. This record does
// not exist on-chain, but it parses correctly and produces a valid commitment
// that WASM uses to request state paths via the transport. The API will return
// "not found" which is a non-transport error — proving transport routing works.
const syntheticRecord = RecordPlaintext.fromString(`{
  owner: ${address}.private,
  microcredits: 1000000u64.private,
  _nonce: 0group.public
}`);

transportCalls.length = 0;
try {
    const tx = await pm.buildExecutionTransaction({
        programName: "credits.aleo",
        functionName: "transfer_private",
        inputs: [syntheticRecord.toString(), address, "1u64"],
        priorityFee: 0,
        privateFee: false,
    });
    log("transfer_private built with blocked global fetch", true);
} catch (e) {
    if (e.message?.includes("BLOCKED")) {
        log("transfer_private — WASM bypassed transport", false, e.message?.slice(0, 150));
    } else {
        // Non-transport errors are expected (synthetic record has no on-chain state path)
        log("transfer_private — transport worked (non-transport error)", true, e.message?.slice(0, 100));
    }
}

const t2StatePaths = transportCalls.filter(u => u.includes("statePaths"));
log("State paths fetched via transport", t2StatePaths.length > 0, `${t2StatePaths.length} call(s)`);

// --- Test 3: Dynamic dispatch (call.dynamic — commitments discovered at runtime) ---
console.log("\nTest 3: dynamic_transfer_pub_to_priv (call.dynamic)");

// Fetch the deployed program source via transport
const nc = new AleoNetworkClient("https://api.provable.com/v2", { transport: mtlsTransport });
const programSource = await nc.getProgram("test_dcall_sdk.aleo");
log("Fetched test_dcall_sdk.aleo via transport", !!programSource);

const toField = (s) => stringToField(s).toString();
transportCalls.length = 0;
try {
    const tx = await pm.buildExecutionTransaction({
        programName: "test_dcall_sdk.aleo",
        functionName: "dynamic_transfer_pub_to_priv",
        inputs: [
            toField("credits"),
            toField("aleo"),
            toField("transfer_public_to_private"),
            address,
            "100u64",
        ],
        priorityFee: 0,
        privateFee: false,
        program: programSource,
    });
    log("dynamic dispatch built with blocked global fetch", true);
} catch (e) {
    if (e.message?.includes("BLOCKED")) {
        log("dynamic dispatch — WASM bypassed transport", false, e.message?.slice(0, 150));
    } else {
        // Non-transport errors are OK (e.g., insufficient balance for fee)
        log("dynamic dispatch — transport worked (non-transport error)", true, e.message?.slice(0, 100));
    }
}

const t3StateRoot = transportCalls.filter(u => u.includes("stateRoot")).length;
const t3Height = transportCalls.filter(u => u.includes("height/latest")).length;
log("State root fetched via transport (dynamic)", t3StateRoot > 0);
log("Block height fetched via transport (dynamic)", t3Height > 0);

// --- Summary ---
console.log("\n=== Summary ===");
console.log(`Total transport calls: ${transportCalls.length}`);
log("All network calls routed through transport", true);

globalThis.fetch = originalFetch;
process.exit(0);
