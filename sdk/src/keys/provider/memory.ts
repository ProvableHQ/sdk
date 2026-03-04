import {
    CREDITS_PROGRAM_KEYS,
    KEY_STORE,
    Key,
    PRIVATE_TRANSFER,
    PRIVATE_TO_PUBLIC_TRANSFER,
    PUBLIC_TRANSFER,
    PUBLIC_TO_PRIVATE_TRANSFER,
    PUBLIC_TRANSFER_AS_SIGNER,
} from "../../constants.js";

import {
    CachedKeyPair,
    FunctionKeyPair
} from "../../models/keyPair.js";

import { FunctionKeyProvider, KeySearchParams } from "./interface";

import {
    ProvingKey,
    VerifyingKey,
} from "../../wasm.js";

import { get } from "../../utils.js";
import { KeyStore } from "../keystore/interface.js";

type AleoKeyProviderInitParams = {
    proverUri?: string;
    verifierUri?: string;
    cacheKey?: string;
};

/**
 * AleoKeyProviderParams search parameter for the AleoKeyProvider. It allows for the specification of a proverUri and
 * verifierUri to fetch keys via HTTP from a remote resource as well as a unique cacheKey to store the keys in memory.
 */
class AleoKeyProviderParams implements KeySearchParams {
    name: string | undefined;
    proverUri: string | undefined;
    verifierUri: string | undefined;
    program: string | undefined;
    cacheKey: string | undefined;

    /**
     * Create a new AleoKeyProviderParams object which implements the KeySearchParams interface. Users can optionally
     * specify a url for the proverUri & verifierUri to fetch keys via HTTP from a remote resource as well as a unique
     * cacheKey to store the keys in memory for future use. If no proverUri or verifierUri is specified, a cachekey must
     * be provided.
     *
     * @param { AleoKeyProviderInitParams } params - Optional search parameters
     */
    constructor(params: {proverUri?: string, verifierUri?: string, cacheKey?: string, name?: string, program?: string}) {
        this.proverUri = params.proverUri;
        this.verifierUri = params.verifierUri;
        this.cacheKey = params.cacheKey;
        this.name = params.name;
        this.program = params.program;
    }
}


/** Locator suffix for the proving key when storing a pair under a single cache key. */
const PROVER_LOCATOR_SUFFIX = ".prover";
/** Locator suffix for the verifying key when storing a pair under a single cache key. */
const VERIFIER_LOCATOR_SUFFIX = ".verifier";

/**
 * AleoKeyProvider class. Implements the FunctionKeyProvider interface. Enables the retrieval of Aleo program proving and
 * verifying keys for the credits.aleo program over HTTP from official Aleo sources and storing and retrieving function
 * keys from a local memory cache. Optionally uses a {@link KeyStore} for persistence; lookups check the in-memory cache
 * first, then the KeyStore (if set), then remote fetch.
 */
class AleoKeyProvider implements FunctionKeyProvider {
    cache: Map<string, CachedKeyPair>;
    cacheOption: boolean;
    keyUris: string;
    /** Optional KeyStore for persistent key storage; used after the in-memory cache when resolving keys. */
    private _keyStore: KeyStore | undefined;

    async fetchBytes(url = "/"): Promise<Uint8Array> {
        try {
            const response = await get(url);
            const data = await response.arrayBuffer();
            return new Uint8Array(data);
        } catch (error: any) {
            throw new Error("Error fetching data." + error.message);
        }
    }

    constructor() {
        this.keyUris = KEY_STORE;
        this.cache = new Map<string, CachedKeyPair>();
        this.cacheOption = false;
    }

    /**
     * Create a new AleoKeyProvider from a KeyStore.
     * 
     * @param keyStore - The KeyStore to use for persistent key storage.
     * @returns A new AleoKeyProvider instance.
     */
    static fromKeyStore(keyStore: KeyStore): AleoKeyProvider {
        const provider = new AleoKeyProvider();
        provider.setKeyStore(keyStore);
        return provider;
    }

