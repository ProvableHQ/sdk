import { ProvingKey, VerifyingKey } from ".";
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
    [key: string]: any;
}
/**
 * AleoKeyProviderParams search parameter for the AleoKeyProvider. It allows for the specification of a proverUri and
 * verifierUri to fetch keys via HTTP from a remote resource as well as a unique cacheKey to store the keys in memory.
 */
declare class AleoKeyProviderParams implements KeySearchParams {
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
    constructor(params: {
        proverUri?: string;
        verifierUri?: string;
        cacheKey?: string;
    });
}
/**
 * KeyProvider interface. Enables the retrieval of public proving and verifying keys for Aleo Programs.
 */
interface FunctionKeyProvider {
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
     * const networkClient = new AleoNetworkClient("https://vm.aleo.org/api");
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for value transfers
     * const programManager = new ProgramManager("https://vm.aleo.org/api", keyProvider, recordProvider);
     * programManager.transfer(1, "aleo166q6ww6688cug7qxwe7nhctjpymydwzy2h7rscfmatqmfwnjvggqcad0at", "public", 0.5);
     *
     * // Keys can also be fetched manually
     * const searchParams = new IndexDbSearch({db: "keys", keyId: "credits.aleo:transferPrivate"});
     * const [transferPrivateProvingKey, transferPrivateVerifyingKey] = await keyProvider.functionKeys(searchParams);
     */
    functionKeys(params?: KeySearchParams): Promise<FunctionKeyPair | Error>;
    /**
     * Get keys for a variant of the transfer function from the credits.aleo program
     *
     * @param {string} visibility Visibility of the transfer function (private, public, privateToPublic, publicToPrivate)
     * @returns {Promise<FunctionKeyPair | Error>} Proving and verifying keys for the specified transfer function
     *
     * @example
     * // Create a new object which implements the KeyProvider interface
     * const networkClient = new AleoNetworkClient("https://vm.aleo.org/api");
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for value transfers
     * const programManager = new ProgramManager("https://vm.aleo.org/api", keyProvider, recordProvider);
     * programManager.transfer(1, "aleo166q6ww6688cug7qxwe7nhctjpymydwzy2h7rscfmatqmfwnjvggqcad0at", "public", 0.5);
     *
     * // Keys can also be fetched manually
     * const [transferPublicProvingKey, transferPublicVerifyingKey] = await keyProvider.transferKeys("public");
     */
    transferKeys(visibility: string): Promise<FunctionKeyPair | Error>;
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
     * Get fee function keys from the credits.aleo program
     *
     * @returns {Promise<FunctionKeyPair | Error>} Proving and verifying keys for the join function
     */
    feeKeys(): Promise<FunctionKeyPair | Error>;
}
/**
 * AleoKeyProvider class. Implements the KeyProvider interface. Enables the retrieval of Aleo program proving and
 * verifying keys for the credits.aleo program over http from official Aleo sources and storing and retrieving function
 * keys from a local memory cache.
 */
