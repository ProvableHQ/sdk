import { FunctionKeyProvider, KeySearchParams, FunctionKeyPair, CachedKeyPair, ProvingKey, VerifyingKey, CREDITS_PROGRAM_KEYS, PRIVATE_TRANSFER, PRIVATE_TO_PUBLIC_TRANSFER, PUBLIC_TRANSFER, PUBLIC_TO_PRIVATE_TRANSFER} from "./index";

/**
 * AleoKeyProviderParams search parameter for the AleoKeyProvider. It allows for the specification of a proverUri and
 * verifierUri to fetch keys via HTTP from a remote resource as well as a unique cacheKey to store the keys in memory.
 */
class OfflineSearchParams implements KeySearchParams {
    cacheKey: string | undefined;
    verifyCreditsKeys: boolean | undefined;

    /**
     * Create a new AleoKeyProviderParams object which implements the KeySearchParams interface. Users can optionally
     * specify a url for the proverUri & verifierUri to fetch keys via HTTP from a remote resource as well as a unique
     * cacheKey to store the keys in memory for future use. If no proverUri or verifierUri is specified, a cachekey must
     * be provided.
     *
     * @param {string} cacheKey - The key under which the key was stored
     * @param {boolean} verifyCreditsKeys - Whether to verify the keys against the credits.aleo program, defaults to false
     */
    constructor(cacheKey: string, verifyCreditsKeys = false) {
        this.cacheKey = cacheKey;
        this.verifyCreditsKeys = verifyCreditsKeys;
    }

    static bondPublicKeyParams(): OfflineSearchParams {
        return new OfflineSearchParams(CREDITS_PROGRAM_KEYS.bond_public.locator, true);
    }

    static claimUnbondPublicKeyParams(): OfflineSearchParams {
        return new OfflineSearchParams(CREDITS_PROGRAM_KEYS.claim_unbond_public.locator, true);
    }

    static feePrivateKeyParams(): OfflineSearchParams {
        return new OfflineSearchParams(CREDITS_PROGRAM_KEYS.fee_private.locator, true);
    }

    static feePublicKeyParams(): OfflineSearchParams {
        return new OfflineSearchParams(CREDITS_PROGRAM_KEYS.fee_public.locator, true);
    }

    static inclusionKeyParams(): OfflineSearchParams {
        return new OfflineSearchParams(CREDITS_PROGRAM_KEYS.inclusion.locator, true);
    }

    static joinKeyParams(): OfflineSearchParams {
        return new OfflineSearchParams(CREDITS_PROGRAM_KEYS.join.locator, true);
    }

    static setValidatorStateKeyParams(): OfflineSearchParams {
        return new OfflineSearchParams(CREDITS_PROGRAM_KEYS.set_validator_state.locator, true);
    }

    static splitKeyParams(): OfflineSearchParams {
        return new OfflineSearchParams(CREDITS_PROGRAM_KEYS.split.locator, true);
    }

    static transferPrivateKeyParams(): OfflineSearchParams {
        return new OfflineSearchParams(CREDITS_PROGRAM_KEYS.transfer_public_to_private.locator, true);
    }

    static transferPrivateToPublicKeyParams(): OfflineSearchParams {
        return new OfflineSearchParams(CREDITS_PROGRAM_KEYS.transfer_private_to_public.locator, true);
    }

    static transferPublicKeyParams(): OfflineSearchParams {
        return new OfflineSearchParams(CREDITS_PROGRAM_KEYS.transfer_public.locator, true);
    }

    static transferPublicToPrivateKeyParams(): OfflineSearchParams {
        return new OfflineSearchParams(CREDITS_PROGRAM_KEYS.transfer_public_to_private.locator, true);
    }

    static unbondDelegatorAsValidatorKeyParams(): OfflineSearchParams {
        return new OfflineSearchParams(CREDITS_PROGRAM_KEYS.unbond_delegator_as_validator.locator, true);
    }
    static unbondPublicKeyParams(): OfflineSearchParams {
        return new OfflineSearchParams(CREDITS_PROGRAM_KEYS.unbond_public.locator, true);
    }
}

