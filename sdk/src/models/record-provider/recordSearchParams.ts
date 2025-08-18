/**
 * Interface for record search parameters. This allows for arbitrary search parameters to be passed to record provider
 * implementations.
 */
export interface RecordSearchParams {
    unspent: boolean;
    nonces?: string[];
    [key: string]: any; // This allows for arbitrary keys with any type values
}