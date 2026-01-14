import * as fs from "node:fs/promises";
import * as fsSync from "node:fs";
import * as path from "node:path";

import { FunctionKeyPair } from "../../models/keyPair.js";
import { KeyFingerprint } from "../verifier/interface.js";
import { InvalidLocatorError } from "./error.js";
import { KeyLocator, KeyStore, ProvingKeyLocator, VerifyingKeyLocator } from "./interface.js";
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
     * Validates a single locator component for unsafe filesystem characters.
     *
     * @private
     * @param {string} value - The component value to validate.
     * @param {string} label - Label for error messages (e.g. "program", "functionName").
     * @throws {InvalidLocatorError} If the value is empty, contains traversal sequences, path separators, or null bytes.
     */
    private validateComponent(value: string, label: string): void {
        if (value === "" || value === ".") {
            throw new InvalidLocatorError(
                `KeyLocator ${label} must not be empty or "." (got "${value}")`,
                value,
                "reserved_name"
            );
        }
        if (value.includes("..")) {
            throw new InvalidLocatorError(
                `KeyLocator ${label} must not contain ".." (got "${value}")`,
                value,
                "path_traversal"
            );
        }
        if (value.includes("/") || value.includes("\\") || value.includes("\0")) {
            throw new InvalidLocatorError(
                `KeyLocator ${label} must not contain path separators or null bytes (got "${value}")`,
                value,
                "path_separator"
            );
        }
    }

    /**
     * Validates that a numeric locator field is not negative.
     *
     * @private
     * @param {number} value - The numeric value to validate.
     * @param {string} label - Label for error messages (e.g. "edition", "amendment").
     * @throws {InvalidLocatorError} If the value is negative.
     */
    private validateNonNegative(value: number, label: string): void {
        if (!Number.isInteger(value) || value < 0) {
            throw new InvalidLocatorError(
                `KeyLocator ${label} must be a non-negative integer (got ${value})`,
                String(value),
                "negative_value"
            );
        }
    }

    /**
     * Serializes a {@link KeyLocator} to a filesystem-safe flat string, validating components first.
     *
     * For prover/verifier keys: `{program}.{functionName}.e{edition}.a{amendment}.{network}.{keyType}`
     * For translation keys: `{program}.{functionName}.e{edition}.a{amendment}.{network}.translation.{recordName}.{recordInputPosition}`
     *
     * Note: The optional `checksum` field is excluded — it is used for integrity verification only
     * (via {@link checksumToFingerprint}) and is not part of the key identity.
     *
     * @private
     * @param {KeyLocator} locator - The key locator.
     * @returns {string} A dot-delimited string safe for use as a filename.
     * @throws {InvalidLocatorError} If any component contains unsafe characters.
     */
    private serializeLocator(locator: KeyLocator): string {
        this.validateComponent(locator.program, "program");
        this.validateComponent(locator.functionName, "functionName");
        this.validateComponent(locator.network, "network");
        this.validateNonNegative(locator.edition, "edition");
        this.validateNonNegative(locator.amendment, "amendment");
        const base = `${locator.program}.${locator.functionName}.e${locator.edition}.a${locator.amendment}.${locator.network}.${locator.keyType}`;
        if (locator.keyType === "translation") {
            this.validateComponent(locator.recordName, "recordName");
            this.validateNonNegative(locator.recordInputPosition, "recordInputPosition");
            return `${base}.${locator.recordName}.${locator.recordInputPosition}`;
        }
        return base;
    }

    /**
     * Converts an optional checksum string from a locator into a KeyFingerprint
     * suitable for the key verifier, using the actual key byte length for size.
     *
     * @private
     */
    private checksumToFingerprint(checksum: string | undefined, keyBytes: Uint8Array): KeyFingerprint | undefined {
        if (!checksum) return undefined;
        return { checksum, size: keyBytes.length };
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
     * Uses fs.rm with recursive: true and force: true so that symbolic links are removed without following them,
     * avoiding deletion of content outside the keystore.
     *
     * @private
     * @param {string} dir - Directory path to clear
     * @returns {Promise<void>} Resolves when clearing is complete
     * @throws {Error} If directory removal fails for reasons other than non-existence
     */
    private async clearDirectory(dir: string): Promise<void> {
        try {
            await fs.rm(dir, { recursive: true, force: true });
        } catch (err: unknown) {
            const code = err && typeof err === "object" && "code" in err ? (err as NodeJS.ErrnoException).code : undefined;
            if (code === "ENOENT") {
                return;
            }
            throw err;
        }
    }

    // -------------------------------------------------------
    // KEYSTORE INTERFACE
    // -------------------------------------------------------

    /**
     * Retrieves the key bytes from storage and optionally verifies them.
     *
     * @param {KeyLocator} locator - The key locator with optional checksum for verification.
     * @returns {Promise<Uint8Array | null>} The key bytes if found and verified, null if not found.
     * @throws {KeyVerificationError} If verification fails.
     */
    async getKeyBytes(locator: KeyLocator): Promise<Uint8Array | null> {
        const fileKey = this.serializeLocator(locator);

        // Attempt to read key bytes from storage (under this.directory).
        const keyBytes = await this.readFileOptional(path.join(this.directory, fileKey));

        // If no key bytes were found, return null.
        if (!keyBytes) return null;

        // Use caller-provided checksum or metadata stored on disk for verification.
        const fingerprint =
            this.checksumToFingerprint(locator.checksum, keyBytes) ?? (await this.getKeyMetadata(locator));
        if (fingerprint) {
            await this.keyVerifier.verifyKeyBytes({
                keyBytes,
                locator: fileKey,
                fingerprint,
            });
        }

        // Return the verified key bytes.
        return keyBytes;
    }

    /**
     * Retrieves and verifies a proving key from storage.
     *
     * @param {ProvingKeyLocator} locator - The proving key locator.
     * @returns {Promise<ProvingKey | null>} The proving key if found and verified, null if not found.
     * @throws {KeyVerificationError} If verification fails.
     * @throws {Error} If key bytes cannot be parsed into a valid ProvingKey.
     */
    async getProvingKey(locator: ProvingKeyLocator): Promise<ProvingKey | null> {
        const proverBytes = await this.getKeyBytes(locator);
        if (!proverBytes) return null;
        return ProvingKey.fromBytes(proverBytes);
    }

    /**
     * Retrieves and verifies a verifying key from storage.
     *
     * @param {VerifyingKeyLocator} locator - The verifying key locator.
     * @returns {Promise<VerifyingKey | null>} The verifying key if found and verified, null if not found.
     * @throws {KeyVerificationError} If verification fails.
     * @throws {Error} If key bytes cannot be parsed into a valid VerifyingKey.
     */
    async getVerifyingKey(locator: VerifyingKeyLocator): Promise<VerifyingKey | null> {
        const verifierBytes = await this.getKeyBytes(locator);
        if (!verifierBytes) return null;
        return VerifyingKey.fromBytes(verifierBytes);
    }

    /**
     * Stores proving and verifying keys in key storage.
     *
     * @param {ProvingKeyLocator} proverLocator The locator for the proving key.
     * @param {VerifyingKeyLocator} verifierLocator The locator for the verifying key.
     * @param {FunctionKeyPair} keys The proving and verifying keys.
     */
    async setKeys(
        proverLocator: ProvingKeyLocator,
        verifierLocator: VerifyingKeyLocator,
        keys: FunctionKeyPair,
    ): Promise<void> {
        const proverKey = this.serializeLocator(proverLocator);
        const verifierKey = this.serializeLocator(verifierLocator);

        // Convert the WASM keys to raw bytes.
        const [provingKey, verifyingKey] = keys;
        const [provingKeyBytes, verifyingKeyBytes] = [
            provingKey.toBytes(),
            verifyingKey.toBytes(),
        ];

        // Compute the fingerprints for the proving and verifying keys, verify against expected checksums if provided.
        const [proverFingerPrint, verifierFingerPrint] = await Promise.all([
            this.keyVerifier.computeKeyMetadata({
                keyBytes: provingKeyBytes,
                locator: proverKey,
                fingerprint: this.checksumToFingerprint(proverLocator.checksum, provingKeyBytes),
            }),
            this.keyVerifier.computeKeyMetadata({
                keyBytes: verifyingKeyBytes,
                locator: verifierKey,
                fingerprint: this.checksumToFingerprint(verifierLocator.checksum, verifyingKeyBytes),
            }),
        ]);

        // Write the proving and verifying key bytes and their metadata to storage (under this.directory).
        await this.writeFileAtomic(path.join(this.directory, proverKey), provingKeyBytes);
        await this.writeFileAtomic(path.join(this.directory, verifierKey), verifyingKeyBytes);
        await this.writeKeyMetadata(proverKey, proverFingerPrint);
        await this.writeKeyMetadata(verifierKey, verifierFingerPrint);
    }

    /**
     * Store a raw key in storage along with its fingerprint metadata for future verification.
     *
     * @param {Uint8Array} keyBytes The raw key bytes.
     * @param {KeyLocator} locator The unique locator for the key.
     * @returns {Promise<void>}
     * @throws {Error} If computing key metadata or writing to storage fails
     */
    async setKeyBytes(keyBytes: Uint8Array, locator: KeyLocator): Promise<void> {
        const fileKey = this.serializeLocator(locator);

        // Compute the key metadata including fingerprint
        const computedMetadata = await this.keyVerifier.computeKeyMetadata({
            keyBytes: keyBytes,
            locator: fileKey,
            fingerprint: this.checksumToFingerprint(locator.checksum, keyBytes),
        });

        // Write the key bytes and metadata atomically (key file under this.directory).
        await this.writeFileAtomic(path.join(this.directory, fileKey), keyBytes);
        await this.writeKeyMetadata(fileKey, computedMetadata);
    }

    /**
     * Returns stored metadata for a key, if any.
     *
     * @param {KeyLocator} locator The unique locator for the key.
     * @returns {Promise<KeyFingerprint | null>} The stored fingerprint metadata, or null if none exists.
     */
    async getKeyMetadata(locator: KeyLocator): Promise<KeyFingerprint | null> {
        const fileKey = this.serializeLocator(locator);
        return this.readKeyMetadata(fileKey);
    }

    /**
     * Checks if a key exists for the given locator.
     *
     * @param {KeyLocator} locator - The unique key locator.
     * @returns {Promise<boolean>} True if key exists, false otherwise.
     */
    async has(locator: KeyLocator): Promise<boolean> {
        const fileKey = this.serializeLocator(locator);
        const keyPath = path.join(this.directory, fileKey);
        return await fs
            .access(keyPath)
            .then(() => true)
            .catch(() => false);
    }

    /**
     * Deletes a key and its associated metadata from storage. Silently ignores errors if files don't exist.
     *
     * @param {KeyLocator} locator - The unique key locator.
     * @returns {Promise<void>}
     */
    async delete(locator: KeyLocator): Promise<void> {
        const fileKey = this.serializeLocator(locator);
        const p = path.join(this.directory, fileKey);
        const m = this.metadataPath(fileKey);

        await fs.unlink(p).catch(() => {});
        await fs.unlink(m).catch(() => {});
    }

    /**
     * Clears the key storage directory by recursively removing all files and subdirectories under it, then removes the keystore directory itself.
     *
     * @returns {Promise<void>}
     * @throws {Error} If directory listing fails for reasons other than non-existence.
     */
    async clear(): Promise<void> {
        await this.clearDirectory(this.directory);
    }
}
