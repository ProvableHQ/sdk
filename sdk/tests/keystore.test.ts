import { expect } from "chai";
import { describe, it, beforeEach, afterEach } from "mocha";
import * as fs from "node:fs/promises";
import * as path from "path";
import {
    AleoKeyProvider,
    LocalFileKeyStore,
    OfflineKeyProvider,
    promoteMapToKeyStore,
    CachedKeyPair,
    FunctionKeyPair,
    ProvingKey,
    VerifyingKey,
    KeyStore,
    CREDITS_PROGRAM_KEYS
} from "../src/node.js";

describe('KeyStore', () => {
    describe('LocalFileKeyStore', () => {
        let keyStore: LocalFileKeyStore;
        let testDir: string;

        beforeEach(async () => {
            // Create a unique test directory for each test
            testDir = path.join(process.cwd(), `test-keystore-${Date.now()}`);
            keyStore = new LocalFileKeyStore(testDir);
            // Ensure the directory exists
            await fs.mkdir(testDir, { recursive: true });
        });

        afterEach(async () => {
            // Clean up test directory after each test
            try {
                await fs.rm(testDir, { recursive: true, force: true });
            } catch (error) {
                // Ignore cleanup errors
            }
        });

        describe('setKeysRaw and getKeysRaw', () => {
            it('should store and retrieve raw key bytes', async () => {
                const locator = "test.aleo/function1";
                const proverBytes = new Uint8Array([1, 2, 3, 4, 5]);
                const verifierBytes = new Uint8Array([6, 7, 8, 9, 10]);
                const keyPair: CachedKeyPair = [proverBytes, verifierBytes];

                // Store the keys
                await keyStore.setKeysRaw(locator, keyPair);

                // Retrieve the keys
                const retrievedKeys = await keyStore.getKeysRaw(locator);

                // Verify the keys were stored and retrieved correctly
                expect(retrievedKeys).to.not.be.null;
                expect(retrievedKeys![0]).to.deep.equal(proverBytes);
                expect(retrievedKeys![1]).to.deep.equal(verifierBytes);
            });

            it('should return null for non-existent keys', async () => {
                const locator = "nonexistent.aleo/function";
                const retrievedKeys = await keyStore.getKeysRaw(locator);

                expect(retrievedKeys).to.be.null;
            });
        });

        describe('getProvingKeyRaw and getVerifyingKeyRaw', () => {
            it('should retrieve individual raw key bytes', async () => {
                const locator = "test.aleo/function2";
                const proverBytes = new Uint8Array([11, 12, 13, 14, 15]);
                const verifierBytes = new Uint8Array([16, 17, 18, 19, 20]);
                const keyPair: CachedKeyPair = [proverBytes, verifierBytes];

                await keyStore.setKeysRaw(locator, keyPair);

                const retrievedProver = await keyStore.getProvingKeyRaw(locator);
                const retrievedVerifier = await keyStore.getVerifyingKeyRaw(locator);

                expect(retrievedProver).to.not.be.null;
                expect(retrievedVerifier).to.not.be.null;
                expect(retrievedProver!).to.deep.equal(proverBytes);
                expect(retrievedVerifier!).to.deep.equal(verifierBytes);
            });

            it('should return null for non-existent individual keys', async () => {
                const locator = "nonexistent.aleo/function2";

                const retrievedProver = await keyStore.getProvingKeyRaw(locator);
                const retrievedVerifier = await keyStore.getVerifyingKeyRaw(locator);

                expect(retrievedProver).to.be.null;
                expect(retrievedVerifier).to.be.null;
            });
        });

        describe('has', () => {
            it('should return true if both keys exist', async () => {
                const locator = "test.aleo/function3";
                const proverBytes = new Uint8Array([21, 22, 23]);
                const verifierBytes = new Uint8Array([24, 25, 26]);
                const keyPair: CachedKeyPair = [proverBytes, verifierBytes];

                await keyStore.setKeysRaw(locator, keyPair);

                const exists = await keyStore.has(locator);
                expect(exists).to.be.true;
            });

            it('should return false if keys do not exist', async () => {
                const locator = "nonexistent.aleo/function3";

                const exists = await keyStore.has(locator);
                expect(exists).to.be.false;
            });

            it('should return false if only prover key exists', async () => {
                const locator = "test.aleo/function4";
                const proverPath = path.join(testDir, `${locator}.prover`);
                
                await fs.writeFile(proverPath, new Uint8Array([1, 2, 3]));

                const exists = await keyStore.has(locator);
                expect(exists).to.be.false;
            });

            it('should return false if only verifier key exists', async () => {
                const locator = "test.aleo/function5";
                const verifierPath = path.join(testDir, `${locator}.verifier`);
                
                await fs.writeFile(verifierPath, new Uint8Array([1, 2, 3]));

                const exists = await keyStore.has(locator);
                expect(exists).to.be.false;
            });
        });

        describe('delete', () => {
            it('should delete both keys', async () => {
                const locator = "test.aleo/function6";
                const proverBytes = new Uint8Array([31, 32, 33]);
                const verifierBytes = new Uint8Array([34, 35, 36]);
                const keyPair: CachedKeyPair = [proverBytes, verifierBytes];

                await keyStore.setKeysRaw(locator, keyPair);
                
                let exists = await keyStore.has(locator);
                expect(exists).to.be.true;

                await keyStore.delete(locator);

                exists = await keyStore.has(locator);
                expect(exists).to.be.false;
            });

            it('should not throw error when deleting non-existent keys', async () => {
                const locator = "nonexistent.aleo/function6";

                // Should not throw
                await keyStore.delete(locator);
            });
        });

        describe('clear', () => {
            it('should clear all keys from the keystore', async () => {
                const locator1 = "test.aleo/function7";
                const locator2 = "test.aleo/function8";
                const locator3 = "test.aleo/function9";

                const keyPair1: CachedKeyPair = [new Uint8Array([41, 42]), new Uint8Array([43, 44])];
                const keyPair2: CachedKeyPair = [new Uint8Array([45, 46]), new Uint8Array([47, 48])];
                const keyPair3: CachedKeyPair = [new Uint8Array([49, 50]), new Uint8Array([51, 52])];

                await keyStore.setKeysRaw(locator1, keyPair1);
                await keyStore.setKeysRaw(locator2, keyPair2);
                await keyStore.setKeysRaw(locator3, keyPair3);

                // Verify all keys exist
                expect(await keyStore.has(locator1)).to.be.true;
                expect(await keyStore.has(locator2)).to.be.true;
                expect(await keyStore.has(locator3)).to.be.true;

                // Clear all keys
                await keyStore.clear();

                // Verify all keys are gone
                expect(await keyStore.has(locator1)).to.be.false;
                expect(await keyStore.has(locator2)).to.be.false;
                expect(await keyStore.has(locator3)).to.be.false;
            });

            it('should not clear non-key files', async () => {
                const locator = "test.aleo/function10";
                const keyPair: CachedKeyPair = [new Uint8Array([53, 54]), new Uint8Array([55, 56])];
                const otherFilePath = path.join(testDir, "other-file.txt");

                await keyStore.setKeysRaw(locator, keyPair);
                await fs.writeFile(otherFilePath, "test data");

                await keyStore.clear();

                // Key files should be deleted
                expect(await keyStore.has(locator)).to.be.false;

                // Other file should still exist
                const otherFileExists = await fs.access(otherFilePath)
                    .then(() => true)
                    .catch(() => false);
                expect(otherFileExists).to.be.true;
            });
        });

        describe.skip('setKeys and getKeys with real ProvingKey/VerifyingKey', () => {
            it('should store and retrieve keys as ProvingKey/VerifyingKey objects', async function() {
                // This test requires downloading real keys from the network
                // Skip by default but can be run individually
                this.timeout(30000);

                const keyProvider = new AleoKeyProvider();
                keyProvider.useCache(true);
                
                // Fetch real keys from the network
                const [provingKey, verifyingKey] = await keyProvider.feePublicKeys();
                
                const locator = CREDITS_PROGRAM_KEYS.fee_public.locator;
                const keyPair: FunctionKeyPair = [provingKey, verifyingKey];

                // Store the keys
                await keyStore.setKeys(locator, keyPair);

                // Verify keys exist
                expect(await keyStore.has(locator)).to.be.true;

                // Retrieve the keys
                const retrievedKeys = await keyStore.getKeys(locator);

                expect(retrievedKeys).to.not.be.null;
                expect(retrievedKeys![0]).to.be.instanceOf(ProvingKey);
                expect(retrievedKeys![1]).to.be.instanceOf(VerifyingKey);
                
                // Verify checksums match
                expect(retrievedKeys![0].checksum()).to.equal(provingKey.checksum());
                expect(retrievedKeys![1].checksum()).to.equal(verifyingKey.checksum());
            });

            it('should retrieve individual ProvingKey and VerifyingKey', async function() {
                this.timeout(30000);

                const keyProvider = new AleoKeyProvider();
                keyProvider.useCache(true);
                
                const [provingKey, verifyingKey] = await keyProvider.feePublicKeys();
                
                const locator = CREDITS_PROGRAM_KEYS.fee_public.locator;
                const keyPair: FunctionKeyPair = [provingKey, verifyingKey];

                await keyStore.setKeys(locator, keyPair);

                const retrievedProver = await keyStore.getProvingKey(locator);
                const retrievedVerifier = await keyStore.getVerifyingKey(locator);

                expect(retrievedProver).to.not.be.null;
                expect(retrievedVerifier).to.not.be.null;
                expect(retrievedProver!).to.be.instanceOf(ProvingKey);
                expect(retrievedVerifier!).to.be.instanceOf(VerifyingKey);
                expect(retrievedProver!.checksum()).to.equal(provingKey.checksum());
                expect(retrievedVerifier!.checksum()).to.equal(verifyingKey.checksum());
            });
        });
    });

    describe('promoteMapToKeyStore', () => {
        let memoryStore: KeyStore;
        let backingMap: Map<string, CachedKeyPair>;

        beforeEach(() => {
            backingMap = new Map<string, CachedKeyPair>();
            memoryStore = promoteMapToKeyStore(backingMap);
        });

        describe('setKeysRaw and getKeysRaw', () => {
            it('should store and retrieve raw key bytes from memory', async () => {
                const locator = "test.aleo/memfunction1";
                const proverBytes = new Uint8Array([61, 62, 63]);
                const verifierBytes = new Uint8Array([64, 65, 66]);
                const keyPair: CachedKeyPair = [proverBytes, verifierBytes];

                await memoryStore.setKeysRaw(locator, keyPair);

                const retrievedKeys = await memoryStore.getKeysRaw(locator);

                expect(retrievedKeys).to.not.be.null;
                expect(retrievedKeys![0]).to.deep.equal(proverBytes);
                expect(retrievedKeys![1]).to.deep.equal(verifierBytes);
            });

            it('should return null for non-existent keys', async () => {
                const locator = "nonexistent.aleo/memfunction";
                const retrievedKeys = await memoryStore.getKeysRaw(locator);

                expect(retrievedKeys).to.be.null;
            });
        });

        describe('getProvingKeyRaw and getVerifyingKeyRaw', () => {
            it('should retrieve individual raw key bytes', async () => {
                const locator = "test.aleo/memfunction2";
                const proverBytes = new Uint8Array([71, 72, 73]);
                const verifierBytes = new Uint8Array([74, 75, 76]);
                const keyPair: CachedKeyPair = [proverBytes, verifierBytes];

                await memoryStore.setKeysRaw(locator, keyPair);

                const retrievedProver = await memoryStore.getProvingKeyRaw(locator);
                const retrievedVerifier = await memoryStore.getVerifyingKeyRaw(locator);

                expect(retrievedProver).to.not.be.null;
                expect(retrievedVerifier).to.not.be.null;
                expect(retrievedProver!).to.deep.equal(proverBytes);
                expect(retrievedVerifier!).to.deep.equal(verifierBytes);
            });

            it('should return null for non-existent individual keys', async () => {
                const locator = "nonexistent.aleo/memfunction2";

                const retrievedProver = await memoryStore.getProvingKeyRaw(locator);
                const retrievedVerifier = await memoryStore.getVerifyingKeyRaw(locator);

                expect(retrievedProver).to.be.null;
                expect(retrievedVerifier).to.be.null;
            });
        });

        describe('has', () => {
            it('should return true if keys exist', async () => {
                const locator = "test.aleo/memfunction3";
                const keyPair: CachedKeyPair = [new Uint8Array([81]), new Uint8Array([82])];

                await memoryStore.setKeysRaw(locator, keyPair);

                const exists = await memoryStore.has(locator);
                expect(exists).to.be.true;
            });

            it('should return false if keys do not exist', async () => {
                const locator = "nonexistent.aleo/memfunction3";

                const exists = await memoryStore.has(locator);
                expect(exists).to.be.false;
            });
        });

        describe('delete', () => {
            it('should delete keys', async () => {
                const locator = "test.aleo/memfunction4";
                const keyPair: CachedKeyPair = [new Uint8Array([91]), new Uint8Array([92])];

                await memoryStore.setKeysRaw(locator, keyPair);
                
                let exists = await memoryStore.has(locator);
                expect(exists).to.be.true;

                await memoryStore.delete(locator);

                exists = await memoryStore.has(locator);
                expect(exists).to.be.false;
            });
        });

        describe('clear', () => {
            it('should clear all keys from memory', async () => {
                const locator1 = "test.aleo/memfunction5";
                const locator2 = "test.aleo/memfunction6";
                const locator3 = "test.aleo/memfunction7";

                const keyPair1: CachedKeyPair = [new Uint8Array([101]), new Uint8Array([102])];
                const keyPair2: CachedKeyPair = [new Uint8Array([103]), new Uint8Array([104])];
                const keyPair3: CachedKeyPair = [new Uint8Array([105]), new Uint8Array([106])];

                await memoryStore.setKeysRaw(locator1, keyPair1);
                await memoryStore.setKeysRaw(locator2, keyPair2);
                await memoryStore.setKeysRaw(locator3, keyPair3);

                expect(await memoryStore.has(locator1)).to.be.true;
                expect(await memoryStore.has(locator2)).to.be.true;
                expect(await memoryStore.has(locator3)).to.be.true;

                await memoryStore.clear();

                expect(await memoryStore.has(locator1)).to.be.false;
                expect(await memoryStore.has(locator2)).to.be.false;
                expect(await memoryStore.has(locator3)).to.be.false;
            });
        });

        describe.skip('setKeys and getKeys with real ProvingKey/VerifyingKey', () => {
            it('should store and retrieve keys as ProvingKey/VerifyingKey objects', async function() {
                this.timeout(30000);

                const keyProvider = new AleoKeyProvider();
                keyProvider.useCache(true);
                
                const [provingKey, verifyingKey] = await keyProvider.feePublicKeys();
                
                const locator = CREDITS_PROGRAM_KEYS.fee_public.locator;
                const keyPair: FunctionKeyPair = [provingKey, verifyingKey];

                await memoryStore.setKeys(locator, keyPair);

                const retrievedKeys = await memoryStore.getKeys(locator);

                expect(retrievedKeys).to.not.be.null;
                expect(retrievedKeys![0]).to.be.instanceOf(ProvingKey);
                expect(retrievedKeys![1]).to.be.instanceOf(VerifyingKey);
                expect(retrievedKeys![0].checksum()).to.equal(provingKey.checksum());
                expect(retrievedKeys![1].checksum()).to.equal(verifyingKey.checksum());
            });

            it('should retrieve individual ProvingKey and VerifyingKey', async function() {
                this.timeout(30000);

                const keyProvider = new AleoKeyProvider();
                keyProvider.useCache(true);
                
                const [provingKey, verifyingKey] = await keyProvider.feePublicKeys();
                
                const locator = CREDITS_PROGRAM_KEYS.fee_public.locator;
                const keyPair: FunctionKeyPair = [provingKey, verifyingKey];

                await memoryStore.setKeys(locator, keyPair);

                const retrievedProver = await memoryStore.getProvingKey(locator);
                const retrievedVerifier = await memoryStore.getVerifyingKey(locator);

                expect(retrievedProver).to.not.be.null;
                expect(retrievedVerifier).to.not.be.null;
                expect(retrievedProver!).to.be.instanceOf(ProvingKey);
                expect(retrievedVerifier!).to.be.instanceOf(VerifyingKey);
                expect(retrievedProver!.checksum()).to.equal(provingKey.checksum());
                expect(retrievedVerifier!.checksum()).to.equal(verifyingKey.checksum());
            });
        });
    });

    describe('FunctionKeyProvider.keyStore()', () => {
        describe('AleoKeyProvider', () => {
            let keyProvider: AleoKeyProvider;

            beforeEach(() => {
                keyProvider = new AleoKeyProvider();
            });

            it('should return undefined when cache is not enabled', async () => {
                keyProvider.useCache(false);
                const keyStore = await keyProvider.keyStore();
                expect(keyStore).to.be.undefined;
            });

            it('should return a KeyStore when cache is enabled', async () => {
                keyProvider.useCache(true);
                const keyStore = await keyProvider.keyStore();
                expect(keyStore).to.not.be.undefined;
            });

            it('should allow storing and retrieving keys through keyStore', async () => {
                keyProvider.useCache(true);
                const keyStore = await keyProvider.keyStore();
                
                expect(keyStore).to.not.be.undefined;
                
                const locator = "test.aleo/function";
                const proverBytes = new Uint8Array([111, 112, 113]);
                const verifierBytes = new Uint8Array([114, 115, 116]);
                const keyPair: CachedKeyPair = [proverBytes, verifierBytes];

                await keyStore!.setKeysRaw(locator, keyPair);
                const retrievedKeys = await keyStore!.getKeysRaw(locator);

                expect(retrievedKeys).to.not.be.null;
                expect(retrievedKeys![0]).to.deep.equal(proverBytes);
                expect(retrievedKeys![1]).to.deep.equal(verifierBytes);
            });

            it('should reflect changes in both cache and keyStore', async () => {
                keyProvider.useCache(true);
                const keyStore = await keyProvider.keyStore();
                
                expect(keyStore).to.not.be.undefined;
                
                const locator = "test.aleo/sharedfunction";
                const proverBytes = new Uint8Array([121, 122, 123]);
                const verifierBytes = new Uint8Array([124, 125, 126]);
                const keyPair: CachedKeyPair = [proverBytes, verifierBytes];

                // Set via keyStore
                await keyStore!.setKeysRaw(locator, keyPair);

                // Check that it exists in the cache
                expect(keyProvider.containsKeys(locator)).to.be.true;

                // Clear via cache
                keyProvider.clearCache();

                // Verify it's gone from keyStore too
                const exists = await keyStore!.has(locator);
                expect(exists).to.be.false;
            });
        });

        describe('OfflineKeyProvider', () => {
            let offlineKeyProvider: OfflineKeyProvider;

            beforeEach(() => {
                offlineKeyProvider = new OfflineKeyProvider();
            });

            it('should always return a KeyStore', async () => {
                const keyStore = await offlineKeyProvider.keyStore();
                expect(keyStore).to.not.be.undefined;
            });

            it('should allow storing and retrieving keys through keyStore', async () => {
                const keyStore = await offlineKeyProvider.keyStore();
                
                expect(keyStore).to.not.be.undefined;
                
                const locator = "test.aleo/offlinefunction";
                const proverBytes = new Uint8Array([131, 132, 133]);
                const verifierBytes = new Uint8Array([134, 135, 136]);
                const keyPair: CachedKeyPair = [proverBytes, verifierBytes];

                await keyStore!.setKeysRaw(locator, keyPair);
                const retrievedKeys = await keyStore!.getKeysRaw(locator);

                expect(retrievedKeys).to.not.be.null;
                expect(retrievedKeys![0]).to.deep.equal(proverBytes);
                expect(retrievedKeys![1]).to.deep.equal(verifierBytes);
            });

            it('should reflect changes in both cache and keyStore', async () => {
                const keyStore = await offlineKeyProvider.keyStore();
                
                expect(keyStore).to.not.be.undefined;
                
                const locator = "test.aleo/offlineshared";
                const proverBytes = new Uint8Array([141, 142, 143]);
                const verifierBytes = new Uint8Array([144, 145, 146]);
                const keyPair: CachedKeyPair = [proverBytes, verifierBytes];

                // Set via keyStore
                await keyStore!.setKeysRaw(locator, keyPair);

                // Retrieve via functionKeys
                const hasKeys = await keyStore!.has(locator);
                expect(hasKeys).to.be.true;

                // Delete via keyStore
                await keyStore!.delete(locator);

                // Verify it's gone
                const exists = await keyStore!.has(locator);
                expect(exists).to.be.false;
            });
        });
    });
});
