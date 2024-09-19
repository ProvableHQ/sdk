import {
    Account,
    AleoKeyProvider,
    AleoNetworkClient,
    ExecutionResponse,
    FunctionExecution,
    FunctionKeyProvider,
    FunctionKeyPair,
    OfflineQuery,
    KeySearchParams,
    RecordPlaintext,
    RecordProvider,
    RecordSearchParams,
    PrivateKey,
    Program,
    ProgramImports,
    ProvingKey,
    VerifyingKey,
    Transaction,
    PRIVATE_TRANSFER_TYPES,
    VALID_TRANSFER_TYPES,
    logAndThrow,
    ProgramManagerBase as WasmProgramManager, verifyFunctionExecution, AleoKeyProviderParams, CREDITS_PROGRAM_KEYS,
} from "./browser";

/**
 * Represents the options for executing a transaction in the Aleo network.
 * This interface is used to specify the parameters required for building and submitting an execution transaction.
 *
 * @property {string} programName - The name of the program containing the function to be executed.
 * @property {string} functionName - The name of the function to execute within the program.
 * @property {number} fee - The fee to be paid for the transaction.
 * @property {boolean} privateFee - If true, uses a private record to pay the fee; otherwise, uses the account's public credit balance.
 * @property {string[]} inputs - The inputs to the function being executed.
 * @property {RecordSearchParams} [recordSearchParams] - Optional parameters for searching for a record to pay the execution transaction fee.
 * @property {KeySearchParams} [keySearchParams] - Optional parameters for finding the matching proving & verifying keys for the function.
 * @property {string | RecordPlaintext} [feeRecord] - Optional fee record to use for the transaction.
 * @property {ProvingKey} [provingKey] - Optional proving key to use for the transaction.
 * @property {VerifyingKey} [verifyingKey] - Optional verifying key to use for the transaction.
 * @property {PrivateKey} [privateKey] - Optional private key to use for the transaction.
 * @property {OfflineQuery} [offlineQuery] - Optional offline query if creating transactions in an offline environment.
 * @property {string | Program} [program] - Optional program source code to use for the transaction.
 * @property {ProgramImports} [imports] - Optional programs that the program being executed imports.
 */
interface ExecuteOptions {
    programName: string;
    functionName: string;
    fee: number;
    privateFee: boolean;
    inputs: string[];
    recordSearchParams?: RecordSearchParams;
    keySearchParams?: KeySearchParams;
    feeRecord?: string | RecordPlaintext;
    provingKey?: ProvingKey;
    verifyingKey?: VerifyingKey;
    privateKey?: PrivateKey;
    offlineQuery?: OfflineQuery;
    program?: string | Program;
    imports?: ProgramImports;
}

/**
 * The ProgramManager class is used to execute and deploy programs on the Aleo network and create value transfers.
 */
class ProgramManager {
    account: Account | undefined;
    keyProvider: FunctionKeyProvider;
    host: string;
    networkClient: AleoNetworkClient;
    recordProvider: RecordProvider | undefined;

    /** Create a new instance of the ProgramManager
     *
     * @param { string | undefined } host A host uri running the official Aleo API
     * @param { FunctionKeyProvider | undefined } keyProvider A key provider that implements {@link FunctionKeyProvider} interface
     * @param { RecordProvider | undefined } recordProvider A record provider that implements {@link RecordProvider} interface
     */
    constructor(host?: string | undefined, keyProvider?: FunctionKeyProvider | undefined, recordProvider?: RecordProvider | undefined) {
        this.host = host ? host : 'https://api.explorer.provable.com/v1';
        this.networkClient = new AleoNetworkClient(this.host);

        this.keyProvider = keyProvider ? keyProvider : new AleoKeyProvider();
        this.recordProvider = recordProvider;
    }

    /**
     * Set the account to use for transaction submission to the Aleo network
     *
     * @param {Account} account Account to use for transaction submission
     */
    setAccount(account: Account) {
        this.account = account;
    }

    /**
     * Set the key provider that provides the proving and verifying keys for programs
     *
     * @param {FunctionKeyProvider} keyProvider
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
        this.networkClient.setHost(host);
    }

    /**
     * Set the record provider that provides records for transactions
     *
     * @param {RecordProvider} recordProvider
     */
    setRecordProvider(recordProvider: RecordProvider) {
        this.recordProvider = recordProvider;
    }

    /**
     * Deploy an Aleo program to the Aleo network
     *
     * @param {string} program Program source code
     * @param {number} fee Fee to pay for the transaction
     * @param {boolean} privateFee Use a private record to pay the fee. If false this will use the account's public credit balance
     * @param {RecordSearchParams | undefined} recordSearchParams Optional parameters for searching for a record to use
     * pay the deployment fee
     * @param {string | RecordPlaintext | undefined} feeRecord Optional Fee record to use for the transaction
     * @param {PrivateKey | undefined} privateKey Optional private key to use for the transaction
     * @returns {string} The transaction id of the deployed program or a failure message from the network
     *
     * @example
     * // Create a new NetworkClient, KeyProvider, and RecordProvider
     * const networkClient = new AleoNetworkClient("https://api.explorer.provable.com/v1");
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for deployments
     * const program = "program hello_hello.aleo;\n\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n";
     * const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);
     *
     * // Define a fee in credits
     * const fee = 1.2;
     *
     * // Deploy the program
     * const tx_id = await programManager.deploy(program, fee);
     *
     * // Verify the transaction was successful
     * const transaction = await programManager.networkClient.getTransaction(tx_id);
     */
    async deploy(
        program: string,
        fee: number,
        privateFee: boolean,
        recordSearchParams?: RecordSearchParams,
        feeRecord?: string | RecordPlaintext,
        privateKey?: PrivateKey,
    ): Promise<string> {
        // Ensure the program is valid and does not exist on the network
        try {
            const programObject = Program.fromString(program);
            let programSource;
            try {
                programSource = await this.networkClient.getProgram(programObject.id());
            } catch (e) {
                // Program does not exist on the network, deployment can proceed
                console.log(`Program ${programObject.id()} does not exist on the network, deploying...`);
            }
            if (typeof programSource == "string") {
                throw (`Program ${programObject.id()} already exists on the network, please rename your program`);
            }
        } catch (e: any) {
            logAndThrow(`Error validating program: ${e.message}`);
        }

        // Get the private key from the account if it is not provided in the parameters
        let deploymentPrivateKey = privateKey;
        if (typeof privateKey === "undefined" && typeof this.account !== "undefined") {
            deploymentPrivateKey = this.account.privateKey();
        }

        if (typeof deploymentPrivateKey === "undefined") {
            throw("No private key provided and no private key set in the ProgramManager");
        }

        // Get the fee record from the account if it is not provided in the parameters
        try {
            feeRecord = privateFee ? <RecordPlaintext>await this.getCreditsRecord(fee, [], feeRecord, recordSearchParams) : undefined;
        } catch (e: any) {
            logAndThrow(`Error finding fee record. Record finder response: '${e.message}'. Please ensure you're connected to a valid Aleo network and a record with enough balance exists.`);
        }

        // Get the proving and verifying keys from the key provider
        let feeKeys;
        try {
            feeKeys = privateFee ? <FunctionKeyPair>await this.keyProvider.feePrivateKeys() : <FunctionKeyPair>await this.keyProvider.feePublicKeys();
        } catch (e: any) {
            logAndThrow(`Error finding fee keys. Key finder response: '${e.message}'. Please ensure your key provider is configured correctly.`);
        }
        const [feeProvingKey, feeVerifyingKey] = feeKeys;

        // Resolve the program imports if they exist
        let imports;
        try {
            imports = await this.networkClient.getProgramImports(program);
        } catch (e: any) {
            logAndThrow(`Error finding program imports. Network response: '${e.message}'. Please ensure you're connected to a valid Aleo network and the program is deployed to the network.`);
        }

        // Build a deployment transaction and submit it to the network
        const tx = await WasmProgramManager.buildDeploymentTransaction(deploymentPrivateKey, program, fee, feeRecord, this.host, imports, feeProvingKey, feeVerifyingKey);
        return await this.networkClient.submitTransaction(tx);
    }

