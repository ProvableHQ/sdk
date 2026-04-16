import { RecordSearchParams } from "../record-provider/recordSearchParams.js";
import { RecordsResponseFilter } from "./recordsResponseFilter.js";

/**
 * RecordsFilter is an extension of RecordSearchParams that represents a filter for scanning encrypted or owned records.
 * 
 * @example
 * const recordsFilter: RecordsFilter = {
 *     start: 0,
 *     end: 100,
 *     programs: ["credits.aleo"],
 *     records: ["credits"],
 *     functions: ["transfer_public_to_private"],
 *     response: {
 *         program: true,
 *         record: true,
 *         function: true,
 *         transition: true,
 *         block_height: true,
 *         transaction_id: true,
 *     }
 *     results_per_page: 100,
 *     page: 0,
 * }
 */
export interface RecordsFilter extends RecordSearchParams {
    commitments?: string[];
    response?: RecordsResponseFilter;
    start?: number;
    end?: number;
    programs?: string[];
    records?: string[];
    functions?: string[];
    results_per_page?: number;
    page?: number;
}