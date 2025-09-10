import {
    CachedKeyPair,
    FunctionKeyPair,
    FunctionKeyProvider, KeyBytes,
    KeySearchParams
} from "./interfaces/function-key-provider";

import {
    CREDITS_PROGRAM_KEYS,
    KEY_STORE,
    Key,
    PRIVATE_TRANSFER,
    PRIVATE_TO_PUBLIC_TRANSFER,
    PUBLIC_TRANSFER,
    PUBLIC_TO_PRIVATE_TRANSFER,
    PUBLIC_TRANSFER_AS_SIGNER,
} from "../constants";
import fs from "node:fs/promises";
import { get } from "../utils";
import { ProvingKey, VerifyingKey } from "../wasm";


type KeyBytes = {
    provingKeyBytes: Uint8Array;
    verifyingKeyBytes: Uint8Array;
};

class NodeKeyStorage {
    path: string;
    
    constructor(path: string) {
        this.path = path;
    }

    /**
     * Saves the key bytes to the local disk.
     * @param {string} keyID The keyId to use for the file names.
     * @param {KeyBytes} keyPairBytes The bytes containing the proving and verifying keys.
     *
     * @returns {Promise<void>} A promise that resolves when the keys have been saved.
     */
    async saveKeyBytes(keyPairBytes: KeyBytes): Promise<void> {
        await NodeKeyStorage.saveKeyBytesToDisk(this.path, keyPairBytes.provingKeyBytes.toString(), keyPairBytes);
    }

    /**
     * Load keys from disk from the configured local directory.
     * @param {string} keyID The keyId to use for the file names.
     *
     * @returns {Promise<Uint8Array>}
     */
    async loadKeyBytes(keyID: string): Promise<KeyBytes> {
        const provingKey = await fs.readFile(`${this.path}/${keyID}.prover`);
        const verifyingKey = await fs.readFile(`${this.path}/${keyID}.verifier`);
        return {
            provingKeyBytes: new Uint8Array(provingKey),
            verifyingKeyBytes: new Uint8Array(verifyingKey)
        };
    }

    /**
     * Deletes keys from disk from the configured local directory.
     * @param {string} keyID The keyId to use for the file names.
     *
     * @returns {Promise<Uint8Array>}
     */
    async deleteKey(keyID: string): Promise<void> {
        // Remove both files, ignore if they don’t exist
        await fs.rm(`${this.path}/${keyID}.prover`, { force: true });
        await fs.rm(`${this.path}/${keyID}.verifier`, { force: true });
    }

    /**
     * Determine if a key exists on disk in the configured local directory.
     *
     * @param {string} keyID The keyId to use for the file names.
     *
     * @returns {Promise<Uint8Array>}
     */
    async keyExists(keyID: string): Promise<boolean> {
        try {
            await fs.access(`${this.path}/${keyID}.prover`);
            await fs.access(`${this.path}/${keyID}.verifier`);
            return true;
        } catch {
            return false;
        }
    }
    
    /**
     * Saves the key bytes to the local disk.
     * @param {string} path The path to save the keys to.
     * @param {string} keyID The keyId to use for the file names.
     * @param {KeyBytes} keyPairBytes The bytes containing the proving and verifying keys.
     *
     * @returns {Promise<void>} A promise that resolves when the keys have been saved.
     */
    static async saveKeyBytesToDisk(path: string, keyID: string, keyPairBytes: KeyBytes): Promise<void> {
        await fs.mkdir(path, { recursive: true });
        await fs.writeFile(`${path}/${keyID}.prover`, keyPairBytes.provingKeyBytes);
        await fs.writeFile(`${path}/${keyID}.verifier`, keyPairBytes.verifyingKeyBytes);
    }

    /**
     * Load keys from disk.
     * @param {string} path The file path for the proving or verifying key.
     * @param {string} keyID The keyId to use for the file names.
     *
     * @returns {Promise<Uint8Array>}
     */
    static async loadKeyBytesFromDisk(path: string, keyID: string): Promise<KeyBytes> {
        const provingKey = await fs.readFile(`${path}/${keyID}.prover`);
        const verifyingKey = await fs.readFile(`${path}/${keyID}.verifier`);
        return {
            provingKeyBytes: new Uint8Array(provingKey),
            verifyingKeyBytes: new Uint8Array(verifyingKey)
        };
    }
}

