import { Transaction } from "./transaction";
export type ConfirmedTransaction = {
    type: string;
    id: string;
    transaction: Transaction;
};
