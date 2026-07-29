import sinon from "sinon";
import { expect } from "chai";
import {
    Account,
    AleoKeyProvider,
    ProgramImportsBuilder,
    ProgramManager,
    ProgramManagerBase,
    Program,
    PrivateKey,
    ProvingKey,
    OfflineQuery,
    QueryOption,
    VerifyingKey,
} from "@provablehq/sdk/%%NETWORK%%.js";
import {
    KeyStore,
    ProvingKeyLocator,
    VerifyingKeyLocator,
    provingKeyLocator,
    verifyingKeyLocator,
} from "../src/keys/keystore/interface.js";
import { FunctionKeyPair } from "../src/models/keyPair.js";
import {
    MULTIPLY_PROGRAM,
    DOUBLE_PROGRAM,
    QUADRUPLE_PROGRAM,
    ADD_PROGRAM,
    ADD_DOUBLE_PROGRAM,
    ADD_QUAD_PROGRAM,
    MULTI_FN_PROGRAM,
    MULTI_IMPORT_PROGRAM,
    CALLS_ALPHA_PROGRAM,
    SCOPED_CALLER_PROGRAM,
    CLOSURE_CALLER_PROGRAM,
    CALLS_TWO_FNS_PROGRAM,
} from "./data/test-programs.js";

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

/** Create a mock KeyStore backed by sinon stubs. */
function createMockKeyStore(opts?: {
    provingKeys?: Map<string, ProvingKey>;
    verifyingKeys?: Map<string, VerifyingKey>;
}): KeyStore {
    const pkMap = opts?.provingKeys ?? new Map();
    const vkMap = opts?.verifyingKeys ?? new Map();

    const locatorKey = (loc: { program: string; functionName: string; keyType: string }) =>
        `${loc.program}/${loc.functionName}/${loc.keyType}`;

    return {
        getKeyBytes: sinon.stub().resolves(null),
        getProvingKey: sinon.stub().callsFake(async (loc: ProvingKeyLocator) => {
            return pkMap.get(locatorKey(loc)) ?? null;
        }),
        getVerifyingKey: sinon.stub().callsFake(async (loc: VerifyingKeyLocator) => {
            return vkMap.get(locatorKey(loc)) ?? null;
        }),
        setKeys: sinon.stub().resolves(),
        setKeyBytes: sinon.stub().resolves(),
        getKeyMetadata: sinon.stub().resolves(null),
        has: sinon.stub().callsFake(async (loc: { program: string; functionName: string; keyType: string }) => {
            return pkMap.has(locatorKey(loc)) || vkMap.has(locatorKey(loc));
        }),
        delete: sinon.stub().resolves(),
        clear: sinon.stub().resolves(),
    };
}

