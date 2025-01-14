import { ExecutionJSON } from "../executionJSON";

export interface TransactionJSON {
    type: string;
    id: string;
    execution: ExecutionJSON;
}
