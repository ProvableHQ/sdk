/**
 * EncryptedRecord is a type that represents information about an encrypted record.
 * 
 * @example
 * const encryptedRecord: EncryptedRecord = {
 *     commitment: "...",
 *     checksum: "...",
 *     blockHeight: 123456,
 *     programName: "...",
 *     functionName: "...",
 *     outputIndex: 0,
 *     owner: "...",
 *     recordCiphertext: "...",
 *     recordName: "...",
 *     recordNonce: "...",
 *     transactionId: "...",
 *     transitionId: "...",
 *     transactionIndex: 0,
 *     transitionIndex: 0,
 * }
 */
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