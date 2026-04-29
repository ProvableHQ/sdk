import sinon from "sinon";
import { expect } from "chai";
import {
    AleoNetworkClient,
    AleoKeyProvider,
    RecordScanner,
    TransportFunction,
} from "@provablehq/sdk/%%NETWORK%%.js";

/**
 * Creates a sinon stub that returns a mock Response. The stub records all
 * calls so tests can assert which URLs and options were passed.
 */
function createMockTransport(body = "{}", status = 200): sinon.SinonStub {
    return sinon.stub().resolves(
        new Response(body, {
            status,
            headers: { "Content-Type": "application/json" },
        }),
    );
}

describe("Configurable Transport", () => {
    afterEach(() => {
        sinon.restore();
    });

    describe("AleoNetworkClient", () => {
        it("uses custom transport for fetchRaw (GET requests)", async () => {
            const transport = createMockTransport('"hello"');
            const client = new AleoNetworkClient("https://example.com", { transport });

            const result = await client.fetchRaw("/test");

            expect(transport.calledOnce).to.be.true;
            expect(transport.firstCall.args[0]).to.include("/test");
            expect(result).to.equal('"hello"');
        });

        it("uses custom transport for fetchData (GET + parse)", async () => {
            const transport = createMockTransport('{"height": 12345}');
            const client = new AleoNetworkClient("https://example.com", { transport });

            const result = await client.fetchData<{ height: bigint }>("/block/latest");

            expect(transport.calledOnce).to.be.true;
            expect(result.height).to.equal(BigInt(12345));
        });

        it("defaults to a fetch wrapper when no transport provided", () => {
            const client = new AleoNetworkClient("https://example.com");

            expect(client.transport).to.be.a("function");
            expect(client.transport).to.not.equal(fetch);
        });

        it("custom transport receives correct headers", async () => {
            const transport = createMockTransport('"ok"');
            const client = new AleoNetworkClient("https://example.com", {
                transport,
                headers: { "X-Custom": "test-value" },
            });

            await client.fetchRaw("/test");

            const callOptions = transport.firstCall.args[1];
            expect(callOptions.headers["X-Custom"]).to.equal("test-value");
        });

        it("retry logic works with custom transport", async () => {
            let attemptCount = 0;
            const transport: sinon.SinonStub = sinon.stub().callsFake(async () => {
                attemptCount++;
                if (attemptCount < 3) {
                    const err = Object.assign(new Error("503 Service Unavailable"), { status: 503 });
                    throw err;
                }
                return new Response('"success"', { status: 200 });
            });
            const client = new AleoNetworkClient("https://example.com", { transport });

            const result = await client.fetchRaw("/test");
            expect(attemptCount).to.equal(3);
            expect(result).to.equal('"success"');
        });
    });

    describe("RecordScanner", () => {
        it("uses custom transport for requests", () => {
            const transport = createMockTransport('{"uuid": "test-uuid"}');
            const scanner = new RecordScanner({
                url: "https://record-scanner.example.com",
                transport,
            });

            expect(scanner.transport).to.equal(transport);
        });

        it("defaults to a fetch wrapper when no transport provided", () => {
            const scanner = new RecordScanner({
                url: "https://record-scanner.example.com",
            });

            expect(scanner.transport).to.be.a("function");
            expect(scanner.transport).to.not.equal(fetch);
        });
    });

    describe("AleoKeyProvider", () => {
        it("uses custom transport for key fetching", () => {
            const transport = createMockTransport();
            const provider = new AleoKeyProvider({ transport });

            expect(provider.transport).to.equal(transport);
        });

        it("defaults to a fetch wrapper when no transport provided", () => {
            const provider = new AleoKeyProvider();

            expect(provider.transport).to.be.a("function");
            expect(provider.transport).to.not.equal(fetch);
        });

        it("constructor is backward compatible with no arguments", () => {
            const provider = new AleoKeyProvider();

            expect(provider).to.be.instanceOf(AleoKeyProvider);
            expect(provider.transport).to.be.a("function");
        });
    });

    describe("Auto-OfflineQuery construction", () => {
        it("ProgramManager auto-OfflineQuery calls getLatestStateRoot and getLatestHeight via transport", async () => {
            const { ProgramManager, Account } = await import("@provablehq/sdk/%%NETWORK%%.js");

            const transport = createMockTransport("{}");
            const pm = new ProgramManager("https://example.com", undefined, undefined, { transport });
            pm.setAccount(new Account());

            // Spy on the network client methods that buildAutoOfflineQuery calls
            const stateRootSpy = sinon.stub(pm.networkClient, "getLatestStateRoot").resolves("sr1test");
            const heightSpy = sinon.stub(pm.networkClient, "getLatestHeight").resolves(1000);

            // Call run() which triggers buildAutoOfflineQuery before WASM execution.
            // It will fail at WASM level, but the spies should have been called.
            const helloProgram = "program hello_oq_test.aleo;\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.public;\n    add r0 r1 into r2;\n    output r2 as u32.public;\n";

            try {
                await pm.run(helloProgram, "hello", ["5u32", "5u32"], false);
            } catch (e) {
                // Expected — WASM will fail with mock state root
            }

            expect(stateRootSpy.calledOnce).to.be.true;
            expect(heightSpy.calledOnce).to.be.true;
        });

        it("getLatestStateRoot uses transport", async () => {
            const transport = createMockTransport('"sr1test"');
            const client = new AleoNetworkClient("https://example.com", { transport });

            const result = await client.getLatestStateRoot();

            expect(transport.calledOnce).to.be.true;
            expect(transport.firstCall.args[0]).to.include("stateRoot/latest");
            expect(result).to.equal("sr1test");
        });

        it("getStatePaths uses transport", async () => {
            const transport = createMockTransport('["path1abc", "path1def"]');
            const client = new AleoNetworkClient("https://example.com", { transport });

            const result = await client.getStatePaths(["commit1", "commit2"]);

            expect(transport.calledOnce).to.be.true;
            expect(transport.firstCall.args[0]).to.include("statePaths?commitments=commit1,commit2");
            expect(result).to.deep.equal(["path1abc", "path1def"]);
        });

        it("skips auto-OfflineQuery for dynamic record inputs", async () => {
            const { ProgramManager, Account, ProgramManagerBase } = await import("@provablehq/sdk/%%NETWORK%%.js");

            const transport = createMockTransport("{}");
            const pm = new ProgramManager("https://example.com", undefined, undefined, { transport });
            pm.setAccount(new Account());

            const stateRootSpy = sinon.stub(pm.networkClient, "getLatestStateRoot").resolves("sr1test");
            const heightSpy = sinon.stub(pm.networkClient, "getLatestHeight").resolves(1000);

            // Stub computeQueryRequirements to return hasDynamicInputs: true
            sinon.stub(ProgramManagerBase, "computeQueryRequirements").returns({
                commitments: [],
                hasDynamicInputs: true,
            });

            const helloProgram = "program hello_dyn_test.aleo;\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.public;\n    add r0 r1 into r2;\n    output r2 as u32.public;\n";

            try {
                await pm.run(helloProgram, "hello", ["5u32", "5u32"], false);
            } catch (e) {
                // Expected — WASM will fail
            }

            // State root and height should NOT have been fetched
            // (buildAutoOfflineQuery returns undefined for dynamic inputs)
            expect(stateRootSpy.called).to.be.false;
            expect(heightSpy.called).to.be.false;
        });

        it("falls back gracefully when state fetching fails", async () => {
            const { ProgramManager, Account } = await import("@provablehq/sdk/%%NETWORK%%.js");

            const transport = createMockTransport("{}");
            const pm = new ProgramManager("https://example.com", undefined, undefined, { transport });
            pm.setAccount(new Account());

            // Make state root fetch throw — simulates network failure
            sinon.stub(pm.networkClient, "getLatestStateRoot").rejects(new Error("network timeout"));
            sinon.stub(pm.networkClient, "getLatestHeight").resolves(1000);

            const helloProgram = "program hello_fail_test.aleo;\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.public;\n    add r0 r1 into r2;\n    output r2 as u32.public;\n";

            // Should not throw — falls back to WASM fetch path
            let threw = false;
            try {
                await pm.run(helloProgram, "hello", ["5u32", "5u32"], false);
            } catch (e: any) {
                // WASM-level failure is expected (mock host), but the auto-OfflineQuery
                // failure should not propagate — it should fall through gracefully.
                if (e.message?.includes("network timeout")) {
                    threw = true; // This means the error was NOT caught — bad
                }
            }

            expect(threw).to.be.false;
        });
    });

    describe("Transport propagation", () => {
        it("ProgramManager threads transport to both NetworkClient and KeyProvider", async () => {
            const { ProgramManager } = await import("@provablehq/sdk/%%NETWORK%%.js");

            const transport = createMockTransport();
            const pm = new ProgramManager("https://example.com", undefined, undefined, { transport });

            expect(pm.networkClient.transport).to.equal(transport);
            expect((pm.keyProvider as any).transport).to.equal(transport);
        });
    });
});
