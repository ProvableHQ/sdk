import { ProvingKey, VerifyingKey, CREDITS_PROGRAM_KEYS, KEY_STORE, PRIVATE_TRANSFER, PRIVATE_TO_PUBLIC_TRANSFER, PUBLIC_TRANSFER, PUBLIC_TO_PRIVATE_TRANSFER} from "./index";
import { get } from "./utils";

type FunctionKeyPair = [ProvingKey, VerifyingKey];
type CachedKeyPair = [Uint8Array, Uint8Array];
type AleoKeyProviderInitParams = {
    proverUri?: string;
    verifierUri?: string;
    cacheKey?: string;
};

/**
 * Interface for record search parameters. This allows for arbitrary search parameters to be passed to record provider
 * implementations.
 */
interface KeySearchParams {
    [key: string]: any; // This allows for arbitrary keys with any type values
}

/**
 * AleoKeyProviderParams search parameter for the AleoKeyProvider. It allows for the specification of a proverUri and
 * verifierUri to fetch keys via HTTP from a remote resource as well as a unique cacheKey to store the keys in memory.
 */
class AleoKeyProviderParams implements KeySearchParams {
    proverUri: string | undefined;
    verifierUri: string | undefined;
    cacheKey: string | undefined;

    /**
     * Create a new AleoKeyProviderParams object which implements the KeySearchParams interface. Users can optionally
     * specify a url for the proverUri & verifierUri to fetch keys via HTTP from a remote resource as well as a unique
     * cacheKey to store the keys in memory for future use. If no proverUri or verifierUri is specified, a cachekey must
     * be provided.
     *
     * @param { AleoKeyProviderInitParams } params - Optional search parameters
     */
    constructor(params: {proverUri?: string, verifierUri?: string, cacheKey?: string}) {
        this.proverUri = params.proverUri;
        this.verifierUri = params.verifierUri;
        this.cacheKey = params.cacheKey;
    }
}

/**
 * KeyProvider interface. Enables the retrieval of public proving and verifying keys for Aleo Programs.
 */
interface FunctionKeyProvider {
    /**
     * Get bond_public function keys from the credits.aleo program
     *
     * @returns {Promise<FunctionKeyPair | Error>} Proving and verifying keys for the bond_public function
     */
    bondPublicKeys(): Promise<FunctionKeyPair | Error>;


    /**
     * Cache a set of keys. This will overwrite any existing keys with the same keyId. The user can check if a keyId
     * exists in the cache using the containsKeys method prior to calling this method if overwriting is not desired.
     *
     * @param {string} keyId access key for the cache
     * @param {FunctionKeyPair} keys keys to cache
     */
    cacheKeys(keyId: string, keys: FunctionKeyPair): void;

    /**
     * Get unbond_public function keys from the credits.aleo program
     *
     * @returns {Promise<FunctionKeyPair | Error>} Proving and verifying keys for the unbond_public function
     */
    claimUnbondPublicKeys(): Promise<FunctionKeyPair | Error>;

