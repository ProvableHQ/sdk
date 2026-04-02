import type { OwnedRecord } from "../record-provider/ownedRecord";
import type { RecordScannerFailure } from "./error";

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

export type OwnedRecordsResult = OwnedRecordsSuccess | RecordScannerFailure;
