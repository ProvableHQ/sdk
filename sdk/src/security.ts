import { cryptoBoxSeal } from "@serenity-kit/noble-sodium";
import { base64 } from "@scure/base";
import { ViewKey, Authorization, ProvingRequest } from "./wasm.js";

/**
 * Encrypt an authorization with a cryptobox X25519 public key (libsodium-compatible wire format).
 *
 * @param {string} publicKey The cryptobox X25519 public key to encrypt with (encoded in RFC 4648 standard Base64).
 * @param {Authorization} authorization the authorization to encrypt.
 *
 * @returns {string} the encrypted authorization in RFC 4648 standard Base64.
 */
export function encryptAuthorization(publicKey: string, authorization: Authorization): string {
    return encryptMessage(publicKey, authorization.toBytesLe());
}

/**
 * Encrypt a ProvingRequest with a cryptobox X25519 public key (libsodium-compatible wire format).
 *
 * @param {string} publicKey The cryptobox X25519 public key to encrypt with (encoded in RFC 4648 standard Base64).
 * @param {ProvingRequest} provingRequest the ProvingRequest to encrypt.
 *
 * @returns {string} the encrypted ProvingRequest in RFC 4648 standard Base64.
 */
export function encryptProvingRequest(publicKey: string, provingRequest: ProvingRequest): string {
    return encryptMessage(publicKey, provingRequest.toBytesLe());
}

/**
 * Encrypt a view key with a cryptobox X25519 public key (libsodium-compatible wire format).
 *
 * @param {string} publicKey The cryptobox X25519 public key to encrypt with (encoded in RFC 4648 standard Base64).
 * @param {ViewKey} viewKey the view key to encrypt.
 *
 * @returns {string} the encrypted view key in RFC 4648 standard Base64.
 */
export function encryptViewKey(publicKey: string, viewKey: ViewKey): string {
    return encryptMessage(publicKey, viewKey.toBytesLe());
}

/**
 * Encrypt a record scanner registration request.
 *
 * @param {string} publicKey The cryptobox X25519 public key to encrypt with (encoded in RFC 4648 standard Base64).
 * @param {ViewKey} viewKey the view key to encrypt.
 * @param {number} start the start height of the registration request.
 *
 * @returns {string} the encrypted view key in RFC 4648 standard Base64.
 */
export function encryptRegistrationRequest(publicKey: string, viewKey: ViewKey, start: number): string {
    // Turn the view key into a Uint8Array.
    const vk_bytes: Uint8Array = viewKey.toBytesLe();
    // Create a new array to hold the original bytes and the 4-byte start height.
    const bytes = new Uint8Array(vk_bytes.length + 4);

    // Copy existing bytes.
    bytes.set(vk_bytes, 0);

    // Write the 4-byte number in LE format at the end of the array.
    const view = new DataView(bytes.buffer);
    view.setUint32(vk_bytes.length, start, true);

    // Encrypt the encoded bytes, ensuring sensitive intermediate
    // byte arrays are zeroized regardless of success or failure.
    try {
        return encryptMessage(publicKey, bytes);
    } finally {
        zeroizeBytes(vk_bytes);
        zeroizeBytes(bytes);
    }
}

/**
 * Best-effort zeroization of a byte array by overwriting all bytes with zeros.
 * Use this to clear sensitive data (e.g., key bytes) from memory when working
 * with Uint8Array representations of keys or other secrets.
 *
 * This is best-effort in JavaScript — the JIT compiler could theoretically
 * elide the fill if the array is never read again (though current engines
 * do not). For deterministic zeroization of key material, use
 * `Account.destroy()` or call `.free()` on key objects (PrivateKey, ViewKey,
 * ComputeKey, GraphKey) whose Rust Drop implementations zeroize memory
 * before deallocation.
 *
 * Note: This cannot zeroize JavaScript strings, which are immutable and managed
 * by the garbage collector. Prefer using byte array representations of sensitive
 * data over strings whenever possible.
 *
 * @param {Uint8Array} bytes The byte array to zeroize
 *
 * @example
 * const keyBytes = privateKey.toBytesLe();
 * // ... use keyBytes ...
 * zeroizeBytes(keyBytes); // Overwrite with zeros when done
 */
export function zeroizeBytes(bytes: Uint8Array): void {
    bytes.fill(0);
}

/**
 * Encrypt arbitrary bytes with a cryptobox public key using the libsodium
 * `crypto_box_seal` wire format.
 *
 * The implementation is delegated to `@serenity-kit/noble-sodium`, which
 * composes the primitive steps of `crypto_box_seal` — ephemeral X25519
 * keypair, blake2b-24 nonce derivation over `epk || rpk`, HSalsa20 key
 * derivation from the ECDH shared secret, and XSalsa20-Poly1305 AEAD — on
 * top of the audited `@noble/*` primitives. Output is byte-identical to
 * libsodium's `crypto_box_seal` for any given ephemeral key, so ciphertexts
 * are decryptable by any libsodium-compatible backend (e.g. `sodiumoxide`,
 * `libsodium-sys`) with no changes.
 *
 * @param {string} publicKey The cryptobox X25519 public key to encrypt with (encoded in RFC 4648 standard Base64).
 * @param {Uint8Array} message the bytes to encrypt.
 *
 * @returns {string} the encrypted bytes in RFC 4648 standard Base64.
 */
function encryptMessage(publicKey: string, message: Uint8Array): string {
    const publicKeyBytes = base64.decode(publicKey);
    const ciphertext = cryptoBoxSeal({ message, publicKey: publicKeyBytes });
    return base64.encode(ciphertext);
}
