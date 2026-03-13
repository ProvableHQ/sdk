import { TransactionJSON } from "./transaction/transactionJSON.js";
import { FinalizeJSON } from "./finalizeJSON.js";

export interface ConfirmedTransactionJSON {
    status: string;
    type: string;
    index: bigint;
    transaction: TransactionJSON;
    finalize: FinalizeJSON[];
}
