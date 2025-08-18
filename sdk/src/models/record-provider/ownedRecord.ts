/**
 * OwnedRecord is a type that represents information about an owned record that is found on chain.
 * 
 * @example
 * const ownedRecord: OwnedRecord = {
 *     blockHeight: 123456,
 *     commitment: "...",
 *     functionName: "...",
 *     outputIndex: 0,
 *     owner: "...",
 *     programName: "...",
 *     recordCiphertext: "...",
 *     recordPlaintext: "...",
 *     recordName: "...",
 *     spent: true,
 *     tag: "...",
 *     transactionId: "...",
 *     transitionId: "...",
 *     transactionIndex: 0,
 *     transitionIndex: 0,
 * }
 */
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