/**
 * NodeKeyProviderParams search parameter for the AleoKeyProvider. It allows for the specification of a proverUri and
 * verifierUri to fetch keys via HTTP from a remote resource as well as a unique cacheKey to store the keys in memory.
 */
class NodeKeyProviderParams implements KeySearchParams {
    name: string | undefined;
    proverUri: string | undefined;
    verifierUri: string | undefined;
    keyDirectory: string | undefined;
    cacheKey: string | undefined;

    /**
     * Create a new NodeKeyProviderParams object which implements the KeySearchParams interface. Users can optionally
     * specify a url for the proverUri & verifierUri to fetch keys via HTTP from a remote resource as well as a unique
     * cacheKey to store the keys in memory for future use. If no proverUri or verifierUri is specified, a cachekey must
     * be provided.
     *
     * @param { AleoKeyProviderInitParams } params - Optional search parameters
     */
    constructor(params: {keyDirectory?: string, proverUri?: string, verifierUri?: string, cacheKey?: string, name?: string}) {
        this.keyDirectory = params.keyDirectory;
        this.proverUri = params.proverUri;
        this.verifierUri = params.verifierUri;
        this.cacheKey = params.cacheKey;
        this.name = params.name;
    }
}

/**
 * AleoKeyProvider class. Implements the KeyProvider interface. Enables the retrieval of Aleo program proving and
 * verifying keys for the credits.aleo program over http from official Aleo sources and storing and retrieving function
 * keys from a local memory cache.
 */
class AleoKeyProvider implements FunctionKeyProvider {
    storageHelper: NodeKeyStorage | undefined;
    cache: Map<string, CachedKeyPair>;
    cacheOption: boolean;
    keyUris: string;

    async fetchBytes(
        url = "/",
    ): Promise<Uint8Array> {
        try {
            const response = await get(url);
            const data = await response.arrayBuffer();
            return new Uint8Array(data);
        } catch (error: any) {
            throw new Error("Error fetching data." + error.message);
        }
    }

    constructor(path: string | undefined) {
        this.keyUris = KEY_STORE;
        this.cache = new Map<string, CachedKeyPair>();
        this.cacheOption = false;
        if (path) {
            this.storageHelper = new NodeKeyStorage(path);
        }
    }

    /**
     * Use local memory to store keys
     *
     * @param {boolean} useCache whether to store keys in local memory
     */
    useCache(useCache: boolean) {
        this.cacheOption = useCache;
    }

    /**
     * Clear the key cache
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Cache a set of keys. This will overwrite any existing keys with the same keyId. The user can check if a keyId
     * exists in the cache using the containsKeys method prior to calling this method if overwriting is not desired.
     *
     * @param {string} keyId access key for the cache
     * @param {FunctionKeyPair} keys keys to cache
     */
    cacheKeys(keyId: string, keys: FunctionKeyPair) {
        const [provingKey, verifyingKey] = keys;
        const provingKeyByteArray = provingKey.toBytes();
        const verifyingKeyByteArray = verifyingKey.toBytes();
        this.cache.set(keyId, [provingKeyByteArray, verifyingKeyByteArray]);
        if (this.storageHelper) {
            this.storageHelper.saveKeyBytes({
                provingKeyBytes: provingKeyByteArray,
                verifyingKeyBytes: verifyingKeyByteArray,
            })
        }
    }

    /**
     * Determine if a keyId exists in the cache
     *
     * @param {string} keyId keyId of a proving and verifying key pair
     * @returns {boolean} true if the keyId exists in the cache, false otherwise
     */
    keysExistInCache(keyId: string): boolean {
        return this.cache.has(keyId)
    }

    /**
     * Determine if a keyId exists on disk
     *
     * @param {string} keyId keyId of a proving and verifying key pair
     * @returns {boolean} true if the keyId exists in the cache, false otherwise
     */
    async keysExistOnDisk(keyId: string): Promise<boolean> {
        if (this.storageHelper) {
            return await this.storageHelper.keyExists(keyId);
        }
        return false;
    }

    /**
     * Delete a set of keys from the cache
     *
     * @param {string} keyId keyId of a proving and verifying key pair to delete from memory
     * @returns {boolean} true if the keyId exists in the cache and was deleted, false if the key did not exist
     */
    deleteCachedKeys(keyId: string): boolean {
        return this.cache.delete(keyId)
    }

