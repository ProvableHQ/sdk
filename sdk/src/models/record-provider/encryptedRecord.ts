export type EncryptedRecord = {
    commitment: string;
    checksum?: string;
    blockHeight?: number;
    programName?: string;
    functionName?: string;
    outputIndex?: number;
    owner?: string;
    recordCiphertext?: string;
    recordName?: string;
    recordNonce?: string;
    transactionId?: string;
    transitionId?: string;
    transactionIndex?: number;
    transitionIndex?: number;
}