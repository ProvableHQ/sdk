import type { RecordScannerFailure } from "./error.js";

/**
 * Response from the record scanning service's revoke endpoint on success.
 *
 * @example
 * const revokeResponse: RevokeResponse = { status: "OK" };
 */
export interface RevokeResponse {
    status: string;
}

/** Success variant of revoke result. */
export interface RevokeSuccess {
    ok: true;
    data: RevokeResponse;
}

/** Result of revoke(); never throws on HTTP error. */
export type RevokeResult = RevokeSuccess | RecordScannerFailure;
