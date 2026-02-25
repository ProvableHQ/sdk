/**
 * Fingerprint for a proving and verifying key that includes the checksum of the bytes and size in number of bytes.
 *
 * @property {string} checksum - SHA-256 checksum of the key bytes.
 * @property {number} size - Size of the key in number of bytes.
 */
export interface KeyFingerprint {
    checksum: string;
    size: number;
}


/**
 * Options for verifying the integrity of proving and verifying keys. An identifier to allow the interface to find key metadata and/or the desired metadata to verify must be passed in.
 *
 * @property {Uint8Array} keyBytes - The raw bytes of the cryptographic key.
 * @property {string} [locator] - Optional identifier or path indicating where the key or KeyFingerprint might be stored.
 * @property {KeyFingerprint} [fingerprint] - Optional metadata containing the key's expected checksum and size for verification purposes.
 */
export interface KeyMetadata {
    keyBytes: Uint8Array;
    locator?: string;
    fingerprint?: KeyFingerprint;
}

/**
 * Error thrown when there is a mismatch between expected and actual key metadata.
 * This can occur during verification of either the checksum or size of a key.
 *
 * @extends Error
 */
export class KeyVerificationError extends Error {
    /**
     * Creates a new ChecksumMismatchError instance.
     *
     * @param {string} locator - The key locator where the mismatch occurred.
     * @param {"checksum" | "size"} field - The field that failed verification (either "checksum" or "size").
     * @param {string} expected - The expected value of the field.
     * @param {string} actual - The actual value encountered.
     */
    constructor(
        public readonly locator: string,
        public readonly field: "checksum" | "size",
        public readonly expected: string,
        public readonly actual: string
    ) {
        super(
            `KeyStore ${locator} ${field} mismatch: expected ${expected}, got ${actual}`
        );
        this.name = "ChecksumMismatchError";
    }
}

/**
 * Computes the SHA-256 checksum of a given set of bytes.
 *
 * @param {Uint8Array} bytes - The bytes to compute the checksum of.
 */
export async function sha256Hex(bytes: Uint8Array): Promise<string> {
    const hash = await crypto.subtle.digest("SHA-256", bytes as BufferSource);
    return Array.from(new Uint8Array(hash))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

/**
 * Verifies key-pair metadata (checksums and sizes) against raw bytes in order to ensure the correct keypair is used.
 * Implementations throw {@link KeyVerificationError} when verification fails.
 */
export interface KeyVerifier {
    /**
     * Computes and optionally stores key metadata. If keyFingerprint is provided, verifies against it.
     * @param {KeyMetadata} keyMetadata - Object containing key bytes and optional verification data.
     * @throws {KeyVerificationError} When provided keyFingerprint doesn't match computed values.
     * @returns {Promise<KeyFingerprint>} Computed key metadata.
     */
    computeKeyMetadata(keyMetadata: KeyMetadata): Promise<KeyFingerprint>;

    /**
     * Verifies prover bytes against key metadata (size + checksum).
     *
     * @param {KeyMetadata} keyMetadata - Object containing the key bytes, an optional locator and optional metadata for verification.
     * @throws {KeyVerificationError} when size or checksum does not match.
     * @returns {Promise<void>} Promise that resolves when verification succeeds.
     */
    verifyKeyBytes(keyMetadata: KeyMetadata): Promise<void>;
}