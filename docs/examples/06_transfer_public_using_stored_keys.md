This example demonstrates how to execute public_transfer using locally saved proving and verifying keys.
```typescript
import { Account, ProgramManager, ProvingKey, VerifyingKey, initThreadPool, OfflineKeyProvider} from '@provable.sdk';

// Initialize multi-threading to allow WASM execution.
await initThreadPoool();

// Helper method to load the keys from storage.
async function loadFunctionKeyPair(proverPath, verifierPath) {
    const proverBytes = await fs.readFile(proverPath);
    const verifierBytes = await fs.readFile(verifierPath);

    const provingKey = ProvingKey.fromBytes(new Uint8Array(proverBytes));
    const verifyingKey = VerifyingKey.fromBytes(new Uint8Array(verifierBytes));

    return [provingKey, verifyingKey];
}

// Load the proving and verifying keys for public_transfer and fee_public from local storage.
const [feeProvingKey, feeVerifyingKey] = await loadFunctionKeyPair(
    "./keys/fee_public.prover",
    "./keys/fee_public.verifier"
);

const [transferPublicProvingKey, transferPublicVerifyingKey] = await loadFunctionKeyPair(
    "./keys/transfer_public.prover",
    "./keys/transfer_public.verifier"
);

// Create an offline Key provider
const keyProvider = new OfflineKeyProvider();


// Store the proving keys in the offline key provider.
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