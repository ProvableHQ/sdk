import init, {
    initThreadPool,
    ProgramManager as WasmProgramManager,
} from '@aleohq/wasm'
import { Account, AleoKeyProvider, AleoNetworkClient, ExecutionResponse, FunctionKeyProvider, RecordPlaintext, PrivateKey, Program, ProvingKey, VerifyingKey} from ".";
import {RecordProvider} from "./record-provider";

class ProgramManager extends WasmProgramManager {
    account: Account | undefined;
    keyProvider: FunctionKeyProvider;
    host: string;
    networkClient: AleoNetworkClient;
    recordProvider: RecordProvider | undefined;
    constructor(host: string | undefined, keyProvider: FunctionKeyProvider | undefined, recordProvider: RecordProvider | undefined) {
        if (process.env.NODE_ENV === 'production') {
            throw("ProgramManager is not available in NodeJS")
        }

        super()
        if (typeof host === "undefined") {
            this.host = "http://vm.aleo.org/api";
            this.networkClient = new AleoNetworkClient(this.host);
        } else {
            this.host = host;
            this.networkClient = new AleoNetworkClient(host);
        }

        if (typeof keyProvider === "undefined") {
            this.keyProvider = new AleoKeyProvider();
        } else {
            this.keyProvider = keyProvider;
        }

        this.recordProvider = recordProvider;
    }

    /**
     * Set the account to use for transaction submission to the Aleo network
     *
     * @param account {Account} Account to use for transaction submission
     */
    setAccount(account: Account) {
        this.account = account;
    }

    /**
     * Set the key provider that provides the proving and verifying keys for programs
     *
     * @param keyProvider {FunctionKeyProvider}
     */
    setKeyProvider(keyProvider: FunctionKeyProvider) {
        this.keyProvider = keyProvider;
    }

    /**
     * Set the host peer to use for transaction submission to the Aleo network
     *
     * @param host {string} Peer url to use for transaction submission
     */
    setHost(host: string) {
        this.host = host;
        this.networkClient.host = host;
    }

    /**
     * Set the record provider that provides records for transactions
     *
     * @param recordProvider {RecordProvider}
     */
    setRecordProvider(recordProvider: RecordProvider) {
        this.recordProvider = recordProvider;
    }

