import sinon from "sinon";
import { expect } from "chai";
import {
    setLogLevel,
    getLogLevel,
    logAndThrow,
} from "../src/node.js";
import { sdkLog, sdkWarn, sdkError, sdkDebug } from "../src/logger.js";

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

        it("should pass through sdkLog at default level", () => {
            sdkLog("test message");
            expect(logStub.calledOnce).to.be.true;
            expect(logStub.firstCall.args[0]).to.equal("test message");
        });

        it("should pass through sdkWarn at default level", () => {
            sdkWarn("test warning");
            expect(warnStub.calledOnce).to.be.true;
            expect(warnStub.firstCall.args[0]).to.equal("test warning");
        });

        it("should pass through sdkError at default level", () => {
            sdkError("test error");
            expect(errorStub.calledOnce).to.be.true;
            expect(errorStub.firstCall.args[0]).to.equal("test error");
        });

        it("should suppress sdkDebug at default level", () => {
            sdkDebug("test debug");
            expect(debugStub.called).to.be.false;
        });
    });

    describe("setLogLevel('silent')", () => {
        it("should suppress all logging", () => {
            setLogLevel("silent");
            sdkLog("info");
            sdkWarn("warn");
            sdkError("error");
            sdkDebug("debug");
            expect(logStub.called).to.be.false;
            expect(warnStub.called).to.be.false;
            expect(errorStub.called).to.be.false;
            expect(debugStub.called).to.be.false;
        });
    });

    describe("setLogLevel('error')", () => {
        it("should only allow error messages", () => {
            setLogLevel("error");
            sdkError("error");
            sdkWarn("warn");
            sdkLog("info");
            sdkDebug("debug");
            expect(errorStub.calledOnce).to.be.true;
            expect(warnStub.called).to.be.false;
            expect(logStub.called).to.be.false;
            expect(debugStub.called).to.be.false;
        });
    });

    describe("setLogLevel('warn')", () => {
        it("should allow error and warn messages", () => {
            setLogLevel("warn");
            sdkError("error");
            sdkWarn("warn");
            sdkLog("info");
            sdkDebug("debug");
            expect(errorStub.calledOnce).to.be.true;
            expect(warnStub.calledOnce).to.be.true;
            expect(logStub.called).to.be.false;
            expect(debugStub.called).to.be.false;
        });
    });

    describe("setLogLevel('info')", () => {
        it("should allow error, warn, and info messages", () => {
            setLogLevel("info");
            sdkError("error");
            sdkWarn("warn");
            sdkLog("info");
            sdkDebug("debug");
            expect(errorStub.calledOnce).to.be.true;
            expect(warnStub.calledOnce).to.be.true;
            expect(logStub.calledOnce).to.be.true;
            expect(debugStub.called).to.be.false;
        });
    });

    describe("setLogLevel('debug')", () => {
        it("should allow all messages", () => {
            setLogLevel("debug");
            sdkError("error");
            sdkWarn("warn");
            sdkLog("info");
            sdkDebug("debug");
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
            sdkLog("a", "b", 3);
            expect(logStub.calledOnce).to.be.true;
            expect(logStub.firstCall.args).to.deep.equal(["a", "b", 3]);
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
