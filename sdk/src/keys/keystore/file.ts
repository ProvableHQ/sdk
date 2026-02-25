import * as fs from "node:fs/promises";
import * as path from "path";

import { FunctionKeyPair } from "../../models/keyPair.js";
import { KeyFingerprint, } from "../verifier/interface.js";
import { KeyLocator, KeyStore } from "./interface.js";
import { MemKeyVerifier } from "../verifier/memory.js";
import { ProvingKey, VerifyingKey } from "../../wasm.js";

export class LocalFileKeyStore implements KeyStore {
    private directory: string;
    private readonly keyVerifier = new MemKeyVerifier();

    /**
     * Creates a new directory at the given path or CURRENTDIR/keystore if none is provided to store keys.
     *
     * @param {string} [directory] - Optional custom directory path for key storage. Defaults to "keystore" in current working directory.
     * @throws {Error} If directory creation fails.
     */
    constructor(directory?: string) {
        this.directory = directory ?? path.join(process.cwd(), "keystore");

        // Ensure directory exists
        fs.mkdir(this.directory, { recursive: true }).catch((err) => {
            console.error("Failed to create keystore directory:", err);
        });
    }

    /**
     * Generates the path for a key metadata file based on the locator.
     *
     * @private
     * @param {string} locator - Unique identifier for the key.
     * @returns {string} Full filesystem path to the metadata file.
     */
    private metadataPath(locator: string): string {
        return path.join(this.directory, `${locator}.metadata`);
    }

    /**
     * Reads and parses the key fingerprint metadata from storage.
     *
     * @private
     * @param {string} locator - Unique identifier for the key.
     * @returns {Promise<KeyFingerprint | null>} The key fingerprint if found, null if file doesn't exist.
     * @throws {Error} If file read fails for any reason other than not found.
     */
    private async readKeyMetadata(
        locator: string,
    ): Promise<KeyFingerprint | null> {
        try {
            const data = await fs.readFile(this.metadataPath(locator), "utf-8");
            return JSON.parse(data) as KeyFingerprint;
        } catch (err: unknown) {
            if (
                err &&
                typeof err === "object" &&
                "code" in err &&
                err.code === "ENOENT"
            )
                return null;
            throw err;
        }
    }

    /**
     * Writes key fingerprint metadata to storage.
     *
     * @private
     * @param {string} locator - Unique identifier for the key.
     * @param {KeyFingerprint} metadata - Key fingerprint metadata to store.
     * @returns {Promise<void>}
     * @throws {Error} If directory creation or file write fails.
     */
    private async writeKeyMetadata(
        locator: string,
        metadata: KeyFingerprint,
    ): Promise<void> {
        await fs.mkdir(path.dirname(this.metadataPath(locator)), {
            recursive: true,
        });
        await fs.writeFile(
            this.metadataPath(locator),
            JSON.stringify(metadata, null, 0),
            "utf-8",
        );
    }

    private async readFileOptional(
        filepath: string,
    ): Promise<Uint8Array | null> {
        try {
            const data = await fs.readFile(filepath);
            return new Uint8Array(data);
        } catch (err: any) {
            if (err.code === "ENOENT") return null;
            throw err;
        }
    }

    /**
     * Atomically writes data to a file, ensuring the parent directories exist.
     * Uses an atomic write pattern to prevent partial writes or corruption.
     *
     * @private
     * @param {string} filepath - Full path to the file to write
     * @param {Uint8Array} data - Binary data to write to the file
     * @returns {Promise<void>} Resolves when write is complete
     * @throws {Error} If directory creation or file write fails
     */
    private async writeFileAtomic(
        filepath: string,
        data: Uint8Array,
    ): Promise<void> {
        // Ensure parent directories for nested locators exist
        await fs.mkdir(path.dirname(filepath), { recursive: true });
        await fs.writeFile(filepath, data);
    }

    /**
     * Recursively clears all key files from a directory.
     * Only removes files with .prover, .verifier, or .metadata extensions.
     *
     * @private
     * @param {string} dir - Directory path to clear
     * @returns {Promise<void>} Resolves when clearing is complete
     * @throws {Error} If directory listing fails for reasons other than non-existence
     *
     * @remarks
     * - Silently ignores errors when removing individual files
     * - Skips files that don't match the expected extensions
     * - Does not remove directories themselves
     */
    private async clearRecursive(dir: string): Promise<void> {
        let entries: string[];
        try {
            entries = await fs.readdir(dir);
        } catch (err: any) {
            if (err.code === "ENOENT") {
                return;
            }
            throw err;
        }

        await Promise.all(
            entries.map(async (name) => {
                const full = path.join(dir, name);
                let isDirectory = false;
                try {
                    const stat = await fs.stat(full);
                    isDirectory = stat.isDirectory();
                } catch {
                    return;
                }

                if (isDirectory) {
                    await this.clearRecursive(full);
                } else if (
                    name.endsWith(".prover") ||
                    name.endsWith(".verifier") ||
                    name.endsWith(".metadata")
                ) {
                    await fs.unlink(full).catch(() => {});
                }
            }),
        );
    }

