/**
 * PolicyGuard enforces spending limits and program whitelists for agent sessions.
 *
 * Agents initialize a PolicyGuard at session start with configured bounds. Before each
 * transaction, pre-flight checks (`checkTransfer`, `checkExecution`) verify the operation
 * is within policy. After successful submission, `recordSpend` updates cumulative tracking.
 *
 * @example
 * ```typescript
 * const guard = new PolicyGuard({
 *     maxTransferPerTx: 10_000_000,      // 10 credits per transfer
 *     maxCumulativeSpend: 100_000_000,    // 100 credits total per session
 *     allowedPrograms: ["credits.aleo"],  // only credits program allowed
 *     maxPriorityFee: 1_000_000,         // 1 credit max priority fee
 * });
 *
 * // Pre-flight check before transfer
 * guard.checkTransfer(5_000_000, 100_000); // passes
 * guard.recordSpend(5_100_000);            // record total spend
 *
 * // Check remaining budget
 * console.log(guard.remainingBudget());    // 94_900_000
 * ```
 */

import { PolicyViolationError } from "./errors.js";

/** Configuration for PolicyGuard spending limits and restrictions. */
export interface PolicyConfig {
    /** Maximum microcredits allowed per single transfer. */
    maxTransferPerTx?: number;
    /** Maximum cumulative microcredits across the entire session. */
    maxCumulativeSpend?: number;
    /** Whitelist of allowed program IDs. Empty array or undefined = allow all. */
    allowedPrograms?: string[];
    /** Maximum priority fee in microcredits. */
    maxPriorityFee?: number;
}

export class PolicyGuard {
    private spent = 0;

    constructor(private config: PolicyConfig) {}

    /**
     * Pre-flight check for a transfer operation.
     * @throws {PolicyViolationError} if the transfer violates any configured policy.
     */
    checkTransfer(amount: number, priorityFee: number = 0): void {
        const total = amount + priorityFee;

        if (this.config.maxTransferPerTx !== undefined && amount > this.config.maxTransferPerTx) {
            throw new PolicyViolationError(
                "maxTransferPerTx",
                amount,
                this.config.maxTransferPerTx,
            );
        }

        if (this.config.maxPriorityFee !== undefined && priorityFee > this.config.maxPriorityFee) {
            throw new PolicyViolationError(
                "maxPriorityFee",
                priorityFee,
                this.config.maxPriorityFee,
            );
        }

        if (this.config.maxCumulativeSpend !== undefined && this.spent + total > this.config.maxCumulativeSpend) {
            throw new PolicyViolationError(
                "maxCumulativeSpend",
                this.spent + total,
                this.config.maxCumulativeSpend,
            );
        }
    }

    /**
     * Pre-flight check for a program execution.
     * @throws {PolicyViolationError} if the program is not in the allowlist or priority fee exceeds limit.
     */
    checkExecution(programName: string, _functionName: string, priorityFee: number = 0): void {
        if (
            this.config.allowedPrograms &&
            this.config.allowedPrograms.length > 0 &&
            !this.config.allowedPrograms.includes(programName)
        ) {
            throw new PolicyViolationError(
                "allowedPrograms",
                0,
                0,
            );
        }

        if (this.config.maxPriorityFee !== undefined && priorityFee > this.config.maxPriorityFee) {
            throw new PolicyViolationError(
                "maxPriorityFee",
                priorityFee,
                this.config.maxPriorityFee,
            );
        }

        if (this.config.maxCumulativeSpend !== undefined && this.spent + priorityFee > this.config.maxCumulativeSpend) {
            throw new PolicyViolationError(
                "maxCumulativeSpend",
                this.spent + priorityFee,
                this.config.maxCumulativeSpend,
            );
        }
    }

    /** Record spend after a successful transaction submission. */
    recordSpend(amount: number): void {
        this.spent += amount;
    }

    /** Get the remaining budget before hitting maxCumulativeSpend. Returns Infinity if no limit set. */
    remainingBudget(): number {
        if (this.config.maxCumulativeSpend === undefined) return Infinity;
        return Math.max(0, this.config.maxCumulativeSpend - this.spent);
    }

    /** Return an audit-friendly snapshot of spending state. */
    toJSON(): { spent: number; limit: number | null; remaining: number | null } {
        const limit = this.config.maxCumulativeSpend ?? null;
        const remaining = limit !== null ? Math.max(0, limit - this.spent) : null;
        return { spent: this.spent, limit, remaining };
    }

    /** Reset cumulative spend tracking. */
    reset(): void {
        this.spent = 0;
    }
}