    /**
     * Builds an execution transaction for submission to the Aleo network.
     *
     * @param {ExecuteOptions} options - The options for the execution transaction.
     * @returns {Promise<Transaction>} - A promise that resolves to the transaction or an error.
     *
     * @example
     * // Create a new NetworkClient, KeyProvider, and RecordProvider using official Aleo record, key, and network providers
     * const networkClient = new AleoNetworkClient("https://api.explorer.provable.com/v1");
     * const keyProvider = new AleoKeyProvider();
     * keyProvider.useCache = true;
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for executions
     * const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);
     *
     * // Build and execute the transaction
     * const transaction = await programManager.buildExecutionTransaction({
     *   programName: "hello_hello.aleo",
     *   functionName: "hello_hello",
     *   fee: 0.020,
     *   privateFee: false,
     *   inputs: ["5u32", "5u32"],
     *   keySearchParams: { "cacheKey": "hello_hello:hello" }
     * });
     * const result = await programManager.networkClient.submitTransaction(transaction);
     */
    async buildExecutionTransaction(options: ExecuteOptions): Promise<Transaction> {
        // Destructure the options object to access the parameters
        const {
            programName,
            functionName,
            fee,
            privateFee,
            inputs,
            recordSearchParams,
            keySearchParams,
            privateKey,
            offlineQuery
        } = options;

        let feeRecord = options.feeRecord;
        let provingKey = options.provingKey;
        let verifyingKey = options.verifyingKey;
        let program = options.program;
        let imports = options.imports;

        // Ensure the function exists on the network
        if (program === undefined) {
            try {
                program = <string>(await this.networkClient.getProgram(programName));
            } catch (e: any) {
                logAndThrow(`Error finding ${programName}. Network response: '${e.message}'. Please ensure you're connected to a valid Aleo network the program is deployed to the network.`);
            }
        } else if (program instanceof Program) {
            program = program.toString();
        }

        // Get the private key from the account if it is not provided in the parameters
        let executionPrivateKey = privateKey;
        if (typeof privateKey === "undefined" && typeof this.account !== "undefined") {
            executionPrivateKey = this.account.privateKey();
        }

        if (typeof executionPrivateKey === "undefined") {
            throw("No private key provided and no private key set in the ProgramManager");
        }

        // Get the fee record from the account if it is not provided in the parameters
        try {
            feeRecord = privateFee ? <RecordPlaintext>await this.getCreditsRecord(fee, [], feeRecord, recordSearchParams) : undefined;
        } catch (e: any) {
            logAndThrow(`Error finding fee record. Record finder response: '${e.message}'. Please ensure you're connected to a valid Aleo network and a record with enough balance exists.`);
        }

        // Get the fee proving and verifying keys from the key provider
        let feeKeys;
        try {
            feeKeys = privateFee ? <FunctionKeyPair>await this.keyProvider.feePrivateKeys() : <FunctionKeyPair>await this.keyProvider.feePublicKeys();
        } catch (e: any) {
            logAndThrow(`Error finding fee keys. Key finder response: '${e.message}'. Please ensure your key provider is configured correctly.`);
        }
        const [feeProvingKey, feeVerifyingKey] = feeKeys;

        // If the function proving and verifying keys are not provided, attempt to find them using the key provider
        if (!provingKey || !verifyingKey) {
            try {
                [provingKey, verifyingKey] = <FunctionKeyPair>await this.keyProvider.functionKeys(keySearchParams);
            } catch (e) {
                console.log(`Function keys not found. Key finder response: '${e}'. The function keys will be synthesized`)
            }
        }

        // Resolve the program imports if they exist
        const numberOfImports = Program.fromString(program).getImports().length;
        if (numberOfImports > 0 && !imports) {
            try {
                imports = <ProgramImports>await this.networkClient.getProgramImports(programName);
            } catch (e: any) {
                logAndThrow(`Error finding program imports. Network response: '${e.message}'. Please ensure you're connected to a valid Aleo network and the program is deployed to the network.`);
            }
        }

        // Build an execution transaction and submit it to the network
        return await WasmProgramManager.buildExecutionTransaction(executionPrivateKey, program, functionName, inputs, fee, feeRecord, this.host, imports, provingKey, verifyingKey, feeProvingKey, feeVerifyingKey, offlineQuery);
    }

    /**
     * Builds an execution transaction for submission to the Aleo network.
     *
     * @param {ExecuteOptions} options - The options for the execution transaction.
     * @returns {Promise<Transaction>} - A promise that resolves to the transaction or an error.
     *
     * @example
     * // Create a new NetworkClient, KeyProvider, and RecordProvider using official Aleo record, key, and network providers
     * const networkClient = new AleoNetworkClient("https://api.explorer.provable.com/v1");
     * const keyProvider = new AleoKeyProvider();
     * keyProvider.useCache = true;
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for executions
     * const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);
     *
     * // Build and execute the transaction
     * const transaction = await programManager.execute({
     *   programName: "hello_hello.aleo",
     *   functionName: "hello_hello",
     *   fee: 0.020,
     *   privateFee: false,
     *   inputs: ["5u32", "5u32"],
     *   keySearchParams: { "cacheKey": "hello_hello:hello" }
     * });
     * const result = await programManager.networkClient.submitTransaction(transaction);
     */
    async execute(options: ExecuteOptions): Promise<string> {
        const tx = <Transaction>await this.buildExecutionTransaction(options);
        return await this.networkClient.submitTransaction(tx);
    }

