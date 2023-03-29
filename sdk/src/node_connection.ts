import axios from "axios";
import { Account, Block, Transaction } from ".";

/**
 * Connection management class that encapsulates REST calls to publicly exposed endpoints of Aleo nodes.
 * The methods provided in this class provide information on the Aleo Blockchain
 *
 * @param {string} host
 * @example
 * // Connection to a local node
 * let local_connection = new NodeConnection("http://localhost:3030");
 *
 * // Connection to a public beacon node
 * let public_connection = new NodeConnection("https://vm.aleo.org/api");
 */
export class AleoNetworkClient {
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
  ): Promise<Type> {
     try {
       const response = await axios.get<Type>(this.host + url);
       return response.data;
     } catch (error) {
       throw new Error("Error fetching data.");
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
      const block = await this.fetchData<Block>("/block/" + height);
      return block;
    } catch (error) {
      throw new Error("Error fetching block.");
    }
  }

  /**
   * Returns a range of blocks between the specified block heights
   *
   * @param {number} start
   * @param {number} end
   * @example
   * let blockRange = connection.getBlockRange(2050, 2100);
   */
  async getBlockRange(start: number, end: number): Promise<Array<Block> | Error> {
    try {
      return await this.fetchData<Array<Block>>("/blocks?start=" + start + "&end=" + end);
    } catch (error) {
      const errorMessage = "Error fetching blocks between " + start + " and " + end + "."
      throw new Error(errorMessage);
    }
  }

  /**
   * Returns the source code of a program
   *
   * @param {string} programId
   * @example
   * let program = connection.getProgram("foo.aleo");
   */
  async getProgram(programId: string): Promise<string | Error> {
    try {
      return await this.fetchData<string>("/program/" + programId)
    } catch (error) {
      throw new Error("Error fetching program");
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
      throw new Error("Error fetching latest block.");
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
      throw new Error("Error fetching latest hash.");
    }
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
      throw new Error("Error fetching latest height.");
    }
  }

  /**
   * Returns the latest state/merkle root of the Aleo blockchain
   *
   * @example
   * let stateRoot = connection.getStateRoot();
   */
  async getStateRoot(): Promise<string | Error> {
    try {
      return await this.fetchData<string>("/latest/stateRoot");
    } catch (error) {
      throw new Error("Error fetching Aleo state root");
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
      throw new Error("Error fetching transaction.");
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
      return await this.fetchData<Array<Transaction>>("/block/" + height.toString() + "/transactions");
    } catch (error) {
      throw new Error("Error fetching transactions.");
    }
  }

  /**
   * Returns the transactions in the memory pool.
   *
   * @example
   * let transactions = connection.getTransactionsInMempool();
   */
  async getTransactionsInMempool(): Promise<Array<Transaction> | Error> {
    try {
      return await this.fetchData<Array<Transaction>>("/memoryPool/transactions");
    } catch (error) {
      throw new Error("Error fetching transactions from mempool.");
    }
  }
}

export default AleoNetworkClient;
