import { FunctionKeyPair } from "../../models/keyPair.js";
export type { InvalidLocatorReason } from "./error.js";
export { InvalidLocatorError } from "./error.js";
import { KeyFingerprint } from "../verifier/interface.js";
import { ProvingKey, VerifyingKey } from "../../wasm.js";

/**
 * Discriminates whether a {@link KeyId} refers to a proving key or a verifying key.
 */
export type KeyType = "prover" | "verifier";

/**
 * A structured identifier that definitively identifies a function's proving or verifying key.
 *
 * @example
 * const proverId: KeyId = { program: "credits.aleo", functionName: "transfer_private", edition: 1, network: "mainnet", keyType: "prover" };
 * const verifierId: KeyId = { program: "credits.aleo", functionName: "transfer_private", edition: 1, network: "mainnet", keyType: "verifier" };
 */
export interface KeyId {
    program: string;
    functionName: string;
    edition: number;
    network: string;
    keyType: KeyType;
}

/**
 * Creates a {@link KeyId} with defaults for edition (1) and network (build-time).
 *
 * Validates that program and functionName components do not contain characters
 * that would produce an unsafe serialized key (path separators, traversal
 * sequences, or null bytes). Fails early with a clear message rather than
 * deferring to store-level validation.
 *
 * @param {string} program - The program name (e.g. "credits.aleo").
 * @param {string} functionName - The function name (e.g. "transfer_private").
 * @param {KeyType} keyType - Whether this identifies a "prover" or "verifier" key.
 * @param {number} [edition=1] - The program edition.
 * @param {string} [network] - The network name. Defaults to the build-time network.
 * @returns {KeyId}
 * @throws {Error} If program or functionName contain unsafe characters.
 */
export function keyId(program: string, functionName: string, keyType: KeyType, edition = 1, network = "%%NETWORK%%"): KeyId {
    validateKeyIdComponent(program, "program");
    validateKeyIdComponent(functionName, "functionName");
    return { program, functionName, edition, network, keyType };
}

/**
 * Validates a single KeyId component (program or functionName) for unsafe characters.
 * @internal
 */
function validateKeyIdComponent(value: string, label: string): void {
    if (value === "") {
        throw new Error(`KeyId ${label} must not be empty`);
    }
    if (value.includes("..")) {
        throw new Error(`KeyId ${label} must not contain ".." (got "${value}")`);
    }
    if (value.includes("/") || value.includes("\\") || value.includes("\0")) {
        throw new Error(`KeyId ${label} must not contain path separators or null bytes (got "${value}")`);
    }
}

/**
 * Serializes a {@link KeyId} to a filesystem-safe flat string.
 *
 * @param {KeyId} id - The key identifier.
 * @returns {string} A dot-delimited string safe for use as a filename.
 *
 * @example
 * serializeKeyId({ program: "credits.aleo", functionName: "transfer_private", edition: 1, network: "mainnet", keyType: "prover" })
 * // => "credits.aleo.transfer_private.e1.mainnet.prover"
 */
export function serializeKeyId(id: KeyId): string {
    return `${id.program}.${id.functionName}.e${id.edition}.${id.network}.${id.keyType}`;
}

/**
 * A structured key locator with an optional fingerprint to verify key integrity.
 *
 * @property {KeyId} keyId - The structured identifier for the key.
 * @property {KeyFingerprint} [fingerprint] - Optional fingerprint for verification.
 */
export interface KeyLocator {
    keyId: KeyId;
    fingerprint?: KeyFingerprint;
}

export interface KeyStore {
    /**
     * Returns the raw bytes of a proving or verifying key for a given locator.
     *
     * @param {KeyLocator} locator The unique locator for the desired key.
     * @returns {Promise<Uint8Array | null>} The raw key bytes if they exist, or null if not found.
     */
    getKeyBytes(locator: KeyLocator): Promise<Uint8Array | null>;

    /**
     * Returns the `ProvingKey` for a given locator.
     *
     * @param {KeyLocator} locator The unique locator for the desired `ProvingKey`.
     * @returns {Promise<ProvingKey | null>} Returns the `ProvingKey` for the given locator if it exists or null if it does not.
     */
    getProvingKey(locator: KeyLocator): Promise<ProvingKey | null>;

    /**
     * Returns the `VerifyingKey` for a given locator.
     *
     * @param {KeyLocator} locator The unique locator for the desired `VerifyingKey`.
     * @returns {Promise<VerifyingKey | null>} Returns the `VerifyingKey` for the given locator if it exists or null if it does not exist.
     */
    getVerifyingKey(locator: KeyLocator): Promise<VerifyingKey | null>;

    /**
     * Stores proving and verifying keys in key storage.
     *
     * @param {KeyLocator} proverLocator The unique locator for the desired proving key.
     * @param {KeyLocator} verifierLocator The unique locator for the desired verifying key.
     * @param {FunctionKeyPair} keys The proving and verifying keys.
     */
    setKeys(proverLocator: KeyLocator, verifierLocator: KeyLocator, keys: FunctionKeyPair): Promise<void>;

    /**
     * Store a raw proving or verifying key in storage along with its fingerprint metadata for future verification.
     *
     * @param {Uint8Array} keyBytes The raw proving and verifying key bytes.
     * @param {KeyLocator} locator The unique locator for the desired key pair.
     * @returns {Promise<void>}
     *
     * @example
     * const keys = await generateKeys();
     * await setKeyBytes(keys.provingKey.toBytes(), {
     *     keyId: { program: "credits.aleo", functionName: "transfer_private", edition: 1, network: "mainnet", keyType: "prover" }
     * });
     */
    setKeyBytes(keyBytes: Uint8Array, locator: KeyLocator): Promise<void>;

    /**
     * Returns stored metadata for a key, if any.
     *
     * @param {KeyId} keyId The unique key identifier.
     * @returns {Promise<KeyFingerprint | null>} The stored fingerprint for that key, or null if none exists.
     */
    getKeyMetadata(keyId: KeyId): Promise<KeyFingerprint | null>;

    /**
     * Determines if a given key exists or not.
     *
     * @param {KeyId} keyId The unique key identifier.
     * @returns {Promise<boolean>} True if the key exists, false otherwise.
     */
    has(keyId: KeyId): Promise<boolean>;

    /**
     * Deletes a key and its metadata corresponding to a given key identifier.
     *
     * @param {KeyId} keyId The unique key identifier.
     * @returns {Promise<void>}
     */
    delete(keyId: KeyId): Promise<void>;

    /**
     * Clears all keys in the keystore.
     */
    clear(): Promise<void>;
}
