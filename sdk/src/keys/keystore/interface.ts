import { FunctionKeyPair } from "../../models/keyPair.js";
export type { InvalidLocatorReason } from "./error.js";
export { InvalidLocatorError } from "./error.js";
import { KeyFingerprint } from "../verifier/interface.js";
import { ProvingKey, VerifyingKey } from "../../wasm.js";

/**
 * The key locator string and optional fingerprint to verify the integrity of the key.
 *
 * @property {string} locator - The unique identifier for the key.
 * @property {KeyFingerprint} [fingerprint] - Optional fingerprint for verification.
 */
export interface KeyLocator {
    locator: string;
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
     *
     * @returns {Promise<ProvingKey | null>} Returns the `ProvingKey` for the given locator if it exists or null if it does not.
     */
    getProvingKey(locator: KeyLocator): Promise<ProvingKey | null>;

    /**
     * Returns the `VerifyingKey` for a given locator.
     *
     * @param {KeyLocator} locator The unique locator for the desired `VerifyingKey`.
     *
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
    setKeys(
        proverLocator: KeyLocator,
        verifierLocator: KeyLocator,
        keys: FunctionKeyPair,
    ): Promise<void>;

    /**
     * Store a raw proving or verifying key in storage along with its fingerprint metadata for future verification.
     *
     * @param {Uint8Array} keyBytes The raw proving and verifying key bytes.
     * @param {KeyLocator} locator The unique locator for the desired key pair.
     * @returns {Promise<void>}
     *
     * @example
     * const keys = await generateKeys();
     * await setKeyBytes(keys.provingKey.toBytes(), { locator: 'transfer_private.prover' });
     */
    setKeyBytes(keyBytes: Uint8Array, locator: KeyLocator): Promise<void>;

    /**
     * Returns stored metadata for a key, if any.
     *
     * @param {string} locator The unique locator for the key.
     * @returns {Promise<KeyFingerprint | null>} The stored fingerprint for that locator, or null if none exists.
     */
    getKeyMetadata(locator: string): Promise<KeyFingerprint | null>;

    /**
     * Determines if a given key exists or not.
     *
     * @param {string} locator The unique locator for the desired key.
     * @returns {Promise<boolean>} True if the key exists, false otherwise.
     */
    has(locator: string): Promise<boolean>;

    /**
     * Deletes a key and its metadata corresponding to a given locator.
     *
     * @param {string} locator The unique locator for the desired key.
     * @returns {Promise<void>}
     */
    delete(locator: string): Promise<void>;

    /**
     * Clears all keys in the keystore.
     */
    clear(): Promise<void>;
}
