import { createWasmEngine } from "@provablehq/provable-engine-wasm";
import { ProvableKit } from "@provablehq/provablekit";
import {Account, initThreadPool, ProgramManager, AleoKeyProvider} from "@provablehq/provable-engine-wasm/testnet.js";
import { CREDITS_PROGRAM_KEYS } from "@provablehq/provable-engine-wasm/testnet.js";

// Initialize the threadpool to speed up proving.

await ProvableKit.init({
  engine: createWasmEngine(),
  env: { network: "testnet" },
});
await initThreadPool();

// Specify the record to send.
const sendRecord = "{\n  owner: aleo1vskzxa2qqgnhznxsqh6tgq93c30sfkj6xqwe7sr85lgjkexjlcxs3lxhy3.private,\n  microcredits: 500000u64.private,\n  _nonce: 2128807984625485873765840993868794284062894954530194503954279385341936659546group.public,\n  _version: 1u8.public\n}";
// Specify the fee record to use for the transaction.
const feeRecord = "{\n  owner: aleo1vskzxa2qqgnhznxsqh6tgq93c30sfkj6xqwe7sr85lgjkexjlcxs3lxhy3.private,\n  microcredits: 50000u64.private,\n  _nonce: 8327477210335641151082470829879168522735279120730137538049818239556464339772group.public,\n  _version: 1u8.public\n}";
// Import the account.
const accountCiphertext = "ciphertext1qvq283j7ujnhz59d4rnu772rfmvf94039x9ekhk2lzuutteqzlghsr3g9824qgw97a79mmdymqdt0ulqdkahq39vnerw2tl7thvvnnunq386jzjnw29e0ghnq7unphgdzw637q3fgvvlkrcywsc5jukkdhss5qq3njp";
const account = Account.fromCiphertext(accountCiphertext, "provablealeo1");
// Specify the recipient.
const recipient = "aleo1vskzxa2qqgnhznxsqh6tgq93c30sfkj6xqwe7sr85lgjkexjlcxs3lxhy3";

// Create a program manager with the account desired.
const programManager = new ProgramManager();
programManager.setAccount(account);

// Create a key provider in order to re-use the same key for each execution
const keyProvider = new AleoKeyProvider();
keyProvider.useCache(true);

// ----- Uncomment these line for faster proving! -------
// This line set fetches the required keys for proving and stores them in the key provider.
// await Promise.all([keyProvider.transferKeys("private"), keyProvider.feePrivateKeys()]);
// This line sets the inclusion prover which is required for transactions that use records in order to prove their
// inclusion in aleo history.
// await programManager.setInclusionProver();

// Initialize the keyProvider cache with all necessary keys.
programManager.setKeyProvider(keyProvider);

const start = Date.now();
console.log("Starting transfer_private execution");
// Construct the transfer_private transaction.
await programManager.buildExecutionTransaction({
    programName: "credits.aleo",
    functionName: "transfer_private",
    priorityFee: 0,
    privateFee: true,
    inputs: [sendRecord, recipient, "500000u64"],
    feeRecord,
    keySearchParams: { "cacheKey" : CREDITS_PROGRAM_KEYS.getKey("transfer_private").locator}
});
console.log(`transfer_private Execute finished in ${Date.now() - start}ms`);
