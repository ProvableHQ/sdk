import { CachedKeyPair, FunctionKeyPair } from "../../models/keyPair.js";
import { ProvingKey, VerifyingKey } from "../../wasm.js";

export interface KeyStore {
    /**
     * Returns the proving and verifying keys for a given key locator from key storage.
     *
     * @param {string} locator The unique locator for the desired keypair.
     *
     * @returns {Promise<FunctionKeyPair | null>} Returns the proving and verifying keys for the given locator if they exist or null if they do not.
     */
    getKeys(locator:string): Promise<FunctionKeyPair | null>

    /**
     * Returns the proving and verifying key as raw bytes for a given key locator from key storage.
     *
     * @param {string} locator The unique locator for the desired keypair.
     *
     * @returns {Promise<CachedKeyPair | null>} Returns the proving and verifying keys for the given locator as raw bytes if they exist or null if they do not.     */
    getKeysRaw(locator:string): Promise<CachedKeyPair | null>

    /**
     * Returns the `ProvingKey` for a given locator.
     *
     * @param {string} locator The unique locator for the desired `ProvingKey`.
     *
     * @returns {Promise<ProvingKey | null>} Returns the `ProvingKey` for the given locator if it exists or null if it does not.
     */
    getProvingKey(locator:string): Promise<ProvingKey | null>

    /**
     * Returns the raw bytes of a `ProvingKey` for a given locator.
     *
     * @param {string} locator The unique locator for the desired `ProvingKey`.
     *
     * @returns {Promise<Uint8Array | null>} Returns the raw bytes of a `ProvingKey` for the given locator if it exists or null if it does not exist.
     */
    getProvingKeyRaw(locator:string): Promise<Uint8Array | null>

    /**
     * Returns the `VerifyingKey` for a given locator.
     *
     * @param {string} locator The unique locator for the desired `VerifyingKey`.
     *
     * @returns {Promise<VerifyingKey | null>} Returns the `VerifyingKey` for the given locator if it exists or null if it does not exist.
     */
    getVerifyingKey(locator:string): Promise<VerifyingKey | null>

    /**
     * Returns the raw bytes of a `VerifyingKey` for a given locator.
     *
     * @param {string} locator The unique locator for the desired `VerifyingKey`.
     *
     * @returns {Promise<Uint8Array | null>} Returns the raw bytes of a `VerifyingKey` for the given locator if it exists or null if it does not exist.
     */
    getVerifyingKeyRaw(locator:string): Promise<Uint8Array | null>

    /**
     * Stores proving and verifying keys in key storage.
     *
     * @param {string} locator The unique locator for the desired keypair.
     * @param {FunctionKeyPair} keys The proving and verifying keys.
     */
    setKeys(locator:string, keys: FunctionKeyPair): Promise<void>

    /**
     * Stores the raw proving and verifying key bytes in key storage.
     *
     * @param {string} locator The unique locator for the desired keypair.
     * @param {CachedKeyPair} keys The raw proving and verifying key bytes.
     */
    setKeysRaw(locator:string, keys: CachedKeyPair): Promise<void>

    /**
     * Determines if a given keypair exists or not.
     *
     * @param {string} locator The unique locator for the desired keypair.
     */
    has(locator:string): Promise<boolean>

    /**
     * Deletes a keypair corresponding to a given locator.
     *
     * @param {string} locator The unique locator for the desired keypair.
     */
    delete(locator:string): Promise<void>

    /**
     * Clears all keys in the keystore.
     */
    clear(): Promise<void>
}