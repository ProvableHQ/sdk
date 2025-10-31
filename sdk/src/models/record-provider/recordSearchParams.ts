/**
 * Interface for record search parameters. This allows for arbitrary search parameters to be passed to record provider
 * implementations.
 * 
 * @example
 * const recordSearchParams: RecordSearchParams = {
 *     // Declared fields
 *     unspent: true,
 *     nonces: ["3077450429259593211617823051143573281856129402760267155982965992208217472983group"],
 *     // Arbitrary fields
 *     startHeight: 123456,
 *     programName: "credits.aleo"
 * }
 */
export interface RecordSearchParams {
    unspent?: boolean;
    nonces?: string[];
    [key: string]: any; // This allows for arbitrary keys with any type values
}