    /**
     * Get arbitrary function keys from a provider
     *
     * @param {KeySearchParams | undefined} params - Optional search parameters for the key provider
     * @returns {Promise<FunctionKeyPair | Error>} Proving and verifying keys for the specified program
     *
     * @example
     * // Create a search object which implements the KeySearchParams interface
     * class IndexDbSearch implements KeySearchParams {
     *     db: string
     *     keyId: string
     *     constructor(params: {db: string, keyId: string}) {
     *         this.db = params.db;
     *         this.keyId = params.keyId;
     *     }
     * }
     *
     * // Create a new object which implements the KeyProvider interface
     * class IndexDbKeyProvider implements FunctionKeyProvider {
     *     async functionKeys(params: KeySearchParams): Promise<FunctionKeyPair | Error> {
     *         return new Promise((resolve, reject) => {
     *             const request = indexedDB.open(params.db, 1);
     *
     *             request.onupgradeneeded = function(e) {
     *                 const db = e.target.result;
     *                 if (!db.objectStoreNames.contains('keys')) {
     *                     db.createObjectStore('keys', { keyPath: 'id' });
     *                 }
     *             };
     *
     *             request.onsuccess = function(e) {
     *                 const db = e.target.result;
     *                 const transaction = db.transaction(["keys"], "readonly");
     *                 const store = transaction.objectStore("keys");
     *                 const request = store.get(params.keyId);
     *                 request.onsuccess = function(e) {
     *                     if (request.result) {
     *                         resolve(request.result as FunctionKeyPair);
     *                     } else {
     *                         reject(new Error("Key not found"));
     *                     }
     *                 };
     *                 request.onerror = function(e) { reject(new Error("Error fetching key")); };
     *             };
     *
     *             request.onerror = function(e) { reject(new Error("Error opening database")); };
     *         });
     *     }
     *
     *     // implement the other methods...
     * }
     *
     *
     * const keyProvider = new AleoKeyProvider();
     * const networkClient = new AleoNetworkClient("https://api.explorer.aleo.org/v1");
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for value transfers
     * const programManager = new ProgramManager("https://api.explorer.aleo.org/v1", keyProvider, recordProvider);
     * programManager.transfer(1, "aleo166q6ww6688cug7qxwe7nhctjpymydwzy2h7rscfmatqmfwnjvggqcad0at", "public", 0.5);
     *
     * // Keys can also be fetched manually
     * const searchParams = new IndexDbSearch({db: "keys", keyId: "credits.aleo:transferPrivate"});
     * const [transferPrivateProvingKey, transferPrivateVerifyingKey] = await keyProvider.functionKeys(searchParams);
     */
    functionKeys(params?: KeySearchParams): Promise<FunctionKeyPair | Error>;

    /**
     * Get fee_private function keys from the credits.aleo program
     *
     * @returns {Promise<FunctionKeyPair | Error>} Proving and verifying keys for the join function
     */
    feePrivateKeys(): Promise<FunctionKeyPair | Error>;

    /**
     * Get fee_public function keys from the credits.aleo program
     *
     * @returns {Promise<FunctionKeyPair | Error>} Proving and verifying keys for the join function
     */
    feePublicKeys(): Promise<FunctionKeyPair | Error>;

    /**
     * Get join function keys from the credits.aleo program
     *
     * @returns {Promise<FunctionKeyPair | Error>} Proving and verifying keys for the join function
     */
    joinKeys(): Promise<FunctionKeyPair | Error>;

    /**
     * Get split function keys from the credits.aleo program
     *
     * @returns {Promise<FunctionKeyPair | Error>} Proving and verifying keys for the join function
     */
    splitKeys(): Promise<FunctionKeyPair | Error>;

    /**
     * Get keys for a variant of the transfer function from the credits.aleo program
     *
     * @param {string} visibility Visibility of the transfer function (private, public, privateToPublic, publicToPrivate)
     * @returns {Promise<FunctionKeyPair | Error>} Proving and verifying keys for the specified transfer function
     *
     * @example
     * // Create a new object which implements the KeyProvider interface
     * const networkClient = new AleoNetworkClient("https://api.explorer.aleo.org/v1");
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for value transfers
     * const programManager = new ProgramManager("https://api.explorer.aleo.org/v1", keyProvider, recordProvider);
     * programManager.transfer(1, "aleo166q6ww6688cug7qxwe7nhctjpymydwzy2h7rscfmatqmfwnjvggqcad0at", "public", 0.5);
     *
     * // Keys can also be fetched manually
     * const [transferPublicProvingKey, transferPublicVerifyingKey] = await keyProvider.transferKeys("public");
     */
    transferKeys(visibility: string): Promise<FunctionKeyPair | Error>;

    /**
     * Get unbond_public function keys from the credits.aleo program
     *
     * @returns {Promise<FunctionKeyPair | Error>} Proving and verifying keys for the join function
     */
    unBondPublicKeys(): Promise<FunctionKeyPair | Error>;

}


/**
 * AleoKeyProvider class. Implements the KeyProvider interface. Enables the retrieval of Aleo program proving and
 * verifying keys for the credits.aleo program over http from official Aleo sources and storing and retrieving function
 * keys from a local memory cache.
 */
