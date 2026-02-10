import type { RecordScannerErrorBody } from "./error.js";
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

/**
 * Failure variant of status() result.
 *
 * @property ok - Whether the request was successful, always false for this interface variant.
 * @property status - HTTP status code returned by the server.
 * @property error - Error payload returned by the server.
 */
export interface StatusFailure {
    ok: false;
    status: number;
    error: RecordScannerErrorBody;
}

export type StatusResult = StatusSuccess | StatusFailure;

