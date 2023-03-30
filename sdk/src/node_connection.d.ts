import { Account } from "./account";
import { Block } from "./models/block";
import { Transaction } from "./models/transaction";
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
export declare class NodeConnection {
    host: string;
    account: Account | undefined;
    constructor(host: string);
    /**
     * Set an account
     *
     * @param {Account} account
     * @example
     * let account = new Account();
     * connection.setAccount(account);
     */
    setAccount(account: Account): void;
    /**
     * Return the Aleo account used in the node connection
     *
     * @example
     * let account = connection.getAccount();
     */
    getAccount(): Account | undefined;
    fetchData<Type>(url?: string, method?: string, body?: string, headers?: Record<string, string>): Promise<Type>;
    /**
     * Returns the block contents of the block at the specified block height
     *
     * @param {number} height
     * @example
     * let block = connection.getBlock(1234);
     */
    getBlock(height: number): Promise<Block | Error>;
    /**
     * Returns a range of blocks between the specified block heights
     *
     * @param {number} start
     * @param {number} end
     * @example
     * let blockRange = connection.getBlockRange(2050, 2100);
     */
    getBlockRange(start: number, end: number): Promise<Array<Block> | Error>;
    /**
     * Returns the source code of a program
     *
     * @param {string} programId
     * @example
     * let program = connection.getProgram("foo.aleo");
     */
    getProgram(programId: string): Promise<string | Error>;
    /**
     * Returns the block contents of the latest block
     *
     * @example
     * let latestHeight = connection.getLatestBlock();
     */
    getLatestBlock(): Promise<Block | Error>;
    /**
     * Returns the hash of the last published block
     *
     * @example
     * let latestHash = connection.getLatestHash();
     */
    getLatestHash(): Promise<string | Error>;
    /**
     * Returns the latest block height
     *
     * @example
     * let latestHeight = connection.getLatestHeight();
     */
    getLatestHeight(): Promise<number | Error>;
    /**
     * Returns the latest state/merkle root of the Aleo blockchain
     *
     * @example
     * let stateRoot = connection.getStateRoot();
     */
    getStateRoot(): Promise<string | Error>;
    /**
     * Returns a transaction by its unique identifier
     *
     * @param {string} id
     * @example
     * let transaction = connection.getTransaction("at1handz9xjrqeynjrr0xay4pcsgtnczdksz3e584vfsgaz0dh0lyxq43a4wj");
     */
    getTransaction(id: string): Promise<Transaction | Error>;
    /**
     * Returns the transactions present at the specified block height
     *
     * @param {number} height
     * @example
     * let transactions = connection.getTransactions(654);
     */
    getTransactions(height: number): Promise<Array<Transaction> | Error>;
    /**
     * Returns the transactions in the memory pool.
     *
     * @example
     * let transactions = connection.getTransactionsInMempool();
     */
    getTransactionsInMempool(): Promise<Array<Transaction> | Error>;
}
export default NodeConnection;
