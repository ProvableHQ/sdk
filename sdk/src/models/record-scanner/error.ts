import { OwnedFilter } from "./ownedFilter";

/**
 * Error thrown when a record scanner request fails (e.g. /register, /register/encrypted).
 * Includes HTTP status so callers can handle 422 vs 500 etc.
 */
export class RecordScannerRequestError extends Error {
    readonly status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = "RecordScannerRequestError";
        this.status = status;
        Object.setPrototypeOf(this, RecordScannerRequestError.prototype);
    }
}

/** Error thrown when findCreditsRecord or findCreditsRecords is called but decryption is not enabled on the record scanner. */
export class DecryptionNotEnabledError extends Error {
    readonly filter?: OwnedFilter;

    constructor(message: string, filter?: OwnedFilter) {
        super(message);
        this.name = "DecryptionNotEnabledError";
        this.filter = filter;
        Object.setPrototypeOf(this, DecryptionNotEnabledError.prototype);
    }
}

/** Error thrown when findCreditsRecord or findCreditsRecords is called but no view key for the UUID is stored in viewKeys or the account. */
export class ViewKeyNotStoredError extends Error {
    readonly uuid?: string;
    readonly filter?: OwnedFilter;

    constructor(message: string, uuid?: string, filter?: OwnedFilter) {
        super(message);
        this.name = "ViewKeyNotStoredError";
        this.uuid = uuid;
        this.filter = filter;
        Object.setPrototypeOf(this, ViewKeyNotStoredError.prototype);
    }
}

/** Error thrown when no record matches the supplied search filter (e.g. findCreditsRecord / findCreditsRecords). */
export class RecordNotFoundError extends Error {
    readonly filter?: OwnedFilter;

    constructor(message: string, filter?: OwnedFilter) {
        super(message);
        this.name = "RecordNotFoundError";
        this.filter = filter;
        Object.setPrototypeOf(this, RecordNotFoundError.prototype);
    }
}

/** Error thrown when no UUID is configured, the UUID is invalid, or a record scanner request fails due to an invalid UUID/response. */
export class UUIDError extends Error {
    readonly uuid?: string;
    readonly filter?: OwnedFilter;

    constructor(message: string, uuid?: string, filter?: OwnedFilter) {
        super(message);
        this.name = "UUIDError";
        this.uuid = uuid;
        this.filter = filter;
        Object.setPrototypeOf(this, UUIDError.prototype);
    }
}

/** General error payload returned from record-scanner endpoints on failure. */
export interface RecordScannerErrorBody {
    /** Raw error text returned by the service. */
    message: string;
    /** HTTP status code from the response. */
    status: number;
}

/**
 * Failure variant shared by record-scanner result types.
 * Use with a success interface to form a discriminated union (e.g. Success | RecordScannerFailure).
 */
export interface RecordScannerFailure {
    ok: false;
    status: number;
    error: RecordScannerErrorBody;
}
