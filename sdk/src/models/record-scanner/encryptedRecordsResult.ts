import type { RecordScannerErrorBody } from "./error.js";
import type { EncryptedRecord } from "../record-provider/encryptedRecord.js";

export interface EncryptedRecordsSuccess {
    ok: true;
    data: EncryptedRecord[];
}

export interface EncryptedRecordsFailure {
    ok: false;
    status: number;
    error: RecordScannerErrorBody;
}

export type EncryptedRecordsResult = EncryptedRecordsSuccess | EncryptedRecordsFailure;

