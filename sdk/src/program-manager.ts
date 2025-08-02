import { Account } from "./account.js";
import { AleoNetworkClient, AleoNetworkClientOptions, ProgramImports } from "./network-client.js";
import { ImportedPrograms, ImportedVerifyingKeys } from "./models/imports.js";
import { RecordProvider, RecordSearchParams } from "./record-provider.js";

import {
    AleoKeyProvider,
    AleoKeyProviderParams,
    FunctionKeyPair,
    FunctionKeyProvider,
    KeySearchParams,
} from "./function-key-provider.js";

import {
    Address,
    Authorization,
    ExecutionResponse,
    Execution as FunctionExecution,
    OfflineQuery,
    RecordPlaintext,
    PrivateKey,
    Program,
    ProvingKey,
    ProvingRequest,
    VerifyingKey,
    Transaction,
    ProgramManager as WasmProgramManager,
    verifyFunctionExecution,
} from "./wasm.js";

import {
    CREDITS_PROGRAM_KEYS,
    PRIVATE_TRANSFER_TYPES,
    VALID_TRANSFER_TYPES,
} from "./constants.js";

import { logAndThrow } from "./utils.js";

/**
 * Represents the options for executing a transaction in the Aleo network.
 * This interface is used to specify the parameters required for building and submitting an execution transaction.
 *
 * @property {string} programName - The name of the program containing the function to be executed.
 * @property {string} functionName - The name of the function to execute within the program.
 * @property {number} priorityFee - The optional priority fee to be paid for the transaction.
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
    priorityFee: number;
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
    edition?: number,
}

/**
 * Options for building an Authorization for a function.
 *
 * @property programName {string} Name of the program containing the function to build the authorization for.
 * @property functionName {string} Name of the function name to build the authorization for.
 * @property inputs {string[]} The inputs to the function.
 * @property programSource {string | Program} The optional source code for the program to build an execution for.
 * @property privateKey {PrivateKey} Optional private key to use to build the authorization.
 * @property programImports {ProgramImports} The other programs the program imports.
 */
interface AuthorizationOptions {
    programName: string;
    functionName: string;
    inputs: string[];
    programSource?: string | Program;
    privateKey?: PrivateKey;
    programImports?: ProgramImports;
    edition?: number,
}

/**
 * Options for executing a fee authorization.
 *
 * @property deploymentOrExecutionId {string} The id of a previously built Execution or Authorization.
 * @property baseFeeCredits {number} The number of Aleo Credits to pay for the base fee.
 * @property priorityFeeCredits {number} The number of Aleo Credits to pay for the priority fee.
 * @property privateKey {PrivateKey} Optional private key to specify for the authorization.
 * @property feeRecord {RecordPlaintext} A record to specify to pay the private fee. If this is specified a `fee_private` authorization will be built.
 */
interface FeeAuthorizationOptions {
    deploymentOrExecutionId: string,
    baseFeeCredits: number,
    priorityFeeCredits?: number,
    privateKey?: PrivateKey,
    feeRecord?: RecordPlaintext,
}

/**
 * Represents the options for executing a transaction in the Aleo network.
 * This interface is used to specify the parameters required for building and submitting an execution transaction.
 *
 * @property {string} programName - The name of the program containing the function to be executed.
 * @property {string} functionName - The name of the function to execute within the program.
 * @property {number} baseFee - The base fee to be paid for the transaction.
 * @property {number} priorityFee - The optional priority fee to be paid for the transaction.
 * @property {boolean} privateFee - If true, uses a private record to pay the fee; otherwise, uses the account's public credit balance.
 * @property {string[]} inputs - The inputs to the function being executed.
 * @property {RecordSearchParams} [recordSearchParams] - Optional parameters for searching for a record to pay the execution transaction fee.
 * @property {string | RecordPlaintext} [feeRecord] - Optional fee record to use for the transaction.
 * @property {PrivateKey} [privateKey] - Optional private key to use for the transaction.
 * @property {string | Program} [program] - Optional program source code to use for the transaction.
 * @property {string} uri - The URI send the ProvingRequest to.
 * @property {ProgramImports} [imports] - Optional programs that the program being executed imports.
 * @property {boolean} broadcast - Whether to broadcast the Transaction generated by the remove prover to the Aleo network.
 */
interface ProvingRequestOptions {
    programName: string;
    functionName: string;
    baseFee: number,
    priorityFee: number;
    privateFee: boolean;
    inputs: string[];
    recordSearchParams?: RecordSearchParams;
    feeRecord?: string | RecordPlaintext;
    privateKey?: PrivateKey;
    programSource?: string | Program;
    programImports?: ProgramImports;
    broadcast?: boolean;
    unchecked?: boolean;
    edition?: number,
}

/**
 * @property { FunctionKeyProvider | undefined } [params.keyProvider] A key provider that implements {@link FunctionKeyProvider} interface
 * @property { RecordProvider | undefined } [params.recordProvider] A record provider that implements {@link RecordProvider} interface
 */
interface ProgramManagerOptions extends AleoNetworkClientOptions {
    keyProvider?: FunctionKeyProvider | undefined,
    recordProvider?: RecordProvider | undefined,
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
     * @param {Object} ProgramManagerOptions
     */
    constructor(params?: ProgramManagerOptions) {
        if (params == null) {
            params = {} as ProgramManagerOptions;
        }

        if (params.host == null) {
            params.host = "https://api.explorer.provable.com/v1";
        }

        this.host = params.host;
        this.networkClient = new AleoNetworkClient(params);

        this.keyProvider = params.keyProvider ? params.keyProvider : new AleoKeyProvider();
        this.recordProvider = params.recordProvider;
    }

