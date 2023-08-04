import {AleoKeyProvider, CREDITS_PROGRAM_KEYS} from "../src";
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
            const downloadedKeys = await keyProvider.transferKeys("private");
            const cachedKey = keyProvider.cache.keys().next().value;
            const cachedKeys = keyProvider.cache.get(cachedKey);
            expect(downloadedKeys).toEqual(cachedKeys);

            // Ensure the functionKeys method to get the keys and that the cache is used to do so
            const cachedKeys2 = await keyProvider.functionKeys(CREDITS_PROGRAM_KEYS.transfer_private.prover, CREDITS_PROGRAM_KEYS.transfer_private.verifier)
            expect(cachedKeys2).toEqual(cachedKeys);
            expect(keyProvider.cache.size).toBe(1);

            // Clear the cache and turn it off to ensure the keys are redownloaded and the cache is not used
            keyProvider.clearCache();
            keyProvider.useCache(false);
            const redownloadedKeys = await keyProvider.transferKeys("private");
            expect(keyProvider.cache.size).toBe(0);
            expect(redownloadedKeys).toEqual(downloadedKeys);
        }, 60000);
    });
});