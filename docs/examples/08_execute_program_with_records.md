The following template demonstrates how to create an execution using saved proving keys for transactions that either mint or consume records. 

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

// Load the inclusion proving and verifying keys.
const [inclusionProver, inclusionVerifier] = await loadFunctionKeyPair(
    "./keys/inclusion.prover",
    "./keys/inclusion.verifier"
);

// Load the fee public proving and verifying keys.
const [feeProvingKey, feeVerifyingKey] = await loadFunctionKeyPair(
    "./keys/fee_public.prover",
    "./keys/fee_public.verifier"
);

// Load the proving and verifying keys associate with the transition method.
const [transitionProvingKey, transitionVerifyingKey] = await loadFunctionKeyPair(
    "./keys/transition.prover",
    "./keys/transition.verifier"
);

// Create a new Account, Program Manager, NetworkClient, KeyProvider, and RecordProvider.
const account = new Account();
const programManager = new ProgramManager();
const networkClient = new AleoNetworkClient("https://api.explorer.provable.com/v1");
const offlineKeyProvider = new OfflineKeyProvider();
const recordProvider = new NetworkRecordProvider(account, networkClient);

// Add the keys for fee_public and the inclusion circuit to the key provider.
offlineKeyProvider.insertFeePublicKeys(feeProvingKey)
offlineKeyProvider.insertInclusionKeys(inclusionProver);

// Cache the proving key for the transition method.
// Replace "program_name" and "transition_name" with the your program and transition method.
OfflineKeyProvider.cacheKeys("program_name.aleo/transition_name", transitionProvingKey, transitionerifyingKey);

// Create an offline search params object.
const offlineSearchParams = new OfflineSearchParams("program_name.aleo/transition_name");

// Create an offline query using the latest state root for the inclusion proof.
const offlineQuery = new OfflineQuery("latestStateRoot");

// Create the program manager
const programManager = new ProgramManager("https://api.explorer.provable.com/v1", offlineKeyProvider, recordProvider);
programManager.setAccount(account);

// Build the execution.
const offlineExecuteTx = await programManager.buildExecutionTransaction(
    programName: "program_name.aleo",
    functionName: "transition_method",
    priorityFee: 0.0,
    privateFee: false,
    inputs: 5u32, // replace with whatever input(s) your transition method requires
    offlineSearchParams,
    offlineQuery
    );

// Broadcast the transaction to the network
 const txId = await networkClient.broadcastTransaction(offlineExecuteTx);