    /**
     * Run an Aleo program in offline mode
     *
     * @param {string} program Program source code containing the function to be executed
     * @param {string} function_name Function name to execute
     * @param {string[]} inputs Inputs to the function
     * @param {number} proveExecution Whether to prove the execution of the function and return an execution transcript
     * that contains the proof.
     * @param {string[] | undefined} imports Optional imports to the program
     * @param {KeySearchParams | undefined} keySearchParams Optional parameters for finding the matching proving &
     * verifying keys for the function
     * @param {ProvingKey | undefined} provingKey Optional proving key to use for the transaction
     * @param {VerifyingKey | undefined} verifyingKey Optional verifying key to use for the transaction
     * @param {PrivateKey | undefined} privateKey Optional private key to use for the transaction
     * @param {OfflineQuery | undefined} offlineQuery Optional offline query if creating transactions in an offline environment
     * @returns {Promise<string>}
     *
     * @example
     * import { Account, Program } from '@provablehq/sdk';
     *
     * /// Create the source for the "helloworld" program
     * const program = "program helloworld.aleo;\n\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n";
     * const programManager = new ProgramManager();
     *
     * /// Create a temporary account for the execution of the program
     * const account = new Account();
     * programManager.setAccount(account);
     *
     * /// Get the response and ensure that the program executed correctly
     * const executionResponse = await programManager.run(program, "hello", ["5u32", "5u32"]);
     * const result = executionResponse.getOutputs();
     * assert(result === ["10u32"]);
     */
    async run(
        program: string,
        function_name: string,
        inputs: string[],
        proveExecution: boolean,
        imports?: ProgramImports,
        keySearchParams?: KeySearchParams,
        provingKey?: ProvingKey,
        verifyingKey?: VerifyingKey,
        privateKey?: PrivateKey,
        offlineQuery?: OfflineQuery,
    ): Promise<ExecutionResponse> {
        // Get the private key from the account if it is not provided in the parameters
        let executionPrivateKey = privateKey;
        if (typeof privateKey === "undefined" && typeof this.account !== "undefined") {
            executionPrivateKey = this.account.privateKey();
        }

        if (typeof executionPrivateKey === "undefined") {
            throw("No private key provided and no private key set in the ProgramManager");
        }

        // If the function proving and verifying keys are not provided, attempt to find them using the key provider
        if (!provingKey || !verifyingKey) {
            try {
                [provingKey, verifyingKey] = <FunctionKeyPair>await this.keyProvider.functionKeys(keySearchParams);
            } catch (e) {
                console.log(`Function keys not found. Key finder response: '${e}'. The function keys will be synthesized`)
            }
        }

        // Run the program offline and return the result
        console.log("Running program offline")
        console.log("Proving key: ", provingKey);
        console.log("Verifying key: ", verifyingKey);
        return WasmProgramManager.executeFunctionOffline(executionPrivateKey, program, function_name, inputs, proveExecution, false, imports, provingKey, verifyingKey, this.host, offlineQuery);
    }

    /**
     * Join two credits records into a single credits record
     *
     * @param {RecordPlaintext | string} recordOne First credits record to join
     * @param {RecordPlaintext | string} recordTwo Second credits record to join
     * @param {number} fee Fee in credits pay for the join transaction
     * @param {boolean} privateFee Use a private record to pay the fee. If false this will use the account's public credit balance
     * @param {RecordSearchParams | undefined} recordSearchParams Optional parameters for finding the fee record to use
     * to pay the fee for the join transaction
     * @param {RecordPlaintext | string | undefined} feeRecord Fee record to use for the join transaction
     * @param {PrivateKey | undefined} privateKey Private key to use for the join transaction
     * @param {OfflineQuery | undefined} offlineQuery Optional offline query if creating transactions in an offline environment
     * @returns {Promise<string>}
     */
    async join(
        recordOne: RecordPlaintext | string,
        recordTwo: RecordPlaintext | string,
        fee: number,
        privateFee: boolean,
        recordSearchParams?: RecordSearchParams | undefined,
        feeRecord?: RecordPlaintext | string | undefined,
        privateKey?: PrivateKey,
        offlineQuery?: OfflineQuery,
    ): Promise<string> {
        // Get the private key from the account if it is not provided in the parameters
        let executionPrivateKey = privateKey;
        if (typeof privateKey === "undefined" && typeof this.account !== "undefined") {
            executionPrivateKey = this.account.privateKey();
        }

        if (typeof executionPrivateKey === "undefined") {
            throw("No private key provided and no private key set in the ProgramManager");
        }

        // Get the proving and verifying keys from the key provider
        let feeKeys;
        let joinKeys
        try {
            feeKeys = privateFee ? <FunctionKeyPair>await this.keyProvider.feePrivateKeys() : <FunctionKeyPair>await this.keyProvider.feePublicKeys();
            joinKeys = <FunctionKeyPair>await this.keyProvider.joinKeys();
        } catch (e: any) {
            logAndThrow(`Error finding fee keys. Key finder response: '${e.message}'. Please ensure your key provider is configured correctly.`);
        }
        const [feeProvingKey, feeVerifyingKey] = feeKeys;
        const [joinProvingKey, joinVerifyingKey] = joinKeys;

        // Get the fee record from the account if it is not provided in the parameters
        try {
            feeRecord = privateFee ? <RecordPlaintext>await this.getCreditsRecord(fee, [], feeRecord, recordSearchParams) : undefined;
        } catch (e: any) {
            logAndThrow(`Error finding fee record. Record finder response: '${e.message}'. Please ensure you're connected to a valid Aleo network and a record with enough balance exists.`);
        }

        // Validate the records provided are valid plaintext records
        try {
            recordOne = recordOne instanceof RecordPlaintext ? recordOne : RecordPlaintext.fromString(recordOne);
            recordTwo = recordTwo instanceof RecordPlaintext ? recordTwo : RecordPlaintext.fromString(recordTwo);
        } catch (e: any) {
            logAndThrow('Records provided are not valid. Please ensure they are valid plaintext records.')
        }

        // Build an execution transaction and submit it to the network
        const tx = await WasmProgramManager.buildJoinTransaction(executionPrivateKey, recordOne, recordTwo, fee, feeRecord, this.host, joinProvingKey, joinVerifyingKey, feeProvingKey, feeVerifyingKey, offlineQuery);
        return await this.networkClient.submitTransaction(tx);
    }

