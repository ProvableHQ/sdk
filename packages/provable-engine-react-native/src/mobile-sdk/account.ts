import { Address } from "./address";
import { getNitroClassNetworkAware } from "./current-network";
import { Field } from "./field";
import { Group } from "./group";
import type {
  Account as AccountNitro,
  ComputeKey,
  PrivateKey,
  RecordCiphertext,
  RecordPlaintext,
  Signature,
  ViewKey as ViewKeyNitro,
} from "./specs/account.nitro";
import { toAB } from "./utilities";
import { ViewKey } from "./view-key";

interface AccountParam {
  privateKey?: string;
  seed?: Uint8Array;
}

/**
 * Key Management class. Enables the creation of a new Aleo Account, importation of an existing account from
 * an existing private key or seed, and message signing and verification functionality. An Aleo Account is generated
 * from a randomly generated seed (number) from which an account private key, view key, and a public account address are
 * derived. The private key lies at the root of an Aleo account. It is a highly sensitive secret and should be protected
 * as it allows for creation of Aleo Program executions and arbitrary value transfers. The View Key allows for decryption
 * of a user's activity on the blockchain. The Address is the public address to which other users of Aleo can send Aleo
 * credits and other records to. This class should only be used in environments where the safety of the underlying key
 * material can be assured.
 *
 * @example
 * import { Account } from "@provablehq/shield-mobile-sdk";
 *
 * // Create a new account
 * const myRandomAccount = new Account();
 *
 * // Create an account from a randomly generated seed
 * const seed = new Uint8Array([94, 91, 52, 251, 240, 230, 226, 35, 117, 253, 224, 210, 175, 13, 205, 120, 155, 214, 7, 169, 66, 62, 206, 50, 188, 40, 29, 122, 40, 250, 54, 18]);
 * const mySeededAccount = new Account({seed: seed});
 *
 * // Create an account from an existing private key
 * const myExistingAccount = new Account({privateKey: "APrivateKey1zkp..."});
 *
 * // Sign a message
 * const hello_world = Uint8Array.from([104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100]);
 * const signature = await myRandomAccount.sign(hello_world);
 *
 * // Verify a signature
 * const isValid = myRandomAccount.verify(hello_world, signature);
 */
export class Account {
  private _nitroAccount: AccountNitro;
  private _privateKey: PrivateKey;
  private _viewKey: ViewKeyNitro;
  private _computeKey: ComputeKey;
  private _address: Address;

  constructor(params: AccountParam = {}) {
    this._nitroAccount = getNitroClassNetworkAware<AccountNitro>("Account");
    this._privateKey = this.privateKeyFromParams(params);
    this._viewKey = this._privateKey.toViewKey();
    this._computeKey = this._privateKey.toComputeKey();
    this._address = new Address(this._privateKey.toAddress());
  }

  /**
   * Creates a PrivateKey from the provided parameters.
   * @param {AccountParam} params The parameters containing either a private key string or a seed
   * @returns {PrivateKey} A PrivateKey instance derived from the provided parameters
   */
  private privateKeyFromParams(params: AccountParam): PrivateKey {
    if (params.seed) {
      return this._nitroAccount.privateKeyFromSeed(toAB(params.seed));
    }
    if (params.privateKey) {
      return this._nitroAccount.privateKeyFromString(params.privateKey);
    }
    return this._nitroAccount.createPrivateKey();
  }

  /**
   * Returns the PrivateKey associated with the account.
   * @returns {PrivateKey} The private key of the account
   *
   * @example
   * import { Account } from "@provablehq/shield-mobile-sdk";
   *
   * const account = new Account();
   * const privateKey = account.privateKey();
   */
  privateKey(): PrivateKey {
    return this._privateKey;
  }

  /**
   * Returns the ViewKey associated with the account.
   * @returns {ViewKey} The view key of the account
   *
   * @example
   * import { Account } from "@provablehq/shield-mobile-sdk";
   *
   * const account = new Account();
   * const viewKey = account.viewKey();
   */
  viewKey(): ViewKeyNitro {
    return this._viewKey;
  }

  viewKeyObject(): ViewKey {
    return new ViewKey(this._viewKey);
  }

  /**
   * Returns the ComputeKey associated with the account.
   * @returns {ComputeKey} The compute key of the account
   *
   * @example
   * import { Account } from "@provablehq/shield-mobile-sdk";
   *
   * const account = new Account();
   * const computeKey = account.computeKey();
   */
  computeKey(): ComputeKey {
    return this._computeKey;
  }

  /**
   * Returns the Address associated with the account.
   * @returns {Address} The address of the account
   *
   * @example
   * import { Account } from "@provablehq/shield-mobile-sdk";
   *
   * const account = new Account();
   * const address = account.address();
   */
  address(): Address {
    return this._address;
  }

