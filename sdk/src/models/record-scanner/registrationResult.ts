import type { RegistrationResponse } from "./registrationResponse.js";

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

/** Error payload for registration failure result (/register and /register/encrypted). */
export interface RegistrationErrorBody {
    message: string;
}

/** Success variant of registration result. */
export interface RegisterSuccess {
    ok: true;
    data: RegistrationResponse;
}

/** Failure variant of registration result. */
export interface RegisterFailure {
    ok: false;
    status: number;
    error: RegistrationErrorBody;
}

/** Result of register() and registerEncrypted(); never throws on HTTP error. */
export type RegisterResult = RegisterSuccess | RegisterFailure;