class OfflineKeyProvider implements FunctionKeyProvider {
    cache: Map<string, CachedKeyPair>;

    constructor() {
        this.cache = new Map<string, CachedKeyPair>();
    }

    /**
     * Get bond_public function keys from the credits.aleo program. The keys must be cached prior to calling this
     * method for it to work.
     *
     * @returns {Promise<FunctionKeyPair | Error>} Proving and verifying keys for the bond_public function
     */
    bondPublicKeys(): Promise<FunctionKeyPair | Error> {
        return this.functionKeys(OfflineSearchParams.bondPublicKeyParams());
    };


    /**
     * Cache a set of keys. This will overwrite any existing keys with the same keyId. The user can check if a keyId
     * exists in the cache using the containsKeys method prior to calling this method if overwriting is not desired.
     *
     * @param {string} keyId access key for the cache
     * @param {FunctionKeyPair} keys keys to cache
     */
    cacheKeys(keyId: string, keys: FunctionKeyPair): void {
        const [provingKey, verifyingKey] = keys;
        this.cache.set(keyId, [provingKey.toBytes(), verifyingKey.toBytes()]);
    };

    /**
     * Get unbond_public function keys from the credits.aleo program. The keys must be cached prior to calling this
     * method for it to work.
     *
     * @returns {Promise<FunctionKeyPair | Error>} Proving and verifying keys for the unbond_public function
     */
    claimUnbondPublicKeys(): Promise<FunctionKeyPair | Error> {
        return this.functionKeys(OfflineSearchParams.claimUnbondPublicKeyParams());
    };

    /**
     * Get arbitrary function key from the offline key provider cache.
     *
     * @param {KeySearchParams | undefined} params - Optional search parameters for the key provider
     * @returns {Promise<FunctionKeyPair | Error>} Proving and verifying keys for the specified program
     *
     * @example
     * /// First cache the keys from local offline resources
     * const offlineKeyProvider = new OfflineKeyProvider();
     * const myFunctionVerifyingKey = VerifyingKey.fromString("verifier...");
     * const myFunctionProvingKeyBytes = await readBinaryFile('./resources/myfunction.prover');
     * const myFunctionProvingKey = ProvingKey.fromBytes(myFunctionProvingKeyBytes);
     *
     * /// Cache the keys for future use with a memorable locator
     * offlineKeyProvider.cacheKeys("myprogram.aleo/myfunction", [myFunctionProvingKey, myFunctionVerifyingKey]);
     *
     * /// When they're needed, retrieve the keys from the cache
     *
     * /// First create a search parameter object with the same locator used to cache the keys
     * const keyParams = new OfflineSearchParams("myprogram.aleo/myfunction");
     *
     * /// Then retrieve the keys
     * const [myFunctionProver, myFunctionVerifier] = await offlineKeyProvider.functionKeys(keyParams);
     */
    functionKeys(params?: KeySearchParams): Promise<FunctionKeyPair | Error> {
        return new Promise((resolve, reject) => {
            if (params === undefined) {
                reject(new Error("No search parameters provided, cannot retrieve keys"));
            } else {
                const keyId = params.cacheKey;
                const verifyCreditsKeys = params.verifyCreditsKeys;
                if (this.cache.has(keyId)) {
                    const [provingKeyBytes, verifyingKeyBytes] = this.cache.get(keyId) as CachedKeyPair;
                    const provingKey = ProvingKey.fromBytes(provingKeyBytes);
                    const verifyingKey = VerifyingKey.fromBytes(verifyingKeyBytes);
                    if (verifyCreditsKeys) {
                        const keysMatchExpected = this.verifyCreditsKeys(keyId, provingKey, verifyingKey)
                        if (!keysMatchExpected) {
                            reject (new Error(`Cached keys do not match expected keys for ${keyId}`));
                        }
                    }
                    resolve([provingKey, verifyingKey]);
                } else {
                    reject(new Error("Keys not found in cache for " + keyId));
                }
            }
        });
    };

