import { RecordSearchParams } from "../record-provider/recordSearchParams";
import { RecordsFilter } from "./recordsFilter";
import { RecordsResponseFilter } from "../record-provider/recordsResponseFilter";

export interface OwnedFilter extends RecordSearchParams {
    decrypt?: boolean;
    filter?: RecordsFilter;
    responseFilter?: RecordsResponseFilter;
    uuid?: string;
}