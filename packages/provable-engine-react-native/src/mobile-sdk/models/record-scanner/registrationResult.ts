import type { RecordScannerFailure } from "./error";
import type { RegistrationResponse } from "./registrationResponse";

/** Success variant of registration result. */
export interface RegisterSuccess {
  ok: true;
  data: RegistrationResponse;
}

/** Result of register() and registerEncrypted(); never throws on HTTP error. */
export type RegisterResult = RegisterSuccess | RecordScannerFailure;