declare class AleoKeyProvider implements FunctionKeyProvider {
    cache: Map<string, CachedKeyPair>;
    cacheOption: boolean;
    keyUris: string;
    fetchBytes(url?: string): Promise<Uint8Array>;
    constructor();
    /**
     * Use local memory to store keys
     *
     * @param {boolean} useCache whether to store keys in local memory
     */
    useCache(useCache: boolean): void;
    /**
     * Clear the key cache
     */
    clearCache(): void;
    /**
     * Cache a set of keys. This will overwrite any existing keys with the same keyId. The user can check if a keyId
     * exists in the cache using the containsKeys method prior to calling this method if overwriting is not desired.
     *
     * @param {string} keyId access key for the cache
     * @param {FunctionKeyPair} keys keys to cache
     */
    cacheKeys(keyId: string, keys: FunctionKeyPair): void;
    /**
     * Determine if a keyId exists in the cache
     *
     * @param {string} keyId keyId of a proving and verifying key pair
     * @returns {boolean} true if the keyId exists in the cache, false otherwise
     */
    containsKeys(keyId: string): boolean;
    /**
     * Delete a set of keys from the cache
     *
     * @param {string} keyId keyId of a proving and verifying key pair to delete from memory
     * @returns {boolean} true if the keyId exists in the cache and was deleted, false if the key did not exist
     */
    deleteKeys(keyId: string): boolean;
    /**
     * Get a set of keys from the cache
     * @param keyId keyId of a proving and verifying key pair
     *
     * @returns {FunctionKeyPair | Error} Proving and verifying keys for the specified program
     */
    getKeys(keyId: string): FunctionKeyPair | Error;
    /**
     * Get arbitrary function keys from a provider
     *
     * @param {KeySearchParams} params parameters for the key search in form of: {proverUri: string, verifierUri: string, cacheKey: string}
     * @returns {Promise<FunctionKeyPair | Error>} Proving and verifying keys for the specified program
     *
     * @example
     * // Create a new object which implements the KeyProvider interface
     * const networkClient = new AleoNetworkClient("https://vm.aleo.org/api");
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     * const AleoProviderParams = new AleoProviderParams("https://testnet3.parameters.aleo.org/transfer_private.");
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for value transfers
     * const programManager = new ProgramManager("https://vm.aleo.org/api", keyProvider, recordProvider);
     * programManager.transfer(1, "aleo166q6ww6688cug7qxwe7nhctjpymydwzy2h7rscfmatqmfwnjvggqcad0at", "public", 0.5);
     *
     * // Keys can also be fetched manually using the key provider
     * const keySearchParams = { "cacheKey": "myProgram:myFunction" };
     * const [transferPrivateProvingKey, transferPrivateVerifyingKey] = await keyProvider.functionKeys(keySearchParams);
     */
    functionKeys(params?: KeySearchParams): Promise<FunctionKeyPair | Error>;
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
     * const networkClient = new AleoNetworkClient("https://vm.aleo.org/api");
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for value transfers
     * const programManager = new ProgramManager("https://vm.aleo.org/api", keyProvider, recordProvider);
     * programManager.transfer(1, "aleo166q6ww6688cug7qxwe7nhctjpymydwzy2h7rscfmatqmfwnjvggqcad0at", "public", 0.5);
     *
     * // Keys can also be fetched manually
     * const [transferPrivateProvingKey, transferPrivateVerifyingKey] = await keyProvider.fetchKeys("https://testnet3.parameters.aleo.org/transfer_private.prover.2a9a6f2", "https://testnet3.parameters.aleo.org/transfer_private.verifier.3a59762");
     */
    fetchKeys(proverUrl: string, verifierUrl: string, cacheKey?: string): Promise<FunctionKeyPair | Error>;
    /**
     * Returns the proving and verifying keys for the transfer functions in the credits.aleo program
     * @param {string} visibility Visibility of the transfer function
     * @returns {Promise<FunctionKeyPair | Error>} Proving and verifying keys for the transfer functions
     *
     * @example
     * // Create a new AleoKeyProvider
     * const networkClient = new AleoNetworkClient("https://vm.aleo.org/api");
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for value transfers
     * const programManager = new ProgramManager("https://vm.aleo.org/api", keyProvider, recordProvider);
     * programManager.transfer(1, "aleo166q6ww6688cug7qxwe7nhctjpymydwzy2h7rscfmatqmfwnjvggqcad0at", "public", 0.5);
     *
     * // Keys can also be fetched manually
     * const [transferPublicProvingKey, transferPublicVerifyingKey] = await keyProvider.transferKeys("public");
     */
    transferKeys(visibility: string): Promise<FunctionKeyPair | Error>;
    /**
     * Returns the proving and verifying keys for the join function in the credits.aleo program
     *
     * @returns {Promise<FunctionKeyPair | Error>} Proving and verifying keys for the join function
     */
    joinKeys(): Promise<FunctionKeyPair | Error>;
    /**
     * Returns the proving and verifying keys for the split function in the credits.aleo program
     *
     * @returns {Promise<FunctionKeyPair | Error>} Proving and verifying keys for the split function
     * */
    splitKeys(): Promise<FunctionKeyPair | Error>;
    /**
     * Returns the proving and verifying keys for the fee function in the credits.aleo program
     *
     * @returns {Promise<FunctionKeyPair | Error>} Proving and verifying keys for the fee function
     */
    feeKeys(): Promise<FunctionKeyPair | Error>;
}
export { AleoKeyProvider, AleoKeyProviderParams, AleoKeyProviderInitParams, CachedKeyPair, FunctionKeyPair, FunctionKeyProvider, KeySearchParams };
