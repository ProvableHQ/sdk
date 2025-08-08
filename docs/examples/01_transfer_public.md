```typescript
import { Account, ProgramManager, ProvingKey, VerifyingKey, initThreadPool, OfflineKeyProvider} from '@provable.sdk';

// Initialize multi-threading to allow WASM execution.
await initThreadPoool();

// Create an account.
const account = new Account();

// Create a new NetworkClient, KeyProvider, and RecordProvider using official Aleo record, key, and network providers
const networkClient = new AleoNetworkClient("https://api.explorer.provable.com/v1");
const keyProvider = new AleoKeyProvider();
keyProvider.useCache = true;
const recordProvider = new NetworkRecordProvider(account, networkClient);

// Fetch the proving and verifying keys for the transfer_public and fee_public methods.
const [feePk, feeVk] = await keyProvider.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.fee_public);
const [txPk,  txVk]  = await keyProvider.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.transfer_public);

// Optionally save the keys to a local directory for future use
async function writeKeyToFile(key, filePath) {
  // Serialize the key into a Uint8Array
  const raw = key.toBytes();      // or key.to_bytes() depending on your SDK version
  // Then write it as binary
  await fs.writeFile(filePath, Buffer.from(raw));
  console.log(`Wrote ${filePath}`);
}

const keyDir = "./keys";
await fs.mkdir(keyDir, { recursive: true });

await writeKeyToFile(feePk, path.join(keyDir, "fee_public.prover"));
await writeKeyToFile(feeVk, path.join(keyDir, "fee_public.verifier"));
await writeKeyToFile(txPk,  path.join(keyDir, "transfer_public.prover"));
await writeKeyToFile(txVk,  path.join(keyDir, "transfer_public.verifier"));



// Create an offline key provider. 
const offlineKeyProvider = new OfflineKeyProvider();

// Load the stored keys into a cache them into an OfflineKeyProvider
const transferPublicProvingKey = await getLocalKey("./keys/transfer_public.prover");
const transferPublicVerifyingKey = await getLocalKey("./keys/transfer_public.verifier");

const feeProvingKey = await getLocalKey("./keys/fee_public.prover");
const feeVerifyingKey = await getLocalKey("./keys/fee_public.verifier");

offlineKeyProvider.insertTransferPublicKeys(transferPublicProvingKey);
offlineKeyProvider.insertFeePublicKeys(feeProvingKey);

// Create program manager using the OfflineKeyProvider and NetworkProvider.
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", offlineKeyProvider, recordProvider);
// Set the account as the program caller.
programManager.setAccount(account);

// Create recipient account.
const recipient = new Account();

// Build a transfer_public transaction.
// Publicly send 5 microcredits to the recipient
const transaction = await programManager
  .buildTransferPublicTransaction(
    5,              // The amount to be transferred in credits (not microcredits)
    recipient       // The address of the recipient.
      .address()
      .to_string(),
    0.0             // The optional priority fee amount.
  );

// Broadcast the transaction to the Aleo network.
const result = await programManager.networkClient.submitTransaction(transaction);
```