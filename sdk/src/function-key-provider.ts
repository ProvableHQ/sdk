import { ProvingKey, VerifyingKey, CREDITS_PROGRAM_KEYS, KEY_STORE} from ".";
import axios from "axios";

type FunctionKeyPair = [ProvingKey, VerifyingKey];

/**
 * KeyProvider interface. Enables the retrieval of public proving and verifying keys for Aleo Programs.
 */
interface FunctionKeyProvider {
    /**
     * Get arbitrary function keys from a provider
     *
     * @param proverUri the uri of the function's proving key
     * @param verifierUri the uri of the function's verifying key
     * @returns {Promise<FunctionKeyPair | Error>} Proving and verifying keys for the specified program
     *
     * @example
     * // Create a new object which implements the KeyProvider interface
     * const networkClient = new AleoNetworkClient("https://vm.aleo.org/api");
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for value transfers
     * const programManager = new ProgramManager(networkClient, keyProvider, recordProvider);
     * programManager.transfer(1, "aleo166q6ww6688cug7qxwe7nhctjpymydwzy2h7rscfmatqmfwnjvggqcad0at", "public", 0.5);
     *
     * // Keys can also be fetched manually
     * const [transferPrivateProvingKey, transferPrivateVerifyingKey] = await keyProvider.functionKeys("https://testnet3.parameters.aleo.org/transfer_private.prover.2a9a6f2", "https://testnet3.parameters.aleo.org/transfer_private.verifier.3a59762");
     */
    functionKeys(proverUri: string, verifierUri: string): Promise<FunctionKeyPair | Error>;

    /**
     * Get keys for a variant of the transfer function from the credits.aleo program
     *
     * @param visibility the visibility of the transfer function (private, public, privateToPublic, publicToPrivate)
     * @returns {Promise<FunctionKeyPair | Error>} Proving and verifying keys for the specified transfer function
     *
     * @example
     * // Create a new object which implements the KeyProvider interface
     * const networkClient = new AleoNetworkClient("https://vm.aleo.org/api");
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for value transfers
     * const programManager = new ProgramManager(networkClient, keyProvider, recordProvider);
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
 * verifying keys stored as bytes as well as proving and verifying keys for the credits.aleo program over http from
 * official Aleo sources.
 */
class AleoKeyProvider implements FunctionKeyProvider {
    cache: Map<string, FunctionKeyPair>;
    cacheOption: boolean;
    keyUris: string;

    async fetchBytes(
        url = "/",
    ): Promise<Uint8Array> {
        try {
            const response = await axios.get("https://testnet3.parameters.aleo.org/" + url, {responseType: 'arraybuffer'});
            return new Uint8Array(response.data);
        } catch (error) {
            throw new Error("Error fetching data.");
        }
    }

    constructor() {
        this.keyUris = KEY_STORE;
        this.cache = new Map<string, FunctionKeyPair>();
        this.cacheOption = false;
    }

    /**
     * Use local memory to store keys
     *
     * @param useCache whether to store keys in local memory
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

    /// Fetch program keys from their stored byte representation and return the corresponding proving and verifying key
    /// objects
    async fetchFunctionKeys(proverUrl: string, verifierUrl: string): Promise<FunctionKeyPair | Error> {
        const provingKey = ProvingKey.fromBytes(await this.fetchBytes(proverUrl))
        const verifyingKey = VerifyingKey.fromBytes(await this.fetchBytes(verifierUrl));
        return [provingKey, verifyingKey];
    }

    /**
     * Returns the proving and verifying keys for a specified function in an Aleo Program given the url of the proving
     * and verifying keys
     *
     * @param {string} url of the proving key
     * @param {string} url of the verifying key
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
     * const programManager = new ProgramManager(networkClient, keyProvider, recordProvider);
     * programManager.transfer(1, "aleo166q6ww6688cug7qxwe7nhctjpymydwzy2h7rscfmatqmfwnjvggqcad0at", "public", 0.5);
     *
     * // Keys can also be fetched manually
     * const [transferPrivateProvingKey, transferPrivateVerifyingKey] = await keyProvider.functionKeys("https://testnet3.parameters.aleo.org/transfer_private.prover.2a9a6f2", "https://testnet3.parameters.aleo.org/transfer_private.verifier.3a59762");
     */
    async functionKeys(proverUrl: string, verifierUrl: string): Promise<FunctionKeyPair | Error> {
        try {
            // If cache is enabled, check if the keys have already been fetched and return them if they have
            if (this.cacheOption) {
                const cacheKey = proverUrl + verifierUrl;
                const value = this.cache.get(cacheKey);
                if (typeof value !== "undefined") {
                    return value
                } else {
                    const keys = await this.fetchFunctionKeys(proverUrl, verifierUrl);
                    if (!(keys instanceof Error)) {
                        this.cache.set(cacheKey, keys);
                    } else {
                        throw "Error fetching keys";
                    }
                    return keys;
                }
            }
            else {
                // If cache is disabled, fetch the keys and return them
                return await this.fetchFunctionKeys(proverUrl, verifierUrl);
            }
        } catch (error) {
            throw new Error(`Error fetching fee proving and verifying keys from ${proverUrl} and ${verifierUrl}.`);
        }
    }

