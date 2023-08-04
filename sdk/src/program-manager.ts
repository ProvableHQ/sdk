import init, {
    initThreadPool,
    ProgramManager as WasmProgramManager,
} from '@aleohq/wasm'
import {
    Account,
    AleoKeyProvider,
    AleoNetworkClient,
    ExecutionResponse,
    FunctionKeyProvider,
    FunctionKeyPair,
    RecordPlaintext,
    RecordProvider,
    PrivateKey,
    Program,
    ProvingKey,
    VerifyingKey,
    ProgramImports,
    logAndThrow
} from ".";

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
     * const programManager = new ProgramManager("https://vm.aleo.org/api", keyProvider, recordProvider);
     * await programManager.initialize();
     * const tx_id = await programManager.deploy(program, fee, feeRecord)
     * const transaction = await programManager.networkClient.getTransaction(tx_id);
     */
    async deploy(
        program: string,
        fee: number,
        feeRecord?: string | RecordPlaintext,
        privateKey?: PrivateKey,
    ): Promise<string | Error> {
        // Ensure the program is valid and does not exist on the network
        try {
            const programObject = Program.fromString(program);
            let programSource;
            try {
                programSource = this.networkClient.getProgram(programObject.id());
            } catch (e) {
                // Program does not exist on the network, deployment can proceed
                console.log(`Program ${programObject.id()} does not exist on the network, deploying...`);
            }
            if (typeof programSource == "string") {
                throw (`Program ${programObject.id()} already exists on the network, please rename your program`);
            }
        } catch (e) {
            throw logAndThrow(`Error validating program: ${e}`);
        }

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
        try {
            feeRecord = <RecordPlaintext>await this.getCreditsRecord(fee, [], feeRecord);
        } catch (e) {
            throw logAndThrow(`Error finding fee record. Record finder response: '${e}'. Please ensure you're connected to a valid Aleo network and a record with enough balance exists.`);
        }

        // Get the proving and verifying keys from the key provider
        let feeKeys;
        try {
            feeKeys = <FunctionKeyPair>await this.keyProvider.feeKeys();
        } catch (e) {
            throw logAndThrow(`Error finding fee keys. Key finder response: '${e}'. Please ensure your key provider is configured correctly.`);
        }
        const [feeProvingKey, feeVerifyingKey] = feeKeys;

        // Resolve the program imports if they exist
        let imports;
        try {
            imports = await this.networkClient.getProgramImports(program);
        } catch (e) {
            throw logAndThrow(`Error finding program imports. Network response: '${e}'. Please ensure you're connected to a valid Aleo network and the program is deployed to the network.`);
        }

        // Build a deployment transaction and submit it to the network
        const tx = await this.buildDeploymentTransaction(deploymentPrivateKey, program, fee, feeRecord, this.host, false, imports, feeProvingKey, feeVerifyingKey);
        return await this.networkClient.submitTransaction(tx);
    }

    /**
     * Execute an Aleo program on the Aleo network
     *
     * @param programName {string} Program name containing the function to be executed
     * @param functionName {string} Function name to execute
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
     * const programName = "hello_hello.aleo";
     * const programManager = new ProgramManager("https://vm.aleo.org/api", keyProvider, recordProvider);
     * await programManager.initialize();
     * const tx_id = await programManager.execute(programName, "hello_hello", 0.020, ["5u32", "5u32"])
     * const transaction = await programManager.networkClient.getTransaction(tx_id);
     */
    async execute(
        programName: string,
        functionName: string,
        fee: number,
        inputs: string[],
        feeRecord?: string | RecordPlaintext,
        privateKey?: PrivateKey,
        provingKey?: ProvingKey,
        verifyingKey?: VerifyingKey,
    ): Promise<string | Error> {
        // Ensure the function exists on the network
        let program;
        try {
            program = <string>(await this.networkClient.getProgram(programName));
        } catch (e) {
            throw logAndThrow(`Error finding ${programName}. Network response: '${e}'. Please ensure you're connected to a valid Aleo network the program is deployed to the network.`);
        }

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
        try {
            feeRecord = <RecordPlaintext>await this.getCreditsRecord(fee, [], feeRecord);
        } catch (e) {
            throw logAndThrow(`Error finding fee record. Record finder response: '${e}'. Please ensure you're connected to a valid Aleo network and a record with enough balance exists.`);
        }

        // Get the proving and verifying keys from the key provider
        let feeKeys;
        try {
            feeKeys = <FunctionKeyPair>await this.keyProvider.feeKeys();
        } catch (e) {
            throw logAndThrow(`Error finding fee keys. Key finder response: '${e}'. Please ensure your key provider is configured correctly.`);
        }
        const [feeProvingKey, feeVerifyingKey] = feeKeys;

        // Resolve the program imports if they exist
        let imports;
        try {
            imports = await this.networkClient.getProgramImports(programName);
        } catch (e) {
            throw logAndThrow(`Error finding program imports. Network response: '${e}'. Please ensure you're connected to a valid Aleo network and the program is deployed to the network.`);
        }

        // Build an execution transaction and submit it to the network
        const tx = await this.buildExecutionTransaction(executionPrivateKey, program, functionName, inputs, fee, feeRecord, this.host, false, imports, provingKey, verifyingKey, feeProvingKey, feeVerifyingKey);
        return await this.networkClient.submitTransaction(tx);
    }

    /**
     * Execute an Aleo program in offline mode
     *
     * @param program {string} Program source code containing the function to be executed
     * @param function_name {string} Function name to execute
     * @param inputs {string[]} Inputs to the function
     * @param imports {string[]} Optional imports to the program
     * @param privateKey {PrivateKey | undefined} Optional private key to use for the transaction
     * @param provingKey {ProvingKey | undefined} Optional proving key to use for the transaction
     * @param verifyingKey {VerifyingKey | undefined} Optional verifying key to use for the transaction
     * @returns {Promise<string | Error>}
     *
     * @example
     * const program = "program hello_hello.aleo;\n\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n";
     * const programManager = new ProgramManager();
     * await programManager.initialize();
     * const executionResponse = await programManager.executeOffline(program, "hello_hello", ["5u32", "5u32"]);
     *
     * const result = executionResponse.getOutputs();
     * assert(result === ["10u32"]);
     */
    async executeOffline(
        program: string,
        function_name: string,
        inputs: string[],
        imports?: ProgramImports,
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

        // Run the program offline and return the result
        return this.executeFunctionOffline(executionPrivateKey, program, function_name, inputs, false, imports, provingKey, verifyingKey);
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
    async join(recordOne: RecordPlaintext | string, recordTwo: RecordPlaintext | string, fee: number, feeRecord?: RecordPlaintext | string, privateKey?: PrivateKey): Promise<string | Error> {
        // Convert the fee to microcredits
        fee = Math.floor(fee * 1000000);

        // Get the private key from the account if it is not provided in the parameters
        let executionPrivateKey = privateKey;
        if (typeof privateKey === "undefined" && typeof this.account !== "undefined") {
            executionPrivateKey = this.account.privateKey();
        } else {
            throw("No private key provided and no private key set in the ProgramManager");
        }

        // Get the proving and verifying keys from the key provider
        let feeKeys;
        let joinKeys
        try {
            feeKeys = <FunctionKeyPair>await this.keyProvider.feeKeys();
            joinKeys = <FunctionKeyPair>await this.keyProvider.joinKeys();
        } catch (e) {
            throw logAndThrow(`Error finding fee keys. Key finder response: '${e}'. Please ensure your key provider is configured correctly.`);
        }
        const [feeProvingKey, feeVerifyingKey] = feeKeys;
        const [joinProvingKey, joinVerifyingKey] = joinKeys;

        // Get the fee record from the account if it is not provided in the parameters
        try {
            feeRecord = <RecordPlaintext>await this.getCreditsRecord(fee, [], feeRecord);
        } catch (e) {
            throw logAndThrow(`Error finding fee record. Record finder response: '${e}'. Please ensure you're connected to a valid Aleo network and a record with enough balance exists.`);
        }

        // Validate the records provided are valid plaintext records
        try {
            recordOne = recordOne instanceof RecordPlaintext ? recordOne : RecordPlaintext.fromString(recordOne);
            recordTwo = recordTwo instanceof RecordPlaintext ? recordTwo : RecordPlaintext.fromString(recordTwo);
        } catch (e) {
            throw logAndThrow('Records provided are not valid. Please ensure they are valid plaintext records.')
        }

        // Build an execution transaction and submit it to the network
        const tx = await this.buildJoinTransaction(executionPrivateKey, recordOne, recordTwo, fee, feeRecord, this.host, false, joinProvingKey, joinVerifyingKey, feeProvingKey, feeVerifyingKey);
        return await this.networkClient.submitTransaction(tx);
    }

    /**
     * Split credits into two new credits records
     *
     * @param splitAmount {number} Amount in microcredits to split from the original credits record
     * @param amountRecord {RecordPlaintext | string} Amount record to use for the split transaction
     * @param privateKey {PrivateKey | undefined} Optional private key to use for the split transaction
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
    async split(splitAmount: number, amountRecord: RecordPlaintext | string, privateKey?: PrivateKey): Promise<string | Error> {
        // Get the private key from the account if it is not provided in the parameters
        let executionPrivateKey = privateKey;
        if (typeof privateKey === "undefined" && typeof this.account !== "undefined") {
            executionPrivateKey = this.account.privateKey();
        } else {
            throw("No private key provided and no private key set in the ProgramManager");
        }

        // Get the split keys from the key provider
        let splitKeys;
        try {
            splitKeys = <FunctionKeyPair>await this.keyProvider.splitKeys();
        } catch (e) {
            throw logAndThrow(`Error finding fee keys. Key finder response: '${e}'. Please ensure your key provider is configured correctly.`);
        }
        const [splitProvingKey, splitVerifyingKey] = splitKeys;

        // Validate the record to be split
        try {
            amountRecord = amountRecord instanceof RecordPlaintext ? amountRecord : RecordPlaintext.fromString(amountRecord);
        } catch (e) {
            throw logAndThrow("Record provided is not valid. Please ensure it is a valid plaintext record.");
        }

        // Build an execution transaction and submit it to the network
        const tx = await this.buildSplitTransaction(executionPrivateKey, splitAmount, amountRecord, this.host, false, splitProvingKey, splitVerifyingKey);
        return await this.networkClient.submitTransaction(tx);
    }

    /**
     * Transfer credits to another account
     *
     * @param amount {number} The amount of credits to transfer
     * @param recipient {string} The recipient of the transfer
     * @param transferType {string} The type of transfer to perform - options: 'private', 'privateToPublic', 'public', 'publicToPrivate'
     * @param fee {number} The fee to pay for the transfer
     * @param amountRecord {RecordPlaintext | string} Optional amount record to use for the transfer
     * @param feeRecord {RecordPlaintext | string} Optional fee record to use for the transfer
     * @param privateKey {PrivateKey | undefined} Optional private key to use for the transfer transaction
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
    async transfer(amount: number, recipient: string, transferType: string, fee: number, amountRecord?: RecordPlaintext | string, feeRecord?: RecordPlaintext | string, privateKey?: PrivateKey): Promise<string | Error> {
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

        // Get the proving and verifying keys from the key provider
        let feeKeys;
        let transferKeys
        try {
            feeKeys = <FunctionKeyPair>await this.keyProvider.feeKeys();
            transferKeys = <FunctionKeyPair>await this.keyProvider.transferKeys(transferType);
        } catch (e) {
            throw logAndThrow(`Error finding fee keys. Key finder response: '${e}'. Please ensure your key provider is configured correctly.`);
        }
        const [feeProvingKey, feeVerifyingKey] = feeKeys;
        const [transferProvingKey, transferVerifyingKey] = transferKeys;

        // Get the amount and fee record from the account if it is not provided in the parameters
        try {
            // Track the nonces of the records found so no duplicate records are used
            const nonces: string[] = [];
            if (requiresAmountRecord(transferType)) {
                // If the transfer type is private and requires an amount record, get it from the record provider
                amountRecord = <RecordPlaintext>await this.getCreditsRecord(fee, [], amountRecord);
                nonces.push(amountRecord.nonce());
            } else {
                amountRecord = undefined;
            }

            feeRecord = <RecordPlaintext>await this.getCreditsRecord(fee, nonces, feeRecord);
        } catch (e) {
            throw logAndThrow(`Error finding fee record. Record finder response: '${e}'. Please ensure you're connected to a valid Aleo network and a record with enough balance exists.`);
        }

        // Build an execution transaction and submit it to the network
        const tx = await this.buildTransferTransaction(executionPrivateKey, amount, recipient, transferType, amountRecord, fee, feeRecord, this.host, false, transferProvingKey, transferVerifyingKey, feeProvingKey, feeVerifyingKey);
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

    // Internal utility function for getting a credits.aleo record
    async getCreditsRecord(amount: number, nonces: string[], record?: RecordPlaintext | string): Promise<RecordPlaintext | Error> {
        try {
            return record instanceof RecordPlaintext ? record : RecordPlaintext.fromString(<string>record);
        } catch (e) {
            try {
                const recordProvider = <RecordProvider>this.recordProvider;
                return <RecordPlaintext>(await recordProvider.findCreditsRecord(amount, true, nonces))
            } catch (e) {
                throw logAndThrow(`Error finding fee record. Record finder response: '${e}'. Please ensure you're connected to a valid Aleo network and a record with enough balance exists.`);
            }
        }
    }
}

function requiresAmountRecord(transferType: string): boolean {
    switch (transferType) {
        case "transfer_private" || "private" || "transferPrivate":
            return true;
        case "transfer_private_to_public" || "privateToPublic" || "transferPrivateToPublic":
            return true;
        default:
            return false;
    }
}

export { ProgramManager }