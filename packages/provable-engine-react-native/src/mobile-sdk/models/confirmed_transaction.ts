import type { FinalizeJSON } from "./finalizeJSON.ts";
import type { TransactionJSON } from "./transaction/transactionJSON.ts";

export interface ConfirmedTransactionJSON {
  status: string;
  type: string;
  index: bigint;
  transaction: TransactionJSON;
  finalize: FinalizeJSON[];
}
