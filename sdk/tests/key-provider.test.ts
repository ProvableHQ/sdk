import { expect } from "chai";
import {
    AleoKeyProvider,
    CachedKeyPair,
    CREDITS_PROGRAM_KEYS,
    FunctionKeyPair,
    KeyFingerprint,
    KeyVerificationError,
    LocalFileKeyStore,
    MemKeyVerifier,
    OfflineKeyProvider,
    ProvingKey,
    VerifyingKey,
    sha256Hex,
} from "../src/node.js";
import * as $fs from "node:fs/promises";
import * as path from "path";
import type { KeyLocator } from "../src/keys/keystore/interface.js";

function locator(s: string): KeyLocator {
    return { locator: s };
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
            const proverLoc = "program.aleo/missing.prover";
            const verifierLoc = "program.aleo/missing.verifier";
            expect(await keystore.getKeyBytes(locator(proverLoc))).equal(null);
            expect(await keystore.getProvingKey(locator(proverLoc))).equal(null);
            expect(await keystore.getVerifyingKey(locator(verifierLoc))).equal(null);
        } finally {
            await $fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
        }
    });

    it("should set, get, has, delete, and clear using raw bytes on disk", async () => {
        const kp = new AleoKeyProvider();
        const [provA, verA] = <FunctionKeyPair>await kp.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.fee_public);
        const [provB, verB] = <FunctionKeyPair>await kp.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.join);
        const proverBytesA = provA.toBytes();
        const verifierBytesA = verA.toBytes();
        const proverBytesB = provB.toBytes();
        const verifierBytesB = verB.toBytes();

        const tempDir = `${process.cwd()}/.keystore-test-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
        const keystore = new LocalFileKeyStore(tempDir);
        try {
            await keystore.clear();
            await keystore.delete("program.aleo/function_a.prover").catch(() => {});
            await keystore.delete("program.aleo/function_a.verifier").catch(() => {});
            await keystore.delete("program.aleo/function_b.prover").catch(() => {});
            await keystore.delete("program.aleo/function_b.verifier").catch(() => {});

            const locatorAProver = "program.aleo/function_a.prover";
            const locatorAVerifier = "program.aleo/function_a.verifier";
            const locatorBProver = "program.aleo/function_b.prover";
            const locatorBVerifier = "program.aleo/function_b.verifier";

            expect(await keystore.has(locatorAProver)).equal(false);
            expect(await keystore.getKeyBytes(locator(locatorAProver))).equal(null);
            expect(await keystore.getProvingKey(locator(locatorAProver))).equal(null);
            expect(await keystore.getVerifyingKey(locator(locatorAVerifier))).equal(null);

            await keystore.setKeyBytes(proverBytesA, locator(locatorAProver));
            await keystore.setKeyBytes(verifierBytesA, locator(locatorAVerifier));
            expect(await keystore.has(locatorAProver)).equal(true);
            expect(await keystore.has(locatorAVerifier)).equal(true);

            const gotProverA = await keystore.getKeyBytes(locator(locatorAProver));
            const gotVerifierA = await keystore.getKeyBytes(locator(locatorAVerifier));
            expect(gotProverA).not.equal(null);
            expect(gotVerifierA).not.equal(null);
            expect(Buffer.from(gotProverA!).equals(Buffer.from(proverBytesA))).equal(true);
            expect(Buffer.from(gotVerifierA!).equals(Buffer.from(verifierBytesA))).equal(true);

            await keystore.setKeyBytes(proverBytesB, locator(locatorBProver));
            await keystore.setKeyBytes(verifierBytesB, locator(locatorBVerifier));
            expect(await keystore.has(locatorBProver)).equal(true);
            expect(await keystore.has(locatorBVerifier)).equal(true);

            await keystore.delete(locatorAProver);
            await keystore.delete(locatorAVerifier);
            expect(await keystore.has(locatorAProver)).equal(false);
            expect(await keystore.has(locatorAVerifier)).equal(false);
            expect(await keystore.getKeyBytes(locator(locatorAProver))).equal(null);

            await keystore.clear();
            expect(await keystore.has(locatorBProver)).equal(false);
            expect(await keystore.has(locatorBVerifier)).equal(false);
            expect(await keystore.getKeyBytes(locator(locatorBProver))).equal(null);
        } finally {
            await $fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
        }
    });

    it("should set/get ProvingKey & VerifyingKey via setKeys and getProvingKey/getVerifyingKey", async () => {
        const tempDir = `${process.cwd()}/.keystore-test-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
        const keystore = new LocalFileKeyStore(tempDir);
        const proverLoc = "credits.aleo/fee_public.prover";
        const verifierLoc = "credits.aleo/fee_public.verifier";
        try {
            await keystore.clear();
            await keystore.delete(proverLoc).catch(() => {});
            await keystore.delete(verifierLoc).catch(() => {});

            const kp = new AleoKeyProvider();
            const [prov, ver] = <FunctionKeyPair>await kp.feePublicKeys();

            await keystore.setKeys(locator(proverLoc), locator(verifierLoc), [prov, ver]);
            expect(await keystore.has(proverLoc)).equal(true);
            expect(await keystore.has(verifierLoc)).equal(true);

            const gotProver = await keystore.getProvingKey(locator(proverLoc));
            const gotVerifier = await keystore.getVerifyingKey(locator(verifierLoc));
            expect(gotProver).not.equal(null);
            expect(gotVerifier).not.equal(null);
            expect(gotProver!).instanceof(ProvingKey);
            expect(gotVerifier!).instanceof(VerifyingKey);
            expect(gotProver!.checksum()).equal(prov.checksum());
            expect(gotVerifier!.checksum()).equal(ver.checksum());

            const proverBytes = await keystore.getKeyBytes(locator(proverLoc));
            const verifierBytes = await keystore.getKeyBytes(locator(verifierLoc));
            expect(proverBytes).not.equal(null);
            expect(verifierBytes).not.equal(null);
            expect(ProvingKey.fromBytes(proverBytes!).checksum()).equal(prov.checksum());
            expect(VerifyingKey.fromBytes(verifierBytes!).checksum()).equal(ver.checksum());

            await keystore.delete(proverLoc);
            await keystore.delete(verifierLoc);
            expect(await keystore.getProvingKey(locator(proverLoc))).equal(null);
            expect(await keystore.getVerifyingKey(locator(verifierLoc))).equal(null);
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
        const loc = "program.aleo/single_key";
        try {
            await keystore.clear();
            expect(await keystore.getKeyMetadata(loc)).equal(null);

            await keystore.setKeyBytes(keyBytes, locator(loc));
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
        const loc = "credits.aleo/corrupt_me.prover";
        try {
            await keystore.clear();
            await keystore.delete(loc).catch(() => {});

            await keystore.setKeyBytes(keyBytes, locator(loc));
            const readBefore = await keystore.getKeyBytes(locator(loc));
            expect(readBefore).not.to.equal(null);
            expect(Buffer.from(readBefore!).equals(Buffer.from(keyBytes))).equal(true);

            const keyPath = path.join(tempDir, loc);
            await $fs.writeFile(keyPath, new Uint8Array([1, 2, 3, 4, 5]));

            let thrown: KeyVerificationError | undefined;
            try {
                await keystore.getKeyBytes(locator(loc));
            } catch (e) {
                thrown = e as KeyVerificationError;
            }
            expect(thrown).to.be.instanceOf(KeyVerificationError);
            expect(thrown!.field).to.equal("size");
        } finally {
            await $fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
        }
    });

    it("getKeyBytes succeeds when fingerprint in locator matches key bytes", async () => {
        const kp = new AleoKeyProvider();
        const [prov] = <FunctionKeyPair>await kp.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.fee_public);
        const keyBytes = prov.toBytes();

        const verifier = new MemKeyVerifier();
        const fingerprint = await verifier.computeKeyMetadata({ keyBytes });

        const tempDir = `${process.cwd()}/.keystore-test-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
        const keystore = new LocalFileKeyStore(tempDir);
        const loc = "credits.aleo/with_fingerprint.prover";
        try {
            await keystore.clear();
            await keystore.setKeyBytes(keyBytes, locator(loc));

            const readWithFingerprint = await keystore.getKeyBytes({
                locator: loc,
                fingerprint,
            });
            expect(readWithFingerprint).not.to.equal(null);
            expect(Buffer.from(readWithFingerprint!).equals(Buffer.from(keyBytes))).equal(true);
        } finally {
            await $fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
        }
    });

    it("getKeyBytes throws KeyVerificationError when locator fingerprint does not match stored bytes", async () => {
        const kp = new AleoKeyProvider();
        const [prov] = <FunctionKeyPair>await kp.fetchCreditsKeys(CREDITS_PROGRAM_KEYS.fee_public);
        const keyBytes = prov.toBytes();

        const tempDir = `${process.cwd()}/.keystore-test-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
        const keystore = new LocalFileKeyStore(tempDir);
        const loc = "credits.aleo/wrong_fingerprint.prover";
        try {
            await keystore.clear();
            await keystore.setKeyBytes(keyBytes, locator(loc));

            const wrongFingerprint: KeyFingerprint = {
                checksum: "0".repeat(64),
                size: keyBytes.length,
            };

            let thrown: KeyVerificationError | undefined;
            try {
                await keystore.getKeyBytes({
                    locator: loc,
                    fingerprint: wrongFingerprint,
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
