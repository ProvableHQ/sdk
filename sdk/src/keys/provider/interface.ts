import { FunctionKeyPair } from "../../models/keyPair.js";
import { KeyStore } from "../keystore/interface.js";

/**
 * Interface for record search parameters. This allows for arbitrary search parameters to be passed to record provider
 * implementations.
 */
interface KeySearchParams {
    [key: string]: any; // This allows for arbitrary keys with any type values
}

/**
 * KeyProvider interface. Enables the retrieval of public proving and verifying keys for Aleo Programs.
 */
interface FunctionKeyProvider {
    /**
     * Get bond_public function keys from the credits.aleo program
     *
     * @returns {Promise<FunctionKeyPair>} Proving and verifying keys for the bond_public function
     */
    bondPublicKeys(): Promise<FunctionKeyPair>;

    /**
     * Get bond_validator function keys from the credits.aleo program
     *
     * @returns {Promise<FunctionKeyPair>} Proving and verifying keys for the bond_validator function
     */
    bondValidatorKeys(): Promise<FunctionKeyPair>;

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
     * @returns {Promise<FunctionKeyPair>} Proving and verifying keys for the unbond_public function
     */
    claimUnbondPublicKeys(): Promise<FunctionKeyPair>;

    /**
     * Get arbitrary function keys from a provider
     *
     * @param {KeySearchParams | undefined} params - Optional search parameters for the key provider
     * @returns {Promise<FunctionKeyPair>} Proving and verifying keys for the specified program
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
     *     async functionKeys(params: KeySearchParams): Promise<FunctionKeyPair> {
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
     * const networkClient = new AleoNetworkClient("https://api.provable.com/v2");
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for value transfers
     * const programManager = new ProgramManager("https://api.provable.com/v2", keyProvider, recordProvider);
     * programManager.transfer(1, "aleo166q6ww6688cug7qxwe7nhctjpymydwzy2h7rscfmatqmfwnjvggqcad0at", "public", 0.5);
     *
     * // Keys can also be fetched manually
     * const searchParams = new IndexDbSearch({db: "keys", keyId: "credits.aleo:transferPrivate"});
     * const [transferPrivateProvingKey, transferPrivateVerifyingKey] = await keyProvider.functionKeys(searchParams);
     */
    functionKeys(params?: KeySearchParams): Promise<FunctionKeyPair>;

    /**
     * Gets an object which implements the `KeyStore` interface key store object for accessing proving and verifying
     * keys directly from persistent storage.
     *
     * @return {KeyStore}
     */
    keyStore(): Promise<KeyStore | undefined>

    /**
     * Get fee_private function keys from the credits.aleo program
     *
     * @returns {Promise<FunctionKeyPair>} Proving and verifying keys for the join function
     */
    feePrivateKeys(): Promise<FunctionKeyPair>;

    /**
     * Get fee_public function keys from the credits.aleo program
     *
     * @returns {Promise<FunctionKeyPair>} Proving and verifying keys for the join function
     */
    feePublicKeys(): Promise<FunctionKeyPair>;

    /**
     * Get keys for the inclusion proof.
     *
     * @returns {Promise<FunctionKeyPair>} Proving and verifying keys for the join function
     */
    inclusionKeys(): Promise<FunctionKeyPair>;

    /**
     * Get join function keys from the credits.aleo program
     *
     * @returns {Promise<FunctionKeyPair>} Proving and verifying keys for the join function
     */
    joinKeys(): Promise<FunctionKeyPair>;

    /**
     * Get split function keys from the credits.aleo program
     *
     * @returns {Promise<FunctionKeyPair>} Proving and verifying keys for the join function
     */
    splitKeys(): Promise<FunctionKeyPair>;

    /**
     * Get keys for a variant of the transfer function from the credits.aleo program
     *
     * @param {string} visibility Visibility of the transfer function (private, public, privateToPublic, publicToPrivate)
     * @returns {Promise<FunctionKeyPair>} Proving and verifying keys for the specified transfer function
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
     * // Keys can also be fetched manually
     * const [transferPublicProvingKey, transferPublicVerifyingKey] = await keyProvider.transferKeys("public");
     */
    transferKeys(visibility: string): Promise<FunctionKeyPair>;

    /**
     * Get unbond_public function keys from the credits.aleo program
     *
     * @returns {Promise<FunctionKeyPair>} Proving and verifying keys for the join function
     */
    unBondPublicKeys(): Promise<FunctionKeyPair>;
}

export { FunctionKeyProvider, KeySearchParams }
