import {
  Address,
  ComputeKey,
  EncryptionToolkit,
  Field,
  Group,
  PrivateKey,
  Transition,
  Signature,
  ViewKey,
  PrivateKeyCiphertext,
  RecordCiphertext,
  RecordPlaintext,
} from "./wasm.js";

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
 * import { Account } from "@provablehq/sdk/testnet.js";
 *
 * // Create a new account
 * const myRandomAccount = new Account();
 *
 * // Create an account from a randomly generated seed
 * const seed = new Uint8Array([94, 91, 52, 251, 240, 230, 226, 35, 117, 253, 224, 210, 175, 13, 205, 120, 155, 214, 7, 169, 66, 62, 206, 50, 188, 40, 29, 122, 40, 250, 54, 18]);
 * const mySeededAccount = new Account({seed: seed});
 *
 * // Create an account from an existing private key
 * const myExistingAccount = new Account({privateKey: process.env.privateKey});
 *
 * // Sign a message
 * const hello_world = Uint8Array.from([104, 101, 108, 108, 111 119, 111, 114, 108, 100]);
 * const signature = myRandomAccount.sign(hello_world);
 *
 * // Verify a signature
 * assert(myRandomAccount.verify(hello_world, signature));
 */
export class Account {
  _privateKey: PrivateKey;
  _viewKey: ViewKey;
  _computeKey: ComputeKey;
  _address: Address;

  constructor(params: AccountParam = {}) {
    try {
      this._privateKey = this.privateKeyFromParams(params);
    } catch (e) {
      console.error("Wrong parameter", e);
      throw new Error("Wrong Parameter");
    }
    this._viewKey = ViewKey.from_private_key(this._privateKey);
    this._computeKey = ComputeKey.from_private_key(this._privateKey);
    this._address = Address.from_private_key(this._privateKey);
  }

  /**
   * Attempts to create an account from a private key ciphertext
   * @param {PrivateKeyCiphertext | string} ciphertext The encrypted private key ciphertext or its string representation
   * @param {string} password The password used to decrypt the private key ciphertext
   * @returns {Account} A new Account instance created from the decrypted private key
   *
   * @example
   * import { Account } from "@provablehq/sdk/testnet.js";
   *
   * // Create an account object from a previously encrypted ciphertext and password.
   * const account = Account.fromCiphertext(process.env.ciphertext, process.env.password);
   */
  public static fromCiphertext(ciphertext: PrivateKeyCiphertext | string, password: string): Account {
    try {
      ciphertext = (typeof ciphertext === "string") ? PrivateKeyCiphertext.fromString(ciphertext) : ciphertext;
      const _privateKey = PrivateKey.fromPrivateKeyCiphertext(ciphertext, password);
      return new Account({ privateKey: _privateKey.to_string() });
    } catch(e) {
      throw new Error("Wrong password or invalid ciphertext");
    }
  }

  /**
   * Creates a PrivateKey from the provided parameters.
   * @param {AccountParam} params The parameters containing either a private key string or a seed
   * @returns {PrivateKey} A PrivateKey instance derived from the provided parameters
   */
  private privateKeyFromParams(params: AccountParam): PrivateKey {
    if (params.seed) {
      return PrivateKey.from_seed_unchecked(params.seed);
    }
    if (params.privateKey) {
      return PrivateKey.from_string(params.privateKey);
    }
    return new PrivateKey();
  }

  /**
   * Returns the PrivateKey associated with the account.
   * @returns {PrivateKey} The private key of the account
   *
   * @example
   * import { Account } from "@provablehq/sdk/testnet.js";
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
   * import { Account } from "@provablehq/sdk/testnet.js";
   *
   * const account = new Account();
   * const viewKey = account.viewKey();
   */
  viewKey(): ViewKey {
    return this._viewKey;
  }

  /**
   * Returns the ComputeKey associated with the account.
   * @returns {ComputeKey} The compute key of the account
   *
   * @example
   * import { Account } from "@provablehq/sdk/testnet.js";
   *
   * const account = new Account();
   * const computeKey = account.computeKey();
   */
  computeKey(): ComputeKey {
    return this._computeKey;
  }

  /**
   * Returns the Aleo address associated with the account.
   * @returns {Address} The public address of the account
   *
   * @example
   * import { Account } from "@provablehq/sdk/testnet.js";
   *
   * const account = new Account();
   * const address = account.address();
   */
  address(): Address {
    return this._address;
  }

  /**
   * Deep clones the Account.
   * @returns {Account} A new Account instance with the same private key
   *
   * @example
   * import { Account } from "@provablehq/sdk/testnet.js";
   *
   * const account = new Account();
   * const clonedAccount = account.clone();
   */
  clone(): Account {
    return new Account({ privateKey: this._privateKey.to_string() });
  }

  /**
   * Returns the address of the account in a string representation.
   *
   * @returns {string} The string representation of the account address
   */
  toString(): string {
    return this.address().to_string()
  }

