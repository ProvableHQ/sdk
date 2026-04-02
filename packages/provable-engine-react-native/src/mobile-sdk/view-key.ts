import { Address } from "./address";
import { getNitroClassNetworkAware } from "./current-network";
import type {
  Account as AccountNitro,
  RecordPlaintext,
  ViewKey as ViewKeyNitro,
} from "./specs/account.nitro";
import { Field } from "./wasm";

/**
 * ViewKey class for Aleo view key operations in React Native applications.
 *
 * Represents an Aleo view key which is used for decrypting records and deriving addresses.
 * The view key allows users to decrypt their activity on the blockchain without exposing
 * their private key. This class provides methods to create, convert, and use view keys
 * in a React Native environment.
 *
 * @example
 * import { ViewKey } from "@provablehq/shield-mobile-sdk";
 *
 * // Create from string
 * const viewKey = ViewKey.from_string("AViewKey1...");
 *
 * // Get string representation
 * const viewKeyString = viewKey.to_string();
 *
 * // Decrypt a record
 * const plaintext = viewKey.decrypt(recordCiphertext);
 *
 * // Get address
 * const address = viewKey.to_address();
 */
export class ViewKey {
  private _nitroViewKey: ViewKeyNitro;

  constructor(nitroViewKey: ViewKeyNitro) {
    this._nitroViewKey = nitroViewKey;
  }

  /**
   * Create a new view key from a string representation of a view key
   * @param {string} viewKeyString String representation of a view key
   * @returns {ViewKey} View key parsed from the string
   *
   * @example
   * import { ViewKey } from "@provablehq/shield-mobile-sdk";
   *
   * const viewKey = ViewKey.fromString("AViewKey1...");
   */
  static fromString(viewKeyString: string): ViewKey {
    const nitroAccount = getNitroClassNetworkAware<AccountNitro>("Account");
    const nitroViewKey = nitroAccount.viewKeyFromString(viewKeyString);
    return new ViewKey(nitroViewKey);
  }

  /**
   * Get a string representation of a view key
   * @returns {string} String representation of a view key
   *
   * @example
   * import { ViewKey } from "@provablehq/shield-mobile-sdk";
   *
   * const viewKey = ViewKey.fromString("AViewKey1...");
   * const viewKeyString = viewKey.toString();
   */
  toString(): string {
    return this._nitroViewKey.toString();
  }

  /**
   * Get the address corresponding to a view key
   * @returns {Address} Address derived from the view key
   *
   * @example
   * import { ViewKey } from "@provablehq/shield-mobile-sdk";
   *
   * const viewKey = ViewKey.fromString("AViewKey1...");
   * const address = viewKey.toAddress();
   */
  toAddress(): Address {
    const nitroAddress = this._nitroViewKey.toAddress();
    return new Address(nitroAddress);
  }

  /**
   * Decrypt a record ciphertext to plaintext using the view key
   * @param {string} ciphertext String representation of the record ciphertext
   * @returns {RecordPlaintext} Decrypted record plaintext
   *
   * @example
   * import { ViewKey } from "@provablehq/shield-mobile-sdk";
   *
   * const viewKey = ViewKey.fromString("AViewKey1...");
   * const plaintext = viewKey.decrypt("record1cipher...");
   */
  decrypt(ciphertext: string): RecordPlaintext {
    return this._nitroViewKey.decrypt(ciphertext);
  }

  toField(): Field {
    const nitroField = this._nitroViewKey.toField();
    return Field.fromNitro(nitroField);
  }

  toBytesLe(): Uint8Array {
    return new Uint8Array(this._nitroViewKey.toBytesLe());
  }

  /**
   * Get the underlying Nitro view key object (for internal use with other HybridObjects)
   * @returns {ViewKeyNitro} The underlying Nitro view key
   * @internal
   */
  get nitro(): ViewKeyNitro {
    return this._nitroViewKey;
  }
}