    /**
     * Determines if the keys for a given credits function match the expected keys.
     *
     * @returns {boolean} Whether the keys match the expected keys
     */
    verifyCreditsKeys(locator: string, provingKey: ProvingKey, verifyingKey: VerifyingKey): boolean {
        switch (locator) {
            case CREDITS_PROGRAM_KEYS.bond_public.locator:
                return provingKey.isBondPublicProver() && verifyingKey.isBondPublicVerifier();
            case CREDITS_PROGRAM_KEYS.claim_unbond_public.locator:
                return provingKey.isClaimUnbondPublicProver() && verifyingKey.isClaimUnbondPublicVerifier();
            case CREDITS_PROGRAM_KEYS.fee_private.locator:
                return provingKey.isFeePrivateProver() && verifyingKey.isFeePrivateVerifier();
            case CREDITS_PROGRAM_KEYS.fee_public.locator:
                return provingKey.isFeePublicProver() && verifyingKey.isFeePublicVerifier();
            case CREDITS_PROGRAM_KEYS.inclusion.locator:
                return provingKey.isInclusionProver() && verifyingKey.isInclusionVerifier();
            case CREDITS_PROGRAM_KEYS.join.locator:
                return provingKey.isJoinProver() && verifyingKey.isJoinVerifier();
            case CREDITS_PROGRAM_KEYS.set_validator_state.locator:
                return provingKey.isSetValidatorStateProver() && verifyingKey.isSetValidatorStateVerifier();
            case CREDITS_PROGRAM_KEYS.split.locator:
                return provingKey.isSplitProver() && verifyingKey.isSplitVerifier();
            case CREDITS_PROGRAM_KEYS.transfer_private.locator:
                return provingKey.isTransferPrivateProver() && verifyingKey.isTransferPrivateVerifier();
            case CREDITS_PROGRAM_KEYS.transfer_private_to_public.locator:
                return provingKey.isTransferPrivateToPublicProver() && verifyingKey.isTransferPrivateToPublicVerifier();
            case CREDITS_PROGRAM_KEYS.transfer_public.locator:
                return provingKey.isTransferPublicProver() && verifyingKey.isTransferPublicVerifier();
            case CREDITS_PROGRAM_KEYS.transfer_public_to_private.locator:
                return provingKey.isTransferPublicToPrivateProver() && verifyingKey.isTransferPublicToPrivateVerifier();
            case CREDITS_PROGRAM_KEYS.unbond_delegator_as_validator.locator:
                return provingKey.isUnbondDelegatorAsValidatorProver() && verifyingKey.isUnbondDelegatorAsValidatorVerifier();
            case CREDITS_PROGRAM_KEYS.unbond_public.locator:
                return provingKey.isUnbondPublicProver() && verifyingKey.isUnbondPublicVerifier();
            default:
                return false;
        }
    }

    /**
     * Get fee_private function keys from the credits.aleo program. The keys must be cached prior to calling this
     * method for it to work.
     *
     * @returns {Promise<FunctionKeyPair | Error>} Proving and verifying keys for the join function
     */
    feePrivateKeys(): Promise<FunctionKeyPair | Error> {
        return this.functionKeys(OfflineSearchParams.feePrivateKeyParams());
    };

    /**
     * Get fee_public function keys from the credits.aleo program. The keys must be cached prior to calling this
     * method for it to work.
     *
     * @returns {Promise<FunctionKeyPair | Error>} Proving and verifying keys for the join function
     */
    feePublicKeys(): Promise<FunctionKeyPair | Error> {
        return this.functionKeys(OfflineSearchParams.feePublicKeyParams());
    };