    /**
     * Split credits into two new credits records
     *
     * @param {number} splitAmount Amount in microcredits to split from the original credits record
     * @param {RecordPlaintext | string} amountRecord Amount record to use for the split transaction
     * @param {PrivateKey | undefined} privateKey Optional private key to use for the split transaction
     * @param {OfflineQuery | undefined} offlineQuery Optional offline query if creating transactions in an offline environment
     * @returns {Promise<string>}
     *
     * @example
     * // Create a new NetworkClient, KeyProvider, and RecordProvider
     * const networkClient = new AleoNetworkClient("https://api.explorer.provable.com/v1");
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for executions
     * const programName = "hello_hello.aleo";
     * const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);
     * const record = "{  owner: aleo184vuwr5u7u0ha5f5k44067dd2uaqewxx6pe5ltha5pv99wvhfqxqv339h4.private,  microcredits: 45000000u64.private,  _nonce: 4106205762862305308495708971985748592380064201230396559307556388725936304984group.public}"
     * const tx_id = await programManager.split(25000000, record);
     * const transaction = await programManager.networkClient.getTransaction(tx_id);
     */
    async split(splitAmount: number, amountRecord: RecordPlaintext | string, privateKey?: PrivateKey, offlineQuery?: OfflineQuery): Promise<string> {
        // Get the private key from the account if it is not provided in the parameters
        let executionPrivateKey = privateKey;
        if (typeof executionPrivateKey === "undefined" && typeof this.account !== "undefined") {
            executionPrivateKey = this.account.privateKey();
        }

        if (typeof executionPrivateKey === "undefined") {
            throw("No private key provided and no private key set in the ProgramManager");
        }

        // Get the split keys from the key provider
        let splitKeys;
        try {
            splitKeys = <FunctionKeyPair>await this.keyProvider.splitKeys();
        } catch (e: any) {
            logAndThrow(`Error finding fee keys. Key finder response: '${e.message}'. Please ensure your key provider is configured correctly.`);
        }
        const [splitProvingKey, splitVerifyingKey] = splitKeys;

        // Validate the record to be split
        try {
            amountRecord = amountRecord instanceof RecordPlaintext ? amountRecord : RecordPlaintext.fromString(amountRecord);
        } catch (e: any) {
            logAndThrow("Record provided is not valid. Please ensure it is a valid plaintext record.");
        }

        // Build an execution transaction and submit it to the network
        const tx = await WasmProgramManager.buildSplitTransaction(executionPrivateKey, splitAmount, amountRecord, this.host, splitProvingKey, splitVerifyingKey, offlineQuery);
        return await this.networkClient.submitTransaction(tx);
    }

    /**
     * Pre-synthesize proving and verifying keys for a program
     *
     * @param program {string} The program source code to synthesize keys for
     * @param function_id {string} The function id to synthesize keys for
     * @param inputs {Array<string>}  Sample inputs to the function
     * @param privateKey {PrivateKey | undefined} Optional private key to use for the key synthesis
     *
     * @returns {Promise<FunctionKeyPair>}
     */
    async synthesizeKeys(
        program: string,
        function_id: string,
        inputs: Array<string>,
        privateKey?: PrivateKey,
    ): Promise<FunctionKeyPair> {
        // Resolve the program imports if they exist
        let imports;

        let executionPrivateKey = privateKey;
        if (typeof executionPrivateKey === "undefined") {
            if (typeof this.account !== "undefined") {
                executionPrivateKey = this.account.privateKey();
            } else {
                executionPrivateKey = new PrivateKey();
            }
        }

        // Attempt to run an offline execution of the program and extract the proving and verifying keys
        try {
            imports = await this.networkClient.getProgramImports(program);
            const keyPair = await WasmProgramManager.synthesizeKeyPair(
                executionPrivateKey,
                program,
                function_id,
                inputs,
                imports
            );
            return [<ProvingKey>keyPair.provingKey(), <VerifyingKey>keyPair.verifyingKey()];
        } catch (e: any) {
            logAndThrow(`Could not synthesize keys - error ${e.message}. Please ensure the program is valid and the inputs are correct.`);
        }
    }

    /**
     * Build a transaction to transfer credits to another account for later submission to the Aleo network
     *
     * @param {number} amount The amount of credits to transfer
     * @param {string} recipient The recipient of the transfer
     * @param {string} transferType The type of transfer to perform - options: 'private', 'privateToPublic', 'public', 'publicToPrivate'
     * @param {number} fee The fee to pay for the transfer
     * @param {boolean} privateFee Use a private record to pay the fee. If false this will use the account's public credit balance
     * @param {RecordSearchParams | undefined} recordSearchParams Optional parameters for finding the amount and fee
     * records for the transfer transaction
     * @param {RecordPlaintext | string} amountRecord Optional amount record to use for the transfer
     * @param {RecordPlaintext | string} feeRecord Optional fee record to use for the transfer
     * @param {PrivateKey | undefined} privateKey Optional private key to use for the transfer transaction
     * @param {OfflineQuery | undefined} offlineQuery Optional offline query if creating transactions in an offline environment
     * @returns {Promise<string>} The transaction id of the transfer transaction
     *
     * @example
     * // Create a new NetworkClient, KeyProvider, and RecordProvider
     * const networkClient = new AleoNetworkClient("https://api.explorer.provable.com/v1");
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for executions
     * const programName = "hello_hello.aleo";
     * const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);
     * await programManager.initialize();
     * const tx_id = await programManager.transfer(1, "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", "private", 0.2)
     * const transaction = await programManager.networkClient.getTransaction(tx_id);
     */
    async buildTransferTransaction(
        amount: number,
        recipient: string,
        transferType: string,
        fee: number,
        privateFee: boolean,
        recordSearchParams?: RecordSearchParams,
        amountRecord?: RecordPlaintext | string,
        feeRecord?: RecordPlaintext | string,
        privateKey?: PrivateKey,
        offlineQuery?: OfflineQuery
    ): Promise<Transaction> {
        // Validate the transfer type
        transferType = <string>validateTransferType(transferType);

        // Get the private key from the account if it is not provided in the parameters
        let executionPrivateKey = privateKey;
        if (typeof executionPrivateKey === "undefined" && typeof this.account !== "undefined") {
            executionPrivateKey = this.account.privateKey();
        }

        if (typeof executionPrivateKey === "undefined") {
            throw("No private key provided and no private key set in the ProgramManager");
        }

        // Get the proving and verifying keys from the key provider
        let feeKeys;
        let transferKeys
        try {
            feeKeys = privateFee ? <FunctionKeyPair>await this.keyProvider.feePrivateKeys() : <FunctionKeyPair>await this.keyProvider.feePublicKeys();
            transferKeys = <FunctionKeyPair>await this.keyProvider.transferKeys(transferType);
        } catch (e: any) {
            logAndThrow(`Error finding fee keys. Key finder response: '${e.message}'. Please ensure your key provider is configured correctly.`);
        }
        const [feeProvingKey, feeVerifyingKey] = feeKeys;
        const [transferProvingKey, transferVerifyingKey] = transferKeys;

        // Get the amount and fee record from the account if it is not provided in the parameters
        try {
            // Track the nonces of the records found so no duplicate records are used
            const nonces: string[] = [];
            if (requiresAmountRecord(transferType)) {
                // If the transfer type is private and requires an amount record, get it from the record provider
                amountRecord = <RecordPlaintext>await this.getCreditsRecord(fee, [], amountRecord, recordSearchParams);
                nonces.push(amountRecord.nonce());
            } else {
                amountRecord = undefined;
            }
            feeRecord = privateFee ? <RecordPlaintext>await this.getCreditsRecord(fee, nonces, feeRecord, recordSearchParams) : undefined;
        } catch (e: any) {
            logAndThrow(`Error finding fee record. Record finder response: '${e.message}'. Please ensure you're connected to a valid Aleo network and a record with enough balance exists.`);
        }

        // Build an execution transaction and submit it to the network
        return await WasmProgramManager.buildTransferTransaction(executionPrivateKey, amount, recipient, transferType, amountRecord, fee, feeRecord, this.host, transferProvingKey, transferVerifyingKey, feeProvingKey, feeVerifyingKey, offlineQuery);
    }

