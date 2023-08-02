import { ProvingKey, VerifyingKey} from "@aleohq/wasm";
import {AleoNetworkClient, CREDITS_PROGRAM_KEYS, KEY_STORE} from "./index";

/**
 * KeyProvider interface. Enables the retrieval of public proving and verifying keys for Aleo Programs.
 */
interface KeyProvider {
    /**
     * Get arbitrary function keys from a provider
     *
     * @param proverUri the uri of the function's proving key
     * @param verifierUri the uri of the function's verifying key
     * @returns {Promise<[ProvingKey, VerifyingKey] | Error>} Proving and verifying keys for the specified program
     */
    functionKeys(proverUri: string, verifierUri: string): Promise<[ProvingKey, VerifyingKey] | Error>;
    /**
     * Get keys for a variant of the transfer function from the credits.aleo program
     *
     * @param visibility the visibility of the transfer function (private, public, privateToPublic, publicToPrivate)
     * @returns {Promise<[ProvingKey, VerifyingKey] | Error>} Proving and verifying keys for the specified transfer function
     *
     * @example
     * // Create a new key provider
     * const keyProvider = new AleoKeyProvider(networkClient);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for value transfers
     * const programManager = new ProgramManager(networkClient, keyProvider);
     * programManager.transfer(1, "aleo166q6ww6688cug7qxwe7nhctjpymydwzy2h7rscfmatqmfwnjvggqcad0at", "public");
     *
     */
    transferKeys(visibility: string): Promise<[ProvingKey, VerifyingKey] | Error>;
    /**
     * Get join function keys from the credits.aleo program
     *
     * @returns {Promise<[ProvingKey, VerifyingKey] | Error>} Proving and verifying keys for the join function
     */
    joinKeys(): Promise<[ProvingKey, VerifyingKey] | Error>;
    splitKeys(): Promise<[ProvingKey, VerifyingKey] | Error>;
    feeKeys(): Promise<[ProvingKey, VerifyingKey] | Error>;
}

class AleoKeyProvider implements KeyProvider {
    cache: Map<string, [ProvingKey, VerifyingKey]>;
    cacheOption: boolean;
    networkClient: AleoNetworkClient;
    provider: string;

    constructor(networkClient: AleoNetworkClient) {
        this.networkClient = networkClient;
        this.provider = KEY_STORE;
        this.cache = new Map<string, [ProvingKey, VerifyingKey]>();
        this.cacheOption = false;
    }

    useCache(useCache: boolean) {
        this.cacheOption = useCache;
    }

    async fetchFunctionKeys(proverUrl: string, verifierUrl: string): Promise<[ProvingKey, VerifyingKey] | Error> {
        const proving_key = ProvingKey.fromBytes(await this.networkClient.fetchBytes(proverUrl))
        const verifying_key = VerifyingKey.fromBytes(await this.networkClient.fetchBytes(verifierUrl));
        return [proving_key, verifying_key];
    }

    /**
     * Returns the proving and verifying keys for a specified function in an Aleo Program given the url of the prover and
     * verifier keys
     *
     * @param {string} url of the proving key
     * @param {string} url of the verifying key
     *
     * @returns {Promise<[ProvingKey, VerifyingKey] | Error>} Proving and verifying keys for the specified program
     */
    async functionKeys(proverUrl: string, verifierUrl: string): Promise<[ProvingKey, VerifyingKey] | Error> {
        try {
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
                return await this.fetchFunctionKeys(proverUrl, verifierUrl);
            }
        } catch (error) {
            throw new Error(`Error fetching fee proving and verifying keys from ${proverUrl} and ${verifierUrl}.`);
        }
    }

    /**
     * Returns the proving and verifying keys for the transfer functions in the credits.aleo program
     *
     * @returns {Promise<[ProvingKey, VerifyingKey] | Error>} Proving and verifying keys for the transfer functions
     * */
    async transferKeys(visibility: string): Promise<[ProvingKey, VerifyingKey] | Error> {
        switch (visibility) {
            case "private" || "transfer_private" || "Private" || "transferPrivate":
                return await this.functionKeys(CREDITS_PROGRAM_KEYS.transfer_private.prover, CREDITS_PROGRAM_KEYS.transfer_private.verifier);
            case "public" || "transfer_public" || "Public" || "transferPublic":
                return await this.functionKeys(CREDITS_PROGRAM_KEYS.transfer_public.prover, CREDITS_PROGRAM_KEYS.transfer_public.verifier);
            case "private_to_public" || "transfer_private_to_public" || "PrivateToPublic" || "transferPrivateToPublic":
                return await this.functionKeys(CREDITS_PROGRAM_KEYS.transfer_private_to_public.prover, CREDITS_PROGRAM_KEYS.transfer_private_to_public.verifier);
            case "public_to_private" || "transfer_public_to_private" || "PublicToPrivate" || "transferPublicToPrivate":
                return await this.functionKeys(CREDITS_PROGRAM_KEYS.transfer_public_to_private.prover, CREDITS_PROGRAM_KEYS.transfer_public_to_private.verifier);
            default:
                throw new Error("Invalid visibility type");
        }
    }

    /**
     * Returns the proving and verifying keys for the join function in the credits.aleo program
     *
     * @returns {Promise<[ProvingKey, VerifyingKey] | Error>} Proving and verifying keys for the join function
     */
    async joinKeys(): Promise<[ProvingKey, VerifyingKey] | Error> {
        return await this.functionKeys(CREDITS_PROGRAM_KEYS.join.prover, CREDITS_PROGRAM_KEYS.join.verifier);
    }

    /**
     * Returns the proving and verifying keys for the split function in the credits.aleo program
     *
     * @returns {Promise<[ProvingKey, VerifyingKey] | Error>} Proving and verifying keys for the split function
     * */
    async splitKeys(): Promise<[ProvingKey, VerifyingKey] | Error> {
        return await this.functionKeys(CREDITS_PROGRAM_KEYS.split.prover, CREDITS_PROGRAM_KEYS.split.verifier);
    }

    /**
     * Returns the proving and verifying keys for the fee function in the credits.aleo program
     *
     * @returns {Promise<[ProvingKey, VerifyingKey] | Error>} Proving and verifying keys for the fee function
     */
    async feeKeys(): Promise<[ProvingKey, VerifyingKey] | Error> {
        return await this.functionKeys(CREDITS_PROGRAM_KEYS.fee.prover, CREDITS_PROGRAM_KEYS.fee.verifier);
    }
}

export {AleoKeyProvider, KeyProvider}