    /**
     * Get join function keys from the credits.aleo program. The keys must be cached prior to calling this
     * method for it to work.
     *
     * @returns {Promise<FunctionKeyPair | Error>} Proving and verifying keys for the join function
     */
    joinKeys(): Promise<FunctionKeyPair | Error> {
        return this.functionKeys(OfflineSearchParams.joinKeyParams());
    };

    /**
     * Get split function keys from the credits.aleo program. The keys must be cached prior to calling this
     * method for it to work.
     *
     * @returns {Promise<FunctionKeyPair | Error>} Proving and verifying keys for the join function
     */
    splitKeys(): Promise<FunctionKeyPair | Error> {
        return this.functionKeys(OfflineSearchParams.splitKeyParams());
    };

    /**
     * Get keys for a variant of the transfer function from the credits.aleo program.
     *
     *
     * @param {string} visibility Visibility of the transfer function (private, public, privateToPublic, publicToPrivate)
     * @returns {Promise<FunctionKeyPair | Error>} Proving and verifying keys for the specified transfer function
     *
     * @example
     * // Create a new object which implements the KeyProvider interface
     * const networkClient = new AleoNetworkClient("https://api.explorer.aleo.org/v1");
     * const offlineKeyProvider = new OfflineKeyProvider();
     *
     * // Cache the keys for future use with the official locator
     * const transferPublicVerifyingKey = VerifyingKey.fromString("transferPrivateVerifier");
     * const transferPublicProvingKeyBytes = await readBinaryFile('./resources/transfer_public.prover.a74565e');
     * const transferPublicProvingKey = ProvingKey.fromBytes(transferPublicProvingKeyBytes);
     *
     * offlineKeyProvider.cacheKeys(CREDITS_PROGRAM_KEYS.transfer_public.locator, [transferPublicProvingKey, transferPublicVerifyingKey]);
     *
     * /// When they're needed, retrieve the keys from the cache
     * const [transferPublicProvingKey, transferPublicVerifyingKey] = await keyProvider.transferKeys("public");
     */
    transferKeys(visibility: string): Promise<FunctionKeyPair | Error> {
        if (PRIVATE_TRANSFER.has(visibility)) {
            return this.functionKeys(OfflineSearchParams.transferPrivateKeyParams());
        } else if (PRIVATE_TO_PUBLIC_TRANSFER.has(visibility)) {
            return this.functionKeys(OfflineSearchParams.transferPrivateToPublicKeyParams());
        } else if (PUBLIC_TRANSFER.has(visibility)) {
            return this.functionKeys(OfflineSearchParams.transferPublicKeyParams());
        } else if (PUBLIC_TO_PRIVATE_TRANSFER.has(visibility)) {
            return this.functionKeys(OfflineSearchParams.transferPublicToPrivateKeyParams());
        } else {
            throw new Error("Invalid visibility type");
        }
    };

    /**
     * Get unbond_public function keys from the credits.aleo program
     *
     * @returns {Promise<FunctionKeyPair | Error>} Proving and verifying keys for the join function
     */
    async unBondPublicKeys(): Promise<FunctionKeyPair | Error> {
        return this.functionKeys(OfflineSearchParams.unbondPublicKeyParams());
    };

    /**
     * Insert the proving and verifying keys for the bond_public function into the cache. Only the proving key needs
     * to be inserted, the verifying key is automatically inserted by the SDK. This function will automatically check
     * that the keys match the expected checksum for bond_public before inserting them into the cache.
     *
     * @param provingKey
     */
    insertBondPublicKeys(provingKey: ProvingKey) {
        if (provingKey.isBondPublicProver()) {
            this.cache.set(CREDITS_PROGRAM_KEYS.bond_public.locator, [provingKey.toBytes(), VerifyingKey.bondPublicVerifier().toBytes()]);
        } else {
            throw new Error("Attempted to insert invalid proving keys for bond_public");
        }
    }

