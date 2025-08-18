export type OwnedRecord = {
    blockHeight?: number;
    commitment?: string;
    functionName?: string;
    outputIndex?: number;
    owner?: string;
    programName?: string;
    recordCiphertext?: string;
    recordPlaintext?: string;
    recordName?: string;
    spent?: boolean;
    tag?: string;
    transactionId?: string;
    transitionId?: string;
    transactionIndex?: number;
    transitionIndex?: number;
}