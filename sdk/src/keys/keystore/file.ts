import * as fs from "node:fs/promises";
import * as fsSync from "node:fs";
import * as path from "path";

import { FunctionKeyPair } from "../../models/keyPair.js";
import { KeyFingerprint } from "../verifier/interface.js";
import { InvalidLocatorError } from "./error.js";
import { KeyLocator, KeyStore } from "./interface.js";
import { MemKeyVerifier } from "../verifier/memory.js";
import { ProvingKey, VerifyingKey } from "../../wasm.js";

export class LocalFileKeyStore implements KeyStore {
    private directory: string;
    private readonly keyVerifier = new MemKeyVerifier();

    /**
     * Creates a new directory at the given path or CURRENTDIR/.aleo if none is provided to store keys.
     * If a custom directory is passed and its last path segment is not ".aleo", ".aleo" is appended
     * so keys are stored under that subdirectory (e.g. /home/project → /home/project/.aleo).
     *
     * @param {string} [directory] - Optional custom directory path for key storage. Defaults to ".aleo" in current working directory.
     * @throws {Error} If directory creation fails.
     */
    constructor(directory?: string) {
        this.directory = directory ?? path.join(process.cwd(), ".aleo");
        if (directory !== undefined && path.basename(this.directory) !== ".aleo") {
            this.directory = path.join(this.directory, ".aleo");
        }
        fsSync.mkdirSync(this.directory, { recursive: true });
    }

    /**
     * Validates that a locator is a safe filesystem identifier.
     *
     * @private
     * @param {string} locator - Unique identifier used to derive a metadata file path.
     * @throws {InvalidLocatorError} If the locator could cause path traversal.
     */
    private validateLocator(locator: string): void {
        // Reject empty and reserved names that could resolve to the directory or parent
        if (locator === "" || locator === "." || locator === "..") {
            throw new InvalidLocatorError(
                `Invalid locator: reserved or empty name "${locator}"`,
                locator,
                "reserved_name"
            );
        }

        // Explicitly block traversal attempts
        if (locator.includes("..")) {
            throw new InvalidLocatorError(
                "Invalid locator: path traversal detected",
                locator,
                "path_traversal"
            );
        }

        // Block path separators and null byte
        if (locator.includes("/") || locator.includes("\\") || locator.includes("\0")) {
            throw new InvalidLocatorError(
                "Invalid locator: path separator or null byte not allowed",
                locator,
                "path_separator"
            );
        }
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
        const dir = path.dirname(filepath);
        await fs.mkdir(dir, { recursive: true });
        const tempPath = path.join(
            dir,
            `.${path.basename(filepath)}.${process.pid}.${Date.now()}.${Math.random().toString(16).slice(2)}.tmp`
        );
        await fs.writeFile(tempPath, data);
        try {
            await fs.rename(tempPath, filepath);
        } catch (err: unknown) {
            const code = err && typeof err === "object" && "code" in err ? (err as NodeJS.ErrnoException).code : undefined;
            // Windows often throws EEXIST when target exists; EPERM/EACCES happen with locks/AV.
            if (code === "EEXIST" || code === "EPERM" || code === "EACCES") {
                await fs.unlink(filepath).catch(() => {});
                try {
                    await fs.rename(tempPath, filepath);
                } catch (err2) {
                    await fs.unlink(tempPath).catch(() => {});
                    throw err2;
                }
            } else {
                await fs.unlink(tempPath).catch(() => {});
                throw err;
            }
        }
    }

