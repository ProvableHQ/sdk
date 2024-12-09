import { ExecutionJSON } from "../executionJSON";

export type TransactionJSON = {
    type: string;
    id: string;
    execution: ExecutionJSON;
}
