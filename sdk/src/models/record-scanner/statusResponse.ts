/**
 * StatusResponse is a type that represents a response from a record scanning service's status endpoint.
 *
 * @example
 * const statusResponse: StatusResponse = {
 *     synced: true,
 *     percentage: 100,
 * }
 */
export interface StatusResponse {
    synced: boolean;
    percentage: number;
}
