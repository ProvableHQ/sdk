This example demonstrates how to execute transfer_private using locally saved proving and verifying keys.
```typescript
import { Account, ProgramManager, ProvingKey, VerifyingKey, initThreadPool, OfflineKeyProvider} from '@provable.sdk';

// Helper method to load the keys from storage.
async function loadFunctionKeyPair(proverPath, verifierPath) {
    const proverBytes = await fs.readFile(proverPath);
    const verifierBytes = await fs.readFile(verifierPath);

    const provingKey = ProvingKey.fromBytes(new Uint8Array(proverBytes));
    const verifyingKey = VerifyingKey.fromBytes(new Uint8Array(verifierBytes));

    return [provingKey, verifyingKey];
}

// Download the inclusion proving and verifying keys.
const [inclusionProver, inclusionVerifier] = await loadFunctionKeyPair(
    "./keys/inclusion.prover",
    "./keys/inclusion.verifier"
);

// Download the transfer_private proving and verifying keys.
const [transferPrivateProvingKey, transferPrivateVerifyingKey] = await loadFunctionKeyPair(
    "./keys/transfer_private.prover",
    "./keys/transfer_private.verifier"
);

// Download the fee_private proving and verifying keys.
const [feeProvingKey, feeVerifyingKey] = await loadFunctionKeyPair(
    "./keys/fee_private.prover",
    "./keys/fee_private.verifier"
);

// Initialize multi-threading to allow WASM execution.
await initThreadPoool();

// Create a new Account, Program Manager, NetworkClient, KeyProvider, and RecordProvider.
const account = new Account();
const programManager = new ProgramManager();
const networkClient = new AleoNetworkClient("https://api.explorer.provable.com/v1");
const offlineKeyProvider = new OfflineKeyProvider();
const recordProvider = new NetworkRecordProvider(account, networkClient);

// Add the keys for fee_private, transfer_private, and the inclusion circuit to the key provider.
offlineKeyProvider.insertFeePrivateKeys(feeProvingKey)
offlineKeyProvider.insertTransferPrivateKeys(transferPrivateProvingKey)
offlineKeyProvider.insertInclusionKeys(inclusionProver);

// Create an offline query using the latest state root for the inclusion proof.
const offlineQuery = new OfflineQuery("latestStateRoot");

// Create the program manager
const programManager = new ProgramManager();
programManager.setAccount(account);
programManager.setKeyProvider(offlineKeyProvider);

// Build the execution.
const offlineExecuteTx = await programManager.buildExecutionTransaction(
    programName: "credits.aleo",
    functionName: "transfer_private",
    priorityFee: 0.0,
    privateFee: true,
    inputs: 5u32,
    offlienQuery
    );





