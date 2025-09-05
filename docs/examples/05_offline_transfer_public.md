// This example demonstrates how to build an offline public transfer transaction using proving keys from local storage
```typescript
import { Account, AleoKeyProvider, CREDITS_PROGRAM_KEYS, initThreadPool, KeyStorageManager, OfflineKeyProvider, OfflineSearchParams, ProgramManager, ProvingKey, VerifyingKey } from '@provable.sdk';

// Initialize multi-threading to allow WASM execution.
await initThreadPoool();

// Create an account.
const account = new Account();

// Create an Aleo Key Provider to fetch the proving and verifying keys for transfer public and fee public methods.
const keyProvider = new AleoKeyProvider();

// Obtain the Proving and Verifying keys for credits.aleo/transfer_public and credits.aleo/fee_public.
const feeKeyPair = await keyProvider.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.fee_public);
const transferPublicKeyPair = await keyProvider.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.transfer_public);

// Save the keys to storage
const feeKeyBuffer = keyProvider.convertKeysToBytes(feeKeyPair);
const transferPublicKeyBuffer = keyProvider.convertKeysToBytes(transferPublicKeyPair);
await KeyStorageManager.saveKeyBytesToDisk("/KEY_DIR", "fee_public", feeKeyBuffer);
await keyProvider.saveKeyBytesToDisk("/KEY_DIR", "transfer_public", transferPublicKeyBuffer);

// Load keys from storage using the Offline Key Provider
const offlineKeyProvider = new OfflineKeyProvider();
const localFeeKeyBytes = await KeyStorageManager.loadKeyBytesFromDisk("./KEY_DIR", "fee_public");
const feeProvingKey = ProvingKey.fromBytes(localFeeKeyBytes.provingKeyBytes);

const localTransferPublicKeyBytes = await KeyStorageManager.loadKeyBytesFromDisk("./KEY_DIR", "transfer_public");
const transferPublicProvingKey = ProvingKey.fromBytes(localTransferPublicKeyBytes.provingKeyBytes);

// Store the keys in cache
offlineKeyProvider.insertFeePublicKeys(feeProvingKey);
offlineKeyProvider.insertTransferPublicKeys(transferPublicProvingKey);

// Create an account.
const account = new Account();

// Create program manager using the KeyProvider and NetworkProvider.
const programManager = new ProgramManager("https://api.explorer.provable.com/v2", keyProvider);
// Set the account as the program caller.
programManager.setAccount(account);

// Create recipient account.
const recipient = new Account();

// Build a transfer_public transaction.
// Publicly send 5 microcredits to the recipient
const transaction = await programManager
  .buildExecutionTransaction(
    progranName: "credits.aleo",
    functionName: "transfer_public",
    priorityFee: 0.0,
    privateFee: false,
    inputs: [$"{RECEIVER_ALEO_ADDRESS}", "5"],
    keySearchParams: OfflineSearchParams.transferPublicKeyParams(),
  );
```