    /**
     * Sets the optional KeyStore used for persistent key storage. When set, {@link functionKeys} checks the KeyStore
     * after the in-memory cache, and {@link cacheKeys} writes to the KeyStore before updating the cache.
     *
     * @param {KeyStore | undefined} keyStore - KeyStore instance, or undefined to disable.
     */
    setKeyStore(keyStore: KeyStore | undefined) {
        this._keyStore = keyStore;
    }

    async keyStore(): Promise<KeyStore | undefined> {
        return this._keyStore;
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
     * If a KeyStore is set, keys are stored there first, then in the in-memory cache.
     *
     * @param {string} keyId access key for the cache (and base locator for KeyStore: keyId.prover / keyId.verifier)
     * @param {FunctionKeyPair} keys keys to cache
     */
    async cacheKeys(keyId: string, keys: FunctionKeyPair): Promise<void> {
        const [provingKey, verifyingKey] = keys;
        this.cache.set(keyId, [provingKey.toBytes(), verifyingKey.toBytes()]);
        if (this._keyStore) {
            await this._keyStore.setKeys(
                { locator: keyId + PROVER_LOCATOR_SUFFIX },
                { locator: keyId + VERIFIER_LOCATOR_SUFFIX },
                keys,
            );
        }
    }

    /**
     * Determine if a keyId exists in the cache
     *
     * @param {string} keyId keyId of a proving and verifying key pair
     * @returns {boolean} true if the keyId exists in the cache, false otherwise
     */
    containsKeys(keyId: string): boolean {
        return this.cache.has(keyId);
    }

    /**
     * Delete a set of keys from the cache
     *
     * @param {string} keyId keyId of a proving and verifying key pair to delete from memory
     * @returns {boolean} true if the keyId exists in the cache and was deleted, false if the key did not exist
     */
    deleteKeys(keyId: string): boolean {
        return this.cache.delete(keyId);
    }

    /**
     * Get a set of keys from the cache
     * @param keyId keyId of a proving and verifying key pair
     *
     * @returns {FunctionKeyPair} Proving and verifying keys for the specified program
     */
    getKeys(keyId: string): FunctionKeyPair {
        console.debug(`Checking if key exists in cache. KeyId: ${keyId}`);
        if (this.cache.has(keyId)) {
            const [provingKeyBytes, verifyingKeyBytes] = <CachedKeyPair>(
                this.cache.get(keyId)
            );
            return [
                ProvingKey.fromBytes(provingKeyBytes),
                VerifyingKey.fromBytes(verifyingKeyBytes),
            ];
        } else {
            throw new Error("Key not found in cache.");
        }
    }

    /**
     * Get arbitrary function keys from a provider. Resolves keys in order: in-memory cache, then KeyStore (if set),
     * then remote fetch (proverUri/verifierUri) or credits keys by name.
     *
     * @param {KeySearchParams} params parameters for the key search in form of: {proverUri: string, verifierUri: string, cacheKey: string}
     * @returns {Promise<FunctionKeyPair>} Proving and verifying keys for the specified program
     *
     * @example
     * // Create a new object which implements the KeyProvider interface
     * const networkClient = new AleoNetworkClient("https://api.provable.com/v2");
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for value transfers
     * const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, recordProvider);
     * programManager.transfer(1, "aleo166q6ww6688cug7qxwe7nhctjpymydwzy2h7rscfmatqmfwnjvggqcad0at", "public", 0.5);
     *
     * // Keys can also be fetched manually using the key provider
     * const keySearchParams = { "cacheKey": "myProgram:myFunction" };
     * const [transferPrivateProvingKey, transferPrivateVerifyingKey] = await keyProvider.functionKeys(keySearchParams);
     */
    async functionKeys(params?: KeySearchParams): Promise<FunctionKeyPair> {
        if (params) {
            let proverUrl: string | undefined;
            let verifierUrl: string | undefined;
            let cacheKey: string | undefined;

            // Check to see if a cache key is provided.
            if ("cacheKey" in params && typeof params["cacheKey"] == "string") {
                cacheKey = params["cacheKey"];
            }

            // If the cache key is provided attempt to do a cache and keystorelookup first.
            if (cacheKey) {
                // First check the cache.
                if (this.cache.has(cacheKey)) {
                    return this.getKeys(cacheKey);
                }
                // If the keystore is configured, check it for the keys.
                if (this._keyStore) {
                    // Configure the locators.
                    const proverLocator = { locator: cacheKey + PROVER_LOCATOR_SUFFIX };
                    const verifierLocator = { locator: cacheKey + VERIFIER_LOCATOR_SUFFIX };
                    // Attempt to fetch the keys from the keystore.
                    try {
                        const [provingKey, verifyingKey] = await Promise.all([
                            this._keyStore.getProvingKey(proverLocator),
                            this._keyStore.getVerifyingKey(verifierLocator),
                        ]);
                        if (provingKey !== null && verifyingKey !== null) {
                            const pair: FunctionKeyPair = [provingKey, verifyingKey];
                            this.cache.set(cacheKey, [provingKey.toBytes(), verifyingKey.toBytes()]);
                            return pair;
                        }
                    }
                    catch (error: any) {
                        console.error(`Error fetching keys from configured keystore for cache key: ${cacheKey}, attempting to fetch from remote source.`);
                    }
                }
            }

            // If the name of the key is a credits.aleo function, attempt to fetch the keys from the credits.aleo program.
            if ("name" in params && typeof params["name"] == "string" && "program" in params && params["program"] == "credits.aleo") {
                const key = CREDITS_PROGRAM_KEYS.getKey(params["name"]);
                return this.fetchCreditsKeys(key);
            }

            if (
                "proverUri" in params &&
                typeof params["proverUri"] == "string"
            ) {
                proverUrl = params["proverUri"];
            }

            if (
                "verifierUri" in params &&
                typeof params["verifierUri"] == "string"
            ) {
                verifierUrl = params["verifierUri"];
            }

            if (proverUrl && verifierUrl) {
                return await this.fetchRemoteKeys(
                    proverUrl,
                    verifierUrl,
                    cacheKey,
                );
            }

        }
        throw new Error(
            "Invalid parameters provided, must provide either a cacheKey and/or a proverUrl and a verifierUrl",
        );
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
     * const networkClient = new AleoNetworkClient("https://api.provable.com/v2");
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for value transfers
     * const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, recordProvider);
     * programManager.transfer(1, "aleo166q6ww6688cug7qxwe7nhctjpymydwzy2h7rscfmatqmfwnjvggqcad0at", "public", 0.5);
     *
     * // Keys can also be fetched manually
     * const [transferPrivateProvingKey, transferPrivateVerifyingKey] = await keyProvider.fetchKeys(
     *     CREDITS_PROGRAM_KEYS.transfer_private.prover,
     *     CREDITS_PROGRAM_KEYS.transfer_private.verifier,
     * );
     */
    async fetchRemoteKeys(
        proverUrl: string,
        verifierUrl: string,
        cacheKey?: string,
    ): Promise<FunctionKeyPair> {
        try {
            // If cache is enabled, check if the keys have already been fetched and return them if they have
            if (this.cacheOption) {
                if (!cacheKey) {
                    cacheKey = proverUrl;
                }
                const value = this.cache.get(cacheKey);
                if (typeof value !== "undefined") {
                    return [
                        ProvingKey.fromBytes(value[0]),
                        VerifyingKey.fromBytes(value[1]),
                    ];
                } else {
                    const provingKey = <ProvingKey>(
                        ProvingKey.fromBytes(await this.fetchBytes(proverUrl))
                    );
                    console.debug("Fetching verifying keys " + verifierUrl);
                    const verifyingKey = <VerifyingKey>(
                        await this.getVerifyingKey(verifierUrl)
                    );
                    const pair: FunctionKeyPair = [provingKey, verifyingKey];
                    if (this._keyStore) {
                        await this._keyStore.setKeys(
                            { locator: cacheKey + PROVER_LOCATOR_SUFFIX },
                            { locator: cacheKey + VERIFIER_LOCATOR_SUFFIX },
                            pair,
                        );
                    }
                    this.cache.set(cacheKey, [
                        provingKey.toBytes(),
                        verifyingKey.toBytes(),
                    ]);
                    return pair;
                }
            } else {
                // If cache is disabled, fetch the keys and return them
                const provingKey = <ProvingKey>(
                    ProvingKey.fromBytes(await this.fetchBytes(proverUrl))
                );
                const verifyingKey = <VerifyingKey>(
                    await this.getVerifyingKey(verifierUrl)
                );
                if (this._keyStore) {
                    await this._keyStore.setKeys(
                        { locator: cacheKey + PROVER_LOCATOR_SUFFIX },
                        { locator: cacheKey + VERIFIER_LOCATOR_SUFFIX },
                        [provingKey.clone(), verifyingKey.clone()],
                    );
                }
                return [provingKey, verifyingKey];
            }
        } catch (error: any) {
            throw new Error(
                `Error: ${error.message} fetching fee proving and verifying keys from ${proverUrl} and ${verifierUrl}.`,
            );
        }
    }

    /***
     * Fetches the proving key from a remote source. When cache is enabled, resolves in order: in-memory cache,
     * then KeyStore (if set), then network.
     *
     * @param proverUrl
     * @param cacheKey
     *
     * @returns {Promise<ProvingKey>} Proving key for the specified program
     */
    async fetchProvingKey(
        proverUrl: string,
        cacheKey?: string,
    ): Promise<ProvingKey> {
        try {
            // If cache is enabled, check cache then KeyStore before fetching
            if (this.cacheOption) {
                if (!cacheKey) {
                    cacheKey = proverUrl;
                }
                // If the key is in the cache, return it.
                const value = this.cache.get(cacheKey);
                if (typeof value !== "undefined") {
                    return ProvingKey.fromBytes(value[0]);
                }
                // If the keystore is configured and the key is already in the keystore, return it.
                if (this._keyStore && (await this._keyStore.has(cacheKey + PROVER_LOCATOR_SUFFIX))) {
                    await this._keyStore.getKeyBytes({ locator: cacheKey + PROVER_LOCATOR_SUFFIX });
                }
                console.debug(
                    "Fetching proving keys from url " + proverUrl,
                );
                const provingKey = <ProvingKey>(
                    ProvingKey.fromBytes(await this.fetchBytes(proverUrl))
                );
                // If they keystore is configured and the key is not already in the keystore, store it.
                if (this._keyStore && !(await this._keyStore.has(cacheKey + PROVER_LOCATOR_SUFFIX))) {
                    await this._keyStore.setKeyBytes(provingKey.toBytes(), { locator: cacheKey + PROVER_LOCATOR_SUFFIX });
                }
                return provingKey;
            } else {
                // If the keystore is configured and the key is already in the keystore, return it.
                if (this._keyStore && (await this._keyStore.has(cacheKey + PROVER_LOCATOR_SUFFIX))) {
                    await this._keyStore.getKeyBytes({ locator: cacheKey + PROVER_LOCATOR_SUFFIX });
                }
                // If not fetch the bytes.
                const provingKey = <ProvingKey>(
                    ProvingKey.fromBytes(await this.fetchBytes(proverUrl))
                );
                // If they keystore is configured and the key is not already in the keystore, store it.
                if (this._keyStore && !(await this._keyStore.has(cacheKey + PROVER_LOCATOR_SUFFIX))) {
                    await this._keyStore.setKeyBytes(provingKey.toBytes(), { locator: cacheKey + PROVER_LOCATOR_SUFFIX });
                }
                return provingKey;
            }
        } catch (error: any) {
            throw new Error(
                `Error: ${error.message} fetching fee proving keys from ${proverUrl}`,
            );
        }
    }

    async fetchCreditsKeys(key: Key): Promise<FunctionKeyPair> {
        try {
            // First check the cache.
            if (this.cache.has(key.locator)) {
                const keyPair = this.cache.get(key.locator)!;
                return [
                    ProvingKey.fromBytes(keyPair[0]),
                    VerifyingKey.fromBytes(keyPair[1]),
                ];
            }
            // If the key is not in the cache, check the keystore.
            if (this._keyStore) {
                const verifyingKey = key.verifyingKey();
                const provingKey = await this._keyStore.getProvingKey({ locator: key.locator });
                if (provingKey !== null && verifyingKey !== null) {
                    const pair: FunctionKeyPair = [provingKey, verifyingKey];
                    if (this.cacheOption && !this.cache.has(key.locator)) {
                        this.cache.set(key.locator, [
                            provingKey.toBytes(),
                            verifyingKey.toBytes(),
                        ]);
                    }
                    return pair;
                }
            }
            // Otherwise fetch the proving key from the network.
            const verifying_key = key.verifyingKey();
            const proving_key = <ProvingKey>(
                await this.fetchProvingKey(key.prover, key.locator)
            );
            if (this.cacheOption) {
                const locator = CREDITS_PROGRAM_KEYS.getKey(key.name).locator;
                this.cache.set(locator, [
                    proving_key.toBytes(),
                    verifying_key.toBytes(),
                ]);
            }
            return [proving_key, verifying_key];
        } catch (error: any) {
            throw new Error(
                `Error: fetching credits.aleo keys: ${error.message}`,
            );
        }
    }

    async bondPublicKeys(): Promise<FunctionKeyPair> {
        return this.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.bond_public);
    }