    /**
     * Insert the proving and verifying keys for the claim_unbond_public function into the cache. Only the proving key needs
     * to be inserted, the verifying key is automatically inserted by the SDK. This function will automatically check
     * that the keys match the expected checksum for claim_unbond_public before inserting them into the cache.
     *
     * @param provingKey
     */
    insertClaimUnbondPublicKeys(provingKey: ProvingKey) {
        if (provingKey.isClaimUnbondPublicProver()) {
            this.cache.set(CREDITS_PROGRAM_KEYS.claim_unbond_public.locator, [provingKey.toBytes(), VerifyingKey.claimUnbondPublicVerifier().toBytes()]);
        } else {
            throw new Error("Attempted to insert invalid proving keys for claim_unbond_public");
        }
    }

    /**
     * Insert the proving and verifying keys for the fee_private function into the cache. Only the proving key needs
     * to be inserted, the verifying key is automatically inserted by the SDK. This function will automatically check
     * that the keys match the expected checksum for fee_private before inserting them into the cache.
     *
     * @param provingKey
     */
    insertFeePrivateKeys(provingKey: ProvingKey) {
        if (provingKey.isFeePrivateProver()) {
            this.cache.set(CREDITS_PROGRAM_KEYS.fee_private.locator, [provingKey.toBytes(), VerifyingKey.feePrivateVerifier().toBytes()]);
        } else {
            throw new Error("Attempted to insert invalid proving keys for fee_private");
        }
    }

    /**
     * Insert the proving and verifying keys for the fee_public function into the cache. Only the proving key needs
     * to be inserted, the verifying key is automatically inserted by the SDK. This function will automatically check
     * that the keys match the expected checksum for fee_public before inserting them into the cache.
     *
     * @param provingKey
     */
    insertFeePublicKeys(provingKey: ProvingKey) {
        if (provingKey.isFeePublicProver()) {
            this.cache.set(CREDITS_PROGRAM_KEYS.fee_public.locator, [provingKey.toBytes(), VerifyingKey.feePublicVerifier().toBytes()]);
        } else {
            throw new Error("Attempted to insert invalid proving keys for fee_public");
        }
    }

    /**
     * Insert the proving and verifying keys for the join function into the cache. Only the proving key needs
     * to be inserted, the verifying key is automatically inserted by the SDK. This function will automatically check
     * that the keys match the expected checksum for join before inserting them into the cache.
     *
     * @param provingKey
     */
    insertJoinKeys(provingKey: ProvingKey) {
        if (provingKey.isJoinProver()) {
            this.cache.set(CREDITS_PROGRAM_KEYS.join.locator, [provingKey.toBytes(), VerifyingKey.joinVerifier().toBytes()]);
        } else {
            throw new Error("Attempted to insert invalid proving keys for join");
        }
    }

    /**
     * Insert the proving and verifying keys for the set_validator_state function into the cache. Only the proving key needs
     * to be inserted, the verifying key is automatically inserted by the SDK. This function will automatically check
     * that the keys match the expected checksum for set_validator_state before inserting them into the cache.
     *
     * @param provingKey
     */
    insertSetValidatorStateKeys(provingKey: ProvingKey) {
        if (provingKey.isSetValidatorStateProver()) {
            this.cache.set(CREDITS_PROGRAM_KEYS.set_validator_state.locator, [provingKey.toBytes(), VerifyingKey.setValidatorStateVerifier().toBytes()]);
        } else {
            throw new Error("Attempted to insert invalid proving keys for set_validator_state");
        }
    }

    /**
     * Insert the proving and verifying keys for the split function into the cache. Only the proving key needs
     * to be inserted, the verifying key is automatically inserted by the SDK. This function will automatically check
     * that the keys match the expected checksum for split before inserting them into the cache.
     *
     * @param provingKey
     */
    insertSplitKeys(provingKey: ProvingKey) {
        if (provingKey.isSplitProver()) {
            this.cache.set(CREDITS_PROGRAM_KEYS.split.locator, [provingKey.toBytes(), VerifyingKey.splitVerifier().toBytes()]);
        } else {
            throw new Error("Attempted to insert invalid proving keys for split");
        }
    }