    /**
     * Check if the fee is sufficient to pay for the transaction
     */
    async checkFee(params: {
        address: string,
        feeAmount: bigint,
    }) {
        const { address, feeAmount } = params;

        const balance =
            BigInt(await this.networkClient.getPublicBalance(address));
        if (feeAmount > balance) {
            throw Error(
                `The desired execution requires a fee of ${feeAmount} microcredits, but the account paying the fee has ${balance} microcredits available.`,
            );
        }
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
     * Set a header in the `AleoNetworkClient`s header map
     *
     * @param {string} headerName The name of the header to set
     * @param {string} value The header value
     *
     * @example
     * import { ProgramManager } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a ProgramManager
     * const programManager = new ProgramManager({ host: "https://api.explorer.provable.com/v1" });
     *
     * // Set the value of the `Accept-Language` header to `en-US`
     * programManager.setHeader('Accept-Language', 'en-US');
     */
    setHeader(headerName: string, value: string) {
        this.networkClient.headers[headerName] = value;
    }

    /**
     * Remove a header from the `AleoNetworkClient`s header map
     *
     * @param {string} headerName The name of the header to be removed
     *
     * @example
     * import { ProgramManager } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a ProgramManager
     * const programManager = new ProgramManager({ host: "https://api.explorer.provable.com/v1" });
     *
     * // Remove the default `X-Aleo-SDK-Version` header
     * programManager.removeHeader('X-Aleo-SDK-Version');
     */
    removeHeader(headerName: string) {
        delete this.networkClient.headers[headerName]
    }

    /**
     * Builds a deployment transaction for submission to the Aleo network.
     *
     * @param {Object} params
     * @param {string} params.program Program source code
     * @param {number} params.priorityFee The optional priority fee to be paid for that transaction.
     * @param {boolean} params.privateFee Use a private record to pay the fee. If false this will use the account's public credit balance
     * @param {RecordSearchParams | undefined} [params.recordSearchParams] Optional parameters for searching for a record to use pay the deployment fee
     * @param {string | RecordPlaintext | undefined} [params.feeRecord] Optional Fee record to use for the transaction
     * @param {PrivateKey | undefined} [params.privateKey] Optional private key to use for the transaction
     * @returns {string} The transaction id of the deployed program or a failure message from the network
     *
     * @example
     * /// Import the mainnet version of the sdk.
     * import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a new NetworkClient, KeyProvider, and RecordProvider
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider({ account, networkClient });
     * keyProvider.useCache(true);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for deployments
     * const program = "program hello_hello.aleo;\n\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n";
     * const programManager = new ProgramManager({ host: "https://api.explorer.provable.com/v1", keyProvider, recordProvider });
     * programManager.setAccount(Account);
     *
     * // Define a fee in credits
     * const priorityFee = 0.0;
     *
     * // Create the deployment transaction.
     * const tx = await programManager.buildDeploymentTransaction({ program, priorityFee, privateFee: false });
     * await programManager.networkClient.submitTransaction(tx);
     *
     * // Verify the transaction was successful
     * setTimeout(async () => {
     *  const transaction = await programManager.networkClient.getTransaction(tx.id());
     *  assert(transaction.id() === tx.id());
     * }, 20000);
     */
    async buildDeploymentTransaction(params: {
        program: string,
        priorityFee: number,
        privateFee: boolean,
        recordSearchParams?: RecordSearchParams,
        feeRecord?: string | RecordPlaintext,
        privateKey?: PrivateKey,
    }): Promise<Transaction> {
        let { program, priorityFee, privateFee, recordSearchParams, feeRecord, privateKey } = params;

        // Ensure the program is valid.
        let programObject;
        try {
            programObject = Program.fromString(program);
        } catch (e: any) {
            logAndThrow(
                `Error parsing program: '${e.message}'. Please ensure the program is valid.`,
            );
        }

        // Ensure the program is valid and does not exist on the network
        try {
            let programSource;
            try {
                programSource = await this.networkClient.getProgram(
                    programObject.id(),
                );
            } catch (e) {
                // Program does not exist on the network, deployment can proceed
                console.log(
                    `Program ${programObject.id()} does not exist on the network, deploying...`,
                );
            }
            if (typeof programSource === "string") {
                throw Error(`Program ${programObject.id()} already exists on the network, please rename your program`);
            }
        } catch (e: any) {
            logAndThrow(`Error validating program: ${e.message}`);
        }

        // Get the private key from the account if it is not provided in the parameters
        let deploymentPrivateKey = privateKey;
        if (
            typeof privateKey === "undefined" &&
            typeof this.account !== "undefined"
        ) {
            deploymentPrivateKey = this.account.privateKey();
        }

        if (typeof deploymentPrivateKey === "undefined") {
            throw "No private key provided and no private key set in the ProgramManager";
        }

        // Get the fee record from the account if it is not provided in the parameters
        try {
            feeRecord = privateFee
                ? <RecordPlaintext>(
                    await this.getCreditsRecord({
                        amount: priorityFee,
                        nonces: [],
                        record: feeRecord,
                        params: recordSearchParams,
                    })
                  )
                : undefined;
        } catch (e: any) {
            logAndThrow(
                `Error finding fee record. Record finder response: '${e.message}'. Please ensure you're connected to a valid Aleo network and a record with enough balance exists.`,
            );
        }

        // Get the proving and verifying keys from the key provider
        let feeKeys;
        try {
            feeKeys = privateFee
                ? <FunctionKeyPair>await this.keyProvider.feePrivateKeys()
                : <FunctionKeyPair>await this.keyProvider.feePublicKeys();
        } catch (e: any) {
            logAndThrow(
                `Error finding fee keys. Key finder response: '${e.message}'. Please ensure your key provider is configured correctly.`,
            );
        }
        const [feeProvingKey, feeVerifyingKey] = feeKeys;

        // Resolve the program imports if they exist
        let imports;
        try {
            imports = await this.networkClient.getProgramImports(program);
        } catch (e: any) {
            logAndThrow(
                `Error finding program imports. Network response: '${e.message}'. Please ensure you're connected to a valid Aleo network and the program is deployed to the network.`,
            );
        }

        // Build a deployment transaction
        return await WasmProgramManager.buildDeploymentTransaction(
            deploymentPrivateKey,
            program,
            priorityFee,
            feeRecord,
            this.host,
            imports,
            feeProvingKey,
            feeVerifyingKey,
        );
    }

    /**
     * Deploy an Aleo program to the Aleo network
     *
     * @param {Object} params
     * @param {string} params.program Program source code
     * @param {number} params.priorityFee The optional fee to be paid for the transaction
     * @param {boolean} params.privateFee Use a private record to pay the fee. If false this will use the account's public credit balance
     * @param {RecordSearchParams | undefined} [params.recordSearchParams] Optional parameters for searching for a record to used pay the deployment fee
     * @param {string | RecordPlaintext | undefined} [params.feeRecord] Optional Fee record to use for the transaction
     * @param {PrivateKey | undefined} [params.privateKey] Optional private key to use for the transaction
     * @returns {string} The transaction id of the deployed program or a failure message from the network
     *
     * @example
     * /// Import the mainnet version of the sdk.
     * import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a new NetworkClient, KeyProvider, and RecordProvider.
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider({ account, networkClient });
     * keyProvider.useCache(true);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for deployments
     * const program = "program hello_hello.aleo;\n\nfunction hello:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n";
     * const programManager = new ProgramManager({ host: "https://api.explorer.provable.com/v1", keyProvider, recordProvider });
     *
     * // Define a fee in credits
     * const priorityFee = 0.0;
     *
     * // Deploy the program
     * const tx_id = await programManager.deploy({ program, priorityFee, privateFee: false });
     *
     * // Verify the transaction was successful
     * setTimeout(async () => {
     *  const transaction = await programManager.networkClient.getTransaction(tx_id);
     *  assert(transaction.id() === tx_id);
     * }, 20000);
     */
    async deploy(params: {
        program: string,
        priorityFee: number,
        privateFee: boolean,
        recordSearchParams?: RecordSearchParams,
        feeRecord?: string | RecordPlaintext,
        privateKey?: PrivateKey,
    }): Promise<string> {
        const { privateKey } = params;

        const tx = <Transaction>(
            await this.buildDeploymentTransaction(params)
        );

        let feeAddress;

        if (typeof privateKey !== "undefined") {
            feeAddress = Address.from_private_key(privateKey);
        } else if (this.account !== undefined) {
            feeAddress = this.account?.address();
        } else {
            throw Error(
                "No private key provided and no private key set in the ProgramManager. Please set an account or provide a private key.",
            );
        }

        // Check if the account has sufficient credits to pay for the transaction
        await this.checkFee({
            address: feeAddress.to_string(),
            feeAmount: tx.feeAmount(),
        });

        return await this.networkClient.submitTransaction(tx);
    }

    /**
     * Builds an execution transaction for submission to the Aleo network.
     *
     * @param {ExecuteOptions} options - The options for the execution transaction.
     * @returns {Promise<Transaction>} - A promise that resolves to the transaction or an error.
     *
     * @example
     * /// Import the mainnet version of the sdk.
     * import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a new NetworkClient, KeyProvider, and RecordProvider.
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider({ account, networkClient });
     * keyProvider.useCache(true);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for executions
     * const programManager = new ProgramManager({ host: "https://api.explorer.provable.com/v1", keyProvider, recordProvider });
     *
     * // Build and execute the transaction
     * const tx = await programManager.buildExecutionTransaction({
     *   programName: "hello_hello.aleo",
     *   functionName: "hello_hello",
     *   priorityFee: 0.0,
     *   privateFee: false,
     *   inputs: ["5u32", "5u32"],
     *   keySearchParams: { "cacheKey": "hello_hello:hello" }
     * });
     *
     * // Submit the transaction to the network
     * await programManager.networkClient.submitTransaction(tx.toString());
     *
     * // Verify the transaction was successful
     * setTimeout(async () => {
     *  const transaction = await programManager.networkClient.getTransaction(tx.id());
     *  assert(transaction.id() === tx.id());
     * }, 10000);
     */
    async buildExecutionTransaction(
        options: ExecuteOptions,
    ): Promise<Transaction> {
        // Destructure the options object to access the parameters
        const {
            functionName,
            priorityFee,
            privateFee,
            inputs,
            recordSearchParams,
            keySearchParams,
            privateKey,
            offlineQuery,
        } = options;

        let feeRecord = options.feeRecord;
        let provingKey = options.provingKey;
        let verifyingKey = options.verifyingKey;
        let program = options.program;
        let programName = options.programName;
        let imports = options.imports;
        let edition = options.edition;

        // Ensure the function exists on the network
        if (program === undefined) {
            try {
                program = <string>(
                    await this.networkClient.getProgram(programName)
                );
            } catch (e: any) {
                logAndThrow(
                    `Error finding ${programName}. Network response: '${e.message}'. Please ensure you're connected to a valid Aleo network the program is deployed to the network.`,
                );
            }
        } else if (program instanceof Program) {
            program = program.toString();
        }

        // Get the program name if it is not provided in the parameters.
        if (programName === undefined) {
            programName = Program.fromString(program).id();
        }

        if (edition == undefined) {
            try {

                edition = await this.networkClient.getLatestProgramEdition(programName);
            } catch (e: any) {
                console.warn(`Error finding edition for ${programName}. Network response: '${e.message}'. Assuming edition 1.`);
                edition = 1;
            }
        }

        // Get the private key from the account if it is not provided in the parameters
        let executionPrivateKey = privateKey;
        if (
            typeof privateKey === "undefined" &&
            typeof this.account !== "undefined"
        ) {
            executionPrivateKey = this.account.privateKey();
        }

        if (typeof executionPrivateKey === "undefined") {
            throw "No private key provided and no private key set in the ProgramManager";
        }

        // Get the fee record from the account if it is not provided in the parameters
        try {
            feeRecord = privateFee
                ? <RecordPlaintext>(
                    await this.getCreditsRecord({
                        amount: priorityFee,
                        nonces: [],
                        record: feeRecord,
                        params: recordSearchParams,
                    })
                  )
                : undefined;
        } catch (e: any) {
            logAndThrow(
                `Error finding fee record. Record finder response: '${e.message}'. Please ensure you're connected to a valid Aleo network and a record with enough balance exists.`,
            );
        }

        // Get the fee proving and verifying keys from the key provider
        let feeKeys;
        try {
            feeKeys = privateFee
                ? <FunctionKeyPair>await this.keyProvider.feePrivateKeys()
                : <FunctionKeyPair>await this.keyProvider.feePublicKeys();
        } catch (e: any) {
            logAndThrow(
                `Error finding fee keys. Key finder response: '${e.message}'. Please ensure your key provider is configured correctly.`,
            );
        }
        const [feeProvingKey, feeVerifyingKey] = feeKeys;

        // If the function proving and verifying keys are not provided, attempt to find them using the key provider
        if (!provingKey || !verifyingKey) {
            try {
                [provingKey, verifyingKey] = <FunctionKeyPair>(
                    await this.keyProvider.functionKeys(keySearchParams)
                );
            } catch (e) {
                console.log(
                    `Function keys not found. Key finder response: '${e}'. The function keys will be synthesized`,
                );
            }
        }

        // Resolve the program imports if they exist
        const numberOfImports = Program.fromString(program).getImports().length;
        if (numberOfImports > 0 && !imports) {
            try {
                imports = <ProgramImports>(
                    await this.networkClient.getProgramImports(programName)
                );
            } catch (e: any) {
                logAndThrow(
                    `Error finding program imports. Network response: '${e.message}'. Please ensure you're connected to a valid Aleo network and the program is deployed to the network.`,
                );
            }
        }

        // Build an execution transaction
        return await WasmProgramManager.buildExecutionTransaction(
            executionPrivateKey,
            program,
            functionName,
            inputs,
            priorityFee,
            feeRecord,
            this.host,
            imports,
            provingKey,
            verifyingKey,
            feeProvingKey,
            feeVerifyingKey,
            offlineQuery,
            edition
        );
    }

    /**
     * Builds a SnarkVM `Authorization` for a specific function.
     *
     * @param {AuthorizationOptions} options - The options for building the `Authorization`
     * @returns {Promise<Authorization>} - A promise that resolves to an `Authorization` or throws an Error.
     *
     * @example
     * /// Import the mainnet version of the sdk.
     * import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a new NetworkClient, KeyProvider, and RecordProvider.
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     * keyProvider.useCache(true);
     *
     * // Initialize a ProgramManager with the key and record providers.
     * const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);
     *
     * // Build the `Authorization`.
     * const authorization = await programManager.buildAuthorization({
     *   programName: "credits.aleo",
     *   functionName: "transfer_public",
     *   inputs: [
     *     "aleo1vwls2ete8dk8uu2kmkmzumd7q38fvshrht8hlc0a5362uq8ftgyqnm3w08",
     *     "10000000u64",
     *   ],
     * });
     */
    async buildAuthorization(
        options: AuthorizationOptions,
    ): Promise<Authorization> {
        // Destructure the options object to access the parameters.
        const {
            functionName,
            inputs,
        } = options;

        const privateKey = options.privateKey;
        let program = options.programSource;
        let programName = options.programName;
        let imports = options.programImports;
        let edition = options.edition;

        // Ensure the function exists on the network.
        if (program === undefined) {
            try {
                program = <string>(
                    await this.networkClient.getProgram(programName)
                );
            } catch (e: any) {
                logAndThrow(
                    `Error finding ${programName}. Network response: '${e.message}'. Please ensure you're connected to a valid Aleo network the program is deployed to the network.`,
                );
            }
        } else if (program instanceof Program) {
            program = program.toString();
        }

        // Get the program name if it is not provided in the parameters.
        if (programName === undefined) {
            programName = Program.fromString(program).id();
        }

        // Get the private key from the account if it is not provided in the parameters.
        let executionPrivateKey = privateKey;
        if (
            typeof privateKey === "undefined" &&
            typeof this.account !== "undefined"
        ) {
            executionPrivateKey = this.account.privateKey();
        }

        if (typeof executionPrivateKey === "undefined") {
            throw "No private key provided and no private key set in the ProgramManager";
        }

        if (edition == undefined) {
            try {
                edition = await this.networkClient.getLatestProgramEdition(programName);
            } catch (e: any) {
                console.warn(`Error finding edition for ${programName}. Network response: '${e.message}'. Assuming edition 1.`);
                edition = 1;
            }
        }

        // Resolve the program imports if they exist.
        const numberOfImports = Program.fromString(program).getImports().length;
        if (numberOfImports > 0 && !imports) {
            try {
                imports = <ProgramImports>(
                    await this.networkClient.getProgramImports(programName)
                );
            } catch (e: any) {
                logAndThrow(
                    `Error finding program imports. Network response: '${e.message}'. Please ensure you're connected to a valid Aleo network and the program is deployed to the network.`,
                );
            }
        }

        // Build and return an `Authorization` for the desired function.
        return await WasmProgramManager.authorize(
            executionPrivateKey,
            program,
            functionName,
            inputs,
            imports,
            edition
        );
    }

    /**
     * Builds a SnarkVM `Authorization` for a specific function without building a circuit first. This should be used when fast authorization generation is needed and the invoker is confident inputs are coorect.
     *
     * @param {AuthorizationOptions} options - The options for building the `Authorization`
     * @returns {Promise<Authorization>} - A promise that resolves to an `Authorization` or throws an Error.
     *
     * @example
     * /// Import the mainnet version of the sdk.
     * import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a new NetworkClient, KeyProvider, and RecordProvider.
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     * keyProvider.useCache(true);
     *
     * // Initialize a ProgramManager with the key and record providers.
     * const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);
     *
     * // Build the unchecked `Authorization`.
     * const authorization = await programManager.buildAuthorizationUnchecked({
     *   programName: "credits.aleo",
     *   functionName: "transfer_public",
     *   inputs: [
     *     "aleo1vwls2ete8dk8uu2kmkmzumd7q38fvshrht8hlc0a5362uq8ftgyqnm3w08",
     *     "10000000u64",
     *   ],
     * });
     */
    async buildAuthorizationUnchecked(
        options: AuthorizationOptions,
    ): Promise<Authorization> {
        // Destructure the options object to access the parameters.
        const {
            functionName,
            inputs,
        } = options;

        const privateKey = options.privateKey;
        let program = options.programSource;
        let programName = options.programName;
        let imports = options.programImports;
        let edition = options.edition;

        // Ensure the function exists on the network.
        if (program === undefined) {
            try {
                program = <string>(
                    await this.networkClient.getProgram(programName)
                );
            } catch (e: any) {
                logAndThrow(
                    `Error finding ${programName}. Network response: '${e.message}'. Please ensure you're connected to a valid Aleo network the program is deployed to the network.`,
                );
            }
        } else if (program instanceof Program) {
            program = program.toString();
        }

        // Get the program name if it is not provided in the parameters.
        if (programName === undefined) {
            programName = Program.fromString(program).id();
        }

        // Get the private key from the account if it is not provided in the parameters.
        let executionPrivateKey = privateKey;
        if (
            typeof privateKey === "undefined" &&
            typeof this.account !== "undefined"
        ) {
            executionPrivateKey = this.account.privateKey();
        }

        if (typeof executionPrivateKey === "undefined") {
            throw "No private key provided and no private key set in the ProgramManager";
        }

        // Resolve the program imports if they exist.
        const numberOfImports = Program.fromString(program).getImports().length;
        if (numberOfImports > 0 && !imports) {
            try {
                imports = <ProgramImports>(
                    await this.networkClient.getProgramImports(programName)
                );
            } catch (e: any) {
                logAndThrow(
                    `Error finding program imports. Network response: '${e.message}'. Please ensure you're connected to a valid Aleo network and the program is deployed to the network.`,
                );
            }
        }

        if (edition == undefined) {
            try {
                edition = await this.networkClient.getLatestProgramEdition(programName);
            } catch (e: any) {
                console.warn(`Error finding edition for ${programName}. Network response: '${e.message}'. Assuming edition 1.`);
                edition = 1;
            }
        }

        // Build and return an `Authorization` for the desired function.
        return await WasmProgramManager.buildAuthorizationUnchecked(
            executionPrivateKey,
            program,
            functionName,
            inputs,
            imports,
            edition
        );
    }

    /**
     * Builds a `ProvingRequest` for submission to a prover for execution.
     *
     * @param {ProvingRequestOptions} options - The options for building the proving request
     * @returns {Promise<ProvingRequest>} - A promise that resolves to the transaction or an error.
     *
     * @example
     * /// Import the mainnet version of the sdk.
     * import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a new NetworkClient, KeyProvider, and RecordProvider.
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     * keyProvider.useCache(true);
     *
     * // Initialize a ProgramManager with the key and record providers.
     * const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);
     *
     * // Build the proving request.
     * const provingRequest = await programManager.provingRequest({
     *   programName: "credits.aleo",
     *   functionName: "transfer_public",
     *   baseFee: 100000,
     *   priorityFee: 0,
     *   privateFee: false,
     *   inputs: [
     *     "aleo1vwls2ete8dk8uu2kmkmzumd7q38fvshrht8hlc0a5362uq8ftgyqnm3w08",
     *     "10000000u64",
     *   ],
     *   broadcast: false,
     * });
     */
    async provingRequest(
        options: ProvingRequestOptions,
    ): Promise<ProvingRequest> {
        // Destructure the options object to access the parameters.
        const {
            functionName,
            baseFee,
            priorityFee,
            privateFee,
            inputs,
            recordSearchParams,
            broadcast = false,
            unchecked = false,
        } = options;

        const privateKey = options.privateKey;
        let program = options.programSource;
        let programName = options.programName;
        let feeRecord = options.feeRecord;
        let imports = options.programImports;
        let edition = options.edition;

        // Ensure the function exists on the network.
        if (program === undefined) {
            try {
                program = <string>(
                    await this.networkClient.getProgram(programName)
                );
            } catch (e: any) {
                logAndThrow(
                    `Error finding ${programName}. Network response: '${e.message}'. Please ensure you're connected to a valid Aleo network the program is deployed to the network.`,
                );
            }
        } else if (program instanceof Program) {
            program = program.toString();
        }

        // Get the program name if it is not provided in the parameters.
        if (programName === undefined) {
            programName = Program.fromString(program).id();
        }

        if (edition == undefined) {
            try {
                edition = await this.networkClient.getLatestProgramEdition(programName);
            } catch (e: any) {
                console.warn(`Error finding edition for ${programName}. Network response: '${e.message}'. Assuming edition 1.`);
                edition = 1;
            }
        }

        // Get the private key from the account if it is not provided in the parameters.
        let executionPrivateKey = privateKey;
        if (
            typeof privateKey === "undefined" &&
            typeof this.account !== "undefined"
        ) {
            executionPrivateKey = this.account.privateKey();
        }

        if (typeof executionPrivateKey === "undefined") {
            throw "No private key provided and no private key set in the ProgramManager";
        }

        // Get the fee record from the account if it is not provided in the parameters.
        try {
            feeRecord = privateFee
                ? <RecordPlaintext>(
                    await this.getCreditsRecord({
                        amount: priorityFee,
                        nonces: [],
                        record: feeRecord,
                        params: recordSearchParams,
                    })
                )
                : undefined;
        } catch (e: any) {
            logAndThrow(
                `Error finding fee record. Record finder response: '${e.message}'. Please ensure you're connected to a valid Aleo network and a record with enough balance exists.`,
            );
        }

        // Resolve the program imports if they exist.
        const numberOfImports = Program.fromString(program).getImports().length;
        if (numberOfImports > 0 && !imports) {
            try {
                imports = <ProgramImports>(
                    await this.networkClient.getProgramImports(programName)
                );
            } catch (e: any) {
                logAndThrow(
                    `Error finding program imports. Network response: '${e.message}'. Please ensure you're connected to a valid Aleo network and the program is deployed to the network.`,
                );
            }
        }

        // Build and return the `ProvingRequest`.
        return await WasmProgramManager.buildProvingRequest(
            executionPrivateKey,
            program,
            functionName,
            inputs,
            baseFee,
            priorityFee,
            feeRecord,
            imports,
            broadcast,
            unchecked,
            edition
        );
    }

    /**
     * Builds a SnarkVM fee `Authorization` for `credits.aleo/fee_private` or `credits.aleo/fee_public`. If a record is provided `fee_private` will be executed, otherwise `fee_public` will be executed.
     *
     * @param {FeeAuthorizationOptions} options - The options for building the `Authorization`.
     * @returns {Promise<Authorization>} - A promise that resolves to an `Authorization` or throws an Error.
     *
     * @example
     * /// Import the mainnet version of the sdk.
     * import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a new NetworkClient, KeyProvider, and RecordProvider.
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider(account, networkClient);
     * keyProvider.useCache(true);
     *
     * // Initialize a ProgramManager with the key and record providers.
     * const programManager = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);
     *
     * // Build a credits.aleo/fee_public `Authorization`.
     * const feePublicAuthorization = await programManager.authorizeFee({
     *   deploymentOrExecutionId: "2423957656946557501636078245035919227529640894159332581642187482178647335171field",
     *   baseFeeCredits: 0.1,
     * });
     *
     * // Build a credits.aleo/fee_private `Authorization`.
     * const record = "{ owner: aleo1j7qxyunfldj2lp8hsvy7mw5k8zaqgjfyr72x2gh3x4ewgae8v5gscf5jh3.private, microcredits: 1500000000000000u64.private, _nonce: 3077450429259593211617823051143573281856129402760267155982965992208217472983group.public }";
     * const feePrivateAuthorization = await programManager.authorizeFee({
     *   deploymentOrExecutionId: "2423957656946557501636078245035919227529640894159332581642187482178647335171field",
     *   baseFeeCredits: 0.1,
     *   feeRecord: record,
     * });
     */
    async buildFeeAuthorization(
        options: FeeAuthorizationOptions,
    ): Promise<Authorization> {
        // Destructure the options object to access the parameters.
        const {
            privateKey,
            deploymentOrExecutionId,
            baseFeeCredits,
            priorityFeeCredits,
            feeRecord,
        } = options;

        // Get the private key from the account if it is not provided in the parameters.
        let executionPrivateKey = privateKey;
        if (
            typeof privateKey === "undefined" &&
            typeof this.account !== "undefined"
        ) {
            executionPrivateKey = this.account.privateKey();
        }

        if (typeof executionPrivateKey === "undefined") {
            throw "No private key provided and no private key set in the ProgramManager";
        }

        // Build and return the fee `Authorization`.
        return await WasmProgramManager.authorizeFee(
            executionPrivateKey,
            deploymentOrExecutionId,
            baseFeeCredits,
            priorityFeeCredits || 0,
            feeRecord,
        );
    }

    /**
     * Builds an execution transaction for submission to the Aleo network.
     *
     * @param {ExecuteOptions} options - The options for the execution transaction.
     * @returns {Promise<string>} - The transaction id
     *
     * @example
     * /// Import the mainnet version of the sdk.
     * import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a new NetworkClient, KeyProvider, and RecordProvider using official Aleo record, key, and network providers
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider({ account, networkClient });
     * keyProvider.useCache(true);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for executions
     * const programManager = new ProgramManager({ host: "https://api.explorer.provable.com/v1", keyProvider, recordProvider });
     *
     * // Build and execute the transaction
     * const tx_id = await programManager.execute({
     *   programName: "hello_hello.aleo",
     *   functionName: "hello_hello",
     *   priorityFee: 0.0,
     *   privateFee: false,
     *   inputs: ["5u32", "5u32"],
     *   keySearchParams: { "cacheKey": "hello_hello:hello" }
     * });
     *
     * // Verify the transaction was successful
     * setTimeout(async () => {
     *  const transaction = await programManager.networkClient.getTransaction(tx_id);
     *  assert(transaction.id() === tx_id);
     * }, 10000);
     */
    async execute(options: ExecuteOptions): Promise<string> {
        const tx = <Transaction>await this.buildExecutionTransaction(options);

        let feeAddress;

        if (typeof options.privateKey !== "undefined") {
            feeAddress = Address.from_private_key(options.privateKey);
        } else if (this.account !== undefined) {
            feeAddress = this.account?.address();
        } else {
            throw Error(
                "No private key provided and no private key set in the ProgramManager. Please set an account or provide a private key.",
            );
        }

        // Check if the account has sufficient credits to pay for the transaction
        await this.checkFee({
            address: feeAddress.to_string(),
            feeAmount: tx.feeAmount(),
        });

        return await this.networkClient.submitTransaction(tx);
    }

    /**
     * Run an Aleo program in offline mode
     *
     * @param {Object} params
     * @param {string} params.program Program source code containing the function to be executed
     * @param {string} params.functionName Function name to execute
     * @param {string[]} params.inputs Inputs to the function
     * @param {number} params.proveExecution Whether to prove the execution of the function and return an execution transcript that contains the proof.
     * @param {string[] | undefined} [params.imports] Optional imports to the program
     * @param {KeySearchParams | undefined} [params.keySearchParams] Optional parameters for finding the matching proving & verifying keys for the function
     * @param {ProvingKey | undefined} [params.provingKey] Optional proving key to use for the transaction
     * @param {VerifyingKey | undefined} [params.verifyingKey] Optional verifying key to use for the transaction
     * @param {PrivateKey | undefined} [params.privateKey] Optional private key to use for the transaction
     * @param {OfflineQuery | undefined} [params.offlineQuery] Optional offline query if creating transactions in an offline environment
     * @returns {Promise<ExecutionResponse>} The execution response containing the outputs of the function and the proof if the program is proved.
     *
     * @example
     * /// Import the mainnet version of the sdk used to build executions.
     * import { Account, ProgramManager } from "@provablehq/sdk/mainnet.js";
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
     * const executionResponse = await programManager.run({ program, functionName: "hello", inputs: ["5u32", "5u32"] });
     * const result = executionResponse.getOutputs();
     * assert(result === ["10u32"]);
     */
    async run(params: {
        program: string,
        functionName: string,
        inputs: string[],
        proveExecution: boolean,
        imports?: ProgramImports,
        keySearchParams?: KeySearchParams,
        provingKey?: ProvingKey,
        verifyingKey?: VerifyingKey,
        privateKey?: PrivateKey,
        offlineQuery?: OfflineQuery,
        edition?: number,
    }): Promise<ExecutionResponse> {
        let { program, functionName, inputs, proveExecution, imports, keySearchParams, provingKey, verifyingKey, privateKey, offlineQuery, edition } = params;

        // Get the private key from the account if it is not provided in the parameters
        let executionPrivateKey = privateKey;
        if (
            typeof privateKey === "undefined" &&
            typeof this.account !== "undefined"
        ) {
            executionPrivateKey = this.account.privateKey();
        }

        if (typeof executionPrivateKey === "undefined") {
            throw "No private key provided and no private key set in the ProgramManager";
        }

        // If the function proving and verifying keys are not provided, attempt to find them using the key provider
        if (!provingKey || !verifyingKey) {
            try {
                [provingKey, verifyingKey] = <FunctionKeyPair>(
                    await this.keyProvider.functionKeys(keySearchParams)
                );
            } catch (e) {
                console.log(
                    `Function keys not found. Key finder response: '${e}'. The function keys will be synthesized`,
                );
            }
        }

        // Run the program offline and return the result
        console.log("Running program offline");
        console.log("Proving key: ", provingKey);
        console.log("Verifying key: ", verifyingKey);
        return WasmProgramManager.executeFunctionOffline(
            executionPrivateKey,
            program,
            functionName,
            inputs,
            proveExecution,
            false,
            imports,
            provingKey,
            verifyingKey,
            this.host,
            offlineQuery,
            edition
        );
    }

    /**
     * Join two credits records into a single credits record
     *
     * @param {Object} params
     * @param {RecordPlaintext | string} params.recordOne First credits record to join
     * @param {RecordPlaintext | string} params.recordTwo Second credits record to join
     * @param {number} params.priorityFee The optional priority fee to be paid for the transaction
     * @param {boolean} params.privateFee Use a private record to pay the fee. If false this will use the account's public credit balance
     * @param {RecordSearchParams | undefined} [params.recordSearchParams] Optional parameters for finding the fee record to use to pay the fee for the join transaction
     * @param {RecordPlaintext | string | undefined} [params.feeRecord] Fee record to use for the join transaction
     * @param {PrivateKey | undefined} [params.privateKey] Private key to use for the join transaction
     * @param {OfflineQuery | undefined} [params.offlineQuery] Optional offline query if creating transactions in an offline environment
     * @returns {Promise<string>} The transaction id
     *
     * @example
     * /// Import the mainnet version of the sdk.
     * import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a new NetworkClient, KeyProvider, and RecordProvider
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider({ account, networkClient });
     * keyProvider.useCache(true);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for executions
     * const programManager = new ProgramManager({ host: "https://api.explorer.provable.com/v1", keyProvider, recordProvider });
     * const record1 = "{  owner: aleo184vuwr5u7u0ha5f5k44067dd2uaqewxx6pe5ltha5pv99wvhfqxqv339h4.private,  microcredits: 45000000u64.private,  _nonce: 4106205762862305308495708971985748592380064201230396559307556388725936304984group.public}"
     * const record2 = "{  owner: aleo184vuwr5u7u0ha5f5k44067dd2uaqewxx6pe5ltha5pv99wvhfqxqv339h4.private,  microcredits: 45000000u64.private,  _nonce: 1540945439182663264862696551825005342995406165131907382295858612069623286213group.public}"
     * const tx_id = await programManager.join({ record1, record2, priorityFee: 0.05, privateFee: false });
     *
     * // Verify the transaction was successful
     * setTimeout(async () => {
     *  const transaction = await programManager.networkClient.getTransaction(tx_id);
     *  assert(transaction.id() === tx_id);
     * }, 10000);
     */
    async join(params: {
        record1: RecordPlaintext | string,
        record2: RecordPlaintext | string,
        priorityFee: number,
        privateFee: boolean,
        recordSearchParams?: RecordSearchParams | undefined,
        feeRecord?: RecordPlaintext | string | undefined,
        privateKey?: PrivateKey,
        offlineQuery?: OfflineQuery,
    }): Promise<string> {
        let { record1, record2, priorityFee, privateFee, recordSearchParams, feeRecord, privateKey, offlineQuery } = params;

        // Get the private key from the account if it is not provided in the parameters and assign the fee address
        let executionPrivateKey = privateKey;
        let feeAddress;
        if (
            typeof privateKey === "undefined" &&
            typeof this.account !== "undefined"
        ) {
            executionPrivateKey = this.account.privateKey();
            feeAddress = this.account?.address();
        }
        else if (typeof executionPrivateKey === "undefined") {
            throw "No private key provided and no private key set in the ProgramManager";
        }
        else {
            feeAddress = Address.from_private_key(executionPrivateKey);
        }

        // Get the proving and verifying keys from the key provider
        let feeKeys;
        let joinKeys;
        try {
            feeKeys = privateFee
                ? <FunctionKeyPair>await this.keyProvider.feePrivateKeys()
                : <FunctionKeyPair>await this.keyProvider.feePublicKeys();
            joinKeys = <FunctionKeyPair>await this.keyProvider.joinKeys();
        } catch (e: any) {
            logAndThrow(
                `Error finding fee keys. Key finder response: '${e.message}'. Please ensure your key provider is configured correctly.`,
            );
        }
        const [feeProvingKey, feeVerifyingKey] = feeKeys;
        const [joinProvingKey, joinVerifyingKey] = joinKeys;

        // Get the fee record from the account if it is not provided in the parameters
        try {
            feeRecord = privateFee
                ? <RecordPlaintext>(
                    await this.getCreditsRecord({
                        amount: priorityFee,
                        nonces: [],
                        record: feeRecord,
                        params: recordSearchParams,
                    })
                  )
                : undefined;
        } catch (e: any) {
            logAndThrow(
                `Error finding fee record. Record finder response: '${e.message}'. Please ensure you're connected to a valid Aleo network and a record with enough balance exists.`,
            );
        }

        // Validate the records provided are valid plaintext records
        try {
            record1 =
                record1 instanceof RecordPlaintext
                    ? record1
                    : RecordPlaintext.fromString(record1);
            record2 =
                record2 instanceof RecordPlaintext
                    ? record2
                    : RecordPlaintext.fromString(record2);
        } catch (e: any) {
            logAndThrow(
                "Records provided are not valid. Please ensure they are valid plaintext records.",
            );
        }

        // Build an execution transaction and submit it to the network
        const tx = await WasmProgramManager.buildJoinTransaction(
            executionPrivateKey,
            record1,
            record2,
            priorityFee,
            feeRecord,
            this.host,
            joinProvingKey,
            joinVerifyingKey,
            feeProvingKey,
            feeVerifyingKey,
            offlineQuery,
        );

        // Check if the account has sufficient credits to pay for the transaction
        await this.checkFee({
            address: feeAddress.to_string(),
            feeAmount: tx.feeAmount(),
        });

        return await this.networkClient.submitTransaction(tx);
    }

    /**
     * Split credits into two new credits records
     *
     * @param {Object} params
     * @param {number} params.splitAmount Amount in microcredits to split from the original credits record
     * @param {RecordPlaintext | string} params.amountRecord Amount record to use for the split transaction
     * @param {PrivateKey | undefined} [params.privateKey] Optional private key to use for the split transaction
     * @param {OfflineQuery | undefined} [params.offlineQuery] Optional offline query if creating transactions in an offline environment
     * @returns {Promise<string>} The transaction id
     *
     * @example
     * /// Import the mainnet version of the sdk.
     * import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a new NetworkClient, KeyProvider, and RecordProvider
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider({ account, networkClient });
     * keyProvider.useCache(true);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for executions
     * const programManager = new ProgramManager({ host: "https://api.explorer.provable.com/v1", keyProvider, recordProvider });
     * const record = "{  owner: aleo184vuwr5u7u0ha5f5k44067dd2uaqewxx6pe5ltha5pv99wvhfqxqv339h4.private,  microcredits: 45000000u64.private,  _nonce: 4106205762862305308495708971985748592380064201230396559307556388725936304984group.public}"
     * const tx_id = await programManager.split({ splitAmount: 25000000, amountRecord: record });
     *
     * // Verify the transaction was successful
     * setTimeout(async () => {
     *  const transaction = await programManager.networkClient.getTransaction(tx_id);
     *  assert(transaction.id() === tx_id);
     * }, 10000);
     */
    async split(params: {
        splitAmount: number,
        amountRecord: RecordPlaintext | string,
        privateKey?: PrivateKey,
        offlineQuery?: OfflineQuery,
    }): Promise<string> {
        let { splitAmount, amountRecord, privateKey, offlineQuery } = params;

        // Get the private key from the account if it is not provided in the parameters
        let executionPrivateKey = privateKey;
        if (
            typeof privateKey === "undefined" &&
            typeof this.account !== "undefined"
        ) {
            executionPrivateKey = this.account.privateKey();
        }

        if (typeof executionPrivateKey === "undefined") {
            throw "No private key provided and no private key set in the ProgramManager";
        }

        // Get the split keys from the key provider
        let splitKeys;
        try {
            splitKeys = <FunctionKeyPair>await this.keyProvider.splitKeys();
        } catch (e: any) {
            logAndThrow(
                `Error finding fee keys. Key finder response: '${e.message}'. Please ensure your key provider is configured correctly.`,
            );
        }
        const [splitProvingKey, splitVerifyingKey] = splitKeys;

        // Validate the record to be split
        try {
            amountRecord =
                amountRecord instanceof RecordPlaintext
                    ? amountRecord
                    : RecordPlaintext.fromString(amountRecord);
        } catch (e: any) {
            logAndThrow(
                "Record provided is not valid. Please ensure it is a valid plaintext record.",
            );
        }

        // Build an execution transaction and submit it to the network
        const tx = await WasmProgramManager.buildSplitTransaction(
            executionPrivateKey,
            splitAmount,
            amountRecord,
            this.host,
            splitProvingKey,
            splitVerifyingKey,
            offlineQuery,
        );

        return await this.networkClient.submitTransaction(tx);
    }

    /**
     * Pre-synthesize proving and verifying keys for a program
     *
     * @param {Object} params
     * @param params.program {string} The program source code to synthesize keys for
     * @param params.functionName {string} The function id to synthesize keys for
     * @param params.inputs {Array<string>}  Sample inputs to the function
     * @param [params.privateKey] {PrivateKey | undefined} Optional private key to use for the key synthesis
     *
     * @returns {Promise<FunctionKeyPair>}
     */
    async synthesizeKeys(params: {
        program: string,
        functionName: string,
        inputs: Array<string>,
        privateKey?: PrivateKey,
    }): Promise<FunctionKeyPair> {
        let { program, functionName, inputs, privateKey } = params;

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
                functionName,
                inputs,
                imports,
            );
            return [
                <ProvingKey>keyPair.provingKey(),
                <VerifyingKey>keyPair.verifyingKey(),
            ];
        } catch (e: any) {
            logAndThrow(
                `Could not synthesize keys - error ${e.message}. Please ensure the program is valid and the inputs are correct.`,
            );
        }
    }

    /**
     * Build a transaction to transfer credits to another account for later submission to the Aleo network
     *
     * @param {Object} params
     * @param {number} params.amount The amount of credits to transfer
     * @param {string} params.recipient The recipient of the transfer
     * @param {string} params.transferType The type of transfer to perform - options: 'private', 'privateToPublic', 'public', 'publicToPrivate'
     * @param {number} params.priorityFee The optional priority fee to be paid for the transaction
     * @param {boolean} params.privateFee Use a private record to pay the fee. If false this will use the account's public credit balance
     * @param {RecordSearchParams | undefined} [params.recordSearchParams] Optional parameters for finding the amount and fee records for the transfer transaction
     * @param {RecordPlaintext | string} [params.amountRecord] Optional amount record to use for the transfer
     * @param {RecordPlaintext | string} [params.feeRecord] Optional fee record to use for the transfer
     * @param {PrivateKey | undefined} [params.privateKey] Optional private key to use for the transfer transaction
     * @param {OfflineQuery | undefined} [params.offlineQuery] Optional offline query if creating transactions in an offline environment
     * @returns {Promise<Transaction>} The transaction object
     *
     * @example
     * /// Import the mainnet version of the sdk.
     * import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a new NetworkClient, KeyProvider, and RecordProvider
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider({ account, networkClient });
     * keyProvider.useCache(true);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for executions
     * const programManager = new ProgramManager({ host: "https://api.explorer.provable.com/v1", keyProvider, recordProvider });
     * const tx = await programManager.buildTransferTransaction({
     *     amount: 1,
     *     recipient: "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px",
     *     transferType: "public",
     *     priorityFee: 0.2,
     *     privateFee: false,
     * });
     * await programManager.networkClient.submitTransaction(tx.toString());
     *
     * // Verify the transaction was successful
     * setTimeout(async () => {
     *  const transaction = await programManager.networkClient.getTransaction(tx.id());
     *  assert(transaction.id() === tx.id());
     * }, 10000);
     */
    async buildTransferTransaction(params: {
        amount: number,
        recipient: string,
        transferType: string,
        priorityFee: number,
        privateFee: boolean,
        recordSearchParams?: RecordSearchParams,
        amountRecord?: RecordPlaintext | string,
        feeRecord?: RecordPlaintext | string,
        privateKey?: PrivateKey,
        offlineQuery?: OfflineQuery,
    }): Promise<Transaction> {
        let { amount, recipient, transferType, priorityFee, privateFee, recordSearchParams, amountRecord, feeRecord, privateKey, offlineQuery } = params;

        // Validate the transfer type
        transferType = <string>validateTransferType(transferType);

        // Get the private key from the account if it is not provided in the parameters
        let executionPrivateKey = privateKey;
        if (
            typeof executionPrivateKey === "undefined" &&
            typeof this.account !== "undefined"
        ) {
            executionPrivateKey = this.account.privateKey();
        }

        if (typeof executionPrivateKey === "undefined") {
            throw "No private key provided and no private key set in the ProgramManager";
        }

        // Get the proving and verifying keys from the key provider
        let feeKeys;
        let transferKeys;
        try {
            feeKeys = privateFee
                ? <FunctionKeyPair>await this.keyProvider.feePrivateKeys()
                : <FunctionKeyPair>await this.keyProvider.feePublicKeys();
            transferKeys = <FunctionKeyPair>(
                await this.keyProvider.transferKeys(transferType)
            );
        } catch (e: any) {
            logAndThrow(
                `Error finding fee keys. Key finder response: '${e.message}'. Please ensure your key provider is configured correctly.`,
            );
        }
        const [feeProvingKey, feeVerifyingKey] = feeKeys;
        const [transferProvingKey, transferVerifyingKey] = transferKeys;

        // Get the amount and fee record from the account if it is not provided in the parameters
        try {
            // Track the nonces of the records found so no duplicate records are used
            const nonces: string[] = [];
            if (requiresAmountRecord(transferType)) {
                // If the transfer type is private and requires an amount record, get it from the record provider
                amountRecord = <RecordPlaintext>(
                    await this.getCreditsRecord({
                        amount: priorityFee,
                        nonces: [],
                        record: amountRecord,
                        params: recordSearchParams,
                    })
                );
                nonces.push(amountRecord.nonce());
            } else {
                amountRecord = undefined;
            }
            feeRecord = privateFee
                ? <RecordPlaintext>(
                    await this.getCreditsRecord({
                        amount: priorityFee,
                        nonces: nonces,
                        record: feeRecord,
                        params: recordSearchParams,
                    })
                  )
                : undefined;
        } catch (e: any) {
            logAndThrow(
                `Error finding fee record. Record finder response: '${e.message}'. Please ensure you're connected to a valid Aleo network and a record with enough balance exists.`,
            );
        }

        // Build an execution transaction
        return await WasmProgramManager.buildTransferTransaction(
            executionPrivateKey,
            amount,
            recipient,
            transferType,
            amountRecord,
            priorityFee,
            feeRecord,
            this.host,
            transferProvingKey,
            transferVerifyingKey,
            feeProvingKey,
            feeVerifyingKey,
            offlineQuery,
        );
    }

    /**
     * Build a transfer_public transaction to transfer credits to another account for later submission to the Aleo network
     *
     * @param {Object} params
     * @param {number} params.amount The amount of credits to transfer
     * @param {string} params.recipient The recipient of the transfer
     * @param {number} params.priorityFee The optional priority fee to be paid for the transfer
     * @param {PrivateKey | undefined} [params.privateKey] Optional private key to use for the transfer transaction
     * @param {OfflineQuery | undefined} [params.offlineQuery] Optional offline query if creating transactions in an offline environment
     * @returns {Promise<Transaction>} The transaction object
     *
     * @example
     * /// Import the mainnet version of the sdk.
     * import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a new NetworkClient, KeyProvider, and RecordProvider
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider({ account, networkClient });
     * keyProvider.useCache(true);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for executions
     * const programManager = new ProgramManager({ host: "https://api.explorer.provable.com/v1", keyProvider, recordProvider });
     * const tx = await programManager.buildTransferPublicTransaction({
     *     amount: 1,
     *     recipient: "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px",
     *     priorityFee: 0.2,
     * });
     * await programManager.networkClient.submitTransaction(tx.toString());
     *
     * // Verify the transaction was successful
     * setTimeout(async () => {
     *  const transaction = await programManager.networkClient.getTransaction(tx.id());
     *  assert(transaction.id() === tx.id());
     * }, 10000);
     */
    async buildTransferPublicTransaction(params: {
        amount: number,
        recipient: string,
        priorityFee: number,
        privateKey?: PrivateKey,
        offlineQuery?: OfflineQuery,
    }): Promise<Transaction> {
        return this.buildTransferTransaction({
            ...params,
            transferType: "public",
            privateFee: false,
        });
    }

    /**
     * Build a transfer_public_as_signer transaction to transfer credits to another account for later submission to the Aleo network
     *
     * @param {Object} params
     * @param {number} params.amount The amount of credits to transfer
     * @param {string} params.recipient The recipient of the transfer
     * @param {number} params.priorityFee The optional priority fee to be paid for the transfer
     * @param {PrivateKey | undefined} [params.privateKey] Optional private key to use for the transfer transaction
     * @param {OfflineQuery | undefined} [params.offlineQuery] Optional offline query if creating transactions in an offline environment
     * @returns {Promise<Transaction>} The transaction object
     *
     * @example
     * /// Import the mainnet version of the sdk.
     * import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a new NetworkClient, KeyProvider, and RecordProvider
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider({ account, networkClient });
     * keyProvider.useCache(true);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for executions
     * const programManager = new ProgramManager({ host: "https://api.explorer.provable.com/v1", keyProvider, recordProvider });
     * const tx = await programManager.buildTransferPublicAsSignerTransaction({
     *     amount: 1,
     *     recipient: "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px",
     *     priorityFee: 0.2,
     * });
     * await programManager.networkClient.submitTransaction(tx.toString());
     *
     * // Verify the transaction was successful
     * setTimeout(async () => {
     *  const transaction = await programManager.networkClient.getTransaction(tx.id());
     *  assert(transaction.id() === tx.id());
     * }, 10000);
     */
    async buildTransferPublicAsSignerTransaction(params: {
        amount: number,
        recipient: string,
        priorityFee: number,
        privateKey?: PrivateKey,
        offlineQuery?: OfflineQuery,
    }): Promise<Transaction> {
        return this.buildTransferTransaction({
            ...params,
            transferType: "public",
            privateFee: false,
        });
    }

    /**
     * Transfer credits to another account
     *
     * @param {Object} params
     * @param {number} params.amount The amount of credits to transfer
     * @param {string} params.recipient The recipient of the transfer
     * @param {string} params.transferType The type of transfer to perform - options: 'private', 'privateToPublic', 'public', 'publicToPrivate'
     * @param {number} params.priorityFee The optional priority fee to be paid for the transfer
     * @param {boolean} params.privateFee Use a private record to pay the fee. If false this will use the account's public credit balance
     * @param {RecordSearchParams | undefined} [params.recordSearchParams] Optional parameters for finding the amount and fee records for the transfer transaction
     * @param {RecordPlaintext | string} [params.amountRecord] Optional amount record to use for the transfer
     * @param {RecordPlaintext | string} [params.feeRecord] Optional fee record to use for the transfer
     * @param {PrivateKey | undefined} [params.privateKey] Optional private key to use for the transfer transaction
     * @param {OfflineQuery | undefined} [params.offlineQuery] Optional offline query if creating transactions in an offline environment
     * @returns {Promise<string>} The transaction id
     *
     * @example
     * /// Import the mainnet version of the sdk.
     * import { AleoKeyProvider, ProgramManager, NetworkRecordProvider } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a new NetworkClient, KeyProvider, and RecordProvider
     * const keyProvider = new AleoKeyProvider();
     * const recordProvider = new NetworkRecordProvider({ account, networkClient });
     * keyProvider.useCache(true);
     *
     * // Initialize a program manager with the key provider to automatically fetch keys for executions
     * const programManager = new ProgramManager({ host: "https://api.explorer.provable.com/v1", keyProvider, recordProvider });
     * const tx_id = await programManager.transfer({
     *     amount: 1,
     *     recipient: "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px",
     *     transferType: "public",
     *     priorityFee: 0.2,
     *     privateFee: false,
     * });
     *
     * // Verify the transaction was successful
     * setTimeout(async () => {
     *  const transaction = await programManager.networkClient.getTransaction(tx_id);
     *  assert(transaction.id() === tx_id);
     * }, 10000);
     */
    async transfer(params: {
        amount: number,
        recipient: string,
        transferType: string,
        priorityFee: number,
        privateFee: boolean,
        recordSearchParams?: RecordSearchParams,
        amountRecord?: RecordPlaintext | string,
        feeRecord?: RecordPlaintext | string,
        privateKey?: PrivateKey,
        offlineQuery?: OfflineQuery,
    }): Promise<string> {
        const tx = <Transaction>(
            await this.buildTransferTransaction(params)
        );

        let feeAddress;

        if (typeof params.privateKey !== "undefined") {
            feeAddress = Address.from_private_key(params.privateKey);
        } else if (this.account !== undefined) {
            feeAddress = this.account?.address();
        } else {
            throw Error(
                "No private key provided and no private key set in the ProgramManager. Please set an account or provide a private key.",
            );
        }

        // Check if the account has sufficient credits to pay for the transaction
        await this.checkFee({
            address: feeAddress.to_string(),
            feeAmount: tx.feeAmount(),
        });

        return await this.networkClient.submitTransaction(tx);
    }

    /**
     * Build transaction to bond credits to a validator for later submission to the Aleo Network
     *
     * @param {Object} params
     * @param {string} params.validatorAddress Address of the validator to bond to, if this address is the same as the staker (i.e. the executor of this function), it will attempt to bond the credits as a validator. Bonding as a validator currently requires a minimum of 10,000,000 credits to bond (subject to change). If the address is specified is an existing validator and is different from the address of the executor of this function, it will bond the credits to that validator's staking committee as a delegator. A minimum of 10 credits is required to bond as a delegator.
     * @param {string} params.withdrawalAddress Address to withdraw the staked credits to when unbond_public is called.
     * @param {number} params.amount The amount of credits to bond
     * @param {Partial<ExecuteOptions>} [params.options] - Override default execution options.
     * @returns {Promise<Transaction>} The transaction object
     *
     * @example
     * // Import the mainnet version of the sdk.
     * import { AleoKeyProvider, ProgramManager } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a keyProvider to handle key management
     * const keyProvider = new AleoKeyProvider();
     * keyProvider.useCache(true);
     *
     * // Create a new ProgramManager with the key that will be used to bond credits
     * const programManager = new ProgramManager({ host: "https://api.explorer.provable.com/v1", keyProvider });
     * programManager.setAccount(new Account("YourPrivateKey"));
     *
     * // Create the bonding transaction object for later submission
     * const tx = await programManager.buildBondPublicTransaction({
     *     validatorAddress: "aleo1jx8s4dvjepculny4wfrzwyhs3tlyv65r58ns3g6q2gm2esh7ps8sqy9s5j",
     *     withdrawalAddress: "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px",
     *     amount: 2000000,
     * });
     *
     * // The transaction can be later submitted to the network using the network client.
     * await programManager.networkClient.submitTransaction(tx.toString());
     *
     * // Verify the transaction was successful
     * setTimeout(async () => {
     *  const transaction = await programManager.networkClient.getTransaction(tx.id());
     *  assert(transaction.id() === tx.id());
     * }, 10000);
     */
    async buildBondPublicTransaction(params: {
        validatorAddress: string,
        withdrawalAddress: string,
        amount: number,
        options: Partial<ExecuteOptions>,
    }) {
        const { validatorAddress, withdrawalAddress, amount, options = {} } = params;

        const scaledAmount = Math.trunc(amount * 1000000);

        const {
            programName = "credits.aleo",
            functionName = "bond_public",
            priorityFee = options.priorityFee || 0,
            privateFee = false,
            inputs = [
                validatorAddress,
                withdrawalAddress,
                `${scaledAmount.toString()}u64`,
            ],
            keySearchParams = new AleoKeyProviderParams({
                proverUri: CREDITS_PROGRAM_KEYS.bond_public.prover,
                verifierUri: CREDITS_PROGRAM_KEYS.bond_public.verifier,
                cacheKey: "credits.aleo/bond_public",
            }),
            program = this.creditsProgram(),
            ...additionalOptions
        } = options;

        const executeOptions: ExecuteOptions = {
            programName,
            functionName,
            priorityFee,
            privateFee,
            inputs,
            keySearchParams,
            ...additionalOptions,
        };

        return await this.buildExecutionTransaction(executeOptions);
    }

    /**
     * Bond credits to validator.
     *
     * @param {Object} params
     * @param {string} params.validatorAddress Address of the validator to bond to, if this address is the same as the signer (i.e. the executor of this function), it will attempt to bond the credits as a validator. Bonding as a validator currently requires a minimum of 1,000,000 credits to bond (subject to change). If the address is specified is an existing validator and is different from the address of the executor of this function, it will bond the credits to that validator's staking committee as a delegator. A minimum of 10 credits is required to bond as a delegator.
     * @param {string} params.withdrawalAddress Address to withdraw the staked credits to when unbond_public is called.
     * @param {number} params.amount The amount of credits to bond
     * @param {Options} [params.options] Options for the execution
     * @returns {Promise<string>} The transaction id
     *
     * @example
     * // Import the mainnet version of the sdk.
     * import { AleoKeyProvider, ProgramManager } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a keyProvider to handle key management
     * const keyProvider = new AleoKeyProvider();
     * keyProvider.useCache(true);
     *
     * // Create a new ProgramManager with the key that will be used to bond credits
     * const programManager = new ProgramManager({ host: "https://api.explorer.provable.com/v1", keyProvider });
     *
     * // Create the bonding transaction
     * tx_id = await programManager.bondPublic({
     *     validatorAddress: "aleo1jx8s4dvjepculny4wfrzwyhs3tlyv65r58ns3g6q2gm2esh7ps8sqy9s5j",
     *     withdrawalAddress: "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px",
     *     amount: 2000000,
     * });
     *
     * // Verify the transaction was successful
     * setTimeout(async () => {
     *  const transaction = await programManager.networkClient.getTransaction(tx_id);
     *  assert(transaction.id() === tx_id);
     * }, 10000);
     */
    async bondPublic(params: {
        validatorAddress: string,
        withdrawalAddress: string,
        amount: number,
        options: Partial<ExecuteOptions>,
    }) {
        const { options = {} } = params;

        const tx = <Transaction>(
            await this.buildBondPublicTransaction(params)
        );

        let feeAddress;

        if (typeof options.privateKey !== "undefined") {
            feeAddress = Address.from_private_key(options.privateKey);
        } else if (this.account !== undefined) {
            feeAddress = this.account?.address();
        } else {
            throw Error(
                "No private key provided and no private key set in the ProgramManager. Please set an account or provide a private key.",
            );
        }

        // Check if the account has sufficient credits to pay for the transaction
        await this.checkFee({
            address: feeAddress.to_string(),
            feeAmount: tx.feeAmount(),
        });

        return await this.networkClient.submitTransaction(tx);
    }

    /**
     * Build a bond_validator transaction for later submission to the Aleo Network.
     *
     * @param {Object} params
     * @param {string} params.validatorAddress Address of the validator to bond to, if this address is the same as the staker (i.e. the executor of this function), it will attempt to bond the credits as a validator. If the address is specified is an existing validator and is different from the address of the executor of this function, it will bond the credits to that validator's staking committee as a delegator.
     * @param {string} params.withdrawalAddress Address to withdraw the staked credits to when unbond_public is called.
     * @param {number} params.amount The amount of credits to bond. A minimum of 10000 credits is required to bond as a delegator.
     * @param {number} params.commission The commission rate for the validator (must be between 0 and 100 - an error will be thrown if it is not)
     * @param {Partial<ExecuteOptions>} [params.options] - Override default execution options.
     * @returns {Promise<Transaction>} The transaction object
     *
     * @example
     * // Import the mainnet version of the sdk.
     * import { AleoKeyProvider, ProgramManager } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a keyProvider to handle key management
     * const keyProvider = new AleoKeyProvider();
     * keyProvider.useCache(true);
     *
     * // Create a new ProgramManager with the key that will be used to bond credits
     * const programManager = new ProgramManager({ host: "https://api.explorer.provable.com/v1", keyProvider });
     * programManager.setAccount(new Account("YourPrivateKey"));
     *
     * // Create the bond validator transaction object for later use.
     * const tx = await programManager.buildBondValidatorTransaction({
     *     validatorAddress: "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px",
     *     withdrawalAddress: "aleo1feya8sjy9k2zflvl2dx39pdsq5tju28elnp2ektnn588uu9ghv8s84msv9",
     *     amount: 2000000,
     *     commission: 10,
     * });
     *
     * // The transaction can later be submitted to the network using the network client.
     * const tx_id = await programManager.networkClient.submitTransaction(tx.toString());
     *
     * // Verify the transaction was successful
     * setTimeout(async () => {
     *  const transaction = await programManager.networkClient.getTransaction(tx_id);
     *  assert(transaction.id() === tx_id);
     * }, 10000);
     */
    async buildBondValidatorTransaction(params: {
        validatorAddress: string,
        withdrawalAddress: string,
        amount: number,
        commission: number,
        options: Partial<ExecuteOptions>,
    }) {
        const { validatorAddress, withdrawalAddress, amount, commission, options } = params;

        const scaledAmount = Math.trunc(amount * 1000000);

        const adjustedCommission = Math.trunc(commission);

        const {
            programName = "credits.aleo",
            functionName = "bond_validator",
            priorityFee = options.priorityFee || 0,
            privateFee = false,
            inputs = [
                validatorAddress,
                withdrawalAddress,
                `${scaledAmount.toString()}u64`,
                `${adjustedCommission.toString()}u8`,
            ],
            keySearchParams = new AleoKeyProviderParams({
                proverUri: CREDITS_PROGRAM_KEYS.bond_validator.prover,
                verifierUri: CREDITS_PROGRAM_KEYS.bond_validator.verifier,
                cacheKey: "credits.aleo/bond_validator",
            }),
            program = this.creditsProgram(),
            ...additionalOptions
        } = options;

        const executeOptions: ExecuteOptions = {
            programName,
            functionName,
            priorityFee,
            privateFee,
            inputs,
            keySearchParams,
            ...additionalOptions,
        };

        return await this.buildExecutionTransaction(executeOptions);
    }

    /**
     * Build transaction to bond a validator.
     *
     * @param {Object} params
     * @param {string} params.validatorAddress Address of the validator to bond to, if this address is the same as the staker (i.e. the executor of this function), it will attempt to bond the credits as a validator. Bonding as a validator currently requires a minimum of 10,000,000 credits to bond (subject to change). If the address is specified is an existing validator and is different from the address of the executor of this function, it will bond the credits to that validator's staking committee as a delegator. A minimum of 10 credits is required to bond as a delegator.
     * @param {string} params.withdrawalAddress Address to withdraw the staked credits to when unbond_public is called.
     * @param {number} params.amount The amount of credits to bond
     * @param {number} params.commission The commission rate for the validator (must be between 0 and 100 - an error will be thrown if it is not)
     * @param {Partial<ExecuteOptions>} [params.options] - Override default execution options.
     * @returns {Promise<string>} The transaction id
     *
     * @example
     * // Import the mainnet version of the sdk.
     * import { AleoKeyProvider, ProgramManager } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a keyProvider to handle key management
     * const keyProvider = new AleoKeyProvider();
     * keyProvider.useCache(true);
     *
     * // Create a new ProgramManager with the key that will be used to bond credits
     * const programManager = new ProgramManager({ host: "https://api.explorer.provable.com/v1", keyProvider });
     * programManager.setAccount(new Account("YourPrivateKey"));
     *
     * // Create the bonding transaction
     * const tx_id = await programManager.bondValidator({
     *     validatorAddress: "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px",
     *     withdrawalAddress: "aleo1feya8sjy9k2zflvl2dx39pdsq5tju28elnp2ektnn588uu9ghv8s84msv9",
     *     amount: 2000000,
     * });
     *
     * // Verify the transaction was successful
     * setTimeout(async () => {
     *  const transaction = await programManager.networkClient.getTransaction(tx_id);
     *  assert(transaction.id() === tx_id);
     * }, 10000);
     */
    async bondValidator(params: {
        validatorAddress: string,
        withdrawalAddress: string,
        amount: number,
        commission: number,
        options: Partial<ExecuteOptions>,
    }) {
        const { options = {} } = params;

        const tx = <Transaction>(
            await this.buildBondValidatorTransaction(params)
        );

        let feeAddress;

        if (typeof options.privateKey !== "undefined") {
            feeAddress = Address.from_private_key(options.privateKey);
        } else if (this.account !== undefined) {
            feeAddress = this.account?.address();
        } else {
            throw Error(
                "No private key provided and no private key set in the ProgramManager. Please set an account or provide a private key.",
            );
        }

        // Check if the account has sufficient credits to pay for the transaction
        await this.checkFee({
            address: feeAddress.to_string(),
            feeAmount: tx.feeAmount(),
         });

        return await this.networkClient.submitTransaction(tx);
    }

    /**
     * Build an unbond_public execution transaction to unbond credits from a validator in the Aleo network.
     *
     * @param {Object} params
     * @param {string} params.stakerAddress - The address of the staker who is unbonding the credits.
     * @param {number} params.amount - The amount of credits to unbond (scaled by 1,000,000).
     * @param {Partial<ExecuteOptions>} [params.options] - Override default execution options.
     * @returns {Promise<Transaction>} - A promise that resolves to the transaction or an error message.
     *
     * @example
     * // Import the mainnet version of the sdk.
     * import { AleoKeyProvider, ProgramManager } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a keyProvider to handle key management.
     * const keyProvider = new AleoKeyProvider();
     * keyProvider.useCache(true);
     *
     * // Create a new ProgramManager with the key that will be used to unbond credits.
     * const programManager = new ProgramManager({ host: "https://api.explorer.provable.com/v1", keyProvider });
     * const tx = await programManager.buildUnbondPublicTransaction({
     *     stakerAddress: "aleo1jx8s4dvjepculny4wfrzwyhs3tlyv65r58ns3g6q2gm2esh7ps8sqy9s5j",
     *     amount: 2000000,
     * });
     *
     * // The transaction can be submitted later to the network using the network client.
     * programManager.networkClient.submitTransaction(tx.toString());
     *
     * // Verify the transaction was successful
     * setTimeout(async () => {
     *  const transaction = await programManager.networkClient.getTransaction(tx.id());
     *  assert(transaction.id() === tx.id());
     * }, 10000);
     */
    async buildUnbondPublicTransaction(params: {
        stakerAddress: string,
        amount: number,
        options: Partial<ExecuteOptions>,
    }): Promise<Transaction> {
        const { stakerAddress, amount, options = {} } = params;

        const scaledAmount = Math.trunc(amount * 1000000);

        const {
            programName = "credits.aleo",
            functionName = "unbond_public",
            priorityFee = options.priorityFee || 0,
            privateFee = false,
            inputs = [stakerAddress, `${scaledAmount.toString()}u64`],
            keySearchParams = new AleoKeyProviderParams({
                proverUri: CREDITS_PROGRAM_KEYS.unbond_public.prover,
                verifierUri: CREDITS_PROGRAM_KEYS.unbond_public.verifier,
                cacheKey: "credits.aleo/unbond_public",
            }),
            program = this.creditsProgram(),
            ...additionalOptions
        } = options;

        const executeOptions: ExecuteOptions = {
            programName,
            functionName,
            priorityFee,
            privateFee,
            inputs,
            keySearchParams,
            ...additionalOptions,
        };

        return this.buildExecutionTransaction(executeOptions);
    }

    /**
     * Unbond a specified amount of staked credits. If the address of the executor of this function is an existing
     * validator, it will subtract this amount of credits from the validator's staked credits. If there are less than
     * 1,000,000 credits staked pool after the unbond, the validator will be removed from the validator set. If the
     * address of the executor of this function is not a validator and has credits bonded as a delegator, it will
     * subtract this amount of credits from the delegator's staked credits. If there are less than 10 credits bonded
     * after the unbond operation, the delegator will be removed from the validator's staking pool.
     *
     * @param {Object} params
     * @param {string} params.stakerAddress Address of the staker who is unbonding the credits
     * @param {number} params.amount Amount of credits to unbond.
     * @param {ExecuteOptions} [params.options] Options for the execution
     * @returns {Promise<string>} The transaction id
     *
     * @example
     * // Import the mainnet version of the sdk.
     * import { AleoKeyProvider, ProgramManager } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a keyProvider to handle key management
     * const keyProvider = new AleoKeyProvider();
     * keyProvider.useCache(true);
     *
     * // Create a new ProgramManager with the key that will be used to bond credits
     * const programManager = new ProgramManager({ host: "https://api.explorer.provable.com/v1", keyProvider });
     * programManager.setAccount(new Account("YourPrivateKey"));
     *
     * // Create the unbond_public transaction and send it to the network
     * const tx_id = await programManager.unbondPublic({
     *     stakerAddress: "aleo1jx8s4dvjepculny4wfrzwyhs3tlyv65r58ns3g6q2gm2esh7ps8sqy9s5j",
     *     amount: 10,
     * });
     *
     * // Verify the transaction was successful
     * setTimeout(async () => {
     *  const transaction = await programManager.networkClient.getTransaction(tx_id);
     *  assert(transaction.id() === tx_id);
     * }, 10000);
     */
    async unbondPublic(params: {
        stakerAddress: string,
        amount: number,
        options: Partial<ExecuteOptions>,
    }): Promise<string> {
        const { options = {} } = params;

        const tx = <Transaction>(
            await this.buildUnbondPublicTransaction(params)
        );

        let feeAddress;

        if (typeof options.privateKey !== "undefined") {
            feeAddress = Address.from_private_key(options.privateKey);
        } else if (this.account !== undefined) {
            feeAddress = this.account?.address();
        } else {
            throw Error(
                "No private key provided and no private key set in the ProgramManager. Please set an account or provide a private key.",
            );
        }

        // Check if the account has sufficient credits to pay for the transaction
        await this.checkFee({
            address: feeAddress.to_string(),
            feeAmount: tx.feeAmount(),
        });

        return await this.networkClient.submitTransaction(tx);
    }

    /**
     * Build a transaction to claim unbonded public credits in the Aleo network.
     *
     * @param {Object} params
     * @param {string} params.stakerAddress - The address of the staker who is claiming the credits.
     * @param {Partial<ExecuteOptions>} [params.options] - Override default execution options.
     * @returns {Promise<Transaction>} - A promise that resolves to the transaction or an error message.
     *
     * @example
     * // Import the mainnet version of the sdk.
     * import { AleoKeyProvider, ProgramManager } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a keyProvider to handle key management
     * const keyProvider = new AleoKeyProvider();
     * keyProvider.useCache(true);
     *
     * // Create a new ProgramManager with the key that will be used to claim unbonded credits.
     * const programManager = new ProgramManager({ host: "https://api.explorer.provable.com/v1", keyProvider });
     *
     * // Create the claim_unbond_public transaction object for later use.
     * const tx = await programManager.buildClaimUnbondPublicTransaction({
     *     stakerAddress: "aleo1jx8s4dvjepculny4wfrzwyhs3tlyv65r58ns3g6q2gm2esh7ps8sqy9s5j",
     * });
     *
     * // The transaction can be submitted later to the network using the network client.
     * programManager.networkClient.submitTransaction(tx.toString());
     *
     * // Verify the transaction was successful
     * setTimeout(async () => {
     *  const transaction = await programManager.networkClient.getTransaction(tx.id());
     *  assert(transaction.id() === tx.id());
     * }, 10000);
     */
    async buildClaimUnbondPublicTransaction(params: {
        stakerAddress: string,
        options: Partial<ExecuteOptions>,
    }): Promise<Transaction> {
        const { stakerAddress, options = {} } = params;

        const {
            programName = "credits.aleo",
            functionName = "claim_unbond_public",
            priorityFee = options.priorityFee || 0,
            privateFee = false,
            inputs = [stakerAddress],
            keySearchParams = new AleoKeyProviderParams({
                proverUri: CREDITS_PROGRAM_KEYS.claim_unbond_public.prover,
                verifierUri: CREDITS_PROGRAM_KEYS.claim_unbond_public.verifier,
                cacheKey: "credits.aleo/claim_unbond_public",
            }),
            program = this.creditsProgram(),
            ...additionalOptions
        } = options;

        const executeOptions: ExecuteOptions = {
            programName,
            functionName,
            priorityFee,
            privateFee,
            inputs,
            keySearchParams,
            ...additionalOptions,
        };

        // Check if the account has sufficient credits to pay for the transaction
        return await this.buildExecutionTransaction(executeOptions);
    }

    /**
     * Claim unbonded credits. If credits have been unbonded by the account executing this function, this method will
     * claim them and add them to the public balance of the account.
     *
     * @param {Object} params
     * @param {string} params.stakerAddress Address of the staker who is claiming the credits
     * @param {ExecuteOptions} [params.options]
     * @returns {Promise<string>} The transaction id
     *
     * @example
     * // Import the mainnet version of the sdk.
     * import { AleoKeyProvider, ProgramManager } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a keyProvider to handle key management
     * const keyProvider = new AleoKeyProvider();
     * keyProvider.useCache(true);
     *
     * // Create a new ProgramManager with the key that will be used to bond credits
     * const programManager = new ProgramManager({ host: "https://api.explorer.provable.com/v1", keyProvider });
     * programManager.setAccount(new Account("YourPrivateKey"));
     *
     * // Create the claim_unbond_public transaction
     * const tx_id = await programManager.claimUnbondPublic({
     *     stakerAddress: "aleo1jx8s4dvjepculny4wfrzwyhs3tlyv65r58ns3g6q2gm2esh7ps8sqy9s5j",
     * });
     *
     * // Verify the transaction was successful
     * setTimeout(async () => {
     *  const transaction = await programManager.networkClient.getTransaction(tx_id);
     *  assert(transaction.id() === tx_id);
     * }, 10000);
     */
    async claimUnbondPublic(params: {
        stakerAddress: string,
        options: Partial<ExecuteOptions>,
    }): Promise<string> {
        const { options = {} } = params;

        const tx = <Transaction>(
            await this.buildClaimUnbondPublicTransaction(params)
        );

        let feeAddress;

        if (typeof options.privateKey !== "undefined") {
            feeAddress = Address.from_private_key(options.privateKey);
        } else if (this.account !== undefined) {
            feeAddress = this.account?.address();
        } else {
            throw Error(
                "No private key provided and no private key set in the ProgramManager. Please set an account or provide a private key.",
            );
        }

        // Check if the account has sufficient credits to pay for the transaction
        await this.checkFee({
            address: feeAddress.to_string(),
            feeAmount: tx.feeAmount(),
        });

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
     * @param {Object} params
     * @param {boolean} params.validatorState
     * @param {Partial<ExecuteOptions>} [params.options] - Override default execution options
     * @returns {Promise<Transaction>} The transaction object
     *
     * @example
     * // Import the mainnet version of the sdk.
     * import { AleoKeyProvider, ProgramManager } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a keyProvider to handle key management
     * const keyProvider = new AleoKeyProvider();
     * keyProvider.useCache(true);
     *
     * // Create a new ProgramManager with the key that will be used to bond credits
     * const programManager = new ProgramManager({ host: "https://api.explorer.provable.com/v1", keyProvider });
     *
     * // Create the set_validator_state transaction
     * const tx = await programManager.buildSetValidatorStateTransaction({
     *     validatorState: true,
     * });
     *
     * // The transaction can be submitted later to the network using the network client.
     * programManager.networkClient.submitTransaction(tx.toString());
     *
     * // Verify the transaction was successful
     * setTimeout(async () => {
     *  const transaction = await programManager.networkClient.getTransaction(tx.id());
     *  assert(transaction.id() === tx.id());
     * }, 10000);
     */
    async buildSetValidatorStateTransaction(params: {
        validatorState: boolean,
        options: Partial<ExecuteOptions>,
    }): Promise<Transaction> {
        const { validatorState, options = {} } = params;

        const {
            programName = "credits.aleo",
            functionName = "set_validator_state",
            priorityFee = 0,
            privateFee = false,
            inputs = [validatorState.toString()],
            keySearchParams = new AleoKeyProviderParams({
                proverUri: CREDITS_PROGRAM_KEYS.set_validator_state.prover,
                verifierUri: CREDITS_PROGRAM_KEYS.set_validator_state.verifier,
                cacheKey: "credits.aleo/set_validator_state",
            }),
            ...additionalOptions
        } = options;

        const executeOptions: ExecuteOptions = {
            programName,
            functionName,
            priorityFee,
            privateFee,
            inputs,
            keySearchParams,
            ...additionalOptions,
        };

        return await this.buildExecutionTransaction(executeOptions);
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
     * @param {Object} params
     * @param {boolean} params.validatorState
     * @param {Partial<ExecuteOptions>} [params.options] - Override default execution options
     * @returns {Promise<string>} The transaction id
     *
     * @example
     * // Import the mainnet version of the sdk.
     * import { AleoKeyProvider, ProgramManager } from "@provablehq/sdk/mainnet.js";
     *
     * // Create a keyProvider to handle key management
     * const keyProvider = new AleoKeyProvider();
     * keyProvider.useCache(true);
     *
     * // Create a new ProgramManager with the key that will be used to bond credits
     * const programManager = new ProgramManager({ host: "https://api.explorer.provable.com/v1", keyProvider });
     *
     * // Create the set_validator_state transaction
     * const tx_id = await programManager.setValidatorState({
     *     validatorState: true,
     * });
     *
     * // Verify the transaction was successful
     * setTimeout(async () => {
     *  const transaction = await programManager.networkClient.getTransaction(tx_id);
     *  assert(transaction.id() === tx_id);
     * }, 10000);
     */
    async setValidatorState(params: {
        validatorState: boolean,
        options: Partial<ExecuteOptions>,
    }) {
        const { options = {} } = params;

        const tx = <Transaction>(
            await this.buildSetValidatorStateTransaction(params)
        );

        let feeAddress;

        if (typeof options.privateKey !== "undefined") {
            feeAddress = Address.from_private_key(options.privateKey);
        } else if (this.account !== undefined) {
            feeAddress = this.account?.address();
        } else {
            throw Error(
                "No private key provided and no private key set in the ProgramManager. Please set an account or provide a private key.",
            );
        }

        // Check if the account has sufficient credits to pay for the transaction
        await this.checkFee({
            address: feeAddress.to_string(),
            feeAmount: tx.feeAmount(),
        });

        return this.networkClient.submitTransaction(tx);
    }

    /**
     * Verify a proof from an offline execution. This is useful when it is desired to do offchain proving and verification.
     *
     * @param {Object} params
     * @param {executionResponse} params.executionResponse The response from an offline function execution (via the `programManager.run` method)
     * @param {blockHeight} params.blockHeight The ledger height when the execution was generated.
     * @param {ImportedPrograms} [params.imports] The imported programs used in the execution. Specified as { "programName": "programSourceCode", ... }
     * @param {ImportedVerifyingKeys} [params.importedVerifyingKeys] The verifying keys in the execution. Specified as { "programName": [["functionName", "verifyingKey"], ...], ... }
     * @returns {boolean} True if the proof is valid, false otherwise
     *
     * @example
     * /// Import the mainnet version of the sdk used to build executions.
     * import { Account, ProgramManager } from "@provablehq/sdk/mainnet.js";
     *
     * /// Create the source for two programs.
     * const program = "import add_it_up.aleo; \n\n program mul_add.aleo;\n\nfunction mul_and_add:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    mul r0 r1 into r2;\n call add_it_up.aleo/add_it r1 r2 into r3;  output r3 as u32.private;\n";
     * const program_import = "program add_it_up.aleo;\n\nfunction add_it:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n";
     * const programManager = new ProgramManager();
     *
     * /// Create a temporary account for the execution of the program
     * const account = Account.fromCipherText(process.env.ciphertext, process.env.password);
     * programManager.setAccount(account);
     *
     * /// Get the response and ensure that the program executed correctly
     * const executionResponse = await programManager.run({
     *     program,
     *     functionName: "mul_and_add",
     *     inputs: ["5u32", "5u32"],
     *     proveExecution: true,
     * });
     *
     * /// Construct the imports and verifying keys
     * const imports = { "add_it_up.aleo": program_import };
     * const importedVerifyingKeys = { "add_it_up.aleo": [["add_it", "verifyingKey1..."]] };
     *
     * /// Verify the execution.
     * const blockHeight = 9000000;
     * const isValid = programManager.verifyExecution({ executionResponse, blockHeight, imports, importedVerifyingKeys });
     * assert(isValid);
     */
    verifyExecution(params: {
        executionResponse: ExecutionResponse,
        blockHeight: number,
        imports?: ImportedPrograms,
        importedVerifyingKeys?: ImportedVerifyingKeys,
    }): boolean {
        const { executionResponse, blockHeight, imports, importedVerifyingKeys } = params;

        try {
            const execution = <FunctionExecution>(
                executionResponse.getExecution()
            );
            const function_id = executionResponse.getFunctionId();
            const program = executionResponse.getProgram();
            const verifyingKey = executionResponse.getVerifyingKey();
            return verifyFunctionExecution(
                execution,
                verifyingKey,
                program,
                function_id,
                imports,
                importedVerifyingKeys,
                blockHeight
            );
        } catch (e) {
            console.warn(
                `The execution was not found in the response, cannot verify the execution: ${e}`,
            );
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
    async getCreditsRecord(options: {
        amount: number,
        nonces: string[],
        record?: RecordPlaintext | string,
        params?: RecordSearchParams,
    }): Promise<RecordPlaintext> {
        const { amount, nonces, record, params } = options;

        try {
            return record instanceof RecordPlaintext
                ? record
                : RecordPlaintext.fromString(<string>record);
        } catch (e) {
            try {
                const recordProvider = <RecordProvider>this.recordProvider;
                return <RecordPlaintext>(
                    await recordProvider.findCreditsRecord({
                        microcredits: amount,
                        unspent: true,
                        nonces,
                        searchParameters: params,
                    })
                );
            } catch (e: any) {
                logAndThrow(
                    `Error finding fee record. Record finder response: '${e.message}'. Please ensure you're connected to a valid Aleo network and a record with enough balance exists.`,
                );
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
    return VALID_TRANSFER_TYPES.has(transferType)
        ? transferType
        : logAndThrow(
            `Invalid transfer type '${transferType}'. Valid transfer types are 'private', 'privateToPublic', 'public', and 'publicToPrivate'.`,
        );
}

export { ProgramManager, AuthorizationOptions, FeeAuthorizationOptions, ExecuteOptions, ProvingRequestOptions };
