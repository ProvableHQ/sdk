/**
 * Structured error types for the Provable SDK.
 *
 * These replace bare `throw Error("string")` calls with typed errors that agents
 * and programmatic consumers can catch and reason about without string parsing.
 *
 * Pattern follows {@link InvalidLocatorError} from `keys/keystore/error.ts`.
 */

/** Machine-readable error codes for SDK errors. */
export type SDKErrorCode =
    | "INSUFFICIENT_BALANCE"
    | "RECORD_NOT_FOUND"
    | "RECORD_PARSE_ERROR"
    | "PROGRAM_NOT_FOUND"
    | "PROGRAM_ALREADY_EXISTS"
    | "PROGRAM_VALIDATION_ERROR"
    | "FUNCTION_NOT_FOUND"
    | "INVALID_INPUT"
    | "ACCOUNT_NOT_SET"
    | "NETWORK_ERROR"
    | "PROVER_UNAVAILABLE"
    | "RATE_LIMITED"
    | "TX_REJECTED"
    | "TX_TIMEOUT"
    | "VERIFICATION_FAILED"
    | "POLICY_VIOLATION"
    | "KEY_VERIFICATION_FAILED"
    | "UNAUTHORIZED"
    | "UNKNOWN";

/**
 * Base class for all structured SDK errors.
 *
 * @extends Error
 */
export class SDKError extends Error {
    /**
     * @param code - Machine-readable error code for programmatic handling.
     * @param message - Human-readable description of the error.
     * @param retryable - Whether the operation may succeed if retried.
     * @param retryAfterMs - Suggested wait time before retrying (if retryable).
     */
    constructor(
        public readonly code: SDKErrorCode,
        message: string,
        public readonly retryable: boolean = false,
        public readonly retryAfterMs?: number,
    ) {
        super(message);
        this.name = "SDKError";
        Object.setPrototypeOf(this, SDKError.prototype);
    }
}

/**
 * Thrown when an account's balance is insufficient to pay for a transaction fee.
 */
export class InsufficientBalanceError extends SDKError {
    constructor(
        public readonly available: bigint,
        public readonly required: bigint,
    ) {
        super(
            "INSUFFICIENT_BALANCE",
            `The desired execution requires a fee of ${required} microcredits, but the account paying the fee has ${available} microcredits available.`,
            false,
        );
        this.name = "InsufficientBalanceError";
        Object.setPrototypeOf(this, InsufficientBalanceError.prototype);
    }
}

/**
 * Thrown when no unspent fee record with sufficient balance can be found.
 * Named `FeeRecordNotFoundError` to avoid collision with the RecordScanner's `RecordNotFoundError`.
 */
export class FeeRecordNotFoundError extends SDKError {
    constructor(
        public readonly amount: number,
        public readonly detail?: string,
    ) {
        super(
            "RECORD_NOT_FOUND",
            detail ?? `No unspent record with ${amount} microcredits found.`,
            false,
        );
        this.name = "FeeRecordNotFoundError";
        Object.setPrototypeOf(this, FeeRecordNotFoundError.prototype);
    }
}

/**
 * Thrown when a record string cannot be parsed into a RecordPlaintext.
 */
export class RecordParseError extends SDKError {
    constructor(
        public readonly record: string,
    ) {
        super(
            "RECORD_PARSE_ERROR",
            `Record '${record}' could not be parsed, please ensure a valid credits.aleo record is passed prior to trying again.`,
            false,
        );
        this.name = "RecordParseError";
        Object.setPrototypeOf(this, RecordParseError.prototype);
    }
}

/**
 * Thrown when a program cannot be found on the network.
 */
export class ProgramNotFoundError extends SDKError {
    constructor(
        public readonly programId: string,
    ) {
        super(
            "PROGRAM_NOT_FOUND",
            `Program ${programId} not found on the network.`,
            false,
        );
        this.name = "ProgramNotFoundError";
        Object.setPrototypeOf(this, ProgramNotFoundError.prototype);
    }
}

/**
 * Thrown when attempting to deploy a program that already exists on the network.
 */
export class ProgramAlreadyExistsError extends SDKError {
    constructor(
        public readonly programId: string,
    ) {
        super(
            "PROGRAM_ALREADY_EXISTS",
            `Program ${programId} already exists on the network, please rename your program.`,
            false,
        );
        this.name = "ProgramAlreadyExistsError";
        Object.setPrototypeOf(this, ProgramAlreadyExistsError.prototype);
    }
}

/**
 * Thrown when no account or private key is configured on ProgramManager.
 */
export class AccountNotSetError extends SDKError {
    constructor() {
        super(
            "ACCOUNT_NOT_SET",
            "No private key provided and no private key set in the ProgramManager. Please set an account or provide a private key.",
            false,
        );
        this.name = "AccountNotSetError";
        Object.setPrototypeOf(this, AccountNotSetError.prototype);
    }
}

/**
 * Thrown when a network request fails (retryable).
 */
export class NetworkError extends SDKError {
    constructor(
        message: string,
        retryAfterMs?: number,
    ) {
        super("NETWORK_ERROR", message, true, retryAfterMs);
        this.name = "NetworkError";
        Object.setPrototypeOf(this, NetworkError.prototype);
    }
}

/**
 * Thrown when the delegated proving service is unavailable (retryable).
 */
export class ProverUnavailableError extends SDKError {
    constructor(
        message: string,
        retryAfterMs?: number,
    ) {
        super("PROVER_UNAVAILABLE", message, true, retryAfterMs);
        this.name = "ProverUnavailableError";
        Object.setPrototypeOf(this, ProverUnavailableError.prototype);
    }
}

/**
 * Thrown when a rate limit is hit (retryable with backoff).
 */
export class RateLimitedError extends SDKError {
    constructor(
        retryAfterMs: number = 1000,
    ) {
        super("RATE_LIMITED", `Rate limited. Retry after ${retryAfterMs}ms.`, true, retryAfterMs);
        this.name = "RateLimitedError";
        Object.setPrototypeOf(this, RateLimitedError.prototype);
    }
}

/**
 * Thrown when execution verification fails.
 */
export class ExecutionVerificationError extends SDKError {
    constructor(
        public readonly detail: string,
    ) {
        super("VERIFICATION_FAILED", detail, false);
        this.name = "ExecutionVerificationError";
        Object.setPrototypeOf(this, ExecutionVerificationError.prototype);
    }
}

/**
 * Thrown when an agent operation violates a configured policy bound.
 */
export class PolicyViolationError extends SDKError {
    constructor(
        public readonly policy: string,
        public readonly attempted: number,
        public readonly limit: number,
    ) {
        super(
            "POLICY_VIOLATION",
            `${policy}: attempted ${attempted}, limit ${limit}`,
            false,
        );
        this.name = "PolicyViolationError";
        Object.setPrototypeOf(this, PolicyViolationError.prototype);
    }
}

/**
 * Thrown when a proving or verifying key fails integrity verification.
 */
export class KeyVerificationError extends SDKError {
    constructor(
        public readonly keyLocator: string,
        public readonly detail: string,
    ) {
        super(
            "KEY_VERIFICATION_FAILED",
            `Key verification failed for ${keyLocator}: ${detail}`,
            false,
        );
        this.name = "KeyVerificationError";
        Object.setPrototypeOf(this, KeyVerificationError.prototype);
    }
}