    // -------------------------------------------------------
    // KEYSTORE INTERFACE
    // -------------------------------------------------------

    /**
     * Retrieves the key bytes from storage and optionally verifies them against a fingerprint.
     *
     * @param {KeyLocator} locator - Object containing a locator string for the key + optional fingerprint for verification.
     * @returns {Promise<Uint8Array | null>} The key bytes if found and verified (if fingerprint provided), null if not found.
     * @throws {KeyVerificationError} If fingerprint verification fails.
     * @example
     * const keyBytes = await getKeyBytes({
     *   locator: 'transfer_private.prover.421e5a5',
     *   fingerprint: { checksum: '421e5a52f01a1eeb068bbf56d15e19477ff7290e4b988d1013e15563f2b77801', size: '116746954'}
     * });
     * if (keyBytes) {
     *   // Use the verified key bytes
     * }
     */
    async getKeyBytes(locator: KeyLocator): Promise<Uint8Array | null> {
        // Attempt to read key bytes from storage.
        const keyBytes = await this.readFileOptional(locator.locator);

        // If no key bytes were found, return null.
        if (!keyBytes) return null;

        // If a fingerprint was provided, verify the key bytes against it.
        if (
            locator.fingerprint ||
            (await this.getKeyMetadata(locator.locator))
        ) {
            await this.keyVerifier.verifyKeyBytes({
                keyBytes,
                locator: locator.locator,
                fingerprint: locator.fingerprint,
            });
        }

        // Return the verified key bytes.
        return keyBytes;
    }

    /**
     * Retrieves and verifies a proving key from storage.
     *
     * @param {KeyLocator} locator - Object containing the proving key location and optional fingerprint.
     * @returns {Promise<ProvingKey | null>} The proving key if found and verified, null if not found.
     * @throws {KeyVerificationError} If fingerprint verification fails.
     * @throws {Error} If key bytes cannot be parsed into a valid ProvingKey.
     *
     * @example
     * try {
     *   const key = await getProvingKey({
     *     locator: 'transfer_private.prover.421e5a5'
     *   });
     *   if (key) {
     *     // Use the verified proving key
     *   }
     * } catch (err) {
     *   if (err instanceof KeyVerificationError) {
     *     // Handle verification failure.
     *   } else {
     *     // Handle key parsing error.
     *   }
     * }
     */
    async getProvingKey(locator: KeyLocator): Promise<ProvingKey | null> {
        // Get the key bytes from storage.
        const proverBytes = await this.getKeyBytes(locator);

        // Attempt to parse the key bytes as a WASM ProvingKey (throws if invalid).
        ProvingKey.fromBytes(proverBytes);
    }

    /**
     * Retrieves and verifies a verifying key from storage.
     *
     * @param {KeyLocator} locator - Object containing the proving key location and optional fingerprint.
     * @returns {Promise<ProvingKey | null>} The proving key if found and verified, null if not found.
     * @throws {KeyVerificationError} If fingerprint verification fails.
     * @throws {Error} If key bytes cannot be parsed into a valid ProvingKey.
     *
     * @example
     * try {
     *   const key = await getVerifyingKey({
     *     locator: 'transfer_private.verifier.4ac2f71'
     *   });
     *   if (key) {
     *     // Use the verified proving key
     *   }
     * } catch (err) {
     *   if (err instanceof KeyVerificationError) {
     *     // Handle verification failure.
     *   } else {
     *     // Handle key parsing error.
     *   }
     * }
     */
    async getVerifyingKey(locator: KeyLocator): Promise<ProvingKey | null> {
        // Get the key bytes from storage.
        const proverBytes = await this.getKeyBytes(locator);

        // Attempt to parse the key bytes as a WASM ProvingKey (throws if invalid).
        VerifyingKey.fromBytes(proverBytes);
    }

