import {Account, Address, CREDITS_PROGRAM_KEYS, initThreadPool, ProgramManager, OfflineQuery, OfflineKeyProvider, OfflineSearchParams, ProvingKey, Transaction} from "@provablehq/sdk";
import { getLocalKey, preDownloadBondingKeys, preDownloadTransferKeys } from "./helpers";

await initThreadPool();

/// Build transfer public transaction without connection to the internet
async function buildTransferPublicTxOffline(recipientAddress: Address, amount: number, latestStateRoot: string, keyPaths: {}): Promise<Transaction>  {
    // Create an offline program manager
    const programManager = new ProgramManager();

    // Create a temporary account for the execution of the program
    const account = new Account();
    programManager.setAccount(account);

    // Create the proving keys from the key bytes on the offline machine
    console.log("Creating proving keys from local key files");
    const feePublicKeyBytes = await getLocalKey(<string>keyPaths[CREDITS_PROGRAM_KEYS.fee_public.locator]);
    const feePublicProvingKey = ProvingKey.fromBytes(feePublicKeyBytes);
    const transferPublicProvingKey = ProvingKey.fromBytes(
        await getLocalKey(<string>keyPaths[CREDITS_PROGRAM_KEYS.transfer_public.locator])
    );
    
    // Create an offline key provider
    console.log("Creating offline key provider");
    const offlineKeyProvider = new OfflineKeyProvider();

    // Insert the proving keys into the offline key provider. The key provider will automatically insert the verifying
    // keys into the key manager.
    console.log("Inserting proving keys into key provider");
    offlineKeyProvider.insertFeePublicKeys(feePublicProvingKey);

try {
    offlineKeyProvider.insertTransferPublicKeys(transferPublicProvingKey);
    console.log("Successfully inserted proving key");
} catch (err) {
    console.error("Failed to insert proving key:", err);
}


    // Create an offline query to complete the inclusion proof
    let offlineQuery: OfflineQuery;
    const blockHeight = 0;
    // TODO this is a placeholder block height for now, which offlineQuery now requires
try {
    const offlineQuery = new OfflineQuery(blockHeight, latestStateRoot);
    console.log("Successfully created OfflineQuery", offlineQuery);
} catch (err) {
    console.error("Failed to create OfflineQuery:", err);
}

    // Insert the key provider into the program manager
    programManager.setKeyProvider(offlineKeyProvider);

    // Build tne transfer_public transaction offline
    console.log("Building transfer transaction offline");
    return programManager.buildTransferPublicAsSignerTransaction(
        amount,
        recipientAddress.to_string(),
        0.28,
        undefined,
        offlineQuery,
    );
}