    /**
     * Recursively removes all files and subdirectories under the given directory, then removes the directory itself.
     *
     * @private
     * @param {string} dir - Directory path to clear
     * @returns {Promise<void>} Resolves when clearing is complete
     * @throws {Error} If directory listing fails for reasons other than non-existence
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
                let stat: Awaited<ReturnType<typeof fs.stat>>;
                try {
                    stat = await fs.stat(full);
                } catch {
                    return;
                }

                if (stat.isDirectory()) {
                    await this.clearRecursive(full);
                } else if (stat.isFile()) {
                    await fs.unlink(full).catch(() => {});
                }
            }),
        );

        await fs.rmdir(dir).catch(() => {});
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
     *   fingerprint: { checksum: '421e5a52f01a1eeb068bbf56d15e19477ff7290e4b988d1013e15563f2b77801', size: 116746954 }
     * });
     * if (keyBytes) {
     *   // Use the verified key bytes
     * }
     */
    async getKeyBytes(locator: KeyLocator): Promise<Uint8Array | null> {
        this.validateLocator(locator.locator);
        // Attempt to read key bytes from storage (under this.directory).
        const keyBytes = await this.readFileOptional(path.join(this.directory, locator.locator));

        // If no key bytes were found, return null.
        if (!keyBytes) return null;

        // Use caller-provided fingerprint or metadata stored on disk for verification.
        const fingerprint =
            locator.fingerprint ?? (await this.getKeyMetadata(locator.locator));
        if (fingerprint) {
            await this.keyVerifier.verifyKeyBytes({
                keyBytes,
                locator: locator.locator,
                fingerprint,
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
        if (!proverBytes) return null;

        // Attempt to parse the key bytes as a WASM ProvingKey (throws if invalid).
        return ProvingKey.fromBytes(proverBytes);
    }

    /**
     * Retrieves and verifies a verifying key from storage.
     *
     * @param {KeyLocator} locator - Object containing the verifying key location and optional fingerprint.
     * @returns {Promise<VerifyingKey | null>} The verifying key if found and verified, null if not found.
     * @throws {KeyVerificationError} If fingerprint verification fails.
     * @throws {Error} If key bytes cannot be parsed into a valid VerifyingKey.
     *
     * @example
     * try {
     *   const key = await getVerifyingKey({
     *     locator: 'transfer_private.verifier.4ac2f71'
     *   });
     *   if (key) {
     *     // Use the verified verifying key
     *   }
     * } catch (err) {
     *   if (err instanceof KeyVerificationError) {
     *     // Handle verification failure.
     *   } else {
     *     // Handle key parsing error.
     *   }
     * }
     */
    async getVerifyingKey(locator: KeyLocator): Promise<VerifyingKey | null> {
        // Get the key bytes from storage.
        const verifierBytes = await this.getKeyBytes(locator);
        if (!verifierBytes) return null;

        // Attempt to parse the key bytes as a WASM VerifyingKey (throws if invalid).
        return VerifyingKey.fromBytes(verifierBytes);
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
     * await setKeys(
     *   { locator: 'transfer_private.prover' },
     *   { locator: 'transfer_private.verifier' },
     *   keys
     * );
     */
    async setKeys(
        proverLocator: KeyLocator,
        verifierLocator: KeyLocator,
        keys: FunctionKeyPair,
    ): Promise<void> {
        this.validateLocator(proverLocator.locator);
        this.validateLocator(verifierLocator.locator);
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

        // Write the proving and verifying key bytes and their metadata to storage (under this.directory).
        await this.writeFileAtomic(path.join(this.directory, proverLocator.locator), provingKeyBytes);
        await this.writeFileAtomic(path.join(this.directory, verifierLocator.locator), verifyingKeyBytes);
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
        this.validateLocator(locator.locator);
        // Compute the key metadata including fingerprint
        const computedMetadata = await this.keyVerifier.computeKeyMetadata({
            keyBytes: keyBytes,
            locator: locator.locator,
            fingerprint: locator.fingerprint,
        });

        // Write the key bytes and metadata atomically (key file under this.directory).
        await this.writeFileAtomic(path.join(this.directory, locator.locator), keyBytes);
        await this.writeKeyMetadata(locator.locator, computedMetadata);
    }

    /**
     * Returns stored metadata for a key, if any.
     *
     * @param {string} locator The unique locator for the key.
     * @returns {Promise<KeyFingerprint | null>} The stored fingerprint metadata for that locator, or null if none exists.
     *
     * @example
     * const metadata = await getKeyMetadata('transfer_private.prover.421e5a5');
     * if (metadata) {
     *   // Use the stored metadata.
     * }
     */
    async getKeyMetadata(locator: string): Promise<KeyFingerprint | null> {
        this.validateLocator(locator);
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
        this.validateLocator(locator);
        const keyPath = path.join(this.directory, locator);
        return await fs
            .access(keyPath)
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
        this.validateLocator(locator);
        const p = path.join(this.directory, locator);
        const m = this.metadataPath(locator);

        await fs.unlink(p).catch(() => {});
        await fs.unlink(m).catch(() => {});
    }

    /**
     * Clears the key storage directory by recursively removing all files and subdirectories under it, then removes the keystore directory itself.
     *
     * @returns {Promise<void>}
     * @throws {Error} If directory listing fails for reasons other than non-existence.
     *
     * @example
     * await clear(); // Removes all files under the keystore directory.
     */
    async clear(): Promise<void> {
        await this.clearRecursive(this.directory);
    }
}