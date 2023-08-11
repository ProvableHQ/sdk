import { __awaiter } from "tslib";
import { ProvingKey, VerifyingKey, CREDITS_PROGRAM_KEYS, KEY_STORE, PRIVATE_TRANSFER, PRIVATE_TO_PUBLIC_TRANSFER, PUBLIC_TRANSFER, PUBLIC_TO_PRIVATE_TRANSFER } from ".";
import axios from 'axios';
/**
 * AleoKeyProviderParams search parameter for the AleoKeyProvider. It allows for the specification of a proverUri and
 * verifierUri to fetch keys via HTTP from a remote resource as well as a unique cacheKey to store the keys in memory.
 */
class AleoKeyProviderParams {
    /**
     * Create a new AleoKeyProviderParams object which implements the KeySearchParams interface. Users can optionally
     * specify a url for the proverUri & verifierUri to fetch keys via HTTP from a remote resource as well as a unique
     * cacheKey to store the keys in memory for future use. If no proverUri or verifierUri is specified, a cachekey must
     * be provided.
     *
     * @param { AleoKeyProviderInitParams } params - Optional search parameters
     */
    constructor(params) {
        this.proverUri = params.proverUri;
        this.verifierUri = params.verifierUri;
        this.cacheKey = params.cacheKey;
    }
}
/**
 * AleoKeyProvider class. Implements the KeyProvider interface. Enables the retrieval of Aleo program proving and
 * verifying keys for the credits.aleo program over http from official Aleo sources and storing and retrieving function
 * keys from a local memory cache.
 */