    /**
     * Delete a set of keys from the cache
     *
     * @param {string} keyId keyId of a proving and verifying key pair to delete from memory
     * @returns {boolean} true if the keyId exists in the cache and was deleted, false if the key did not exist
     */
    deleteStoredKeys(keyId: string): boolean {
        if (this.storageHelper && await this.storageHelper.keyExists(keyId)) {
            await this.storageHelper.deleteKey(keyId);
        }
        return false;
    }

    /**
     * Get a set of keys from the cache
     * @param {string} keyId keyId of a proving and verifying key pair.
     * @param {string | undefined} path path to the key directory.
     *
     * @returns {FunctionKeyPair} Proving and verifying keys for the specified program.
     */
    async getKeys(keyId: string, path?: string): Promise<FunctionKeyPair> {
        console.debug(`Checking if key exists in cache. KeyId: ${keyId}`)
        if (this.cache.has(keyId)) {
            const [provingKeyBytes, verifyingKeyBytes] = <CachedKeyPair>this.cache.get(keyId);
            return [ProvingKey.fromBytes(provingKeyBytes), VerifyingKey.fromBytes(verifyingKeyBytes)];
        } else if (this.storageHelper || path) {
            let keyBytes;
            if (path) {
                keyBytes = await NodeKeyStorage.loadKeyBytesFromDisk(path, keyId)
            } else if (this.storageHelper) {
                keyBytes = await this.storageHelper.loadKeyBytes(keyId);
            }
            if (keyBytes) {
                if (this.cacheOption) {
                    this.cache.set(keyId, [keyBytes.provingKeyBytes, keyBytes.verifyingKeyBytes]);
                }
                return [ProvingKey.fromBytes(keyBytes.provingKeyBytes), VerifyingKey.fromBytes(keyBytes.verifyingKeyBytes)];
            } else {
                throw new Error("Key not found in cache.");
            }
        } else {
            throw new Error("Key not found in cache.");
        }
    }

    /**
     * Get arbitrary function keys from a provider
     *
     * @param {KeySearchParams} params parameters for the key search in form of: {proverUri: string, verifierUri: string, cacheKey: string}
     * @returns {Promise<FunctionKeyPair>} Proving and verifying keys for the specified program
     *
     * @example
     * // Create a new object which implements the KeyProvider interface
     * const networkClient = new AleoNetworkClient("https://api.explorer.provable.com/v1");
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for value transfers
     * const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);
     * programManager.transfer(1, "aleo166q6ww6688cug7qxwe7nhctjpymydwzy2h7rscfmatqmfwnjvggqcad0at", "public", 0.5);
     *
     * // Keys can also be fetched manually using the key provider
     * const keySearchParams = { "cacheKey": "myProgram:myFunction" };
     * const [transferPrivateProvingKey, transferPrivateVerifyingKey] = await keyProvider.functionKeys(keySearchParams);
     */
    async functionKeys(params?: KeySearchParams): Promise<FunctionKeyPair> {
        if (params) {
            let proverUrl;
            let verifierUrl;
            let cacheKey;
            let path;
            if ("name" in params && typeof params["name"] == "string") {
                const key = CREDITS_PROGRAM_KEYS.getKey(params["name"]);
                return this.fetchCreditsKeys(key);
            }

            if ("proverUri" in params && typeof params["proverUri"] == "string") {
                proverUrl = params["proverUri"];
            }

            if ("verifierUri" in params && typeof params["verifierUri"] == "string") {
                verifierUrl = params["verifierUri"];
            }

            if ("cacheKey" in params && typeof params["cacheKey"] == "string") {
                cacheKey = params["cacheKey"];
            }

            if ("keyDirectory" in params && typeof params["keyDirectory"] == "string") {
                path = params["keyDirectory"];
            }

            if (cacheKey) {
                try {
                    return await this.getKeys(cacheKey, path);
                } catch (error: any) {
                    console.debug(`Error: ${error.message} fetching fee proving and verifying keys from cache. KeyId: ${cacheKey}`);
                }
            }

            if (proverUrl && verifierUrl) {
                try {
                    return await this.fetchRemoteKeys(proverUrl, verifierUrl, cacheKey);
                } catch (error: any) {
                    console.debug(`Error: ${error.message} fetching fee proving and verifying keys from ${proverUrl} and ${verifierUrl}`);
                }
            }

            throw new Error("Invalid parameters provided, must provide a valid cacheKey and/or a proverUrl and a verifierUrl");
        }
        throw new Error("Invalid parameters provided, must provide either a cacheKey and/or a proverUrl and a verifierUrl");
    }

