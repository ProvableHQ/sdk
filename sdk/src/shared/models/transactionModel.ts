import { Execution } from "./execution";

export type TransactionModel = {
    type: string;
    id: string;
    execution: Execution;
}