    /**
     * Returns the proving and verifying keys for the transfer functions in the credits.aleo program
     *
     * @returns {Promise<FunctionKeyPair | Error>} Proving and verifying keys for the transfer functions
     *
     * @example
     * // Create a new AleoKeyProvider
     * const networkClient = new AleoNetworkClient("https://vm.aleo.org/api");
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for value transfers
     * const programManager = new ProgramManager(networkClient, keyProvider, recordProvider);
     * programManager.transfer(1, "aleo166q6ww6688cug7qxwe7nhctjpymydwzy2h7rscfmatqmfwnjvggqcad0at", "public", 0.5);
     *
     * // Keys can also be fetched manually
     * const [transferPublicProvingKey, transferPublicVerifyingKey] = await keyProvider.transferKeys("public");
     */
    async transferKeys(visibility: string): Promise<FunctionKeyPair | Error> {
        switch (visibility) {
            case "private" || "transfer_private" || "Private" || "transferPrivate":
                return await this.functionKeys(CREDITS_PROGRAM_KEYS.transfer_private.prover, CREDITS_PROGRAM_KEYS.transfer_private.verifier);
            case "public" || "transfer_public" || "Public" || "transferPublic":
                return await this.functionKeys(CREDITS_PROGRAM_KEYS.transfer_public.prover, CREDITS_PROGRAM_KEYS.transfer_public.verifier);
            case "private_to_public" || "transfer_private_to_public" || "privateToPublic" || "transferPrivateToPublic":
                return await this.functionKeys(CREDITS_PROGRAM_KEYS.transfer_private_to_public.prover, CREDITS_PROGRAM_KEYS.transfer_private_to_public.verifier);
            case "public_to_private" || "transfer_public_to_private" || "publicToPrivate" || "transferPublicToPrivate":
                return await this.functionKeys(CREDITS_PROGRAM_KEYS.transfer_public_to_private.prover, CREDITS_PROGRAM_KEYS.transfer_public_to_private.verifier);
            default:
                throw new Error("Invalid visibility type");
        }
    }

    /**
     * Returns the proving and verifying keys for the join function in the credits.aleo program
     *
     * @returns {Promise<FunctionKeyPair | Error>} Proving and verifying keys for the join function
     */
    async joinKeys(): Promise<FunctionKeyPair | Error> {
        return await this.functionKeys(CREDITS_PROGRAM_KEYS.join.prover, CREDITS_PROGRAM_KEYS.join.verifier);
    }

    /**
     * Returns the proving and verifying keys for the split function in the credits.aleo program
     *
     * @returns {Promise<FunctionKeyPair | Error>} Proving and verifying keys for the split function
     * */
    async splitKeys(): Promise<FunctionKeyPair | Error> {
        return await this.functionKeys(CREDITS_PROGRAM_KEYS.split.prover, CREDITS_PROGRAM_KEYS.split.verifier);
    }

    /**
     * Returns the proving and verifying keys for the fee function in the credits.aleo program
     *
     * @returns {Promise<FunctionKeyPair | Error>} Proving and verifying keys for the fee function
     */
    async feeKeys(): Promise<FunctionKeyPair | Error> {
        return await this.functionKeys(CREDITS_PROGRAM_KEYS.fee.prover, CREDITS_PROGRAM_KEYS.fee.verifier);
    }
}

export {AleoKeyProvider, FunctionKeyPair, FunctionKeyProvider}
