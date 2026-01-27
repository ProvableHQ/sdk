import { expect } from "chai";
import {
    AleoKeyProvider,
    CachedKeyPair,
    CREDITS_PROGRAM_KEYS,
    FunctionKeyPair,
    OfflineKeyProvider,
    ProvingKey,
    VerifyingKey,
    LocalFileKeyStore,
    promoteMapToKeyStore,
} from "../src/node.js";
import * as $fs from "node:fs/promises";

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
                expect(true).equal(false);
            } catch (e) {
                expect(e).instanceof(Error);
            }
        });
        it('Should use cache when set and not use it when not', async () => {
            // Ensure the cache properly downloads and stores keys
            keyProvider.useCache(true);

            const [provingKey, verifyingKey] = <FunctionKeyPair>await keyProvider.feePublicKeys();
            expect(keyProvider.cache.size).equal(1);
            expect(provingKey).instanceof(ProvingKey);
            expect(verifyingKey).instanceof(VerifyingKey);

            const transferCacheKey = keyProvider.cache.keys().next().value;
            const [cachedProvingKey, cachedVerifyingKey] = <CachedKeyPair>keyProvider.cache.get(transferCacheKey!);
            expect(cachedProvingKey).instanceof(Uint8Array);
            expect(cachedVerifyingKey).instanceof(Uint8Array);

            // Ensure the functionKeys method to get the keys and that the cache is used to do so
            const [fetchedProvingKey, fetchedVerifyingKey] = <FunctionKeyPair>await keyProvider.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.fee_public)
            expect(keyProvider.cache.size).equal(1);
            expect(fetchedProvingKey).instanceof(ProvingKey);
            expect(fetchedVerifyingKey).instanceof(VerifyingKey);

            // Clear the cache and turn it off to ensure the keys are re-downloaded and the cache is not used
            keyProvider.clearCache();
            keyProvider.useCache(false);
            const [redownloadedProvingKey, redownloadedVerifyingKey] = <FunctionKeyPair>await keyProvider.feePublicKeys();
            expect(keyProvider.cache.size).equal(0);
            expect(redownloadedProvingKey).instanceof(ProvingKey);
            expect(redownloadedVerifyingKey).instanceof(VerifyingKey);
        });

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
            expect(bondPublicProver.checksum()).equal(bondPublicProverLocal.checksum());
            expect(bondPublicVerifier.checksum()).equal(bondPublicVerifierLocal.checksum());
            expect(claimUnbondPublicProver.checksum()).equal(claimUnbondPublicProverLocal.checksum());
            expect(claimUnbondVerifier.checksum()).equal(claimUnbondVerifierLocal.checksum());
            expect(feePrivateProver.checksum()).equal(feePrivateProverLocal.checksum());
            expect(feePrivateVerifier.checksum()).equal(feePrivateVerifierLocal.checksum());
            expect(feePublicProver.checksum()).equal(feePublicProverLocal.checksum());
            expect(feePublicVerifier.checksum()).equal(feePublicVerifierLocal.checksum());
            expect(joinProver.checksum()).equal(joinProverLocal.checksum());
            expect(joinVerifier.checksum()).equal(joinVerifierLocal.checksum());
            expect(splitProver.checksum()).equal(splitProverLocal.checksum());
            expect(splitVerifier.checksum()).equal(splitVerifierLocal.checksum());
            expect(transferPrivateProver.checksum()).equal(transferPrivateProverLocal.checksum());
            expect(transferPrivateVerifier.checksum()).equal(transferPrivateVerifierLocal.checksum());
            expect(transferPrivateToPublicProver.checksum()).equal(transferPrivateToPublicProverLocal.checksum());
            expect(transferPrivateToPublicVerifier.checksum()).equal(transferPrivateToPublicVerifierLocal.checksum());
            expect(transferPublicProver.checksum()).equal(transferPublicProverLocal.checksum());
            expect(transferPublicVerifier.checksum()).equal(transferPublicVerifierLocal.checksum());
            expect(transferPublicToPrivateProver.checksum()).equal(transferPublicToPrivateProverLocal.checksum());
            expect(transferPublicToPrivateVerifier.checksum()).equal(transferPublicToPrivateVerifierLocal.checksum());
            expect(unbondPublicProver.checksum()).equal(unbondPublicProverLocal.checksum());
            expect(unbondPublicVerifier.checksum()).equal(unbondPublicVerifierLocal.checksum());

            // Ensure the recovered keys are of the correct type
            expect(bondPublicProverLocal.isBondPublicProver()).equal(true);
            expect(bondPublicVerifierLocal.isBondPublicVerifier()).equal(true);
            expect(claimUnbondPublicProverLocal.isClaimUnbondPublicProver()).equal(true);
            expect(claimUnbondVerifierLocal.isClaimUnbondPublicVerifier()).equal(true);
            expect(feePrivateProverLocal.isFeePrivateProver()).equal(true);
            expect(feePrivateVerifierLocal.isFeePrivateVerifier()).equal(true);
            expect(feePublicProverLocal.isFeePublicProver()).equal(true);
            expect(feePublicVerifierLocal.isFeePublicVerifier()).equal(true);
            expect(joinProverLocal.isJoinProver()).equal(true);
            expect(joinVerifierLocal.isJoinVerifier()).equal(true);
            expect(splitProverLocal.isSplitProver()).equal(true);
            expect(splitVerifierLocal.isSplitVerifier()).equal(true);
            expect(transferPrivateProverLocal.isTransferPrivateProver()).equal(true);
            expect(transferPrivateVerifierLocal.isTransferPrivateVerifier()).equal(true);
            expect(transferPrivateToPublicProverLocal.isTransferPrivateToPublicProver()).equal(true);
            expect(transferPrivateToPublicVerifierLocal.isTransferPrivateToPublicVerifier()).equal(true);
            expect(transferPublicProverLocal.isTransferPublicProver()).equal(true);
            expect(transferPublicVerifierLocal.isTransferPublicVerifier()).equal(true);
            expect(transferPublicToPrivateProverLocal.isTransferPublicToPrivateProver()).equal(true);
            expect(transferPublicToPrivateVerifierLocal.isTransferPublicToPrivateVerifier()).equal(true);
            expect(unbondPublicProverLocal.isUnbondPublicProver()).equal(true);
            expect(unbondPublicVerifierLocal.isUnbondPublicVerifier()).equal(true);
        });
    });
});