    /**
     * Returns the proving and verifying keys for a specified program from a specified url.
     *
     * @param {string} verifierUrl Url of the proving key
     * @param {string} proverUrl Url the verifying key
     * @param {string} cacheKey Key to store the keys in the cache
     *
     * @returns {Promise<FunctionKeyPair>} Proving and verifying keys for the specified program
     *
     * @example
     * // Create a new AleoKeyProvider object
     * const networkClient = new AleoNetworkClient("https://api.explorer.provable.com/v1");
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for value transfers
     * const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);
     * programManager.transfer(1, "aleo166q6ww6688cug7qxwe7nhctjpymydwzy2h7rscfmatqmfwnjvggqcad0at", "public", 0.5);
     *
     * // Keys can also be fetched manually
     * const [transferPrivateProvingKey, transferPrivateVerifyingKey] = await keyProvider.fetchKeys(
     *     CREDITS_PROGRAM_KEYS.transfer_private.prover,
     *     CREDITS_PROGRAM_KEYS.transfer_private.verifier,
     * );
     */
    async fetchRemoteKeys(proverUrl: string, verifierUrl: string, cacheKey?: string): Promise<FunctionKeyPair> {
        try {
            // If cache is enabled, check if the keys have already been fetched and return them if they have
            if (this.cacheOption) {
                if (!cacheKey) {
                    cacheKey = proverUrl;
                }
                const value = this.cache.get(cacheKey);
                if (typeof value !== "undefined") {
                    return [ProvingKey.fromBytes(value[0]), VerifyingKey.fromBytes(value[1])];
                } else {
                    console.debug("Fetching proving keys from url " + proverUrl);
                    const provingKey = <ProvingKey>ProvingKey.fromBytes(await this.fetchBytes(proverUrl))
                    console.debug("Fetching verifying keys " + verifierUrl);
                    const verifyingKey = <VerifyingKey>(await this.getVerifyingKey(verifierUrl));
                    this.cache.set(cacheKey, [provingKey.toBytes(), verifyingKey.toBytes()]);
                    if (this.storageHelper) {
                        try {
                            this.storageHelper.saveKeyBytes({
                                provingKeyBytes: provingKey.toBytes(),
                                verifyingKeyBytes: verifyingKey.toBytes()
                            })
                        } catch (error: any) {
                            console.warn(`Error: ${error.message} saving proving and verifying keys to disk. KeyId: ${cacheKey}`);
                        }
                    }
                    return [provingKey, verifyingKey];
                }
            }
            else {
                // If cache is disabled, fetch the keys and return them
                const provingKey = <ProvingKey>ProvingKey.fromBytes(await this.fetchBytes(proverUrl))
                const verifyingKey = <VerifyingKey>(await this.getVerifyingKey(verifierUrl));
                if (this.storageHelper) {
                    try {
                        this.storageHelper.saveKeyBytes({
                            provingKeyBytes: provingKey.toBytes(),
                            verifyingKeyBytes: verifyingKey.toBytes()
                        })
                    } catch (error: any) {
                        console.warn(`Error: ${error.message} saving proving and verifying keys to disk. KeyId: ${cacheKey}`);
                    }
                }
                return [provingKey, verifyingKey];
            }
        } catch (error: any) {
            throw new Error(`Error: ${error.message} fetching fee proving and verifying keys from ${proverUrl} and ${verifierUrl}.`);
        }
    }

    /***
     * Fetches the proving key from a remote source.
     *
     * @param proverUrl
     * @param cacheKey
     *
     * @returns {Promise<ProvingKey>} Proving key for the specified program
     */
    async fetchProvingKey(proverUrl: string, cacheKey?: string): Promise<ProvingKey> {
        try {
            // If cache is enabled, check if the keys have already been fetched and return them if they have
            if (this.cacheOption) {
                if (!cacheKey) {
                    cacheKey = proverUrl;
                }
                const value = this.cache.get(cacheKey);
                if (typeof value !== "undefined") {
                    return ProvingKey.fromBytes(value[0]);
                } else {
                    console.debug("Fetching proving keys from url " + proverUrl);
                    const provingKey = <ProvingKey>ProvingKey.fromBytes(await this.fetchBytes(proverUrl));
                    return provingKey;
                }
            }
            else {
                const provingKey = <ProvingKey>ProvingKey.fromBytes(await this.fetchBytes(proverUrl));
                return provingKey;
            }
        } catch (error: any) {
            throw new Error(`Error: ${error.message} fetching fee proving keys from ${proverUrl}`);
        }
    }

