import { TransactionModel } from "./transactionModel";

export type ConfirmedTransaction = {
    type: string;
    id: string;
    transaction: TransactionModel;
}
