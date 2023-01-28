import { Address, PrivateKey, Signature, ViewKey } from "@aleohq/wasm";

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
 * let seed = 'ce8b23470222bdee5f894ee77b607391';
 * let arr = Uint8Array.from(seed)
 * let mySeededAccount = new Account({seed: 'ce8b23470222bdee5f894ee77b607391'});
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
  pk: PrivateKey;
  vk: ViewKey;
  adr: Address;

  constructor(params: AccountParam = {}) {
    try {
      this.pk = this.privateKeyFromParams(params);
    } catch (e) {
      console.error("Wrong parameter", e);
      throw new Error("Wrong Parameter");
    }
    this.vk = ViewKey.from_private_key(this.pk);
    this.adr = Address.from_private_key(this.pk);
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
    return this.pk;
  }

  viewKey() {
    return this.vk;
  }

  address() {
    return this.adr;
  }

  toString() {
    return this.address().to_string()
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
    return this.vk.decrypt(ciphertext);
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
    return ciphertexts.map((ciphertext) => this.vk.decrypt(ciphertext));
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
    return this.pk.sign(message);
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
    return this.adr.verify(message, signature);
  }
}