    /**
     * Insert the proving and verifying keys for the transfer_private function into the cache. Only the proving key needs
     * to be inserted, the verifying key is automatically inserted by the SDK. This function will automatically check
     * that the keys match the expected checksum for transfer_private before inserting them into the cache.
     *
     * @param provingKey
     */
    insertTransferPrivateKeys(provingKey: ProvingKey) {
        if (provingKey.isTransferPrivateProver()) {
            this.cache.set(CREDITS_PROGRAM_KEYS.transfer_private.locator, [provingKey.toBytes(), VerifyingKey.transferPrivateVerifier().toBytes()]);
        } else {
            throw new Error("Attempted to insert invalid proving keys for transfer_private");
        }
    }

    /**
     * Insert the proving and verifying keys for the transfer_private_to_public function into the cache. Only the proving key needs
     * to be inserted, the verifying key is automatically inserted by the SDK. This function will automatically check
     * that the keys match the expected checksum for transfer_private_to_public before inserting them into the cache.
     *
     * @param provingKey
     */
    insertTransferPrivateToPublicKeys(provingKey: ProvingKey) {
        if (provingKey.isTransferPrivateToPublicProver()) {
            this.cache.set(CREDITS_PROGRAM_KEYS.transfer_private_to_public.locator, [provingKey.toBytes(), VerifyingKey.transferPrivateToPublicVerifier().toBytes()]);
        } else {
            throw new Error("Attempted to insert invalid proving keys for transfer_private_to_public");
        }
    }

    /**
     * Insert the proving and verifying keys for the transfer_public function into the cache. Only the proving key needs
     * to be inserted, the verifying key is automatically inserted by the SDK. This function will automatically check
     * that the keys match the expected checksum for transfer_public before inserting them into the cache.
     *
     * @param provingKey
     */
    insertTransferPublicKeys(provingKey: ProvingKey) {
        if (provingKey.isTransferPublicProver()) {
            this.cache.set(CREDITS_PROGRAM_KEYS.transfer_public.locator, [provingKey.toBytes(), VerifyingKey.transferPublicVerifier().toBytes()]);
        } else {
            throw new Error("Attempted to insert invalid proving keys for transfer_public");
        }
    }

    /**
     * Insert the proving and verifying keys for the transfer_public_to_private function into the cache. Only the proving key needs
     * to be inserted, the verifying key is automatically inserted by the SDK. This function will automatically check
     * that the keys match the expected checksum for transfer_public_to_private before inserting them into the cache.
     *
     * @param provingKey
     */
    insertTransferPublicToPrivateKeys(provingKey: ProvingKey) {
        if (provingKey.isTransferPublicToPrivateProver()) {
            this.cache.set(CREDITS_PROGRAM_KEYS.transfer_public_to_private.locator, [provingKey.toBytes(), VerifyingKey.transferPublicToPrivateVerifier().toBytes()]);
        } else {
            throw new Error("Attempted to insert invalid proving keys for transfer_public_to_private");
        }
    }

    insertUnbondDelegatorAsValidatorKeys(provingKey: ProvingKey) {
        if (provingKey.isUnbondDelegatorAsValidatorProver()) {
            this.cache.set(CREDITS_PROGRAM_KEYS.unbond_delegator_as_validator.locator, [provingKey.toBytes(), VerifyingKey.unbondDelegatorAsValidatorVerifier().toBytes()]);
        } else {
            throw new Error("Attempted to insert invalid proving keys for unbond_delegator_as_validator");
        }
    }

    insertUnbondPublicKeys(provingKey: ProvingKey) {
        if (provingKey.isUnbondPublicProver()) {
            this.cache.set(CREDITS_PROGRAM_KEYS.unbond_public.locator, [provingKey.toBytes(), VerifyingKey.unbondPublicVerifier().toBytes()]);
        } else {
            throw new Error("Attempted to insert invalid proving keys for unbond_public");
        }
    }
}


export {OfflineKeyProvider, OfflineSearchParams}
