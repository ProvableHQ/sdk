import type { RecordScannerFailure } from "./error.js";
import type { EncryptedRecord } from "../record-provider/encryptedRecord.js";

export interface EncryptedRecordsSuccess {
    ok: true;
    data: EncryptedRecord[];
}

export type EncryptedRecordsResult = EncryptedRecordsSuccess | RecordScannerFailure;

