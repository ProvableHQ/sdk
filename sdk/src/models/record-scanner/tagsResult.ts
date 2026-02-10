import type { RecordScannerErrorBody } from "./error.js";

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

/**
 * Failure variant of tags() result.
 *
 * @property ok - Whether the request was successful, always false for this interface variant.
 * @property status - HTTP status code returned by the server.
 * @property error - Error payload returned by the server.
 */
export interface TagsFailure {
    ok: false;
    status: number;
    error: RecordScannerErrorBody;
}

export type TagsResult = TagsSuccess | TagsFailure;

