import { TransactionJSON } from "./transaction/transactionJSON";

export type ConfirmedTransaction = {
    type: string;
    id: string;
    transaction: TransactionJSON;
}