  /**
   * Encrypts the account's private key with a password.
   *
   * @param {string} password Password to encrypt the private key.
   * @returns {PrivateKeyCiphertext} The encrypted private key ciphertext
   *
   * @example
   * import { Account } from "@provablehq/sdk/testnet.js";
   *
   * const account = new Account();
   * const ciphertext = account.encryptAccount("password");
   * process.env.ciphertext = ciphertext.toString();
   */
  encryptAccount(password: string): PrivateKeyCiphertext {
    return this._privateKey.toCiphertext(password);
  }

  /**
   * Decrypts an encrypted record string into a plaintext record object.
   *
   * @param {string} ciphertext A string representing the ciphertext of a record.
   * @returns {RecordPlaintext} The decrypted record plaintext
   *
   * @example
   * // Import the AleoNetworkClient and Account classes
   * import { AleoNetworkClient, Account } from "@provablehq/sdk/testnet.js";
   *
   * // Create a connection to the Aleo network and an account
   * const networkClient = new AleoNetworkClient({ host: "https://api.explorer.provable.com/v1" });
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
   * import { AleoNetworkClient, Account } from "@provablehq/sdk/testnet.js";
   *
   * // Create a connection to the Aleo network and an account
   * const networkClient = new AleoNetworkClient({ host: "https://api.explorer.provable.com/v1" });
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
   * import { Account } from "@provablehq/sdk/testnet.js";
   * 
   * // Create an account object from a previously encrypted ciphertext and password.
   * const account = Account.fromCiphertext(process.env.ciphertext!, process.env.password!);
   * 
   * // Generate a record view key from the account's view key and a record ciphertext
   * const recordCiphertext = RecordCiphertext.fromString("your_record_ciphertext_here");
   * const recordViewKey = account.generateRecordViewKey(recordCiphertext);
   */
  generateRecordViewKey(recordCiphertext: RecordCiphertext | string): Field {
    if (typeof recordCiphertext === 'string') {
      recordCiphertext = RecordCiphertext.fromString(recordCiphertext);
    }
    if (!(recordCiphertext.isOwner(this._viewKey))) {
      throw new Error("The record ciphertext does not belong to this account");
    }
    return EncryptionToolkit.generateRecordViewKey(this._viewKey, recordCiphertext);
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
   * import { Account } from "@provablehq/sdk/testnet.js";
   * 
   * // Generate a transition view key from the account's view key and a transition public key
   * const tpk = Group.fromString("your_transition_public_key_here");
   * 
   * const transitionViewKey = account.generateTransitionViewKey(tpk);
   */
  generateTransitionViewKey(tpk: string | Group): Field {
    if (typeof tpk === 'string') {
      tpk = Group.fromString(tpk);
    }
    return EncryptionToolkit.generateTvk(this._viewKey, tpk);
  }

  /**
   * Determines whether the account owns a ciphertext record.
   * @param {RecordCiphertext | string} ciphertext The record ciphertext to check ownership of
   * @returns {boolean} True if the account owns the record, false otherwise
   *
   * @example
   * // Import the AleoNetworkClient and Account classes
   * import { AleoNetworkClient, Account } from "@provablehq/sdk/testnet.js";
   *
   * // Create a connection to the Aleo network and an account
   * const networkClient = new AleoNetworkClient({ host: "https://api.explorer.provable.com/v1" });
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
    if (typeof ciphertext === 'string') {
      try {
        const ciphertextObject = RecordCiphertext.fromString(ciphertext);
        return ciphertextObject.isOwner(this._viewKey);
      }
      catch (e) {
        return false;
      }
    }
    else {
      return ciphertext.isOwner(this._viewKey);
    }
  }

  /**
   * Signs a message with the account's private key.
   * Returns a Signature.
   *
   * @param {Uint8Array} message Message to be signed.
   * @returns {Signature} Signature over the message in bytes.
   *
   * @example
   * // Import the Account class
   * import { Account } from "@provablehq/sdk/testnet.js";
   *
   * // Create a connection to the Aleo network and an account
   * const account = Account.fromCiphertext(process.env.ciphertext, process.env.password);
   *
   * // Create an account and a message to sign.
   * const account = new Account();
   * const message = Uint8Array.from([104, 101, 108, 108, 111 119, 111, 114, 108, 100])
   * const signature = account.sign(message);
   *
   * // Verify the signature.
   * assert(account.verify(message, signature));
   */
  sign(message: Uint8Array): Signature {
    return this._privateKey.sign(message);
  }

  /**
   * Verifies the Signature on a message.
   *
   * @param {Uint8Array} message Message in bytes to be signed.
   * @param {Signature} signature Signature to be verified.
   * @returns {boolean} True if the signature is valid, false otherwise.
   *
   * @example
   * // Import the Account class
   * import { Account } from "@provablehq/sdk/testnet.js";
   *
   * // Create a connection to the Aleo network and an account
   * const account = Account.fromCiphertext(process.env.ciphertext, process.env.password);
   *
   * // Sign a message.
   * const message = Uint8Array.from([104, 101, 108, 108, 111 119, 111, 114, 108, 100])
   * const signature = account.sign(message);
   *
   * // Verify the signature.
   * assert(account.verify(message, signature));
   */
  verify(message: Uint8Array, signature: Signature): boolean {
    return this._address.verify(message, signature);
  }
}
