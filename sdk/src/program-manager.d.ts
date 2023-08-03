import { ProgramManager as WasmProgramManager } from '@aleohq/wasm';
import { Account, AleoNetworkClient, ExecutionResponse, FunctionKeyProvider, RecordPlaintext, PrivateKey, Program, ProvingKey, VerifyingKey } from ".";
import { RecordProvider } from "./record-provider";
declare class ProgramManager extends WasmProgramManager {
    account: Account | undefined;
    keyProvider: FunctionKeyProvider;
    host: string;
    networkClient: AleoNetworkClient;
    recordProvider: RecordProvider | undefined;
    constructor(host: string | undefined, keyProvider: FunctionKeyProvider | undefined, recordProvider: RecordProvider | undefined);
    /**
     * Set the account to use for transaction submission to the Aleo network
     *
     * @param account {Account} Account to use for transaction submission
     */
    setAccount(account: Account): void;
    /**
     * Set the key provider that provides the proving and verifying keys for programs
     *
     * @param keyProvider {FunctionKeyProvider}
     */
    setKeyProvider(keyProvider: FunctionKeyProvider): void;
    /**
     * Set the host peer to use for transaction submission to the Aleo network
     *
     * @param host {string} Peer url to use for transaction submission
     */
    setHost(host: string): void;
    /**
     * Set the record provider that provides records for transactions
     *
     * @param recordProvider {RecordProvider}
     */
    setRecordProvider(recordProvider: RecordProvider): void;
    /**
     * Initialize the program manager. This step is NECESSARY before any other methods can be called.
     *
     * @param threads {number | undefined} Number of threads to use for the thread pool. If undefined, defaults to 8.
     */
    initialize(threads: number | undefined): Promise<void>;
    /**
     * Deploy an Aleo program to the Aleo network
     *
     * @param program {string} Program source code
     * @param fee {number} Fee to pay for the transaction
     * @param cache {boolean} Whether to cache the program in memory
     * @param feeRecord {string | RecordPlaintext} Fee record to use for the transaction
     * @param privateKey {PrivateKey | undefined} Optional private key to use for the transaction
     * @returns {string | Error} The transaction id of the deployed program or a failure message from the network
     *
     * @example
     * // Create a new NetworkClient, KeyProvider, and RecordProvider
     * const networkClient = new AleoNetworkClient("https://vm.aleo.org/api");
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for deployments
     * const program = "program hello_hello.aleo;\n\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n";
     * const programManager = new ProgramManager(networkClient, keyProvider, recordProvider);
     * const tx_id = await programManager.deploy(program, fee, feeRecord)
     * const transaction = await programManager.networkClient.getTransaction(tx_id);
     */
    deploy(program: string, fee: number, feeRecord: string | RecordPlaintext, privateKey?: PrivateKey): Promise<string | Error>;
    /**
     * Execute an Aleo program on the Aleo network
     *
     * @param program {string} Program source code containing the function to be executed
     * @param function_name {string} Function name to execute
     * @param fee {number} Fee to pay for the transaction
     * @param inputs {string[]} Inputs to the function
     * @param feeRecord {string | RecordPlaintext} Fee record to use for the transaction
     * @param privateKey {PrivateKey | undefined} Optional private key to use for the transaction
     * @param provingKey {ProvingKey | undefined} Optional proving key to use for the transaction
     * @param verifyingKey {VerifyingKey | undefined} Optional verifying key to use for the transaction
     * @returns {Promise<string | Error>}
     *
     * @example
     * // Create a new NetworkClient, KeyProvider, and RecordProvider
     * const networkClient = new AleoNetworkClient("https://vm.aleo.org/api");
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for executions
     * const program = "program hello_hello.aleo;\n\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n";
     * const programManager = new ProgramManager(networkClient, keyProvider, recordProvider);
     * const tx_id = await programManager.execute(program, "hello_hello", 0.020, ["5u32", "5u32"])
     * const transaction = await programManager.networkClient.getTransaction(tx_id);
     */
    execute(program: string, function_name: string, fee: number, inputs: string[], feeRecord?: string | RecordPlaintext, privateKey?: PrivateKey, provingKey?: ProvingKey, verifyingKey?: VerifyingKey): Promise<string | Error>;
    /**
     * Execute an Aleo program in offline mode
     *
     * @param program {string} Program source code containing the function to be executed
     * @param function_name {string} Function name to execute
     * @param inputs {string[]} Inputs to the function
     * @param privateKey {PrivateKey | undefined} Optional private key to use for the transaction
     * @param provingKey {ProvingKey | undefined} Optional proving key to use for the transaction
     * @param verifyingKey {VerifyingKey | undefined} Optional verifying key to use for the transaction
     * @returns {Promise<string | Error>}
     */
    executeOffline(program: string, function_name: string, inputs: string[], privateKey?: PrivateKey, provingKey?: ProvingKey, verifyingKey?: VerifyingKey): Promise<ExecutionResponse>;
    /**
     * Join two credits records into a single credits record
     *
     * @param recordOne {RecordPlaintext | string} First credits record to join
     * @param recordTwo {RecordPlaintext | string} Second credits record to join
     * @param fee {number} Fee in credits pay for the join transaction
     * @param feeRecord {RecordPlaintext | string} Fee record to use for the join transaction
     * @param privateKey {PrivateKey | undefined} Private key to use for the join transaction
     * @returns {Promise<string | Error>}
     */
    join(recordOne: RecordPlaintext | string, recordTwo: RecordPlaintext | string, fee: number, feeRecord: RecordPlaintext | string, privateKey?: PrivateKey): Promise<string | Error>;
    /**
     * Split credits into two new credits records
     *
     * @param splitAmount {number} Amount to split from the original credits record
     * @param recipient {string} Recipient of the split transaction
     * @param amountRecord {RecordPlaintext | string} Amount record to use for the split transaction
     * @param privateKey {PrivateKey | undefined} Private key to use for the split transaction
     * @returns {Promise<string | Error>}
     */
    split(splitAmount: number, amountRecord: RecordPlaintext | string, privateKey?: PrivateKey): Promise<string | Error>;
    /**
     * Transfer credits to another account
     *
     * @param amount {number} The amount of credits to transfer
     * @param recipient {string} The recipient of the transfer
     * @param transfer_type
     * @param fee
     * @param amountRecord
     * @param feeRecord
     * @param privateKey
     * @returns {Promise<string | Error>}
     */
    transfer(amount: number, recipient: string, transfer_type: string, fee: number, amountRecord?: RecordPlaintext | string, feeRecord?: RecordPlaintext | string, privateKey?: PrivateKey): Promise<string | Error>;
    /**
     * Create a program object from a program's source code
     *
     * @param program {string} Program source code
     * @returns {Program | Error} The program object
     */
    createProgramFromSource(program: string): Program | Error;
    /**
     * Get the credits program object
     *
     * @returns {Program} The credits program object
     */
    creditsProgram(): Program;
}
export { ProgramManager };
