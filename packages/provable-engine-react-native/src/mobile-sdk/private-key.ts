import { NitroModules } from "react-native-nitro-modules";
import { Address } from "./address";
import { getNitroClassNetworkAware } from "./current-network";
import type {
  Account as AccountNitro,
  ComputeKey,
  PrivateKey as PrivateKeyNitro,
  Signature,
} from "./specs/account.nitro";
import { toAB } from "./utilities";
import { ViewKey } from "./view-key";

/**
 * PrivateKey class for Aleo private key operations in React Native applications.
 *
 * Represents an Aleo private key which is used for signing transactions and deriving
 * other cryptographic keys like view keys and addresses. This class provides methods
 * to create, convert, and use private keys in a React Native environment.
 *
 * @example
 * import { PrivateKey } from "@provablehq/shield-mobile-sdk";
 *
 * // Generate a new private key
 * const privateKey = new PrivateKey();
 *
 * // Create from string
 * const privateKey = PrivateKey.fromString("APrivateKey1zkp...");
 *
 * // Get string representation
 * const privateKeyString = privateKey.toString();
 *
 * // Sign a message
 * const message = new Uint8Array([1, 2, 3, 4, 5]);
 * const signature = await privateKey.sign(message);
 */
export class PrivateKey {
  private _nitroPrivateKey: PrivateKeyNitro;

  constructor(nitroPrivateKey?: PrivateKeyNitro) {
    if (nitroPrivateKey) {
      this._nitroPrivateKey = nitroPrivateKey;
    } else {
      // Generate a new private key using a cryptographically secure random number generator
      const nitroAccount = getNitroClassNetworkAware<AccountNitro>("Account");
      this._nitroPrivateKey = nitroAccount.createPrivateKey();
    }
  }

  /**
   * Generate a new private key using a cryptographically secure random number generator
   * @returns {PrivateKey} A new randomly generated private key
   *
   * @example
   * import { PrivateKey } from "@provablehq/shield-mobile-sdk";
   *
   * const privateKey = new PrivateKey();
   */
  static new(): PrivateKey {
    return new PrivateKey();
  }

  /**
   * Get a private key from a series of unchecked bytes
   * @param {Uint8Array} seed Unchecked 32 byte long Uint8Array acting as the seed for the private key
   * @returns {PrivateKey} Private key derived from the seed
   *
   * @example
   * import { PrivateKey } from "@provablehq/shield-mobile-sdk";
   *
   * const seed = new Uint8Array(32);
   * crypto.getRandomValues(seed);
   * const privateKey = PrivateKey.fromSeedUnchecked(seed);
   */
  static fromSeedUnchecked(seed: Uint8Array): PrivateKey {
    const nitroAccount = getNitroClassNetworkAware<AccountNitro>("Account");
    const nitroPrivateKey = nitroAccount.privateKeyFromSeed(seed.buffer as ArrayBuffer);
    return new PrivateKey(nitroPrivateKey);
  }

  /**
   * Get a private key from a string representation of a private key
   * @param {string} privateKeyString String representation of a private key
   * @returns {PrivateKey} Private key parsed from the string
   *
   * @example
   * import { PrivateKey } from "@provablehq/shield-mobile-sdk";
   *
   * const privateKey = PrivateKey.fromString("APrivateKey1zkp...");
   */
  static fromString(privateKeyString: string): PrivateKey {
    const nitroAccount = getNitroClassNetworkAware<AccountNitro>("Account");
    const nitroPrivateKey = nitroAccount.privateKeyFromString(privateKeyString);
    return new PrivateKey(nitroPrivateKey);
  }

  /**
   * Get a string representation of the private key. This function should be used very carefully
   * as it exposes the private key plaintext
   * @returns {string} String representation of a private key
   *
   * @example
   * import { PrivateKey } from "@provablehq/shield-mobile-sdk";
   *
   * const privateKey = PrivateKey.fromString("APrivateKey1zkp...");
   * const privateKeyString = privateKey.toString();
   */
  toString(): string {
    return this._nitroPrivateKey.toString();
  }

  /**
   * Get the view key corresponding to the private key
   * @returns {ViewKey} View key derived from the private key
   *
   * @example
   * import { PrivateKey } from "@provablehq/shield-mobile-sdk";
   *
   * const privateKey = PrivateKey.fromString("APrivateKey1zkp...");
   * const viewKey = privateKey.toViewKey();
   */
  toViewKey(): ViewKey {
    const nitroViewKey = this._nitroPrivateKey.toViewKey();
    return new ViewKey(nitroViewKey);
  }

  /**
   * Get the address corresponding to the private key
   * @returns {Address} Address derived from the private key
   *
   * @example
   * import { PrivateKey } from "@provablehq/shield-mobile-sdk";
   *
   * const privateKey = PrivateKey.fromString("APrivateKey1zkp...");
   * const address = privateKey.toAddress();
   */
  toAddress(): Address {
    const nitroAddress = this._nitroPrivateKey.toAddress();
    return new Address(nitroAddress);
  }

  /**
   * Get the compute key corresponding to the private key
   * @returns {Promise<ComputeKey>} Compute key derived from the private key
   *
   * @example
   * import { PrivateKey } from "@provablehq/shield-mobile-sdk";
   *
   * const privateKey = PrivateKey.fromString("APrivateKey1zkp...");
   * const computeKey = await privateKey.toComputeKey();
   */
  async toComputeKey(): Promise<ComputeKey> {
    return await this._nitroPrivateKey.toComputeKey();
  }

  /**
   * Sign a message with the private key
   * @param {Uint8Array | ArrayBuffer} message Message to be signed
   * @returns {Signature} Signature over the message
   *
   * @example
   * import { PrivateKey } from "@provablehq/shield-mobile-sdk";
   *
   * const privateKey = PrivateKey.fromString("APrivateKey1zkp...");
   * const message = new Uint8Array([1, 2, 3, 4, 5]);
   * const signature = privateKey.sign(message);
   */
  sign(message: Uint8Array | ArrayBuffer): Signature {
    return this._nitroPrivateKey.sign(toAB(message));
  }

  /**
   * Get the underlying Nitro private key object (for internal use with other HybridObjects)
   * @returns {PrivateKeyNitro} The underlying Nitro private key
   * @internal
   */
  get nitro(): PrivateKeyNitro {
    return this._nitroPrivateKey;
  }
}
