import fetch from "unfetch";
import { Account } from "./account";
import { Block } from "./models/block";
import { Transaction} from "./models/transaction";

type Ciphertext = string;

/**
 * Connection management class that encapsulates REST calls to publicly exposed endpoints of Aleo nodes.
 * The methods provided in this class provide information on the Aleo Blockchain
 *
 * @param {string} host
 * @example
 * // Connection to a local node
 * let local_connection = new NodeConnection("localhost:4130");
 *
 * // Connection to a public beacon node
 * let public_connection = new NodeConnection("vm.aleo.org/api");
 */
export class NodeConnection {
  host: string;
  account: Account | undefined;

  constructor(host: string) {
    this.host = host + "/testnet3";
  }

  /**
   * Set an account
   *
   * @param {Account} account
   * @example
   * let account = new Account();
   * connection.setAccount(account);
   */
  setAccount(account: Account) {
    this.account = account;
  }

  /**
   * Return the Aleo account used in the node connection
   *
   * @example
   * let account = connection.getAccount();
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
   * Returns the latest block height
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
   * Returns the hash of the last published block
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
   * Returns the block contents of the latest block
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
   * Returns the transactions present at the specified block height
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
   * Returns a transaction by its unique identifier
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
   * Returns the block contents of the block at the specified block height
   *
   * @param {number} height
   * @example
   * let block = connection.getBlock(1234);
   */
  async getBlock(height: number): Promise<Block | Error> {
    try {
      return await this.fetchData<Block>("/block/" + height);
    } catch (error) {
      console.log("Error - response: ", error);
      throw new Error("Error fetching block.");
    }
  }
}

export default NodeConnection;