  /**
   * Clone the account to create a new identical account
   * @returns {Promise<Account>} A new identical account
   *
   * @example
   * import { Account } from "@provablehq/shield-mobile-sdk";
   *
   * const account = new Account();
   * const clonedAccount = await account.clone();
   */
  clone(): Account {
    const privateKeyString = this._privateKey.toString();
    return new Account({ privateKey: privateKeyString });
  }

  /**
   * Returns the address of the account in a string representation.
   *
   * @returns {string} The string representation of the account address
   */
  toString(): string {
    return this._address.toString();
  }

  /**
   * Decrypts an encrypted record string into a plaintext record object.
   *
   * @param {string} ciphertext A string representing the ciphertext of a record.
   * @returns {RecordPlaintext} The decrypted record plaintext
   *
   * @example
   * // Import the AleoNetworkClient and Account classes
   * import { AleoNetworkClient, Account } from "@provablehq/shield-mobile-sdk";
   *
   * // Create a connection to the Aleo network and an account
   * const networkClient = new AleoNetworkClient("https://api.explorer.provable.com/v1");
   * const account = Account.fromCiphertext(process.env.ciphertext!, process.env.password!);
   *
   * // Get the record ciphertexts from a transaction.
   * const transaction = await networkClient.getTransactionObject("at1fjy6s9md2v4rgcn3j3q4qndtfaa2zvg58a4uha0rujvrn4cumu9qfazxdd");
   * const records = transaction.records();
   *
   * // Decrypt any records the account owns.
   * const decryptedRecords = [];
   * for (const record of records) {
   *    if (account.decryptRecord(record)) {
   *      decryptedRecords.push(record);
   *    }
   * }
   */
  decryptRecord(ciphertext: string): RecordPlaintext {
    return this._viewKey.decrypt(ciphertext);
  }

  /**
   * Decrypts an array of Record ciphertext strings into an array of record plaintext objects.
   *
   * @param {string[]} ciphertexts An array of strings representing the ciphertexts of records.
   * @returns {RecordPlaintext[]} An array of decrypted record plaintexts
   *
   * @example
   * // Import the AleoNetworkClient and Account classes
   * import { AleoNetworkClient, Account } from "@provablehq/shield-mobile-sdk";
   *
   * // Create a connection to the Aleo network and an account
   * const networkClient = new AleoNetworkClient("https://api.explorer.provable.com/v1");
   * const account = Account.fromCiphertext(process.env.ciphertext!, process.env.password!);
   *
   * // Get the record ciphertexts from a transaction.
   * const transaction = await networkClient.getTransactionObject("at1fjy6s9md2v4rgcn3j3q4qndtfaa2zvg58a4uha0rujvrn4cumu9qfazxdd");
   * const records = transaction.records();
   *
   * // Decrypt any records the account owns. If the account owns no records, the array will be empty.
   * const decryptedRecords = account.decryptRecords(records);
   */
  decryptRecords(ciphertexts: string[]): RecordPlaintext[] {
    return ciphertexts.map((ciphertext) => this._viewKey.decrypt(ciphertext));
  }

  /**
   * Generates a record view key from the account owner's view key and the record ciphertext.
   * This key can be used to decrypt the record without revealing the account's view key.
   * @param {RecordCiphertext | string} recordCiphertext The record ciphertext to generate the view key for
   * @returns {Field} The record view key
   *
   * @example
   * // Import the Account class
   * import { Account } from "@provablehq/shield-mobile-sdk";
   *
   * // Create an account object from a previously encrypted ciphertext and password.
   * const account = Account.fromCiphertext(process.env.ciphertext!, process.env.password!);
   *
   * // Generate a record view key from the account's view key and a record ciphertext
   * const recordCiphertext = Account.recordCiphertextFromString("your_record_ciphertext_here");
   * const recordViewKey = account.generateRecordViewKey(recordCiphertext);
   */
  generateRecordViewKey(recordCiphertext: RecordCiphertext | string): Field {
    const ciphertextObj =
      typeof recordCiphertext === "string"
        ? this._nitroAccount.recordCiphertextFromString(recordCiphertext)
        : recordCiphertext;

    if (!ciphertextObj.isOwner(this._viewKey)) {
      throw new Error("The record ciphertext does not belong to this account");
    }

    const nitroField = this._nitroAccount.generateRecordViewKey(this._viewKey, ciphertextObj);
    return Field.fromNitro(nitroField);
  }