    /**
     * Build a transfer_public transaction to transfer credits to another account for later submission to the Aleo network
     *
     * @param {number} amount The amount of credits to transfer
     * @param {string} recipient The recipient of the transfer
     * @param {string} transferType The type of transfer to perform - options: 'private', 'privateToPublic', 'public', 'publicToPrivate'
     * @param {number} fee The fee to pay for the transfer
     * @param {boolean} privateFee Use a private record to pay the fee. If false this will use the account's public credit balance
     * @param {RecordSearchParams | undefined} recordSearchParams Optional parameters for finding the amount and fee
     * records for the transfer transaction
     * @param {RecordPlaintext | string} amountRecord Optional amount record to use for the transfer
     * @param {RecordPlaintext | string} feeRecord Optional fee record to use for the transfer
     * @param {PrivateKey | undefined} privateKey Optional private key to use for the transfer transaction
     * @param {OfflineQuery | undefined} offlineQuery Optional offline query if creating transactions in an offline environment
     * @returns {Promise<string>} The transaction id of the transfer transaction
     */
    async buildTransferPublicTransaction(
        amount: number,
        recipient: string,
        fee: number,
        privateKey?: PrivateKey,
        offlineQuery?: OfflineQuery
    ): Promise<Transaction> {
        return this.buildTransferTransaction(amount, recipient, "public", fee, false, undefined, undefined, undefined, privateKey, offlineQuery);
    }

    /**
     * Build a transfer_public_as_signer transaction to transfer credits to another account for later submission to the Aleo network
     *
     * @param {number} amount The amount of credits to transfer
     * @param {string} recipient The recipient of the transfer
     * @param {string} transferType The type of transfer to perform - options: 'private', 'privateToPublic', 'public', 'publicToPrivate'
     * @param {number} fee The fee to pay for the transfer
     * @param {boolean} privateFee Use a private record to pay the fee. If false this will use the account's public credit balance
     * @param {RecordSearchParams | undefined} recordSearchParams Optional parameters for finding the amount and fee
     * records for the transfer transaction
     * @param {RecordPlaintext | string} amountRecord Optional amount record to use for the transfer
     * @param {RecordPlaintext | string} feeRecord Optional fee record to use for the transfer
     * @param {PrivateKey | undefined} privateKey Optional private key to use for the transfer transaction
     * @param {OfflineQuery | undefined} offlineQuery Optional offline query if creating transactions in an offline environment
     * @returns {Promise<string>} The transaction id of the transfer transaction
     */
    async buildTransferPublicAsSignerTransaction(
        amount: number,
        recipient: string,
        fee: number,
        privateKey?: PrivateKey,
        offlineQuery?: OfflineQuery
    ): Promise<Transaction> {
        return this.buildTransferTransaction(amount, recipient, "public", fee, false, undefined, undefined, undefined, privateKey, offlineQuery);
    }

    /**
     * Transfer credits to another account
     *
     * @param {number} amount The amount of credits to transfer
     * @param {string} recipient The recipient of the transfer
     * @param {string} transferType The type of transfer to perform - options: 'private', 'privateToPublic', 'public', 'publicToPrivate'
     * @param {number} fee The fee to pay for the transfer
     * @param {boolean} privateFee Use a private record to pay the fee. If false this will use the account's public credit balance
     * @param {RecordSearchParams | undefined} recordSearchParams Optional parameters for finding the amount and fee
     * records for the transfer transaction
     * @param {RecordPlaintext | string} amountRecord Optional amount record to use for the transfer
     * @param {RecordPlaintext | string} feeRecord Optional fee record to use for the transfer
     * @param {PrivateKey | undefined} privateKey Optional private key to use for the transfer transaction
     * @param {OfflineQuery | undefined} offlineQuery Optional offline query if creating transactions in an offline environment
     * @returns {Promise<string>} The transaction id of the transfer transaction
     *
     * @example
     * // Create a new NetworkClient, KeyProvider, and RecordProvider
     * const networkClient = new AleoNetworkClient("https://api.explorer.provable.com/v1");
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for executions
     * const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);
     * await programManager.initialize();
     * const tx_id = await programManager.transfer(1, "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", "private", 0.2)
     * const transaction = await programManager.networkClient.getTransaction(tx_id);
     */
    async transfer(
        amount: number,
        recipient: string,
        transferType: string,
        fee: number,
        privateFee: boolean,
        recordSearchParams?: RecordSearchParams,
        amountRecord?: RecordPlaintext | string,
        feeRecord?: RecordPlaintext | string,
        privateKey?: PrivateKey,
        offlineQuery?: OfflineQuery
    ): Promise<string> {
        const tx = <Transaction>await this.buildTransferTransaction(amount, recipient, transferType, fee, privateFee, recordSearchParams, amountRecord, feeRecord, privateKey, offlineQuery);
        return await this.networkClient.submitTransaction(tx);
    }

