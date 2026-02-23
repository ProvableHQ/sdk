import { CachedKeyPair, FunctionKeyPair } from "../../models/keyPair.js";
import { ProvingKey, VerifyingKey } from "../../wasm.js";
import type { KeyMetadata } from "./metadata.js";

export type {
    KeyPairMetadataVerifier,
    KeyMetadata,
} from "./metadata.js";
export { ChecksumMismatchError, KeyVerifier } from "./metadata.js";

export interface KeyStore {
    /**
     * Returns the proving and verifying keys for a given key locator from key storage.
     *
     * @param {string} locator The unique locator for the desired keypair.
     *
     * @returns {Promise<FunctionKeyPair | null>} Returns the proving and verifying keys for the given locator if they exist or null if they do not.
     */
    getKeys(locator: string): Promise<FunctionKeyPair | null>;

    /**
     * Returns the proving and verifying key as raw bytes for a given key locator from key storage.
     * When metadata exists for the locator, bytes are verified against stored checksums before return;
     * throws {@link ChecksumMismatchError} on mismatch.
     *
     * @param {string} locator The unique locator for the desired keypair.
     * @returns {Promise<CachedKeyPair | null>} The keypair bytes, or null if not present.
     */
    getKeyBytes(locator: string): Promise<CachedKeyPair | null>;

    /**
     * Returns the `ProvingKey` for a given locator.
     *
     * @param {string} locator The unique locator for the desired `ProvingKey`.
     *
     * @returns {Promise<ProvingKey | null>} Returns the `ProvingKey` for the given locator if it exists or null if it does not.
     */
    getProvingKey(locator: string): Promise<ProvingKey | null>;

    /**
     * Returns the raw bytes of a `ProvingKey` for a given locator.
     *
     * @param {string} locator The unique locator for the desired `ProvingKey`.
     *
     * @returns {Promise<Uint8Array | null>} Returns the raw bytes of a `ProvingKey` for the given locator if it exists or null if it does not exist.
     */
    getProvingKeyBytes(locator: string): Promise<Uint8Array | null>;

    /**
     * Returns the `VerifyingKey` for a given locator.
     *
     * @param {string} locator The unique locator for the desired `VerifyingKey`.
     *
     * @returns {Promise<VerifyingKey | null>} Returns the `VerifyingKey` for the given locator if it exists or null if it does not exist.
     */
    getVerifyingKey(locator: string): Promise<VerifyingKey | null>;

    /**
     * Returns the raw bytes of a `VerifyingKey` for a given locator.
     *
     * @param {string} locator The unique locator for the desired `VerifyingKey`.
     *
     * @returns {Promise<Uint8Array | null>} Returns the raw bytes of a `VerifyingKey` for the given locator if it exists or null if it does not exist.
     */
    getVerifyingKeyBytes(locator: string): Promise<Uint8Array | null>;

    /**
     * Stores proving and verifying keys in key storage.
     *
     * @param {string} locator The unique locator for the desired keypair.
     * @param {FunctionKeyPair} keys The proving and verifying keys.
     */
    setKeys(locator: string, keys: FunctionKeyPair): Promise<void>;

    /**
     * Stores the raw proving and verifying key bytes in key storage.
     * Metadata (checksums and sizes) is computed from the bytes if not provided, then stored
     * so that future {@link getKeyBytes} calls can verify integrity.
     *
     * @param {string} locator The unique locator for the desired keypair.
     * @param {CachedKeyPair} keys The raw proving and verifying key bytes.
     * @param {Object} [options] Optional metadata; if omitted, metadata is computed from {@link keys}.
     * @param {Object} [options.metadata] Precomputed metadata (e.g. from snarkVM). If provided, used as-is; otherwise computed.
     * @param {KeyMetadata} options.metadata.prover Prover key metadata.
     * @param {KeyMetadata} options.metadata.verifier Verifier key metadata.
     */
    setKeyBytes(
        locator: string,
        keys: CachedKeyPair,
        options?: { metadata?: { prover: KeyMetadata; verifier: KeyMetadata } }
    ): Promise<void>;

    /**
     * Returns stored metadata for a keypair, if any.
     *
     * @param {string} locator The unique locator for the keypair.
     * @returns {Promise<{ prover: KeyMetadata; verifier: KeyMetadata } | null>} The stored metadata, or null if none or keypair does not exist.
     */
    getKeyMetadata(
        locator: string
    ): Promise<{ prover: KeyMetadata; verifier: KeyMetadata } | null>;

    /**
     * Determines if a given keypair exists or not.
     *
     * @param {string} locator The unique locator for the desired keypair.
     */
    has(locator: string): Promise<boolean>;

    /**
     * Deletes a keypair corresponding to a given locator.
     *
     * @param {string} locator The unique locator for the desired keypair.
     */
    delete(locator: string): Promise<void>;

    /**
     * Clears all keys in the keystore.
     */
    clear(): Promise<void>;
}
