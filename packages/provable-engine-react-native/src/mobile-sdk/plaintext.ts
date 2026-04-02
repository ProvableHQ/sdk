import type { Address } from "./address";
import { getNitroClassNetworkAware } from "./current-network";
import type { Plaintext as PlaintextNitro } from "./specs/plaintext.nitro";

const createFactory = (): PlaintextNitro => getNitroClassNetworkAware<PlaintextNitro>("Plaintext");

/**
 * Plaintext wrapper for interacting with Nitro hybrid Plaintext objects.
 */
export class Plaintext {
  private readonly _nitroPlaintext: PlaintextNitro;

  constructor(nitroPlaintext: PlaintextNitro) {
    this._nitroPlaintext = nitroPlaintext;
  }

  /**
   * Create a Plaintext from its string representation.
   */
  static fromString(value: string): Plaintext {
    const nitroPlaintext = createFactory().fromString(value);
    return new Plaintext(nitroPlaintext);
  }

  /**
   * Create a Plaintext from little-endian bytes.
   */
  static fromBytes(bytes: Uint8Array): Plaintext {
    const view = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    const nitroPlaintext = createFactory().fromBytesLe(view as ArrayBuffer);
    return new Plaintext(nitroPlaintext);
  }

  /**
   * Create a Plaintext from bit representation (0/1 bytes).
   */
  static fromBits(bits: Uint8Array): Plaintext {
    const view = bits.buffer.slice(bits.byteOffset, bits.byteOffset + bits.byteLength);
    const nitroPlaintext = createFactory().fromBitsLe(view as ArrayBuffer);
    return new Plaintext(nitroPlaintext);
  }

  /**
   * Create a Plaintext from an array of field strings.
   */
  static fromFields(fields: string[]): Plaintext {
    const nitroPlaintext = createFactory().fromFields(fields);
    return new Plaintext(nitroPlaintext);
  }

  /** Clone the underlying Plaintext. */
  clone(): Plaintext {
    return new Plaintext(this._nitroPlaintext.clone());
  }

  find(name: string): Plaintext {
    return new Plaintext(this._nitroPlaintext.find(name));
  }

  /** Return the string representation. */
  toString(): string {
    return this._nitroPlaintext.toString();
  }

  /** Return the little-endian bytes. */
  toBytesLe(): Uint8Array {
    return new Uint8Array(this._nitroPlaintext.toBytesLe());
  }

  /** Return the bit representation as 0/1 bytes. */
  toBitsLe(): Uint8Array {
    return new Uint8Array(this._nitroPlaintext.toBitsLe());
  }

  toFields(): string[] {
    return this._nitroPlaintext.toFields();
  }

  encrypt(address: Address | string, randomizer: string): string {
    const addressString = typeof address === "string" ? address : address.toString();
    return this._nitroPlaintext.encrypt(addressString, randomizer);
  }

  encryptSymmetric(transitionViewKey: string): string {
    return this._nitroPlaintext.encryptSymmetric(transitionViewKey);
  }

  toObject(): string {
    return this._nitroPlaintext.toObjectZero();
  }

  /** Get the plaintext type string. */
  plaintextType(): string {
    return this._nitroPlaintext.plaintextType();
  }

  /** Access the underlying Nitro Plaintext object. */
  get nitro(): PlaintextNitro {
    return this._nitroPlaintext;
  }
}
