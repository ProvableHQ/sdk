import type { RecordScannerFailure } from "./error.js";
import type { StatusResponse } from "./statusResponse.js";

/**
 * Success variant of status() result.
 *
 * @property ok - Whether the request was successful, always true for this interface variant.
 * @property data - StatusResponse returned by the server.
 */
export interface StatusSuccess {
    ok: true;
    data: StatusResponse;
}

export type StatusResult = StatusSuccess | RecordScannerFailure;

