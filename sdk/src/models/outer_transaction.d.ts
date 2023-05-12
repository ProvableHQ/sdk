import { Transaction } from "./transaction";
export type OuterTransaction = {
    type: string;
    id: string;
    transaction: Transaction;
};
