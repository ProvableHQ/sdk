import { RecordSearchParams } from "../record-provider/recordSearchParams";
import { RecordsFilter } from "./recordsFilter";
import { RecordsResponseFilter } from "../record-provider/recordsResponseFilter";

/**
 * OwnedFilter is an extension of RecordSearchParams that represents a filter for scanning owned records.
 * 
 * @example
 * const ownedFilter: OwnedFilter = {
 *     unspent: true,
 *     nonces: ["..."],
 *     decrypt: true,
 *     filter: {
 *         program: "...",
 *         record: "...",
 *     },
 * }
 */ 
export interface OwnedFilter extends RecordSearchParams {
    decrypt?: boolean;
    filter?: RecordsFilter;
    responseFilter?: RecordsResponseFilter;
    uuid?: string;
}