    /**
     * Build transaction to bond credits to a validator for later submission to the Aleo Network
     *
     * @example
     * // Create a keyProvider to handle key management
     * const keyProvider = new AleoKeyProvider();
     * keyProvider.useCache = true;
     *
     * // Create a new ProgramManager with the key that will be used to bond credits
     * const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, undefined);
     * programManager.setAccount(new Account("YourPrivateKey"));
     *
     * // Create the bonding transaction object for later submission
     * const tx = await programManager.buildBondPublicTransaction("aleo1jx8s4dvjepculny4wfrzwyhs3tlyv65r58ns3g6q2gm2esh7ps8sqy9s5j", "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", "aleo1feya8sjy9k2zflvl2dx39pdsq5tju28elnp2ektnn588uu9ghv8s84msv9", 2000000);
     * console.log(tx);
     *
     * // The transaction can be later submitted to the network using the network client.
     * const result = await programManager.networkClient.submitTransaction(tx);
     *
     * @returns string
     * @param {string} staker_address Address of the staker who is bonding the credits
     * @param {string} validator_address Address of the validator to bond to, if this address is the same as the staker (i.e. the
     * executor of this function), it will attempt to bond the credits as a validator. Bonding as a validator currently
     * requires a minimum of 10,000,000 credits to bond (subject to change). If the address is specified is an existing
     * validator and is different from the address of the executor of this function, it will bond the credits to that
     * validator's staking committee as a delegator. A minimum of 10 credits is required to bond as a delegator.
     * @param {string} withdrawal_address Address to withdraw the staked credits to when unbond_public is called.
     * @param {number} amount The amount of credits to bond
     * @param {Partial<ExecuteOptions>} options - Override default execution options.
     */
    async buildBondPublicTransaction(staker_address: string, validator_address: string, withdrawal_address: string, amount: number, options: Partial<ExecuteOptions> = {}) {
        const scaledAmount = Math.trunc(amount * 1000000);

        const {
            programName = "credits.aleo",
            functionName = "bond_public",
            fee = options.fee || 0.86,
            privateFee = false,
            inputs = [staker_address, validator_address, withdrawal_address, `${scaledAmount.toString()}u64`],
            keySearchParams = new AleoKeyProviderParams({
                proverUri: CREDITS_PROGRAM_KEYS.bond_public.prover,
                verifierUri: CREDITS_PROGRAM_KEYS.bond_public.verifier,
                cacheKey: "credits.aleo/bond_public"
            }),
            program = this.creditsProgram(),
            ...additionalOptions
        } = options;

        const executeOptions: ExecuteOptions = {
            programName,
            functionName,
            fee,
            privateFee,
            inputs,
            keySearchParams,
            ...additionalOptions
        };

        return await this.buildExecutionTransaction(executeOptions);
    }

    /**
     * Bond credits to validator.
     *
     * @example
     * // Create a keyProvider to handle key management
     * const keyProvider = new AleoKeyProvider();
     * keyProvider.useCache = true;
     *
     * // Create a new ProgramManager with the key that will be used to bond credits
     * const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, undefined);
     * programManager.setAccount(new Account("YourPrivateKey"));
     *
     * // Create the bonding transaction
     * const tx_id = await programManager.bondPublic("aleo1jx8s4dvjepculny4wfrzwyhs3tlyv65r58ns3g6q2gm2esh7ps8sqy9s5j", "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", "aleo1feya8sjy9k2zflvl2dx39pdsq5tju28elnp2ektnn588uu9ghv8s84msv9", 2000000);
     *
     * @returns string
     * @param {string} staker_address Address of the staker who is bonding the credits
     * @param {string} validator_address Address of the validator to bond to, if this address is the same as the signer (i.e. the
     * executor of this function), it will attempt to bond the credits as a validator. Bonding as a validator currently
     * requires a minimum of 1,000,000 credits to bond (subject to change). If the address is specified is an existing
     * validator and is different from the address of the executor of this function, it will bond the credits to that
     * validator's staking committee as a delegator. A minimum of 10 credits is required to bond as a delegator.
     * @param {string} withdrawal_address Address to withdraw the staked credits to when unbond_public is called.
     * @param {number} amount The amount of credits to bond
     * @param {Options} options Options for the execution
     */
    async bondPublic(staker_address: string, validator_address: string, withdrawal_address:string, amount: number, options: Partial<ExecuteOptions> = {}) {
        const tx = <Transaction>await this.buildBondPublicTransaction(staker_address, validator_address, withdrawal_address, amount, options);
        return await this.networkClient.submitTransaction(tx);
    }

    /**
     * Build a bond_validator transaction for later submission to the Aleo Network.
     *
     * @example
     * // Create a keyProvider to handle key management
     * const keyProvider = new AleoKeyProvider();
     * keyProvider.useCache = true;
     *
     * // Create a new ProgramManager with the key that will be used to bond credits
     * const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, undefined);
     * programManager.setAccount(new Account("YourPrivateKey"));
     *
     * // Create the bond validator transaction object for later use.
     * const tx = await programManager.buildBondValidatorTransaction("aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", "aleo1feya8sjy9k2zflvl2dx39pdsq5tju28elnp2ektnn588uu9ghv8s84msv9", 2000000);
     * console.log(tx);
     *
     * // The transaction can later be submitted to the network using the network client.
     * const tx_id = await programManager.networkClient.submitTransaction(tx);
     *
     * @returns string
     * @param {string} validator_address Address of the validator to bond to, if this address is the same as the staker (i.e. the
     * executor of this function), it will attempt to bond the credits as a validator. Bonding as a validator currently
     * requires a minimum of 10,000,000 credits to bond (subject to change). If the address is specified is an existing
     * validator and is different from the address of the executor of this function, it will bond the credits to that
     * validator's staking committee as a delegator. A minimum of 10 credits is required to bond as a delegator.
     * @param {string} withdrawal_address Address to withdraw the staked credits to when unbond_public is called.
     * @param {number} amount The amount of credits to bond
     * @param {number} commission The commission rate for the validator (must be between 0 and 100 - an error will be thrown if it is not)
     * @param {Partial<ExecuteOptions>} options - Override default execution options.
     */
    async buildBondValidatorTransaction(validator_address: string, withdrawal_address: string, amount: number, commission: number, options: Partial<ExecuteOptions> = {}) {
        const scaledAmount = Math.trunc(amount * 1000000);

        const adjustedCommission = Math.trunc(commission)

        const {
            programName = "credits.aleo",
            functionName = "bond_validator",
            fee = options.fee || 0.86,
            privateFee = false,
            inputs = [validator_address, withdrawal_address, `${scaledAmount.toString()}u64`, `${adjustedCommission.toString()}u8`],
            keySearchParams = new AleoKeyProviderParams({
                proverUri: CREDITS_PROGRAM_KEYS.bond_validator.prover,
                verifierUri: CREDITS_PROGRAM_KEYS.bond_validator.verifier,
                cacheKey: "credits.aleo/bond_validator"
            }),
            program = this.creditsProgram(),
            ...additionalOptions
        } = options;

        const executeOptions: ExecuteOptions = {
            programName,
            functionName,
            fee,
            privateFee,
            inputs,
            keySearchParams,
            ...additionalOptions
        };

        return await this.buildExecutionTransaction(executeOptions);
    }

