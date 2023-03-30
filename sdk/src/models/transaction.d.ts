import { Execution } from "./execution";
export type Transaction = {
    type: string;
    id: string;
    execution: Execution;
};
