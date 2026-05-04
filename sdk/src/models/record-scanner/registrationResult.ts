import type { RecordScannerFailure } from "./error.js";
import type { RegistrationResponse } from "./registrationResponse.js";

/** Success variant of registration result. */
export interface RegisterSuccess {
    ok: true;
    data: RegistrationResponse;
}

/** Result of registerEncrypted(); never throws on HTTP error. */
export type RegisterResult = RegisterSuccess | RecordScannerFailure;
