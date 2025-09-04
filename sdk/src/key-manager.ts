import fs from "node:fs/promises";

type KeyBytes = {
  provingKey: Uint8Array;
  verifyingKey: Uint8Array;
};

interface KeyStorage {
    saveKeyToDisk(path: string, filename: string, keyBytes: KeyBytes): Promise<void>;
    loadKeyFromDisk(provingKeyPath: string): Promise<Uint8Array>;
}


class KeyStorageManager implements KeyStorage {
    /**
    * Saves the keys in a FunctionKeyPair to the local disk.
    * @param {string} path The path to save the keys to.
    * @param {string} keyID The keyId to use for the file names.
    * @param {KeyBytes} keyPairBuffers The buffers containing the proving and verifying keys.
    * 
    * @returns {Promise<void>} A promise that resolves when the keys have been saved.
    */
    async saveKeyToDisk(path: string, keyID: string, keyPairBytes: KeyBytes): Promise<void> {
        await fs.mkdir(path, { recursive: true });
        await fs.writeFile(`${path}/${keyID}_proving`, keyPairBytes.provingKey);
        await fs.writeFile(`${path}/${keyID}_verifying`, keyPairBytes.verifyingKey);
    }

    /**
    * Load keys from disk.
    * @param {string} keyPath The file path for the proving or verifying key.
    *
    * @returns {Promise<FunctionKeyPair>}
    */
    async loadKeyFromDisk(keyPath: string): Promise<Uint8Array> {
        const key = await fs.readFile(keyPath);

        return key;
    }
}

export { KeyBytes, KeyStorageManager };