    /**
     * Build transaction to bond a validator.
     *
     * @example
     * // Create a keyProvider to handle key management
     * const keyProvider = new AleoKeyProvider();
     * keyProvider.useCache = true;
     *
     * // Create a new ProgramManager with the key that will be used to bond credits
     * const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, undefined);
     * programManager.setAccount(new Account("YourPrivateKey"));
     *
     * // Create the bonding transaction
     * const tx_id = await programManager.bondValidator("aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", "aleo1feya8sjy9k2zflvl2dx39pdsq5tju28elnp2ektnn588uu9ghv8s84msv9", 2000000);
     *
     * @returns string
     * @param {string} validator_address Address of the validator to bond to, if this address is the same as the staker (i.e. the
     * executor of this function), it will attempt to bond the credits as a validator. Bonding as a validator currently
     * requires a minimum of 10,000,000 credits to bond (subject to change). If the address is specified is an existing
     * validator and is different from the address of the executor of this function, it will bond the credits to that
     * validator's staking committee as a delegator. A minimum of 10 credits is required to bond as a delegator.
     * @param {string} withdrawal_address Address to withdraw the staked credits to when unbond_public is called.
     * @param {number} amount The amount of credits to bond
     * @param {number} commission The commission rate for the validator (must be between 0 and 100 - an error will be thrown if it is not)
     * @param {Partial<ExecuteOptions>} options - Override default execution options.
     */
    async bondValidator(validator_address: string, withdrawal_address: string, amount: number, commission: number, options: Partial<ExecuteOptions> = {}) {
        const tx = <Transaction>await this.buildBondValidatorTransaction(validator_address, withdrawal_address, amount, commission, options);
        return await this.networkClient.submitTransaction(tx);
    }

    /**
     * Build a transaction to unbond public credits from a validator in the Aleo network.
     *
     * @param {string} staker_address - The address of the staker who is unbonding the credits.
     * @param {number} amount - The amount of credits to unbond (scaled by 1,000,000).
     * @param {Partial<ExecuteOptions>} options - Override default execution options.
     * @returns {Promise<Transaction>} - A promise that resolves to the transaction or an error message.
     *
     * @example
     * // Create a keyProvider to handle key management.
     * const keyProvider = new AleoKeyProvider();
     * keyProvider.useCache = true;
     *
     * // Create a new ProgramManager with the key that will be used to unbond credits.
     * const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, undefined);
     * const tx = await programManager.buildUnbondPublicTransaction("aleo1jx8s4dvjepculny4wfrzwyhs3tlyv65r58ns3g6q2gm2esh7ps8sqy9s5j", 2000000);
     * console.log(tx);
     *
     * // The transaction can be submitted later to the network using the network client.
     * programManager.networkClient.submitTransaction(tx);
     */
    async buildUnbondPublicTransaction(staker_address: string, amount: number, options: Partial<ExecuteOptions> = {}): Promise<Transaction> {
        const scaledAmount = Math.trunc(amount * 1000000);

        const {
            programName = "credits.aleo",
            functionName = "unbond_public",
            fee = options.fee || 1.3,
            privateFee = false,
            inputs = [staker_address, `${scaledAmount.toString()}u64`],
            keySearchParams = new AleoKeyProviderParams({
                proverUri: CREDITS_PROGRAM_KEYS.unbond_public.prover,
                verifierUri: CREDITS_PROGRAM_KEYS.unbond_public.verifier,
                cacheKey: "credits.aleo/unbond_public"
            }),
            program = this.creditsProgram(),
            ...additionalOptions
        } = options;

        const executeOptions: ExecuteOptions = {
            programName,
            functionName,
            fee,
            privateFee,
            inputs,
            keySearchParams,
            ...additionalOptions
        };

        return this.buildExecutionTransaction(executeOptions);
    }

    /**
     * Unbond a specified amount of staked credits.
     *
     * @example
     * // Create a keyProvider to handle key management
     * const keyProvider = new AleoKeyProvider();
     * keyProvider.useCache = true;
     *
     * // Create a new ProgramManager with the key that will be used to bond credits
     * const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, undefined);
     * programManager.setAccount(new Account("YourPrivateKey"));
     *
     * // Create the bonding transaction and send it to the network
     * const tx_id = await programManager.unbondPublic("aleo1jx8s4dvjepculny4wfrzwyhs3tlyv65r58ns3g6q2gm2esh7ps8sqy9s5j", 10);
     *
     * @returns string
     * @param {string} staker_address Address of the staker who is unbonding the credits
     * @param {number} amount Amount of credits to unbond. If the address of the executor of this function is an
     * existing validator, it will subtract this amount of credits from the validator's staked credits. If there are
     * less than 1,000,000 credits staked pool after the unbond, the validator will be removed from the validator set.
     * If the address of the executor of this function is not a validator and has credits bonded as a delegator, it will
     * subtract this amount of credits from the delegator's staked credits. If there are less than 10 credits bonded
     * after the unbond operation, the delegator will be removed from the validator's staking pool.
     * @param {ExecuteOptions} options Options for the execution
     */
    async unbondPublic(staker_address: string, amount: number, options: Partial<ExecuteOptions> = {}): Promise<string> {
        const tx = <Transaction>await this.buildUnbondPublicTransaction(staker_address, amount, options);
        return await this.networkClient.submitTransaction(tx);
    }

    /**
     * Build a transaction to claim unbonded public credits in the Aleo network.
     *
     * @param {string} staker_address - The address of the staker who is claiming the credits.
     * @param {Partial<ExecuteOptions>} options - Override default execution options.
     * @returns {Promise<Transaction>} - A promise that resolves to the transaction or an error message.
     *
     * @example
     * // Create a keyProvider to handle key management
     * const keyProvider = new AleoKeyProvider();
     * keyProvider.useCache = true;
     *
     * // Create a new ProgramManager with the key that will be used to claim unbonded credits.
     * const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, undefined);
     *
     * // Create the claim unbonded transaction object for later use.
     * const tx = await programManager.buildClaimUnbondPublicTransaction("aleo1jx8s4dvjepculny4wfrzwyhs3tlyv65r58ns3g6q2gm2esh7ps8sqy9s5j");
     * console.log(tx);
     *
     * // The transaction can be submitted later to the network using the network client.
     * programManager.networkClient.submitTransaction(tx);
     */
    async buildClaimUnbondPublicTransaction(staker_address: string, options: Partial<ExecuteOptions> = {}): Promise<Transaction> {
        const {
            programName = "credits.aleo",
            functionName = "claim_unbond_public",
            fee = options.fee || 2,
            privateFee = false,
            inputs = [staker_address],
            keySearchParams = new AleoKeyProviderParams({
                proverUri: CREDITS_PROGRAM_KEYS.claim_unbond_public.prover,
                verifierUri: CREDITS_PROGRAM_KEYS.claim_unbond_public.verifier,
                cacheKey: "credits.aleo/claim_unbond_public"
            }),
            program = this.creditsProgram(),
            ...additionalOptions
        } = options;

        const executeOptions: ExecuteOptions = {
            programName,
            functionName,
            fee,
            privateFee,
            inputs,
            keySearchParams,
            ...additionalOptions
        };

        return await this.buildExecutionTransaction(executeOptions);
    }