class AleoKeyProvider {
    fetchBytes(url = "/") {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield axios.get(url, { responseType: "arraybuffer" });
                return new Uint8Array(response.data);
            }
            catch (error) {
                throw new Error("Error fetching data." + error);
            }
        });
    }
    constructor() {
        this.keyUris = KEY_STORE;
        this.cache = new Map();
        this.cacheOption = false;
    }
    /**
     * Use local memory to store keys
     *
     * @param {boolean} useCache whether to store keys in local memory
     */
    useCache(useCache) {
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
    cacheKeys(keyId, keys) {
        const [provingKey, verifyingKey] = keys;
        this.cache.set(keyId, [provingKey.toBytes(), verifyingKey.toBytes()]);
    }
    /**
     * Determine if a keyId exists in the cache
     *
     * @param {string} keyId keyId of a proving and verifying key pair
     * @returns {boolean} true if the keyId exists in the cache, false otherwise
     */
    containsKeys(keyId) {
        return this.cache.has(keyId);
    }
    /**
     * Delete a set of keys from the cache
     *
     * @param {string} keyId keyId of a proving and verifying key pair to delete from memory
     * @returns {boolean} true if the keyId exists in the cache and was deleted, false if the key did not exist
     */
    deleteKeys(keyId) {
        return this.cache.delete(keyId);
    }
    /**
     * Get a set of keys from the cache
     * @param keyId keyId of a proving and verifying key pair
     *
     * @returns {FunctionKeyPair | Error} Proving and verifying keys for the specified program
     */
    getKeys(keyId) {
        console.debug(`Checking if key exists in cache. KeyId: ${keyId}`);
        if (this.cache.has(keyId)) {
            const [provingKeyBytes, verifyingKeyBytes] = this.cache.get(keyId);
            return [ProvingKey.fromBytes(provingKeyBytes), VerifyingKey.fromBytes(verifyingKeyBytes)];
        }
        else {
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
    functionKeys(params) {
        return __awaiter(this, void 0, void 0, function* () {
            if (params) {
                let proverUrl;
                let verifierUrl;
                let cacheKey;
                if ("proverUrl" in params && typeof params["proverUrl"] == "string") {
                    proverUrl = params["proverUrl"];
                }
                if ("verifierUrl" in params && typeof params["verifierUrl"] == "string") {
                    verifierUrl = params["verifierUrl"];
                }
                if ("cacheKey" in params && typeof params["cacheKey"] == "string") {
                    cacheKey = params["cacheKey"];
                }
                if (proverUrl && verifierUrl) {
                    return yield this.fetchKeys(proverUrl, verifierUrl, cacheKey);
                }
                if (cacheKey) {
                    return this.getKeys(cacheKey);
                }
            }
            throw Error("Invalid parameters provided, must provide either a cacheKey and/or a proverUrl and a verifierUrl");
        });
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
    fetchKeys(proverUrl, verifierUrl, cacheKey) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // If cache is enabled, check if the keys have already been fetched and return them if they have
                if (this.cacheOption) {
                    if (!cacheKey) {
                        cacheKey = proverUrl + verifierUrl;
                    }
                    const value = this.cache.get(cacheKey);
                    if (typeof value !== "undefined") {
                        return [ProvingKey.fromBytes(value[0]), VerifyingKey.fromBytes(value[1])];
                    }
                    else {
                        console.debug("Fetching proving keys from url " + proverUrl);
                        const provingKey = ProvingKey.fromBytes(yield this.fetchBytes(proverUrl));
                        console.debug("Fetching verifying keys from url " + verifierUrl);
                        const verifyingKey = VerifyingKey.fromBytes(yield this.fetchBytes(verifierUrl));
                        this.cache.set(cacheKey, [provingKey.toBytes(), verifyingKey.toBytes()]);
                        return [provingKey, verifyingKey];
                    }
                }
                else {
                    // If cache is disabled, fetch the keys and return them
                    const provingKey = ProvingKey.fromBytes(yield this.fetchBytes(proverUrl));
                    const verifyingKey = VerifyingKey.fromBytes(yield this.fetchBytes(verifierUrl));
                    return [provingKey, verifyingKey];
                }
            }
            catch (error) {
                throw new Error(`Error: ${error} fetching fee proving and verifying keys from ${proverUrl} and ${verifierUrl}.`);
            }
        });
    }
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
    transferKeys(visibility) {
        return __awaiter(this, void 0, void 0, function* () {
            if (PRIVATE_TRANSFER.has(visibility)) {
                return yield this.fetchKeys(CREDITS_PROGRAM_KEYS.transfer_private.prover, CREDITS_PROGRAM_KEYS.transfer_private.verifier);
            }
            else if (PRIVATE_TO_PUBLIC_TRANSFER.has(visibility)) {
                return yield this.fetchKeys(CREDITS_PROGRAM_KEYS.transfer_private_to_public.prover, CREDITS_PROGRAM_KEYS.transfer_private_to_public.verifier);
            }
            else if (PUBLIC_TRANSFER.has(visibility)) {
                return yield this.fetchKeys(CREDITS_PROGRAM_KEYS.transfer_public.prover, CREDITS_PROGRAM_KEYS.transfer_public.verifier);
            }
            else if (PUBLIC_TO_PRIVATE_TRANSFER.has(visibility)) {
                return yield this.fetchKeys(CREDITS_PROGRAM_KEYS.transfer_public_to_private.prover, CREDITS_PROGRAM_KEYS.transfer_public_to_private.verifier);
            }
            else {
                throw new Error("Invalid visibility type");
            }
        });
    }
    /**
     * Returns the proving and verifying keys for the join function in the credits.aleo program
     *
     * @returns {Promise<FunctionKeyPair | Error>} Proving and verifying keys for the join function
     */
    joinKeys() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.fetchKeys(CREDITS_PROGRAM_KEYS.join.prover, CREDITS_PROGRAM_KEYS.join.verifier);
        });
    }
    /**
     * Returns the proving and verifying keys for the split function in the credits.aleo program
     *
     * @returns {Promise<FunctionKeyPair | Error>} Proving and verifying keys for the split function
     * */
    splitKeys() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.fetchKeys(CREDITS_PROGRAM_KEYS.split.prover, CREDITS_PROGRAM_KEYS.split.verifier);
        });
    }
    /**
     * Returns the proving and verifying keys for the fee function in the credits.aleo program
     *
     * @returns {Promise<FunctionKeyPair | Error>} Proving and verifying keys for the fee function
     */
    feeKeys() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.fetchKeys(CREDITS_PROGRAM_KEYS.fee.prover, CREDITS_PROGRAM_KEYS.fee.verifier);
        });
    }
}
export { AleoKeyProvider, AleoKeyProviderParams };
//# sourceMappingURL=function-key-provider.js.map