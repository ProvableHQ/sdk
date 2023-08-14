import { ProgramManager as WasmProgramManager } from '@aleohq/wasm';
import { Account, AleoNetworkClient, ExecutionResponse, FunctionKeyProvider, KeySearchParams, RecordPlaintext, RecordProvider, RecordSearchParams, PrivateKey, Program, ProgramImports, ProvingKey, VerifyingKey } from ".";
/**
 * The ProgramManager class is used to execute and deploy programs on the Aleo network and create value transfers.
 */
declare class ProgramManager {
    account: Account | undefined;
    keyProvider: FunctionKeyProvider;
    host: string;
    networkClient: AleoNetworkClient;
    recordProvider: RecordProvider | undefined;
    executionEngine: WasmProgramManager;
    /** Create a new instance of the ProgramManager
     *
     * @param { string | undefined } host A host uri running the official Aleo API
     * @param { FunctionKeyProvider | undefined } keyProvider A key provider that implements {@link FunctionKeyProvider} interface
     * @param { RecordProvider | undefined } recordProvider A record provider that implements {@link RecordProvider} interface
     */
    constructor(host: string | undefined, keyProvider: FunctionKeyProvider | undefined, recordProvider: RecordProvider | undefined);
    /**
     * Set the account to use for transaction submission to the Aleo network
     *
     * @param {Account} account Account to use for transaction submission
     */
    setAccount(account: Account): void;
    /**
     * Set the key provider that provides the proving and verifying keys for programs
     *
     * @param {FunctionKeyProvider} keyProvider
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
     * @param {RecordProvider} recordProvider
     */
    setRecordProvider(recordProvider: RecordProvider): void;
    /**
     * Deploy an Aleo program to the Aleo network
     *
     * @param {string} program Program source code
     * @param {number} fee Fee to pay for the transaction
     * @param {RecordSearchParams | undefined} recordSearchParams Optional parameters for searching for a record to use for the transaction
     * @param {string | RecordPlaintext | undefined} feeRecord Optional Fee record to use for the transaction
     * @param {PrivateKey | undefined} privateKey Optional private key to use for the transaction
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
     * const programManager = new ProgramManager("https://vm.aleo.org/api", keyProvider, recordProvider);
     * await programManager.initialize();
     * const tx_id = await programManager.deploy(program, fee, feeRecord)
     * const transaction = await programManager.networkClient.getTransaction(tx_id);
     */
    deploy(program: string, fee: number, recordSearchParams?: RecordSearchParams, feeRecord?: string | RecordPlaintext, privateKey?: PrivateKey): Promise<string | Error>;
    /**
     * Execute an Aleo program on the Aleo network
     *
     * @param {string} programName Program name containing the function to be executed
     * @param {string} functionName Function name to execute
     * @param {number} fee Fee to pay for the transaction
     * @param {string[]} inputs Inputs to the function
     * @param {RecordSearchParams} recordSearchParams Optional parameters for searching for a record to use for the transaction
     * @param {KeySearchParams} keySearchParams Optional parameters for finding the matching proving & verifying keys for the function
     * @param {string | RecordPlaintext | undefined} feeRecord Optional Fee record to use for the transaction
     * @param {ProvingKey | undefined} provingKey Optional proving key to use for the transaction
     * @param {VerifyingKey | undefined} verifyingKey Optional verifying key to use for the transaction
     * @param {PrivateKey | undefined} privateKey Optional private key to use for the transaction
     * @returns {Promise<string | Error>}
     *
     * @example
     * // Create a new NetworkClient, KeyProvider, and RecordProvider using official Aleo record, key, and network providers
     * const networkClient = new AleoNetworkClient("https://vm.aleo.org/api");
     * const keyProvider = new AleoKeyProvider();
     * keyProvider.useCache = true;
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for executions
     * const programName = "hello_hello.aleo";
     * const programManager = new ProgramManager("https://vm.aleo.org/api", keyProvider, recordProvider);
     * const keySearchParams = { "cacheKey": "hello_hello:hello" };
     * const tx_id = await programManager.execute(programName, "hello_hello", 0.020, ["5u32", "5u32"], undefined, undefined, undefined, keySearchParams);
     * const transaction = await programManager.networkClient.getTransaction(tx_id);
     */
    execute(programName: string, functionName: string, fee: number, inputs: string[], recordSearchParams?: RecordSearchParams, keySearchParams?: KeySearchParams, feeRecord?: string | RecordPlaintext, provingKey?: ProvingKey, verifyingKey?: VerifyingKey, privateKey?: PrivateKey): Promise<string | Error>;
    /**
     * Execute an Aleo program in offline mode
     *
     * @param {string} program Program source code containing the function to be executed
     * @param {string} function_name Function name to execute
     * @param {string[]} inputs Inputs to the function
     * @param {string[] | undefined} imports Optional imports to the program
     * @param {KeySearchParams | undefined} keySearchParams Optional parameters for finding the matching proving &
     * verifying keys for the function
     * @param {ProvingKey | undefined} provingKey Optional proving key to use for the transaction
     * @param {VerifyingKey | undefined} verifyingKey Optional verifying key to use for the transaction
     * @param {PrivateKey | undefined} privateKey Optional private key to use for the transaction
     * @returns {Promise<string | Error>}
     *
     * @example
     * const program = "program hello_hello.aleo;\n\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n";
     * const programManager = new ProgramManager();
     * const executionResponse = await programManager.executeOffline(program, "hello_hello", ["5u32", "5u32"]);
     *
     * const result = executionResponse.getOutputs();
     * assert(result === ["10u32"]);
     */
    executeOffline(program: string, function_name: string, inputs: string[], imports?: ProgramImports, keySearchParams?: KeySearchParams, provingKey?: ProvingKey, verifyingKey?: VerifyingKey, privateKey?: PrivateKey): Promise<ExecutionResponse>;
    /**
     * Join two credits records into a single credits record
     *
     * @param {RecordPlaintext | string} recordOne First credits record to join
     * @param {RecordPlaintext | string} recordTwo Second credits record to join
     * @param {number} fee Fee in credits pay for the join transaction
     * @param {RecordSearchParams | undefined} recordSearchParams Optional parameters for finding the fee record for the join transaction
     * @param {RecordPlaintext | string | undefined} feeRecord Fee record to use for the join transaction
     * @param {PrivateKey | undefined} privateKey Private key to use for the join transaction
     * @returns {Promise<string | Error>}
     */
    join(recordOne: RecordPlaintext | string, recordTwo: RecordPlaintext | string, fee: number, recordSearchParams?: RecordSearchParams | undefined, feeRecord?: RecordPlaintext | string | undefined, privateKey?: PrivateKey): Promise<string | Error>;
    /**
     * Split credits into two new credits records
     *
     * @param {number} splitAmount Amount in microcredits to split from the original credits record
     * @param {RecordPlaintext | string} amountRecord Amount record to use for the split transaction
     * @param {PrivateKey | undefined} privateKey Optional private key to use for the split transaction
     * @returns {Promise<string | Error>}
     *
     * @example
     * // Create a new NetworkClient, KeyProvider, and RecordProvider
     * const networkClient = new AleoNetworkClient("https://vm.aleo.org/api");
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for executions
     * const programName = "hello_hello.aleo";
     * const programManager = new ProgramManager("https://vm.aleo.org/api", keyProvider, recordProvider);
     * await programManager.initialize();
     * const record = "{  owner: aleo184vuwr5u7u0ha5f5k44067dd2uaqewxx6pe5ltha5pv99wvhfqxqv339h4.private,  microcredits: 45000000u64.private,  _nonce: 4106205762862305308495708971985748592380064201230396559307556388725936304984group.public}"
     * const tx_id = await programManager.split(25000000, record);
     * const transaction = await programManager.networkClient.getTransaction(tx_id);
     */
    split(splitAmount: number, amountRecord: RecordPlaintext | string, privateKey?: PrivateKey): Promise<string | Error>;
    /**
     * Transfer credits to another account
     *
     * @param {number} amount The amount of credits to transfer
     * @param {string} recipient The recipient of the transfer
     * @param {string} transferType The type of transfer to perform - options: 'private', 'privateToPublic', 'public', 'publicToPrivate'
     * @param {number} fee The fee to pay for the transfer
     * @param {RecordSearchParams | undefined} recordSearchParams Optional parameters for finding the fee record for the join transaction
     * @param {RecordPlaintext | string} amountRecord Optional amount record to use for the transfer
     * @param {RecordPlaintext | string} feeRecord Optional fee record to use for the transfer
     * @param {PrivateKey | undefined} privateKey Optional private key to use for the transfer transaction
     * @returns {Promise<string | Error>} The transaction id of the transfer transaction
     *
     * @example
     * // Create a new NetworkClient, KeyProvider, and RecordProvider
     * const networkClient = new AleoNetworkClient("https://vm.aleo.org/api");
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for executions
     * const programName = "hello_hello.aleo";
     * const programManager = new ProgramManager("https://vm.aleo.org/api", keyProvider, recordProvider);
     * await programManager.initialize();
     * const tx_id = await programManager.transfer(1, "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", "private", 0.2)
     * const transaction = await programManager.networkClient.getTransaction(tx_id);
     */
    transfer(amount: number, recipient: string, transferType: string, fee: number, recordSearchParams?: RecordSearchParams, amountRecord?: RecordPlaintext | string, feeRecord?: RecordPlaintext | string, privateKey?: PrivateKey): Promise<string | Error>;
    /**
     * Create a program object from a program's source code
     *
     * @param {string} program Program source code
     * @returns {Program | Error} The program object
     */
    createProgramFromSource(program: string): Program | Error;
    /**
     * Get the credits program object
     *
     * @returns {Program} The credits program object
     */
    creditsProgram(): Program;
    /**
     * Verify a program is valid
     *
     * @param {string} program The program source code
     */
    verifyProgram(program: string): boolean;
    getCreditsRecord(amount: number, nonces: string[], record?: RecordPlaintext | string, params?: RecordSearchParams): Promise<RecordPlaintext | Error>;
}
export { ProgramManager };
