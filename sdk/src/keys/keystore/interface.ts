import { FunctionKeyPair } from "../../models/keyPair.js";
export type { InvalidLocatorReason } from "./error.js";
export { InvalidLocatorError } from "./error.js";
import { KeyFingerprint } from "../verifier/interface.js";
import { ProvingKey, VerifyingKey } from "../../wasm.js";

/**
 * Discriminates the type of key a locator refers to.
 */
export type KeyType = "prover" | "verifier" | "translation";

/**
 * Shared fields for all function key locators.
 *
 * @property {string} program - The program name (e.g. "credits.aleo").
 * @property {string} functionName - The function name (e.g. "transfer_private").
 * @property {number} edition - The program edition (u16). Incremented when a program is re-deployed.
 * @property {number} amendment - The program amendment. Reserved for future protocol-level amendments; defaults to 0.
 * @property {string} network - The network name (e.g. "mainnet", "testnet").
 * @property {string} [checksum] - Optional SHA-256 checksum for key verification. Used for integrity verification only; not part of the key identity or serialized form.
 */
export interface BaseFunctionKeyLocator {
    program: string;
    functionName: string;
    edition: number;
    amendment: number;
    network: string;
    checksum?: string;
}

/**
 * Locator for a proving key.
 */
export interface ProvingKeyLocator extends BaseFunctionKeyLocator {
    keyType: "prover";
}

/**
 * Locator for a verifying key.
 */
export interface VerifyingKeyLocator extends BaseFunctionKeyLocator {
    keyType: "verifier";
}

/**
 * Locator for a translation key, which requires additional record information.
 *
 * @property {string} recordName - The name of the record associated with the translation key.
 * @property {number} recordInputPosition - The position of the record input in the function signature.
 */
export interface TranslationKeyLocator extends BaseFunctionKeyLocator {
    keyType: "translation";
    recordName: string;
    recordInputPosition: number;
}

/**
 * A locator that uniquely identifies a function's proving, verifying, or translation key.
 * Discriminated on the {@link KeyType} field.
 *
 * @example
 * const prover: KeyLocator = { program: "credits.aleo", functionName: "transfer_private", edition: 1, amendment: 0, network: "mainnet", keyType: "prover" };
 * const verifier: KeyLocator = { program: "credits.aleo", functionName: "transfer_private", edition: 1, amendment: 0, network: "mainnet", keyType: "verifier" };
 */
export type KeyLocator = ProvingKeyLocator | VerifyingKeyLocator | TranslationKeyLocator;

/**
 * Creates a {@link ProvingKeyLocator}.
 *
 * @param {string} program - The program name (e.g. "credits.aleo").
 * @param {string} functionName - The function name (e.g. "transfer_private").
 * @param {number} [edition=1] - The program edition.
 * @param {number} [amendment=0] - The program amendment.
 * @param {string} [network] - The network name. Defaults to the build-time network.
 * @param {string} [checksum] - Optional SHA-256 checksum for key verification.
 * @returns {ProvingKeyLocator}
 */
export function provingKeyLocator(
    program: string,
    functionName: string,
    edition = 1,
    amendment = 0,
    network = "%%NETWORK%%",
    checksum?: string,
): ProvingKeyLocator {
    return { program, functionName, edition, amendment, network, keyType: "prover", ...(checksum !== undefined && { checksum }) };
}

/**
 * Creates a {@link VerifyingKeyLocator}.
 *
 * @param {string} program - The program name (e.g. "credits.aleo").
 * @param {string} functionName - The function name (e.g. "transfer_private").
 * @param {number} [edition=1] - The program edition.
 * @param {number} [amendment=0] - The program amendment.
 * @param {string} [network] - The network name. Defaults to the build-time network.
 * @param {string} [checksum] - Optional SHA-256 checksum for key verification.
 * @returns {VerifyingKeyLocator}
 */
export function verifyingKeyLocator(
    program: string,
    functionName: string,
    edition = 1,
    amendment = 0,
    network = "%%NETWORK%%",
    checksum?: string,
): VerifyingKeyLocator {
    return { program, functionName, edition, amendment, network, keyType: "verifier", ...(checksum !== undefined && { checksum }) };
}

