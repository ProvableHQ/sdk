/**
 * Interface for record search parameters. This allows for arbitrary search parameters to be passed to record provider
 * implementations.
 * 
 * @example
 * const recordSearchParams: RecordSearchParams = {
 *     // Declared fields
 *     unspent: true,
 *     nonces: ["..."],
 *     // Arbitrary fields
 *     startHeight: 123456,
 *     programName: "..."
 * }
 */
export interface RecordSearchParams {
    unspent: boolean;
    nonces?: string[];
    [key: string]: any; // This allows for arbitrary keys with any type values
}