/** Metadata for a key: checksum and size. */
export interface KeyMetadata {
    checksum: string;
    size: number;
}

export class ChecksumMismatchError extends Error {
    constructor(
        public readonly keyKind: "prover" | "verifier",
        public readonly field: "checksum" | "size",
        public readonly expected: string,
        public readonly actual: string
    ) {
        super(
            `KeyStore ${keyKind} ${field} mismatch: expected ${expected}, got ${actual}`
        );
        this.name = "ChecksumMismatchError";
    }
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
    const hash = await crypto.subtle.digest("SHA-256", bytes as BufferSource);
    return Array.from(new Uint8Array(hash))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

/**
 * Verifies key-pair metadata (checksums and sizes) against raw bytes.
 * Implementations throw {@link ChecksumMismatchError} when verification fails.
 */
export interface KeyPairMetadataVerifier {
    /**
     * Computes prover metadata (SHA-256 checksum and size) from raw bytes.
     */
    computeProverMetadata(proverBytes: Uint8Array): Promise<KeyMetadata>;

    /**
     * Computes verifier metadata (SHA-256 checksum and size) from raw bytes.
     */
    computeVerifierMetadata(verifierBytes: Uint8Array): Promise<KeyMetadata>;

    /**
     * Verifies prover bytes against metadata (size + checksum).
     * @throws {ChecksumMismatchError} when size or checksum does not match
     */
    verifyProverBytes(proverBytes: Uint8Array, metadata: KeyMetadata): Promise<void>;

    /**
     * Verifies verifier bytes against metadata (size + checksum).
     * @throws {ChecksumMismatchError} when size or checksum does not match
     */
    verifyVerifierBytes(
        verifierBytes: Uint8Array,
        metadata: KeyMetadata
    ): Promise<void>;

    /**
     * Verifies that prover and verifier bytes match the stored metadata.
     * @throws {ChecksumMismatchError} when size or checksum does not match
     */
    verifyKeyPairBytes(
        keys: [Uint8Array, Uint8Array],
        metadata: { prover: KeyMetadata; verifier: KeyMetadata }
    ): Promise<void>;
}

/**
 * Default key-pair metadata verifier. Uses SHA-256 checksums aligned with snarkVM.
 */
export const KeyVerifier: KeyPairMetadataVerifier = {
    async computeProverMetadata(proverBytes) {
        const checksum = await sha256Hex(proverBytes);
        return { checksum, size: proverBytes.length };
    },

    async computeVerifierMetadata(verifierBytes) {
        const checksum = await sha256Hex(verifierBytes);
        return { checksum, size: verifierBytes.length };
    },

    async verifyProverBytes(proverBytes, metadata) {
        if (proverBytes.length !== metadata.size) {
            throw new ChecksumMismatchError(
                "prover",
                "size",
                String(metadata.size),
                String(proverBytes.length)
            );
        }
        const checksum = await sha256Hex(proverBytes);
        if (checksum !== metadata.checksum) {
            throw new ChecksumMismatchError(
                "prover",
                "checksum",
                metadata.checksum,
                checksum
            );
        }
    },

    async verifyVerifierBytes(verifierBytes, metadata) {
        if (verifierBytes.length !== metadata.size) {
            throw new ChecksumMismatchError(
                "verifier",
                "size",
                String(metadata.size),
                String(verifierBytes.length)
            );
        }
        const checksum = await sha256Hex(verifierBytes);
        if (checksum !== metadata.checksum) {
            throw new ChecksumMismatchError(
                "verifier",
                "checksum",
                metadata.checksum,
                checksum
            );
        }
    },

    async verifyKeyPairBytes(keys, metadata) {
        const [proverBytes, verifierBytes] = keys;
        const { prover, verifier } = metadata;

        if (proverBytes.length !== prover.size) {
            throw new ChecksumMismatchError(
                "prover",
                "size",
                String(prover.size),
                String(proverBytes.length)
            );
        }
        if (verifierBytes.length !== verifier.size) {
            throw new ChecksumMismatchError(
                "verifier",
                "size",
                String(verifier.size),
                String(verifierBytes.length)
            );
        }

        const [proverChecksum, verifierChecksum] = await Promise.all([
            sha256Hex(proverBytes),
            sha256Hex(verifierBytes),
        ]);

        if (proverChecksum !== prover.checksum) {
            throw new ChecksumMismatchError(
                "prover",
                "checksum",
                prover.checksum,
                proverChecksum
            );
        }
        if (verifierChecksum !== verifier.checksum) {
            throw new ChecksumMismatchError(
                "verifier",
                "checksum",
                verifier.checksum,
                verifierChecksum
            );
        }
    },
};
