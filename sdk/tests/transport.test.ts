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
