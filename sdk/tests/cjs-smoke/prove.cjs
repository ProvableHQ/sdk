// Full local proving smoke test from CJS.
// Exercises: initThreadPool → ProgramManager.run() → proof verification.

const path = require("node:path");
const sdk = require(path.resolve(__dirname, "../../dist/testnet/node.cjs"));

const helloProgram =
    "program hellothere.aleo;\n\n" +
    "function hello:\n" +
    "    input r0 as u32.public;\n" +
    "    input r1 as u32.private;\n" +
    "    add r0 r1 into r2;\n" +
    "    output r2 as u32.private;\n";

function log(label, ok, detail = "") {
    const prefix = ok ? "\x1b[32m✓\x1b[0m" : "\x1b[31m✗\x1b[0m";
    console.log(`${prefix} ${label}${detail ? `  (${detail})` : ""}`);
    if (!ok) process.exit(1);
}

(async () => {
    const t0 = performance.now();

    // 1. Thread pool
    await sdk.initThreadPool(2);
    log("initThreadPool(2) spawned workers", true);

    // 2. Set up ProgramManager
    const keyProvider = new sdk.AleoKeyProvider();
    keyProvider.useCache(true);
    const programManager = new sdk.ProgramManager(undefined, keyProvider);
    programManager.setAccount(new sdk.Account());

    // 3. Execute + prove locally
    console.log("\nProving hellothere.aleo/hello(5u32, 5u32)...");
    const tProve = performance.now();
    const result = await programManager.run(
        helloProgram,
        "hello",
        ["5u32", "5u32"],
        true,  // proveExecution
    );
    const proveMs = (performance.now() - tProve).toFixed(0);

    // 4. Verify output
    const outputs = result.getOutputs();
    log("Execution produced output", outputs.length > 0, outputs[0]);
    log("Output is 10u32", outputs[0] === "10u32", `got ${outputs[0]}`);

    // 5. Verify proof
    programManager.verifyExecution(result, 10_300_000);
    log("Proof verified", true);

    const totalMs = (performance.now() - t0).toFixed(0);
    console.log(`\nProving: ${proveMs}ms | Total: ${totalMs}ms`);
    console.log("\n\x1b[32mFull CJS proving smoke passed.\x1b[0m");
    process.exit(0);
})();
