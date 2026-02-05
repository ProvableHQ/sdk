import { TransactionJSON } from "./transaction/transactionJSON";

export interface BroadcastResponse {
    status_code: bigint,
    status?: string
}

export interface ProvingResponse {
    message?: string, // Potential error message.
    transaction?: TransactionJSON, // Transaction if successful.
    broadcast_result?: BroadcastResponse, // Broadcast result if successful.
}