  /**
   * Generates a transition view key from the account owner's view key and the transition public key.
   * This key can be used to decrypt the private inputs and outputs of a the transition without
   * revealing the account's view key.
   * @param {string | Group} tpk The transition public key
   * @returns {Field} The transition view key
   *
   * @example
   * // Import the Account class
   * import { Account } from "@provablehq/shield-mobile-sdk";
   *
   * // Generate a transition view key from the account's view key and a transition public key
   * const tpk = Account.groupFromString("your_transition_public_key_here");
   *
   * const transitionViewKey = account.generateTransitionViewKey(tpk);
   */
  generateTransitionViewKey(tpk: string | Group): Field {
    const tpkNitro = typeof tpk === "string" ? Group.fromString(tpk).toNitro() : tpk.toNitro();
    const nitroField = this._nitroAccount.generateTransitionViewKey(this._viewKey, tpkNitro);
    return Field.fromNitro(nitroField);
  }

  /**
   * Determines whether the account owns a ciphertext record.
   * @param {RecordCiphertext | string} ciphertext The record ciphertext to check ownership of
   * @returns {boolean} True if the account owns the record, false otherwise
   *
   * @example
   * // Import the AleoNetworkClient and Account classes
   * import { AleoNetworkClient, Account } from "@provablehq/shield-mobile-sdk";
   *
   * // Create a connection to the Aleo network and an account
   * const networkClient = new AleoNetworkClient("https://api.explorer.provable.com/v1");
   * const account = Account.fromCiphertext(process.env.ciphertext!, process.env.password!);
   *
   * // Get the record ciphertexts from a transaction and check ownership of them.
   * const transaction = await networkClient.getTransactionObject("at1fjy6s9md2v4rgcn3j3q4qndtfaa2zvg58a4uha0rujvrn4cumu9qfazxdd");
   * const records = transaction.records();
   *
   * // Check if the account owns any of the record ciphertexts present in the transaction.
   * const ownedRecords = [];
   * for (const record of records) {
   *    if (account.ownsRecordCiphertext(record)) {
   *      ownedRecords.push(record);
   *    }
   * }
   */
  ownsRecordCiphertext(ciphertext: RecordCiphertext | string): boolean {
    if (typeof ciphertext === "string") {
      try {
        const ciphertextObject = this._nitroAccount.recordCiphertextFromString(ciphertext);
        return ciphertextObject.isOwner(this._viewKey);
      } catch {
        return false;
      }
    } else {
      return ciphertext.isOwner(this._viewKey);
    }
  }

  /**
   * Signs a message with the account's private key.
   * Returns a Signature.
   *
   * @param {ArrayBuffer} message Message to be signed.
   * @returns {Signature} Signature over the message in bytes.
   *
   * @example
   * // Import the Account class
   * import { Account } from "@provablehq/shield-mobile-sdk";
   *
   * // Create a connection to the Aleo network and an account
   * const account = Account.fromCiphertext(process.env.ciphertext, process.env.password);
   *
   * // Create an account and a message to sign.
   * const account = new Account();
   * const message = Uint8Array.from([104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100])
   * const signature = account.sign(message);
   *
   * // Verify the signature.
   * assert(account.verify(message, signature));
   */
  sign(message: Uint8Array | ArrayBuffer): Signature {
    return this._privateKey.sign(toAB(message));
  }

  /**
   * Verifies the Signature on a message.
   *
   * @param {ArrayBuffer} message Message in bytes to be signed.
   * @param {Signature} signature Signature to be verified.
   * @returns {boolean} True if the signature is valid, false otherwise.
   *
   * @example
   * // Import the Account class
   * import { Account } from "@provablehq/shield-mobile-sdk";
   *
   * // Create a connection to the Aleo network and an account
   * const account = Account.fromCiphertext(process.env.ciphertext, process.env.password);
   *
   * // Sign a message.
   * const message = Uint8Array.from([104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100])
   * const signature = await account.sign(message);
   *
   * // Verify the signature.
   * assert(account.verify(message, signature));
   */
  verify(message: Uint8Array | ArrayBuffer, signature: Signature): boolean {
    return this._address.verify(message, signature);
  }

  // Static utility methods for creating various objects from strings

  /**
   * Creates a PrivateKey from a string representation.
   * @param {string} privateKeyString The private key string
   * @returns {PrivateKey} A PrivateKey instance
   *
   * @example
   * import { Account } from "@provablehq/shield-mobile-sdk";
   *
   * const privateKey = Account.privateKeyFromString("APrivateKey1zkp...");
   */
  static privateKeyFromString(privateKeyString: string): PrivateKey {
    const nitroAccount = getNitroClassNetworkAware<AccountNitro>("Account");
    return nitroAccount.privateKeyFromString(privateKeyString);
  }

