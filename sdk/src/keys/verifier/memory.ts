import { KeyVerificationError, KeyVerifier, KeyFingerprint, KeyMetadata, sha256Hex } from "./interface";

/**
 * In-memory implementation of FunctionKeyVerifier that stores and verifies key fingerprints.
 * Provides functionality to compute and verify cryptographic checksums of keys, storing them
 * in memory for subsequent verification. This implementation is primarily used for testing
 * and development purposes where persistence is not required.
 * 
 * Key features:
 * - Computes SHA-256 checksums and sizes for key bytes.
 * - Stores key fingerprints in memory using string locators.
 * - Verifies key bytes against stored or provided fingerprints.
 *
 * @implements {KeyVerifier}
 */
export class MemKeyVerifier implements KeyVerifier {
    private keyStore: Record<string, KeyFingerprint> = {};

    /**
     * Computes and optionally stores key metadata. If a keyFingerprint is provided, this function will verify the computed checksum against it before storing it.
     *
     * @param {KeyMetadata} keyMetadata - Object containing key bytes and optional verification data.
     * @throws {KeyVerificationError} When provided keyFingerprint doesn't match computed values.
     * @returns {Promise<KeyFingerprint>} Computed key metadata.
     */
    async computeKeyMetadata(keyMetadata: KeyMetadata): Promise<KeyFingerprint> {
        // Compute the metadata from the key bytes
        const computedFingerprint: KeyFingerprint = {
            checksum: await sha256Hex(keyMetadata.keyBytes),
            size: keyMetadata.keyBytes.length
        };

        // If a KeyFingerprint is provided, verify it matches computed values.
        if (keyMetadata.fingerprint) {
            if (keyMetadata.fingerprint.size !== computedFingerprint.size) {
                throw new KeyVerificationError(
                    keyMetadata.locator ? keyMetadata.locator : "",
                    "size",
                    String(keyMetadata.fingerprint.size),
                    String(computedFingerprint.size)
                );
            }
            if (keyMetadata.fingerprint.checksum !== computedFingerprint.checksum) {
                throw new KeyVerificationError(
                    keyMetadata.locator ? keyMetadata.locator : "",
                    "checksum",
                    keyMetadata.fingerprint.checksum,
                    computedFingerprint.checksum
                );
            }
        }

        // If locator is provided, store only the fingerprint
        if (keyMetadata.locator) {
            this.keyStore[keyMetadata.locator] = computedFingerprint;
        }

        return computedFingerprint;
    }

    /**
     * Verifies key bytes against stored or provided metadata. Follows a priority verification scheme:
     * 1. If KeyFingerprint is provided in the metadata, this method verifies against that first.
     * 2. If a locator is provided, attempts to verify against stored fingerprint.
     * 3. If neither is available, throws an error.
     *
     * @param {KeyMetadata} keyMetadata - Object containing the key bytes and optional verification metadata.
     * @throws {Error} When neither keyFingerprint nor valid locator is provided for verification.
     * @throws {KeyVerificationError} When size or checksum verification fails.
     * @returns {Promise<void>} Promise that resolves when verification succeeds.
     */
    async verifyKeyBytes(keyMetadata: KeyMetadata): Promise<void> {
        if (!keyMetadata.keyBytes) {
            throw new Error("Key bytes must be provided for verification.");
        }

        // Compute the fingerprint for the provided bytes.
        const computedFingerprint = await this.computeKeyMetadata({
            keyBytes: keyMetadata.keyBytes
        });

        // Determine which fingerprint to verify against.
        let fingerprintToVerify: KeyFingerprint | undefined;

        if (keyMetadata.fingerprint) {
            // If a key fingerprint is provided, use it.
            fingerprintToVerify = keyMetadata.fingerprint;
        } else if (keyMetadata.locator) {
            // Otherwise try to get stored fingerprint by locator.
            fingerprintToVerify = this.keyStore[keyMetadata.locator];
        }

        if (!fingerprintToVerify) {
            throw new Error("Either keyFingerprint or a valid locator must be provided for verification.");
        }

        // Verify the key size.
        if (fingerprintToVerify.size !== computedFingerprint.size) {
            throw new KeyVerificationError(
                keyMetadata.locator || "",
                "size",
                String(fingerprintToVerify.size),
                String(computedFingerprint.size)
            );
        }

        // Verify the key checksum.
        if (fingerprintToVerify.checksum !== computedFingerprint.checksum) {
            throw new KeyVerificationError(
                keyMetadata.locator || "",
                "checksum",
                fingerprintToVerify.checksum,
                computedFingerprint.checksum
            );
        }
    }
}