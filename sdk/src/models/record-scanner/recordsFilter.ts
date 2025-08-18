import { RecordSearchParams } from "../record-provider/recordSearchParams";

export interface RecordsFilter extends RecordSearchParams {
    start: number;
    end?: number;
    program?: string;
    record?: string;
    function?: string;
}