import {Account, Address, CREDITS_PROGRAM_KEYS, initThreadPool, ProgramManager, OfflineQuery, OfflineKeyProvider, ProvingKey, Transaction} from "@aleohq/sdk";
import { getLocalKey, preDownloadBondingKeys, preDownloadTransferKeys } from "./helpers";

await initThreadPool();

async function buildTransferPublicTxOffline(recipientAddress: Address, amount: number, latestStateRoot: string, keyPaths: {}): Promise<Error | Transaction>  {
    // Create an offline program manager
    const programManager = new ProgramManager();

    // Create a temporary account for the execution of the program
    const account = new Account();
    programManager.setAccount(account);

    // Create the proving keys from the key bytes on the offline machine
    console.log("Creating proving keys from local key files");
    const feePublicKeyBytes = await getLocalKey(<string>keyPaths[CREDITS_PROGRAM_KEYS.fee_public.locator]);
    const transferPublicKeyBytes = await getLocalKey(<string>keyPaths[CREDITS_PROGRAM_KEYS.transfer_public.locator]);
    const feePublicProvingKey = ProvingKey.fromBytes(feePublicKeyBytes);
    const transferPublicProvingKey = ProvingKey.fromBytes(transferPublicKeyBytes);

    // Create an offline key provider
    console.log("Creating offline key provider");
    const offlineKeyProvider = new OfflineKeyProvider();

    // Insert the proving keys into the offline key provider. The key provider will automatically insert the verifying
    // keys into the key manager.
    console.log("Inserting proving keys into key provider");
    offlineKeyProvider.insertFeePublicKeys(feePublicProvingKey);
    offlineKeyProvider.insertTransferPublicKeys(transferPublicProvingKey);

    // Create an offline query to complete the inclusion proof
    const offlineQuery = new OfflineQuery(latestStateRoot);

    // Insert the key provider into the program manager
    programManager.setKeyProvider(offlineKeyProvider);

    // Build tne transfer transaction offline
    console.log("Building transfer transaction offline");
    return programManager.buildTransferPublicTransaction(
        amount,
        recipientAddress.to_string(),
        0.28,
        undefined,
        offlineQuery,
    );
}

async function buildBondingTxOffline(recipientAddress: Address, amount: number, latestStateRoot: string, keyPaths: {}) {
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

    // Create an offline key provider
    console.log("Creating offline key provider");
    const offlineKeyProvider = new OfflineKeyProvider();

    // Insert the proving keys into the offline key provider. The key provider will automatically insert the verifying
    // keys into the key manager.
    console.log("Inserting proving keys into key provider");
    offlineKeyProvider.insertFeePublicKeys(feePublicProvingKey);
    offlineKeyProvider.insertBondPublicKeys(bondPublicProvingKey);
    offlineKeyProvider.insertUnbondPublicKeys(unBondPublicProvingKey);
    offlineKeyProvider.insertClaimUnbondPublicKeys(claimUnbondPublicProvingKey);

    // Create an offline query to complete the inclusion proof
    const offlineQuery = new OfflineQuery(latestStateRoot);

    // Insert the key provider into the program manager
    programManager.setKeyProvider(offlineKeyProvider);
}

// ONLINE COMPONENT (Do this part on an internet connected machine)
const transferKeyPaths = await preDownloadTransferKeys();
const bondingKeyPaths = await preDownloadBondingKeys();

const latestStateRoot = "sr1p93gpsezrjzdhcd2wujznx5s07k8qa39t6vfcej35zew8vn2jyrs46te8q";

// OFFLINE COMPONENT (Do this part on an offline machine)
const recipientAddress = new Account().address();
const transferTx = await buildTransferPublicTxOffline(recipientAddress, 100, latestStateRoot, transferKeyPaths);
console.log("Transfer transaction built offline!");
console.log(`TransferTx:\n${transferTx}`);

// ONLINE COMPONENT (Uncomment this part to send the transaction to the Aleo Network on an internet connected machine)
// Submit the transaction to the network
// const txId = await networkClient.submitTransaction(transferTx);

