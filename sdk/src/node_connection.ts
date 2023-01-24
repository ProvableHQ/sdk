import fetch from "unfetch";
import { Account } from "./account";
import { Block } from "./models/block";
import { Transaction} from "./models/transaction";

type Ciphertext = string;

/**
 * Class that represents an Aleo Node Connection and allows us to communicate with the node.
 *
 * @param {string} host
 * @example
 * let connection = new NodeConnection("localhost:4130");
 */
export class NodeConnection {
  host: string;
  account: Account | undefined;

  constructor(host: string) {
    this.host = host + "/testnet3";
  }

  /**
   * Set an account inside the conecction
   *
   * @param {Account} account
   * @example
   * let account = new Account();
   * connection.setAccount(account);
   */
  setAccount(account: Account) {
    this.account = account;
  }

  async useFetchData(
    url = "/",
    method = "GET",
    body = "",
    headers: Record<string, string> = { "Content-Type": "application/json" }
  ) {
    const response = await fetch(this.host + url, {
      method: method,
      body: JSON.stringify(body),
      headers: headers,
    });
    try {
      return await response.json();
    } catch (error) {
      return error;
    }
  }

  /**
   * Returns the information of the settled account
   *
   * @example
   * let account = connection.getAccount(account);
   */
   getAccount(): Account | undefined {
    return this.account;
  }

  async fetchData<Type>(
    url = "/",
    method = "GET",
    body = "",
    headers: Record<string, string> = { "Content-Type": "application/json" }
  ): Promise<Type> {
      const response = await fetch(this.host + url, {
        method: method,
        body: JSON.stringify(body),
        headers: headers,
      });
      try {
        if (!response.ok) { throw response }
        return (await response.json()) as Type;
      } catch (error) { throw error; }
  }

  /**
   * Returns all of the ciphertexts for the setted account
   *
   * @example
   * let cyphertexts = connection.getAllCiphertexts();
   */
  async getAllCiphertexts(): Promise<Array<Ciphertext>> {
    try {
      return await this.fetchData<Array<Ciphertext>>(
        "/ciphertexts/all",
        "POST",
        this.account?.viewKey().to_string()
      );
    } catch (error) {
      console.log("Error - response: ", error);
      throw new Error("Error fetching all ciphertexts.");
    }
  }

  /**
   * Returns the unspent ciphertexts for the setted account
   *
   * @example
   * let cyphertexts = connection.getUnspentCiphertexts();
   */
  async getUnspentCiphertexts(): Promise<Array<Ciphertext>> {
    try {
      return await this.fetchData<Array<Ciphertext>>(
        "/ciphertexts/unspent",
        "POST",
        this.account?.viewKey().to_string()
      );
    } catch (error) {
      console.log("Error - response: ", error);
      throw new Error("Error fetching unspent ciphertexts.");
    }
  }

  /**
   * Returns the spent ciphertexts for the setted account
   *
   * @example
   * let cyphertexts = connection.getSpentCiphertexts();
   */
  async getSpentCiphertexts(): Promise<Array<Ciphertext> | Error> {
    try {
      return await this.fetchData<Array<Ciphertext>>(
        "/ciphertexts/spent",
        "POST",
        this.account?.viewKey().to_string()
      );
    } catch (error) {
      console.log("Error - response: ", error);
      throw new Error("Error fetching spent ciphertexts.");
    }
  }

  /**
   * Returns the latest height of the blockchain
   *
   * @example
   * let latestHeight = connection.getLatestHeight();
   */
  async getLatestHeight(): Promise<number | Error> {
    try {
      return await this.fetchData<number>("/latest/height");
    } catch (error) {
      console.log("Error - response: ", error);
      throw new Error("Error fetching latest height.");
    }
  }

  /**
   * Returns the latest hash of the blockchain
   *
   * @example
   * let latestHash = connection.getLatestHash();
   */
  async getLatestHash(): Promise<string | Error> {
    try {
      return await this.fetchData<string>("/latest/hash");
    } catch (error) {
      console.log("Error - response: ", error);
      throw new Error("Error fetching latest hash.");
    }
  }

  /**
   * Returns the latest block of the blockchain
   *
   * @example
   * let latestHeight = connection.getLatestBlock();
   */
  async getLatestBlock(): Promise<Block | Error> {
    try {
      return await this.fetchData<Block>("/latest/block") as Block;
    } catch (error) {
      console.log("Error - response: ", error);
      throw new Error("Error fetching latest block.");
    }
  }

  /**
   * Returns the transactions by block
   *
   * @param {number} height
   * @example
   * let transactions = connection.getTransactions(654);
   */
  async getTransactions(height: number): Promise<Array<Transaction> | Error> {
    try {
      return await this.fetchData<Array<Transaction>>("/transactions/" + height);
    } catch (error) {
      console.log("Error - response: ", error);
      throw new Error("Error fetching transactions.");
    }
  }

  /**
   * Returns a transaction by id
   *
   * @param {string} id
   * @example
   * let transaction = connection.getTransaction("at1handz9xjrqeynjrr0xay4pcsgtnczdksz3e584vfsgaz0dh0lyxq43a4wj");
   */
  async getTransaction(id: string): Promise<Transaction | Error> {
    try {
      return await this.fetchData<Transaction>("/transaction/" + id);
    } catch (error) {
      console.log("Error - response: ", error);
      throw new Error("Error fetching transaction.");
    }
  }

  /**
   * Returns a transaction by block number
   *
   * @param {number} id
   * @example
   * let block = connection.getBlock(1234);
   */
  async getBlock(id: number): Promise<Block | Error> {
    try {
      return await this.fetchData<Block>("/block/" + id);
    } catch (error) {
      console.log("Error - response: ", error);
      throw new Error("Error fetching block.");
    }
  }

  /**
   * Returns the total balance of the account associated with the connection
   *
   * @example
   * let balance = connection.getAccountBalance(); // 100
   */
  async getAccountBalance() {
    const ciphertexts = await this.getUnspentCiphertexts()
    try {
      const balance = this.account
          ?.decryptRecords(ciphertexts)
          .map((record) => +record.gates().split("u64")[0])
          .reduce((sum, current) => sum + current,0)
      return balance;
    } catch (error) {
      console.log("Error - response: ", error);
      throw new Error("Error fetching block.");
    }

  }
}

export default NodeConnection;