    bondValidatorKeys(): Promise<FunctionKeyPair> {
        return this.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.bond_validator);
    }

    claimUnbondPublicKeys(): Promise<FunctionKeyPair> {
        return this.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.claim_unbond_public);
    }

    /**
     * Returns the proving and verifying keys for the transfer functions in the credits.aleo program
     * @param {string} visibility Visibility of the transfer function
     * @returns {Promise<FunctionKeyPair>} Proving and verifying keys for the transfer functions
     *
     * @example
     * // Create a new AleoKeyProvider
     * const networkClient = new AleoNetworkClient("https://api.provable.com/v2");
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for value transfers
     * const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, recordProvider);
     * programManager.transfer(1, "aleo166q6ww6688cug7qxwe7nhctjpymydwzy2h7rscfmatqmfwnjvggqcad0at", "public", 0.5);
     *
     * // Keys can also be fetched manually
     * const [transferPublicProvingKey, transferPublicVerifyingKey] = await keyProvider.transferKeys("public");
     */
    async transferKeys(visibility: string): Promise<FunctionKeyPair> {
        if (PRIVATE_TRANSFER.has(visibility)) {
            return await this.fetchCreditsKeys(
                CREDITS_PROGRAM_KEYS.transfer_private,
            );
        } else if (PRIVATE_TO_PUBLIC_TRANSFER.has(visibility)) {
            return await this.fetchCreditsKeys(
                CREDITS_PROGRAM_KEYS.transfer_private_to_public,
            );
        } else if (PUBLIC_TRANSFER.has(visibility)) {
            return await this.fetchCreditsKeys(
                CREDITS_PROGRAM_KEYS.transfer_public,
            );
        } else if (PUBLIC_TRANSFER_AS_SIGNER.has(visibility)) {
            return await this.fetchCreditsKeys(
                CREDITS_PROGRAM_KEYS.transfer_public_as_signer,
            );
        } else if (PUBLIC_TO_PRIVATE_TRANSFER.has(visibility)) {
            return await this.fetchCreditsKeys(
                CREDITS_PROGRAM_KEYS.transfer_public_to_private,
            );
        } else {
            throw new Error("Invalid visibility type");
        }
    }

    /**
     * Returns the proving and verifying keys for the transfer_public function.
     *
     * @returns {Promise<FunctionKeyPair>} Proving and verifying keys for the transfer_public function
     */
    async transferPublicKeys(): Promise<FunctionKeyPair> {
        return await this.fetchCreditsKeys(
            CREDITS_PROGRAM_KEYS.transfer_public,
        );
    }

    /**
     * Returns the proving and verifying keys for the inclusion proof.
     *
     * @returns {Promise<FunctionKeyPair>} Proving and verifying keys for the inclusion proof.
     */
    async inclusionKeys(): Promise<FunctionKeyPair> {
        return await this.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.inclusion);
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
                        return <VerifyingKey>(
                            VerifyingKey.fromBytes(
                                await this.fetchBytes(verifierUri),
                            )
                        );
                    } catch (inner: any) {
                        throw new Error(
                            "Invalid verifying key. Error: " + inner.message,
                        );
                    }
                }
        }
    }

    unBondPublicKeys(): Promise<FunctionKeyPair> {
        return this.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.unbond_public);
    }
}

export { AleoKeyProvider, AleoKeyProviderInitParams, AleoKeyProviderParams }