/**
 * Creates a {@link TranslationKeyLocator}.
 *
 * @param {string} program - The program name (e.g. "credits.aleo").
 * @param {string} functionName - The function name (e.g. "transfer_private").
 * @param {string} recordName - The record name associated with the translation key.
 * @param {number} recordInputPosition - The record input position in the function signature.
 * @param {number} [edition=1] - The program edition.
 * @param {number} [amendment=0] - The program amendment.
 * @param {string} [network] - The network name. Defaults to the build-time network.
 * @param {string} [checksum] - Optional SHA-256 checksum for key verification.
 * @returns {TranslationKeyLocator}
 */
export function translationKeyLocator(
    program: string,
    functionName: string,
    recordName: string,
    recordInputPosition: number,
    edition = 1,
    amendment = 0,
    network = "%%NETWORK%%",
    checksum?: string,
): TranslationKeyLocator {
    return { program, functionName, edition, amendment, network, keyType: "translation", recordName, recordInputPosition, ...(checksum !== undefined && { checksum }) };
}

export interface KeyStore {
    /**
     * Returns the raw bytes of a key for a given locator.
     *
     * @param {KeyLocator} locator The unique locator for the desired key.
     * @returns {Promise<Uint8Array | null>} The raw key bytes if they exist, or null if not found.
     */
    getKeyBytes(locator: KeyLocator): Promise<Uint8Array | null>;

    /**
     * Returns the `ProvingKey` for a given locator.
     *
     * @param {ProvingKeyLocator} locator The unique locator for the desired `ProvingKey`.
     * @returns {Promise<ProvingKey | null>} Returns the `ProvingKey` for the given locator if it exists or null if it does not.
     */
    getProvingKey(locator: ProvingKeyLocator): Promise<ProvingKey | null>;

    /**
     * Returns the `VerifyingKey` for a given locator.
     *
     * @param {VerifyingKeyLocator} locator The unique locator for the desired `VerifyingKey`.
     * @returns {Promise<VerifyingKey | null>} Returns the `VerifyingKey` for the given locator if it exists or null if it does not exist.
     */
    getVerifyingKey(locator: VerifyingKeyLocator): Promise<VerifyingKey | null>;

    /**
     * Stores proving and verifying keys in key storage.
     *
     * @param {ProvingKeyLocator} proverLocator The locator for the proving key.
     * @param {VerifyingKeyLocator} verifierLocator The locator for the verifying key.
     * @param {FunctionKeyPair} keys The proving and verifying keys.
     */
    setKeys(proverLocator: ProvingKeyLocator, verifierLocator: VerifyingKeyLocator, keys: FunctionKeyPair): Promise<void>;

    /**
     * Store a raw key in storage along with its fingerprint metadata for future verification.
     *
     * @param {Uint8Array} keyBytes The raw key bytes.
     * @param {KeyLocator} locator The unique locator for the desired key.
     * @returns {Promise<void>}
     */
    setKeyBytes(keyBytes: Uint8Array, locator: KeyLocator): Promise<void>;

    /**
     * Returns stored metadata for a key, if any.
     *
     * @param {KeyLocator} locator The unique locator for the key.
     * @returns {Promise<KeyFingerprint | null>} The stored fingerprint for that key, or null if none exists.
     */
    getKeyMetadata(locator: KeyLocator): Promise<KeyFingerprint | null>;

    /**
     * Determines if a given key exists or not.
     *
     * @param {KeyLocator} locator The unique locator for the key.
     * @returns {Promise<boolean>} True if the key exists, false otherwise.
     */
    has(locator: KeyLocator): Promise<boolean>;

    /**
     * Deletes a key and its metadata corresponding to a given locator.
     *
     * @param {KeyLocator} locator The unique locator for the key.
     * @returns {Promise<void>}
     */
    delete(locator: KeyLocator): Promise<void>;

    /**
     * Clears all keys in the keystore.
     */
    clear(): Promise<void>;
}
