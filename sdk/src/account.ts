import {
  Address,
  PrivateKey,
  Signature,
  ViewKey,
  PrivateKeyCiphertext,
  RecordCiphertext,
} from "@aleohq/wasm";

interface AccountParam {
  privateKey?: string;
  seed?: Uint8Array;
}

/**
 * Key Management class. Enables the creation of a new Aleo Account, importation of an existing account from
 * an existing private key or seed, and message signing and verification functionality.
 *
 * An Aleo Account is generated from a randomly generated seed (number) from which an account private key, view key,
 * and a public account address are derived. The private key lies at the root of an Aleo account. It is a highly
 * sensitive secret and should be protected as it allows for creation of Aleo Program executions and arbitrary value
 * transfers. The View Key allows for decryption of a user's activity on the blockchain. The Address is the public
 * address to which other users of Aleo can send Aleo credits and other records to. This class should only be used
 * environments where the safety of the underlying key material can be assured.
 *
 * @example
 * // Create a new account
 * let myRandomAccount = new Account();
 *
 * // Create an account from a randomly generated seed
 * let seed = new Uint8Array([94, 91, 52, 251, 240, 230, 226, 35, 117, 253, 224, 210, 175, 13, 205, 120, 155, 214, 7, 169, 66, 62, 206, 50, 188, 40, 29, 122, 40, 250, 54, 18]);
 * let mySeededAccount = new Account({seed: seed});
 *
 * // Create an account from an existing private key
 * let myExistingAccount = new Account({privateKey: 'myExistingPrivateKey'})
 *
 * // Sign a message
 * let hello_world = Uint8Array.from([104, 101, 108, 108, 111 119, 111, 114, 108, 100])
 * let signature = myRandomAccount.sign(hello_world)
 *
 * // Verify a signature
 * myRandomAccount.verify(hello_world, signature)
 */
export class Account {
  _privateKey: PrivateKey;
  _viewKey: ViewKey;
  _address: Address;

  constructor(params: AccountParam = {}) {
    try {
      this._privateKey = this.privateKeyFromParams(params);
    } catch (e) {
      console.error("Wrong parameter", e);
      throw new Error("Wrong Parameter");
    }
    this._viewKey = ViewKey.from_private_key(this._privateKey);
    this._address = Address.from_private_key(this._privateKey);
  }

  /**
   * Attempts to create an account from a private key ciphertext
   * @param {PrivateKeyCiphertext | string} ciphertext
   * @param {string} password
   * @returns {PrivateKey | Error}
   *
   * @example
   * let ciphertext = PrivateKey.newEncrypted("password");
   * let account = Account.fromCiphertext(ciphertext, "password");
   */
  public static fromCiphertext(ciphertext: PrivateKeyCiphertext | string, password: string) {
    try {
      ciphertext = (typeof ciphertext === "string") ? PrivateKeyCiphertext.fromString(ciphertext) : ciphertext;
      const _privateKey = PrivateKey.fromPrivateKeyCiphertext(ciphertext, password);
      return new Account({ privateKey: _privateKey.to_string() });
    } catch(e) {
      throw new Error("Wrong password or invalid ciphertext");
    }
  }

  private privateKeyFromParams(params: AccountParam) {
    if (params.seed) {
      return PrivateKey.from_seed_unchecked(params.seed);
    }
    if (params.privateKey) {
      return PrivateKey.from_string(params.privateKey);
    }
    return new PrivateKey();
  }

  privateKey() {
    return this._privateKey;
  }

  viewKey() {
    return this._viewKey;
  }

  address() {
    return this._address;
  }

  toString() {
    return this.address().to_string()
  }

  /**
   * Encrypt the account's private key with a password
   * @param {string} ciphertext
   * @returns {PrivateKeyCiphertext}
   *
   * @example
   * let account = new Account();
   * let ciphertext = account.encryptAccount("password");
   */
  encryptAccount(password: string) {
    return this._privateKey.toCiphertext(password);
  }

  /**
   * Decrypts a Record in ciphertext form into plaintext
   * @param {string} ciphertext
   * @returns {Record}
   *
   * @example
   * let account = new Account();
   * let record = account.decryptRecord("record1ciphertext");
   */
  decryptRecord(ciphertext: string) {
    return this._viewKey.decrypt(ciphertext);
  }

  /**
   * Decrypts an array of Records in ciphertext form into plaintext
   * @param {string[]} ciphertexts
   * @returns {Record[]}
   *
   * @example
   * let account = new Account();
   * let record = account.decryptRecords(["record1ciphertext", "record2ciphertext"]);
   */
  decryptRecords(ciphertexts: string[]) {
    return ciphertexts.map((ciphertext) => this._viewKey.decrypt(ciphertext));
  }

  /**
   * Determines whether the account owns a ciphertext record
   * @param {RecordCipherText | string} ciphertext
   * @returns {boolean}
   *
   * @example
   * // Create a connection to the Aleo network and an account
   * let connection = new NodeConnection("vm.aleo.org/api");
   * let account = Account.fromCiphertext("ciphertext", "password");
   *
   * // Get a record from the network
   * let record = connection.getBlock(1234);
   * let recordCipherText = record.transactions[0].execution.transitions[0].id;
   *
   * // Check if the account owns the record
   * if account.ownsRecord(recordCipherText) {
   *     // Then one can do something like:
   *     // Decrypt the record and check if it's spent
   *     // Store the record in a local database
   *     // Etc.
   * }
   */
  ownsRecordCiphertext(ciphertext: RecordCiphertext | string) {
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
   * @param {Uint8Array} message
   * @returns {Signature}
   *
   * @example
   * let account = new Account();
   * let message = Uint8Array.from([104, 101, 108, 108, 111 119, 111, 114, 108, 100])
   * account.sign(message);
   */
  sign(message: Uint8Array) {
    return this._privateKey.sign(message);
  }

  /**
   * Verifies the Signature on a message.
   *
   * @param {Uint8Array} message
   * @param {Signature} signature
   * @returns {boolean}
   *
   * @example
   * let account = new Account();
   * let message = Uint8Array.from([104, 101, 108, 108, 111 119, 111, 114, 108, 100])
   * let signature = account.sign(message);
   * account.verify(message, signature);
   */
  verify(message: Uint8Array, signature: Signature) {
    return this._address.verify(message, signature);
  }
}