/** Create a mock KeyProvider that returns a given keyStore and stubs other methods. */
function createMockKeyProvider(keyStore?: KeyStore) {
    const provider = new AleoKeyProvider();
    sinon.stub(provider, "keyStore").resolves(keyStore);
    sinon.stub(provider, "functionKeys").rejects(new Error("No keys available"));
    sinon.stub(provider, "feePublicKeys").resolves([undefined, undefined] as unknown as FunctionKeyPair);
    sinon.stub(provider, "feePrivateKeys").resolves([undefined, undefined] as unknown as FunctionKeyPair);
    return provider;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ProgramImportsBuilder", () => {
    afterEach(() => {
        sinon.restore();
    });

    describe("WASM builder basics", () => {
        it("should create an empty builder", () => {
            const builder = new ProgramImportsBuilder();
            expect(builder.isEmpty()).to.equal(true);
            expect(Array.from(builder.programNames())).to.have.length(0);
        });

        it("should add a program and report it via contains/programNames", () => {
            const builder = new ProgramImportsBuilder();
            builder.addProgram("multiply_test.aleo", MULTIPLY_PROGRAM);
            expect(builder.isEmpty()).to.equal(false);
            expect(builder.contains("multiply_test.aleo")).to.equal(true);
            expect(Array.from(builder.programNames())).to.include("multiply_test.aleo");
        });

        it("should retrieve added program source", () => {
            const builder = new ProgramImportsBuilder();
            builder.addProgram("multiply_test.aleo", MULTIPLY_PROGRAM);
            const source = builder.getProgram("multiply_test.aleo");
            expect(source).to.not.be.null;
            expect(source).to.contain("multiply");
        });

        it("should return undefined for a program that was not added", () => {
            const builder = new ProgramImportsBuilder();
            const source = builder.getProgram("nonexistent.aleo");
            expect(source).to.be.undefined;
        });

        it("should create a builder from an object (plain string format)", () => {
            const imports = {
                "multiply_test.aleo": MULTIPLY_PROGRAM,
            };
            const builder = ProgramImportsBuilder.fromObject(imports);
            expect(builder.contains("multiply_test.aleo")).to.equal(true);
        });

        it("should create a builder from an object (structured format)", () => {
            const imports = {
                "multiply_test.aleo": { program: MULTIPLY_PROGRAM },
            };
            const builder = ProgramImportsBuilder.fromObject(imports);
            expect(builder.contains("multiply_test.aleo")).to.equal(true);
            expect(builder.getProgram("multiply_test.aleo")).to.contain("multiply");
        });

        it("should convert to an object", () => {
            const builder = new ProgramImportsBuilder();
            builder.addProgram("multiply_test.aleo", MULTIPLY_PROGRAM);
            const obj = builder.toObject();
            expect(obj).to.have.property("multiply_test.aleo");
        });
    });

    describe("buildProgramImports", () => {
        it("should return an empty builder for a program with no imports", async () => {
            const keyProvider = createMockKeyProvider();
            const pm = new ProgramManager("https://api.provable.com/v2", keyProvider);

            // Access private method via bracket notation
            const { builder } = await (pm as any).buildProgramImports(MULTIPLY_PROGRAM, undefined, true, "multiply");
            expect(builder.isEmpty()).to.equal(true);
        });

        it("should add user-provided imports to the builder", async () => {
            const keyProvider = createMockKeyProvider();
            const pm = new ProgramManager("https://api.provable.com/v2", keyProvider);

            // Stub network client to avoid actual network calls
            sinon.stub(pm.networkClient, "getProgramImports").resolves({});

            const imports = { "multiply_test.aleo": MULTIPLY_PROGRAM };
            const { builder } = await (pm as any).buildProgramImports(DOUBLE_PROGRAM, imports, true, "double_it");
            expect(builder.contains("multiply_test.aleo")).to.equal(true);
        });

        it("should fetch imports from the network when not provided", async () => {
            const keyProvider = createMockKeyProvider();
            const pm = new ProgramManager("https://api.provable.com/v2", keyProvider);

            const networkStub = sinon.stub(pm.networkClient, "getProgramImports").resolves({
                "multiply_test.aleo": MULTIPLY_PROGRAM,
            });

            const { builder } = await (pm as any).buildProgramImports(DOUBLE_PROGRAM, undefined, true, "double_it");
            expect(builder.contains("multiply_test.aleo")).to.equal(true);
            expect(networkStub.calledOnce).to.equal(true);
        });

        it("should merge network imports with user imports", async () => {
            const keyProvider = createMockKeyProvider();
            const pm = new ProgramManager("https://api.provable.com/v2", keyProvider);

            const networkSource = MULTIPLY_PROGRAM;
            sinon.stub(pm.networkClient, "getProgramImports").resolves({
                "multiply_test.aleo": networkSource,
            });

            const userSource = MULTIPLY_PROGRAM; // Same program, but user-provided
            const imports = { "multiply_test.aleo": userSource };
            const { builder } = await (pm as any).buildProgramImports(DOUBLE_PROGRAM, imports, true, "double_it");
            expect(builder.contains("multiply_test.aleo")).to.equal(true);
        });

        it("should merge entry imports with additional caller-provided imports", async () => {
            const keyProvider = createMockKeyProvider();
            const pm = new ProgramManager("https://api.provable.com/v2", keyProvider);
            const imports = { "sum_double_test.aleo": ADD_DOUBLE_PROGRAM };

            const networkStub = sinon.stub(pm.networkClient, "getProgramImports").callsFake(
                async (_program, seededImports = {}) => ({
                    ...seededImports,
                    "multiply_test.aleo": MULTIPLY_PROGRAM,
                }),
            );
            sinon.stub(pm.networkClient, "getProgram")
                .withArgs("sum_test.aleo")
                .resolves(ADD_PROGRAM);
            sinon.stub(pm.networkClient, "getProgramAmendmentCount").resolves({
                program_id: "test.aleo",
                edition: 1,
                amendment_count: 0,
            });

            const { builder } = await (pm as any).buildProgramImports(
                DOUBLE_PROGRAM,
                imports,
                false,
                "double_it",
            );

            expect(networkStub.calledOnce).to.equal(true);
            expect(networkStub.firstCall.args[1]).to.deep.equal(imports);
            expect(Array.from(builder.programNames())).to.have.members([
                "multiply_test.aleo",
                "sum_double_test.aleo",
                "sum_test.aleo",
            ]);
        });

        it("should not fail when network fetch errors", async () => {
            const keyProvider = createMockKeyProvider();
            const pm = new ProgramManager("https://api.provable.com/v2", keyProvider);

            sinon.stub(pm.networkClient, "getProgramImports").rejects(new Error("Network error"));

            // Should not throw
            const { builder } = await (pm as any).buildProgramImports(DOUBLE_PROGRAM, undefined, true, "double_it");
            // Builder should be empty since network failed and no user imports provided
            expect(builder.isEmpty()).to.equal(true);
        });

        it("should resolve transitive imports to any depth", async () => {
            const keyProvider = createMockKeyProvider();
            const pm = new ProgramManager("https://api.provable.com/v2", keyProvider);

            // Stub getProgramImports to return direct imports of the top-level program.
            // quadruple_test.aleo imports double_test.aleo
            // double_test.aleo imports multiply_test.aleo
            const networkStub = sinon.stub(pm.networkClient, "getProgramImports");
            networkStub.withArgs(QUADRUPLE_PROGRAM).resolves({
                "double_test.aleo": DOUBLE_PROGRAM,
            });
            networkStub.resolves({});

            // BFS loop uses getProgram for unknown transitive imports.
            const getProgramStub = sinon.stub(pm.networkClient, "getProgram");
            getProgramStub.withArgs("multiply_test.aleo").resolves(MULTIPLY_PROGRAM);

            const { builder } = await (pm as any).buildProgramImports(QUADRUPLE_PROGRAM, undefined, true, "quadruple_it");
            expect(builder.contains("double_test.aleo")).to.equal(true);
            expect(builder.contains("multiply_test.aleo")).to.equal(true);
            expect(Array.from(builder.programNames())).to.have.length(2);
        });
    });

    describe("fee estimation import resolution", () => {
        it("should merge entry imports with caller imports for both fee estimators", async () => {
            const keyProvider = createMockKeyProvider();
            const pm = new ProgramManager("https://api.provable.com/v2", keyProvider);
            const imports = { "sum_double_test.aleo": ADD_DOUBLE_PROGRAM };

            sinon.stub(pm.networkClient, "getProgramImports").callsFake(
                async (_program, seededImports = {}) => ({
                    ...seededImports,
                    "multiply_test.aleo": MULTIPLY_PROGRAM,
                }),
            );
            sinon.stub(pm.networkClient, "getProgram")
                .withArgs("sum_test.aleo")
                .resolves(ADD_PROGRAM);
            const executionFeeStub = sinon.stub(ProgramManagerBase, "estimateExecutionFee").returns(1n);
            const authorizationFeeStub = sinon.stub(ProgramManagerBase, "estimateFeeForAuthorization").returns(1n);

            await pm.estimateExecutionFee({
                programName: "double_test.aleo",
                functionName: "double_it",
                program: DOUBLE_PROGRAM,
                imports,
            });
            await pm.estimateFeeForAuthorization({
                authorization: {} as any,
                programName: "double_test.aleo",
                program: DOUBLE_PROGRAM,
                imports,
            });

            const expectedImports = {
                "multiply_test.aleo": MULTIPLY_PROGRAM,
                "sum_double_test.aleo": ADD_DOUBLE_PROGRAM,
                "sum_test.aleo": ADD_PROGRAM,
            };
            expect(executionFeeStub.firstCall.args[2]).to.deep.equal(expectedImports);
            expect(authorizationFeeStub.firstCall.args[2]).to.deep.equal(expectedImports);
        });
    });

    describe("loadKeysFromStore", () => {
        it("should query the KeyStore for proving and verifying keys", async () => {
            const mockStore = createMockKeyStore();
            // Return null to simulate — we can't easily create a real ProvingKey in unit tests
            (mockStore.getProvingKey as sinon.SinonStub).resolves(null);
            (mockStore.getVerifyingKey as sinon.SinonStub).resolves(null);

            const keyProvider = createMockKeyProvider(mockStore);
            const pm = new ProgramManager("https://api.provable.com/v2", keyProvider);

            const builder = new ProgramImportsBuilder();
            builder.addProgram("multiply_test.aleo", MULTIPLY_PROGRAM);

            // Invoke the private method
            await (pm as any).loadKeysFromStore(builder, "multiply_test.aleo", ["multiply"]);

            // getProvingKey / getVerifyingKey should have been called
            expect((mockStore.getProvingKey as sinon.SinonStub).called).to.equal(true);
            expect((mockStore.getVerifyingKey as sinon.SinonStub).called).to.equal(true);
        });

        it("should be a no-op when no KeyStore is available", async () => {
            const keyProvider = createMockKeyProvider(undefined);
            const pm = new ProgramManager("https://api.provable.com/v2", keyProvider);

            const builder = new ProgramImportsBuilder();
            builder.addProgram("multiply_test.aleo", MULTIPLY_PROGRAM);

            // Should not throw
            await (pm as any).loadKeysFromStore(builder, "multiply_test.aleo", ["multiply"]);
        });

        it("should use _keyStore over keyProvider.keyStore()", async () => {
            const directStore = createMockKeyStore();
            (directStore.getProvingKey as sinon.SinonStub).resolves(null);
            (directStore.getVerifyingKey as sinon.SinonStub).resolves(null);

            const providerStore = createMockKeyStore();
            (providerStore.getProvingKey as sinon.SinonStub).resolves(null);
            (providerStore.getVerifyingKey as sinon.SinonStub).resolves(null);

            const keyProvider = createMockKeyProvider(providerStore);
            const pm = new ProgramManager("https://api.provable.com/v2", keyProvider);
            pm.setKeyStore(directStore);

            const builder = new ProgramImportsBuilder();
            builder.addProgram("multiply_test.aleo", MULTIPLY_PROGRAM);

            await (pm as any).loadKeysFromStore(builder, "multiply_test.aleo", ["multiply"]);

            // directStore should have been called, not providerStore
            expect((directStore.getProvingKey as sinon.SinonStub).called).to.equal(true);
            expect((providerStore.getProvingKey as sinon.SinonStub).called).to.equal(false);
        });

        it("should swallow errors from the KeyStore", async () => {
            const mockStore = createMockKeyStore();
            (mockStore.getProvingKey as sinon.SinonStub).rejects(new Error("Store error"));

            const keyProvider = createMockKeyProvider(mockStore);
            const pm = new ProgramManager("https://api.provable.com/v2", keyProvider);

            const builder = new ProgramImportsBuilder();
            builder.addProgram("multiply_test.aleo", MULTIPLY_PROGRAM);

            // Should not throw
            await (pm as any).loadKeysFromStore(builder, "multiply_test.aleo", ["multiply"]);
        });

        it("should pass edition to key locators", async () => {
            const mockStore = createMockKeyStore();
            (mockStore.getProvingKey as sinon.SinonStub).resolves(null);
            (mockStore.getVerifyingKey as sinon.SinonStub).resolves(null);

            const keyProvider = createMockKeyProvider(mockStore);
            const pm = new ProgramManager("https://api.provable.com/v2", keyProvider);

            // Stub amendment endpoint — edition 3 with amendment 2
            sinon.stub(pm.networkClient, "getProgramAmendmentCount").resolves({
                program_id: "multiply_test.aleo",
                edition: 3,
                amendment_count: 2,
            });

            const builder = new ProgramImportsBuilder();
            builder.addProgram("multiply_test.aleo", MULTIPLY_PROGRAM);

            await (pm as any).loadKeysFromStore(builder, "multiply_test.aleo", ["multiply"], 3);

            // Verify both getProvingKey and getVerifyingKey were called with edition 3
            const pkCalls = (mockStore.getProvingKey as sinon.SinonStub).getCalls();
            expect(pkCalls.length).to.be.greaterThan(0);
            for (const call of pkCalls) {
                expect(call.args[0].edition).to.equal(3);
                expect(call.args[0].amendment).to.equal(2);
            }
            const vkCalls = (mockStore.getVerifyingKey as sinon.SinonStub).getCalls();
            expect(vkCalls.length).to.be.greaterThan(0);
            for (const call of vkCalls) {
                expect(call.args[0].edition).to.equal(3);
                expect(call.args[0].amendment).to.equal(2);
            }
        });

        it("should default edition to 1 when not provided", async () => {
            const mockStore = createMockKeyStore();
            (mockStore.getProvingKey as sinon.SinonStub).resolves(null);
            (mockStore.getVerifyingKey as sinon.SinonStub).resolves(null);

            const keyProvider = createMockKeyProvider(mockStore);
            const pm = new ProgramManager("https://api.provable.com/v2", keyProvider);

            // Stub amendment endpoint to return default edition 1
            sinon.stub(pm.networkClient, "getProgramAmendmentCount").resolves({
                program_id: "multiply_test.aleo",
                edition: 1,
                amendment_count: 0,
            });

            const builder = new ProgramImportsBuilder();
            builder.addProgram("multiply_test.aleo", MULTIPLY_PROGRAM);

            await (pm as any).loadKeysFromStore(builder, "multiply_test.aleo", ["multiply"]);

            const pkCalls = (mockStore.getProvingKey as sinon.SinonStub).getCalls();
            expect(pkCalls.length).to.be.greaterThan(0);
            for (const call of pkCalls) {
                expect(call.args[0].edition).to.equal(1);
            }
            const vkCalls = (mockStore.getVerifyingKey as sinon.SinonStub).getCalls();
            expect(vkCalls.length).to.be.greaterThan(0);
            for (const call of vkCalls) {
                expect(call.args[0].edition).to.equal(1);
            }
        });
    });

    describe("persistExtractedKeys", () => {
        it("should call setKeys for functions with keys not already in the store", async () => {
            const mockStore = createMockKeyStore();
            // has() returns false — keys are NOT in the store yet
            (mockStore.has as sinon.SinonStub).resolves(false);

            const keyProvider = createMockKeyProvider(mockStore);
            const pm = new ProgramManager("https://api.provable.com/v2", keyProvider);

            // Create a builder with a program added
            const builder = new ProgramImportsBuilder();
            builder.addProgram("multiply_test.aleo", MULTIPLY_PROGRAM);

            // Stub functionKeysAvailable and getProvingKey/getVerifyingKey on the builder
            // Since we can't easily add real keys in unit tests, stub the builder methods
            const mockPk = {} as ProvingKey;
            const mockVk = {} as VerifyingKey;
            sinon.stub(builder, "functionKeysAvailable").returns(["multiply"] as any);
            sinon.stub(builder, "getProvingKey").returns(mockPk);
            sinon.stub(builder, "getVerifyingKey").returns(mockVk);

            await (pm as any).persistExtractedKeys(builder);

            // setKeys should have been called once for the "multiply" function
            expect((mockStore.setKeys as sinon.SinonStub).calledOnce).to.equal(true);
            const [pkLocator, vkLocator, keys] = (mockStore.setKeys as sinon.SinonStub).firstCall.args;
            expect(pkLocator.program).to.equal("multiply_test.aleo");
            expect(pkLocator.functionName).to.equal("multiply");
            expect(pkLocator.keyType).to.equal("prover");
            expect(vkLocator.keyType).to.equal("verifier");
            expect(keys[0]).to.equal(mockPk);
            expect(keys[1]).to.equal(mockVk);
        });

        it("should skip functions whose keys are already in the store", async () => {
            const mockStore = createMockKeyStore();
            // has() returns true — keys are already in the store
            (mockStore.has as sinon.SinonStub).resolves(true);

            const keyProvider = createMockKeyProvider(mockStore);
            const pm = new ProgramManager("https://api.provable.com/v2", keyProvider);

            const builder = new ProgramImportsBuilder();
            builder.addProgram("multiply_test.aleo", MULTIPLY_PROGRAM);

            sinon.stub(builder, "functionKeysAvailable").returns(["multiply"] as any);
            sinon.stub(builder, "getProvingKey").returns({} as ProvingKey);
            sinon.stub(builder, "getVerifyingKey").returns({} as VerifyingKey);

            await (pm as any).persistExtractedKeys(builder);

            // setKeys should NOT have been called since keys already exist
            expect((mockStore.setKeys as sinon.SinonStub).called).to.equal(false);
        });

        it("should be a no-op when no KeyStore is available", async () => {
            const keyProvider = createMockKeyProvider(undefined);
            const pm = new ProgramManager("https://api.provable.com/v2", keyProvider);

            const builder = new ProgramImportsBuilder();
            builder.addProgram("multiply_test.aleo", MULTIPLY_PROGRAM);

            // Should not throw
            await (pm as any).persistExtractedKeys(builder);
        });

        it("should swallow errors from setKeys", async () => {
            const mockStore = createMockKeyStore();
            (mockStore.has as sinon.SinonStub).resolves(false);
            (mockStore.setKeys as sinon.SinonStub).rejects(new Error("Storage full"));

            const keyProvider = createMockKeyProvider(mockStore);
            const pm = new ProgramManager("https://api.provable.com/v2", keyProvider);

            const builder = new ProgramImportsBuilder();
            builder.addProgram("multiply_test.aleo", MULTIPLY_PROGRAM);

            sinon.stub(builder, "functionKeysAvailable").returns(["multiply"] as any);
            sinon.stub(builder, "getProvingKey").returns({} as ProvingKey);
            sinon.stub(builder, "getVerifyingKey").returns({} as VerifyingKey);

            // Should not throw despite setKeys failing
            await (pm as any).persistExtractedKeys(builder);
        });

        it("should pass edition to key locators when persisting", async () => {
            const mockStore = createMockKeyStore();
            (mockStore.has as sinon.SinonStub).resolves(false);

            const keyProvider = createMockKeyProvider(mockStore);
            const pm = new ProgramManager("https://api.provable.com/v2", keyProvider);

            // Stub the amendment endpoint to return edition 5
            sinon.stub(pm.networkClient, "getProgramAmendmentCount").resolves({
                program_id: "multiply_test.aleo",
                edition: 5,
                amendment_count: 0,
            });

            const builder = new ProgramImportsBuilder();
            builder.addProgram("multiply_test.aleo", MULTIPLY_PROGRAM);

            const mockPk = {} as ProvingKey;
            const mockVk = {} as VerifyingKey;
            sinon.stub(builder, "functionKeysAvailable").returns(["multiply"] as any);
            sinon.stub(builder, "getProvingKey").returns(mockPk);
            sinon.stub(builder, "getVerifyingKey").returns(mockVk);

            await (pm as any).persistExtractedKeys(builder);

            const [pkLocator, vkLocator] = (mockStore.setKeys as sinon.SinonStub).firstCall.args;
            expect(pkLocator.edition).to.equal(5);
            expect(vkLocator.edition).to.equal(5);
        });

        it("should use provided importEditions instead of calling the network", async () => {
            const mockStore = createMockKeyStore();
            (mockStore.has as sinon.SinonStub).resolves(false);

            const keyProvider = createMockKeyProvider(mockStore);
            const pm = new ProgramManager("https://api.provable.com/v2", keyProvider);

            // Stub the amendment endpoint — should NOT be called.
            const amendmentStub = sinon.stub(pm.networkClient, "getProgramAmendmentCount");

            const builder = new ProgramImportsBuilder();
            builder.addProgram("multiply_test.aleo", MULTIPLY_PROGRAM);

            const mockPk = {} as ProvingKey;
            const mockVk = {} as VerifyingKey;
            sinon.stub(builder, "functionKeysAvailable").returns(["multiply"] as any);
            sinon.stub(builder, "getProvingKey").returns(mockPk);
            sinon.stub(builder, "getVerifyingKey").returns(mockVk);

            // Pass pre-resolved editions — network should not be called.
            const importEditions = new Map([
                ["multiply_test.aleo", { edition: 7, amendment: 3 }],
            ]);
            await (pm as any).persistExtractedKeys(builder, importEditions);

            expect(amendmentStub.called).to.be.false;
            const [pkLocator, vkLocator] = (mockStore.setKeys as sinon.SinonStub).firstCall.args;
            expect(pkLocator.edition).to.equal(7);
            expect(pkLocator.amendment).to.equal(3);
            expect(vkLocator.edition).to.equal(7);
            expect(vkLocator.amendment).to.equal(3);
        });
    });

    describe("resolveTopLevelKeys", () => {
        it("should return keys from KeyStore when available", async () => {
            const mockPk = {} as ProvingKey;
            const mockVk = {} as VerifyingKey;
            const mockStore = createMockKeyStore();

            (mockStore.has as sinon.SinonStub).resolves(true);
            (mockStore.getProvingKey as sinon.SinonStub).resolves(mockPk);
            (mockStore.getVerifyingKey as sinon.SinonStub).resolves(mockVk);

            const keyProvider = createMockKeyProvider(mockStore);
            const pm = new ProgramManager("https://api.provable.com/v2", keyProvider);

            const keys = await (pm as any).resolveTopLevelKeys("multiply_test.aleo", "multiply");
            expect(keys).to.not.be.undefined;
            expect(keys![0]).to.equal(mockPk);
            expect(keys![1]).to.equal(mockVk);
        });

        it("should fall back to KeyProvider when KeyStore has no keys", async () => {
            const mockStore = createMockKeyStore();
            (mockStore.has as sinon.SinonStub).resolves(false);

            const keyProvider = createMockKeyProvider(mockStore);
            // Override functionKeys to return a pair
            const mockPk = {} as ProvingKey;
            const mockVk = {} as VerifyingKey;
            (keyProvider.functionKeys as sinon.SinonStub).resolves([mockPk, mockVk]);

            const pm = new ProgramManager("https://api.provable.com/v2", keyProvider);

            const keys = await (pm as any).resolveTopLevelKeys("multiply_test.aleo", "multiply");
            expect(keys).to.not.be.undefined;
            expect(keys![0]).to.equal(mockPk);
            expect(keys![1]).to.equal(mockVk);
        });

        it("should return undefined when both KeyStore and KeyProvider fail", async () => {
            const keyProvider = createMockKeyProvider(undefined);
            // functionKeys already stubs to reject
            const pm = new ProgramManager("https://api.provable.com/v2", keyProvider);

            const keys = await (pm as any).resolveTopLevelKeys("multiply_test.aleo", "multiply");
            expect(keys).to.be.undefined;
        });

        it("should pass edition and amendment to key locators", async () => {
            const mockStore = createMockKeyStore();
            (mockStore.has as sinon.SinonStub).resolves(true);
            (mockStore.getProvingKey as sinon.SinonStub).resolves({} as ProvingKey);
            (mockStore.getVerifyingKey as sinon.SinonStub).resolves({} as VerifyingKey);

            const keyProvider = createMockKeyProvider(mockStore);
            const pm = new ProgramManager("https://api.provable.com/v2", keyProvider);

            await (pm as any).resolveTopLevelKeys("multiply_test.aleo", "multiply", undefined, 7, 3);

            const calls = (mockStore.has as sinon.SinonStub).getCalls();
            expect(calls.length).to.be.greaterThan(0);
            for (const call of calls) {
                expect(call.args[0].edition).to.equal(7);
                expect(call.args[0].amendment).to.equal(3);
            }
        });
    });

    describe("setKeyStore", () => {
        it("should set the internal _keyStore field", () => {
            const pm = new ProgramManager("https://api.provable.com/v2");
            const mockStore = createMockKeyStore();
            pm.setKeyStore(mockStore);

            // Verify it's set via bracket notation
            expect((pm as any)._keyStore).to.equal(mockStore);
        });

        it("should take precedence over keyProvider.keyStore()", async () => {
            const directStore = createMockKeyStore();
            (directStore.has as sinon.SinonStub).resolves(true);
            (directStore.getProvingKey as sinon.SinonStub).resolves({} as ProvingKey);
            (directStore.getVerifyingKey as sinon.SinonStub).resolves({} as VerifyingKey);

            const providerStore = createMockKeyStore();
            (providerStore.has as sinon.SinonStub).resolves(true);
            (providerStore.getProvingKey as sinon.SinonStub).resolves({} as ProvingKey);
            (providerStore.getVerifyingKey as sinon.SinonStub).resolves({} as VerifyingKey);

            const keyProvider = createMockKeyProvider(providerStore);
            const pm = new ProgramManager("https://api.provable.com/v2", keyProvider);
            pm.setKeyStore(directStore);

            const keys = await (pm as any).resolveTopLevelKeys("test.aleo", "main");
            expect(keys).to.not.be.undefined;

            // Direct store's has should be called, not provider store's
            expect((directStore.has as sinon.SinonStub).called).to.equal(true);
            // Provider's keyStore() should not even be called
            expect((keyProvider.keyStore as sinon.SinonStub).called).to.equal(false);
        });
    });

    describe("getCallGraph — deduplication", () => {
        it("should deduplicate when same function is called twice", () => {
            // quadruple_it calls double_test.aleo/double_it twice
            const program = Program.fromString(QUADRUPLE_PROGRAM);
            const result = program.getCallGraph("quadruple_it");
            expect(result["double_test.aleo"]).to.include("double_it");
            // Called twice but should only appear once via callGraphToMap Set
            const map = (ProgramManager as any).callGraphToMap(result);
            expect(map.get("double_test.aleo").size).to.equal(1);
        });
    });

    describe("Program.getCallGraph (WASM call-chain tracing)", () => {
        it("should return only calls reachable from entry function", () => {
            const program = Program.fromString(SCOPED_CALLER_PROGRAM);
            const result = program.getCallGraph("use_multiply");
            expect(result["multiply_test.aleo"]).to.be.an("array");
            expect(result["multiply_test.aleo"]).to.include("multiply");
            // Should NOT include calls from use_sum
            expect(result["sum_test.aleo"]).to.be.undefined;
        });

        it("should scope to the other function when entry changes", () => {
            const program = Program.fromString(SCOPED_CALLER_PROGRAM);
            const result = program.getCallGraph("use_sum");
            expect(result["sum_test.aleo"]).to.be.an("array");
            expect(result["sum_test.aleo"]).to.include("sum_it");
            expect(result["multiply_test.aleo"]).to.be.undefined;
        });

        it("should follow local closure calls", () => {
            const program = Program.fromString(CLOSURE_CALLER_PROGRAM);
            const result = program.getCallGraph("calls_via_closure");
            // calls_via_closure calls helper (local closure) + multiply_test.aleo/multiply
            expect(result["multiply_test.aleo"]).to.be.an("array");
            expect(result["multiply_test.aleo"]).to.include("multiply");
            // Should NOT include sum_test.aleo from the unrelated function
            expect(result["sum_test.aleo"]).to.be.undefined;
        });

        it("should return empty object for nonexistent entry function", () => {
            const program = Program.fromString(SCOPED_CALLER_PROGRAM);
            const result = program.getCallGraph("nonexistent");
            expect(Object.keys(result)).to.have.lengthOf(0);
        });

        it("should return empty object for program with no external calls", () => {
            const program = Program.fromString(MULTIPLY_PROGRAM);
            const result = program.getCallGraph("multiply");
            expect(Object.keys(result)).to.have.lengthOf(0);
        });
    });

    describe("buildProgramImports — transitive call-chain scoping", () => {
        it("should propagate calledFunctions through an 8-level import chain", async () => {
            // Generate an 8-level chain: lvl_0 → lvl_1 → ... → lvl_7 (leaf)
            const depth = 8;
            const programs: Record<string, string> = {};

            // Leaf
            programs[`lvl_${depth - 1}.aleo`] = `program lvl_${depth - 1}.aleo;\n\nfunction call_next:\n    input r0 as u64.public;\n    add r0 1u64 into r1;\n    output r1 as u64.public;\n`;

            // Intermediates (7 down to 1)
            for (let i = depth - 2; i >= 1; i--) {
                programs[`lvl_${i}.aleo`] = `import lvl_${i + 1}.aleo;\n\nprogram lvl_${i}.aleo;\n\nfunction call_next:\n    input r0 as u64.public;\n    add r0 1u64 into r1;\n    call lvl_${i + 1}.aleo/call_next r1 into r2;\n    output r2 as u64.public;\n`;
            }

            // Entry (level 0)
            const entryProgram = `import lvl_1.aleo;\n\nprogram lvl_0.aleo;\n\nfunction entry:\n    input r0 as u64.public;\n    call lvl_1.aleo/call_next r0 into r1;\n    output r1 as u64.public;\n`;

            const keyProvider = createMockKeyProvider();
            const pm = new ProgramManager("https://api.provable.com/v2", keyProvider);

            const networkStub = sinon.stub(pm.networkClient, "getProgramImports");
            networkStub.resolves({});

            const { builder } = await (pm as any).buildProgramImports(
                entryProgram, programs, false, "entry"
            );

            // All 7 imports should be collected (lvl_1 through lvl_7)
            for (let i = 1; i < depth; i++) {
                expect(builder.contains(`lvl_${i}.aleo`)).to.equal(true, `lvl_${i}.aleo should be in builder`);
            }
        });

        it("should propagate calledFunctions through a 3-level import chain", async () => {
            // quadruple_test.aleo calls double_test.aleo/double_it
            // double_test.aleo/double_it calls multiply_test.aleo/multiply
            // With entryFunction="quadruple_it", both should be discovered.
            const keyProvider = createMockKeyProvider();
            const pm = new ProgramManager("https://api.provable.com/v2", keyProvider);

            const imports = {
                "double_test.aleo": DOUBLE_PROGRAM,
                "multiply_test.aleo": MULTIPLY_PROGRAM,
            };

            const networkStub = sinon.stub(pm.networkClient, "getProgramImports");
            networkStub.resolves({});

            const { builder } = await (pm as any).buildProgramImports(
                QUADRUPLE_PROGRAM, imports, false, "quadruple_it"
            );

            // Both transitive imports should be collected
            expect(builder.contains("double_test.aleo")).to.equal(true);
            expect(builder.contains("multiply_test.aleo")).to.equal(true);
        });

        it("should NOT load keys for unreachable imports in a scoped chain", async () => {
            // scoped_caller.aleo has use_multiply (calls multiply_test.aleo)
            // and use_sum (calls sum_test.aleo).
            // With entryFunction="use_multiply", both imports are added to the
            // builder (WASM needs all declared imports) but only
            // multiply_test.aleo should have keys loaded.
            const mockStore = createMockKeyStore();
            const keyProvider = createMockKeyProvider(mockStore);
            const pm = new ProgramManager("https://api.provable.com/v2", keyProvider);

            const imports = {
                "multiply_test.aleo": MULTIPLY_PROGRAM,
                "sum_test.aleo": ADD_PROGRAM,
            };

            const networkStub = sinon.stub(pm.networkClient, "getProgramImports");
            networkStub.resolves({});

            const { builder } = await (pm as any).buildProgramImports(
                SCOPED_CALLER_PROGRAM, imports, true, "use_multiply"
            );

            // Both imports are in the builder (WASM requires all declared imports)
            expect(builder.contains("multiply_test.aleo")).to.equal(true);
            expect(builder.contains("sum_test.aleo")).to.equal(true);

            // But loadKeysFromStore should only have been called for multiply_test.aleo
            // (the import in the call chain), not sum_test.aleo.
            // Verify by checking: sum_test.aleo's functions should get an empty
            // calledFns list (no keys loaded).
            const loadKeysSpy = sinon.spy(pm as any, "loadKeysFromStore");
            await (pm as any).buildProgramImports(
                SCOPED_CALLER_PROGRAM, imports, true, "use_multiply"
            );
            const sumCall = loadKeysSpy.getCalls().find(
                (c: any) => c.args[1] === "sum_test.aleo"
            );
            // sum_test.aleo should get an empty function list (no keys to load)
            if (sumCall) {
                expect(sumCall.args[2]).to.have.lengthOf(0);
            }
        });
    });

    describe("getCallGraph — multiple entry points into same import", () => {
        it("should collect both called functions when entry calls two fns in same import", () => {
            const program = Program.fromString(CALLS_TWO_FNS_PROGRAM);
            const result = program.getCallGraph("use_both");
            expect(result["multi_fn_test.aleo"]).to.be.an("array");
            expect(result["multi_fn_test.aleo"]).to.include("alpha");
            expect(result["multi_fn_test.aleo"]).to.include("beta");
            // gamma is NOT called by use_both
            expect(result["multi_fn_test.aleo"]).to.not.include("gamma");
        });

        it("should only include gamma when entry is use_gamma", () => {
            const program = Program.fromString(CALLS_TWO_FNS_PROGRAM);
            const result = program.getCallGraph("use_gamma");
            expect(result["multi_fn_test.aleo"]).to.include("gamma");
            expect(result["multi_fn_test.aleo"]).to.not.include("alpha");
            expect(result["multi_fn_test.aleo"]).to.not.include("beta");
        });
    });

    describe("callGraphToMap conversion", () => {
        it("should convert WASM getCallGraph result to Map<string, Set<string>>", () => {
            const program = Program.fromString(SCOPED_CALLER_PROGRAM);
            const raw = program.getCallGraph("use_multiply");
            const map = (ProgramManager as any).callGraphToMap(raw);
            expect(map).to.be.instanceOf(Map);
            expect(map.has("multiply_test.aleo")).to.be.true;
            expect(map.get("multiply_test.aleo")).to.be.instanceOf(Set);
            expect(map.get("multiply_test.aleo").has("multiply")).to.be.true;
        });

        it("should return empty Map for empty call graph", () => {
            const program = Program.fromString(MULTIPLY_PROGRAM);
            const raw = program.getCallGraph("multiply");
            const map = (ProgramManager as any).callGraphToMap(raw);
            expect(map).to.be.instanceOf(Map);
            expect(map.size).to.equal(0);
        });
    });

    describe("BFS ordering — red-green verification", () => {
        it("should fail to propagate if imports are processed leaf-first without the fix", async () => {
            // This test verifies the fix works by checking that a 3-level chain
            // correctly propagates calledFunctions even when getProgramImports
            // returns imports in leaf-first order (multiply before double).
            const keyProvider = createMockKeyProvider();
            const pm = new ProgramManager("https://api.provable.com/v2", keyProvider);

            // Provide imports in leaf-first order (multiply before double)
            // — this is the order that triggers the BFS ordering bug.
            const imports = {
                "multiply_test.aleo": MULTIPLY_PROGRAM,
                "double_test.aleo": DOUBLE_PROGRAM,
            };

            const networkStub = sinon.stub(pm.networkClient, "getProgramImports");
            networkStub.resolves({});

            const loadKeysSpy = sinon.spy(pm as any, "loadKeysFromStore");
            await (pm as any).buildProgramImports(
                QUADRUPLE_PROGRAM, imports, true, "quadruple_it"
            );

            // Both imports should have loadKeysFromStore called with non-empty function lists.
            // The BFS ordering bug would cause multiply_test.aleo to get an empty list
            // because it's processed before double_test.aleo adds it to calledFunctions.
            const multiplyCall = loadKeysSpy.getCalls().find(
                (c: any) => c.args[1] === "multiply_test.aleo"
            );
            const doubleCall = loadKeysSpy.getCalls().find(
                (c: any) => c.args[1] === "double_test.aleo"
            );
            expect(doubleCall).to.not.be.undefined;
            expect(doubleCall!.args[2]).to.include("double_it");
            expect(multiplyCall).to.not.be.undefined;
            expect(multiplyCall!.args[2]).to.include("multiply");
        });
    });

    describe("loadKeysFromStore — inconsistent KeyStore", () => {
        // getProvingKey() returns null — addProvingKey should not be called
        it("should skip addProvingKey when getProvingKey returns null", async () => {
            const mockStore = createMockKeyStore();
            (mockStore.getProvingKey as sinon.SinonStub).resolves(null);
            (mockStore.getVerifyingKey as sinon.SinonStub).resolves(null);

            const keyProvider = createMockKeyProvider(mockStore);
            const pm = new ProgramManager("https://api.provable.com/v2", keyProvider);

            const builder = new ProgramImportsBuilder();
            builder.addProgram("multiply_test.aleo", MULTIPLY_PROGRAM);

            // Spy on addProvingKey to verify it's NOT called when pk is null
            const addPkSpy = sinon.spy(builder, "addProvingKey");
            const addVkSpy = sinon.spy(builder, "addVerifyingKey");

            await (pm as any).loadKeysFromStore(builder, "multiply_test.aleo", ["multiply"]);

            // addProvingKey/addVerifyingKey should NOT have been called
            // because getProvingKey/getVerifyingKey returned null
            expect(addPkSpy.called).to.equal(false);
            expect(addVkSpy.called).to.equal(false);
        });

        // Empty functionNames array
        it("should be a no-op when functionNames is an empty array", async () => {
            const mockStore = createMockKeyStore();

            const keyProvider = createMockKeyProvider(mockStore);
            const pm = new ProgramManager("https://api.provable.com/v2", keyProvider);

            const builder = new ProgramImportsBuilder();
            builder.addProgram("multiply_test.aleo", MULTIPLY_PROGRAM);

            await (pm as any).loadKeysFromStore(builder, "multiply_test.aleo", []);

            // getProvingKey should never be called since there are no functions to load
            expect((mockStore.getProvingKey as sinon.SinonStub).called).to.equal(false);
        });
    });

    describe("persistExtractedKeys — partial key availability", () => {
        // Builder has PK but not VK for a function
        it("should skip persist when builder has PK but not VK", async () => {
            const mockStore = createMockKeyStore();
            (mockStore.has as sinon.SinonStub).resolves(false);

            const keyProvider = createMockKeyProvider(mockStore);
            const pm = new ProgramManager("https://api.provable.com/v2", keyProvider);

            const builder = new ProgramImportsBuilder();
            builder.addProgram("multiply_test.aleo", MULTIPLY_PROGRAM);

            sinon.stub(builder, "functionKeysAvailable").returns(["multiply"] as any);
            sinon.stub(builder, "getProvingKey").returns({} as ProvingKey);
            sinon.stub(builder, "getVerifyingKey").returns(undefined as any); // VK missing

            await (pm as any).persistExtractedKeys(builder);

            // setKeys should NOT be called because VK is falsy
            expect((mockStore.setKeys as sinon.SinonStub).called).to.equal(false);
        });
    });

    describe("edition edge cases", () => {
        // edition=0 should not be treated as falsy
        it("should treat edition=0 as a valid edition, not as undefined", () => {
            const loc = provingKeyLocator("test.aleo", "main", 0);
            expect(loc.edition).to.equal(0);
        });

        it("should pass edition=0 through loadKeysFromStore to locators", async () => {
            const mockStore = createMockKeyStore();
            (mockStore.getProvingKey as sinon.SinonStub).resolves(null);
            (mockStore.getVerifyingKey as sinon.SinonStub).resolves(null);

            const keyProvider = createMockKeyProvider(mockStore);
            const pm = new ProgramManager("https://api.provable.com/v2", keyProvider);

            // Stub amendment endpoint — edition 0 (constructor program)
            sinon.stub(pm.networkClient, "getProgramAmendmentCount").resolves({
                program_id: "multiply_test.aleo",
                edition: 0,
                amendment_count: 0,
            });

            const builder = new ProgramImportsBuilder();
            builder.addProgram("multiply_test.aleo", MULTIPLY_PROGRAM);

            await (pm as any).loadKeysFromStore(builder, "multiply_test.aleo", ["multiply"], 0);

            const pkCalls = (mockStore.getProvingKey as sinon.SinonStub).getCalls();
            expect(pkCalls.length).to.be.greaterThan(0);
            for (const call of pkCalls) {
                expect(call.args[0].edition).to.equal(0);
            }
            const vkCalls = (mockStore.getVerifyingKey as sinon.SinonStub).getCalls();
            expect(vkCalls.length).to.be.greaterThan(0);
            for (const call of vkCalls) {
                expect(call.args[0].edition).to.equal(0);
            }
        });
    });

    describe("buildProgramImports — import override ordering", () => {
        // User-provided imports should override network imports
        it("should prefer user-provided imports over network imports", async () => {
            const keyProvider = createMockKeyProvider();
            const pm = new ProgramManager("https://api.provable.com/v2", keyProvider);

            // Network returns one version of multiply_test.aleo
            sinon.stub(pm.networkClient, "getProgramImports").resolves({
                "multiply_test.aleo": MULTIPLY_PROGRAM,
            });

            // User provides the same program — user should win via spread override
            const userSource = MULTIPLY_PROGRAM;
            const imports = { "multiply_test.aleo": userSource };
            const { builder } = await (pm as any).buildProgramImports(DOUBLE_PROGRAM, imports, true, "double_it");

            expect(builder.contains("multiply_test.aleo")).to.equal(true);
            // The builder should contain exactly 1 program (no duplicates)
            expect(Array.from(builder.programNames())).to.have.length(1);
        });
    });

    describe("persistExtractedKeys — multi-program resilience", () => {
        // First program persists, second throws, third still attempted
        it("should continue persisting after one program fails", async () => {
            const mockStore = createMockKeyStore();
            (mockStore.has as sinon.SinonStub).resolves(false);

            let setKeysCallCount = 0;
            (mockStore.setKeys as sinon.SinonStub).callsFake(async (pkLoc: any) => {
                setKeysCallCount++;
                if (pkLoc.program === "double_test.aleo") {
                    throw new Error("Storage error for double_test");
                }
            });

            const keyProvider = createMockKeyProvider(mockStore);
            const pm = new ProgramManager("https://api.provable.com/v2", keyProvider);

            const builder = new ProgramImportsBuilder();
            builder.addProgram("multiply_test.aleo", MULTIPLY_PROGRAM);
            builder.addProgram("double_test.aleo", DOUBLE_PROGRAM);

            // Stub to return one function per program
            const origFnKeysAvail = builder.functionKeysAvailable.bind(builder);
            sinon.stub(builder, "functionKeysAvailable").callsFake((name: string) => {
                if (name === "multiply_test.aleo") return ["multiply"] as any;
                if (name === "double_test.aleo") return ["double_it"] as any;
                return origFnKeysAvail(name);
            });
            sinon.stub(builder, "getProvingKey").returns({} as ProvingKey);
            sinon.stub(builder, "getVerifyingKey").returns({} as VerifyingKey);

            // Should not throw despite double_test.aleo failing
            await (pm as any).persistExtractedKeys(builder);

            // setKeys should have been called for both programs (at least attempted)
            expect(setKeysCallCount).to.equal(2);
        });
    });

    describe("loadKeysFromStore — mid-iteration KeyStore failure", () => {
        it("should swallow error and continue when KeyStore fails mid-function", async () => {
            const mockStore = createMockKeyStore();
            let pkCallCount = 0;
            (mockStore.getProvingKey as sinon.SinonStub).callsFake(async () => {
                pkCallCount++;
                if (pkCallCount === 2) throw new Error("Flaky store");
                return null;
            });
            (mockStore.getVerifyingKey as sinon.SinonStub).resolves(null);

            const keyProvider = createMockKeyProvider(mockStore);
            const pm = new ProgramManager("https://api.provable.com/v2", keyProvider);

            const builder = new ProgramImportsBuilder();
            builder.addProgram("multi_fn_test.aleo", MULTI_FN_PROGRAM);

            // Should not throw — error is caught per-function
            await (pm as any).loadKeysFromStore(builder, "multi_fn_test.aleo", ["alpha", "beta", "gamma"]);

            // getProvingKey should have been called for all 3 functions despite the mid-iteration error
            expect(pkCallCount).to.equal(3);
        });
    });

    describe("resolveTopLevelKeys — partial KeyStore success", () => {
        // getProvingKey() succeeds, getVerifyingKey() throws
        it("should fall back to KeyProvider when getVerifyingKey throws", async () => {
            const mockPk = { id: "pk_from_store" } as unknown as ProvingKey;
            const mockStore = createMockKeyStore();
            (mockStore.has as sinon.SinonStub).resolves(true);
            (mockStore.getProvingKey as sinon.SinonStub).resolves(mockPk);
            (mockStore.getVerifyingKey as sinon.SinonStub).rejects(new Error("VK read failed"));

            const fallbackPk = { id: "pk_from_provider" } as unknown as ProvingKey;
            const fallbackVk = { id: "vk_from_provider" } as unknown as VerifyingKey;
            const keyProvider = createMockKeyProvider(mockStore);
            (keyProvider.functionKeys as sinon.SinonStub).resolves([fallbackPk, fallbackVk]);

            const pm = new ProgramManager("https://api.provable.com/v2", keyProvider);

            const keys = await (pm as any).resolveTopLevelKeys("multiply_test.aleo", "multiply");

            // Should have fallen back to KeyProvider
            expect(keys).to.not.be.undefined;
            expect((keys![0] as any).id).to.equal("pk_from_provider");
            expect((keys![1] as any).id).to.equal("vk_from_provider");
        });
    });

    describe("buildProgramImports — transitive network failure", () => {
        // Network returns empty object for transitive imports
        it("should handle empty transitive imports without crashing", async () => {
            const keyProvider = createMockKeyProvider();
            const pm = new ProgramManager("https://api.provable.com/v2", keyProvider);

            const networkStub = sinon.stub(pm.networkClient, "getProgramImports");
            networkStub.withArgs(DOUBLE_PROGRAM).resolves({
                "multiply_test.aleo": MULTIPLY_PROGRAM,
            });
            // multiply_test.aleo has no imports, network returns empty
            networkStub.withArgs(MULTIPLY_PROGRAM).resolves({});

            const { builder } = await (pm as any).buildProgramImports(DOUBLE_PROGRAM, undefined, true, "double_it");
            expect(builder.contains("multiply_test.aleo")).to.equal(true);
        });
    });

    describe("buildProgramImports — boundary conditions", () => {
        // Program that would import itself — BFS dedup handles it
        it("should handle duplicate program in import chain via BFS dedup", async () => {
            const keyProvider = createMockKeyProvider();
            const pm = new ProgramManager("https://api.provable.com/v2", keyProvider);

            const networkStub = sinon.stub(pm.networkClient, "getProgramImports");
            // quadruple imports double — initial call returns direct imports only
            networkStub.withArgs(QUADRUPLE_PROGRAM).resolves({
                "double_test.aleo": DOUBLE_PROGRAM,
            });
            networkStub.resolves({});

            // BFS discovers multiply_test.aleo as a transitive import of double_test.aleo
            const getProgramStub = sinon.stub(pm.networkClient, "getProgram");
            getProgramStub.withArgs("multiply_test.aleo").resolves(MULTIPLY_PROGRAM);

            const { builder } = await (pm as any).buildProgramImports(QUADRUPLE_PROGRAM, undefined, true, "quadruple_it");
            expect(builder.contains("double_test.aleo")).to.equal(true);
            expect(builder.contains("multiply_test.aleo")).to.equal(true);
            // Should have exactly 2 programs (no duplicates)
            expect(Array.from(builder.programNames())).to.have.length(2);
        });

        // Deep chain (A→B→C→D) — all collected in correct dependency order
        it("should resolve deep transitive chain (3 levels) in dependency order", async () => {
            const keyProvider = createMockKeyProvider();
            const pm = new ProgramManager("https://api.provable.com/v2", keyProvider);

            const networkStub = sinon.stub(pm.networkClient, "getProgramImports");
            // Initial call returns direct imports only
            networkStub.withArgs(ADD_QUAD_PROGRAM).resolves({
                "sum_double_test.aleo": ADD_DOUBLE_PROGRAM,
            });
            networkStub.resolves({});

            // BFS discovers sum_test.aleo as a transitive import of sum_double_test.aleo
            const getProgramStub = sinon.stub(pm.networkClient, "getProgram");
            getProgramStub.withArgs("sum_test.aleo").resolves(ADD_PROGRAM);

            const { builder } = await (pm as any).buildProgramImports(ADD_QUAD_PROGRAM, undefined, true, "sum_quad");

            expect(builder.contains("sum_double_test.aleo")).to.equal(true);
            expect(builder.contains("sum_test.aleo")).to.equal(true);
            expect(Array.from(builder.programNames())).to.have.length(2);
        });
    });

    describe("buildProgramImports — call chain filtering", () => {
        // Verifies that loadKeysFromStore only loads keys for called functions
        it("should only load keys for functions in the call chain", async () => {
            const mockStore = createMockKeyStore();
            (mockStore.getProvingKey as sinon.SinonStub).resolves(null);
            (mockStore.getVerifyingKey as sinon.SinonStub).resolves(null);

            const keyProvider = createMockKeyProvider(mockStore);
            const pm = new ProgramManager("https://api.provable.com/v2", keyProvider);

            const networkStub = sinon.stub(pm.networkClient, "getProgramImports");
            networkStub.withArgs(CALLS_ALPHA_PROGRAM).resolves({
                "multi_fn_test.aleo": MULTI_FN_PROGRAM,
            });
            networkStub.resolves({});

            const { builder } = await (pm as any).buildProgramImports(CALLS_ALPHA_PROGRAM, undefined, true, "run_alpha");

            // getProvingKey should have been called only for "alpha" function, not "beta" or "gamma"
            const pkCalls = (mockStore.getProvingKey as sinon.SinonStub).getCalls();
            const queriedFunctions = pkCalls.map((c: any) => c.args[0].functionName);
            expect(queriedFunctions).to.include("alpha");
            expect(queriedFunctions).to.not.include("beta");
            expect(queriedFunctions).to.not.include("gamma");
        });
    });

    describe("getImportNames regex", () => {
        it("should extract a single import name", () => {
            const result = (ProgramManager as any).getImportNames(DOUBLE_PROGRAM);
            expect(result).to.deep.equal(["multiply_test.aleo"]);
        });

        it("should return empty array for program with no imports", () => {
            const result = (ProgramManager as any).getImportNames(MULTIPLY_PROGRAM);
            expect(result).to.deep.equal([]);
        });

        it("should extract multiple import names", () => {
            const result = (ProgramManager as any).getImportNames(MULTI_IMPORT_PROGRAM);
            expect(result).to.have.length(2);
            expect(result).to.include("multiply_test.aleo");
            expect(result).to.include("sum_test.aleo");
        });

        it("should match WASM Program.fromString().getImports() output", () => {
            // Cross-validate the regex against the authoritative WASM parser
            for (const source of [MULTIPLY_PROGRAM, DOUBLE_PROGRAM, QUADRUPLE_PROGRAM, MULTI_IMPORT_PROGRAM]) {
                const regexResult = (ProgramManager as any).getImportNames(source);
                const wasmResult = Array.from(Program.fromString(source).getImports());
                expect(regexResult).to.deep.equal(wasmResult,
                    `Mismatch for program source starting with: ${source.slice(0, 40)}...`);
            }
        });
    });

    describe("buildProgramImports — BFS optimization", () => {
        it("should not call getProgram when initial getProgramImports returns full closure", async () => {
            const keyProvider = createMockKeyProvider();
            const pm = new ProgramManager("https://api.provable.com/v2", keyProvider);

            // getProgramImports returns the full transitive closure (realistic behavior)
            sinon.stub(pm.networkClient, "getProgramImports").withArgs(QUADRUPLE_PROGRAM).resolves({
                "multiply_test.aleo": MULTIPLY_PROGRAM,
                "double_test.aleo": DOUBLE_PROGRAM,
            });

            const getProgramStub = sinon.stub(pm.networkClient, "getProgram");

            const { builder } = await (pm as any).buildProgramImports(QUADRUPLE_PROGRAM, undefined, true, "quadruple_it");
            expect(builder.contains("double_test.aleo")).to.equal(true);
            expect(builder.contains("multiply_test.aleo")).to.equal(true);
            // getProgram should never be called — all sources already known
            expect(getProgramStub.called).to.equal(false);
        });

        it("should skip fetching siblings already in resolvedImports", async () => {
            const keyProvider = createMockKeyProvider();
            const pm = new ProgramManager("https://api.provable.com/v2", keyProvider);

            const networkStub = sinon.stub(pm.networkClient, "getProgramImports");
            networkStub.withArgs(MULTI_IMPORT_PROGRAM).resolves({});
            networkStub.resolves({});

            const getProgramStub = sinon.stub(pm.networkClient, "getProgram");
            getProgramStub.withArgs("multiply_test.aleo").resolves(MULTIPLY_PROGRAM);
            getProgramStub.withArgs("sum_test.aleo").resolves(ADD_PROGRAM);

            // Both siblings provided by user — BFS should skip fetching
            const imports = {
                "multiply_test.aleo": MULTIPLY_PROGRAM,
                "sum_test.aleo": ADD_PROGRAM,
            };
            const { builder } = await (pm as any).buildProgramImports(MULTI_IMPORT_PROGRAM, imports, true, "compute");
            expect(builder.contains("multiply_test.aleo")).to.equal(true);
            expect(builder.contains("sum_test.aleo")).to.equal(true);
            expect(getProgramStub.called).to.equal(false);
        });

        it("should fetch multiple unknown siblings in parallel via getProgram", async () => {
            const keyProvider = createMockKeyProvider();
            const pm = new ProgramManager("https://api.provable.com/v2", keyProvider);

            // getProgramImports returns multi_import_test source but NOT its sub-imports
            const networkStub = sinon.stub(pm.networkClient, "getProgramImports");
            networkStub.withArgs(MULTI_IMPORT_PROGRAM).resolves({});
            networkStub.resolves({});

            // BFS discovers multiply_test.aleo and sum_test.aleo from the source,
            // then fetches both via getProgram in parallel
            const getProgramStub = sinon.stub(pm.networkClient, "getProgram");
            getProgramStub.withArgs("multiply_test.aleo").resolves(MULTIPLY_PROGRAM);
            getProgramStub.withArgs("sum_test.aleo").resolves(ADD_PROGRAM);

            // Only provide multi_import_test source — its sub-imports are unknown
            const imports = { "multi_import_test.aleo": MULTI_IMPORT_PROGRAM };
            const { builder } = await (pm as any).buildProgramImports(MULTI_IMPORT_PROGRAM, imports, true, "compute");

            // Both siblings should have been fetched via getProgram
            expect(getProgramStub.callCount).to.equal(2);
            expect(builder.contains("multiply_test.aleo")).to.equal(true);
            expect(builder.contains("sum_test.aleo")).to.equal(true);
        });

        it("should handle getProgram failures gracefully during BFS discovery", async () => {
            const keyProvider = createMockKeyProvider();
            const pm = new ProgramManager("https://api.provable.com/v2", keyProvider);

            // Initial call returns direct import only
            const networkStub = sinon.stub(pm.networkClient, "getProgramImports");
            networkStub.withArgs(QUADRUPLE_PROGRAM).resolves({
                "double_test.aleo": DOUBLE_PROGRAM,
            });
            networkStub.resolves({});

            // Transitive import fetch fails — multiply_test.aleo can't be resolved
            sinon.stub(pm.networkClient, "getProgram")
                .withArgs("multiply_test.aleo").rejects(new Error("Network timeout"));

            // Should not throw — BFS catches getProgram failures, and Phase 2
            // skips programs whose dependencies couldn't be resolved.
            const { builder } = await (pm as any).buildProgramImports(QUADRUPLE_PROGRAM, undefined, true, "quadruple_it");
            expect(builder).to.not.be.undefined;
            // double_test.aleo can't be added because its dep is missing
            expect(builder.contains("double_test.aleo")).to.equal(false);
        });
    });

    describe("KeyLocator factories", () => {
        it("provingKeyLocator should create a correct locator", () => {
            const loc = provingKeyLocator("credits.aleo", "transfer_public", 2);
            expect(loc.program).to.equal("credits.aleo");
            expect(loc.functionName).to.equal("transfer_public");
            expect(loc.edition).to.equal(2);
            expect(loc.amendment).to.equal(0);
            expect(loc.keyType).to.equal("prover");
        });

        it("verifyingKeyLocator should create a correct locator", () => {
            const loc = verifyingKeyLocator("credits.aleo", "transfer_public");
            expect(loc.program).to.equal("credits.aleo");
            expect(loc.functionName).to.equal("transfer_public");
            expect(loc.edition).to.equal(1);
            expect(loc.amendment).to.equal(0);
            expect(loc.keyType).to.equal("verifier");
        });

        it("provingKeyLocator should default edition to 1", () => {
            const loc = provingKeyLocator("test.aleo", "main");
            expect(loc.edition).to.equal(1);
        });
    });

    describe("Prepared programs", function () {
        this.timeout(60_000);

        it("should reuse a prepared process for fee-master and direct-fee proving requests", async () => {
            const keyProvider = createMockKeyProvider();
            const pm = new ProgramManager("https://api.provable.com/v2", keyProvider);
            const privateKey = new PrivateKey();

            sinon.stub(pm.networkClient, "getProgramImports").resolves({
                "multiply_test.aleo": MULTIPLY_PROGRAM,
            });
            sinon.stub(pm.networkClient, "getProgramAmendmentCount").resolves({
                program_id: "multiply_test.aleo",
                edition: 1,
                amendment_count: 0,
            });
            const buildImportsSpy = sinon.spy(pm as any, "buildProgramImports");

            const preparedProgram = await pm.prepareProgram({
                programName: "double_test.aleo",
                functionName: "double_it",
                programSource: DOUBLE_PROGRAM,
                programImports: {
                    "multiply_test.aleo": MULTIPLY_PROGRAM,
                },
                edition: 1,
            });

            expect(preparedProgram.programName).to.equal("double_test.aleo");
            expect(preparedProgram.functionName).to.equal("double_it");

            try {
                const authorization = await pm.buildAuthorizationUnchecked({
                    programName: "double_test.aleo",
                    functionName: "double_it",
                    inputs: ["5u32"],
                    privateKey,
                    programSource: DOUBLE_PROGRAM,
                    programImports: {
                        "multiply_test.aleo": MULTIPLY_PROGRAM,
                    },
                    edition: 1,
                    preparedProgram,
                });
                expect(authorization.transitions().length).to.equal(2);
                authorization.free();

                const provingRequest = await pm.provingRequest({
                    programName: "double_test.aleo",
                    functionName: "double_it",
                    inputs: ["5u32"],
                    priorityFee: 0,
                    privateFee: false,
                    privateKey,
                    programSource: DOUBLE_PROGRAM,
                    programImports: {
                        "multiply_test.aleo": MULTIPLY_PROGRAM,
                    },
                    edition: 1,
                    broadcast: false,
                    unchecked: true,
                    useFeeMaster: true,
                    preparedProgram,
                });

                expect(provingRequest.authorization().transitions().length).to.equal(2);
                expect(provingRequest.feeAuthorization()).to.equal(undefined);

                const directFeeProvingRequest = await pm.provingRequest({
                    programName: "double_test.aleo",
                    functionName: "double_it",
                    inputs: ["5u32"],
                    priorityFee: 0,
                    privateFee: false,
                    privateKey,
                    programSource: DOUBLE_PROGRAM,
                    programImports: {
                        "multiply_test.aleo": MULTIPLY_PROGRAM,
                    },
                    edition: 1,
                    broadcast: false,
                    unchecked: true,
                    useFeeMaster: false,
                    preparedProgram,
                });

                expect(directFeeProvingRequest.authorization().transitions().length).to.equal(2);
                expect(directFeeProvingRequest.feeAuthorization()).to.not.equal(undefined);
                expect(buildImportsSpy.calledOnce).to.equal(true);
            } finally {
                preparedProgram.free();
            }
        });

        it("should use prepared imports when estimating a private fee record", async () => {
            const keyProvider = createMockKeyProvider();
            const pm = new ProgramManager("https://api.provable.com/v2", keyProvider);

            sinon.stub(pm.networkClient, "getProgramImports").resolves({
                "multiply_test.aleo": MULTIPLY_PROGRAM,
            });
            sinon.stub(pm.networkClient, "getProgramAmendmentCount").resolves({
                program_id: "multiply_test.aleo",
                edition: 1,
                amendment_count: 0,
            });

            const preparedProgram = await pm.prepareProgram({
                programName: "double_test.aleo",
                functionName: "double_it",
                programSource: DOUBLE_PROGRAM,
                programImports: {
                    "multiply_test.aleo": MULTIPLY_PROGRAM,
                },
                edition: 1,
            });
            const estimateFeeStub = sinon.stub(pm, "estimateExecutionFee").resolves(1n);
            sinon.stub(pm, "getCreditsRecord").resolves({} as any);
            sinon.stub(ProgramManagerBase, "buildProvingRequest").resolves({} as any);

            try {
                await pm.provingRequest({
                    programName: "double_test.aleo",
                    functionName: "double_it",
                    inputs: ["5u32"],
                    priorityFee: 0,
                    privateFee: true,
                    privateKey: new PrivateKey(),
                    broadcast: false,
                    unchecked: true,
                    useFeeMaster: false,
                    preparedProgram,
                });

                expect(estimateFeeStub.calledOnce).to.equal(true);
                expect(estimateFeeStub.firstCall.args[0].imports).to.deep.equal({
                    "multiply_test.aleo": MULTIPLY_PROGRAM,
                });
            } finally {
                preparedProgram.free();
            }
        });

        it("should materialize prepared imports exactly once per proving request", async () => {
            const keyProvider = createMockKeyProvider();
            const pm = new ProgramManager("https://api.provable.com/v2", keyProvider);

            sinon.stub(pm.networkClient, "getProgramImports").resolves({
                "multiply_test.aleo": MULTIPLY_PROGRAM,
            });
            sinon.stub(pm.networkClient, "getProgramAmendmentCount").resolves({
                program_id: "multiply_test.aleo",
                edition: 1,
                amendment_count: 0,
            });

            const preparedProgram = await pm.prepareProgram({
                programName: "double_test.aleo",
                functionName: "double_it",
                programSource: DOUBLE_PROGRAM,
                programImports: {
                    "multiply_test.aleo": MULTIPLY_PROGRAM,
                },
                edition: 1,
            });
            sinon.stub(pm, "estimateExecutionFee").resolves(1n);
            sinon.stub(pm, "getCreditsRecord").resolves({} as any);
            sinon.stub(ProgramManagerBase, "buildProvingRequest").resolves({} as any);

            // Copying import sources out of WASM dominates the prepared-path
            // overhead in provingRequest. programImportsFromBuilder walks
            // programNames once per materialization, so one call proves the
            // import set crossed the WASM boundary exactly once.
            const programNamesSpy = sinon.spy(
                ProgramImportsBuilder.prototype,
                "programNames",
            );
            try {
                await pm.provingRequest({
                    programName: "double_test.aleo",
                    functionName: "double_it",
                    inputs: ["5u32"],
                    priorityFee: 0,
                    privateFee: true,
                    privateKey: new PrivateKey(),
                    broadcast: false,
                    unchecked: true,
                    useFeeMaster: false,
                    preparedProgram,
                });

                expect(programNamesSpy.callCount).to.equal(1);
            } finally {
                programNamesSpy.restore();
                preparedProgram.free();
            }
        });

        it("should reject preparing a function that does not exist", async () => {
            const keyProvider = createMockKeyProvider();
            const pm = new ProgramManager("https://api.provable.com/v2", keyProvider);

            let error: Error | undefined;
            try {
                await pm.prepareProgram({
                    programName: "multiply_test.aleo",
                    functionName: "missing",
                    programSource: MULTIPLY_PROGRAM,
                    edition: 1,
                });
            } catch (e) {
                error = e as Error;
            }

            expect(error?.message).to.equal(
                "Function 'missing' does not exist in program 'multiply_test.aleo'",
            );
        });

        it("should reject a prepared context for a different function", async () => {
            const keyProvider = createMockKeyProvider();
            const pm = new ProgramManager("https://api.provable.com/v2", keyProvider);
            const preparedProgram = await pm.prepareProgram({
                programName: "multiply_test.aleo",
                functionName: "multiply",
                programSource: MULTIPLY_PROGRAM,
                edition: 1,
            });

            try {
                let error: Error | undefined;
                try {
                    await pm.buildAuthorizationUnchecked({
                        programName: "multiply_test.aleo",
                        functionName: "other",
                        inputs: ["2u32", "3u32"],
                        privateKey: new PrivateKey(),
                        preparedProgram,
                    });
                } catch (e) {
                    error = e as Error;
                }

                expect(error?.message).to.contain(
                    "Prepared program is for multiply_test.aleo/multiply",
                );
            } finally {
                preparedProgram.free();
            }
        });

        it("should reject source, edition, and import mismatches", async () => {
            const keyProvider = createMockKeyProvider();
            const pm = new ProgramManager("https://api.provable.com/v2", keyProvider);
            const privateKey = new PrivateKey();
            const preparedProgram = await pm.prepareProgram({
                programName: "double_test.aleo",
                functionName: "double_it",
                programSource: DOUBLE_PROGRAM,
                programImports: {
                    "multiply_test.aleo": MULTIPLY_PROGRAM,
                },
                edition: 1,
            });

            const expectValidationError = async (
                action: () => Promise<unknown>,
                expectedMessage: string,
            ) => {
                let error: Error | undefined;
                try {
                    await action();
                } catch (e) {
                    error = e as Error;
                }
                expect(error?.message).to.equal(expectedMessage);
            };

            try {
                await expectValidationError(
                    () => pm.buildAuthorizationUnchecked({
                        programName: "double_test.aleo",
                        functionName: "double_it",
                        inputs: ["5u32"],
                        privateKey,
                        programSource: `${DOUBLE_PROGRAM}\n`,
                        preparedProgram,
                    }),
                    "Prepared program source does not match the supplied program source",
                );

                await expectValidationError(
                    () => pm.buildAuthorizationUnchecked({
                        programName: "double_test.aleo",
                        functionName: "double_it",
                        inputs: ["5u32"],
                        privateKey,
                        edition: 2,
                        preparedProgram,
                    }),
                    "Prepared program edition does not match the supplied edition",
                );

                await expectValidationError(
                    () => pm.buildAuthorizationUnchecked({
                        programName: "double_test.aleo",
                        functionName: "double_it",
                        inputs: ["5u32"],
                        privateKey,
                        programImports: {
                            "multiply_test.aleo": ADD_PROGRAM,
                        },
                        preparedProgram,
                    }),
                    "Prepared program import 'multiply_test.aleo' does not match the supplied import",
                );
            } finally {
                preparedProgram.free();
            }
        });

        it("should fail clearly after a prepared context is freed", async () => {
            const keyProvider = createMockKeyProvider();
            const pm = new ProgramManager("https://api.provable.com/v2", keyProvider);
            const preparedProgram = await pm.prepareProgram({
                programName: "multiply_test.aleo",
                functionName: "multiply",
                programSource: MULTIPLY_PROGRAM,
                edition: 1,
            });

            preparedProgram.free();
            preparedProgram.free();

            let error: Error | undefined;
            try {
                await pm.buildAuthorizationUnchecked({
                    programName: "multiply_test.aleo",
                    functionName: "multiply",
                    inputs: ["2u32", "3u32"],
                    privateKey: new PrivateKey(),
                    preparedProgram,
                });
            } catch (e) {
                error = e as Error;
            }

            expect(error?.message).to.equal("Prepared program has already been freed");
        });
    });

    // =========================================================================
    // Integration tests — require WASM execution (slow, ~10-20s each)
    // =========================================================================

    describe("addProvingKeyBytes / addVerifyingKeyBytes", () => {
        it("should reject keys when program has not been added", () => {
            const builder = new ProgramImportsBuilder();
            const garbage = new Uint8Array([1, 2, 3, 4]);

            expect(() => builder.addProvingKeyBytes("nonexistent.aleo", "main", garbage))
                .to.throw("must be added via addProgram");
            expect(() => builder.addVerifyingKeyBytes("nonexistent.aleo", "main", garbage))
                .to.throw("must be added via addProgram");
        });

        it("should reject invalid key bytes with a deserialization error", () => {
            const builder = new ProgramImportsBuilder();
            builder.addProgram("multiply_test.aleo", MULTIPLY_PROGRAM);
            const garbage = new Uint8Array([0, 0, 0, 0, 255, 255]);

            expect(() => builder.addProvingKeyBytes("multiply_test.aleo", "multiply", garbage))
                .to.throw();
            expect(() => builder.addVerifyingKeyBytes("multiply_test.aleo", "multiply", garbage))
                .to.throw();
        });
    });

    describe("Integration: execution → key bytes round-trip", function () {
        this.timeout(120_000); // Key synthesis can take 10-30s

        /** Shared state: execute once, reuse across tests. */
        let enrichedBuilder: ProgramImportsBuilder;
        let extractedObj: Record<string, any>;

        before(async () => {
            // Execute multiply_test.aleo/multiply(5, 3) offline with a builder
            // so the enriched builder comes back with synthesized keys.
            const pk = new PrivateKey();
            const builder = new ProgramImportsBuilder();
            builder.addProgram("multiply_test.aleo", MULTIPLY_PROGRAM);

            const offlineQuery = new OfflineQuery(
                0,
                "sr1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gk0xu",
            );

            const result = await ProgramManagerBase.executeFunctionOffline(
                pk,
                MULTIPLY_PROGRAM,
                "multiply",
                ["5u32", "3u32"],
                false, // proveExecution
                false, // cache
                undefined, // imports
                undefined, // provingKey
                undefined, // verifyingKey
                undefined, // url
                QueryOption.offlineQuery(offlineQuery),
                undefined, // edition
                builder.clone(),
            );

            // Verify execution output
            const outputs = result.getOutputs();
            expect(outputs).to.have.lengthOf(1);
            expect(outputs[0]).to.contain("15");

            // With interior mutability (Rc<RefCell<>>), the original builder
            // already contains synthesized keys — no need to extract from result.
            enrichedBuilder = builder;

            // Extract to object (structured format with keys)
            extractedObj = enrichedBuilder.toObject();
        });

        it("should have synthesized keys in the enriched builder", () => {
            const pk = enrichedBuilder.getProvingKey("multiply_test.aleo", "multiply");
            const vk = enrichedBuilder.getVerifyingKey("multiply_test.aleo", "multiply");
            expect(pk).to.not.be.undefined;
            expect(vk).to.not.be.undefined;
        });

        it("functionKeysAvailable should list the synthesized function", () => {
            const available = enrichedBuilder.functionKeysAvailable("multiply_test.aleo");
            const names = Array.from(available) as string[];
            expect(names).to.include("multiply");
        });

        it("toObject should produce structured format with key bytes", () => {
            const entry = extractedObj["multiply_test.aleo"];
            expect(entry).to.not.be.undefined;

            // Structured format has .program and .keys
            expect(entry).to.have.property("program");
            expect(entry).to.have.property("keys");

            const keys = entry.keys;
            expect(keys).to.have.property("multiply");
            expect(keys.multiply).to.have.property("provingKey");
            expect(keys.multiply).to.have.property("verifyingKey");
            expect(keys.multiply.provingKey).to.be.instanceOf(Uint8Array);
            expect(keys.multiply.verifyingKey).to.be.instanceOf(Uint8Array);
            expect(keys.multiply.provingKey.length).to.be.greaterThan(0);
            expect(keys.multiply.verifyingKey.length).to.be.greaterThan(0);
        });

        it("fromObject should round-trip structured format with keys", () => {
            const roundTripped = ProgramImportsBuilder.fromObject(extractedObj);

            // Program should be present
            expect(roundTripped.contains("multiply_test.aleo")).to.equal(true);
            expect(roundTripped.getProgram("multiply_test.aleo")).to.contain("multiply");

            // Keys should have been deserialized via addProvingKeyBytes / addVerifyingKeyBytes
            const pk = roundTripped.getProvingKey("multiply_test.aleo", "multiply");
            const vk = roundTripped.getVerifyingKey("multiply_test.aleo", "multiply");
            expect(pk).to.not.be.undefined;
            expect(vk).to.not.be.undefined;

            // functionKeysAvailable should reflect the round-tripped keys
            const available = roundTripped.functionKeysAvailable("multiply_test.aleo");
            expect(Array.from(available)).to.include("multiply");
        });

        it("addProvingKeyBytes / addVerifyingKeyBytes should accept real key bytes", () => {
            // Extract raw bytes from the enriched builder's toObject output
            const entry = extractedObj["multiply_test.aleo"];
            const pkBytes: Uint8Array = entry.keys.multiply.provingKey;
            const vkBytes: Uint8Array = entry.keys.multiply.verifyingKey;

            // Create a fresh builder, add the program, then inject keys via bytes
            const fresh = new ProgramImportsBuilder();
            fresh.addProgram("multiply_test.aleo", MULTIPLY_PROGRAM);

            // Should not throw
            fresh.addProvingKeyBytes("multiply_test.aleo", "multiply", pkBytes);
            fresh.addVerifyingKeyBytes("multiply_test.aleo", "multiply", vkBytes);

            // Keys should now be retrievable
            expect(fresh.getProvingKey("multiply_test.aleo", "multiply")).to.not.be.undefined;
            expect(fresh.getVerifyingKey("multiply_test.aleo", "multiply")).to.not.be.undefined;
        });

        it("duplicate key insertion should be silently ignored", () => {
            const entry = extractedObj["multiply_test.aleo"];
            const pkBytes: Uint8Array = entry.keys.multiply.provingKey;
            const vkBytes: Uint8Array = entry.keys.multiply.verifyingKey;

            const fresh = new ProgramImportsBuilder();
            fresh.addProgram("multiply_test.aleo", MULTIPLY_PROGRAM);

            // Insert once
            fresh.addProvingKeyBytes("multiply_test.aleo", "multiply", pkBytes);
            fresh.addVerifyingKeyBytes("multiply_test.aleo", "multiply", vkBytes);

            // Insert again — should not throw (guard skips if key already present)
            expect(() => fresh.addProvingKeyBytes("multiply_test.aleo", "multiply", pkBytes))
                .to.not.throw();
            expect(() => fresh.addVerifyingKeyBytes("multiply_test.aleo", "multiply", vkBytes))
                .to.not.throw();
        });
    });

    describe("buildProgramImports — per-import edition resolution", () => {
        afterEach(() => sinon.restore());

        it("should resolve each import's edition independently, not use the top-level edition", async () => {
            const mockStore = createMockKeyStore();
            (mockStore.getProvingKey as sinon.SinonStub).resolves(null);
            (mockStore.getVerifyingKey as sinon.SinonStub).resolves(null);

            const keyProvider = createMockKeyProvider(mockStore);
            const pm = new ProgramManager("https://api.provable.com/v2", keyProvider);

            // Stub network: top-level program is edition 2, import is edition 5
            sinon.stub(pm.networkClient, "getProgramImports").resolves({});
            sinon.stub(pm.networkClient, "getProgram").resolves("");
            const amendmentStub = sinon.stub(pm.networkClient, "getProgramAmendmentCount");
            amendmentStub.callsFake(async (name: string) => {
                if (name === "multiply_test.aleo") {
                    return { program_id: name, edition: 5, amendment_count: 1 };
                }
                return { program_id: name, edition: 2, amendment_count: 0 };
            });

            // Build imports for DOUBLE_PROGRAM (imports multiply_test.aleo)
            const { builder }: any = await (pm as any).buildProgramImports(
                DOUBLE_PROGRAM,
                { "multiply_test.aleo": MULTIPLY_PROGRAM },
                true,
                "double_it",
            );

            // Verify multiply_test.aleo was queried with its own edition, not the top-level's
            const pkCalls = (mockStore.getProvingKey as sinon.SinonStub).getCalls();
            const multiplyPkCalls = pkCalls.filter(
                (c: any) => c.args[0].program === "multiply_test.aleo",
            );
            expect(multiplyPkCalls.length).to.be.greaterThan(0);
            for (const call of multiplyPkCalls) {
                expect(call.args[0].edition).to.equal(5, "import should use its own edition (5), not top-level (2)");
                expect(call.args[0].amendment).to.equal(1);
            }
        });
    });

    describe("buildAuthorization — key caching pipeline", () => {
        afterEach(() => sinon.restore());

        it("should invoke buildProgramImports when building authorization", async () => {
            const mockStore = createMockKeyStore();
            const keyProvider = createMockKeyProvider(mockStore);
            const pm = new ProgramManager("https://api.provable.com/v2", keyProvider);
            pm.setAccount(new Account());

            sinon.stub(pm.networkClient, "getProgramImports").resolves({});
            sinon.stub(pm.networkClient, "getProgram").resolves("");
            sinon.stub(pm.networkClient, "getProgramAmendmentCount").resolves({
                program_id: "double_test.aleo",
                edition: 1,
                amendment_count: 0,
            });

            const buildImportsSpy = sinon.spy(pm as any, "buildProgramImports");

            try {
                await pm.buildAuthorization({
                    programName: "double_test.aleo",
                    programSource: DOUBLE_PROGRAM,
                    functionName: "double_it",
                    inputs: ["5u32"],
                    programImports: { "multiply_test.aleo": MULTIPLY_PROGRAM },
                });
            } catch {
                // Expected — WASM authorize fails without a real proving environment.
            }

            expect(buildImportsSpy.calledOnce).to.be.true;
        });
    });

});
