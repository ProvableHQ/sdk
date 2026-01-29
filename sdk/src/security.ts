import sodium from "libsodium-wrappers";
import { ViewKey, Authorization, ProvingRequest } from "@provablehq/wasm";
await sodium.ready;

/**
 * Encrypt an authorization with a libsodium cryptobox public key.
 *
 * @param {string} publicKey The cryptobox X25519 public key to encrypt with (encoded in RFC 4648 standard Base64).
 * @param {Authorization} authorization the authorization to encrypt.
 *
 * @returns the encrypted authorization in RFC 4648 standard Base64.
 */
export async function encryptAuthorization(publicKey: string, authorization: Authorization): Promise<string> {
    // Ready the cryptobox lib.
    return encryptMessage(publicKey, authorization.toBytesLe());
}

/**
 * Encrypt a ProvingRequest with a libsodium cryptobox public key.
 *
 * @param {string} publicKey The cryptobox X25519 public key to encrypt with (encoded in RFC 4648 standard Base64).
 * @param {Authorization} provingRequest the ProvingRequest to encrypt.
 *
 * @returns the encrypted ProvingRequest in RFC 4648 standard Base64.
 */
export async function encryptProvingRequest(publicKey: string, provingRequest: ProvingRequest): Promise<string> {
    return encryptMessage(publicKey, provingRequest.toBytesLe());
}

/**
 * Encrypt a view key with a libsodium cryptobox public key.
 *
 * @param {Uint8Array} publicKey The cryptobox X25519 public key to encrypt with (encoded in RFC 4648 standard Base64).
 * @param {ViewKey} viewKey the view key to encrypt.
 *
 * @returns the encrypted view key in RFC 4648 standard Base64.
 */
export async function encryptViewKey(publicKey: string, viewKey: ViewKey): Promise<string> {
    return encryptMessage(publicKey, viewKey.toBytesLe());
}

/**
 * Encrypt arbitrary bytes with a libsodium cryptobox public key.
 *
 * @param {string} publicKey The cryptobox X25519 public key to encrypt with (encoded in RFC 4648 standard Base64).
 * @param {Uint8Array} message the bytes to encrypt.
 *
 * @returns the encrypted bytes in RFC 4648 standard Base64.
 */
async function encryptMessage(publicKey: string, message: Uint8Array) {
    const publicKeyBytes = sodium.from_base64(publicKey, sodium.base64_variants.ORIGINAL);
    return sodium.to_base64(sodium.crypto_box_seal(message, publicKeyBytes), sodium.base64_variants.ORIGINAL);
}
