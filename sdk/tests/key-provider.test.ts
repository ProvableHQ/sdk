import {AleoKeyProvider, CachedKeyPair, CREDITS_PROGRAM_KEYS, FunctionKeyPair, ProvingKey, VerifyingKey} from "../src/node";
import {jest} from '@jest/globals'
jest.retryTimes(3);

describe('KeyProvider', () => {
    let keyProvider: AleoKeyProvider;

    beforeEach(() => {
        keyProvider = new AleoKeyProvider();
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
            const [provingKey, verifyingKey] = <FunctionKeyPair>await keyProvider.transferKeys("private");
            expect(keyProvider.cache.size).toBe(1);
            expect(provingKey).toBeInstanceOf(ProvingKey);
            expect(verifyingKey).toBeInstanceOf(VerifyingKey);
            const transferCacheKey = keyProvider.cache.keys().next().value;
            const [cachedProvingKey, cachedVerifyingKey] = <CachedKeyPair>keyProvider.cache.get(transferCacheKey);
            expect(cachedProvingKey).toBeInstanceOf(Uint8Array);
            expect(cachedVerifyingKey).toBeInstanceOf(Uint8Array);

            // Ensure the functionKeys method to get the keys and that the cache is used to do so
            const [fetchedProvingKey, fetchedVerifyingKey] = <FunctionKeyPair>await keyProvider.fetchKeys(CREDITS_PROGRAM_KEYS.transfer_private.prover, CREDITS_PROGRAM_KEYS.transfer_private.verifier)
            expect(keyProvider.cache.size).toBe(1);
            expect(fetchedProvingKey).toBeInstanceOf(ProvingKey);
            expect(fetchedVerifyingKey).toBeInstanceOf(VerifyingKey);

            // Clear the cache and turn it off to ensure the keys are redownloaded and the cache is not used
            keyProvider.clearCache();
            keyProvider.useCache(false);
            const [redownloadedProvingKey, redownloadedVerifyingKey] = <FunctionKeyPair>await keyProvider.transferKeys("private");
            expect(keyProvider.cache.size).toBe(0);
            expect(redownloadedProvingKey).toBeInstanceOf(ProvingKey);
            expect(redownloadedVerifyingKey).toBeInstanceOf(VerifyingKey);
        }, 200000);
    });
});
