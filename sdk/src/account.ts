import { Address, PrivateKey, Signature, ViewKey } from "aleo-wasm";

interface AccountParam {
  privateKey?: string;
  seed?: Uint8Array;
}
/**
 * Class that represents an Aleo Account with a PrivateKey, from which an Address and a ViewKey derive.
 * Can be created with an existing private key, a seed or simply be randomly generated.
 * A seed consists of 32 bytes.
 * @example
 * let myRandomAccount = new Account();
 * let seed = 'ce8b23470222bdee5f894ee77b607391';
 * let arr = Uint8Array.from(seed)
 * let mySeededAccount = new Account({seed: 'ce8b23470222bdee5f894ee77b607391'});
 * let myExistingAccount = new Account({privateKey: 'myExistingPrivateKey'})
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

  /**
   * Decrypts a Record given a ciphertext.
   * @param {string} ciphertext
   * @returns {Record}
   *
   * @example
   * let account = new Account();
   * let record = account.decryptRecord("record1...");
   */
  decryptRecord(ciphertext: string) {
    return this.vk.decrypt(ciphertext);
  }

  /**
   * Decrypts a set of Records given an array of ciphertexts.
   * @param {string[]} ciphertexts
   * @returns {Record[]}
   *
   * @example
   * let account = new Account();
   * let record = account.decryptRecords(["record1...", "record2..."]);
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
   * account.sign("a message");
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
   * let message = "a message";
   * let signature = account.sign(message);
   * account.verify(message, signature);
   */
  verify(message: Uint8Array, signature: Signature) {
    return this.adr.verify(message, signature);
  }
}