    /**
     * Initialize the program manager. This step is NECESSARY before any other methods can be called.
     *
     * @param threads {number | undefined} Number of threads to use for the thread pool. If undefined, defaults to 8.
     */
    async initialize(threads: number | undefined): Promise<void> {
        await init()
        if (typeof threads === "undefined") {
            await initThreadPool(8);
        } else {
            await initThreadPool(threads);
        }
    }

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
    async deploy(
        program: string,
        fee: number,
        feeRecord: string | RecordPlaintext,
        privateKey?: PrivateKey,
    ): Promise<string | Error> {
        // Convert the fee to microcredits
        fee = Math.floor(fee * 1000000);

        // Get the private key from the account if it is not provided in the parameters
        let deploymentPrivateKey = privateKey;
        if (typeof privateKey === "undefined" && typeof this.account !== "undefined") {
            deploymentPrivateKey = this.account.privateKey();
        } else {
            throw("No private key provided and no private key set in the ProgramManager");
        }

        // Get the fee record from the account if it is not provided in the parameters
        const record = feeRecord instanceof RecordPlaintext ? feeRecord : RecordPlaintext.fromString(feeRecord);

        // Get the proving and verifying keys from the network client if they are not provided in the parameters
        const result = this.keyExists("credits.aleo", "fee") ? [undefined, undefined] : await this.keyProvider.feeKeys();
        if (result instanceof Error) {
            throw(result);
        }
        const [feeProvingKey, feeVerifyingKey] = result;

        // Resolve the program imports
        const imports = this.networkClient.getProgramImports(program);

        // Deploy the program and submit the transaction to the network
        const tx = await this.buildDeploymentTransaction(deploymentPrivateKey, program, fee, record, this.host, false, imports, feeProvingKey, feeVerifyingKey);
        return await this.networkClient.submitTransaction(tx);
    }

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
    async execute(
        program: string,
        function_name: string,
        fee: number,
        inputs: string[],
        feeRecord?: string | RecordPlaintext,
        privateKey?: PrivateKey,
        provingKey?: ProvingKey,
        verifyingKey?: VerifyingKey,
    ): Promise<string | Error> {
        // Convert the fee to microcredits
        fee = Math.floor(fee * 1000000);

        // Get the private key from the account if it is not provided in the parameters
        let executionPrivateKey = privateKey;
        if (typeof privateKey === "undefined" && typeof this.account !== "undefined") {
            executionPrivateKey = this.account.privateKey();
        } else {
            throw("No private key provided and no private key set in the ProgramManager");
        }

        // Get the fee record from the account if it is not provided in the parameters
        const record = feeRecord instanceof RecordPlaintext ? feeRecord : RecordPlaintext.fromString(<string>feeRecord);

        // Get the proving and verifying keys from the key provider
        const result = await this.keyProvider.feeKeys();
        if (result instanceof Error) {
            throw(result);
        }
        const [feeProvingKey, feeVerifyingKey] = result;

        // Resolve the program imports if they exist
        const imports = this.networkClient.getProgramImports(program);

        // Deploy the program and submit the transaction to the network
        const tx = await this.buildExecutionTransaction(executionPrivateKey, program, function_name, inputs, fee, record, this.host, false, imports, provingKey, verifyingKey, feeProvingKey, feeVerifyingKey);
        return await this.networkClient.submitTransaction(tx);
    }

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
    async executeOffline(
        program: string,
        function_name: string,
        inputs: string[],
        privateKey?: PrivateKey,
        provingKey?: ProvingKey,
        verifyingKey?: VerifyingKey,
    ): Promise<ExecutionResponse> {
        // Get the private key from the account if it is not provided in the parameters
        let executionPrivateKey = privateKey;
        if (typeof privateKey === "undefined" && typeof this.account !== "undefined") {
            executionPrivateKey = this.account.privateKey();
        } else {
            throw("No private key provided and no private key set in the ProgramManager");
        }

        const imports = this.networkClient.getProgramImports(program);

        // Deploy the program and submit the transaction to the network
        return await this.executeFunctionOffline(executionPrivateKey, program, function_name, inputs, false, imports, provingKey, verifyingKey);
    }

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
    async join(recordOne: RecordPlaintext | string, recordTwo: RecordPlaintext | string, fee: number, feeRecord: RecordPlaintext | string, privateKey?: PrivateKey): Promise<string | Error> {
        // Convert the fee to microcredits
        fee = Math.floor(fee * 1000000);

        // Get the private key from the account if it is not provided in the parameters
        let executionPrivateKey = privateKey;
        if (typeof privateKey === "undefined" && typeof this.account !== "undefined") {
            executionPrivateKey = this.account.privateKey();
        } else {
            throw("No private key provided and no private key set in the ProgramManager");
        }

        // Get the keys from the configured key provider
        const feeKeys = await this.keyProvider?.feeKeys();
        const joinKeys = await this.keyProvider?.joinKeys();
        if (feeKeys instanceof Error || joinKeys instanceof Error) {
            throw("Failed to get keys");
        }
        const [feeProvingKey, feeVerifyingKey] = feeKeys;
        const [joinProvingKey, joinVerifyingKey] = joinKeys;

        // Get record
        recordOne = recordOne instanceof RecordPlaintext ? recordOne : RecordPlaintext.fromString(recordOne);
        recordTwo = recordTwo instanceof RecordPlaintext ? recordTwo : RecordPlaintext.fromString(recordTwo);
        feeRecord = feeRecord instanceof RecordPlaintext ? feeRecord : RecordPlaintext.fromString(feeRecord);

        // Build and submit transaction
        const tx = await this.buildJoinTransaction(executionPrivateKey, recordOne, recordTwo, fee, feeRecord, this.host, false, joinProvingKey, joinVerifyingKey, feeProvingKey, feeVerifyingKey);
        return await this.networkClient.submitTransaction(tx);
    }