describe.only('KeyStore (memory)', () => {
    it('should set, get, has, delete, and clear using raw bytes', async () => {
        const map = new Map<string, CachedKeyPair>();
        const keystore = promoteMapToKeyStore(map);

        const locatorA = "program.aleo/function_a";
        const locatorB = "program.aleo/function_b";
        const proverBytesA = new Uint8Array([1, 2, 3, 4]);
        const verifierBytesA = new Uint8Array([5, 6, 7, 8]);
        const proverBytesB = new Uint8Array([9, 10, 11]);
        const verifierBytesB = new Uint8Array([12, 13, 14, 15]);

        // Initially absent
        expect(await keystore.has(locatorA)).equal(false);
        expect(await keystore.getKeyBytes(locatorA)).equal(null);
        expect(await keystore.getProvingKeyBytes(locatorA)).equal(null);
        expect(await keystore.getVerifyingKeyBytes(locatorA)).equal(null);

        // Insert A
        await keystore.setKeyBytes(locatorA, [proverBytesA, verifierBytesA]);
        expect(await keystore.has(locatorA)).equal(true);

        const gotA = await keystore.getKeyBytes(locatorA);
        expect(gotA).not.equal(null);
        expect(Array.from(gotA![0])).deep.equal(Array.from(proverBytesA));
        expect(Array.from(gotA![1])).deep.equal(Array.from(verifierBytesA));

        const gotAProver = await keystore.getProvingKeyBytes(locatorA);
        const gotAVerifier = await keystore.getVerifyingKeyBytes(locatorA);
        expect(Array.from(gotAProver!)).deep.equal(Array.from(proverBytesA));
        expect(Array.from(gotAVerifier!)).deep.equal(Array.from(verifierBytesA));

        // Insert B
        await keystore.setKeyBytes(locatorB, [proverBytesB, verifierBytesB]);
        expect(await keystore.has(locatorB)).equal(true);

        // Delete A
        await keystore.delete(locatorA);
        expect(await keystore.has(locatorA)).equal(false);
        expect(await keystore.getKeyBytes(locatorA)).equal(null);

        // Clear all (removes B)
        await keystore.clear();
        expect(await keystore.has(locatorB)).equal(false);
        expect(await keystore.getKeyBytes(locatorB)).equal(null);
    });

    it('should set/get ProvingKey & VerifyingKey objects and maintain byte equivalence', async () => {
        const map = new Map<string, CachedKeyPair>();
        const keystore = promoteMapToKeyStore(map);
        const locator = "credits.aleo/fee_public";

        const kp = new AleoKeyProvider();
        // Fetch a well-known pair
        const [prov, ver] = <FunctionKeyPair>await kp.feePublicKeys();

        // Store via object API
        await keystore.setKeys(locator, [prov, ver]);
        expect(await keystore.has(locator)).equal(true);

        // Retrieve objects
        const gotPair = await keystore.getKeys(locator);
        expect(gotPair).not.equal(null);
        expect(gotPair![0]).instanceof(ProvingKey);
        expect(gotPair![1]).instanceof(VerifyingKey);
        expect(gotPair![0].checksum()).equal(prov.checksum());
        expect(gotPair![1].checksum()).equal(ver.checksum());

        // Cross-check bytes
        const [bytesProv, bytesVer] = <CachedKeyPair>await keystore.getKeyBytes(locator);
        expect(Array.from(bytesProv)).deep.equal(Array.from(prov.toBytes()));
        expect(Array.from(bytesVer)).deep.equal(Array.from(ver.toBytes()));

        // Single getters
        const singleProv = await keystore.getProvingKey(locator);
        const singleVer = await keystore.getVerifyingKey(locator);
        expect(singleProv!.checksum()).equal(prov.checksum());
        expect(singleVer!.checksum()).equal(ver.checksum());

        // Delete and ensure nulls
        await keystore.delete(locator);
        expect(await keystore.getKeys(locator)).equal(null);
        expect(await keystore.getProvingKey(locator)).equal(null);
        expect(await keystore.getVerifyingKey(locator)).equal(null);
    });
});

