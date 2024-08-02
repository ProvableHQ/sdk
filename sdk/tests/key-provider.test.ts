import {AleoKeyProvider, CachedKeyPair, CREDITS_PROGRAM_KEYS, FunctionKeyPair, OfflineKeyProvider, ProvingKey, VerifyingKey} from "../src/node";
import {jest} from '@jest/globals'
jest.retryTimes(1);

describe('KeyProvider', () => {
    let keyProvider: AleoKeyProvider;
    let offlineKeyProvider: OfflineKeyProvider;

    beforeEach(() => {
        keyProvider = new AleoKeyProvider();
        offlineKeyProvider = new OfflineKeyProvider();
    });

    describe('getKeys', () => {
        it('should not fetch invalid transfer keys', async () => {
            try {
                const keys = await keyProvider.transferKeys("invalid");
                // This should never be reached
                expect(true).toBe(false);
            } catch (e) {
                expect(e).toBeInstanceOf(Error);
            }
        }, 60000);

        it('Should use cache when set and not use it when not', async () => {
            // Ensure the cache properly downloads and stores keys
            keyProvider.useCache(true);
            const [provingKey, verifyingKey] = <FunctionKeyPair>await keyProvider.feePublicKeys();
            expect(keyProvider.cache.size).toBe(1);
            expect(provingKey).toBeInstanceOf(ProvingKey);
            expect(verifyingKey).toBeInstanceOf(VerifyingKey);
            const transferCacheKey = keyProvider.cache.keys().next().value;
            const [cachedProvingKey, cachedVerifyingKey] = <CachedKeyPair>keyProvider.cache.get(transferCacheKey);
            expect(cachedProvingKey).toBeInstanceOf(Uint8Array);
            expect(cachedVerifyingKey).toBeInstanceOf(Uint8Array);

            // Ensure the functionKeys method to get the keys and that the cache is used to do so
            const [fetchedProvingKey, fetchedVerifyingKey] = <FunctionKeyPair>await keyProvider.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.fee_public)
            expect(keyProvider.cache.size).toBe(1);
            expect(fetchedProvingKey).toBeInstanceOf(ProvingKey);
            expect(fetchedVerifyingKey).toBeInstanceOf(VerifyingKey);

            // Clear the cache and turn it off to ensure the keys are re-downloaded and the cache is not used
            keyProvider.clearCache();
            keyProvider.useCache(false);
            const [redownloadedProvingKey, redownloadedVerifyingKey] = <FunctionKeyPair>await keyProvider.feePublicKeys();
            expect(keyProvider.cache.size).toBe(0);
            expect(redownloadedProvingKey).toBeInstanceOf(ProvingKey);
            expect(redownloadedVerifyingKey).toBeInstanceOf(VerifyingKey);
        }, 200000);

        it.skip("Should not fetch offline keys that haven't already been stored", async () => {
            // Download the credits.aleo function keys
            const [bondPublicProver, bondPublicVerifier] = <FunctionKeyPair>await keyProvider.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.bond_public);
            const [claimUnbondPublicProver, claimUnbondVerifier] = <FunctionKeyPair>await keyProvider.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.claim_unbond_public);
            const [feePrivateProver, feePrivateVerifier] = <FunctionKeyPair>await keyProvider.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.fee_private);
            const [feePublicProver, feePublicVerifier] = <FunctionKeyPair>await keyProvider.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.fee_public);
            const [joinProver, joinVerifier] = <FunctionKeyPair>await keyProvider.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.join);
            const [setValidatorStateProver, setValidatorStateVerifier] = <FunctionKeyPair>await keyProvider.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.set_validator_state);
            const [splitProver, splitVerifier] = <FunctionKeyPair>await keyProvider.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.split);
            const [transferPrivateProver, transferPrivateVerifier] = <FunctionKeyPair>await keyProvider.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.transfer_private);
            const [transferPrivateToPublicProver, transferPrivateToPublicVerifier] = <FunctionKeyPair>await keyProvider.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.transfer_private_to_public);
            const [transferPublicProver, transferPublicVerifier] = <FunctionKeyPair>await keyProvider.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.transfer_public);
            const [transferPublicToPrivateProver, transferPublicToPrivateVerifier] = <FunctionKeyPair>await keyProvider.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.transfer_public_to_private);
            const [unbondPublicProver, unbondPublicVerifier] = <FunctionKeyPair>await keyProvider.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.unbond_public);

            // Ensure the insertion methods work as expected without throwing an exception
            offlineKeyProvider.insertBondPublicKeys(bondPublicProver);
            offlineKeyProvider.insertClaimUnbondPublicKeys(claimUnbondPublicProver);
            offlineKeyProvider.insertFeePrivateKeys(feePrivateProver);
            offlineKeyProvider.insertFeePublicKeys(feePublicProver);
            offlineKeyProvider.insertJoinKeys(joinProver);
            offlineKeyProvider.insertSetValidatorStateKeys(setValidatorStateProver);
            offlineKeyProvider.insertSplitKeys(splitProver);
            offlineKeyProvider.insertTransferPrivateKeys(transferPrivateProver);
            offlineKeyProvider.insertTransferPrivateToPublicKeys(transferPrivateToPublicProver);
            offlineKeyProvider.insertTransferPublicKeys(transferPublicProver);
            offlineKeyProvider.insertTransferPublicToPrivateKeys(transferPublicToPrivateProver);
            offlineKeyProvider.insertUnbondPublicKeys(unbondPublicProver);

            // Ensure the offline key provider methods for credits.aleo return the correct keys
            const [bondPublicProverLocal, bondPublicVerifierLocal] = <FunctionKeyPair>await offlineKeyProvider.bondPublicKeys();
            const [claimUnbondPublicProverLocal, claimUnbondVerifierLocal] = <FunctionKeyPair>await offlineKeyProvider.claimUnbondPublicKeys();
            const [feePrivateProverLocal, feePrivateVerifierLocal] = <FunctionKeyPair>await offlineKeyProvider.feePrivateKeys();
            const [feePublicProverLocal, feePublicVerifierLocal] = <FunctionKeyPair>await offlineKeyProvider.feePublicKeys();
            const [joinProverLocal, joinVerifierLocal] = <FunctionKeyPair>await offlineKeyProvider.joinKeys();
            const [splitProverLocal, splitVerifierLocal] = <FunctionKeyPair>await offlineKeyProvider.splitKeys();
            const [transferPrivateProverLocal, transferPrivateVerifierLocal] = <FunctionKeyPair>await offlineKeyProvider.transferKeys("private");
            const [transferPrivateToPublicProverLocal, transferPrivateToPublicVerifierLocal] = <FunctionKeyPair>await offlineKeyProvider.transferKeys("privateToPublic");
            const [transferPublicProverLocal, transferPublicVerifierLocal] = <FunctionKeyPair>await offlineKeyProvider.transferKeys("public");
            const [transferPublicToPrivateProverLocal, transferPublicToPrivateVerifierLocal] = <FunctionKeyPair>await offlineKeyProvider.transferKeys("publicToPrivate");
            const [unbondPublicProverLocal, unbondPublicVerifierLocal] = <FunctionKeyPair>await offlineKeyProvider.unBondPublicKeys();

            // Ensure the checksum of the recovered keys match those of the original keys
            expect(bondPublicProver.checksum()).toEqual(bondPublicProverLocal.checksum());
            expect(bondPublicVerifier.checksum()).toEqual(bondPublicVerifierLocal.checksum());
            expect(claimUnbondPublicProver.checksum()).toEqual(claimUnbondPublicProverLocal.checksum());
            expect(claimUnbondVerifier.checksum()).toEqual(claimUnbondVerifierLocal.checksum());
            expect(feePrivateProver.checksum()).toEqual(feePrivateProverLocal.checksum());
            expect(feePrivateVerifier.checksum()).toEqual(feePrivateVerifierLocal.checksum());
            expect(feePublicProver.checksum()).toEqual(feePublicProverLocal.checksum());
            expect(feePublicVerifier.checksum()).toEqual(feePublicVerifierLocal.checksum());
            expect(joinProver.checksum()).toEqual(joinProverLocal.checksum());
            expect(joinVerifier.checksum()).toEqual(joinVerifierLocal.checksum());
            expect(splitProver.checksum()).toEqual(splitProverLocal.checksum());
            expect(splitVerifier.checksum()).toEqual(splitVerifierLocal.checksum());
            expect(transferPrivateProver.checksum()).toEqual(transferPrivateProverLocal.checksum());
            expect(transferPrivateVerifier.checksum()).toEqual(transferPrivateVerifierLocal.checksum());
            expect(transferPrivateToPublicProver.checksum()).toEqual(transferPrivateToPublicProverLocal.checksum());
            expect(transferPrivateToPublicVerifier.checksum()).toEqual(transferPrivateToPublicVerifierLocal.checksum());
            expect(transferPublicProver.checksum()).toEqual(transferPublicProverLocal.checksum());
            expect(transferPublicVerifier.checksum()).toEqual(transferPublicVerifierLocal.checksum());
            expect(transferPublicToPrivateProver.checksum()).toEqual(transferPublicToPrivateProverLocal.checksum());
            expect(transferPublicToPrivateVerifier.checksum()).toEqual(transferPublicToPrivateVerifierLocal.checksum());
            expect(unbondPublicProver.checksum()).toEqual(unbondPublicProverLocal.checksum());
            expect(unbondPublicVerifier.checksum()).toEqual(unbondPublicVerifierLocal.checksum());

            // Ensure the recovered keys are of the correct type
            expect(bondPublicProverLocal.isBondPublicProver()).toEqual(true);
            expect(bondPublicVerifierLocal.isBondPublicVerifier()).toEqual(true);
            expect(claimUnbondPublicProverLocal.isClaimUnbondPublicProver()).toEqual(true);
            expect(claimUnbondVerifierLocal.isClaimUnbondPublicVerifier()).toEqual(true);
            expect(feePrivateProverLocal.isFeePrivateProver()).toEqual(true);
            expect(feePrivateVerifierLocal.isFeePrivateVerifier()).toEqual(true);
            expect(feePublicProverLocal.isFeePublicProver()).toEqual(true);
            expect(feePublicVerifierLocal.isFeePublicVerifier()).toEqual(true);
            expect(joinProverLocal.isJoinProver()).toEqual(true);
            expect(joinVerifierLocal.isJoinVerifier()).toEqual(true);
            expect(splitProverLocal.isSplitProver()).toEqual(true);
            expect(splitVerifierLocal.isSplitVerifier()).toEqual(true);
            expect(transferPrivateProverLocal.isTransferPrivateProver()).toEqual(true);
            expect(transferPrivateVerifierLocal.isTransferPrivateVerifier()).toEqual(true);
            expect(transferPrivateToPublicProverLocal.isTransferPrivateToPublicProver()).toEqual(true);
            expect(transferPrivateToPublicVerifierLocal.isTransferPrivateToPublicVerifier()).toEqual(true);
            expect(transferPublicProverLocal.isTransferPublicProver()).toEqual(true);
            expect(transferPublicVerifierLocal.isTransferPublicVerifier()).toEqual(true);
            expect(transferPublicToPrivateProverLocal.isTransferPublicToPrivateProver()).toEqual(true);
            expect(transferPublicToPrivateVerifierLocal.isTransferPublicToPrivateVerifier()).toEqual(true);
            expect(unbondPublicProverLocal.isUnbondPublicProver()).toEqual(true);
            expect(unbondPublicVerifierLocal.isUnbondPublicVerifier()).toEqual(true);

        }, 380000);
    });
});