    /**
     * Split credits into two new credits records
     *
     * @param splitAmount {number} Amount to split from the original credits record
     * @param recipient {string} Recipient of the split transaction
     * @param amountRecord {RecordPlaintext | string} Amount record to use for the split transaction
     * @param privateKey {PrivateKey | undefined} Private key to use for the split transaction
     * @returns {Promise<string | Error>}
     */
    async split(splitAmount: number, amountRecord: RecordPlaintext | string, privateKey?: PrivateKey): Promise<string | Error> {
        // Get the private key from the account if it is not provided in the parameters
        let executionPrivateKey = privateKey;
        if (typeof privateKey === "undefined" && typeof this.account !== "undefined") {
            executionPrivateKey = this.account.privateKey();
        } else {
            throw("No private key provided and no private key set in the ProgramManager");
        }

        // Get the keys from the configured key provider
        const splitKeys = await this.keyProvider?.splitKeys();
        if (splitKeys instanceof Error) {
            throw("Failed to get keys");
        }
        const [splitProvingKey, splitVerifyingKey] = splitKeys;

        // Get record
        amountRecord = amountRecord instanceof RecordPlaintext ? amountRecord : RecordPlaintext.fromString(amountRecord);

        // Build and submit transaction
        const tx = await this.buildSplitTransaction(executionPrivateKey, splitAmount, amountRecord, this.host, false, splitProvingKey, splitVerifyingKey);
        return await this.networkClient.submitTransaction(tx);
    }

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
    async transfer(amount: number, recipient: string, transfer_type: string, fee: number, amountRecord?: RecordPlaintext | string, feeRecord?: RecordPlaintext | string, privateKey?: PrivateKey): Promise<string | Error> {
        // Convert the fee and amount to microcredits
        amount = Math.floor(amount * 1000000);
        fee = Math.floor(fee * 1000000);
        // Get the private key from the account if it is not provided in the parameters
        let executionPrivateKey = privateKey;
        if (typeof privateKey === "undefined" && typeof this.account !== "undefined") {
            executionPrivateKey = this.account.privateKey();
        } else {
            throw("No private key provided and no private key set in the ProgramManager");
        }

        // Get the keys from the configured key provider
        const feeKeys = await this.keyProvider?.feeKeys();
        const transferKeys = await this.keyProvider?.transferKeys(transfer_type);
        if (feeKeys instanceof Error || transferKeys instanceof Error) {
            throw("Failed to get keys");
        }
        const [feeProvingKey, feeVerifyingKey] = feeKeys;
        const [transferProvingKey, transferVerifyingKey] = transferKeys;

        // Track the nonces of the records found so no duplicate records are used
        const nonces = [];

        // Prepare the fee record
        if (feeRecord) {
            feeRecord = feeRecord instanceof RecordPlaintext ? feeRecord : RecordPlaintext.fromString(feeRecord);
            nonces.push(feeRecord.nonce());
        } else {
            if (this.recordProvider) {
                const record = await this.recordProvider.findCreditsRecord(fee, true, []);
                if (record instanceof RecordPlaintext) {
                    feeRecord = record;
                    nonces.push(feeRecord.nonce());
                } else {
                    console.log("Record provider did not return a valid record with error:", record);
                    throw("The record provider did not return a valid record");
                }
            } else {
                throw("No record provider set and no fee record provided");
            }
        }

        // Prepare the amount record if needed
        if (amountRecord) {
            amountRecord = amountRecord instanceof RecordPlaintext ? amountRecord : RecordPlaintext.fromString(amountRecord);
        } else {
            if (this.recordProvider && requiresAmountRecord(transfer_type)) {
                const record = await this.recordProvider.findCreditsRecord(amount, true, nonces);
                if (record instanceof RecordPlaintext) {
                    amountRecord = record;
                } else {
                    console.log("Record provider did not return a valid record with error:", record);
                    throw("The record provider did not return a valid record");
                }
            } else {
                throw("No record provider set and no amount record provided");
            }
        }

        const tx = await this.buildTransferTransaction(executionPrivateKey, amount, recipient, transfer_type, amountRecord, fee, feeRecord, this.host, false, transferProvingKey, transferVerifyingKey, feeProvingKey, feeVerifyingKey);
        return await this.networkClient.submitTransaction(tx);
    }

    /**
     * Create a program object from a program's source code
     *
     * @param program {string} Program source code
     * @returns {Program | Error} The program object
     */
    createProgramFromSource(program: string): Program | Error {
        return Program.fromString(program);
    }

    /**
     * Get the credits program object
     *
     * @returns {Program} The credits program object
     */
    creditsProgram(): Program {
        return Program.getCreditsProgram();
    }
}

function requiresAmountRecord(record_type: string): boolean {
    switch (record_type) {
        case "transfer_private" || "private" || "transferPrivate":
            return true;
        case "transfer_private_to_public" || "privateToPublic" || "transferPrivateToPublic":
            return true;
        default:
            return false;
    }
}

export { ProgramManager }