import { expect } from "chai";
import {
    AleoKeyProvider,
    CachedKeyPair,
    CREDITS_PROGRAM_KEYS,
    FunctionKeyPair,
    KeyFingerprint,
    KeyVerificationError,
    InvalidLocatorError,
    LocalFileKeyStore,
    MemKeyVerifier,
    OfflineKeyProvider,
    ProvingKey,
    VerifyingKey,
    sha256Hex,
} from "../src/node.js";
import * as $fs from "node:fs/promises";
import * as path from "node:path";
import { provingKeyLocator, verifyingKeyLocator, translationKeyLocator } from "../src/keys/keystore/interface.js";
import type { KeyLocator, ProvingKeyLocator, VerifyingKeyLocator } from "../src/keys/keystore/interface.js";

/** Test helper: mirrors the serialization format used by LocalFileKeyStore (checksum excluded). */
function serializeLocator(loc: KeyLocator): string {
    const base = `${loc.program}.${loc.functionName}.e${loc.edition}.a${loc.amendment}.${loc.network}.${loc.keyType}`;
    if (loc.keyType === "translation") {
        return `${base}.${loc.recordName}.${loc.recordInputPosition}`;
    }
    return base;
}

/** Helper: build a prover or verifier KeyLocator from descriptive parts. */
function locator(program: string, functionName: string, keyType: "prover", edition?: number, amendment?: number, network?: string): ProvingKeyLocator;
function locator(program: string, functionName: string, keyType: "verifier", edition?: number, amendment?: number, network?: string): VerifyingKeyLocator;
function locator(program: string, functionName: string, keyType: "prover" | "verifier", edition = 1, amendment = 0, network = "mainnet"): ProvingKeyLocator | VerifyingKeyLocator {
    return { program, functionName, edition, amendment, network, keyType } as ProvingKeyLocator | VerifyingKeyLocator;
}

