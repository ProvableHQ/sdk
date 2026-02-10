import type { RecordScannerErrorBody } from "./error.js";

/**
 * Success variant of serialNumbers() result.
 *
 * @property ok - Whether the request was successful, always true for this interface.
 * @property data - A map of serial numbers to whether they are owned by the account.
 */
export interface SerialNumbersSuccess {
    ok: true;
    data: Record<string, boolean>;
}

/**
 * Failure variant of serialNumbers() result.
 *
 * @property ok - Whether the request was successful, always false for this interface.
 * @property status - HTTP status code returned by the server.
 * @property error - Error payload returned by the server.
 */
export interface SerialNumbersFailure {
    ok: false;
    status: number;
    error: RecordScannerErrorBody;
}

/**
 * Success or failure variant of serialNumbers() result.
 */
export type SerialNumbersResult = SerialNumbersSuccess | SerialNumbersFailure;

