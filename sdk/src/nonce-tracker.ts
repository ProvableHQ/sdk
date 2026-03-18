/**
 * Tracks used record nonces to prevent double-spending across multi-step operations.
 *
 * Agents create one NonceTracker per session and pass `toExcludeList()` into every
 * `findCreditsRecord()` call to ensure the same record is never used for two pending transactions.
 *
 * @example
 * ```typescript
 * const tracker = new NonceTracker();
 *
 * // Find an input record, mark its nonce as used
 * const inputRecord = await recordProvider.findCreditsRecord(amount, { nonces: tracker.toExcludeList() });
 * tracker.use(inputRecord.nonce);
 *
 * // Find a fee record — the input record's nonce is excluded
 * const feeRecord = await recordProvider.findCreditsRecord(feeAmount, { nonces: tracker.toExcludeList() });
 * tracker.use(feeRecord.nonce);
 *
 * // If a transaction fails, release the nonce so the record can be reused
 * tracker.release(inputRecord.nonce);
 * ```
 */
export class NonceTracker {
    private used = new Set<string>();

    /** Mark a nonce as used (after finding a record for a pending transaction). */
    use(nonce: string): void {
        this.used.add(nonce);
    }

    /** Release a nonce (if the transaction failed and the record wasn't consumed). */
    release(nonce: string): void {
        this.used.delete(nonce);
    }

    /** Get the list of nonces to exclude from record searches. */
    toExcludeList(): string[] {
        return Array.from(this.used);
    }

    /** Check if a nonce is already marked as used. */
    isUsed(nonce: string): boolean {
        return this.used.has(nonce);
    }

    /** Clear all tracked nonces. */
    clear(): void {
        this.used.clear();
    }

    /** Number of nonces currently tracked. */
    get size(): number {
        return this.used.size;
    }
}
