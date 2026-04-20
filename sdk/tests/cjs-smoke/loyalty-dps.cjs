// CJS end-to-end validation: proves a pure-CJS consumer can run the full
// encrypted DPS flow — build proving request, encrypt with noble, submit,
// wait for on-chain confirmation.
//
// Mirrors the ESM loyalty template's `mint_card` path but uses `require()`
// throughout. Validates the full CJS → DPS → on-chain round-trip end to end.
//
// Required env: ALEO_CONSUMER_ID, ALEO_DPS_API_KEY, ALEO_DPS_URL.

const path = require("node:path");
const fs = require("node:fs");

const sdk = require(path.resolve(__dirname, "../../dist/testnet/node.cjs"));

const DPS_URL = process.env.ALEO_DPS_URL || "https://api.provable.com/prove/testnet";
const DPS_API_KEY = process.env.ALEO_DPS_API_KEY;
const CONSUMER_ID = process.env.ALEO_CONSUMER_ID;
const API_URL = "https://api.provable.com/v2";

if (!DPS_API_KEY || !CONSUMER_ID) {
    console.error("SKIP: ALEO_DPS_API_KEY and ALEO_CONSUMER_ID required for CJS DPS test.");
    process.exit(0);
}

// Same demo account the ESM loyalty template uses — has existing records.
const ACCOUNT_CIPHERTEXT =
    "ciphertext1qvq283j7ujnhz59d4rnu772rfmvf94039x9ekhk2lzuutteqzlghsr3g9824qgw97a79mmdymqdt0ulqdkahq39vnerw2tl7thvvnnunq386jzjnw29e0ghnq7unphgdzw637q3fgvvlkrcywsc5jukkdhss5qq3njp";
const ACCOUNT_PASSWORD = "provablealeo1";

const TOKEN_PROGRAM_PATH = path.resolve(
    __dirname,
    "../../../create-leo-app/template-node-loyalty-program-ts/loyalty_token/build/main.aleo",
);
const tokenProgram = fs.readFileSync(TOKEN_PROGRAM_PATH, "utf-8").trim();

async function waitForTransaction(networkClient, txId, timeoutMs = 300_000, intervalMs = 5_000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        try {
            const tx = await networkClient.getTransaction(txId);
            if (tx) return tx;
        } catch {
            // Not yet confirmed.
        }
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
    throw new Error(`Transaction ${txId} did not confirm within ${timeoutMs}ms`);
}

async function main() {
    console.log("[cjs-dps] Initializing thread pool...");
    await sdk.initThreadPool();

    const account = sdk.Account.fromCiphertext(ACCOUNT_CIPHERTEXT, ACCOUNT_PASSWORD);
    console.log(`[cjs-dps] Account: ${account.address().to_string()}`);

    const programManager = new sdk.ProgramManager(API_URL);
    programManager.setAccount(account);
    programManager.setKeyProvider(new sdk.AleoKeyProvider());

    // Two clients: DPS for submitting encrypted proving requests, and the
    // explorer API for polling transaction state (mirrors the ESM loyalty
    // template at create-leo-app/template-node-loyalty-program-ts/src/index.ts).
    const dpsClient = new sdk.AleoNetworkClient(DPS_URL);
    const explorerClient = new sdk.AleoNetworkClient("https://api.explorer.provable.com/v1");

    const programName = sdk.Program.fromString(tokenProgram).id();
    const nonce = Math.floor(Math.random() * 1_000_000_000).toString();
    const inputs = [account.address().to_string(), "100u64", `${nonce}field`];

    console.log(`[cjs-dps] Building proving request for ${programName}/mint_card...`);
    const provingRequest = await programManager.provingRequest({
        programName,
        programSource: tokenProgram,
        functionName: "mint_card",
        inputs,
        priorityFee: 0,
        privateFee: false,
        broadcast: true,
    });

    console.log("[cjs-dps] Submitting encrypted proving request to DPS...");
    const response = await dpsClient.submitProvingRequest({
        provingRequest,
        url: DPS_URL,
        apiKey: DPS_API_KEY,
        consumerId: CONSUMER_ID,
        dpsPrivacy: true,
    });

    const txId = response.transaction && response.transaction.id;
    if (!txId) throw new Error("DPS response did not contain a transaction ID");
    console.log(`[cjs-dps] Submitted: ${txId}`);

    console.log("[cjs-dps] Waiting for on-chain confirmation...");
    const confirmed = await waitForTransaction(explorerClient, txId);
    if (!confirmed) throw new Error("Transaction never confirmed");

    console.log(`\x1b[32m✓ CJS + encrypted DPS round-trip confirmed: ${txId}\x1b[0m`);
    process.exit(0);
}

main().catch((err) => {
    console.error(`\x1b[31m✗ CJS DPS fixture failed:\x1b[0m`, err);
    process.exit(1);
});
