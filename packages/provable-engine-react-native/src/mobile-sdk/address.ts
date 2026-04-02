import { NitroModules } from "react-native-nitro-modules";
import { getNitroClassNetworkAware } from "./current-network";
import type {
  Account as AccountNitro,
  Address as AddressNitro,
  Signature,
} from "./specs/account.nitro";
import { toAB } from "./utilities";

/**
 * Address class for Aleo address operations in React Native applications.
 *
 * Represents an Aleo address which is the public identifier for an account.
 * Addresses are derived from private keys and can be used to receive transactions
 * and verify signatures. This class provides methods to create, convert, and use
 * addresses in a React Native environment.
 *
 * @example
 * import { Address } from "@provablehq/shield-mobile-sdk";
 *
 * // Create from string
 * const address = Address.fromString("aleo1...");
 *
 * // Get string representation
 * const addressString = address.toString();
 *
 * // Verify a signature
 * const isValid = address.verify(message, signature);
 */
export class Address {
  private _nitroAddress: AddressNitro;

  constructor(nitroAddress: AddressNitro) {
    this._nitroAddress = nitroAddress;
  }

  /**
   * Create a new address from a string representation of an address
   * @param {string} addressString String representation of an address
   * @returns {Address} Address parsed from the string
   *
   * @example
   * import { Address } from "@provablehq/shield-mobile-sdk";
   *
   * const address = Address.fromString("aleo1...");
   */
  static fromString(addressString: string): Address {
    const nitroAccount = getNitroClassNetworkAware<AccountNitro>("Account");
    const nitroAddress = nitroAccount.addressFromString(addressString);
    return new Address(nitroAddress);
  }

  /**
   * Get a string representation of an Aleo address object
   * @returns {string} String representation of the address
   *
   * @example
   * import { Address } from "@provablehq/shield-mobile-sdk";
   *
   * const address = Address.from_string("aleo1...");
   * const addressString = address.toString();
   */
  toString(): string {
    return this._nitroAddress.toString();
  }

  /**
   * Verify a signature for a message signed by the address
   * @param {Uint8Array | ArrayBuffer} message Byte array representing a message signed by the address
   * @param {Signature} signature Signature to be verified
   * @returns {boolean} Boolean representing whether or not the signature is valid
   *
   * @example
   * import { Address, PrivateKey } from "@provablehq/shield-mobile-sdk";
   *
   * const privateKey = PrivateKey.from_string("APrivateKey1zkp...");
   * const address = privateKey.to_address();
   * const message = new Uint8Array([1, 2, 3, 4, 5]);
   * const signature = privateKey.sign(message);
   * const isValid = address.verify(message, signature);
   */
  verify(message: Uint8Array | ArrayBuffer, signature: Signature): boolean {
    return this._nitroAddress.verify(toAB(message), signature);
  }

  /**
   * Get the underlying Nitro address object (for internal use with other HybridObjects)
   * @returns {AddressNitro} The underlying Nitro address
   * @internal
   */
  get nitro(): AddressNitro {
    return this._nitroAddress;
  }
}
