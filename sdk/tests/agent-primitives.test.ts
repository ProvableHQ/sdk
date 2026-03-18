import { expect } from "chai";
import {
    checkExecutionOutputs,
    PolicyGuard,
    NonceTracker,
    PolicyViolationError,
} from "../src/node.js";

describe("checkExecutionOutputs", () => {
    it("passes when all checks match", () => {
        const outputs = ["record1qygsqt...", "42u64", "future_hash"];
        const result = checkExecutionOutputs(outputs, [
            { transitionIndex: 0, outputIndex: 0, expectedType: "record" },
            { transitionIndex: 0, outputIndex: 1, expectedType: "public", expectedValue: "42u64" },
            { transitionIndex: 0, outputIndex: 2, expectedType: "future" },
        ]);
        expect(result.passed).to.be.true;
        expect(result.failures).to.have.lengthOf(0);
    });

    it("returns empty failures for empty checks array", () => {
        const result = checkExecutionOutputs(["something"], []);
        expect(result.passed).to.be.true;
        expect(result.failures).to.deep.equal([]);
    });

    it("fails on value mismatch", () => {
        const outputs = ["100u64"];
        const result = checkExecutionOutputs(outputs, [
            { transitionIndex: 0, outputIndex: 0, expectedType: "public", expectedValue: "200u64" },
        ]);
        expect(result.passed).to.be.false;
        expect(result.failures).to.have.lengthOf(1);
        expect(result.failures[0]).to.include("expected value");
        expect(result.failures[0]).to.include("200u64");
        expect(result.failures[0]).to.include("100u64");
    });

    it("fails on out-of-bounds outputIndex", () => {
        const outputs = ["only_one"];
        const result = checkExecutionOutputs(outputs, [
            { transitionIndex: 0, outputIndex: 5, expectedType: "public" },
        ]);
        expect(result.passed).to.be.false;
        expect(result.failures).to.have.lengthOf(1);
        expect(result.failures[0]).to.include("does not exist");
        expect(result.failures[0]).to.include("only 1 outputs");
    });

    it("rejects transitionIndex > 0 for flat output arrays", () => {
        const outputs = ["a", "b", "c"];
        const result = checkExecutionOutputs(outputs, [
            { transitionIndex: 1, outputIndex: 0, expectedType: "public" },
        ]);
        expect(result.passed).to.be.false;
        expect(result.failures).to.have.lengthOf(1);
        expect(result.failures[0]).to.include("transitionIndex > 0 is not supported");
    });

    it("reports multiple failures", () => {
        const outputs = ["val"];
        const result = checkExecutionOutputs(outputs, [
            { transitionIndex: 0, outputIndex: 0, expectedType: "public", expectedValue: "wrong" },
            { transitionIndex: 0, outputIndex: 99, expectedType: "record" },
            { transitionIndex: 2, outputIndex: 0, expectedType: "future" },
        ]);
        expect(result.passed).to.be.false;
        expect(result.failures).to.have.lengthOf(3);
    });

    it("passes when expectedValue matches exactly", () => {
        const outputs = ["aleo1abc..."];
        const result = checkExecutionOutputs(outputs, [
            { transitionIndex: 0, outputIndex: 0, expectedType: "public", expectedValue: "aleo1abc..." },
        ]);
        expect(result.passed).to.be.true;
    });

    it("passes type-only check for record when output starts with record1", () => {
        const outputs = ["record1qygsqt..."];
        const result = checkExecutionOutputs(outputs, [
            { transitionIndex: 0, outputIndex: 0, expectedType: "record" },
        ]);
        expect(result.passed).to.be.true;
    });

    it("fails type check when expecting record but got public output", () => {
        const outputs = ["42u64"];
        const result = checkExecutionOutputs(outputs, [
            { transitionIndex: 0, outputIndex: 0, expectedType: "record" },
        ]);
        expect(result.passed).to.be.false;
        expect(result.failures[0]).to.include("expected record output");
    });

    it("fails type check when expecting public but got record ciphertext", () => {
        const outputs = ["record1qygsqt..."];
        const result = checkExecutionOutputs(outputs, [
            { transitionIndex: 0, outputIndex: 0, expectedType: "public" },
        ]);
        expect(result.passed).to.be.false;
        expect(result.failures[0]).to.include("expected public output");
        expect(result.failures[0]).to.include("record ciphertext");
    });

    it("fails type check when expecting future but got record ciphertext", () => {
        const outputs = ["record1qygsqt..."];
        const result = checkExecutionOutputs(outputs, [
            { transitionIndex: 0, outputIndex: 0, expectedType: "future" },
        ]);
        expect(result.passed).to.be.false;
        expect(result.failures[0]).to.include("expected future output");
    });
});

