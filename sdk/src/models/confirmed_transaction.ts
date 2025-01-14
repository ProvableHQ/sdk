import { TransactionJSON } from "./transaction/transactionJSON";

export interface ConfirmedTransaction {
    type: string;
    id: string;
    transaction: TransactionJSON;
}
