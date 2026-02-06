import { TransactionJSON } from "./transaction/transactionJSON.js";

/** HTTP status and optional message from snarkOS broadcast (Accepted/Rejected variants). */
export interface BroadcastResponse {
    status_code: bigint | number;
    message?: string;
}

/** Result of the optional broadcast step. Discriminated by `status`. */
export type BroadcastResult =
    | { status: "Accepted"; status_code: bigint | number; message?: string }
    | { status: "Rejected"; status_code: bigint | number; message?: string }
    | { status: "Failed"; message: string }
    | { status: "Skipped" };

/** Success response body for POST /prove (HTTP 200). */
export interface ProvingResponse {
    transaction: TransactionJSON;
    broadcast_result: BroadcastResult;
}

/** Error response body for POST /prove (HTTP 400, 500, 503). Same shape for all error cases. */
export interface ProveApiErrorBody {
    message: string;
}

/** Error thrown on prove API failure; `status` is set for retry logic (e.g. retryWithBackoff checks error.status >= 500). */
export interface ProvingRequestError extends Error {
    status?: bigint | number;
}

/** Success variant of a proving request result. */
export interface ProvingSuccess {
    ok: true;
    data: ProvingResponse;
}

/** Failure variant of a proving request result (HTTP 400, 500, 503). */
export interface ProvingFailure {
    ok: false;
    status: bigint | number;
    error: ProveApiErrorBody;
}

/** Result of a proving request. Type used to give callers the ability to self-handle errors. */
export type ProvingResult = ProvingSuccess | ProvingFailure;

/** Type guard: value is a ProvingResponse. */
export function isProvingResponse(value: unknown): value is ProvingResponse {
    return (
        typeof value === "object" &&
        value !== null &&
        "transaction" in value &&
        "broadcast_result" in value &&
        typeof (value as ProvingResponse).broadcast_result === "object"
    );
}

/** Type guard: value is a ProveApiErrorBody. */
export function isProveApiErrorBody(value: unknown): value is ProveApiErrorBody {
    return (
        typeof value === "object" &&
        value !== null &&
        "message" in value
    );
}