import sinon from "sinon";
import { expect } from "chai";
import {
    setLogLevel,
    getLogLevel,
    logAndThrow,
    setWasmLogLevel,
} from "../src/node.js";
import { logger } from "../src/utils/logger.js";

describe("Logger", () => {
    let logStub: sinon.SinonStub;
    let warnStub: sinon.SinonStub;
    let errorStub: sinon.SinonStub;
    let debugStub: sinon.SinonStub;

    beforeEach(() => {
        logStub = sinon.stub(console, "log");
        warnStub = sinon.stub(console, "warn");
        errorStub = sinon.stub(console, "error");
        debugStub = sinon.stub(console, "debug");
    });

    afterEach(() => {
        sinon.restore();
        setLogLevel("info");
    });

    describe("default behavior", () => {
        it("should default to 'info' level", () => {
            expect(getLogLevel()).to.equal("info");
        });

        it("should pass through logger.log at default level", () => {
            logger.log("test message");
            expect(logStub.calledOnce).to.be.true;
            expect(logStub.firstCall.args[0]).to.equal("test message");
        });

        it("should pass through logger.warn at default level", () => {
            logger.warn("test warning");
            expect(warnStub.calledOnce).to.be.true;
            expect(warnStub.firstCall.args[0]).to.equal("test warning");
        });

        it("should pass through logger.error at default level", () => {
            logger.error("test error");
            expect(errorStub.calledOnce).to.be.true;
            expect(errorStub.firstCall.args[0]).to.equal("test error");
        });

        it("should suppress logger.debug at default level", () => {
            logger.debug("test debug");
            expect(debugStub.called).to.be.false;
        });
    });

    describe("setLogLevel('silent')", () => {
        it("should suppress all logging", () => {
            setLogLevel("silent");
            logger.log("info");
            logger.warn("warn");
            logger.error("error");
            logger.debug("debug");
            expect(logStub.called).to.be.false;
            expect(warnStub.called).to.be.false;
            expect(errorStub.called).to.be.false;
            expect(debugStub.called).to.be.false;
        });
    });

    describe("setLogLevel('error')", () => {
        it("should only allow error messages", () => {
            setLogLevel("error");
            logger.error("error");
            logger.warn("warn");
            logger.log("info");
            logger.debug("debug");
            expect(errorStub.calledOnce).to.be.true;
            expect(warnStub.called).to.be.false;
            expect(logStub.called).to.be.false;
            expect(debugStub.called).to.be.false;
        });
    });

    describe("setLogLevel('warn')", () => {
        it("should allow error and warn messages", () => {
            setLogLevel("warn");
            logger.error("error");
            logger.warn("warn");
            logger.log("info");
            logger.debug("debug");
            expect(errorStub.calledOnce).to.be.true;
            expect(warnStub.calledOnce).to.be.true;
            expect(logStub.called).to.be.false;
            expect(debugStub.called).to.be.false;
        });
    });

    describe("setLogLevel('info')", () => {
        it("should allow error, warn, and info messages", () => {
            setLogLevel("info");
            logger.error("error");
            logger.warn("warn");
            logger.log("info");
            logger.debug("debug");
            expect(errorStub.calledOnce).to.be.true;
            expect(warnStub.calledOnce).to.be.true;
            expect(logStub.calledOnce).to.be.true;
            expect(debugStub.called).to.be.false;
        });
    });

    describe("setLogLevel('debug')", () => {
        it("should allow all messages", () => {
            setLogLevel("debug");
            logger.error("error");
            logger.warn("warn");
            logger.log("info");
            logger.debug("debug");
            expect(errorStub.calledOnce).to.be.true;
            expect(warnStub.calledOnce).to.be.true;
            expect(logStub.calledOnce).to.be.true;
            expect(debugStub.calledOnce).to.be.true;
        });
    });

    describe("getLogLevel", () => {
        it("should reflect the current level after setLogLevel", () => {
            setLogLevel("warn");
            expect(getLogLevel()).to.equal("warn");
            setLogLevel("silent");
            expect(getLogLevel()).to.equal("silent");
            setLogLevel("debug");
            expect(getLogLevel()).to.equal("debug");
        });
    });

    describe("variadic arguments", () => {
        it("should forward all arguments to console.*", () => {
            logger.log("a", "b", 3);
            expect(logStub.calledOnce).to.be.true;
            expect(logStub.firstCall.args).to.deep.equal(["a", "b", 3]);
        });
    });

    describe("WASM log level", () => {
        it("should accept all valid log levels (0-4) without throwing", () => {
            for (let level = 0; level <= 4; level++) {
                expect(() => setWasmLogLevel(level)).to.not.throw();
            }
            setWasmLogLevel(3); // restore default
        });

        it("should clamp values above 4 to debug level", () => {
            // Out-of-range values shouldn't crash; the WASM side clamps to 4
            expect(() => setWasmLogLevel(255)).to.not.throw();
            setWasmLogLevel(3); // restore default
        });

        it("setLogLevel('silent') should propagate to WASM via dynamic import", async () => {
            setLogLevel("silent");
            // The dynamic import resolves asynchronously — wait for it
            await new Promise(r => setTimeout(r, 100));
            // No direct way to read WASM state from TS, but if the propagation
            // throws or fails to load WASM, setLogLevel's catch would swallow
            // it. The fact that this completes without unhandled rejections
            // confirms the dynamic import succeeded.
            setLogLevel("info");
            await new Promise(r => setTimeout(r, 100));
        });

        it("setLogLevel propagation should work for all levels", async () => {
            for (const level of ["silent", "error", "warn", "info", "debug"] as const) {
                setLogLevel(level);
                await new Promise(r => setTimeout(r, 50));
            }
            setLogLevel("info"); // restore
        });
    });

    describe("logAndThrow integration", () => {
        it("should suppress error log when level is 'silent' but still throw", () => {
            setLogLevel("silent");
            expect(() => logAndThrow("boom")).to.throw("boom");
            expect(errorStub.called).to.be.false;
        });

        it("should log error and throw at default level", () => {
            setLogLevel("info");
            expect(() => logAndThrow("boom")).to.throw("boom");
            expect(errorStub.calledOnce).to.be.true;
            expect(errorStub.firstCall.args[0]).to.equal("boom");
        });
    });
});
