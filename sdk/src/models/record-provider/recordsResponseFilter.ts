/**
 * RecordsResponseFilter is a type that represents a filter for the response from a record provider.
 * A `true` value for a field in the filter will include that field in the response.
 * 
 * @example
 * const recordsResponseFilter: RecordsResponseFilter = {
 *     program: true,
 *     record: true,
 *     function: true,
 *     transition: true,
 *     blockHeight: true,
 *     transaction_id: true,
 *     transition_id: true,
 *     ioIndex: true,
 * }
 */
export type RecordsResponseFilter = {
    program: boolean;
    record: boolean;
    function: boolean;
    transition: boolean;
    blockHeight: boolean;
    transaction_id: boolean;
    transition_id: boolean;
    ioIndex: boolean;
}