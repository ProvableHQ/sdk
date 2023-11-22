import { CREDITS_PROGRAM_KEYS } from "@aleohq/sdk";
import { promises as fsPromises, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

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
    const keyPaths = {};
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

    return keyPaths;
}

async function preDownloadBondingKeys() {
    const keyPaths = {};
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const keysDirPath = path.join(__dirname, "keys");
    await fsPromises.mkdir(keysDirPath, { recursive: true });

    for (const keyData of [CREDITS_PROGRAM_KEYS.bond_public, CREDITS_PROGRAM_KEYS.fee_public, CREDITS_PROGRAM_KEYS.unbond_public, CREDITS_PROGRAM_KEYS.claim_unbond_public]) {
        try {
            keyPaths[keyData.locator] = await downloadAndSaveKey(keyData, keysDirPath);
        } catch (error) {
            throw(`Failed to download ${keyData.locator} - ${error}`);
        }
    }

    return keyPaths;
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

export { downloadAndSaveKey, getLocalKey, preDownloadBondingKeys, preDownloadTransferKeys };