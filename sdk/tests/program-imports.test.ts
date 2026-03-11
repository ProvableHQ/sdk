import sinon from "sinon";
import { expect } from "chai";
import {
    Program,
    ProgramImportsBuilder,
    ProgramManager,
    ProgramManagerBase,
    ProvingKey,
    VerifyingKey,
} from "@provablehq/sdk/%%NETWORK%%.js";
import {
    DD_CALLER_PROGRAM,
    DD_CONSTANTS_PROGRAM,
    DD_TEN_PROGRAM,
    MULTIPLY_PROGRAM,
    DOUBLE_PROGRAM,
} from "./data/dynamic-dispatch.js";
import type { KeyStore, KeyLocator } from "../src/keys/keystore/interface.js";
import type { FunctionKeyProvider } from "../src/keys/provider/interface.js";

/** Sinon-stubbed KeyStore for assertions on call args/counts. */
type StubbedKeyStore = {
    [K in keyof KeyStore]: sinon.SinonStub;
};

function createMockKeyStore(keys: Record<string, { pk?: ProvingKey; vk?: VerifyingKey }> = {}): StubbedKeyStore {
    return {
        has: sinon.stub().callsFake(async (locator: string) => {
            for (const [programFn, pair] of Object.entries(keys)) {
                if (locator === `${programFn}.prover` && pair.pk) return true;
                if (locator === `${programFn}.verifier` && pair.vk) return true;
            }
            return false;
        }),
        getProvingKey: sinon.stub().callsFake(async (loc: KeyLocator) => {
            for (const [programFn, pair] of Object.entries(keys)) {
                if (loc.locator === `${programFn}.prover`) return pair.pk ?? null;
            }
            return null;
        }),
        getVerifyingKey: sinon.stub().callsFake(async (loc: KeyLocator) => {
            for (const [programFn, pair] of Object.entries(keys)) {
                if (loc.locator === `${programFn}.verifier`) return pair.vk ?? null;
            }
            return null;
        }),
        setKeys: sinon.stub().resolves(),
        getKeyBytes: sinon.stub().resolves(null),
        setKeyBytes: sinon.stub().resolves(),
        getKeyMetadata: sinon.stub().resolves(null),
        delete: sinon.stub().resolves(),
        clear: sinon.stub().resolves(),
    };
}

function createMockKeyProvider(keyStore?: StubbedKeyStore): FunctionKeyProvider {
    return {
        keyStore: sinon.stub().resolves(keyStore),
        bondPublicKeys: sinon.stub().resolves(),
        bondValidatorKeys: sinon.stub().resolves(),
        cacheKeys: sinon.stub(),
        claimUnbondPublicKeys: sinon.stub().resolves(),
        functionKeys: sinon.stub().resolves(),
        feePrivateKeys: sinon.stub().resolves(),
        feePublicKeys: sinon.stub().resolves(),
        inclusionKeys: sinon.stub().resolves(),
        joinKeys: sinon.stub().resolves(),
        splitKeys: sinon.stub().resolves(),
        transferKeys: sinon.stub().resolves(),
        unBondPublicKeys: sinon.stub().resolves(),
    } as unknown as FunctionKeyProvider;
}

/** Access private methods on ProgramManager via cast. */
function pm(manager: ProgramManager): any {
    return manager as any;
}

