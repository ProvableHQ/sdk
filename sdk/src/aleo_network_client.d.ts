import { Account, Block, Transaction, Transition } from ".";
import { RecordPlaintext } from "@aleohq/wasm";
/**
 * Connection management class that encapsulates REST calls to publicly exposed endpoints of Aleo nodes.
 * The methods provided in this class provide information on the Aleo Blockchain
 *
 * @param {string} host
 * @example
 * // Connection to a local node
 * let local_connection = new AleoNetworkClient("http://localhost:3030");
 *
 * // Connection to a public beacon node
 * let public_connection = new AleoNetworkClient("https://vm.aleo.org/api");
 */
export declare class AleoNetworkClient {
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
    fetchData<Type>(url?: string): Promise<Type>;
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
    /**
     * Returns the transition id by its unique identifier
     *
     * @example
     * let transition = connection.getTransitionId("2429232855236830926144356377868449890830704336664550203176918782554219952323field");
     */
    getTransitionId(transition_id: string): Promise<Transition | Error>;
    /**
     * Attempts to find unspent records in the Aleo blockchain for a specified private key
     *
     * @example
     * // Find all unspent records
     * const private_key = "[PRIVATE_KEY]";
     * let records = connection.findUnspentRecords(0, undefined, private_key);
     *
     * // Find specific amounts
     * const start_height = 500000;
     * const amounts = [600000, 1000000];
     * let records = connection.findUnspentRecords(start_height, undefined, private_key, amounts);
     *
     * // Find specific amounts with a maximum number of cumulative gates
     * const max_gates = 100000;
     * let records = connection.findUnspentRecords(start_height, undefined, private_key, undefined, max_gates);
     */
    findUnspentRecords(start_height: number, end_height: number | undefined, private_key: string | undefined, amounts: number[] | undefined, max_gates: number | undefined): Promise<Array<RecordPlaintext> | Error>;
}
