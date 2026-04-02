import type { Authorization } from "./authorization";
import { cryptoBoxSealBase64, cryptoBoxSealOpenBase64 } from "./utilities";
import type { ViewKey } from "./view-key";
import type { ProvingRequest } from "./wasm";

/**
 * Encrypt an authorization with a libsodium cryptobox public key.
 *
 * @param {string} publicKey The cryptobox X25519 public key to encrypt with (encoded in RFC 4648 standard Base64).
 * @param {Authorization} authorization the authorization to encrypt.
 *
 * @returns {string} the encrypted authorization in RFC 4648 standard Base64.
 */
export function encryptAuthorization(publicKey: string, authorization: Authorization): string {
  // Ready the cryptobox lib.
  return encryptMessage(publicKey, new Uint8Array(authorization.toBytesLe()));
}

/**
 * Encrypt a ProvingRequest with a libsodium cryptobox public key.
 *
 * @param {string} publicKey The cryptobox X25519 public key to encrypt with (encoded in RFC 4648 standard Base64).
 * @param {Authorization} provingRequest the ProvingRequest to encrypt.
 *
 * @returns {string} the encrypted ProvingRequest in RFC 4648 standard Base64.
 */
export function encryptProvingRequest(publicKey: string, provingRequest: ProvingRequest): string {
  return encryptMessage(publicKey, new Uint8Array(provingRequest.toBytesLe()));
}

/**
 * Decrypt a ProvingRequest encrypted with a libsodium cryptobox sealed box public key.
 *
 * @param {string} publicKey The cryptobox X25519 public key used during encryption (RFC 4648 Base64).
 * @param {string} privateKey The recipient X25519 private key (RFC 4648 Base64).
 * @param {string} ciphertext The sealed ciphertext (RFC 4648 Base64).
 *
 * @returns {ArrayBuffer} the decrypted ProvingRequest bytes.
 */
export function decryptProvingRequest(
  publicKey: string,
  privateKey: string,
  ciphertext: string
): ArrayBuffer {
  return decryptMessage(publicKey, privateKey, ciphertext);
}

/**
 * Encrypt a view key with a libsodium cryptobox public key.
 *
 * @param {string} publicKey The cryptobox X25519 public key to encrypt with (encoded in RFC 4648 standard Base64).
 * @param {ViewKey} viewKey the view key to encrypt.
 *
 * @returns {string} the encrypted view key in RFC 4648 standard Base64.
 */
export function encryptViewKey(publicKey: string, viewKey: ViewKey): string {
  return encryptMessage(publicKey, viewKey.toBytesLe());
}

export function encryptRegistrationRequest(
  publicKey: string,
  viewKey: ViewKey,
  start: number
): string {
  // Turn the view key into a Uint8Array.
  const vk_bytes: Uint8Array = viewKey.toBytesLe();
  // Create a new array to hold the original bytes and the 4-byte start height.
  const bytes = new Uint8Array(vk_bytes.length + 4);

  // Copy existing bytes.
  bytes.set(vk_bytes, 0);

  // Write the 4-byte number in LE format at the end of the array.
  const view = new DataView(bytes.buffer);
  view.setUint32(vk_bytes.length, start, true);

  // Encrypt the encoded bytes.
  return encryptMessage(publicKey, bytes);
}

/**
 * Encrypt arbitrary bytes with a libsodium cryptobox public key.
 *
 * @param {string} publicKey The cryptobox X25519 public key to encrypt with (encoded in RFC 4648 standard Base64).
 * @param {Uint8Array} message the bytes to encrypt.
 *
 * @returns {string} the encrypted bytes in RFC 4648 standard Base64.
 */
function encryptMessage(publicKey: string, message: Uint8Array): string {
  return cryptoBoxSealBase64(publicKey, message);
}

function decryptMessage(publicKey: string, privateKey: string, ciphertext: string): ArrayBuffer {
  return cryptoBoxSealOpenBase64(publicKey, privateKey, ciphertext);
}
