import { TransactionJSON } from "./transaction/transactionJSON";
import { FinalizeJSON } from "./finalizeJSON";

export interface ConfirmedTransactionJSON {
    status: string
    type: string;
    index: bigint;
    transaction: TransactionJSON;
    finalize: FinalizeJSON[];
}
