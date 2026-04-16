import { RecordSearchParams } from "../record-provider/recordSearchParams.js";
import { RecordsFilter } from "./recordsFilter.js";
import { OwnedRecordsResponseFilter } from "./ownedRecordsResponseFilter.js";

/**
 * OwnedFilter is an extension of RecordSearchParams that represents a filter for scanning owned records.
 * 
 * @example
 * const ownedFilter: OwnedFilter = {
 *     unspent: true,
 *     nonces: ["3077450429259593211617823051143573281856129402760267155982965992208217472983group"],
 *     filter: {
 *         program: "credits.aleo",
 *         record: "credits",
 *     },
 * }
 */ 
export interface OwnedFilter extends RecordSearchParams {
    filter?: RecordsFilter;
    responseFilter?: OwnedRecordsResponseFilter;
    unspent?: boolean;
    uuid?: string;
}