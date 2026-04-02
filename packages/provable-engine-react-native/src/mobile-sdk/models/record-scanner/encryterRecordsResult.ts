import type { EncryptedRecord } from "../record-provider/encryptedRecord";
import type { RecordScannerFailure } from "./error";

export interface EncryptedRecordsSuccess {
  ok: true;
  data: EncryptedRecord[];
}

export type EncryptedRecordsResult = EncryptedRecordsSuccess | RecordScannerFailure;
