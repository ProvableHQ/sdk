/* tslint:disable */
/* eslint-disable */
/**
*/
export class Address {
  free(): void;
/**
* @param {PrivateKey} private_key
* @returns {Address}
*/
  static from_private_key(private_key: PrivateKey): Address;
/**
* @param {ViewKey} view_key
* @returns {Address}
*/
  static from_view_key(view_key: ViewKey): Address;
/**
* @param {string} address
* @returns {Address}
*/
  static from_string(address: string): Address;
/**
* @returns {string}
*/
  to_string(): string;
/**
* @param {Uint8Array} message
* @param {Signature} signature
* @returns {boolean}
*/
  verify(message: Uint8Array, signature: Signature): boolean;
}
/**
*/
export class PrivateKey {
  free(): void;
/**
*/
  constructor();
/**
* @param {Uint8Array} seed
* @returns {PrivateKey}
*/
  static from_seed_unchecked(seed: Uint8Array): PrivateKey;
/**
* @param {string} private_key
* @returns {PrivateKey}
*/
  static from_string(private_key: string): PrivateKey;
/**
* @returns {string}
*/
  to_string(): string;
/**
* @returns {ViewKey}
*/
  to_view_key(): ViewKey;
/**
* @returns {Address}
*/
  to_address(): Address;
/**
* @param {Uint8Array} message
* @returns {Signature}
*/
  sign(message: Uint8Array): Signature;
}
/**
*/
export class Signature {
  free(): void;
/**
* @param {PrivateKey} private_key
* @param {Uint8Array} message
* @returns {Signature}
*/
  static sign(private_key: PrivateKey, message: Uint8Array): Signature;
/**
* @param {Address} address
* @param {Uint8Array} message
* @returns {boolean}
*/
  verify(address: Address, message: Uint8Array): boolean;
/**
* @param {string} signature
* @returns {Signature}
*/
  static from_string(signature: string): Signature;
/**
* @returns {string}
*/
  to_string(): string;
}
/**
*/
export class ViewKey {
  free(): void;
/**
* @param {PrivateKey} private_key
* @returns {ViewKey}
*/
  static from_private_key(private_key: PrivateKey): ViewKey;
/**
* @param {string} view_key
* @returns {ViewKey}
*/
  static from_string(view_key: string): ViewKey;
/**
* @returns {string}
*/
  to_string(): string;
/**
* @returns {Address}
*/
  to_address(): Address;
/**
* @param {string} ciphertext
* @returns {string}
*/
  decrypt(ciphertext: string): string;
}
