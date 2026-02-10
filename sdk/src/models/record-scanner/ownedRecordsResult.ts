import type { RecordScannerErrorBody } from "./error.js";
import type { OwnedRecord } from "../record-provider/ownedRecord.js";

/**
 * Success variant of ownedRecords() result.
 *
 * @property ok - Whether the request was successful, always true for this interface variant.
 * @property data - List of owned records corresponding to the filter used.
 */
export interface OwnedRecordsSuccess {
    ok: true;
    data: OwnedRecord[];
}

/**
 * Failure variant of ownedRecords() result.
 *
 * @property ok - Whether the request was successful, always false for this interface variant.
 * @property status - HTTP status code returned by the server.
 * @property error - Error payload returned by the server.
 */
export interface OwnedRecordsFailure {
    ok: false;
    status: number;
    error: RecordScannerErrorBody;
}

export type OwnedRecordsResult = OwnedRecordsSuccess | OwnedRecordsFailure;