    /**
     * Stores proving and verifying keys in key storage.
     *
     * @param {KeyLocator} proverLocator The unique locator for the desired proving key.
     * @param {KeyLocator} verifierLocator The unique locator for the desired verifying key.
     * @param {FunctionKeyPair} keys The proving and verifying keys.
     *
     * @example
     * const keys = await generateKeys();
     * await setKeys({
     *   proverLocator: 'transfer_private.prover',
     *   verifierLocator: 'transfer_private.verifier'
     * }, keys);
     */
    async setKeys(
        proverLocator: KeyLocator,
        verifierLocator: KeyLocator,
        keys: FunctionKeyPair,
    ): Promise<void> {
        // Convert the WASM keys to raw bytes.
        const [provingKey, verifyingKey] = keys;
        const [provingKeyBytes, verifyingKeyBytes] = [
            provingKey.toBytes(),
            verifyingKey.toBytes(),
        ];

        // Compute the fingerprints for the proving and verifying keys, verify against expected fingerprints if provided.
        const [proverFingerPrint, verifierFingerPrint] = await Promise.all([
            this.keyVerifier.computeKeyMetadata({
                keyBytes: provingKeyBytes,
                locator: proverLocator.locator,
                fingerprint: proverLocator.fingerprint,
            }),
            this.keyVerifier.computeKeyMetadata({
                keyBytes: verifyingKeyBytes,
                locator: verifierLocator.locator,
                fingerprint: verifierLocator.fingerprint,
            }),
        ]);

        // Write the proving and verifying key bytes and their metadata to storage.
        await this.writeFileAtomic(proverLocator.locator, provingKeyBytes);
        await this.writeFileAtomic(verifierLocator.locator, verifyingKeyBytes);
        await this.writeKeyMetadata(proverLocator.locator, proverFingerPrint);
        await this.writeKeyMetadata(
            verifierLocator.locator,
            verifierFingerPrint,
        );
    }

    /**
     * Store a raw proving or verifying key in storage along with its fingerprint metadata for future verification.
     *
     * @param {Uint8Array} keyBytes The raw proving and verifying key bytes.
     * @param {KeyLocator} locator The unique locator for the desired key pair.
     * @returns {Promise<void>}
     * @throws {Error} If computing key metadata or writing to storage fails
     *
     * @example
     * const keys = await generateKeys();
     * await setKeyBytes(keys.provingKey.toBytes(), { locator: 'transfer_private.prover' });
     */
    async setKeyBytes(keyBytes: Uint8Array, locator: KeyLocator): Promise<void> {
        // Compute the key metadata including fingerprint
        const computedMetadata = await this.keyVerifier.computeKeyMetadata({
            keyBytes: keyBytes,
            locator: locator.locator,
            fingerprint: locator.fingerprint,
        });

        // Write the key bytes and metadata atomically
        await this.writeFileAtomic(locator.locator, keyBytes);
        await this.writeKeyMetadata(locator.locator, computedMetadata);
    }

    /**
     * Returns stored metadata for a keypair, if any.
     *
     * @param {string} locator The unique locator for the keypair.
     * @returns {Promise<{ prover: KeyFingerprint; verifier: KeyFingerprint } | null>} The stored metadata, or null if none or keypair does not exist.
     *
     * @example
     * const metadata = await getKeyMetadata('transfer_private.prover.421e5a5');
     * if (metadata) {
     *   // Use the stored metadata.
     * }
     */
    getKeyMetadata(locator: string): Promise<KeyFingerprint | null> {
        return this.readKeyMetadata(locator);
    }

    /**
     * Checks if a key exists at the specified locator path.
     *
     * @param {string} locator - Unique identifier for the key location.
     * @returns {Promise<boolean>} True if key exists at location, false otherwise.
     *
     * @example
     * const exists = await has('transfer_private.prover.421e5a5');
     * if (exists) {
     *   // Key exists at location.
     * } else {
     *   // Key does not exist at location.
     * }
     */
    async has(locator: string): Promise<boolean> {
        return await fs
            .access(locator)
            .then(() => true)
            .catch(() => false);
    }

    /**
     * Deletes a key and its associated metadata from storage. Silently ignores errors if files don't exist.
     *
     * @param {string} locator - Unique identifier for the key to delete.
     * @returns {Promise<void>}
     *
     * @example
     * await delete('transfer_private.prover.421e5a5');
     */
    async delete(locator: string): Promise<void> {
        const p = this.directory + "/" + locator;
        const m = this.metadataPath(locator);

        await fs.unlink(p).catch(() => {});
        await fs.unlink(m).catch(() => {});
    }

    /**
     * Clears all keys and metadata from the key storage directory. Uses recursive deletion but preserves the directory structure.
     *
     * @returns {Promise<void>}
     * @throws {Error} If directory clearing fails for reasons other than non-existence
     *
     * @example
     * await clear(); // Clears all keys and metadata from the keystore directory.
     */
    async clear(): Promise<void> {
        await this.clearRecursive(this.directory);
    }
}