/// Build bonding and unbonding transactions without connection to the internet
async function buildBondingTxOffline(
    validatorAddress: Address, 
    withdrawalAddress: Address, 
    amount: number, 
    latestStateRoot: string, 
    keyPaths: {}
): Promise<Transaction[]> {
    // Create an offline program manager
    const programManager = new ProgramManager();

    // Create a temporary account for the execution of the program
    const account = new Account();
    programManager.setAccount(account);

    // Create the proving keys from the key bytes on the offline machine
    console.log("Creating proving keys from local key files");
    const feePublicKeyBytes = await getLocalKey(<string>keyPaths[CREDITS_PROGRAM_KEYS.fee_public.locator]);
    const bondPublicKeyBytes = await getLocalKey(<string>keyPaths[CREDITS_PROGRAM_KEYS.bond_public.locator]);
    const unbondPublicKeyBytes = await getLocalKey(<string>keyPaths[CREDITS_PROGRAM_KEYS.unbond_public.locator]);
    const claimUnbondPublicKeyBytes = await getLocalKey(<string>keyPaths[CREDITS_PROGRAM_KEYS.claim_unbond_public.locator]);
    const feePublicProvingKey = ProvingKey.fromBytes(feePublicKeyBytes);
    const bondPublicProvingKey = ProvingKey.fromBytes(bondPublicKeyBytes);
    const unBondPublicProvingKey = ProvingKey.fromBytes(unbondPublicKeyBytes);
    const claimUnbondPublicProvingKey = ProvingKey.fromBytes(claimUnbondPublicKeyBytes);

    // Create an offline key provider to fetch keys without connection to the internet
    console.log("Creating offline key provider");
    const offlineKeyProvider = new OfflineKeyProvider();

    // Insert the proving keys into the offline key provider
    console.log("Inserting proving keys into key provider");
    offlineKeyProvider.insertFeePublicKeys(feePublicProvingKey);
    offlineKeyProvider.insertBondPublicKeys(bondPublicProvingKey);
    offlineKeyProvider.insertUnbondPublicKeys(unBondPublicProvingKey);
    offlineKeyProvider.insertClaimUnbondPublicKeys(claimUnbondPublicProvingKey);

    // Insert the key provider into the program manager
    programManager.setKeyProvider(offlineKeyProvider);

    // Build the bonding transactions offline
    console.log("Building a bond_public execution transaction offline");

    if (!latestStateRoot) {
        throw new Error("latestStateRoot is undefined");
    }

    const bondPublicOptions = {
        keySearchParams: OfflineSearchParams.bondPublicKeyParams(),
        offlineQuery: new OfflineQuery(0, latestStateRoot)
    };


    const bondTx = <Transaction>await programManager.buildBondPublicTransaction(
        validatorAddress.to_string(),
        withdrawalAddress.to_string(),
        amount,
        bondPublicOptions
    );

    console.log("\nbond_public transaction built!\n");

    const unbondPublicOptions = {
        keySearchParams: OfflineSearchParams.unbondPublicKeyParams(),
        offlineQuery: new OfflineQuery(0, latestStateRoot)
    };

    const unBondTx = <Transaction>await programManager.buildUnbondPublicTransaction(
        stakerAddress.to_string(),
        amount,
        unbondPublicOptions
    );
    console.log("\nunbond_public transaction built!\n");

    console.log("Building a claim_unbond_public transaction offline");
    const claimUnbondPublicOptions = {
        keySearchParams: OfflineSearchParams.claimUnbondPublicKeyParams(),
        offlineQuery: new OfflineQuery(0, latestStateRoot)
    };

    const claimUnbondTx = <Transaction>await programManager.buildClaimUnbondPublicTransaction(
        stakerAddress.to_string(),
        claimUnbondPublicOptions
    );
    console.log("\nclaim_unbond_public transaction built!\n");
    return [bondTx, unBondTx, claimUnbondTx];
}

// -------------------ONLINE COMPONENT---------------------
//     (Do this part on an internet connected machine)

// Download the needed keys for the functions we want to execute offline
const transferKeyPaths = await preDownloadTransferKeys();
const bondingKeyPaths = await preDownloadBondingKeys();
//---------------------------------------------------------

// ------------------OFFLINE COMPONENT---------------------
//           (Do this part on an offline machine)
// Get the latest state root from an online machine and enter it into an offline machine
const latestStateRoot = "sr1p93gpsezrjzdhcd2wujznx5s07k8qa39t6vfcej35zew8vn2jyrs46te8q";

// Build a transfer_public transaction
const stakerAddress = new Account().address();
const validatorAddress = new Account().address();
const withdrawalAddress = new Account().address();
const transferTx = await buildTransferPublicTxOffline(stakerAddress, 10000, latestStateRoot, transferKeyPaths);
console.log("Transfer transaction built offline!");
console.log(`\n---------------transfer_public transaction---------------\n${transferTx}`);
console.log(`---------------------------------------------------------`);

// Build bonding & unbonding transactions
const bondTransactions = await buildBondingTxOffline(validatorAddress, withdrawalAddress, 100, latestStateRoot, bondingKeyPaths);
console.log("Bonding transactions built offline!");
console.log(`\n-----------------bond_public transaction-----------------\n${bondTransactions[0]}`);
console.log(`---------------------------------------------------------`);
console.log(`\n----------------unbond_public transaction:---------------\n${bondTransactions[1]}`);
console.log(`---------------------------------------------------------`);
console.log(`\n-----------------claim_unbond_public transaction:---------------\n${bondTransactions[2]}`);
console.log(`---------------------------------------------------------`);
//---------------------------------------------------------

// -------------------ONLINE COMPONENT---------------------
//     (Do this part on an internet connected machine)
// ONLINE COMPONENT (Uncomment this part to send the transaction to the Aleo Network on an internet connected machine)
// Submit the transaction to the network
// const transferTxId = await networkClient.submitTransaction(transferTx);
//---------------------------------------------------------