    async fetchCreditsKeys(key: Key): Promise<FunctionKeyPair> {
        try {
            if (!this.cache.has(key.locator) || !this.cacheOption) {
                const verifying_key = key.verifyingKey()
                const proving_key = <ProvingKey>await this.fetchProvingKey(key.prover, key.locator);
                if (this.cacheOption) {
                    this.cache.set(CREDITS_PROGRAM_KEYS.bond_public.locator, [proving_key.toBytes(), verifying_key.toBytes()]);
                }
                return [proving_key, verifying_key];
            } else {
                const keyPair = <CachedKeyPair>this.cache.get(key.locator);
                return [ProvingKey.fromBytes(keyPair[0]), VerifyingKey.fromBytes(keyPair[1])];
            }
        } catch (error: any) {
            throw new Error(`Error: fetching credits.aleo keys: ${error.message}`);
        }
    }

    async bondPublicKeys(): Promise<FunctionKeyPair> {
        return this.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.bond_public);
    }

    bondValidatorKeys(): Promise<FunctionKeyPair> {
        return this.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.bond_validator);
    }

    claimUnbondPublicKeys(): Promise<FunctionKeyPair> {
        return this.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.claim_unbond_public)
    }

    /**
     * Returns the proving and verifying keys for the transfer functions in the credits.aleo program
     * @param {string} visibility Visibility of the transfer function
     * @returns {Promise<FunctionKeyPair>} Proving and verifying keys for the transfer functions
     *
     * @example
     * // Create a new AleoKeyProvider
     * const networkClient = new AleoNetworkClient("https://api.explorer.provable.com/v1");
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for value transfers
     * const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);
     * programManager.transfer(1, "aleo166q6ww6688cug7qxwe7nhctjpymydwzy2h7rscfmatqmfwnjvggqcad0at", "public", 0.5);
     *
     * // Keys can also be fetched manually
     * const [transferPublicProvingKey, transferPublicVerifyingKey] = await keyProvider.transferKeys("public");
     */
    async transferKeys(visibility: string): Promise<FunctionKeyPair> {
        if (PRIVATE_TRANSFER.has(visibility)) {
            return await this.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.transfer_private);
        } else if (PRIVATE_TO_PUBLIC_TRANSFER.has(visibility)) {
            return await this.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.transfer_private_to_public);
        } else if (PUBLIC_TRANSFER.has(visibility)) {
            return await this.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.transfer_public);
        } else if (PUBLIC_TRANSFER_AS_SIGNER.has(visibility)) {
            return await this.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.transfer_public_as_signer);
        } else if (PUBLIC_TO_PRIVATE_TRANSFER.has(visibility)) {
            return await this.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.transfer_public_to_private);
        } else {
            throw new Error("Invalid visibility type");
        }
    }

    /**
     * Returns the proving and verifying keys for the join function in the credits.aleo program
     *
     * @returns {Promise<FunctionKeyPair>} Proving and verifying keys for the join function
     */
    async joinKeys(): Promise<FunctionKeyPair> {
        return await this.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.join);
    }

    /**
     * Returns the proving and verifying keys for the split function in the credits.aleo program
     *
     * @returns {Promise<FunctionKeyPair>} Proving and verifying keys for the split function
     * */
    async splitKeys(): Promise<FunctionKeyPair> {
        return await this.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.split);
    }

    /**
     * Returns the proving and verifying keys for the fee_private function in the credits.aleo program
     *
     * @returns {Promise<FunctionKeyPair>} Proving and verifying keys for the fee function
     */
    async feePrivateKeys(): Promise<FunctionKeyPair> {
        return await this.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.fee_private);
    }

    /**
     * Returns the proving and verifying keys for the fee_public function in the credits.aleo program
     *
     * @returns {Promise<FunctionKeyPair>} Proving and verifying keys for the fee function
     */
    async feePublicKeys(): Promise<FunctionKeyPair> {
        return await this.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.fee_public);
    }

    /**
     * Gets a verifying key. If the verifying key is for a credits.aleo function, get it from the wasm cache otherwise
     *
     * @returns {Promise<VerifyingKey>} Verifying key for the function
     */
    // attempt to fetch it from the network
    async getVerifyingKey(verifierUri: string): Promise<VerifyingKey> {
        switch (verifierUri) {
            case CREDITS_PROGRAM_KEYS.bond_public.verifier:
                return CREDITS_PROGRAM_KEYS.bond_public.verifyingKey();
            case CREDITS_PROGRAM_KEYS.bond_validator.verifier:
                return CREDITS_PROGRAM_KEYS.bond_validator.verifyingKey();
            case CREDITS_PROGRAM_KEYS.claim_unbond_public.verifier:
                return CREDITS_PROGRAM_KEYS.claim_unbond_public.verifyingKey();
            case CREDITS_PROGRAM_KEYS.fee_private.verifier:
                return CREDITS_PROGRAM_KEYS.fee_private.verifyingKey();
            case CREDITS_PROGRAM_KEYS.fee_public.verifier:
                return CREDITS_PROGRAM_KEYS.fee_public.verifyingKey();
            case CREDITS_PROGRAM_KEYS.inclusion.verifier:
                return CREDITS_PROGRAM_KEYS.inclusion.verifyingKey();
            case CREDITS_PROGRAM_KEYS.join.verifier:
                return CREDITS_PROGRAM_KEYS.join.verifyingKey();
            case CREDITS_PROGRAM_KEYS.set_validator_state.verifier:
                return CREDITS_PROGRAM_KEYS.set_validator_state.verifyingKey();
            case CREDITS_PROGRAM_KEYS.split.verifier:
                return CREDITS_PROGRAM_KEYS.split.verifyingKey();
            case CREDITS_PROGRAM_KEYS.transfer_private.verifier:
                return CREDITS_PROGRAM_KEYS.transfer_private.verifyingKey();
            case CREDITS_PROGRAM_KEYS.transfer_private_to_public.verifier:
                return CREDITS_PROGRAM_KEYS.transfer_private_to_public.verifyingKey();
            case CREDITS_PROGRAM_KEYS.transfer_public.verifier:
                return CREDITS_PROGRAM_KEYS.transfer_public.verifyingKey();
            case CREDITS_PROGRAM_KEYS.transfer_public_as_signer.verifier:
                return CREDITS_PROGRAM_KEYS.transfer_public_as_signer.verifyingKey();
            case CREDITS_PROGRAM_KEYS.transfer_public_to_private.verifier:
                return CREDITS_PROGRAM_KEYS.transfer_public_to_private.verifyingKey();
            case CREDITS_PROGRAM_KEYS.unbond_public.verifier:
                return CREDITS_PROGRAM_KEYS.unbond_public.verifyingKey();
            default:
                try {
                    /// Try to fetch the verifying key from the network as a string
                    const response = await get(verifierUri);
                    const text = await response.text();
                    return <VerifyingKey>VerifyingKey.fromString(text);
                } catch (e) {
                    /// If that fails, try to fetch the verifying key from the network as bytes
                    try {
                        return <VerifyingKey>VerifyingKey.fromBytes(await this.fetchBytes(verifierUri));
                    } catch (inner: any) {
                        throw new Error("Invalid verifying key. Error: " + inner.message);
                    }
                }
        }
    }

    unBondPublicKeys(): Promise<FunctionKeyPair> {
        return this.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.unbond_public);
    }

    /**
     * Converts the keys in a FunctionKeyPair to buffers.
     * @param {FunctionKeyPair} The proving and verifying keys to convert.
     *
     * @returns {Promise<KeyBytes>} The buffers containing the proving and verifying keys.
     */
    convertKeysToBytes(keyPair: FunctionKeyPair): KeyBytes {
        const [provingKey, verifyingKey] = keyPair;
        const proverBytes = provingKey.toBytes();
        const verifierBytes = verifyingKey.toBytes();
        return {
            provingKeyBytes: proverBytes,
            verifyingKeyBytes: verifierBytes
        };
    }
}

export { AleoKeyProvider, NodeKeyProviderParams, KeyBytes, NodeKeyStorage }