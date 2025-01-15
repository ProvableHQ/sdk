import { TransactionJSON } from "./transaction/transactionJSON";
import { FinalizeJSON } from "./finalizeJSON";

export interface ConfirmedTransactionJSON {
    status: string
    type: string;
    index: number;
    transaction: TransactionJSON;
    finalize: FinalizeJSON[];
}
