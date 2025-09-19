/**
 * RecordsResponseFilter is a type that represents a filter for the response from a record provider.
 * A `true` value for a field in the filter will include that field in the response.
 * 
 * @example
 * const recordsResponseFilter: RecordsResponseFilter = {
 *     block_height: true,
 *     checksum: true,
 *     commitment: true,
 *     record_ciphertext: true,
 *     function_name: true,
 *     nonce: true,
 *     output_index: true,
 *     owner: true,
 *     program_name: true,
 *     record_name: true,
 *     transaction_id: true,
 *     transition_id: true,
 *     transaction_index: true,
 *     transition_index: true,
 * }
 */
export type RecordsResponseFilter = {
    blockHeight?: boolean;
    checksum?: boolean;
    commitment?: boolean;
    record_ciphertext?: boolean;
    function_name?: boolean;
    nonce?: boolean;
    output_index?: boolean;
    owner?: boolean;
    program_name?: boolean;
    record_name?: boolean;
    transaction_id?: boolean;
    transition_id?: boolean;
    transaction_index?: boolean;
    transition_index?: boolean;
}