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

/** Error thrown when a record scanner request fails due to an invalid response. */
export class UUIDError extends Error {
    readonly uuid?: string;
    readonly filter?: OwnedFilter;

    constructor(message: string, uuid?: string, filter?: OwnedFilter) {
        super(message);
        this.name = "InvalidResponseError";
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

