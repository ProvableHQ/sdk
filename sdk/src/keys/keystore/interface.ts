import { FunctionKeyPair } from "../../models/keyPair.js";
export type { InvalidLocatorReason } from "./error.js";
export { InvalidLocatorError } from "./error.js";
import { KeyFingerprint } from "../verifier/interface.js";
import { ProvingKey, VerifyingKey } from "../../wasm.js";

/**
 * A 4-value tuple that definitively identifies a function's proving/verifying key.
 *
 * Callers distinguish prover vs verifier keys by encoding the role in the
 * `func` component (e.g. `"transfer_private_prover"` / `"transfer_private_verifier"`).
 *
 * @example
 * const proverId: KeyId = ["credits.aleo", "transfer_private_prover", 0, "mainnet"];
 * const verifierId: KeyId = ["credits.aleo", "transfer_private_verifier", 0, "mainnet"];
 */
export type KeyId = readonly [
    program: string,
    func: string,
    edition: number,
    network: string,
];

/**
 * Creates a {@link KeyId} tuple with defaults for edition (0) and network (build-time).
 *
 * Validates that program and func components do not contain characters that
 * would produce an unsafe serialized key (path separators, traversal sequences,
 * or null bytes). Fails early with a clear message rather than deferring to
 * store-level validation.
 *
 * @param {string} program - The program name (e.g. "credits.aleo").
 * @param {string} func - The function name (e.g. "transfer_private").
 * @param {number} [edition=0] - The program edition.
 * @param {string} [network] - The network name. Defaults to the build-time network.
 * @returns {KeyId}
 * @throws {Error} If program or func contain unsafe characters.
 */
export function keyId(program: string, func: string, edition = 0, network = "%%NETWORK%%"): KeyId {
    validateKeyIdComponent(program, "program");
    validateKeyIdComponent(func, "func");
    return [program, func, edition, network] as const;
}

/**
 * Validates a single KeyId component (program or func) for unsafe characters.
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
 * @param {KeyId} id - The key identifier tuple.
 * @returns {string} A dot-delimited string safe for use as a filename.
 *
 * @example
 * serializeKeyId(["credits.aleo", "transfer_private", 0, "mainnet"])
 * // => "credits.aleo.transfer_private.e0.mainnet"
 */
export function serializeKeyId(id: KeyId): string {
    const [program, func, edition, network] = id;
    return `${program}.${func}.e${edition}.${network}`;
}

/**
 * A structured key locator with an optional fingerprint to verify key integrity.
 *
 * @property {KeyId} keyId - The 4-value tuple identifying the key.
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
     *     keyId: ["credits.aleo", "transfer_private_prover", 0, "mainnet"]
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
