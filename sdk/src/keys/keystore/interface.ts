import { FunctionKeyPair } from "../../models/keyPair.js";
import { ProvingKey, VerifyingKey } from "../../wasm.js";
import { KeyFingerprint } from "../verifier/interface.js";

/**
 * The key locator string and optional fingerprint to verify the integrity of the key.
 *
 * @property {string} locator - The unique identifier for the key.
 * @property {KeyFingerprint} fingerprint - The fingerprint of the key.
 */
export interface KeyLocator {
    locator: string;
    fingerprint?: KeyFingerprint;
}

export interface KeyStore {
    /**
     * Returns the raw bytes of a `ProvingKey` for a given locator.
     *
     * @param {KeyLocator} locator The unique locator for the desired `ProvingKey`.
     *
     * @returns {Promise<Uint8Array | null>} Returns the raw bytes of a `ProvingKey` for the given locator if it exists or null if it does not exist.
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
     * await setKeyBytes(keys.provingKey.toBytes(), { locator: 'transfer_private.prover' });
     */
    setKeyBytes(keyBytes: Uint8Array, locator: KeyLocator): Promise<void>;

    /**
     * Returns stored metadata for a keypair, if any.
     *
     * @param {string} locator The unique locator for the keypair.
     * @returns {Promise<{ prover: KeyFingerprint; verifier: KeyFingerprint } | null>} The stored metadata, or null if none or keypair does not exist.
     */
    getKeyMetadata(
        locator: string
    ): Promise< KeyFingerprint | null>;

    /**
     * Determines if a given key exists or not.
     *
     * @param {string} locator The unique locator for the desired keypair.
     */
    has(locator: string): Promise<boolean>;

    /**
     * Deletes a key corresponding to a given locator.
     *
     * @param {string} locator The unique locator for the desired keypair.
     */
    delete(locator: string): Promise<void>;

    /**
     * Clears all keys in the keystore.
     */
    clear(): Promise<void>;
}
