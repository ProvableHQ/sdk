import { TransactionJSON } from "./transaction/transactionJSON";

export interface ProvingResponse {
    transaction: TransactionJSON,
    broadcast?: boolean,
}