    /**
     * Claim unbonded credits. If credits have been unbonded by the account executing this function, this method will
     * claim them and add them to the public balance of the account.
     *
     * @example
     * // Create a keyProvider to handle key management
     * const keyProvider = new AleoKeyProvider();
     * keyProvider.useCache = true;
     *
     * // Create a new ProgramManager with the key that will be used to bond credits
     * const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, undefined);
     * programManager.setAccount(new Account("YourPrivateKey"));
     *
     * // Create the bonding transaction
     * const tx_id = await programManager.claimUnbondPublic("aleo1jx8s4dvjepculny4wfrzwyhs3tlyv65r58ns3g6q2gm2esh7ps8sqy9s5j");
     *
     * @param {string} staker_address Address of the staker who is claiming the credits
     * @param {ExecuteOptions} options
     * @returns string
     */
    async claimUnbondPublic(staker_address: string, options: Partial<ExecuteOptions> = {}): Promise<string> {
        const tx = <Transaction>await this.buildClaimUnbondPublicTransaction(staker_address, options);
        return await this.networkClient.submitTransaction(tx);
    }

    /**
     * Build a set_validator_state transaction for later usage.
     *
     * This function allows a validator to set their state to be either opened or closed to new stakers.
     * When the validator is open to new stakers, any staker (including the validator) can bond or unbond from the validator.
     * When the validator is closed to new stakers, existing stakers can still bond or unbond from the validator, but new stakers cannot bond.
     *
     * This function serves two primary purposes:
     * 1. Allow a validator to leave the committee, by closing themselves to stakers and then unbonding all of their stakers.
     * 2. Allow a validator to maintain their % of stake, by closing themselves to allowing more stakers to bond to them.
     *
     * @example
     * // Create a keyProvider to handle key management
     * const keyProvider = new AleoKeyProvider();
     * keyProvider.useCache = true;
     *
     * // Create a new ProgramManager with the key that will be used to bond credits
     * const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, undefined);
     * programManager.setAccount(new Account("ValidatorPrivateKey"));
     *
     * // Create the bonding transaction
     * const tx = await programManager.buildSetValidatorStateTransaction(true);
     *
     * // The transaction can be submitted later to the network using the network client.
     * programManager.networkClient.submitTransaction(tx);
     *
     * @returns string
     * @param {boolean} validator_state
     * @param {Partial<ExecuteOptions>} options - Override default execution options
     */
    async buildSetValidatorStateTransaction(validator_state: boolean, options: Partial<ExecuteOptions> = {}) {
        const {
            programName = "credits.aleo",
            functionName = "set_validator_state",
            fee = 1,
            privateFee = false,
            inputs = [validator_state.toString()],
            keySearchParams = new AleoKeyProviderParams({
                proverUri: CREDITS_PROGRAM_KEYS.set_validator_state.prover,
                verifierUri: CREDITS_PROGRAM_KEYS.set_validator_state.verifier,
                cacheKey: "credits.aleo/set_validator_state"
            }),
            ...additionalOptions
        } = options;

        const executeOptions: ExecuteOptions = {
            programName,
            functionName,
            fee,
            privateFee,
            inputs,
            keySearchParams,
            ...additionalOptions
        };

        return await this.execute(executeOptions);
    }

    /**
     * Submit a set_validator_state transaction to the Aleo Network.
     *
     * This function allows a validator to set their state to be either opened or closed to new stakers.
     * When the validator is open to new stakers, any staker (including the validator) can bond or unbond from the validator.
     * When the validator is closed to new stakers, existing stakers can still bond or unbond from the validator, but new stakers cannot bond.
     *
     * This function serves two primary purposes:
     * 1. Allow a validator to leave the committee, by closing themselves to stakers and then unbonding all of their stakers.
     * 2. Allow a validator to maintain their % of stake, by closing themselves to allowing more stakers to bond to them.
     *
     * @example
     * // Create a keyProvider to handle key management
     * const keyProvider = new AleoKeyProvider();
     * keyProvider.useCache = true;
     *
     * // Create a new ProgramManager with the key that will be used to bond credits
     * const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, undefined);
     * programManager.setAccount(new Account("ValidatorPrivateKey"));
     *
     * // Create the bonding transaction
     * const tx_id = await programManager.setValidatorState(true);
     *
     * @returns string
     * @param {boolean} validator_state
     * @param {Partial<ExecuteOptions>} options - Override default execution options
     */
    async setValidatorState(validator_state: boolean, options: Partial<ExecuteOptions> = {}) {
        const tx = <string>await this.buildSetValidatorStateTransaction(validator_state, options);
        return this.networkClient.submitTransaction(tx);
    }

    /**
     * Verify a proof of execution from an offline execution
     *
     * @param {executionResponse} executionResponse
     * @returns {boolean} True if the proof is valid, false otherwise
     */
    verifyExecution(executionResponse: ExecutionResponse): boolean {
        try {
            const execution = <FunctionExecution>executionResponse.getExecution();
            const function_id = executionResponse.getFunctionId();
            const program = executionResponse.getProgram();
            const verifyingKey = executionResponse.getVerifyingKey();
            return verifyFunctionExecution(execution, verifyingKey, program, function_id);
        } catch(e) {
            console.warn("The execution was not found in the response, cannot verify the execution");
            return false;
        }
    }

    /**
     * Create a program object from a program's source code
     *
     * @param {string} program Program source code
     * @returns {Program} The program object
     */
    createProgramFromSource(program: string): Program {
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

    /**
     * Verify a program is valid
     *
     * @param {string} program The program source code
     */
    verifyProgram(program: string): boolean {
        try {
            <Program>Program.fromString(program);
            return true;
        } catch (e) {
            return false;
        }
    }

    // Internal utility function for getting a credits.aleo record
    async getCreditsRecord(amount: number, nonces: string[], record?: RecordPlaintext | string, params?: RecordSearchParams): Promise<RecordPlaintext> {
        try {
            return record instanceof RecordPlaintext ? record : RecordPlaintext.fromString(<string>record);
        } catch (e) {
            try {
                const recordProvider = <RecordProvider>this.recordProvider;
                return <RecordPlaintext>(await recordProvider.findCreditsRecord(amount, true, nonces, params))
            } catch (e: any) {
                logAndThrow(`Error finding fee record. Record finder response: '${e.message}'. Please ensure you're connected to a valid Aleo network and a record with enough balance exists.`);
            }
        }
    }
}

// Ensure the transfer type requires an amount record
function requiresAmountRecord(transferType: string): boolean {
    return PRIVATE_TRANSFER_TYPES.has(transferType);
}

// Validate the transfer type
function validateTransferType(transferType: string): string {
    return VALID_TRANSFER_TYPES.has(transferType) ? transferType :
        logAndThrow(`Invalid transfer type '${transferType}'. Valid transfer types are 'private', 'privateToPublic', 'public', and 'publicToPrivate'.`);
}

export { ProgramManager }