describe("KeyProvider", () => {
    let keyProvider: AleoKeyProvider;
    let offlineKeyProvider: OfflineKeyProvider;

    beforeEach(() => {
        keyProvider = new AleoKeyProvider();
        offlineKeyProvider = new OfflineKeyProvider();
    });

    describe("getKeys", () => {
        it("should not fetch invalid transfer keys", async () => {
            try {
                const keys = await keyProvider.transferKeys("invalid");
                expect(true).equal(false);
            } catch (e) {
                expect(e).instanceof(Error);
            }
        });
        it("Should use cache when set and not use it when not", async () => {
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

describe("KeyStore (file) – LocalFileKeyStore", () => {
    it("getProvingKey and getVerifyingKey return null when key does not exist", async () => {
        const tempDir = `${process.cwd()}/.keystore-test-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
        const keystore = new LocalFileKeyStore(tempDir);
        try {
            expect(await keystore.getKeyBytes(locator("program.aleo", "missing", "prover"))).equal(null);
            expect(await keystore.getProvingKey(locator("program.aleo", "missing", "prover"))).equal(null);
            expect(await keystore.getVerifyingKey(locator("program.aleo", "missing", "verifier"))).equal(null);
        } finally {
            await $fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
        }
    });

    describe("locator factory functions", () => {
        it("provingKeyLocator constructs with correct fields", () => {
            const loc = provingKeyLocator("credits.aleo", "transfer_private");
            expect(loc.program).equal("credits.aleo");
            expect(loc.functionName).equal("transfer_private");
            expect(loc.keyType).equal("prover");
            expect(loc.edition).equal(1);
            expect(loc.amendment).equal(0);
        });

        it("verifyingKeyLocator constructs with correct fields", () => {
            const loc = verifyingKeyLocator("credits.aleo", "transfer_private");
            expect(loc.program).equal("credits.aleo");
            expect(loc.functionName).equal("transfer_private");
            expect(loc.keyType).equal("verifier");
            expect(loc.edition).equal(1);
            expect(loc.amendment).equal(0);
        });

        it("translationKeyLocator constructs with correct fields", () => {
            const loc = translationKeyLocator("credits.aleo", "transfer_private", "credits", 0);
            expect(loc.program).equal("credits.aleo");
            expect(loc.functionName).equal("transfer_private");
            expect(loc.keyType).equal("translation");
            expect(loc.recordName).equal("credits");
            expect(loc.recordInputPosition).equal(0);
            expect(loc.edition).equal(1);
            expect(loc.amendment).equal(0);
        });

        it("applies default edition, amendment, and network", () => {
            const loc = provingKeyLocator("prog.aleo", "func");
            expect(loc.edition).equal(1);
            expect(loc.amendment).equal(0);
            expect(loc.network).equal("%%NETWORK%%");
        });

        it("allows overriding edition, amendment, and network", () => {
            const loc = provingKeyLocator("prog.aleo", "func", 3, 2, "testnet");
            expect(loc.edition).equal(3);
            expect(loc.amendment).equal(2);
            expect(loc.network).equal("testnet");
        });

        it("provingKeyLocator passes through optional checksum", () => {
            const loc = provingKeyLocator("credits.aleo", "transfer_private", 1, 0, "mainnet", "abc123");
            expect(loc.checksum).equal("abc123");
        });

        it("verifyingKeyLocator passes through optional checksum", () => {
            const loc = verifyingKeyLocator("credits.aleo", "transfer_private", 1, 0, "mainnet", "def456");
            expect(loc.checksum).equal("def456");
        });

        it("translationKeyLocator passes through optional checksum", () => {
            const loc = translationKeyLocator("credits.aleo", "transfer_private", "credits", 0, 1, 0, "mainnet", "ghi789");
            expect(loc.checksum).equal("ghi789");
        });

        it("factory functions omit checksum when not provided", () => {
            expect(provingKeyLocator("p.aleo", "f").checksum).equal(undefined);
            expect(verifyingKeyLocator("p.aleo", "f").checksum).equal(undefined);
            expect(translationKeyLocator("p.aleo", "f", "rec", 0).checksum).equal(undefined);
        });
    });

    describe("store-level locator validation (defense-in-depth)", () => {
        const tempDir = `${process.cwd()}/.keystore-test-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
        let keystore: LocalFileKeyStore;

        before(() => {
            keystore = new LocalFileKeyStore(tempDir);
        });
        after(async () => {
            await $fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
        });

        // These tests construct raw KeyLocator objects with bad values,
        // verifying that LocalFileKeyStore catches unsafe components during serialization.
        it("throws InvalidLocatorError for program containing '..'", async () => {
            const bad: KeyLocator = { program: "a..b", functionName: "func", edition: 1, amendment: 0, network: "mainnet", keyType: "prover" };
            try {
                await keystore.getKeyBytes(bad);
                expect.fail("should throw");
            } catch (e) {
                expect(e).instanceof(InvalidLocatorError);
                expect((e as InvalidLocatorError).reason).equal("path_traversal");
            }
        });

        it("throws InvalidLocatorError for program containing '/' or '\\\\'", async () => {
            const slashLoc: KeyLocator = { program: "prog/ram", functionName: "func", edition: 1, amendment: 0, network: "mainnet", keyType: "prover" };
            try {
                await keystore.getKeyBytes(slashLoc);
                expect.fail("should throw");
            } catch (e) {
                expect(e).instanceof(InvalidLocatorError);
                expect((e as InvalidLocatorError).reason).equal("path_separator");
            }
            const backslashLoc: KeyLocator = { program: "dir\\key", functionName: "func", edition: 1, amendment: 0, network: "mainnet", keyType: "prover" };
            try {
                await keystore.has(backslashLoc);
                expect.fail("should throw");
            } catch (e) {
                expect(e).instanceof(InvalidLocatorError);
                expect((e as InvalidLocatorError).reason).equal("path_separator");
            }
        });

        it("throws InvalidLocatorError for translation key with bad recordName", async () => {
            const bad: KeyLocator = { program: "prog.aleo", functionName: "func", edition: 1, amendment: 0, network: "mainnet", keyType: "translation", recordName: "../etc", recordInputPosition: 0 };
            try {
                await keystore.getKeyBytes(bad);
                expect.fail("should throw");
            } catch (e) {
                expect(e).instanceof(InvalidLocatorError);
                expect((e as InvalidLocatorError).reason).equal("path_traversal");
            }
        });

        it("throws InvalidLocatorError for negative edition", async () => {
            const bad: KeyLocator = { program: "prog.aleo", functionName: "func", edition: -1, amendment: 0, network: "mainnet", keyType: "prover" };
            try {
                await keystore.getKeyBytes(bad);
                expect.fail("should throw");
            } catch (e) {
                expect(e).instanceof(InvalidLocatorError);
                expect((e as InvalidLocatorError).reason).equal("negative_value");
            }
        });

        it("throws InvalidLocatorError for negative amendment", async () => {
            const bad: KeyLocator = { program: "prog.aleo", functionName: "func", edition: 1, amendment: -1, network: "mainnet", keyType: "prover" };
            try {
                await keystore.getKeyBytes(bad);
                expect.fail("should throw");
            } catch (e) {
                expect(e).instanceof(InvalidLocatorError);
                expect((e as InvalidLocatorError).reason).equal("negative_value");
            }
        });

        it("throws InvalidLocatorError for negative recordInputPosition", async () => {
            const bad: KeyLocator = { program: "prog.aleo", functionName: "func", edition: 1, amendment: 0, network: "mainnet", keyType: "translation", recordName: "credits", recordInputPosition: -1 };
            try {
                await keystore.getKeyBytes(bad);
                expect.fail("should throw");
            } catch (e) {
                expect(e).instanceof(InvalidLocatorError);
                expect((e as InvalidLocatorError).reason).equal("negative_value");
            }
        });

        it("accepts locators with alphanumeric, dots, underscores, hyphens", async () => {
            expect(await keystore.getKeyBytes(locator("credits.aleo", "fee_public", "prover"))).equal(null);
            expect(await keystore.has(locator("credits.aleo", "fee_public", "prover"))).equal(false);
        });
    });

    describe("serialization format", () => {
        it("prover/verifier locators serialize with amendment", () => {
            const loc = locator("credits.aleo", "transfer_private", "prover", 1, 0, "mainnet");
            expect(serializeLocator(loc)).equal("credits.aleo.transfer_private.e1.a0.mainnet.prover");
        });

        it("translation locators serialize with record info", () => {
            const loc = translationKeyLocator("credits.aleo", "transfer_private", "credits", 0, 1, 0, "mainnet");
            expect(serializeLocator(loc)).equal("credits.aleo.transfer_private.e1.a0.mainnet.translation.credits.0");
        });

        it("checksum is excluded from serialized locator", () => {
            const loc = provingKeyLocator("credits.aleo", "transfer_private", 1, 0, "mainnet", "abc123");
            expect(serializeLocator(loc)).equal("credits.aleo.transfer_private.e1.a0.mainnet.prover");
            const tloc = translationKeyLocator("credits.aleo", "transfer_private", "credits", 0, 1, 0, "mainnet", "xyz789");
            expect(serializeLocator(tloc)).equal("credits.aleo.transfer_private.e1.a0.mainnet.translation.credits.0");
        });
    });

    describe(".aleo path behavior", () => {
        const testLocator = locator("test.aleo", "default_path", "prover", 1, 0, "mainnet");
        const testFileKey = serializeLocator(testLocator);

        it("uses process.cwd()/.aleo when no directory is passed", async () => {
            const cwd = process.cwd();
            const keystore = new LocalFileKeyStore();
            try {
                await keystore.setKeyBytes(new Uint8Array([1, 2, 3]), testLocator);
                const expectedPath = path.join(cwd, ".aleo", testFileKey);
                await $fs.access(expectedPath);
                expect(await keystore.has(testLocator)).equal(true);
            } finally {
                await $fs.rm(path.join(cwd, ".aleo"), { recursive: true, force: true }).catch(() => {});
            }
        });

        it("appends .aleo when user path does not end with .aleo", async () => {
            const base = `${process.cwd()}/.keystore-test-aleo-${Date.now()}`;
            const keystore = new LocalFileKeyStore(base);
            try {
                await keystore.setKeyBytes(new Uint8Array([1]), testLocator);
                const expectedFile = path.join(base, ".aleo", testFileKey);
                await $fs.access(expectedFile);
                const wrongPath = path.join(base, testFileKey);
                await $fs.access(wrongPath).then(
                    () => expect.fail("key should not be directly under base"),
                    () => {}
                );
            } finally {
                await $fs.rm(base, { recursive: true, force: true }).catch(() => {});
            }
        });

        it("does not append .aleo when user path already ends with .aleo", async () => {
            const base = `${process.cwd()}/.keystore-test-aleo-${Date.now()}`;
            const aleoDir = path.join(base, ".aleo");
            const keystore = new LocalFileKeyStore(aleoDir);
            try {
                await keystore.setKeyBytes(new Uint8Array([1]), testLocator);
                const expectedFile = path.join(aleoDir, testFileKey);
                await $fs.access(expectedFile);
                const doubleAleo = path.join(aleoDir, ".aleo", testFileKey);
                await $fs.access(doubleAleo).then(
                    () => expect.fail("should not create .aleo/.aleo"),
                    () => {}
                );
            } finally {
                await $fs.rm(base, { recursive: true, force: true }).catch(() => {});
            }
        });
    });

    describe("fingerprint from disk (no restart bug)", () => {
        it("getKeyBytes succeeds without caller checksum when metadata is on disk (simulated restart)", async () => {
            const tempDir = `${process.cwd()}/.keystore-test-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
            const keyBytes = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
            const loc = locator("credits.aleo", "fee_public", "prover");

            const keystore1 = new LocalFileKeyStore(tempDir);
            try {
                await keystore1.setKeyBytes(keyBytes, loc);
                const fromFirst = await keystore1.getKeyBytes(loc);
                expect(fromFirst).not.equal(null);
                expect(Buffer.from(fromFirst!).equals(Buffer.from(keyBytes))).equal(true);

                // Simulate restart: new instance, no in-memory fingerprint; verification must use disk metadata.
                const keystore2 = new LocalFileKeyStore(tempDir);
                const fromSecond = await keystore2.getKeyBytes(loc);
                expect(fromSecond).not.equal(null);
                expect(Buffer.from(fromSecond!).equals(Buffer.from(keyBytes))).equal(true);
            } finally {
                await $fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
            }
        });

        it("getProvingKey succeeds after restart when no checksum in locator", async function () {
            this.timeout(20000);
            const tempDir = `${process.cwd()}/.keystore-test-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
            const kp = new AleoKeyProvider();
            const [prov, ver] = <FunctionKeyPair>await kp.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.fee_public);
            const proverLoc = locator("credits.aleo", "fee_public", "prover");
            const verifierLoc = locator("credits.aleo", "fee_public", "verifier");

            const keystore1 = new LocalFileKeyStore(tempDir);
            try {
                await keystore1.setKeys(proverLoc, verifierLoc, [prov, ver]);
                const keystore2 = new LocalFileKeyStore(tempDir);
                const got = await keystore2.getProvingKey(proverLoc);
                expect(got).not.equal(null);
                expect(got!.checksum()).equal(prov.checksum());
            } finally {
                await $fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
            }
        });
    });

    describe("clear() removes directory", () => {
        it("removes the keystore directory so it no longer exists", async () => {
            const tempDir = `${process.cwd()}/.keystore-test-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
            const keystore = new LocalFileKeyStore(tempDir);
            const loc = locator("test.aleo", "x", "prover");
            await keystore.setKeyBytes(new Uint8Array([1]), loc);
            await $fs.access(path.join(tempDir, ".aleo", serializeLocator(loc)));
            await keystore.clear();
            try {
                await $fs.access(path.join(tempDir, ".aleo"));
                expect.fail("directory should be removed");
            } catch {
                // expected: ENOENT
            }
            await $fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
        });

        it("subsequent write recreates directory", async () => {
            const tempDir = `${process.cwd()}/.keystore-test-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
            const keystore = new LocalFileKeyStore(tempDir);
            const aLoc = locator("test.aleo", "a", "prover");
            const bLoc = locator("test.aleo", "b", "prover");
            try {
                await keystore.setKeyBytes(new Uint8Array([1]), aLoc);
                await keystore.clear();
                await keystore.setKeyBytes(new Uint8Array([2]), bLoc);
                const p = path.join(tempDir, ".aleo", serializeLocator(bLoc));
                await $fs.access(p);
                expect(await keystore.getKeyBytes(bLoc)).not.equal(null);
            } finally {
                await $fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
            }
        });
    });

    it("should set, get, has, delete, and clear using raw bytes on disk", async () => {
        const kp = new AleoKeyProvider();
        const [provA, verA] = <FunctionKeyPair>await kp.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.fee_public);
        const [provB, verB] = <FunctionKeyPair>await kp.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.join);
        const proverBytesA = provA.toBytes();
        const verifierBytesA = verA.toBytes();
        const proverBytesB = provB.toBytes();
        const verifierBytesB = verB.toBytes();

        const locAProver = locator("program.aleo", "function_a", "prover");
        const locAVerifier = locator("program.aleo", "function_a", "verifier");
        const locBProver = locator("program.aleo", "function_b", "prover");
        const locBVerifier = locator("program.aleo", "function_b", "verifier");

        const tempDir = `${process.cwd()}/.keystore-test-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
        const keystore = new LocalFileKeyStore(tempDir);
        try {
            await keystore.clear();
            await keystore.delete(locAProver).catch(() => {});
            await keystore.delete(locAVerifier).catch(() => {});
            await keystore.delete(locBProver).catch(() => {});
            await keystore.delete(locBVerifier).catch(() => {});

            expect(await keystore.has(locAProver)).equal(false);
            expect(await keystore.getKeyBytes(locAProver)).equal(null);
            expect(await keystore.getProvingKey(locAProver)).equal(null);
            expect(await keystore.getVerifyingKey(locAVerifier)).equal(null);

            await keystore.setKeyBytes(proverBytesA, locAProver);
            await keystore.setKeyBytes(verifierBytesA, locAVerifier);
            expect(await keystore.has(locAProver)).equal(true);
            expect(await keystore.has(locAVerifier)).equal(true);

            const gotProverA = await keystore.getKeyBytes(locAProver);
            const gotVerifierA = await keystore.getKeyBytes(locAVerifier);
            expect(gotProverA).not.equal(null);
            expect(gotVerifierA).not.equal(null);
            expect(Buffer.from(gotProverA!).equals(Buffer.from(proverBytesA))).equal(true);
            expect(Buffer.from(gotVerifierA!).equals(Buffer.from(verifierBytesA))).equal(true);

            await keystore.setKeyBytes(proverBytesB, locBProver);
            await keystore.setKeyBytes(verifierBytesB, locBVerifier);
            expect(await keystore.has(locBProver)).equal(true);
            expect(await keystore.has(locBVerifier)).equal(true);

            await keystore.delete(locAProver);
            await keystore.delete(locAVerifier);
            expect(await keystore.has(locAProver)).equal(false);
            expect(await keystore.has(locAVerifier)).equal(false);
            expect(await keystore.getKeyBytes(locAProver)).equal(null);

            await keystore.clear();
            expect(await keystore.has(locBProver)).equal(false);
            expect(await keystore.has(locBVerifier)).equal(false);
            expect(await keystore.getKeyBytes(locBProver)).equal(null);
        } finally {
            await $fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
        }
    });

    it("should set/get ProvingKey & VerifyingKey via setKeys and getProvingKey/getVerifyingKey", async () => {
        const tempDir = `${process.cwd()}/.keystore-test-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
        const keystore = new LocalFileKeyStore(tempDir);
        const proverLoc = locator("credits.aleo", "fee_public", "prover");
        const verifierLoc = locator("credits.aleo", "fee_public", "verifier");
        try {
            await keystore.clear();
            await keystore.delete(proverLoc).catch(() => {});
            await keystore.delete(verifierLoc).catch(() => {});

            const kp = new AleoKeyProvider();
            const [prov, ver] = <FunctionKeyPair>await kp.feePublicKeys();

            await keystore.setKeys(proverLoc, verifierLoc, [prov, ver]);
            expect(await keystore.has(proverLoc)).equal(true);
            expect(await keystore.has(verifierLoc)).equal(true);

            const gotProver = await keystore.getProvingKey(proverLoc);
            const gotVerifier = await keystore.getVerifyingKey(verifierLoc);
            expect(gotProver).not.equal(null);
            expect(gotVerifier).not.equal(null);
            expect(gotProver!).instanceof(ProvingKey);
            expect(gotVerifier!).instanceof(VerifyingKey);
            expect(gotProver!.checksum()).equal(prov.checksum());
            expect(gotVerifier!.checksum()).equal(ver.checksum());

            const proverBytes = await keystore.getKeyBytes(proverLoc);
            const verifierBytes = await keystore.getKeyBytes(verifierLoc);
            expect(proverBytes).not.equal(null);
            expect(verifierBytes).not.equal(null);
            expect(ProvingKey.fromBytes(proverBytes!).checksum()).equal(prov.checksum());
            expect(VerifyingKey.fromBytes(verifierBytes!).checksum()).equal(ver.checksum());

            await keystore.delete(proverLoc);
            await keystore.delete(verifierLoc);
            expect(await keystore.getProvingKey(proverLoc)).equal(null);
            expect(await keystore.getVerifyingKey(verifierLoc)).equal(null);
        } finally {
            await $fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
        }
    });

    it("getKeyMetadata returns fingerprint after setKeyBytes and null for missing locator", async () => {
        const kp = new AleoKeyProvider();
        const [prov] = <FunctionKeyPair>await kp.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.fee_public);
        const keyBytes = prov.toBytes();

        const tempDir = `${process.cwd()}/.keystore-test-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
        const keystore = new LocalFileKeyStore(tempDir);
        const loc = locator("program.aleo", "single_key", "prover");
        try {
            await keystore.clear();
            expect(await keystore.getKeyMetadata(loc)).equal(null);

            await keystore.setKeyBytes(keyBytes, loc);
            const meta = await keystore.getKeyMetadata(loc);
            expect(meta).not.equal(null);
            expect(meta!.checksum).to.be.a("string");
            expect(meta!.size).equal(keyBytes.length);

            await keystore.delete(loc);
            expect(await keystore.getKeyMetadata(loc)).equal(null);
        } finally {
            await $fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
        }
    });
});

describe("Key verifier (MemKeyVerifier & sha256Hex)", () => {
    describe("sha256Hex", () => {
        it("returns same hex string for same input bytes", async () => {
            const bytes = new Uint8Array([1, 2, 3, 4, 5]);
            const a = await sha256Hex(bytes);
            const b = await sha256Hex(bytes);
            expect(a).to.equal(b);
            expect(a).to.match(/^[a-f0-9]{64}$/);
        });

        it("returns different hex strings for different input bytes", async () => {
            const h1 = await sha256Hex(new Uint8Array([1, 2, 3]));
            const h2 = await sha256Hex(new Uint8Array([1, 2, 4]));
            expect(h1).not.to.equal(h2);
        });

        it("returns correct SHA-256 hash for empty input", async () => {
            const h = await sha256Hex(new Uint8Array(0));
            expect(h).to.equal("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
        });
    });

    describe("MemKeyVerifier.computeKeyMetadata", () => {
        it("returns fingerprint with checksum and size when no fingerprint provided", async () => {
            const verifier = new MemKeyVerifier();
            const bytes = new Uint8Array([10, 20, 30]);
            const meta = await verifier.computeKeyMetadata({ keyBytes: bytes });
            expect(meta.checksum).to.be.a("string");
            expect(meta.checksum).to.match(/^[a-f0-9]{64}$/);
            expect(meta.size).to.equal(3);
        });

        it("succeeds when provided fingerprint matches computed (same checksum and size)", async () => {
            const verifier = new MemKeyVerifier();
            const bytes = new Uint8Array([10, 20, 30]);
            const computed = await verifier.computeKeyMetadata({ keyBytes: bytes });
            const meta = await verifier.computeKeyMetadata({
                keyBytes: bytes,
                fingerprint: computed,
            });
            expect(meta.checksum).to.equal(computed.checksum);
            expect(meta.size).to.equal(computed.size);
        });

        it("throws KeyVerificationError (size) when fingerprint size does not match", async () => {
            const verifier = new MemKeyVerifier();
            const bytes = new Uint8Array([10, 20, 30]);
            const wrongFingerprint: KeyFingerprint = {
                checksum: (await sha256Hex(bytes)),
                size: 99,
            };
            let thrown: KeyVerificationError | undefined;
            try {
                await verifier.computeKeyMetadata({
                    keyBytes: bytes,
                    fingerprint: wrongFingerprint,
                });
            } catch (e) {
                thrown = e as KeyVerificationError;
            }
            expect(thrown).to.be.instanceOf(KeyVerificationError);
            expect(thrown!.name).to.equal("ChecksumMismatchError");
            expect(thrown!.field).to.equal("size");
            expect(thrown!.expected).to.equal("99");
            expect(thrown!.actual).to.equal("3");
        });

        it("throws KeyVerificationError (checksum) when fingerprint checksum does not match", async () => {
            const verifier = new MemKeyVerifier();
            const bytes = new Uint8Array([10, 20, 30]);
            const wrongFingerprint: KeyFingerprint = {
                checksum: "0".repeat(64),
                size: 3,
            };
            let thrown: KeyVerificationError | undefined;
            try {
                await verifier.computeKeyMetadata({
                    keyBytes: bytes,
                    fingerprint: wrongFingerprint,
                });
            } catch (e) {
                thrown = e as KeyVerificationError;
            }
            expect(thrown).to.be.instanceOf(KeyVerificationError);
            expect(thrown!.name).to.equal("ChecksumMismatchError");
            expect(thrown!.field).to.equal("checksum");
            expect(thrown!.expected).to.equal("0".repeat(64));
            expect(thrown!.actual).not.to.equal("0".repeat(64));
        });

        it("stores fingerprint when locator is provided", async () => {
            const verifier = new MemKeyVerifier();
            const bytes = new Uint8Array([1, 2, 3]);
            const meta = await verifier.computeKeyMetadata({
                keyBytes: bytes,
                locator: "my/locator",
            });
            expect(meta.size).to.equal(3);
            await verifier.verifyKeyBytes({
                keyBytes: bytes,
                locator: "my/locator",
            });
        });
    });

    describe("MemKeyVerifier.verifyKeyBytes", () => {
        it("resolves when fingerprint matches key bytes", async () => {
            const verifier = new MemKeyVerifier();
            const bytes = new Uint8Array([5, 6, 7, 8]);
            const fingerprint = await verifier.computeKeyMetadata({ keyBytes: bytes });
            await verifier.verifyKeyBytes({
                keyBytes: bytes,
                fingerprint,
            });
        });

        it("throws KeyVerificationError when size does not match stored fingerprint", async () => {
            const verifier = new MemKeyVerifier();
            const bytes = new Uint8Array([1, 2, 3]);
            await verifier.computeKeyMetadata({ keyBytes: bytes, locator: "loc" });
            const wrongBytes = new Uint8Array([1, 2]);
            let thrown: KeyVerificationError | undefined;
            try {
                await verifier.verifyKeyBytes({
                    keyBytes: wrongBytes,
                    locator: "loc",
                });
            } catch (e) {
                thrown = e as KeyVerificationError;
            }
            expect(thrown).to.be.instanceOf(KeyVerificationError);
            expect(thrown!.field).to.equal("size");
        });

        it("throws KeyVerificationError when checksum does not match (corrupted bytes)", async () => {
            const verifier = new MemKeyVerifier();
            const bytes = new Uint8Array([1, 2, 3]);
            await verifier.computeKeyMetadata({ keyBytes: bytes, locator: "loc" });
            const corruptedBytes = new Uint8Array([1, 2, 99]);
            let thrown: KeyVerificationError | undefined;
            try {
                await verifier.verifyKeyBytes({
                    keyBytes: corruptedBytes,
                    locator: "loc",
                });
            } catch (e) {
                thrown = e as KeyVerificationError;
            }
            expect(thrown).to.be.instanceOf(KeyVerificationError);
            expect(thrown!.field).to.equal("checksum");
        });

        it("throws Error when neither fingerprint nor valid locator provided", async () => {
            const verifier = new MemKeyVerifier();
            let thrown: Error | undefined;
            try {
                await verifier.verifyKeyBytes({
                    keyBytes: new Uint8Array([1, 2, 3]),
                });
            } catch (e) {
                thrown = e as Error;
            }
            expect(thrown).to.be.instanceOf(Error);
            expect(thrown!.message).to.include("fingerprint");
        });

        it("throws Error when keyBytes is missing", async () => {
            const verifier = new MemKeyVerifier();
            let thrown: Error | undefined;
            try {
                await verifier.verifyKeyBytes({
                    keyBytes: undefined as any,
                    fingerprint: { checksum: "a".repeat(64), size: 0 },
                });
            } catch (e) {
                thrown = e as Error;
            }
            expect(thrown).to.be.instanceOf(Error);
            expect(thrown!.message).to.include("Key bytes");
        });
    });
});

describe("Key verifier with LocalFileKeyStore (checksum verification on read)", () => {
    it("getKeyBytes throws KeyVerificationError when key file is corrupted after being stored", async () => {
        const kp = new AleoKeyProvider();
        const [prov] = <FunctionKeyPair>await kp.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.fee_public);
        const keyBytes = prov.toBytes();

        const tempDir = `${process.cwd()}/.keystore-test-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
        const keystore = new LocalFileKeyStore(tempDir);
        const loc = locator("credits.aleo", "corrupt_me", "prover");
        try {
            await keystore.clear();
            await keystore.delete(loc).catch(() => {});

            await keystore.setKeyBytes(keyBytes, loc);
            const readBefore = await keystore.getKeyBytes(loc);
            expect(readBefore).not.to.equal(null);
            expect(Buffer.from(readBefore!).equals(Buffer.from(keyBytes))).equal(true);

            const keyPath = path.join(tempDir, ".aleo", serializeLocator(loc));
            await $fs.writeFile(keyPath, new Uint8Array([1, 2, 3, 4, 5]));

            let thrown: KeyVerificationError | undefined;
            try {
                await keystore.getKeyBytes(loc);
            } catch (e) {
                thrown = e as KeyVerificationError;
            }
            expect(thrown).to.be.instanceOf(KeyVerificationError);
            expect(thrown!.field).to.equal("size");
        } finally {
            await $fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
        }
    });

    it("getKeyBytes succeeds when checksum in locator matches key bytes", async () => {
        const kp = new AleoKeyProvider();
        const [prov] = <FunctionKeyPair>await kp.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.fee_public);
        const keyBytes = prov.toBytes();

        const verifier = new MemKeyVerifier();
        const fingerprint = await verifier.computeKeyMetadata({ keyBytes });

        const tempDir = `${process.cwd()}/.keystore-test-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
        const keystore = new LocalFileKeyStore(tempDir);
        const loc = locator("credits.aleo", "with_checksum", "prover");
        try {
            await keystore.clear();
            await keystore.setKeyBytes(keyBytes, loc);

            // Read back with a matching checksum — verification should pass.
            const readWithChecksum = await keystore.getKeyBytes({
                ...loc,
                checksum: fingerprint.checksum,
            });
            expect(readWithChecksum).not.to.equal(null);
            expect(Buffer.from(readWithChecksum!).equals(Buffer.from(keyBytes))).equal(true);
        } finally {
            await $fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
        }
    });

    it("getKeyBytes throws KeyVerificationError when locator checksum does not match stored bytes", async () => {
        const kp = new AleoKeyProvider();
        const [prov] = <FunctionKeyPair>await kp.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.fee_public);
        const keyBytes = prov.toBytes();

        const tempDir = `${process.cwd()}/.keystore-test-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
        const keystore = new LocalFileKeyStore(tempDir);
        const loc = locator("credits.aleo", "wrong_checksum", "prover");
        try {
            await keystore.clear();
            await keystore.setKeyBytes(keyBytes, loc);

            // Read back with a wrong checksum — verification should fail.
            let thrown: KeyVerificationError | undefined;
            try {
                await keystore.getKeyBytes({
                    ...loc,
                    checksum: "0".repeat(64),
                });
            } catch (e) {
                thrown = e as KeyVerificationError;
            }
            expect(thrown).to.be.instanceOf(KeyVerificationError);
            expect(thrown!.field).to.equal("checksum");
        } finally {
            await $fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
        }
    });
});
