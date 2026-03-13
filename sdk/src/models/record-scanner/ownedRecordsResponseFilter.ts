/**
 * OwnedRecordsResponseFilter is a type that represents a filter for the response from a record provider.
 * A `true` value for a field in the filter will include that field in the response.
 *
 * @example
 * const ownedRecordsResponseFilter: OwnedRecordsResponseFilter = {
 *     commitment: true,
 *     owner: true,
 *     tag: true,
 *     sender: true,
 *     spent: true,
 *     record_ciphertext: true,
 *     block_height: true,
 *     block_timestamp: true,
 *     output_index: true,
 *     record_name: true,
 *     function_name: true,
 *     program_name: true,
 *     transition_id: true,
 *     transaction_id: true,
 *     transaction_index: true,
 *     transition_index: true,
 * }
 */
export interface OwnedRecordsResponseFilter {
    commitment?: boolean;
    owner?: boolean;
    tag?: boolean;
    sender?: boolean;
    spent?: boolean;
    record_ciphertext?: boolean;
    block_height?: boolean;
    block_timestamp?: boolean;
    output_index?: boolean;
    record_name?: boolean;
    function_name?: boolean;
    program_name?: boolean;
    transition_id?: boolean;
    transaction_id?: boolean;
    transaction_index?: boolean;
    transition_index?: boolean;
}