class AleoKeyProvider implements FunctionKeyProvider {
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
        } catch (error) {
            throw new Error("Error fetching data." + error);
        }
    }

    constructor() {
        this.keyUris = KEY_STORE;
        this.cache = new Map<string, CachedKeyPair>();
        this.cacheOption = false;
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
        this.cache.set(keyId, [provingKey.toBytes(), verifyingKey.toBytes()]);
    }

    /**
     * Determine if a keyId exists in the cache
     *
     * @param {string} keyId keyId of a proving and verifying key pair
     * @returns {boolean} true if the keyId exists in the cache, false otherwise
     */
    containsKeys(keyId: string): boolean {
        return this.cache.has(keyId)
    }

    /**
     * Delete a set of keys from the cache
     *
     * @param {string} keyId keyId of a proving and verifying key pair to delete from memory
     * @returns {boolean} true if the keyId exists in the cache and was deleted, false if the key did not exist
     */
    deleteKeys(keyId: string): boolean {
        return this.cache.delete(keyId)
    }

    /**
     * Get a set of keys from the cache
     * @param keyId keyId of a proving and verifying key pair
     *
     * @returns {FunctionKeyPair | Error} Proving and verifying keys for the specified program
     */
    getKeys(keyId: string): FunctionKeyPair | Error {
        console.debug(`Checking if key exists in cache. KeyId: ${keyId}`)
        if (this.cache.has(keyId)) {
            const [provingKeyBytes, verifyingKeyBytes] = <CachedKeyPair>this.cache.get(keyId);
            return [ProvingKey.fromBytes(provingKeyBytes), VerifyingKey.fromBytes(verifyingKeyBytes)];
        } else {
            return new Error("Key not found in cache.");
        }
    }

    /**
     * Get arbitrary function keys from a provider
     *
     * @param {KeySearchParams} params parameters for the key search in form of: {proverUri: string, verifierUri: string, cacheKey: string}
     * @returns {Promise<FunctionKeyPair | Error>} Proving and verifying keys for the specified program
     *
     * @example
     * // Create a new object which implements the KeyProvider interface
     * const networkClient = new AleoNetworkClient("https://api.explorer.aleo.org/v1");
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     * const AleoProviderParams = new AleoProviderParams("https://testnet3.parameters.aleo.org/transfer_private.");
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for value transfers
     * const programManager = new ProgramManager("https://api.explorer.aleo.org/v1", keyProvider, recordProvider);
     * programManager.transfer(1, "aleo166q6ww6688cug7qxwe7nhctjpymydwzy2h7rscfmatqmfwnjvggqcad0at", "public", 0.5);
     *
     * // Keys can also be fetched manually using the key provider
     * const keySearchParams = { "cacheKey": "myProgram:myFunction" };
     * const [transferPrivateProvingKey, transferPrivateVerifyingKey] = await keyProvider.functionKeys(keySearchParams);
     */
    async functionKeys(params?: KeySearchParams): Promise<FunctionKeyPair | Error> {
        if (params) {
            let proverUrl;
            let verifierUrl;
            let cacheKey;
            if ("proverUri" in params && typeof params["proverUri"] == "string") {
                proverUrl = params["proverUri"];
            }

            if ("verifierUri" in params && typeof params["verifierUri"] == "string") {
                verifierUrl = params["verifierUri"];
            }

            if ("cacheKey" in params && typeof params["cacheKey"] == "string") {
                cacheKey = params["cacheKey"];
            }

            if (proverUrl && verifierUrl) {
                return await this.fetchKeys(proverUrl, verifierUrl, cacheKey);
            }

            if (cacheKey) {
                return this.getKeys(cacheKey);
            }
        }
        throw Error("Invalid parameters provided, must provide either a cacheKey and/or a proverUrl and a verifierUrl");
    }

    /**
     * Returns the proving and verifying keys for a specified program from a specified url.
     *
     * @param {string} verifierUrl Url of the proving key
     * @param {string} proverUrl Url the verifying key
     * @param {string} cacheKey Key to store the keys in the cache
     *
     * @returns {Promise<FunctionKeyPair | Error>} Proving and verifying keys for the specified program
     *
     * @example
     * // Create a new AleoKeyProvider object
     * const networkClient = new AleoNetworkClient("https://api.explorer.aleo.org/v1");
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for value transfers
     * const programManager = new ProgramManager("https://api.explorer.aleo.org/v1", keyProvider, recordProvider);
     * programManager.transfer(1, "aleo166q6ww6688cug7qxwe7nhctjpymydwzy2h7rscfmatqmfwnjvggqcad0at", "public", 0.5);
     *
     * // Keys can also be fetched manually
     * const [transferPrivateProvingKey, transferPrivateVerifyingKey] = await keyProvider.fetchKeys("https://testnet3.parameters.aleo.org/transfer_private.prover.2a9a6f2", "https://testnet3.parameters.aleo.org/transfer_private.verifier.3a59762");
     */
    async fetchKeys(proverUrl: string, verifierUrl: string, cacheKey?: string): Promise<FunctionKeyPair | Error> {
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
                    return [provingKey, verifyingKey];
                }
            }
            else {
                // If cache is disabled, fetch the keys and return them
                const provingKey = <ProvingKey>ProvingKey.fromBytes(await this.fetchBytes(proverUrl))
                const verifyingKey = <VerifyingKey>(await this.getVerifyingKey(verifierUrl));
                return [provingKey, verifyingKey];
            }
        } catch (error) {
            throw new Error(`Error: ${error} fetching fee proving and verifying keys from ${proverUrl} and ${verifierUrl}.`);
        }
    }

    bondPublicKeys(): Promise<FunctionKeyPair | Error> {
        return this.fetchKeys(CREDITS_PROGRAM_KEYS.bond_public.prover, CREDITS_PROGRAM_KEYS.bond_public.verifier, CREDITS_PROGRAM_KEYS.bond_public.locator)
    }

    claimUnbondPublicKeys(): Promise<FunctionKeyPair | Error> {
        return this.fetchKeys(CREDITS_PROGRAM_KEYS.claim_unbond_public.prover, CREDITS_PROGRAM_KEYS.claim_unbond_public.verifier, CREDITS_PROGRAM_KEYS.claim_unbond_public.locator)
    }

    /**
     * Returns the proving and verifying keys for the transfer functions in the credits.aleo program
     * @param {string} visibility Visibility of the transfer function
     * @returns {Promise<FunctionKeyPair | Error>} Proving and verifying keys for the transfer functions
     *
     * @example
     * // Create a new AleoKeyProvider
     * const networkClient = new AleoNetworkClient("https://api.explorer.aleo.org/v1");
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for value transfers
     * const programManager = new ProgramManager("https://api.explorer.aleo.org/v1", keyProvider, recordProvider);
     * programManager.transfer(1, "aleo166q6ww6688cug7qxwe7nhctjpymydwzy2h7rscfmatqmfwnjvggqcad0at", "public", 0.5);
     *
     * // Keys can also be fetched manually
     * const [transferPublicProvingKey, transferPublicVerifyingKey] = await keyProvider.transferKeys("public");
     */
    async transferKeys(visibility: string): Promise<FunctionKeyPair | Error> {
        if (PRIVATE_TRANSFER.has(visibility)) {
            return await this.fetchKeys(CREDITS_PROGRAM_KEYS.transfer_private.prover, CREDITS_PROGRAM_KEYS.transfer_private.verifier, CREDITS_PROGRAM_KEYS.transfer_private.locator);
        } else if (PRIVATE_TO_PUBLIC_TRANSFER.has(visibility)) {
            return await this.fetchKeys(CREDITS_PROGRAM_KEYS.transfer_private_to_public.prover, CREDITS_PROGRAM_KEYS.transfer_private_to_public.verifier, CREDITS_PROGRAM_KEYS.transfer_private_to_public.locator);
        } else if (PUBLIC_TRANSFER.has(visibility)) {
            return await this.fetchKeys(CREDITS_PROGRAM_KEYS.transfer_public.prover, CREDITS_PROGRAM_KEYS.transfer_public.verifier, CREDITS_PROGRAM_KEYS.transfer_public.locator);
        } else if (PUBLIC_TO_PRIVATE_TRANSFER.has(visibility)) {
            return await this.fetchKeys(CREDITS_PROGRAM_KEYS.transfer_public_to_private.prover, CREDITS_PROGRAM_KEYS.transfer_public_to_private.verifier, CREDITS_PROGRAM_KEYS.transfer_public_to_private.locator);
        } else {
            throw new Error("Invalid visibility type");
        }
    }

    /**
     * Returns the proving and verifying keys for the join function in the credits.aleo program
     *
     * @returns {Promise<FunctionKeyPair | Error>} Proving and verifying keys for the join function
     */
    async joinKeys(): Promise<FunctionKeyPair | Error> {
        return await this.fetchKeys(CREDITS_PROGRAM_KEYS.join.prover, CREDITS_PROGRAM_KEYS.join.verifier, CREDITS_PROGRAM_KEYS.join.locator);
    }

    /**
     * Returns the proving and verifying keys for the split function in the credits.aleo program
     *
     * @returns {Promise<FunctionKeyPair | Error>} Proving and verifying keys for the split function
     * */
    async splitKeys(): Promise<FunctionKeyPair | Error> {
        return await this.fetchKeys(CREDITS_PROGRAM_KEYS.split.prover, CREDITS_PROGRAM_KEYS.split.verifier, CREDITS_PROGRAM_KEYS.split.locator);
    }

    /**
     * Returns the proving and verifying keys for the fee_private function in the credits.aleo program
     *
     * @returns {Promise<FunctionKeyPair | Error>} Proving and verifying keys for the fee function
     */
    async feePrivateKeys(): Promise<FunctionKeyPair | Error> {
        return await this.fetchKeys(CREDITS_PROGRAM_KEYS.fee_private.prover, CREDITS_PROGRAM_KEYS.fee_private.verifier, CREDITS_PROGRAM_KEYS.fee_private.locator);
    }

    /**
     * Returns the proving and verifying keys for the fee_public function in the credits.aleo program
     *
     * @returns {Promise<FunctionKeyPair | Error>} Proving and verifying keys for the fee function
     */
    async feePublicKeys(): Promise<FunctionKeyPair | Error> {
        return await this.fetchKeys(CREDITS_PROGRAM_KEYS.fee_public.prover, CREDITS_PROGRAM_KEYS.fee_public.verifier, CREDITS_PROGRAM_KEYS.fee_public.locator);
    }

    /**
     * Gets a verifying key. If the verifying key is for a credits.aleo function, get it from the wasm cache otherwise
     *
     * @returns {Promise<VerifyingKey | Error>} Verifying key for the function
     */
    // attempt to fetch it from the network
    async getVerifyingKey(verifierUri: string): Promise<VerifyingKey | Error> {
        switch (verifierUri) {
            case CREDITS_PROGRAM_KEYS.bond_public.verifier:
                return CREDITS_PROGRAM_KEYS.bond_public.verifyingKey();
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
            case CREDITS_PROGRAM_KEYS.transfer_public_to_private.verifier:
                return CREDITS_PROGRAM_KEYS.transfer_public_to_private.verifyingKey();
            case CREDITS_PROGRAM_KEYS.unbond_delegator_as_validator.verifier:
                return CREDITS_PROGRAM_KEYS.unbond_delegator_as_validator.verifyingKey();
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
                    } catch (inner) {
                        return new Error("Invalid verifying key. Error: " + inner);
                    }
                }
        }
    }

    unBondPublicKeys(): Promise<FunctionKeyPair | Error> {
        return this.fetchKeys(CREDITS_PROGRAM_KEYS.unbond_public.prover, CREDITS_PROGRAM_KEYS.unbond_public.verifier, CREDITS_PROGRAM_KEYS.unbond_public.locator);
    }
}

export {AleoKeyProvider, AleoKeyProviderParams, AleoKeyProviderInitParams, CachedKeyPair, FunctionKeyPair, FunctionKeyProvider, KeySearchParams}
