import type { RegistrationResponse } from "./registrationResponse.js";
import type { RecordScannerErrorBody } from "./error.js";

/** Success variant of registration result. */
export interface RegisterSuccess {
    ok: true;
    data: RegistrationResponse;
}

/** Failure variant of registration result. */
export interface RegisterFailure {
    ok: false;
    status: number;
    error: RecordScannerErrorBody;
}

/** Result of register() and registerEncrypted(); never throws on HTTP error. */
export type RegisterResult = RegisterSuccess | RegisterFailure;