describe("PolicyGuard", () => {
    describe("checkTransfer", () => {
        it("passes when within all limits", () => {
            const guard = new PolicyGuard({
                maxTransferPerTx: 10_000_000,
                maxCumulativeSpend: 100_000_000,
                maxPriorityFee: 1_000_000,
            });
            expect(() => guard.checkTransfer(5_000_000, 500_000)).to.not.throw();
        });

        it("throws on maxTransferPerTx violation", () => {
            const guard = new PolicyGuard({ maxTransferPerTx: 1_000_000 });
            expect(() => guard.checkTransfer(2_000_000)).to.throw(PolicyViolationError);
        });

        it("throws on maxPriorityFee violation", () => {
            const guard = new PolicyGuard({ maxPriorityFee: 100_000 });
            expect(() => guard.checkTransfer(1_000, 200_000)).to.throw(PolicyViolationError);
        });

        it("throws on maxCumulativeSpend violation", () => {
            const guard = new PolicyGuard({ maxCumulativeSpend: 10_000_000 });
            guard.recordSpend(9_000_000);
            expect(() => guard.checkTransfer(2_000_000)).to.throw(PolicyViolationError);
        });

        it("includes amount + fee in cumulative check", () => {
            const guard = new PolicyGuard({ maxCumulativeSpend: 10_000_000 });
            guard.recordSpend(9_000_000);
            // amount=500_000 + fee=600_000 = 1_100_000 → total 10_100_000 > 10_000_000
            expect(() => guard.checkTransfer(500_000, 600_000)).to.throw(PolicyViolationError);
        });

        it("passes with no limits configured", () => {
            const guard = new PolicyGuard({});
            expect(() => guard.checkTransfer(999_999_999, 999_999)).to.not.throw();
        });
    });

    describe("checkExecution", () => {
        it("passes for allowed program", () => {
            const guard = new PolicyGuard({ allowedPrograms: ["credits.aleo", "swap.aleo"] });
            expect(() => guard.checkExecution("credits.aleo", "transfer_public")).to.not.throw();
        });

        it("throws for disallowed program", () => {
            const guard = new PolicyGuard({ allowedPrograms: ["credits.aleo"] });
            expect(() => guard.checkExecution("malicious.aleo", "steal")).to.throw(PolicyViolationError);
        });

        it("passes when allowedPrograms is empty", () => {
            const guard = new PolicyGuard({ allowedPrograms: [] });
            expect(() => guard.checkExecution("anything.aleo", "call")).to.not.throw();
        });

        it("passes when allowedPrograms is undefined", () => {
            const guard = new PolicyGuard({});
            expect(() => guard.checkExecution("anything.aleo", "call")).to.not.throw();
        });

        it("throws on maxPriorityFee violation", () => {
            const guard = new PolicyGuard({ maxPriorityFee: 100 });
            expect(() => guard.checkExecution("credits.aleo", "transfer", 500)).to.throw(PolicyViolationError);
        });

        it("throws on cumulative spend violation from priority fee", () => {
            const guard = new PolicyGuard({ maxCumulativeSpend: 1_000 });
            guard.recordSpend(900);
            expect(() => guard.checkExecution("credits.aleo", "transfer", 200)).to.throw(PolicyViolationError);
        });
    });

    describe("recordSpend / remainingBudget", () => {
        it("tracks cumulative spend", () => {
            const guard = new PolicyGuard({ maxCumulativeSpend: 100 });
            expect(guard.remainingBudget()).to.equal(100);
            guard.recordSpend(30);
            expect(guard.remainingBudget()).to.equal(70);
            guard.recordSpend(70);
            expect(guard.remainingBudget()).to.equal(0);
        });

        it("returns Infinity when no limit is set", () => {
            const guard = new PolicyGuard({});
            expect(guard.remainingBudget()).to.equal(Infinity);
        });

        it("clamps remaining to zero (never negative)", () => {
            const guard = new PolicyGuard({ maxCumulativeSpend: 50 });
            guard.recordSpend(100);
            expect(guard.remainingBudget()).to.equal(0);
        });
    });

    describe("toJSON", () => {
        it("returns audit snapshot with limit", () => {
            const guard = new PolicyGuard({ maxCumulativeSpend: 1000 });
            guard.recordSpend(250);
            const json = guard.toJSON();
            expect(json).to.deep.equal({ spent: 250, limit: 1000, remaining: 750 });
        });

        it("returns null limit/remaining when uncapped", () => {
            const guard = new PolicyGuard({});
            const json = guard.toJSON();
            expect(json).to.deep.equal({ spent: 0, limit: null, remaining: null });
        });
    });

    describe("reset", () => {
        it("clears cumulative spend", () => {
            const guard = new PolicyGuard({ maxCumulativeSpend: 100 });
            guard.recordSpend(80);
            expect(guard.remainingBudget()).to.equal(20);
            guard.reset();
            expect(guard.remainingBudget()).to.equal(100);
        });
    });
});

describe("NonceTracker", () => {
    it("tracks used nonces", () => {
        const tracker = new NonceTracker();
        expect(tracker.isUsed("nonce1")).to.be.false;
        tracker.use("nonce1");
        expect(tracker.isUsed("nonce1")).to.be.true;
        expect(tracker.size).to.equal(1);
    });

    it("returns nonces in exclude list", () => {
        const tracker = new NonceTracker();
        tracker.use("a");
        tracker.use("b");
        const list = tracker.toExcludeList();
        expect(list).to.have.lengthOf(2);
        expect(list).to.include("a");
        expect(list).to.include("b");
    });

    it("releases nonces", () => {
        const tracker = new NonceTracker();
        tracker.use("n1");
        tracker.use("n2");
        expect(tracker.size).to.equal(2);
        tracker.release("n1");
        expect(tracker.isUsed("n1")).to.be.false;
        expect(tracker.isUsed("n2")).to.be.true;
        expect(tracker.size).to.equal(1);
    });

    it("release is no-op for unknown nonce", () => {
        const tracker = new NonceTracker();
        expect(() => tracker.release("unknown")).to.not.throw();
        expect(tracker.size).to.equal(0);
    });

    it("clears all nonces", () => {
        const tracker = new NonceTracker();
        tracker.use("a");
        tracker.use("b");
        tracker.use("c");
        tracker.clear();
        expect(tracker.size).to.equal(0);
        expect(tracker.toExcludeList()).to.deep.equal([]);
    });

    it("deduplicates repeated use calls", () => {
        const tracker = new NonceTracker();
        tracker.use("same");
        tracker.use("same");
        tracker.use("same");
        expect(tracker.size).to.equal(1);
    });
});
