import type { RecordScannerFailure } from "./error.js";

/**
 * Success variant of tags() result.
 *
 * @property ok - Whether the request was successful, always true for this interface variant.
 * @property data - A map of tags to whether they are owned by the account.
 */
export interface TagsSuccess {
  ok: true;
  data: Record<string, boolean>;
}

export type TagsResult = TagsSuccess | RecordScannerFailure;