describe.only('KeyStore (file)', () => {
    it('should set, get, has, delete, and clear using raw bytes on disk', async () => {
        // Use a unique temporary directory under the current working directory to avoid collisions.
        const tempDir = `${process.cwd()}/.keystore-test-${Date.now()}-${Math.floor(Math.random()*1e6)}`;
        const keystore = new LocalFileKeyStore(tempDir);
        try {
            // Ensure a clean starting state even if directory exists for any reason.
            await keystore.clear();
            // Proactively remove any possible leftover for these locators (nested files).
            await keystore.delete("program.aleo/function_a").catch(() => {});
            await keystore.delete("program.aleo/function_b").catch(() => {});

            const locatorA = "program.aleo/function_a";
            const locatorB = "program.aleo/function_b";
            const proverBytesA = new Uint8Array([21, 22, 23, 24, 25]);
            const verifierBytesA = new Uint8Array([26, 27]);
            const proverBytesB = new Uint8Array([31, 32]);
            const verifierBytesB = new Uint8Array([33, 34, 35]);

            // Initially absent
            expect(await keystore.has(locatorA)).equal(false);
            expect(await keystore.getKeyBytes(locatorA)).equal(null);
            expect(await keystore.getProvingKeyBytes(locatorA)).equal(null);
            expect(await keystore.getVerifyingKeyBytes(locatorA)).equal(null);

            // Insert A
            await keystore.setKeyBytes(locatorA, [proverBytesA, verifierBytesA]);
            expect(await keystore.has(locatorA)).equal(true);

            const gotA = await keystore.getKeyBytes(locatorA);
            expect(gotA).not.equal(null);
            expect((gotA![0] as Uint8Array).length).equal(proverBytesA.length);
            expect((gotA![1] as Uint8Array).length).equal(verifierBytesA.length);
            expect(Buffer.from(gotA![0] as Uint8Array).equals(Buffer.from(proverBytesA))).equal(true);
            expect(Buffer.from(gotA![1] as Uint8Array).equals(Buffer.from(verifierBytesA))).equal(true);

            const gotAProver = await keystore.getProvingKeyBytes(locatorA);
            const gotAVerifier = await keystore.getVerifyingKeyBytes(locatorA);
            expect(Buffer.from(gotAProver! as Uint8Array).equals(Buffer.from(proverBytesA))).equal(true);
            expect(Buffer.from(gotAVerifier! as Uint8Array).equals(Buffer.from(verifierBytesA))).equal(true);

            // Insert B as well
            await keystore.setKeyBytes(locatorB, [proverBytesB, verifierBytesB]);
            expect(await keystore.has(locatorB)).equal(true);

            // Delete A
            await keystore.delete(locatorA);
            expect(await keystore.has(locatorA)).equal(false);
            expect(await keystore.getKeyBytes(locatorA)).equal(null);

            // Clear all (removes B)
            await keystore.clear();
            expect(await keystore.has(locatorB)).equal(false);
            expect(await keystore.getKeyBytes(locatorB)).equal(null);
        } finally {
            await $fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
        }
    });

    it('should set/get ProvingKey & VerifyingKey objects and maintain byte equivalence on disk', async () => {
        const tempDir = `${process.cwd()}/.keystore-test-${Date.now()}-${Math.floor(Math.random()*1e6)}`;
        const keystore = new LocalFileKeyStore(tempDir);
        const locator = "credits.aleo/fee_private";
        try {
            // Ensure a clean starting state even if directory exists for any reason.
            await keystore.clear();
            await keystore.delete(locator).catch(() => {});

            const kp = new AleoKeyProvider();
            // Fetch a well-known pair
            // Use feePublic to avoid excessively large byte arrays when converting to JS arrays in tests.
            const [prov, ver] = <FunctionKeyPair>await kp.feePublicKeys();

            // Store via object API
            await keystore.setKeys(locator, [prov, ver]);
            expect(await keystore.has(locator)).equal(true);

            // Retrieve as objects
            const gotPair = await keystore.getKeys(locator);
            expect(gotPair).not.equal(null);
            expect(gotPair![0]).instanceof(ProvingKey);
            expect(gotPair![1]).instanceof(VerifyingKey);
            expect(gotPair![0].checksum()).equal(prov.checksum());
            expect(gotPair![1].checksum()).equal(ver.checksum());

            // Cross-check bytes
            const [bytesProv, bytesVer] = <CachedKeyPair>await keystore.getKeyBytes(locator);
            // Avoid large Array.from conversions; compare checksums via reconstructed keys for robustness.
            expect(ProvingKey.fromBytes(bytesProv).checksum()).equal(prov.checksum());
            expect(VerifyingKey.fromBytes(bytesVer).checksum()).equal(ver.checksum());

            // Single getters
            const singleProv = await keystore.getProvingKey(locator);
            const singleVer = await keystore.getVerifyingKey(locator);
            expect(singleProv!.checksum()).equal(prov.checksum());
            expect(singleVer!.checksum()).equal(ver.checksum());

            // Delete and ensure nulls
            await keystore.delete(locator);
            expect(await keystore.getKeys(locator)).equal(null);
            expect(await keystore.getProvingKey(locator)).equal(null);
            expect(await keystore.getVerifyingKey(locator)).equal(null);
        } finally {
            await $fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
        }
    });
});