  /**
   * Creates an Address from a string representation.
   * @param {string} addressString The address string
   * @returns {Address} An Address instance
   *
   * @example
   * import { Account } from "@provablehq/shield-mobile-sdk";
   *
   * const address = Account.addressFromString("aleo1...");
   */
  static addressFromString(addressString: string): Address {
    const nitroAccount = getNitroClassNetworkAware<AccountNitro>("Account");
    const nitroAddress = nitroAccount.addressFromString(addressString);
    return new Address(nitroAddress);
  }

  /**
   * Creates a ViewKey from a string representation.
   * @param {string} viewKeyString The view key string
   * @returns {ViewKey} A ViewKey instance
   *
   * @example
   * import { Account } from "@provablehq/shield-mobile-sdk";
   *
   * const viewKey = Account.viewKeyFromString("AViewKey1...");
   */
  static viewKeyFromString(viewKeyString: string): ViewKeyNitro {
    const nitroAccount = getNitroClassNetworkAware<AccountNitro>("Account");
    return nitroAccount.viewKeyFromString(viewKeyString);
  }

  /**
   * Creates a ComputeKey from a string representation.
   * @param {string} computeKeyString The compute key string
   * @returns {ComputeKey} A ComputeKey instance
   *
   * @example
   * import { Account } from "@provablehq/shield-mobile-sdk";
   *
   * const computeKey = Account.computeKeyFromString("AComputeKey1...");
   */
  static computeKeyFromString(computeKeyString: string): ComputeKey {
    const nitroAccount = getNitroClassNetworkAware<AccountNitro>("Account");
    return nitroAccount.computeKeyFromString(computeKeyString);
  }

  /**
   * Creates a Signature from a string representation.
   * @param {string} signatureString The signature string
   * @returns {Signature} A Signature instance
   *
   * @example
   * import { Account } from "@provablehq/shield-mobile-sdk";
   *
   * const signature = Account.signatureFromString("sign1...");
   */
  static signatureFromString(signatureString: string): Signature {
    const nitroAccount = getNitroClassNetworkAware<AccountNitro>("Account");
    return nitroAccount.signatureFromString(signatureString);
  }

  /**
   * Creates a RecordCiphertext from a string representation.
   * @param {string} ciphertextString The record ciphertext string
   * @returns {RecordCiphertext} A RecordCiphertext instance
   *
   * @example
   * import { Account } from "@provablehq/shield-mobile-sdk";
   *
   * const recordCiphertext = Account.recordCiphertextFromString("record1...");
   */
  static recordCiphertextFromString(ciphertextString: string): RecordCiphertext {
    const nitroAccount = getNitroClassNetworkAware<AccountNitro>("Account");
    return nitroAccount.recordCiphertextFromString(ciphertextString);
  }

  /**
   * Creates a RecordPlaintext from a string representation.
   * @param {string} plaintextString The record plaintext string
   * @returns {RecordPlaintext} A RecordPlaintext instance
   *
   * @example
   * import { Account } from "@provablehq/shield-mobile-sdk";
   *
   * const recordPlaintext = Account.recordPlaintextFromString("{ ... }");
   */
  static recordPlaintextFromString(plaintextString: string): RecordPlaintext {
    const nitroAccount = getNitroClassNetworkAware<AccountNitro>("Account");
    return nitroAccount.recordPlaintextFromString(plaintextString);
  }

  /**
   * Creates a Field from a string representation.
   * @param {string} fieldString The field string
   * @returns {Field} A Field instance
   *
   * @example
   * import { Account } from "@provablehq/shield-mobile-sdk";
   *
   * const field = Account.fieldFromString("1234567890field");
   */
  static fieldFromString(fieldString: string): Field {
    return Field.fromString(fieldString);
  }

  /**
   * Creates a Group from a string representation.
   * @param {string} groupString The group string
   * @returns {Group} A Group instance
   *
   * @example
   * import { Account } from "@provablehq/shield-mobile-sdk";
   *
   * const group = Account.groupFromString("1234567890group");
   */
  static groupFromString(groupString: string): Group {
    return Group.fromString(groupString);
  }

  /**
   * Creates a new random PrivateKey.
   * @returns {PrivateKey} A new randomly generated PrivateKey instance
   *
   * @example
   * import { Account } from "@provablehq/shield-mobile-sdk";
   *
   * const privateKey = Account.createPrivateKey();
   */
  static createPrivateKey(): PrivateKey {
    const nitroAccount = getNitroClassNetworkAware<AccountNitro>("Account");
    return nitroAccount.createPrivateKey();
  }

  /**
   * Get the underlying Nitro account object (internal use)
   * @returns {AccountNitro} The underlying Nitro account
   * @internal
   */
  _getNitroAccount(): AccountNitro {
    return this._nitroAccount;
  }
}
