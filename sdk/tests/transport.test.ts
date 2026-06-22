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

        it("suppresses SDK identifying headers when a custom transport is used", async () => {
            const transport = createMockTransport('"ok"');
            const client = new AleoNetworkClient("https://example.com", { transport });

            await client.fetchRaw("/test");

            const callOptions = transport.firstCall.args[1];
            // With a custom transport and no user-supplied headers, none of our SDK
            // headers (version/environment + method tag) should be attached.
            const headers = callOptions.headers ?? {};
            expect(headers["X-Aleo-SDK-Version"]).to.be.undefined;
            expect(headers["X-Aleo-environment"]).to.be.undefined;
            expect(headers["X-ALEO-METHOD"]).to.be.undefined;
        });

        it("forwards headers set via setHeader even with a custom transport", async () => {
            const transport = createMockTransport('"ok"');
            const client = new AleoNetworkClient("https://example.com", { transport });

            // Header added after construction (no options.headers supplied).
            client.setHeader("X-Custom", "later-value");
            await client.fetchRaw("/test");

            const callOptions = transport.firstCall.args[1];
            expect(callOptions.headers["X-Custom"]).to.equal("later-value");
            // The caller's header flows through, but our SDK defaults must not leak.
            expect(callOptions.headers["X-Aleo-SDK-Version"]).to.be.undefined;
            expect(callOptions.headers["X-Aleo-environment"]).to.be.undefined;
        });

        it("attaches SDK identifying headers when using the default transport", async () => {
            const transport = createMockTransport('"ok"');
            // Default transport, but route the underlying request through our stub
            // so we can inspect the headers the SDK attaches.
            const client = new AleoNetworkClient("https://example.com");
            client.transport = transport;

            await client.getLatestHeight();

            const callOptions = transport.firstCall.args[1];
            expect(callOptions.headers["X-Aleo-SDK-Version"]).to.be.a("string");
            expect(callOptions.headers["X-ALEO-METHOD"]).to.equal("getLatestHeight");
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

    describe("Transport-aware state fetching", () => {
        it("getStateRoot uses transport", async () => {
            const transport = createMockTransport('"sr1test"');
            const client = new AleoNetworkClient("https://example.com", { transport });

            const result = await client.getStateRoot();

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

        it("computeQueryRequirements returns fee commitments for non-dynamic program", async () => {
            const { ProgramManagerBase, Account, RecordPlaintext } = await import("@provablehq/sdk/%%NETWORK%%.js");

            const account = new Account();
            const address = account.address().to_string();

            // Create a fee record owned by this account
            const feeRecord = RecordPlaintext.fromString(`{
  owner: ${address}.private,
  microcredits: 1000000u64.private,
  _nonce: 0group.public
}`);

            const helloProgram = "program hello_fee_test.aleo;\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.public;\n    add r0 r1 into r2;\n    output r2 as u32.public;\n";

            const reqs = ProgramManagerBase.computeQueryRequirements(
                helloProgram,
                "hello",
                ["5u32", "5u32"],
                account.privateKey(),
                feeRecord,
            );

            expect(reqs.hasDynamicInputs).to.be.false;
            expect(reqs.commitments).to.be.an("array");
            // Fee record should produce a commitment
            expect(reqs.commitments.length).to.be.greaterThan(0);
        });

        it("computeQueryRequirements returns fee commitments even for dynamic-input program", async () => {
            const { ProgramManagerBase, Account, RecordPlaintext } = await import("@provablehq/sdk/%%NETWORK%%.js");

            const account = new Account();
            const address = account.address().to_string();

            const feeRecord = RecordPlaintext.fromString(`{
  owner: ${address}.private,
  microcredits: 1000000u64.private,
  _nonce: 0group.public
}`);

            // A program with dynamic.record input — triggers hasDynamicInputs
            const dynamicProgram = `program dd_fee_test.aleo;

function dynamic_fn:
    input r0 as dynamic.record;
    output r0 as dynamic.record;

constructor:
    assert.eq true true;
`;

            const reqs = ProgramManagerBase.computeQueryRequirements(
                dynamicProgram,
                "dynamic_fn",
                ["{}"],  // placeholder input
                account.privateKey(),
                feeRecord,
            );

            // Main function is dynamic
            expect(reqs.hasDynamicInputs).to.be.true;
            // But fee commitments should still be computed (credits.aleo is never dynamic)
            expect(reqs.commitments).to.be.an("array");
            expect(reqs.commitments.length).to.be.greaterThan(0);
        });
    });

    describe("QueryOption integration", () => {
        it("ProgramManager wraps CallbackQuery in QueryOption and WASM invokes callbacks", async () => {
            const { ProgramManager, Account } = await import("@provablehq/sdk/%%NETWORK%%.js");

            const transport = createMockTransport("{}");
            const pm = new ProgramManager("https://example.com", undefined, undefined, { transport });
            pm.setAccount(new Account());

            // Spy on the network client methods that the CallbackQuery wraps.
            // run() constructs a QueryOption.callbackQuery(...) and passes it to WASM.
            // WASM invokes the callbacks during trace.prepare_async().
            const stateRootSpy = sinon.stub(pm.networkClient, "getStateRoot").resolves("sr1test");
            const heightSpy = sinon.stub(pm.networkClient, "getLatestHeight").resolves(1000);
            const helloProgram = "program hello_cb_test.aleo;\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.public;\n    add r0 r1 into r2;\n    output r2 as u32.public;\n";

            try {
                await pm.run(helloProgram, "hello", ["5u32", "5u32"], true);
            } catch (e) {
                // Expected — WASM will fail with mock state data
            }

            // CallbackQuery's callbacks should have been invoked via WASM
            // (state root and height are always needed for trace preparation)
            expect(stateRootSpy.called).to.be.true;
            expect(heightSpy.called).to.be.true;
        });
    });

    describe("No custom transport — skips CallbackQuery", () => {
        it("ProgramManager does not invoke CallbackQuery when no custom transport is set", async () => {
            const { ProgramManager, Account } = await import("@provablehq/sdk/%%NETWORK%%.js");

            // No transport option — ProgramManager should let WASM use SnapshotQuery
            const pm = new ProgramManager("https://example.com");
            pm.setAccount(new Account());

            expect(pm.networkClient.hasCustomTransport).to.be.false;

            // Spy on getStateRoot — if CallbackQuery were used, this would be called
            const stateRootSpy = sinon.stub(pm.networkClient, "getStateRoot").resolves("sr1test");
            const helloProgram = "program hello_no_transport.aleo;\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.public;\n    add r0 r1 into r2;\n    output r2 as u32.public;\n";

            try {
                await pm.run(helloProgram, "hello", ["5u32", "5u32"], true);
            } catch (e) {
                // Expected — WASM SnapshotQuery will fail against example.com
            }

            // getStateRoot should NOT have been called — WASM handles it internally
            expect(stateRootSpy.called).to.be.false;
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
