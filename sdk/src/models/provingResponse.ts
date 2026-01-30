import { TransactionJSON } from "./transaction/transactionJSON";

export interface BroadcastResult {
    status_code: bigint,
    status?: string
}

export interface ProvingResponse {
    transaction: TransactionJSON,
    broadcast_result: BroadcastResult,
}