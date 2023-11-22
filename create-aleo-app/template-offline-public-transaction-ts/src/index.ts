import {Account, Address, AleoNetworkClient, CREDITS_PROGRAM_KEYS, initThreadPool, ProgramManager, OfflineQuery, OfflineKeyProvider, ProvingKey, Transaction} from "@aleohq/sdk";
import { promises as fsPromises, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const keyPaths = {};
await initThreadPool();

async function downloadAndSaveKey(keyData, keysDirPath) {
    const locatorParts = keyData.locator.split('/');
    const fileName = locatorParts.pop();
    const dirPath = path.join(keysDirPath, ...locatorParts);
    await fsPromises.mkdir(dirPath, { recursive: true });
    const filePath = path.join(dirPath, `${fileName}.prover`);

    try {
        await fsPromises.access(filePath);
        return filePath;
    } catch {
        const res = await fetch(keyData.prover);
        const buffer = await res.arrayBuffer();
        writeFileSync(filePath, new Uint8Array(buffer), { flag: 'wx' });
        console.log(`Downloaded ${keyData.locator}.prover to ${filePath}`);
        return filePath;
    }
}

async function preDownloadTransferKeys() {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const keysDirPath = path.join(__dirname, "keys");
    await fsPromises.mkdir(keysDirPath, { recursive: true });

    for (const keyData of [CREDITS_PROGRAM_KEYS.transfer_public, CREDITS_PROGRAM_KEYS.fee_public]) {
        try {
            keyPaths[keyData.locator] = await downloadAndSaveKey(keyData, keysDirPath);
        } catch (error) {
            throw(`Failed to download ${keyData.locator} - ${error}`);
        }
    }
}

async function getLocalKey(filePath: string): Promise<Uint8Array> {
    try {
        console.log("Reading key file:", filePath);
        const buffer = await fsPromises.readFile(filePath);
        return new Uint8Array(buffer);
    } catch (error) {
        console.error("Error reading file:", error);
        throw error;
    }
}

async function buildTransferPublicTxOffline(recipientAddress: Address, amount: number, latestStateRoot: string): Promise<Error | Transaction>  {
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

// ONLINE COMPONENT (Do this part on an internet connected machine)
try {
    await preDownloadTransferKeys();
} catch (error) {
    if (error.code === 'EEXIST') {
        console.error('Keys already exist on disk!');
    } else {
        console.error('An error occurred:', error);
    }
}

const latestStateRoot = "sr1p93gpsezrjzdhcd2wujznx5s07k8qa39t6vfcej35zew8vn2jyrs46te8q";

// OFFLINE COMPONENT (Do this part on an offline machine)
const recipientAddress = new Account().address();
const transferTx = await buildTransferPublicTxOffline(recipientAddress, 100, latestStateRoot);
console.log("Transfer transaction built offline!");
console.log(`TransferTx:\n${transferTx}`);

// ONLINE COMPONENT (Uncomment this part to send the transaction to the Aleo Network on an internet connected machine)
// Submit the transaction to the network
// const txId = await networkClient.submitTransaction(transferTx);

