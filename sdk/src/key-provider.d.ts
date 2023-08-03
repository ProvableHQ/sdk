import { ProvingKey, VerifyingKey } from ".";
type FunctionKeyPair = [ProvingKey, VerifyingKey];
/**
 * KeyProvider interface. Enables the retrieval of public proving and verifying keys for Aleo Programs.
 */
interface KeyProvider {
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
declare class AleoKeyProvider implements KeyProvider {
    cache: Map<string, FunctionKeyPair>;
    cacheOption: boolean;
    keyUris: string;
    fetchBytes(url?: string): Promise<Uint8Array>;
    constructor();
    /**
     * Use local memory to store keys
     *
     * @param useCache whether to store keys in local memory
     */
    useCache(useCache: boolean): void;
    /**
     * Clear the key cache
     */
    clearCache(): void;
    fetchFunctionKeys(proverUrl: string, verifierUrl: string): Promise<FunctionKeyPair | Error>;
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
    functionKeys(proverUrl: string, verifierUrl: string): Promise<FunctionKeyPair | Error>;
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
export { AleoKeyProvider, FunctionKeyPair, KeyProvider };