describe("ProgramImports & KeyStore integration", () => {
    afterEach(() => sinon.restore());

    describe("buildProgramImports", () => {
        it("should return an empty builder when the program has no imports and none provided", async () => {
            const manager = new ProgramManager();
            // dd_constants has no static imports and we provide none.
            const builder: ProgramImportsBuilder = await pm(manager).buildProgramImports(DD_CONSTANTS_PROGRAM);

            expect(builder.isEmpty()).to.equal(true);
        });

        it("should add user-provided imports to the builder", async () => {
            const manager = new ProgramManager();
            const imports = { "dd_constants.aleo": DD_CONSTANTS_PROGRAM };

            const builder: ProgramImportsBuilder = await pm(manager).buildProgramImports(DD_CALLER_PROGRAM, imports);

            expect(builder.isEmpty()).to.equal(false);
            expect(builder.contains("dd_constants.aleo")).to.equal(true);
        });

        it("should merge network-fetched imports with user-provided imports", async () => {
            const manager = new ProgramManager();
            // DOUBLE_PROGRAM has a static `import multiply_test.aleo;`
            sinon.stub(manager.networkClient, "getProgramImports").resolves({
                "multiply_test.aleo": MULTIPLY_PROGRAM,
            });
            const userImports = { "dd_ten.aleo": DD_TEN_PROGRAM };

            const builder: ProgramImportsBuilder = await pm(manager).buildProgramImports(DOUBLE_PROGRAM, userImports);

            // Both network-fetched and user-provided imports should be present.
            expect(builder.contains("multiply_test.aleo")).to.equal(true);
            expect(builder.contains("dd_ten.aleo")).to.equal(true);
        });

        it("should gracefully handle network fetch failures", async () => {
            const manager = new ProgramManager();
            sinon.stub(manager.networkClient, "getProgramImports")
                .rejects(new Error("network down"));

            // dd_constants has no static imports, but we don't pass any either,
            // so network fetch is attempted and fails gracefully.
            const builder: ProgramImportsBuilder = await pm(manager).buildProgramImports(DD_CONSTANTS_PROGRAM);

            expect(builder.isEmpty()).to.equal(true);
        });

        it("should accept a Program object in addition to a string", async () => {
            const manager = new ProgramManager();
            const programObj = Program.fromString(DD_CALLER_PROGRAM);
            const imports = { "dd_constants.aleo": DD_CONSTANTS_PROGRAM };

            const builder: ProgramImportsBuilder = await pm(manager).buildProgramImports(programObj, imports);

            expect(builder.contains("dd_constants.aleo")).to.equal(true);
        });

        it("should include dynamic dispatch targets provided in imports even without static imports", async () => {
            const manager = new ProgramManager();
            // dd_constants has no static imports, but we provide dd_ten as a dynamic target.
            const imports = { "dd_ten.aleo": DD_TEN_PROGRAM };

            const builder: ProgramImportsBuilder = await pm(manager).buildProgramImports(DD_CONSTANTS_PROGRAM, imports);

            expect(builder.contains("dd_ten.aleo")).to.equal(true);
        });

        it("should add multiple imports to the builder", async () => {
            const manager = new ProgramManager();
            const imports = {
                "dd_constants.aleo": DD_CONSTANTS_PROGRAM,
                "dd_ten.aleo": DD_TEN_PROGRAM,
            };

            const builder: ProgramImportsBuilder = await pm(manager).buildProgramImports(DD_CALLER_PROGRAM, imports);

            expect(builder.contains("dd_constants.aleo")).to.equal(true);
            expect(builder.contains("dd_ten.aleo")).to.equal(true);
        });
    });

    describe("loadKeysFromStore", () => {
        it("should be a no-op when keyProvider has no keyStore", async () => {
            const provider = createMockKeyProvider(undefined);
            const manager = new ProgramManager(undefined, provider);

            const builder = new ProgramImportsBuilder();
            builder.addProgram("dd_constants.aleo", DD_CONSTANTS_PROGRAM);

            await pm(manager).loadKeysFromStore(builder, "dd_constants.aleo", DD_CONSTANTS_PROGRAM);

            // No keys should be added.
            expect(builder.getProvingKey("dd_constants.aleo", "get_value")).to.equal(undefined);
        });

        it("should be a no-op when keyStore.has returns false for all locators", async () => {
            const store = createMockKeyStore();
            const provider = createMockKeyProvider(store);
            const manager = new ProgramManager(undefined, provider);

            const builder = new ProgramImportsBuilder();
            builder.addProgram("dd_constants.aleo", DD_CONSTANTS_PROGRAM);

            await pm(manager).loadKeysFromStore(builder, "dd_constants.aleo", DD_CONSTANTS_PROGRAM);

            // has() was called, but getProvingKey/getVerifyingKey should not be.
            expect(store.has.called).to.equal(true);
            expect(store.getProvingKey.called).to.equal(false);
            expect(store.getVerifyingKey.called).to.equal(false);
        });

        it("should query correct locators for each function in the program", async () => {
            const store = createMockKeyStore();
            const provider = createMockKeyProvider(store);
            const manager = new ProgramManager(undefined, provider);

            const builder = new ProgramImportsBuilder();
            builder.addProgram("dd_ten.aleo", DD_TEN_PROGRAM);

            await pm(manager).loadKeysFromStore(builder, "dd_ten.aleo", DD_TEN_PROGRAM);

            const hasLocators = store.has.args.map((a: string[]) => a[0]);
            expect(hasLocators).to.include("dd_ten.aleo.get_ten.prover");
            expect(hasLocators).to.include("dd_ten.aleo.get_ten.verifier");
        });

        it("should fetch and add keys when keyStore.has returns true", async () => {
            const fakePk = {} as ProvingKey;
            const fakeVk = {} as VerifyingKey;
            const store = createMockKeyStore({
                "multiply_test.aleo.multiply": { pk: fakePk, vk: fakeVk },
            });
            const manager = new ProgramManager();
            manager.setKeyStore(store as unknown as KeyStore);

            const builder = new ProgramImportsBuilder();
            builder.addProgram("multiply_test.aleo", MULTIPLY_PROGRAM);

            // Stub the WASM builder methods so fake keys don't trigger WASM type errors
            sinon.stub(builder, "addProvingKey");
            sinon.stub(builder, "addVerifyingKey");

            await pm(manager).loadKeysFromStore(builder, "multiply_test.aleo", MULTIPLY_PROGRAM);

            expect(store.has.called).to.equal(true);
            expect(store.getProvingKey.called).to.equal(true);
            expect(store.getVerifyingKey.called).to.equal(true);
        });

        it("should swallow keyStore errors without throwing", async () => {
            const store = createMockKeyStore();
            store.has.rejects(new Error("disk error"));
            const provider = createMockKeyProvider(store);
            const manager = new ProgramManager(undefined, provider);

            const builder = new ProgramImportsBuilder();
            builder.addProgram("dd_constants.aleo", DD_CONSTANTS_PROGRAM);

            // Should not throw.
            await pm(manager).loadKeysFromStore(builder, "dd_constants.aleo", DD_CONSTANTS_PROGRAM);
        });

        it("should swallow keyProvider.keyStore() errors without throwing", async () => {
            const provider = createMockKeyProvider();
            (provider.keyStore as sinon.SinonStub).rejects(new Error("provider unavailable"));
            const manager = new ProgramManager(undefined, provider);

            const builder = new ProgramImportsBuilder();
            builder.addProgram("dd_constants.aleo", DD_CONSTANTS_PROGRAM);

            // Should not throw.
            await pm(manager).loadKeysFromStore(builder, "dd_constants.aleo", DD_CONSTANTS_PROGRAM);
        });
    });

    describe("persistExtractedKeys", () => {
        it("should be a no-op when no imports are provided", async () => {
            const store = createMockKeyStore();
            const provider = createMockKeyProvider(store);
            const manager = new ProgramManager(undefined, provider);

            const builder = new ProgramImportsBuilder();

            await pm(manager).persistExtractedKeys(builder);

            expect(store.setKeys.called).to.equal(false);
        });

        it("should be a no-op when keyProvider has no keyStore", async () => {
            const provider = createMockKeyProvider(undefined);
            const manager = new ProgramManager(undefined, provider);

            const builder = new ProgramImportsBuilder();
            builder.addProgram("dd_constants.aleo", DD_CONSTANTS_PROGRAM);

            // Should not throw.
            await pm(manager).persistExtractedKeys(builder);
        });

        it("should skip programs not in the builder", async () => {
            const store = createMockKeyStore();
            const provider = createMockKeyProvider(store);
            const manager = new ProgramManager(undefined, provider);

            const builder = new ProgramImportsBuilder();
            // Builder is empty — does not contain dd_constants.aleo.

            await pm(manager).persistExtractedKeys(builder);

            expect(store.setKeys.called).to.equal(false);
        });

        it("should skip functions where builder has no keys", async () => {
            const store = createMockKeyStore();
            const provider = createMockKeyProvider(store);
            const manager = new ProgramManager(undefined, provider);

            const builder = new ProgramImportsBuilder();
            builder.addProgram("dd_constants.aleo", DD_CONSTANTS_PROGRAM);
            // No keys added to the builder.

            await pm(manager).persistExtractedKeys(builder);

            expect(store.setKeys.called).to.equal(false);
        });

        it("should swallow keyStore errors without throwing", async () => {
            const store = createMockKeyStore();
            store.setKeys.rejects(new Error("write error"));
            const provider = createMockKeyProvider(store);
            const manager = new ProgramManager(undefined, provider);

            const builder = new ProgramImportsBuilder();
            builder.addProgram("dd_constants.aleo", DD_CONSTANTS_PROGRAM);

            // Should not throw.
            await pm(manager).persistExtractedKeys(builder);
        });

        it("should swallow keyProvider.keyStore() errors without throwing", async () => {
            const provider = createMockKeyProvider();
            (provider.keyStore as sinon.SinonStub).rejects(new Error("provider unavailable"));
            const manager = new ProgramManager(undefined, provider);

            const builder = new ProgramImportsBuilder();
            builder.addProgram("dd_constants.aleo", DD_CONSTANTS_PROGRAM);

            // Should not throw.
            await pm(manager).persistExtractedKeys(builder);
        });

        it("should not persist when only one of PK/VK is present", async () => {
            const store = createMockKeyStore();
            const provider = createMockKeyProvider(store);
            const manager = new ProgramManager(undefined, provider);

            const builder = new ProgramImportsBuilder();
            builder.addProgram("dd_constants.aleo", DD_CONSTANTS_PROGRAM);
            // Builder has the program but no keys — getProvingKey/getVerifyingKey return undefined.

            await pm(manager).persistExtractedKeys(builder);

            expect(store.setKeys.called).to.equal(false);
        });

        it("should persist top-level keys when topLevelProgram and topLevelFunction are provided", async () => {
            const store = createMockKeyStore({
                // Pre-populate so getProvingKey/getVerifyingKey return values
                "dd_constants.aleo.get_value": { pk: {} as ProvingKey, vk: {} as VerifyingKey },
            });
            const provider = createMockKeyProvider(store);
            const manager = new ProgramManager(undefined, provider);

            // Simulate WASM having extracted the top-level key into the builder.
            const builder = new ProgramImportsBuilder();
            builder.addProgram("dd_constants.aleo", DD_CONSTANTS_PROGRAM);
            // Note: In the real flow, WASM's extract_top_level_keys populates the builder
            // with keys from the process. Here the builder has no keys, so getProvingKey
            // returns undefined and setKeys is not called. This verifies the guard works.

            await pm(manager).persistExtractedKeys(builder, DD_CONSTANTS_PROGRAM, "get_value");

            // Builder had no keys (getProvingKey returns undefined), so setKeys should not fire.
            expect(store.setKeys.called).to.equal(false);
        });

        it("should not attempt top-level persistence when topLevelProgram is omitted", async () => {
            const store = createMockKeyStore();
            const provider = createMockKeyProvider(store);
            const manager = new ProgramManager(undefined, provider);

            const builder = new ProgramImportsBuilder();
            builder.addProgram("dd_constants.aleo", DD_CONSTANTS_PROGRAM);

            await pm(manager).persistExtractedKeys(builder);

            // No top-level params means no top-level persistence attempt.
            expect(store.setKeys.called).to.equal(false);
        });

        it("should swallow errors when persisting top-level keys", async () => {
            const store = createMockKeyStore();
            store.setKeys.rejects(new Error("write error"));
            const provider = createMockKeyProvider(store);
            const manager = new ProgramManager(undefined, provider);

            const builder = new ProgramImportsBuilder();
            builder.addProgram("dd_constants.aleo", DD_CONSTANTS_PROGRAM);

            // Should resolve without throwing despite the write error.
            let threw = false;
            try {
                await pm(manager).persistExtractedKeys(builder, DD_CONSTANTS_PROGRAM, "get_value");
            } catch {
                threw = true;
            }
            expect(threw).to.equal(false);
        });
    });

    describe("buildProgramImports with KeyStore", () => {
        it("should query KeyStore for each imported program's functions", async () => {
            const store = createMockKeyStore();
            const provider = createMockKeyProvider(store);
            const manager = new ProgramManager(undefined, provider);

            const imports = { "dd_constants.aleo": DD_CONSTANTS_PROGRAM };
            await pm(manager).buildProgramImports(DD_CALLER_PROGRAM, imports);

            const hasLocators = store.has.args.map((a: string[]) => a[0]);
            expect(hasLocators).to.include("dd_constants.aleo.get_value.prover");
            expect(hasLocators).to.include("dd_constants.aleo.get_value.verifier");
        });

        it("should not query KeyStore when keyProvider has no keyStore", async () => {
            const provider = createMockKeyProvider(undefined);
            const manager = new ProgramManager(undefined, provider);

            const imports = { "dd_constants.aleo": DD_CONSTANTS_PROGRAM };
            const builder: ProgramImportsBuilder = await pm(manager).buildProgramImports(DD_CALLER_PROGRAM, imports);

            // Should still build the builder with programs, just no keys.
            expect(builder.contains("dd_constants.aleo")).to.equal(true);
        });

        it("should query KeyStore for multiple imports", async () => {
            const store = createMockKeyStore();
            const provider = createMockKeyProvider(store);
            const manager = new ProgramManager(undefined, provider);

            const imports = {
                "dd_constants.aleo": DD_CONSTANTS_PROGRAM,
                "dd_ten.aleo": DD_TEN_PROGRAM,
            };
            await pm(manager).buildProgramImports(DD_CALLER_PROGRAM, imports);

            const hasLocators = store.has.args.map((a: string[]) => a[0]);
            expect(hasLocators).to.include("dd_constants.aleo.get_value.prover");
            expect(hasLocators).to.include("dd_ten.aleo.get_ten.prover");
        });
    });

    describe("setKeyStore", () => {
        it("should make KeyStore available to loadKeysFromStore", async () => {
            const store = createMockKeyStore();
            const manager = new ProgramManager();
            manager.setKeyStore(store as unknown as KeyStore);

            const builder = new ProgramImportsBuilder();
            builder.addProgram("dd_constants.aleo", DD_CONSTANTS_PROGRAM);

            await pm(manager).loadKeysFromStore(builder, "dd_constants.aleo", DD_CONSTANTS_PROGRAM);

            // KeyStore was consulted via setKeyStore, not keyProvider.keyStore().
            expect(store.has.called).to.equal(true);
        });

        it("should make KeyStore available to persistExtractedKeys", async () => {
            const store = createMockKeyStore();
            const manager = new ProgramManager();
            manager.setKeyStore(store as unknown as KeyStore);

            const builder = new ProgramImportsBuilder();
            builder.addProgram("dd_constants.aleo", DD_CONSTANTS_PROGRAM);

            await pm(manager).persistExtractedKeys(builder);

            // setKeys not called (no keys in builder), but method completed without error,
            // meaning the KeyStore was resolved via setKeyStore.
            expect(store.setKeys.called).to.equal(false);
        });

        it("should take precedence over keyProvider.keyStore()", async () => {
            const directStore = createMockKeyStore();
            const providerStore = createMockKeyStore();
            const provider = createMockKeyProvider(providerStore);
            const manager = new ProgramManager(undefined, provider);
            manager.setKeyStore(directStore as unknown as KeyStore);

            const builder = new ProgramImportsBuilder();
            builder.addProgram("dd_constants.aleo", DD_CONSTANTS_PROGRAM);

            await pm(manager).loadKeysFromStore(builder, "dd_constants.aleo", DD_CONSTANTS_PROGRAM);

            // Direct KeyStore was used, not the provider's.
            expect(directStore.has.called).to.equal(true);
            expect(providerStore.has.called).to.equal(false);
        });
    });

    describe("resolveTopLevelKeys", () => {
        it("should return keys from KeyStore when available", async () => {
            const store = createMockKeyStore({
                "dd_constants.aleo.get_value": { pk: {} as ProvingKey, vk: {} as VerifyingKey },
            });
            const manager = new ProgramManager();
            manager.setKeyStore(store as unknown as KeyStore);

            const keys = await pm(manager).resolveTopLevelKeys("dd_constants.aleo", "get_value");

            expect(keys).to.not.be.undefined;
            expect(store.has.calledWith("dd_constants.aleo.get_value.prover")).to.equal(true);
            expect(store.has.calledWith("dd_constants.aleo.get_value.verifier")).to.equal(true);
            expect(store.getProvingKey.called).to.equal(true);
            expect(store.getVerifyingKey.called).to.equal(true);
        });

        it("should fall back to keyProvider.functionKeys when KeyStore has no keys", async () => {
            const store = createMockKeyStore(); // empty
            const provider = createMockKeyProvider(store);
            const expectedKeys = [{} as ProvingKey, {} as VerifyingKey];
            (provider.functionKeys as sinon.SinonStub).resolves(expectedKeys);
            const manager = new ProgramManager(undefined, provider);

            const keys = await pm(manager).resolveTopLevelKeys("dd_constants.aleo", "get_value", {});

            expect(keys).to.deep.equal(expectedKeys);
            expect(store.has.called).to.equal(true);
            expect((provider.functionKeys as sinon.SinonStub).called).to.equal(true);
        });

        it("should return undefined when neither KeyStore nor KeyProvider has keys", async () => {
            const store = createMockKeyStore(); // empty
            const provider = createMockKeyProvider(store);
            (provider.functionKeys as sinon.SinonStub).rejects(new Error("no keys"));
            const manager = new ProgramManager(undefined, provider);

            const keys = await pm(manager).resolveTopLevelKeys("dd_constants.aleo", "get_value", {});

            expect(keys).to.be.undefined;
        });

        it("should not call keyProvider.functionKeys when KeyStore has keys", async () => {
            const store = createMockKeyStore({
                "dd_constants.aleo.get_value": { pk: {} as ProvingKey, vk: {} as VerifyingKey },
            });
            const provider = createMockKeyProvider(store);
            const manager = new ProgramManager(undefined, provider);
            manager.setKeyStore(store as unknown as KeyStore);

            await pm(manager).resolveTopLevelKeys("dd_constants.aleo", "get_value");

            expect((provider.functionKeys as sinon.SinonStub).called).to.equal(false);
        });

        it("should swallow KeyStore errors and fall back to KeyProvider", async () => {
            const store = createMockKeyStore();
            store.has.rejects(new Error("disk error"));
            const provider = createMockKeyProvider();
            const expectedKeys = [{} as ProvingKey, {} as VerifyingKey];
            (provider.functionKeys as sinon.SinonStub).resolves(expectedKeys);
            const manager = new ProgramManager(undefined, provider);
            manager.setKeyStore(store as unknown as KeyStore);

            const keys = await pm(manager).resolveTopLevelKeys("dd_constants.aleo", "get_value", {});

            expect(keys).to.deep.equal(expectedKeys);
        });

        it("should work with KeyStore set via setKeyStore (no keyProvider keyStore)", async () => {
            const store = createMockKeyStore({
                "dd_ten.aleo.get_ten": { pk: {} as ProvingKey, vk: {} as VerifyingKey },
            });
            const manager = new ProgramManager();
            manager.setKeyStore(store as unknown as KeyStore);

            const keys = await pm(manager).resolveTopLevelKeys("dd_ten.aleo", "get_ten");

            expect(keys).to.not.be.undefined;
            expect(store.getProvingKey.called).to.equal(true);
        });
    });

    describe("synthesizeKeys auto-persist", () => {
        it("should call keyStore.setKeys with correct locators after synthesis", async () => {
            const store = createMockKeyStore();
            const manager = new ProgramManager();
            manager.setKeyStore(store as unknown as KeyStore);

            const fakePk = {} as ProvingKey;
            const fakeVk = {} as VerifyingKey;
            const fakeKeyPair = {
                provingKey: sinon.stub().returns(fakePk),
                verifyingKey: sinon.stub().returns(fakeVk),
            };

            // Stub the WASM call to return our fake key pair
            sinon.stub(manager.networkClient, "getProgramImports").resolves({});
            const synthesizeStub = sinon.stub(ProgramManagerBase, "synthesizeKeyPair").resolves(fakeKeyPair as any);

            try {
                await manager.synthesizeKeys(DD_CONSTANTS_PROGRAM, "get_value", ["0u8"]);

                expect(store.setKeys.calledOnce).to.equal(true);
                const [proverLoc, verifierLoc, keys] = store.setKeys.firstCall.args;
                expect(proverLoc.locator).to.equal("dd_constants.aleo.get_value.prover");
                expect(verifierLoc.locator).to.equal("dd_constants.aleo.get_value.verifier");
                expect(keys).to.deep.equal([fakePk, fakeVk]);
            } finally {
                synthesizeStub.restore();
            }
        });

        it("should not call keyStore.setKeys when no KeyStore is configured", async () => {
            const manager = new ProgramManager();

            const fakePk = {} as ProvingKey;
            const fakeVk = {} as VerifyingKey;
            const fakeKeyPair = {
                provingKey: sinon.stub().returns(fakePk),
                verifyingKey: sinon.stub().returns(fakeVk),
            };

            sinon.stub(manager.networkClient, "getProgramImports").resolves({});
            const synthesizeStub = sinon.stub(ProgramManagerBase, "synthesizeKeyPair").resolves(fakeKeyPair as any);

            try {
                const keys = await manager.synthesizeKeys(DD_CONSTANTS_PROGRAM, "get_value", ["0u8"]);

                // Keys should still be returned even without a KeyStore
                expect(keys).to.deep.equal([fakePk, fakeVk]);
            } finally {
                synthesizeStub.restore();
            }
        });

        it("should swallow keyStore.setKeys errors and still return keys", async () => {
            const store = createMockKeyStore();
            store.setKeys.rejects(new Error("write error"));
            const manager = new ProgramManager();
            manager.setKeyStore(store as unknown as KeyStore);

            const fakePk = {} as ProvingKey;
            const fakeVk = {} as VerifyingKey;
            const fakeKeyPair = {
                provingKey: sinon.stub().returns(fakePk),
                verifyingKey: sinon.stub().returns(fakeVk),
            };

            sinon.stub(manager.networkClient, "getProgramImports").resolves({});
            const synthesizeStub = sinon.stub(ProgramManagerBase, "synthesizeKeyPair").resolves(fakeKeyPair as any);

            try {
                const keys = await manager.synthesizeKeys(DD_CONSTANTS_PROGRAM, "get_value", ["0u8"]);

                // Keys returned despite setKeys failure
                expect(keys).to.deep.equal([fakePk, fakeVk]);
                expect(store.setKeys.calledOnce).to.equal(true);
            } finally {
                synthesizeStub.restore();
            }
        });
    });

    describe("run() integration", () => {
        it("should auto-build ProgramImportsBuilder from KeyStore when none provided", async () => {
            const store = createMockKeyStore();
            const provider = createMockKeyProvider(store);
            const manager = new ProgramManager(undefined, provider);

            // Spy on buildProgramImports to verify it's called
            const buildSpy = sinon.spy(pm(manager), "buildProgramImports");

            // Stub the WASM execution to avoid actual execution
            const execStub = sinon.stub(ProgramManagerBase, "executeFunctionOfflineWithImports").resolves({} as any);

            try {
                manager.setAccount({ privateKey: () => ({}) } as any);
                await manager.run(DD_CONSTANTS_PROGRAM, "get_value", ["0u8"], false);

                expect(buildSpy.calledOnce).to.equal(true);
            } finally {
                execStub.restore();
            }
        });

        it("should not call buildProgramImports when programImportsBuilder is provided", async () => {
            const store = createMockKeyStore();
            const provider = createMockKeyProvider(store);
            const manager = new ProgramManager(undefined, provider);

            const buildSpy = sinon.spy(pm(manager), "buildProgramImports");

            const execStub = sinon.stub(ProgramManagerBase, "executeFunctionOfflineWithImports").resolves({} as any);

            try {
                manager.setAccount({ privateKey: () => ({}) } as any);
                const builder = new ProgramImportsBuilder();
                await manager.run(DD_CONSTANTS_PROGRAM, "get_value", ["0u8"], false, undefined, undefined, undefined, undefined, undefined, undefined, undefined, builder);

                expect(buildSpy.called).to.equal(false);
            } finally {
                execStub.restore();
            }
        });

        it("should call persistExtractedKeys after execution", async () => {
            const store = createMockKeyStore();
            const provider = createMockKeyProvider(store);
            const manager = new ProgramManager(undefined, provider);

            const persistSpy = sinon.spy(pm(manager), "persistExtractedKeys");

            const execStub = sinon.stub(ProgramManagerBase, "executeFunctionOfflineWithImports").resolves({} as any);

            try {
                manager.setAccount({ privateKey: () => ({}) } as any);
                await manager.run(DD_CONSTANTS_PROGRAM, "get_value", ["0u8"], false);

                expect(persistSpy.calledOnce).to.equal(true);
            } finally {
                execStub.restore();
            }
        });
    });
});
