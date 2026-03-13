import type { RecordScannerFailure } from "./error.js";

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
 * Success or failure variant of serialNumbers() result.
 */
export type SerialNumbersResult = SerialNumbersSuccess | RecordScannerFailure;
