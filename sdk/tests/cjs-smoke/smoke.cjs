// Pure-CJS smoke test. Runs in a directory without `"type": "module"` so the
// `require` condition of the SDK's `exports` map resolves.
//
// Exercises: module load, account creation, signing, noble-based encryption,
// and the `crypto_box_seal` wire format that the DPS consumes.

const assert = require("node:assert");
const path = require("node:path");
const crypto = require("node:crypto");

// A real X25519 public key — generate a throwaway keypair so the noble
// composition gets a well-formed 32-byte u-coordinate to operate on.
const recipient = crypto.generateKeyPairSync("x25519");
const recipientRawKey = recipient.publicKey.export({ type: "spki", format: "der" }).slice(-32);
const recipientPublicKeyB64 = recipientRawKey.toString("base64");

// Resolve to the workspace SDK (monorepo-style) so this runs pre-publish.
const sdk = require(path.resolve(__dirname, "../../dist/testnet/node.cjs"));

function log(label, ok, detail = "") {
    const prefix = ok ? "\x1b[32m✓\x1b[0m" : "\x1b[31m✗\x1b[0m";
    console.log(`${prefix} ${label}${detail ? `  (${detail})` : ""}`);
    if (!ok) process.exit(1);
}

// 1. Module shape
log("require() resolves without top-level-await error", typeof sdk === "object");
log("Account class exported", typeof sdk.Account === "function");
log("ProgramManager class exported", typeof sdk.ProgramManager === "function");
log("encryptViewKey function exported", typeof sdk.encryptViewKey === "function");
log("encryptProvingRequest function exported", typeof sdk.encryptProvingRequest === "function");
log("initThreadPool function exported", typeof sdk.initThreadPool === "function");
log("LocalFileKeyStore (node-only) exported", typeof sdk.LocalFileKeyStore === "function");

// 2. Account/key derivation actually works — first real WASM call.
const account = new sdk.Account();
const privKey = account.privateKey().to_string();
log("Account created", privKey.startsWith("APrivateKey"), privKey.slice(0, 20) + "…");
log("View key derivable", account.viewKey().to_string().startsWith("AViewKey"));
log("Address derivable", account.address().to_string().startsWith("aleo1"));

// 3. Signature round-trip
const message = new TextEncoder().encode("cjs-smoke-test");
const signature = account.sign(message);
log("Signature produced", signature.to_string().startsWith("sign1"));
log("Signature verifies", account.verify(message, signature) === true);

// 4. Noble-based encryption: verify ciphertext shape matches crypto_box_seal.
//    32-byte ephemeral public key + 16-byte Poly1305 tag + payload (view key = 32 bytes).
{
    const ciphertext = sdk.encryptViewKey(recipientPublicKeyB64, account.viewKey());
    log("encryptViewKey returns string (sync)", typeof ciphertext === "string");

    const raw = Buffer.from(ciphertext, "base64");
    log(
        "ciphertext wire shape is 32+16+viewKeyLen bytes",
        raw.length === 32 + 16 + account.viewKey().toBytesLe().length,
        `got ${raw.length} bytes`,
    );
}

// 5. Registration request shape — CJS consumer's likely RSS interop path.
{
    const ct = sdk.encryptRegistrationRequest(recipientPublicKeyB64, account.viewKey(), 12345);
    log("encryptRegistrationRequest returns string (sync)", typeof ct === "string");
}

// 6. Dynamic variant under CJS — consumers that want runtime network switching
//    from CJS do `const { loadNetwork } = require('@provablehq/sdk/dynamic.js')`.
{
    const dyn = require(path.resolve(__dirname, "../../dist/dynamic/node.cjs"));
    log("dynamic/node.cjs exposes loadNetwork", typeof dyn.loadNetwork === "function");
}

// 7. Worker / thread pool — loads the ESM worker via dynamic import() from
//    a CJS parent. This is the single most load-bearing check for CJS +
//    threading parity.
(async () => {
    try {
        const dyn = require(path.resolve(__dirname, "../../dist/dynamic/node.cjs"));
        const testnet = await dyn.loadNetwork("testnet");
        log("dynamic loadNetwork('testnet') resolves to SDK namespace", typeof testnet.Account === "function");
    } catch (err) {
        log("dynamic loadNetwork failed", false, err.message);
    }

    try {
        await sdk.initThreadPool(2);
        log("initThreadPool(2) spawned workers from CJS parent", true);
    } catch (err) {
        log("initThreadPool failed", false, err.message);
    }
    console.log("\n\x1b[32mAll CJS smoke checks passed.\x1b[0m");
    process.exit(0);
})();
