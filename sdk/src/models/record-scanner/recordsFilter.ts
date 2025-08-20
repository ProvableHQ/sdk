import { RecordSearchParams } from "../record-provider/recordSearchParams";

/**
 * RecordsFilter is an extension of RecordSearchParams that represents a filter for scanning encrypted or owned records.
 * 
 * @example
 * const recordsFilter: RecordsFilter = {
 *     start: 0,
 *     end: 100,
 *     program: "credits.aleo",
 *     record: "credits",
 * }
 */
export interface RecordsFilter extends RecordSearchParams {
    start: number;
    end?: number;
    program?: string;
    record?: string;
    function?: string;
}