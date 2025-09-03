// This example will demonstrate how to build an offline public transfer transaction using proving keys from local storage
```typescript
import { Account, AleoKeyProvider, CREDITS_PROGRAM_KEYS, initThreadPool, OfflineKeyProvider, OfflineSearchParams, ProgramManager, ProvingKey, VerifyingKey } from '@provable.sdk';

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
const feeKeyBuffer = keyProvider.convertKeysToBuffer(feeKeyPair);
const transferPublicKeyBuffer = keyProvider.convertToBuffer(transferPublicKeyPair);
await keyProvider.saveKeysToLocalDisk("/KEY_DIR", "fee_public", feeKeyBuffer);
await keyProvider.saveKeysToLocalDisk("/KEY_DIR", "transfer_public", transferPublicKeyBuffer);

// Load keys from storage using the Offline Key Provider
const offlineKeyProvider = new OfflineKeyProvider();
const feeKeys = offlineKeyProvider.loadKeysFromDisk("./KEY_DIR/fee_public.prover", "./KEY_DIR/fee_public.verifier");
const transferPublicKeys = offlineKeyProvider.loadKeysFromDisk("./KEY_DIR/transfer_public.prover", "./KEY_DIR/transfer_public.verifier")

// Store the keys in cache
offlineKeyProvider.insertFeePublicKeys(transferPublicKeys);
offlineKeyProvider.insertTransferPublicKeys(transferPublicKeys);

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