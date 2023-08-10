import { Account, Block, Program, RecordPlaintext, PrivateKey, WasmTransaction, Transaction, Transition } from ".";
type ProgramImports = {
    [key: string]: string | Program;
};
/**
 * Client library that encapsulates REST calls to publicly exposed endpoints of Aleo nodes. The methods provided in this
 * allow users to query public information from the Aleo blockchain and submit transactions to the network.
 *
 * @param {string} host
 * @example
 * // Connection to a local node
 * const localNetworkClient = new AleoNetworkClient("http://localhost:3030");
 *
 * // Connection to a public beacon node
 * const publicnetworkClient = new AleoNetworkClient("https://vm.aleo.org/api");
 */
declare class AleoNetworkClient {
    host: string;
    account: Account | undefined;
    constructor(host: string);
    /**
     * Set an account to use in networkClient calls
     *
     * @param {Account} account
     * @example
     * const account = new Account();
     * networkClient.setAccount(account);
     */
    setAccount(account: Account): void;
    /**
     * Return the Aleo account used in the networkClient
     *
     * @example
     * const account = networkClient.getAccount();
     */
    getAccount(): Account | undefined;
    /**
     * Set a new host for the networkClient
     *
     * @param {string} host The address of a node hosting the Aleo API
     * @param host
     */
    setHost(host: string): void;
    fetchData<Type>(url?: string): Promise<Type>;
    /**
     * Attempts to find unspent records in the Aleo blockchain for a specified private key
     * @param {number} startHeight - The height at which to start searching for unspent records
     * @param {number} endHeight - The height at which to stop searching for unspent records
     * @param {string | PrivateKey} privateKey - The private key to use to find unspent records
     * @param {number[]} amounts - The amounts (in microcredits) to search for (eg. [100, 200, 3000])
     * @param {number} maxMicrocredits - The maximum number of microcredits to search for
     * @param {string[]} nonces - The nonces of already found records to exclude from the search
     *
     * @example
     * // Find all unspent records
     * const privateKey = "[PRIVATE_KEY]";
     * const records = networkClient.findUnspentRecords(0, undefined, privateKey);
     *
     * // Find specific amounts
     * const startHeight = 500000;
     * const amounts = [600000, 1000000];
     * const records = networkClient.findUnspentRecords(startHeight, undefined, privateKey, amounts);
     *
     * // Find specific amounts with a maximum number of cumulative microcredits
     * const maxMicrocredits = 100000;
     * const records = networkClient.findUnspentRecords(startHeight, undefined, privateKey, undefined, maxMicrocredits);
     */
    findUnspentRecords(startHeight: number, endHeight: number | undefined, privateKey: string | PrivateKey | undefined, amounts: number[] | undefined, maxMicrocredits?: number | undefined, nonces?: string[] | undefined): Promise<Array<RecordPlaintext> | Error>;
    /**
     * Returns the contents of the block at the specified block height
     *
     * @param {number} height
     * @example
     * const block = networkClient.getBlock(1234);
     */
    getBlock(height: number): Promise<Block | Error>;
    /**
     * Returns a range of blocks between the specified block heights
     *
     * @param {number} start
     * @param {number} end
     * @example
     * const blockRange = networkClient.getBlockRange(2050, 2100);
     */
    getBlockRange(start: number, end: number): Promise<Array<Block> | Error>;
    /**
     * Returns the contents of the latest block
     *
     * @example
     * const latestHeight = networkClient.getLatestBlock();
     */
    getLatestBlock(): Promise<Block | Error>;
    /**
     * Returns the hash of the last published block
     *
     * @example
     * const latestHash = networkClient.getLatestHash();
     */
    getLatestHash(): Promise<string | Error>;
    /**
     * Returns the latest block height
     *
     * @example
     * const latestHeight = networkClient.getLatestHeight();
     */
    getLatestHeight(): Promise<number | Error>;
    /**
     * Returns the source code of a program given a program ID
     *
     * @param {string} programId The program ID of a program deployed to the Aleo Network
     * @return {Promise<string>} Source code of the program
     *
     * @example
     * const program = networkClient.getProgram("hello_hello.aleo");
     * const expectedSource = "program hello_hello.aleo;\n\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n"
     * assert.equal(program, expectedSource);
     */
    getProgram(programId: string): Promise<string | Error>;
    /**
     * Returns a program object from a program ID or program source code
     *
     * @param {string} inputProgram The program ID or program source code of a program deployed to the Aleo Network
     * @return {Promise<Program | Error>} Source code of the program
     *
     * @example
     * const programID = "hello_hello.aleo";
     * const programSource = "program hello_hello.aleo;\n\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n"
     *
     * // Get program object from program ID or program source code
     * const programObjectFromID = await networkClient.getProgramObject(programID);
     * const programObjectFromSource = await networkClient.getProgramObject(programSource);
     *
     * // Both program objects should be equal
     * assert.equal(programObjectFromID.to_string(), programObjectFromSource.to_string());
     */
    getProgramObject(inputProgram: string): Promise<Program | Error>;
    /**
     *  Returns an object containing the source code of a program and the source code of all programs it imports
     *
     * @param {Program | string} inputProgram The program ID or program source code of a program deployed to the Aleo Network
     * @returns {Promise<ProgramImports>} Object of the form { "program_id": "program_source", .. } containing program id & source code for all program imports
     *
     * @example
     * const double_test_source = "import multiply_test.aleo;\n\nprogram double_test.aleo;\n\nfunction double_it:\n    input r0 as u32.private;\n    call multiply_test.aleo/multiply 2u32 r0 into r1;\n    output r1 as u32.private;\n"
     * const double_test = Program.fromString(double_test_source);
     * const expectedImports = {
     *     "multiply_test.aleo": "program multiply_test.aleo;\n\nfunction multiply:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    mul r0 r1 into r2;\n    output r2 as u32.private;\n"
     * }
     *
     * // Imports can be fetched using the program ID, source code, or program object
     * let programImports = await networkClient.getProgramImports("double_test.aleo");
     * assert.deepStrictEqual(programImports, expectedImports);
     *
     * // Using the program source code
     * programImports = await networkClient.getProgramImports(double_test_source);
     * assert.deepStrictEqual(programImports, expectedImports);
     *
     * // Using the program object
     * programImports = await networkClient.getProgramImports(double_test);
     * assert.deepStrictEqual(programImports, expectedImports);
     */
    getProgramImports(inputProgram: Program | string): Promise<ProgramImports | Error>;
    /**
     * Get a list of the program names that a program imports
     *
     * @param {Program | string} inputProgram - The program id or program source code to get the imports of
     * @returns {string[]} - The list of program names that the program imports
     *
     * @example
     * const programImportsNames = networkClient.getProgramImports("double_test.aleo");
     * const expectedImportsNames = ["multiply_test.aleo"];
     * assert.deepStrictEqual(programImportsNames, expectedImportsNames);
     */
    getProgramImportNames(inputProgram: Program | string): Promise<string[] | Error>;
    /**
     * Returns the names of the mappings of a program
     *
     * @param {string} programId - The program ID to get the mappings of (e.g. "credits.aleo")
     * @example
     * const mappings = networkClient.getProgramMappingNames("credits.aleo");
     * const expectedMappings = ["account"];
     * assert.deepStrictEqual(mappings, expectedMappings);
     */
    getProgramMappingNames(programId: string): Promise<Array<string> | Error>;
    /**
     * Returns the value of a program's mapping for a specific key
     *
     * @param {string} programId - The program ID to get the mapping value of (e.g. "credits.aleo")
     * @param {string} mappingName - The name of the mapping to get the value of (e.g. "account")
     * @param {string} key - The key of the mapping to get the value of (e.g. "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px")
     * @return {Promise<string>} String representation of the value of the mapping
     *
     * @example
     * // Get public balance of an account
     * const mappingValue = networkClient.getMappingValue("credits.aleo", "account", "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px");
     * const expectedValue = "0u64";
     * assert.equal(mappingValue, expectedValue);
     */
    getProgramMappingValue(programId: string, mappingName: string, key: string): Promise<string | Error>;
    /**
     * Returns the latest state/merkle root of the Aleo blockchain
     *
     * @example
     * const stateRoot = networkClient.getStateRoot();
     */
    getStateRoot(): Promise<string | Error>;
    /**
     * Returns a transaction by its unique identifier
     *
     * @param {string} id
     * @example
     * const transaction = networkClient.getTransaction("at1handz9xjrqeynjrr0xay4pcsgtnczdksz3e584vfsgaz0dh0lyxq43a4wj");
     */
    getTransaction(id: string): Promise<Transaction | Error>;
    /**
     * Returns the transactions present at the specified block height
     *
     * @param {number} height
     * @example
     * const transactions = networkClient.getTransactions(654);
     */
    getTransactions(height: number): Promise<Array<Transaction> | Error>;
    /**
     * Returns the transactions in the memory pool.
     *
     * @example
     * const transactions = networkClient.getTransactionsInMempool();
     */
    getTransactionsInMempool(): Promise<Array<Transaction> | Error>;
    /**
     * Returns the transition id by its unique identifier
     * @param {string} transition_id - The transition id to get
     *
     * @example
     * const transition = networkClient.getTransitionId("2429232855236830926144356377868449890830704336664550203176918782554219952323field");
     */
    getTransitionId(transition_id: string): Promise<Transition | Error>;
    /**
     * Submit an execute or deployment transaction to the Aleo network
     *
     * @param {WasmTransaction | string} transaction  - The transaction to submit to the network
     * @returns {string | Error} - The transaction id of the submitted transaction or the resulting error
     */
    submitTransaction(transaction: WasmTransaction | string): Promise<string | Error>;
}
export { AleoNetworkClient, ProgramImports };
