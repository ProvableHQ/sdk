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
    // Zeroize the intermediate plaintext bytes regardless of success or
    // failure — same pattern as encryptRegistrationRequest.
    const bytes = authorization.toBytesLe();
    try {
        return encryptMessage(publicKey, bytes);
    } finally {
        zeroizeBytes(bytes);
    }
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
    // Zeroize the intermediate plaintext bytes regardless of success or
    // failure — same pattern as encryptRegistrationRequest.
    const bytes = provingRequest.toBytesLe();
    try {
        return encryptMessage(publicKey, bytes);
    } finally {
        zeroizeBytes(bytes);
    }
}

/**
 * Serialize a ProvingRequest for later encryption with
 * `encryptSerializedProvingRequest`.
 *
 * Useful when the request may have to be encrypted more than once: the
 * delegated proving service's one-time keys are single-use, so a client that
 * needs to resend a request (e.g. after the service rejected a spent or
 * unknown `key_id`) can keep the serialized form and re-encrypt it for a
 * fresh key instead of rebuilding and re-signing the request.
 *
 * The returned buffer contains the plaintext request (including the signed
 * authorization and its inputs) and is owned by the caller: keep it only as
 * long as a resend may still be needed, then overwrite it with
 * `zeroizeBytes(serialized)`. Zeroization in JavaScript is best-effort (see
 * `zeroizeBytes`), and transient copies made inside the wasm boundary by
 * `toBytesLe` are outside its reach.
 *
 * @param {ProvingRequest} provingRequest the ProvingRequest to serialize.
 *
 * @returns {Uint8Array} the serialized ProvingRequest bytes.
 */
export function serializeProvingRequest(provingRequest: ProvingRequest): Uint8Array {
    return provingRequest.toBytesLe();
}

/**
 * Encrypt an already-serialized ProvingRequest (as produced by
 * `serializeProvingRequest`) with a cryptobox X25519 public key
 * (libsodium-compatible wire format).
 *
 * Produces exactly the same ciphertext format as `encryptProvingRequest` —
 * `encryptSerializedProvingRequest(pk, serializeProvingRequest(req))` and
 * `encryptProvingRequest(pk, req)` are interchangeable from the proving
 * service's point of view.
 *
 * The input buffer is not mutated and deliberately not zeroized here: the
 * caller keeps ownership so the same bytes can be re-encrypted for another
 * one-time key (retry). Call `zeroizeBytes(serializedProvingRequest)` once
 * no resend can be needed anymore.
 *
 * @param {string} publicKey The cryptobox X25519 public key to encrypt with (encoded in RFC 4648 standard Base64).
 * @param {Uint8Array} serializedProvingRequest the serialized ProvingRequest bytes.
 *
 * @returns {string} the encrypted ProvingRequest in RFC 4648 standard Base64.
 */
export function encryptSerializedProvingRequest(
    publicKey: string,
    serializedProvingRequest: Uint8Array,
): string {
    return encryptMessage(publicKey, serializedProvingRequest);
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
    // Zeroize the intermediate plaintext bytes regardless of success or
    // failure — same pattern as encryptRegistrationRequest.
    const bytes = viewKey.toBytesLe();
    try {
        return encryptMessage(publicKey, bytes);
    } finally {
        zeroizeBytes(bytes);
    }
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
