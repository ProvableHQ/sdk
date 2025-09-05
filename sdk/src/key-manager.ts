import fs from "node:fs/promises";

type KeyBytes = {
  provingKeyBytes: Uint8Array;
  verifyingKeyBytes: Uint8Array;
};

interface KeyStorage {
    saveKeyBytesToDisk(path: string, keyID: string, keyBytes: KeyBytes): Promise<void>;
    loadKeyBytesFromDisk(provingKeyPath: string): Promise<Uint8Array>;
}


class KeyStorageManager {
    /**
    * Saves the key bytes to the local disk.
    * @param {string} path The path to save the keys to.
    * @param {string} keyID The keyId to use for the file names.
    * @param {KeyBytes} keyPairBytes The bytes containing the proving and verifying keys.
    *
    * @returns {Promise<void>} A promise that resolves when the keys have been saved.
    */
    static async saveKeyBytesToDisk(path: string, keyID: string, keyPairBytes: KeyBytes): Promise<void> {
        await fs.mkdir(path, { recursive: true });
        await fs.writeFile(`${path}/${keyID}.prover`, keyPairBytes.provingKeyBytes);
        await fs.writeFile(`${path}/${keyID}.verifier`, keyPairBytes.verifyingKeyBytes);
    }

    /**
    * Load keys from disk.
    * @param {string} keyPath The file path for the proving or verifying key.
    *
    * @returns {Promise<Uint8Array>}
    */
    static async loadKeyBytesFromDisk(path: string, keyID: string): Promise<KeyBytes> {
        const provingKey = await fs.readFile(`${path}/${keyID}.prover`);
        const verifyingKey = await fs.readFile(`${path}/${keyID}.verifier`);
        return {
          provingKeyBytes: new Uint8Array(provingKey),
          verifyingKeyBytes: new Uint8Array(verifyingKey)
        };
    }
}

export { KeyBytes, KeyStorage, KeyStorageManager };